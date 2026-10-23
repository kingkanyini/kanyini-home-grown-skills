"""Scroll-stop scoring for the cheap scan-all tier.

Tiering means scan-all must stay cheap — so we do NOT run Vision on 60 ads'
first frames here (that needs downloads). Instead we derive a provisional
scroll-stop from cheap signals the scraper already has. The full Vision rubric
(first frame + first 3s) runs only on the picked winners during Study, where the
creative is downloaded anyway, and refines these numbers.

Rubric ceilings come from config (scoring.scroll_stop_rubric) for determinism.
"""

from __future__ import annotations

import re

from scripts.lib.schemas import ScrapedAd, ScrollStop

_HOOK_MARKERS = re.compile(
    r"\b(how|why|what|stop|warning|secret|finally|nobody|the truth|pov|watch)\b",
    re.IGNORECASE,
)


def heuristic_scroll_stop(ad: ScrapedAd) -> ScrollStop:
    """Cheap provisional scroll-stop from metadata. Deterministic.

    motion: video implies movement; text-only static.
    text_hook: hook-marker words in the primary text / headline.
    face/pattern_interrupt: not knowable without pixels → conservative 0/1.
    """
    blob = " ".join(filter(None, [ad.headline or "", ad.primary_text or ""]))
    motion = 2 if ad.is_video else 0
    text_hook = 0
    if blob:
        hits = len(_HOOK_MARKERS.findall(blob))
        text_hook = min(3, hits)
    pattern_interrupt = 1 if (ad.is_video and text_hook >= 2) else 0
    return ScrollStop(
        motion=motion,
        face=0,                 # unknown without pixels — refined in Study
        text_hook=text_hook,
        pattern_interrupt=pattern_interrupt,
    )
