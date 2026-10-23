"""Thin wrapper around the Anthropic SDK for YouTube Scout.

- Prompt caching on the system block (ephemeral cache_control) when cache=True
- Schema-enforced responses via pydantic — retries once on schema failure
- Retries once on 5xx / rate-limit errors via tenacity
- Returns CostInfo (token counts + USD) so the orchestrator can enforce caps
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from typing import Any, TypeVar

import anthropic
from anthropic import APIStatusError, APIConnectionError, RateLimitError
from pydantic import BaseModel, ValidationError
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)


logger = logging.getLogger("ad_recon")

T = TypeVar("T", bound=BaseModel)


# ---------------------------------------------------------------------------
# Pricing (USD per 1M tokens) — keep in sync with config.yaml model_routing
# ---------------------------------------------------------------------------

MODEL_PRICING: dict[str, dict[str, float]] = {
    "claude-haiku-4-5": {
        "input": 1.00,
        "output": 5.00,
        "cache_read": 0.10,
        "cache_write": 1.25,
    },
    "claude-sonnet-4-6": {
        "input": 3.00,
        "output": 15.00,
        "cache_read": 0.30,
        "cache_write": 3.75,
    },
}


@dataclass
class CostInfo:
    model: str
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0
    cost_usd: float = 0.0

    @classmethod
    def from_usage(cls, model: str, usage: Any) -> "CostInfo":
        pricing = MODEL_PRICING.get(model)
        if pricing is None:
            logger.warning("No pricing for model %s; cost will be $0", model)
            pricing = {"input": 0, "output": 0, "cache_read": 0, "cache_write": 0}

        input_tokens = getattr(usage, "input_tokens", 0) or 0
        output_tokens = getattr(usage, "output_tokens", 0) or 0
        cache_read = getattr(usage, "cache_read_input_tokens", 0) or 0
        cache_write = getattr(usage, "cache_creation_input_tokens", 0) or 0

        cost = (
            (input_tokens / 1_000_000) * pricing["input"]
            + (output_tokens / 1_000_000) * pricing["output"]
            + (cache_read / 1_000_000) * pricing["cache_read"]
            + (cache_write / 1_000_000) * pricing["cache_write"]
        )
        return cls(
            model=model,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            cache_read_tokens=cache_read,
            cache_write_tokens=cache_write,
            cost_usd=round(cost, 6),
        )

    def __add__(self, other: "CostInfo") -> "CostInfo":
        return CostInfo(
            model=other.model or self.model,
            input_tokens=self.input_tokens + other.input_tokens,
            output_tokens=self.output_tokens + other.output_tokens,
            cache_read_tokens=self.cache_read_tokens + other.cache_read_tokens,
            cache_write_tokens=self.cache_write_tokens + other.cache_write_tokens,
            cost_usd=round(self.cost_usd + other.cost_usd, 6),
        )


# ---------------------------------------------------------------------------
# JSON extraction helper
# ---------------------------------------------------------------------------

_JSON_BLOCK_RE = re.compile(r"\{.*\}", re.DOTALL)


def _extract_json(text: str) -> str:
    """Pull the first balanced JSON object from a model response."""
    fence_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fence_match:
        return fence_match.group(1)
    m = _JSON_BLOCK_RE.search(text)
    if m:
        return m.group(0)
    return text.strip()


def _schema_hint(schema: type[BaseModel]) -> str:
    """Inject the actual JSON Schema (field names + enums) so the model knows
    the exact contract. Without this the model guesses field names ('type' vs
    'proof_type') and enum values ('moderate' vs 'weak') and fails validation.
    """
    js = json.dumps(schema.model_json_schema(), separators=(",", ":"))
    return (
        "Respond with ONLY a single valid JSON object that conforms to this "
        "JSON Schema. Use the EXACT field names. For any field that lists an "
        "`enum`, the value MUST be one of those strings verbatim. Resolve "
        "$ref/$defs. No markdown fences, no prose — JSON object only.\n"
        f"SCHEMA:\n{js}"
    )


# ---------------------------------------------------------------------------
# Retry config
# ---------------------------------------------------------------------------

_RETRYABLE = (APIStatusError, APIConnectionError, RateLimitError)


class SchemaRetryFailed(Exception):
    """Raised when the second parse attempt also fails. Per per-video error
    policy, caller should skip this video and continue.
    """


# ---------------------------------------------------------------------------
# Client
# ---------------------------------------------------------------------------

class AnthropicClient:
    """Thin wrapper around anthropic.Anthropic."""

    def __init__(self, api_key: str | None = None):
        key = api_key or os.environ.get("ANTHROPIC_API_KEY")
        if not key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY not set — add it to .env before running"
            )
        self._client = anthropic.Anthropic(api_key=key)

    @retry(
        retry=retry_if_exception_type(_RETRYABLE),
        stop=stop_after_attempt(2),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    def _create(
        self,
        *,
        model: str,
        system_blocks: list[dict],
        user: str,
        max_tokens: int,
    ) -> Any:
        return self._client.messages.create(
            model=model,
            max_tokens=max_tokens,
            system=system_blocks,
            messages=[{"role": "user", "content": user}],
        )

    def call(
        self,
        model: str,
        system: str,
        user: str,
        schema: type[T] | None = None,
        cache: bool = True,
        max_tokens: int = 2000,
    ) -> tuple[T | str, CostInfo]:
        """Invoke the model. If `schema` provided, validates + retries once
        on schema failure. Returns (parsed_or_text, cost_info).
        """
        if cache:
            system_blocks = [{
                "type": "text",
                "text": system,
                "cache_control": {"type": "ephemeral"},
            }]
        else:
            system_blocks = [{"type": "text", "text": system}]

        effective_user = user
        if schema is not None:
            effective_user = f"{user}\n\n{_schema_hint(schema)}"

        response = self._create(
            model=model,
            system_blocks=system_blocks,
            user=effective_user,
            max_tokens=max_tokens,
        )
        cost = CostInfo.from_usage(model, response.usage)

        text = "\n".join(
            block.text for block in response.content
            if getattr(block, "type", None) == "text"
        ).strip()

        if schema is None:
            return text, cost

        parsed, parse_cost = self._parse_with_retry(
            model=model,
            system_blocks=system_blocks,
            user=effective_user,
            max_tokens=max_tokens,
            raw_text=text,
            schema=schema,
        )
        return parsed, cost + parse_cost

    def call_vision(
        self,
        model: str,
        system: str,
        user_text: str,
        image_paths: list,
        schema: type[T] | None = None,
        max_tokens: int = 3000,
    ) -> tuple[T | str, CostInfo]:
        """Like call(), but with images — used for OCR + frame-by-frame
        deconstruction. Reuses schema-retry + cost tracking.
        """
        import base64
        import mimetypes

        content: list[dict] = []
        for p in image_paths[:20]:  # cap images per call
            try:
                data = base64.standard_b64encode(open(p, "rb").read()).decode()
            except OSError:
                continue
            media = mimetypes.guess_type(str(p))[0] or "image/jpeg"
            content.append({
                "type": "image",
                "source": {"type": "base64", "media_type": media, "data": data},
            })
        effective = user_text
        if schema is not None:
            effective += "\n\n" + _schema_hint(schema)
        content.append({"type": "text", "text": effective})

        system_blocks = [{"type": "text", "text": system}]
        response = self._client.messages.create(
            model=model, max_tokens=max_tokens, system=system_blocks,
            messages=[{"role": "user", "content": content}],
        )
        cost = CostInfo.from_usage(model, response.usage)
        text = "\n".join(
            b.text for b in response.content if getattr(b, "type", None) == "text"
        ).strip()
        if schema is None:
            return text, cost
        parsed, parse_cost = self._parse_with_retry(
            model=model, system_blocks=system_blocks, user=effective,
            max_tokens=max_tokens, raw_text=text, schema=schema,
        )
        return parsed, cost + parse_cost

    def _parse_with_retry(
        self,
        *,
        model: str,
        system_blocks: list[dict],
        user: str,
        max_tokens: int,
        raw_text: str,
        schema: type[T],
    ) -> tuple[T, CostInfo]:
        """Parse raw_text; on failure, ask the model to fix it (one retry)."""
        zero_cost = CostInfo(model=model)
        try:
            payload = _extract_json(raw_text)
            return schema.model_validate_json(payload), zero_cost
        except (ValidationError, json.JSONDecodeError, ValueError) as e:
            logger.warning(
                "Schema %s parse failed (%s). Retrying once.",
                schema.__name__,
                type(e).__name__,
            )

        fix_prompt = (
            f"{user}\n\n"
            f"Your previous response failed to parse against schema "
            f"{schema.__name__}. Previous response was:\n---\n"
            f"{raw_text[:4000]}\n---\n"
            "Emit ONLY valid JSON matching the schema. No prose."
        )
        response = self._create(
            model=model,
            system_blocks=system_blocks,
            user=fix_prompt,
            max_tokens=max_tokens,
        )
        retry_cost = CostInfo.from_usage(model, response.usage)
        retry_text = "\n".join(
            block.text for block in response.content
            if getattr(block, "type", None) == "text"
        ).strip()
        try:
            payload = _extract_json(retry_text)
            return schema.model_validate_json(payload), retry_cost
        except (ValidationError, json.JSONDecodeError, ValueError) as e:
            raise SchemaRetryFailed(
                f"Schema {schema.__name__} validation failed twice: {e}"
            ) from e
