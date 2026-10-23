"""Runtime counsel gate — persona-mode counsel review inside Python.

Generic over the two gates (config: counsel_gates.gate_a / gate_b). Each member
is a persona system prompt at counsel/<slug>.md; reviews run concurrently
(asyncio + to_thread around the sync SDK). Cheaper than agent-mode (~1 Sonnet
call per member, one batch) — the right call for a runtime gate per the build
review.

Returns (reviews, avg_score, cost). The caller decides what to do with a low
score (Gate A annotates the ranking; Gate B drives the retry/low-fidelity
disposition).
"""

from __future__ import annotations

import asyncio
import logging
from pathlib import Path

from scripts.lib.anthropic_client import AnthropicClient, CostInfo
from scripts.lib.schemas import CounselNPCReview

SKILL_ROOT = Path(__file__).resolve().parent.parent
COUNSEL_DIR = SKILL_ROOT / "counsel"
logger = logging.getLogger("ad_recon")


async def _review_one(
    client: AnthropicClient,
    member: dict,
    model: str,
    max_tokens: int,
    user_prompt: str,
) -> tuple[CounselNPCReview, CostInfo]:
    slug = member["slug"]
    prompt_path = COUNSEL_DIR / f"{slug}.md"
    if not prompt_path.exists():
        raise FileNotFoundError(f"Missing counsel persona prompt: {prompt_path}")
    system = prompt_path.read_text(encoding="utf-8")
    logger.info("Gate review: %s (%s)", member["name"], slug)
    result = await asyncio.to_thread(
        client.call,
        model=model,
        system=system,
        user=user_prompt,
        schema=CounselNPCReview,
        cache=True,
        max_tokens=max_tokens,
    )
    return result  # type: ignore[return-value]


async def _run_async(
    client: AnthropicClient,
    members: list[dict],
    model: str,
    max_tokens: int,
    user_prompt: str,
) -> list[tuple[CounselNPCReview, CostInfo]]:
    return await asyncio.gather(*[
        _review_one(client, m, model, max_tokens, user_prompt) for m in members
    ])


def run_gate(
    gate_cfg: dict,
    model_cfg: dict,
    user_prompt: str,
    client: AnthropicClient | None = None,
) -> tuple[list[CounselNPCReview], float, CostInfo]:
    """Run one counsel gate. `user_prompt` should already fence any untrusted
    ad text via SafetyGuard.fence_untrusted_content.
    """
    members = gate_cfg.get("members", [])
    if not members:
        raise RuntimeError(f"Gate {gate_cfg.get('name')!r} has no members")
    model = model_cfg.get("model", "claude-sonnet-4-6")
    max_tokens = int(model_cfg.get("max_output_tokens", 1500))

    if client is None:
        client = AnthropicClient()

    results = asyncio.run(_run_async(client, members, model, max_tokens, user_prompt))
    reviews = [r for r, _ in results]
    cost = CostInfo(model=model)
    for _, c in results:
        cost = cost + c
    avg = sum(r.score for r in reviews) / len(reviews) if reviews else 0.0
    return reviews, round(avg, 2), cost
