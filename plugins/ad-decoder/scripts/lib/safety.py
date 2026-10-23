"""Safety guardrails for Ad Recon — enforced at runtime.

Every external side effect (vault write, cost spend, scrape request) MUST pass
through a SafetyGuard method. If a guard raises, the caller skips or aborts —
do NOT catch these and continue silently.

Lifted from youtube-scout/safety.py; Gmail guards removed (no send surface),
scraping guards added (rate-limit/backoff + captcha-detect) per the Ad Recon
Triple Threat review.
"""

from __future__ import annotations

import random
import re
import time
from pathlib import Path


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class SafetyViolation(Exception):
    """Raised when a safety guard refuses an operation."""


class BudgetExceeded(Exception):
    """Raised when the per-run cost cap is exceeded."""


class ScrapeBlocked(Exception):
    """Raised when the Ad Library blocks us (captcha / hard block).

    The caller MUST catch this, write a partial ``status: fetched`` run-state,
    and surface 'blocked, retry later' — never crash, never silent-empty.
    """


# ---------------------------------------------------------------------------
# Guard class
# ---------------------------------------------------------------------------

_SLUG_STRIP_CHARS = re.compile(r"[\x00-\x1f\x7f/\\]")
_SLUG_DOUBLEDOT = re.compile(r"\.\.+")
_SLUG_MULTI_DASH = re.compile(r"-{2,}")

# Strings that, if seen in page text/url, mean Meta is challenging us.
_CAPTCHA_MARKERS = (
    "/checkpoint/",
    "captcha",
    "are you a robot",
    "confirm you're a human",
    "temporarily blocked",
    "unusual activity",
)


class SafetyGuard:
    """Stateless guard. Accepts config values at call time so callers cannot
    drift from config.yaml.
    """

    # -----------------------------------------------------------------
    # Vault path + slug
    # -----------------------------------------------------------------

    @staticmethod
    def enforce_vault_path(
        path: Path,
        vault_root: Path,
        allowed_prefixes: list[str],
    ) -> None:
        """Refuse writes outside {vault_root}/{allowed_prefix}."""
        try:
            resolved = path.resolve()
            root_resolved = vault_root.resolve()
        except (OSError, RuntimeError) as e:
            raise SafetyViolation(f"Cannot resolve path {path}: {e}") from e

        try:
            rel = resolved.relative_to(root_resolved)
        except ValueError as e:
            raise SafetyViolation(
                f"Path {resolved} is outside vault root {root_resolved}"
            ) from e

        rel_str = str(rel).replace("\\", "/")
        if not any(
            rel_str.startswith(p.rstrip("/") + "/") or rel_str == p.rstrip("/")
            for p in allowed_prefixes
        ):
            raise SafetyViolation(
                f"Path {rel_str} not under allowed prefixes {allowed_prefixes}"
            )

    @staticmethod
    def enforce_slug(slug: str, max_length: int = 80) -> str:
        """Strip dangerous chars + truncate. Returns the sanitized slug."""
        if not slug:
            raise SafetyViolation("Empty slug")
        cleaned = _SLUG_STRIP_CHARS.sub("", slug)
        cleaned = _SLUG_DOUBLEDOT.sub("", cleaned)
        cleaned = re.sub(r"\s+", "-", cleaned.strip()).lower()
        cleaned = re.sub(r"[^a-z0-9\-_.]", "", cleaned)
        cleaned = _SLUG_MULTI_DASH.sub("-", cleaned).strip("-._")
        cleaned = cleaned[:max_length]
        if not cleaned:
            raise SafetyViolation("Slug reduced to empty after sanitization")
        return cleaned

    # -----------------------------------------------------------------
    # Cost cap
    # -----------------------------------------------------------------

    @staticmethod
    def check_cost_budget(current_usd: float, cap_usd: float) -> None:
        if current_usd > cap_usd:
            raise BudgetExceeded(
                f"Cost ${current_usd:.4f} exceeds per-run cap ${cap_usd:.2f}"
            )

    # -----------------------------------------------------------------
    # Scraping guards (net-new for Ad Recon)
    # -----------------------------------------------------------------

    @staticmethod
    def polite_delay(min_seconds: float, max_seconds: float) -> None:
        """Human-paced jittered delay between scrape requests. Low volume,
        real browser session — we are researching the landscape, not hammering.
        """
        lo = max(0.0, float(min_seconds))
        hi = max(lo, float(max_seconds))
        time.sleep(random.uniform(lo, hi))

    @staticmethod
    def backoff_delay(attempt: int, base_seconds: float = 4.0,
                      cap_seconds: float = 120.0) -> None:
        """Exponential backoff with jitter after a transient scrape failure."""
        delay = min(cap_seconds, base_seconds * (2 ** max(0, attempt)))
        time.sleep(delay * (0.5 + random.random() / 2))

    @staticmethod
    def detect_block(page_url: str, page_text: str) -> None:
        """Raise ScrapeBlocked if the page looks like a captcha / hard block.

        Caller catches this, persists partial run-state, surfaces retry-later.
        """
        haystack = f"{(page_url or '').lower()} {(page_text or '').lower()[:4000]}"
        for marker in _CAPTCHA_MARKERS:
            if marker in haystack:
                raise ScrapeBlocked(
                    f"Ad Library challenged the session (marker: {marker!r}). "
                    "Run halted; partial state saved. Retry later."
                )

    # -----------------------------------------------------------------
    # Untrusted content fencing (prompt-injection defense)
    # -----------------------------------------------------------------

    @staticmethod
    def fence_untrusted_content(content: str, source_id: str) -> str:
        """Wrap scraped ad text in a tagged fence so the model treats it as
        data, not instructions. Ad copy is attacker-controllable.
        """
        safe_inner = content.replace(
            "</untrusted_ad_content>",
            "</untrusted_ad_content_ESCAPED>",
        )
        safe_source = re.sub(r"[^a-zA-Z0-9_\-@.]", "", source_id or "")[:64]
        return (
            f'<untrusted_ad_content source="{safe_source}">\n'
            f"{safe_inner}\n"
            f"</untrusted_ad_content>"
        )
