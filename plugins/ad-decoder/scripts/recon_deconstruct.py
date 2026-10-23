"""ENTRYPOINT 2 — Study: resume run → deconstruct picked winners → synthesize.

Resumes a run left at `awaiting_pick`. For each picked ad: download creative →
Groq Whisper → Vision-OCR deconstruction → Gate B (retry-once → low-fidelity) →
collect. Then commonality synthesis. Creatives auto-purge (thumbnail kept).
Per-run cost cap enforced (BudgetExceeded aborts cleanly).

Usage:
  python -m scripts.recon_deconstruct --run-id <id> --pick 100,101,102
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
from pathlib import Path

import yaml

SKILL_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SKILL_ROOT))

# Load .env secrets (ANTHROPIC_API_KEY, GROQ_API_KEY) into os.environ.
try:
    from dotenv import load_dotenv  # noqa: E402
    load_dotenv(SKILL_ROOT / ".env")
except ImportError:
    pass

from scripts.download_creative import fetch_creative, purge_creative  # noqa: E402
from scripts.transcribe import transcribe_audio  # noqa: E402
from scripts.deconstruct import deconstruct_ad  # noqa: E402
from scripts.synthesize import synthesize  # noqa: E402
from scripts.lib.anthropic_client import AnthropicClient, CostInfo  # noqa: E402
from scripts.lib.logging_setup import setup_logging  # noqa: E402
from scripts.lib.safety import SafetyGuard, BudgetExceeded  # noqa: E402
from scripts.lib.state_store import StateStore  # noqa: E402
from scripts.lib.schemas import DeconstructionCard, ScrapedAd  # noqa: E402

logger = logging.getLogger("ad_recon")
GATE_PASS = 7.0  # Gate B avg below this → reject (retry once, then low-fidelity)


def load_config() -> dict:
    return yaml.safe_load((SKILL_ROOT / "config.yaml").read_text(encoding="utf-8"))


def _gate_b(card: DeconstructionCard, cfg: dict) -> tuple[float, CostInfo]:
    from scripts.gate import run_gate

    fenced = SafetyGuard.fence_untrusted_content(
        json.dumps(card.model_dump(mode="json"), indent=2), source_id=card.ad_id
    )
    prompt = (
        "Review this ad deconstruction card for whether it captures the ENGINE "
        "(mechanism, proof, awareness, avatar, subtext) — not just the skeleton. "
        "Reject feature-restatement mechanisms and empty mechanism/proof/avatar "
        "fields. Score on your lens.\n\n"
        f"DECONSTRUCTION CARD:\n{fenced}\n"
    )
    reviews, avg, cost = run_gate(
        cfg["counsel_gates"]["gate_b"], cfg["model_routing"]["gate"], prompt
    )
    return avg, cost


def _mechanism_is_thin(card: DeconstructionCard) -> bool:
    """Cheap deterministic pre-check: a two-part mechanism shows contrast.
    A bare feature restatement usually doesn't."""
    m = (card.unique_mechanism or "").lower()
    has_contrast = any(w in m for w in (
        "because", "but", "instead", "unlike", "why", "fails", "failed",
        "doesn't", "didn't", "finally", "so that", "the reason",
    ))
    return len(m) < 25 or not has_contrast


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-id", required=True)
    ap.add_argument("--pick", help="comma-separated ad_ids to deep-dive")
    ap.add_argument("--no-gate", action="store_true")
    args = ap.parse_args()

    cfg = load_config()
    paths = cfg["paths"]
    setup_logging(
        log_dir=SKILL_ROOT / paths["log_dir"],
        redaction_patterns=cfg["safety"]["log_redaction_patterns"],
        log_retention_days=cfg["safety"].get("log_retention_days", 30),
    )
    store = StateStore(SKILL_ROOT / paths["state_dir"])
    run = store.read_run(args.run_id)

    shortlist_path = SKILL_ROOT / paths["state_dir"] / "runs" / f"{run.run_id}.shortlist.json"
    shortlist = json.loads(shortlist_path.read_text(encoding="utf-8"))
    by_id = {s["ad"]["ad_id"]: ScrapedAd.model_validate(s["ad"]) for s in shortlist["scored"]}

    requested = [p.strip() for p in (args.pick or "").split(",") if p.strip()]
    if requested:
        picks = [p for p in requested if p in by_id]
        if not picks:  # a --pick was given but none matched — error, don't silently reuse
            print(json.dumps({"error": f"none of --pick {requested} are in this run's shortlist"}))
            return 2
    else:
        picks = run.picked_ad_ids
    if not picks:
        print(json.dumps({"error": "no valid picks; pass --pick <ad_ids>"}))
        return 2

    run.picked_ad_ids = picks
    run.status = "deconstructing"
    store.write_run(run)

    creatives_dir = SKILL_ROOT / paths["creatives_dir"]
    cap = float(cfg["safety"]["cost_cap_usd_per_run"])
    client = AnthropicClient()
    total = CostInfo(model="claude-sonnet-4-6")
    cards: list[DeconstructionCard] = []
    rejected = 0

    # Front-load ALL creative downloads BEFORE the slow LLM steps. The signed
    # fbcdn URLs are time-limited (~minutes); downloading them inside the
    # per-ad loop means ads processed later (after Whisper+Vision+Gate on
    # earlier ads) hit expired URLs and fail. Download while they're fresh.
    downloaded = {}
    for ad_id in picks:
        ad = by_id[ad_id]
        assets = fetch_creative(ad_id, ad.creative_url, creatives_dir)
        downloaded[ad_id] = assets
        if not assets.frames and not assets.audio_path:
            logger.warning("ad %s: creative download yielded no media (URL may have expired)", ad_id)

    for ad_id in picks:
        ad = by_id[ad_id]
        try:
            SafetyGuard.check_cost_budget(total.cost_usd, cap)
        except BudgetExceeded as e:
            logger.warning("Cost cap hit, stopping deep-dive: %s", e)
            run.note = f"cost cap reached after {len(cards)} cards"
            break

        # Creative was pre-downloaded above; purge guaranteed even on a crash.
        assets = downloaded[ad_id]
        try:
            transcript = transcribe_audio(assets.audio_path, cfg["whisper"])

            card, cost = deconstruct_ad(ad, assets, transcript, cfg["model_routing"]["deconstruct"], client)
            total = total + cost
            if card is None:
                logger.warning("ad %s: nothing to deconstruct (no frames/audio)", ad_id)
                continue

            # --- Gate B disposition: retry once, then low-fidelity ---
            if not args.no_gate:
                avg, gcost = _gate_b(card, cfg)
                total = total + gcost
                if avg < GATE_PASS or _mechanism_is_thin(card):
                    logger.info("ad %s: Gate B %.1f — retrying deconstruction once", ad_id, avg)
                    card2, cost2 = deconstruct_ad(ad, assets, transcript, cfg["model_routing"]["deconstruct"], client)
                    total = total + cost2
                    if card2 is not None:
                        avg2, gcost2 = _gate_b(card2, cfg)
                        total = total + gcost2
                        if avg2 >= GATE_PASS and not _mechanism_is_thin(card2):
                            card = card2
                        else:
                            card = card2 or card
                            card.fidelity = "low-fidelity"
                            card.gate_notes = f"Gate B {avg:.1f}→{avg2:.1f}; excluded from commonality count"
                            rejected += 1

            cards.append(card)
        finally:
            purge_creative(ad_id, creatives_dir)

    formula = synthesize(cards, float(cfg["study"]["confidence_floor_pct"]), rejected)

    # Persist Study artifact for the output/report step.
    study_path = SKILL_ROOT / paths["state_dir"] / "runs" / f"{run.run_id}.study.json"
    study_path.write_text(json.dumps({
        "run_id": run.run_id,
        "cards": [c.model_dump(mode="json") for c in cards],
        "winning_formula": formula.model_dump(mode="json"),
        "cost_usd": round(total.cost_usd, 4),
    }, indent=2, default=str), encoding="utf-8")

    run.deconstructed_ad_ids = [c.ad_id for c in cards]
    run.total_cost_usd = round(run.total_cost_usd + total.cost_usd, 4)
    run.status = "done"
    store.write_run(run)
    if run.search_mode == "advertiser":
        store.mark_seen(run.query, [c.ad_id for c in cards])

    print(json.dumps({
        "run_id": run.run_id, "status": "done",
        "deconstructed": len(cards), "rejected_low_fidelity": rejected,
        "cost_usd": round(total.cost_usd, 4),
        "study_path": str(study_path),
        "winning_formula": [
            f"{r.dimension}={r.modal_value} ({r.pct}%){' ⚠low-conf' if r.low_confidence else ''}"
            for r in formula.rows
        ],
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
