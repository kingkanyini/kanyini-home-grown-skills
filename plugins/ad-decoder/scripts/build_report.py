"""Output — render the run into a vault markdown report + local HTML dashboard.

Reads the shortlist + study artifacts of a finished run. Writes:
  - vault markdown at {vault}/context/ad-recon/<run-id>.md  (SafetyGuard-gated)
  - local HTML dashboard at state/reports/<run-id>.html
  - a Ship handoff block naming the proven structure in Ship-native codes

Usage:  python -m scripts.build_report --run-id <id>
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

from scripts.lib.logging_setup import setup_logging  # noqa: E402
from scripts.lib.safety import SafetyGuard  # noqa: E402
from scripts.lib.state_store import StateStore  # noqa: E402

logger = logging.getLogger("ad_recon")


def _load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}


def _ship_handoff(formula: dict) -> str:
    rows = {r["dimension"]: r for r in formula.get("rows", [])}
    def val(d):
        r = rows.get(d)
        return f"{r['modal_value']} ({r['pct']}%)" if r and not r["low_confidence"] else "—(low-confidence)"
    return (
        "## 🚀 Ship Handoff — apply this proven STRUCTURE to YOUR offer\n\n"
        "Feed the winning structure below into a Ship skill. Only the *pattern* "
        "transfers — never a competitor's offer data (Life Gamer Code).\n\n"
        f"- **Hook code:** `{val('hook_type')}` → ss-ad-generator `hook_structure_code`\n"
        f"- **Narrative skeleton:** `{val('narrative_structure')}` → ad-copy-forge section order\n"
        f"- **CTA:** `{val('cta_placement')}` / `{val('cta_variant')}` → ss-ad-generator cta variant\n"
        f"- **Awareness to target:** `{val('awareness_level')}`\n"
        f"- **Belief to shift:** `{val('subtext_belief_shift')}` → Prop Machine 6 core beliefs\n"
        f"- **Dominant proof:** `{val('dominant_proof')}`\n\n"
        "→ Run **`/ss-ad-generator`** (fills the 14 triggers + hook/overlay codes) "
        "or **`/ad-copy-forge`** (fills OO + Prop Machine) with this structure.\n"
    )


def build_markdown(run: dict, shortlist: dict, study: dict) -> str:
    scored = shortlist.get("scored", [])
    gate_a = shortlist.get("gate_a", {})
    cards = study.get("cards", [])
    formula = study.get("winning_formula", {})
    lines = [
        f"# Ad Recon — {run['query']}",
        "",
        f"> Run `{run['run_id']}` · mode `{run['search_mode']}` · preset "
        f"`{run['brand_preset']}` · {len(scored)} scouted · {len(cards)} deconstructed "
        f"· cost ${study.get('cost_usd', 0)}",
        "",
        "## 🎯 Scout — ranked outliers",
        "",
        "| # | ad | advertiser | days | cluster | composite | fit | veto |",
        "|---|----|-----------|------|---------|-----------|-----|------|",
    ]
    for i, s in enumerate(scored[:15], 1):
        sc = s["score"]
        lines.append(
            f"| {i} | {s['ad']['ad_id']} | {s['ad']['advertiser']} | "
            f"{s['ad']['days_active']} | {s['variant_count_in_cluster']} | "
            f"{sc['composite']} | {'✅' if s['fit_ok'] else '⚠️'} | "
            f"{'🚫' if sc['floor_vetoed'] else ''} |"
        )
    if gate_a.get("avg") is not None:
        lines += ["", f"**Gate A (Ad Avengers) avg: {gate_a['avg']}/10**"]

    lines += ["", "## 🔬 Study — winning formula", ""]
    lines.append(f"*Sample: {formula.get('sample_size', 0)} cards "
                 f"({formula.get('rejected_count', 0)} excluded as low-fidelity)*")
    lines += ["", "| dimension | modal value | % | |", "|---|---|---|---|"]
    for r in formula.get("rows", []):
        flag = "⚠️ low-conf" if r["low_confidence"] else ""
        lines.append(f"| {r['dimension']} | {r['modal_value']} | {r['pct']}% | {flag} |")

    lines += ["", "## 🧬 Deconstruction cards", ""]
    for c in cards:
        fid = "" if c["fidelity"] == "pass" else " — ⚠️ LOW-FIDELITY"
        lines += [
            f"### {c['advertiser']} · ad {c['ad_id']}{fid}",
            f"- **Hook** `{c['hook_type']}`: {c['hook_evidence']}",
            f"- **Mechanism:** {c['unique_mechanism']}",
            f"- **Awareness** `{c['awareness_level']}`: {c['awareness_evidence']}",
            f"- **Avatar:** {c['avatar']} · **wallet line:** {c.get('wallet_line','')}",
            f"- **Belief shift** `{c['subtext_belief_shift']}` · NESB "
            f"{'N' if c['nesb_new'] else ''}{'E' if c['nesb_easy'] else ''}"
            f"{'S' if c['nesb_safe'] else ''}{'B' if c['nesb_big'] else ''}",
            "",
        ]
    lines += ["", _ship_handoff(formula)]
    return "\n".join(lines)


def build_html(run: dict, shortlist: dict, study: dict, template: str) -> str:
    payload = json.dumps({
        "run": run, "scored": shortlist.get("scored", []),
        "gate_a": shortlist.get("gate_a", {}),
        "cards": study.get("cards", []),
        "formula": study.get("winning_formula", {}),
    }, default=str)
    return template.replace("/*__DATA__*/", payload).replace(
        "{{TITLE}}", f"Ad Recon — {run.get('query','')}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--run-id", required=True)
    args = ap.parse_args()

    cfg = yaml.safe_load((SKILL_ROOT / "config.yaml").read_text(encoding="utf-8"))
    paths = cfg["paths"]
    setup_logging(
        log_dir=SKILL_ROOT / paths["log_dir"],
        redaction_patterns=cfg["safety"]["log_redaction_patterns"],
    )
    store = StateStore(SKILL_ROOT / paths["state_dir"])
    run = store.read_run(args.run_id).model_dump(mode="json")
    runs_dir = SKILL_ROOT / paths["state_dir"] / "runs"
    shortlist = _load(runs_dir / f"{args.run_id}.shortlist.json")
    study = _load(runs_dir / f"{args.run_id}.study.json")

    md = build_markdown(run, shortlist, study)

    # Vault markdown (SafetyGuard-gated path). Optional: an empty or missing
    # vault_root skips the vault copy; the HTML dashboard still gets written.
    vault_root_cfg = (cfg["paths"].get("vault_root") or "").strip()
    vault_root = Path(vault_root_cfg) if vault_root_cfg else None
    vault_path = (vault_root / cfg["paths"]["vault_recon_dir"] / f"{args.run_id}.md") if vault_root else None
    try:
        if vault_root is None or not vault_root.is_dir():
            raise FileNotFoundError(f"vault_root not set or not a folder: {vault_root_cfg!r}")
        SafetyGuard.enforce_vault_path(
            vault_path, vault_root, cfg["safety"]["allowed_vault_prefixes"]
        )
        vault_path.parent.mkdir(parents=True, exist_ok=True)
        vault_path.write_text(md, encoding="utf-8")
        vault_written = str(vault_path)
    except Exception as e:
        logger.warning("vault write skipped: %s", e)
        vault_written = None

    # Local HTML dashboard.
    template = (SKILL_ROOT / "references" / "dashboard-template.html").read_text(encoding="utf-8")
    html = build_html(run, shortlist, study, template)
    reports_dir = SKILL_ROOT / paths["state_dir"] / "reports"
    reports_dir.mkdir(parents=True, exist_ok=True)
    html_path = reports_dir / f"{args.run_id}.html"
    html_path.write_text(html, encoding="utf-8")

    if vault_written:
        run_obj = store.read_run(args.run_id)
        run_obj.report_path = vault_written
        store.write_run(run_obj)

    print(json.dumps({
        "run_id": args.run_id,
        "vault_markdown": vault_written,
        "html_dashboard": str(html_path),
        "generated_at": datetime.now().isoformat(timespec="seconds"),
    }, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
