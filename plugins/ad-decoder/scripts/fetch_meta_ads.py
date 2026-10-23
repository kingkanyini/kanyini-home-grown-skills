"""Fetch ads from the public Meta Ad Library web UI (scrape-primary).

The official API only serves political/issue ads, so commercial recon = the
public website. This is the fragile surface (Triple Threat residual 1): Meta
fights automation and the DOM drifts. Mitigations:
  - human-paced jittered delays + backoff + captcha-detect (SafetyGuard)
  - selector-rot → loud "0 ads, structure may have changed", never silent-empty
  - --fixture mode: parse a saved JSON/HTML capture offline (testing + the
    Step-2 verification case) with ZERO network

Live scraping uses Playwright. Selectors live in code constants below; when Meta
changes the DOM, update HERE (a config fix, not a rewrite).

Usage:
  python -m scripts.fetch_meta_ads --query "Acme" --mode advertiser
  python -m scripts.fetch_meta_ads --fixture path/to/ads.json
"""

from __future__ import annotations

import argparse
import json
import logging
from datetime import datetime
from pathlib import Path

from scripts.lib.safety import SafetyGuard, ScrapeBlocked
from scripts.lib.schemas import ScrapedAd

logger = logging.getLogger("ad_recon")

AD_LIBRARY_SEARCH = (
    "https://www.facebook.com/ads/library/"
    "?active_status=active&ad_type=all&country={country}&q={query}"
    "&search_type={search_type}&media_type=all"
)

# --- Card extraction (UPDATE HERE on DOM drift). Meta obfuscates every CSS
# class and churns them, so we do NOT anchor on classes. We anchor on the
# stable "Library ID" text that every ad card carries, then climb to the card
# boundary in JS. This survives class-name rot (the usual breakage). ---
CARD_EXTRACTOR_JS = r"""
() => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const idNodes = []; let n;
  while ((n = walker.nextNode())) {
    if (n.textContent && n.textContent.includes("Library ID")) idNodes.push(n);
  }
  const seen = new Set(); const out = [];
  for (const tn of idNodes) {
    // Smallest ancestor that holds exactly ONE Library ID, the 'Started
    // running' date line, and enough text to include the creative copy.
    let el = tn.parentElement, card = null;
    while (el && el !== document.body) {
      const t = el.innerText || "";
      const cnt = (t.match(/Library ID/g) || []).length;
      if (cnt > 1) break;                 // climbing further would merge two ads
      if (cnt === 1 && /started running/i.test(t) && t.length >= 400) { card = el; break; }
      el = el.parentElement;
    }
    if (!card || seen.has(card)) continue;
    seen.add(card);
    const t = card.innerText || "";
    const idm = t.match(/Library ID[:\s]*([0-9]{6,})/i);
    if (!idm) continue;
    const dm = t.match(/started running on\s+([^\n]+)/i);
    // Advertiser = the line immediately before "Sponsored".
    let advertiser = null;
    const lines = t.split("\n").map(s => s.trim());
    const sp = lines.findIndex(l => /^sponsored$/i.test(l));
    if (sp > 0) { for (let i = sp - 1; i >= 0; i--) { if (lines[i]) { advertiser = lines[i]; break; } } }
    const a = card.querySelector('a[href*="l.facebook.com"], a[href^="http"]');
    // Creative media URL (signed fbcdn, time-limited). Video src first; else
    // the largest content image, skipping tiny profile/thumbnail crops.
    let creative_url = null;
    const vid = card.querySelector('video');
    if (vid) {
      const src = vid.getAttribute('src') || (vid.querySelector('source') ? vid.querySelector('source').src : null);
      if (src && !src.startsWith('blob:')) creative_url = src;
      if (!creative_url && vid.poster) creative_url = vid.poster;  // fallback to poster frame
    }
    if (!creative_url) {
      const imgs = [...card.querySelectorAll('img')]
        .filter(i => i.src && (i.src.includes('scontent') || i.src.includes('fbcdn'))
                     && !/[sp]\d{2,3}x\d{2,3}/.test(i.src))   // drop 60x60-style thumbnails
        .sort((x, y) => (y.naturalWidth * y.naturalHeight) - (x.naturalWidth * x.naturalHeight));
      if (imgs.length) creative_url = imgs[0].src;
    }
    out.push({
      ad_id: idm[1],
      advertiser: advertiser,
      started: dm ? dm[1].trim() : null,
      primary_text: t.slice(0, 1000),
      link: a ? a.getAttribute("href") : null,
      creative_url: creative_url,
      is_video: !!vid || /\bvideo\b/i.test(t),
    });
  }
  return out;
}
"""


def _parse_fixture(raw: dict) -> list[ScrapedAd]:
    """A fixture is {"ads": [ {ScrapedAd-ish dict}, ... ]}. Used for offline
    testing + the adversarial verification case. Tolerant of partial fields.
    """
    out: list[ScrapedAd] = []
    for i, item in enumerate(raw.get("ads", [])):
        item.setdefault("ad_id", f"fixture-{i+1}")
        if "days_active" not in item and item.get("start_date"):
            try:
                start = datetime.fromisoformat(item["start_date"])
                item["days_active"] = max(0, (datetime.now() - start).days)
            except Exception:
                item["days_active"] = 0
        out.append(ScrapedAd.model_validate(item))
    return out


def fetch_from_fixture(path: Path) -> list[ScrapedAd]:
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    ads = _parse_fixture(raw)
    logger.info("Loaded %d ads from fixture %s", len(ads), path)
    return ads


def fetch_live(query: str, mode: str, scrape_cfg: dict) -> list[ScrapedAd]:
    """Scrape the public Ad Library. Returns ScrapedAd list (may be empty on a
    genuinely-empty advertiser). Raises ScrapeBlocked on captcha/hard-block.
    """
    try:
        from playwright.sync_api import sync_playwright
    except ImportError as e:
        raise RuntimeError(
            "playwright not installed — `pip install playwright && playwright install chromium`"
        ) from e

    from urllib.parse import quote

    search_type = "page" if mode == "advertiser" else "keyword_unordered"
    url = AD_LIBRARY_SEARCH.format(
        country=scrape_cfg.get("country", "US"),
        query=quote(query, safe=""),  # encode &, =, #, spaces, non-ASCII
        search_type=search_type,
    )
    max_ads = int(scrape_cfg.get("max_ads_per_query", 60))
    ads: list[ScrapedAd] = []

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=bool(scrape_cfg.get("headless", False)))
        page = browser.new_page()
        try:
            page.goto(url, timeout=int(scrape_cfg.get("nav_timeout_ms", 45000)))
            SafetyGuard.polite_delay(
                scrape_cfg.get("min_delay_seconds", 3),
                scrape_cfg.get("max_delay_seconds", 7),
            )
            # Block detection BEFORE trusting any parse.
            SafetyGuard.detect_block(page.url, page.content())

            # The Ad Library is a React SPA — cards stream in on scroll, so a
            # single read only sees the first ~25. Scroll to load up to max_ads.
            for _ in range(int(scrape_cfg.get("scroll_passes", 5))):
                page.mouse.wheel(0, 25000)
                SafetyGuard.polite_delay(1.5, 3.0)

            raw_cards = page.evaluate(CARD_EXTRACTOR_JS)
            if not raw_cards:
                logger.warning(
                    "0 ad cards parsed for %r. Either the search has no active "
                    "ads OR the DOM changed (selector-rot — update "
                    "CARD_EXTRACTOR_JS). Verify manually at: %s", query, url,
                )
                return []

            for rc in raw_cards[:max_ads]:
                ad = _build_ad(rc, query=query, mode=mode)
                if ad:
                    ads.append(ad)
        except ScrapeBlocked:
            raise
        finally:
            browser.close()

    logger.info("Scraped %d ads for %r", len(ads), query)
    return ads


def _build_ad(rc: dict, query: str, mode: str) -> ScrapedAd | None:
    """Build a ScrapedAd from one extractor dict. Returns None without an id."""
    ad_id = (rc.get("ad_id") or "").strip()
    if not ad_id:
        return None
    started = rc.get("started")
    start_dt = None
    days = 0
    if started:
        for fmt in ("%b %d, %Y", "%d %b %Y"):
            try:
                start_dt = datetime.strptime(started.strip(), fmt)
                days = max(0, (datetime.now() - start_dt).days)
                break
            except ValueError:
                continue
    # Prefer the real per-card advertiser (essential for keyword hunts across
    # many advertisers); fall back to the search term.
    advertiser = (rc.get("advertiser") or "").strip() or query
    return ScrapedAd(
        ad_id=ad_id,
        advertiser=advertiser,
        destination_url=rc.get("link"),
        primary_text=rc.get("primary_text"),
        creative_url=rc.get("creative_url"),
        snapshot_url=f"https://www.facebook.com/ads/library/?id={ad_id}",
        start_date=start_dt,
        days_active=days,
        platforms=["facebook"],
        regions=["US"],
        is_video=bool(rc.get("is_video")),
    )


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--query")
    ap.add_argument("--mode", choices=["advertiser", "keyword"], default="advertiser")
    ap.add_argument("--fixture", type=Path)
    args = ap.parse_args()

    if args.fixture:
        ads = fetch_from_fixture(args.fixture)
    else:
        import yaml
        cfg = yaml.safe_load((Path(__file__).resolve().parent.parent / "config.yaml").read_text(encoding="utf-8"))
        ads = fetch_live(args.query, args.mode, cfg.get("scrape", {}))
    print(json.dumps({"ads": [a.model_dump(mode="json") for a in ads]}, indent=2, default=str))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
