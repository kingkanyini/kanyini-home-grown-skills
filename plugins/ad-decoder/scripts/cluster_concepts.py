"""Same-concept clustering — the load-bearing fix for the variant signal.

Cluster an advertiser's (or, in keyword mode, a niche's) active ads into
concepts BEFORE counting variants, so "this one concept is being scaled" is
distinguished from "this advertiser has a big budget." See
references/scoring-model.md §2.

Pure / deterministic / no network — unit-testable.
"""

from __future__ import annotations

import re
from urllib.parse import urlsplit

from scripts.lib.schemas import ConceptCluster, ScrapedAd


_STOPWORDS = {
    "the", "a", "an", "and", "or", "to", "of", "for", "your", "you", "with",
    "is", "in", "on", "this", "that", "it", "get", "now", "best", "new",
}


def normalize_url(url: str | None) -> str:
    """Drop scheme, www., query (UTM etc.), fragment, trailing slash, lowercase.

    `https://www.Site.com/Offer/?utm_source=x#hero` → `site.com/offer`
    Returns "" if there is no usable URL.
    """
    if not url:
        return ""
    raw = url.strip()
    if "//" not in raw:
        raw = "//" + raw  # let urlsplit see a netloc
    parts = urlsplit(raw)
    host = (parts.netloc or "").lower()
    if host.startswith("www."):
        host = host[4:]
    path = (parts.path or "").rstrip("/").lower()
    return f"{host}{path}".strip("/")


def normalize_offer(headline: str | None, primary_text: str | None) -> str:
    """Stop-stripped lowercase token signature of the offer copy.

    Used to merge clusters that share no URL but pitch the same offer.
    Returns "" when there's not enough signal to compare.
    """
    blob = " ".join(filter(None, [headline or "", primary_text or ""])).lower()
    tokens = re.findall(r"[a-z0-9]+", blob)
    keep = [t for t in tokens if t not in _STOPWORDS and len(t) > 2]
    # Signature = first 8 distinct meaningful tokens, order-stable.
    seen: list[str] = []
    for t in keep:
        if t not in seen:
            seen.append(t)
        if len(seen) >= 8:
            break
    return " ".join(seen)


def _cluster_key(ad: ScrapedAd, mode: str) -> tuple[str, str]:
    """Return (primary_key, offer_sig). primary_key is the URL when present,
    else the offer signature. In keyword mode the advertiser is NOT part of the
    key (concepts span advertisers); in advertiser mode it is.
    """
    url = normalize_url(ad.destination_url)
    offer = normalize_offer(ad.headline, ad.primary_text)
    advertiser_scope = "" if mode == "keyword" else f"{ad.advertiser.lower()}::"
    primary = url or offer
    return (f"{advertiser_scope}{primary}", offer)


def cluster_ads(
    ads: list[ScrapedAd],
    mode: str = "advertiser",
    offer_match_merges: bool = True,
) -> tuple[list[ConceptCluster], dict[str, str]]:
    """Group ads into concept clusters.

    Returns (clusters, ad_id → cluster_id). Strategy:
      1. Bucket by primary key (normalized URL, else offer signature).
      2. If offer_match_merges, fold no-URL buckets into a URL bucket that
         shares the same offer signature (different landing page, same concept).
    """
    buckets: dict[str, list[ScrapedAd]] = {}
    offer_index: dict[str, str] = {}  # offer_sig → an existing key that has a URL

    # Pass 1: bucket by primary key, remember which keys carry a real URL.
    for ad in ads:
        key, offer = _cluster_key(ad, mode)
        buckets.setdefault(key, []).append(ad)
        if normalize_url(ad.destination_url) and offer and offer not in offer_index:
            offer_index[offer] = key

    # Pass 2: merge offer-only buckets into URL buckets with the same offer sig.
    if offer_match_merges:
        for key in list(buckets.keys()):
            sample = buckets[key][0]
            if normalize_url(sample.destination_url):
                continue  # this bucket already has a URL identity
            _, offer = _cluster_key(sample, mode)
            target = offer_index.get(offer)
            if target and target != key:
                buckets[target].extend(buckets.pop(key))

    clusters: list[ConceptCluster] = []
    ad_to_cluster: dict[str, str] = {}
    for i, (key, members) in enumerate(sorted(buckets.items()), start=1):
        cid = f"c{i:03d}"
        clusters.append(
            ConceptCluster(
                cluster_id=cid,
                cluster_key=key,
                advertiser=members[0].advertiser,
                member_ad_ids=[m.ad_id for m in members],
            )
        )
        for m in members:
            ad_to_cluster[m.ad_id] = cid
    return clusters, ad_to_cluster
