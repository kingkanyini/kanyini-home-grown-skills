"""ENTRYPOINT 1 — Scout: fetch → cluster → score → Gate A → awaiting_pick.

Stops at the human gate. The markdown command (commands/ad-recon.md) shows the
ranked shortlist to the user, who picks winners; recon_deconstruct.py (Entrypoint
2) then resumes the same run.

Usage:
  python -m scripts.recon_fetch_score --query "Acme" --mode advertiser \
      --preset default [--fixture path] [--run-id <id>] [--no-gate]
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from datetime import datetime
from pathlib import Path

import yaml

SKILL_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SKILL_ROOT))

# Load secrets from .env into os.environ. python-dotenv is a dependency but was
# never invoked, so ANTHROPIC_API_KEY / GROQ_API_KEY in .env stayed invisible.
try:
    from dotenv import load_dotenv  # noqa: E402
    load_dotenv(SKILL_ROOT / ".env")
except ImportError:
    pass

from scripts.fetch_meta_ads import fetch_from_fixture, fetch_live  # noqa: E402
from scripts.scroll_stop import heuristic_scroll_stop  # noqa: E402
from scripts.score_ads import score_batch  # noqa: E402
from scripts.lib.logging_setup import setup_logging  # noqa: E402
from scripts.lib.safety import SafetyGuard, ScrapeBlocked  # noqa: E402
from scripts.lib.state_store import StateStore, slugify  # noqa: E402
from scripts.lib.schemas import ReconRun  # noqa: E402

logger = logging.getLogger("ad_recon")


def load_config() -> dict:
    return yaml.safe_load((SKILL_ROOT / "config.yaml").read_text(encoding="utf-8"))


def _gate_a(scored, cfg) -> tuple[float, list[dict]]:
    """Run Gate A (Ad Avengers) over the ranked shortlist. Returns
    (avg_score, reviews). Persona-in-Python; annotation only (does not reorder).
    """
    from scripts.gate import run_gate  # imported lazily (needs API key)

    top = scored[: min(10, len(scored))]
    rows = "\n".join(
        f"- {s.ad.ad_id} | {s.ad.advertiser} | {s.ad.days_active}d | "
        f"cluster_n={s.variant_count_in_cluster} | composite={s.score.composite} "
        f"| fit={s.fit_ok}"
        for s in top
    )
    fenced = SafetyGuard.fence_untrusted_content(rows, source_id="scout-ranking")
    prompt = (
        "Review this Scout outlier ranking. Are these real winner-signals or "
        "noise? Score the ranking's validity on your lens.\n\n"
        f"RANKED SHORTLIST (top {len(top)}):\n{fenced}\n"
    )
    reviews, avg, _cost = run_gate(
        cfg["counsel_gates"]["gate_a"],
        cfg["model_routing"]["gate"],
        prompt,
    )
    return avg, [r.model_dump(mode="json") for r in reviews]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", required=True)
    ap.add_argument("--mode", choices=["advertiser", "keyword"], default="advertiser")
    ap.add_argument("--preset", default="default")
    ap.add_argument("--fixture", type=Path)
    ap.add_argument("--run-id")
    ap.add_argument("--no-gate", action="store_true",
                    help="skip Gate A (offline/no-API testing)")
    args = ap.parse_args()

    cfg = load_config()
    paths = cfg["paths"]
    setup_logging(
        log_dir=SKILL_ROOT / paths["log_dir"],
        redaction_patterns=cfg["safety"]["log_redaction_patterns"],
        log_retention_days=cfg["safety"].get("log_retention_days", 30),
    )
    store = StateStore(SKILL_ROOT / paths["state_dir"])
    preset = cfg["brand_presets"].get(args.preset)
    if preset is None:
        print(json.dumps({"error": f"unknown preset {args.preset!r}"}))
        return 2

    run_id = args.run_id or f"{slugify(args.query)}-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
    now = datetime.now()
    run = ReconRun(
        run_id=run_id, status="fetched", search_mode=args.mode,
        query=args.query, brand_preset=args.preset, created_at=now, updated_at=now,
    )
    store.write_run(run)

    # --- Fetch (scrape-primary) ---
    try:
        if args.fixture:
            ads = fetch_from_fixture(args.fixture)
        else:
            ads = fetch_live(args.query, args.mode, cfg["scrape"])
    except ScrapeBlocked as e:
        run.status = "blocked"
        run.note = str(e)
        store.write_run(run)
        print(json.dumps({"run_id": run_id, "status": "blocked", "note": str(e)}))
        return 3

    if not ads:
        run.status = "done"
        run.note = "no active ads found"
        store.write_run(run)
        print(json.dumps({"run_id": run_id, "status": "done", "note": "no ads found", "count": 0}))
        return 0

    # Skip ads already deconstructed in a prior run (idempotency).
    if args.mode == "advertiser":
        seen = set(store.read_seen(args.query).seen_ad_ids)
        fresh = [a for a in ads if a.ad_id not in seen]
        logger.info("Fetched %d ads; %d fresh after seen-ledger", len(ads), len(fresh))
        ads = fresh or ads

    # --- Score (cheap scan-all: heuristic scroll-stop) ---
    scroll = {a.ad_id: heuristic_scroll_stop(a) for a in ads}
    scored = score_batch(ads, scroll, preset, cfg["scoring"], mode=args.mode)
    run.status = "scored"
    run.shortlist_ad_ids = [s.ad.ad_id for s in scored]
    store.write_run(run)

    # --- Gate A (Ad Avengers) ---
    gate = {"avg": None, "reviews": []}
    if not args.no_gate:
        try:
            avg, reviews = _gate_a(scored, cfg)
            gate = {"avg": avg, "reviews": reviews}
        except Exception as e:  # gate must never crash the run
            logger.warning("Gate A skipped: %s", e)
            gate = {"avg": None, "reviews": [], "error": str(e)[:200]}

    # --- Persist shortlist artifact + awaiting_pick ---
    run.status = "awaiting_pick"
    store.write_run(run)
    shortlist_path = SKILL_ROOT / paths["state_dir"] / "runs" / f"{run_id}.shortlist.json"
    shortlist_path.write_text(
        json.dumps(
            {
                "run_id": run_id,
                "query": args.query,
                "mode": args.mode,
                "preset": args.preset,
                "gate_a": gate,
                "scored": [s.model_dump(mode="json") for s in scored],
            },
            indent=2, default=str,
        ),
        encoding="utf-8",
    )

    print(json.dumps({
        "run_id": run_id,
        "status": "awaiting_pick",
        "count": len(scored),
        "gate_a_avg": gate["avg"],
        "shortlist_path": str(shortlist_path),
        "top": [
            {"ad_id": s.ad.ad_id, "advertiser": s.ad.advertiser,
             "days": s.ad.days_active, "composite": s.score.composite,
             "fit": s.fit_ok, "vetoed": s.score.floor_vetoed}
            for s in scored[:10]
        ],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
