"""Composite Outlier Score — longevity-dominant, scroll-stop soft-floor veto.

Deterministic given (ads, clusters, scroll-stop scores, preset, weights).
See references/scoring-model.md. The scroll-stop *rubric scoring* itself is a
model call (deconstruct/scroll pass); this module only blends the numbers.
"""

from __future__ import annotations

from scripts.cluster_concepts import cluster_ads
from scripts.lib.schemas import (
    OutlierScore,
    ScoredAd,
    ScrapedAd,
    ScrollStop,
)


def longevity_subscore(days: int, strong: int, unicorn: int) -> float:
    """0 at 0 days → 0.6 at `strong` → 1.0 at `unicorn` (clamped)."""
    if days <= 0:
        return 0.0
    if days >= unicorn:
        return 1.0
    if days >= strong:
        # interpolate 0.6 → 1.0 between strong and unicorn
        span = max(1, unicorn - strong)
        return 0.6 + 0.4 * (days - strong) / span
    # interpolate 0.0 → 0.6 between 0 and strong
    return 0.6 * (days / max(1, strong))


def variant_subscore(count_in_cluster: int, cap: int) -> float:
    return min(max(1, count_in_cluster), cap) / cap


def region_subscore(region_count: int, cap: int) -> float:
    return min(max(0, region_count), cap) / cap


def _fit_check(ad: ScrapedAd, preset: dict) -> tuple[bool, str | None]:
    """Client-fit gate: flag (don't drop) ads that don't match the preset's
    platform expectation. Offer-type/price-band are inferred later in Study;
    here we apply the cheap, structural platform check.
    """
    want = {p.lower() for p in preset.get("platforms", [])}
    have = {p.lower() for p in (ad.platforms or [])}
    if want and have and not (want & have):
        return False, f"platforms {sorted(have)} miss preset {sorted(want)}"
    return True, None


def score_batch(
    ads: list[ScrapedAd],
    scroll_stops: dict[str, ScrollStop],
    preset: dict,
    scoring_cfg: dict,
    mode: str = "advertiser",
) -> list[ScoredAd]:
    """Cluster → subscore → composite → floor-veto → fit-gate → ranked list."""
    weights = scoring_cfg["weights"]
    variant_cap = int(scoring_cfg.get("variant_cap", 5))
    region_cap = int(scoring_cfg.get("region_cap", 5))
    floor_pct = float(scoring_cfg.get("scroll_stop_floor_pct", 25))
    floor_cap = float(scoring_cfg.get("scroll_stop_floor_cap", 0.45))
    longevity_cfg = preset.get("longevity", {"strong": 45, "unicorn": 90})

    clusters, ad_to_cluster = cluster_ads(
        ads, mode=mode,
        offer_match_merges=True,
    )
    cluster_size = {c.cluster_id: len(c.member_ad_ids) for c in clusters}

    # Determine the bottom-quartile scroll-stop threshold for the floor veto.
    ss_totals = sorted(
        (scroll_stops[a.ad_id].total if a.ad_id in scroll_stops else 0)
        for a in ads
    )
    floor_threshold = 0.0
    if ss_totals:
        idx = max(0, int(len(ss_totals) * floor_pct / 100) - 1)
        floor_threshold = ss_totals[idx]

    scored: list[ScoredAd] = []
    for ad in ads:
        cid = ad_to_cluster.get(ad.ad_id, "c000")
        ss = scroll_stops.get(ad.ad_id, ScrollStop())
        sub_long = longevity_subscore(
            ad.days_active, int(longevity_cfg["strong"]), int(longevity_cfg["unicorn"])
        )
        sub_var = variant_subscore(cluster_size.get(cid, 1), variant_cap)
        sub_ss = ss.total / ss.max_total
        sub_reg = region_subscore(len(ad.regions or []), region_cap)

        composite = (
            weights["longevity"] * sub_long
            + weights["variant"] * sub_var
            + weights["scroll_stop"] * sub_ss
            + weights["region"] * sub_reg
        )
        vetoed = False
        if ss_totals and ss.total <= floor_threshold and composite > floor_cap:
            composite = floor_cap
            vetoed = True

        fit_ok, fit_note = _fit_check(ad, preset)
        scored.append(
            ScoredAd(
                ad=ad,
                cluster_id=cid,
                variant_count_in_cluster=cluster_size.get(cid, 1),
                scroll_stop=ss,
                score=OutlierScore(
                    longevity=round(sub_long, 4),
                    variant=round(sub_var, 4),
                    scroll_stop=round(sub_ss, 4),
                    region=round(sub_reg, 4),
                    composite=round(composite, 4),
                    floor_vetoed=vetoed,
                ),
                fit_ok=fit_ok,
                fit_note=fit_note,
            )
        )

    # Rank: fit ads first, then by composite desc.
    scored.sort(key=lambda s: (s.fit_ok, s.score.composite), reverse=True)
    return scored
