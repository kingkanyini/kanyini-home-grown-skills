"""Commonality synthesis — turn N deconstruction cards into a winning formula.

For each dimension: modal value + %. Confidence floor (Georgi): a modal value
below `confidence_floor_pct` of the post-Gate-B sample is marked low_confidence
and suppressed from the headline winning formula. Only pass-fidelity cards count.
"""

from __future__ import annotations

from collections import Counter

from scripts.lib.schemas import CommonalityRow, DeconstructionCard, WinningFormula

# (dimension label, accessor) — enum fields that tally cleanly.
_DIMENSIONS = [
    ("hook_type", lambda c: c.hook_type),
    ("pacing", lambda c: c.pacing),
    ("audio_choice", lambda c: c.audio_choice),
    ("narrative_structure", lambda c: c.narrative_structure),
    ("cta_placement", lambda c: c.cta_placement),
    ("cta_variant", lambda c: c.cta_variant),
    ("awareness_level", lambda c: c.awareness_level),
    ("subtext_belief_shift", lambda c: c.subtext_belief_shift),
    ("dominant_proof", lambda c: (c.proof[0].proof_type if c.proof else "none")),
]


def synthesize(cards: list[DeconstructionCard], confidence_floor_pct: float,
               rejected_count: int = 0) -> WinningFormula:
    passing = [c for c in cards if c.fidelity == "pass"]
    n = len(passing)
    rows: list[CommonalityRow] = []
    if n:
        for label, acc in _DIMENSIONS:
            counts = Counter(str(acc(c)) for c in passing)
            value, hits = counts.most_common(1)[0]
            pct = round(100.0 * hits / n, 1)
            rows.append(CommonalityRow(
                dimension=label, modal_value=value, pct=pct,
                low_confidence=pct < confidence_floor_pct,
            ))
        # NESB tally as a single row (share of cards firing each tag).
        for tag, acc in [
            ("nesb_new", lambda c: c.nesb_new), ("nesb_easy", lambda c: c.nesb_easy),
            ("nesb_safe", lambda c: c.nesb_safe), ("nesb_big", lambda c: c.nesb_big),
        ]:
            hits = sum(1 for c in passing if acc(c))
            pct = round(100.0 * hits / n, 1)
            rows.append(CommonalityRow(
                dimension=tag, modal_value="present" if hits else "absent",
                pct=pct, low_confidence=pct < confidence_floor_pct,
            ))
    return WinningFormula(sample_size=n, rejected_count=rejected_count, rows=rows)
