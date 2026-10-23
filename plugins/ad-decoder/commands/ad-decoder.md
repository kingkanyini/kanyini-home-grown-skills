---
description: Ad Decoder — Scout + Study the Meta Ad Library. Scrape competitor/niche ads, score outliers (longevity-dominant, same-concept clustered, scroll-stop floor-veto), pick winners, then forensically deconstruct WHY they win on 9 mechanism-grade dimensions into a regenerable structure for /ss-ad-generator + /ad-copy-forge. Ad Avengers + Copy Forensics counsel gates.
---

> **Paths:** every `references/`, `scripts/`, `assets/`, `templates/` (etc.) path in this file is relative to this plugin's folder, `${CLAUDE_PLUGIN_ROOT}`. Read them as `${CLAUDE_PLUGIN_ROOT}/references/...`, never relative to your current working folder. When you spawn subagents, pass them the absolute path.

# Ad Decoder

> Scout → Study. Don't invent winning ads — find proven outliers, deconstruct
> the engine, hand the structure to your Ship skills. (Ship stays a handoff.)

You are orchestrating a two-phase, human-gated Python pipeline. The deterministic
work runs in scripts; you broker the human pick-gate between the two entrypoints
and present results. **Source:** Jack Roberts, "Claude Code Just Changed
Everything about Ads."

## ⚖️ Ethics check (Life Gamer Code — run at START)
Confirm framing before touching anything: we are **researching the ad
landscape** and **studying competitor creative** to learn the proven *structure*
— never "scraping/spying/stealing," never transplanting a competitor's offer.
The Golden Rule: if they saw our recon, would they feel honored or violated? We
study, adapt, and honor. If any step or output drifts to extraction language,
fix it before proceeding.

## Pre-flight
0. Run every command below from this skill's own folder (the one holding
   `config.yaml`) — the scripts resolve `state/`, `logs/`, and `references/`
   relative to it. Heads-up for the user: automated collection from the Ad
   Library may conflict with Meta's terms of service — keep volume low
   (research, not harvest) and use it at your own discretion.
1. Confirm `.env` exists with `ANTHROPIC_API_KEY` + `GROQ_API_KEY`. If not, tell
   the user to create it from `.env.example` via the terminal-command pattern
   (keys never enter chat). Scrape needs no Meta token.
2. First run only: `pip install -r requirements.txt && playwright install chromium`.
3. Pick the **brand preset** (default: `default`). The fit-gate normalizes
   outliers against it. Ask which preset / offer if ambiguous.

## Phase 1 — Scout (Entrypoint 1)
Ask: **named competitor** (`--mode advertiser`) or **niche/keyword concept-hunt**
(`--mode keyword`), and the query.

Run:
```
python -m scripts.recon_fetch_score --query "<advertiser-or-keyword>" --mode <advertiser|keyword> --preset <preset>
```
- Handle the JSON: `status: blocked` → tell the user Meta challenged the session,
  retry later (no degraded mode in v1). `status: done, count: 0` → no active ads.
- Present the **ranked shortlist** (top 10): ad_id, advertiser, days active,
  cluster size, composite, fit flag (⚠️ = doesn't transfer to this preset), veto
  flag (🚫 = dead-frame capped). Surface the **Gate A (Ad Avengers)** avg score
  and any sharp note.

## Phase 2 — The pick-gate (HUMAN)
This is the tiered gate — the human decision *before* the expensive deep-dive.
Use **AskUserQuestion**: present the top outliers as selectable options and ask
which 1–5 to deep-dive. (RPG framing in the message above the question, per
the user's interview style.) Do NOT auto-pick.

## Phase 3 — Study (Entrypoint 2)
Run with the picked ids (note the `run-id` from Phase 1):
```
python -m scripts.recon_deconstruct --run-id <run-id> --pick <id1,id2,...>
```
This downloads each creative → Groq Whisper → Vision-OCR deconstruction (9 dims,
on-screen text merged with audio) → **Gate B (Copy Forensics)** with
retry-once → low-fidelity disposition → commonality synthesis (confidence floor).
Cost-capped; creatives auto-purge. Report the deconstructed count, any
low-fidelity exclusions, and cost.

## Phase 4 — Output + Ship handoff
```
python -m scripts.build_report --run-id <run-id>
```
Surface the **vault markdown** path and the **HTML dashboard** path (offer to
open it). Walk the user through the **winning formula** (modal value + %, flag
low-confidence dimensions) and the **Ship handoff** block — the proven structure
in `/ss-ad-generator` + `/ad-copy-forge` native codes.

## ⚖️ Ethics check (run at END)
Scan the report for any extraction/"steal/spy/copy" language; confirm it centers
*structure not stolen offer*, and that the handoff tells the user to fill the
pattern with THEIR (or the client's) own OO + Prop Machine. Fix before delivering.

## Notes
- Re-running the same advertiser skips already-deconstructed ads (seen-ledger).
- A run pauses cleanly at `awaiting_pick`; resume later with the same run-id.
- v1 is **Meta only**; TikTok, Ship-video-gen, cron, and batch are deferred.
