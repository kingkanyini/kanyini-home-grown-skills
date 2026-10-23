---
name: post-grader-v2
description: Grade a social post for VIRALITY on a numeric /10 with the hook weighted 50% (curiosity, emotional charge, share-worthiness, voice match, polarity, platform fit = the rest). Returns a scorecard + top-3 ranked fixes. Voice-match reads the user's (or the client's) active profile and honors protected tics — a documented voice tic is NOT a violation. A FEEDER, not the ship gate. Triggers on "grade this post," "is this good?," or auto-called by post-writer-v2 / repurpose-v2. Blotato post-grader adapted.
allowed-tools: Read, Write, Bash, Glob, AskUserQuestion
---

> **Paths:** every `references/` and `scripts/` path in this skill, and in the reference files it loads (a bare `social-spine/x.md` = `references/social-spine/x.md`), is relative to this plugin's root folder, `${CLAUDE_PLUGIN_ROOT}` (two levels above this skill's base directory). Never resolve them against this skill's own folder or your working folder. When you spawn subagents, pass them the absolute path.

# Post Grader v2

Score, don't rewrite. Be harsh but fair (a 10 doesn't exist). This is the mechanical virality **feeder** — NOT the ship gate, and it logs NO counsel XP.

> **Source & Attribution:** Adapted (not copied) from Blotato's `post-grader` (blotato.com · GitHub Blotato-Inc/blotato-skills). Blotato's skills remain unmodified.

## How to grade
1. Load `references/virality-grader.md` (the full 7-dimension rubric, hook=50% weighting, scorecard + top-3-fixes format).
2. Load `active_voice_path` (via `social-spine/voice.md`) and read its protected-tics list **first**. Header: *a documented tic (e.g. a signature opener, a recurring metaphor, 3-dot ellipses, em dashes on social: whatever the profile lists) is voice-authentic → zero deduction.* The voice-rules-audit `-0.5` only fires on a NON-tic deviation.
3. Output the scorecard + voice-rules audit + top-3 ranked fixes (what's wrong / why it hurts / specific fix).

## Precedence (state this to the caller)
This score is a signal, not a verdict. Authority order: **Compliance/claims-safety veto > soul-lens ceiling veto > this virality floor (≥8) > other dims** (`social-spine/ethics-gate.md`). A 9/10 post that spiritual-bypasses or makes an uncovered regulated claim is BLOCKED. The #58 counsel + the user's read-through are the real ship gate.

If called standalone, offer to hand the fixes to `post-writer-v2`. If called by a writer, return the scorecard so it loops to 8+.

## Log the scan (terminal — fire-and-forget, runs on EVERY grade)
Single writer; skills NEVER inline-append. After the scorecard:
1. Mint `scan_id` = a fresh UUID (one per grading attempt; a re-grade climb = a new scan_id → its own record).
2. Build the record: `client_slug` = `active_brand_slug`, `mode` = `active_mode`, `project`, `platform`, `caller` = `"post-grader-v2"`, `overall` + the 7 `dims` + `voice_audit`, `gate` = `PASS` if `overall ≥ 8` else `REVISE` (the grader is a feeder — `BLOCKED-ethics`/`BLOCKED-compliance` come only from the doors that run the ethics gate), `top_fix_tags` (**client mode: ONLY from CLIENT_FIX_VOCAB** — weak-hook, no-curiosity-gap, low-emotion, not-shareable, voice-drift, off-polarity, platform-misfit, cta-buried, compliance-risk, off-wedge), `image_version`, `post_ref` = a pointer into the client folder (never the body). **Never set `post_excerpt` in client mode** (self mode may include a ≤120-char excerpt).
3. **Write the record with the Write tool** to `<scratchpad>/scan-post-grader-v2-<scan_id>.json` (Write handles quoting/UTF-8 — never hand-quote JSON into a shell).
4. Run: `node "${CLAUDE_PLUGIN_ROOT}/scripts/log-scan.js" --in "<that path>"`.
5. **Fire-and-forget:** a `log-scan.js` failure surfaces (stderr + errors.log) but NEVER blocks or alters the scorecard. NEVER inline-append to any registry file.

**Field format (a mismatch = silent no-log — the writer rejects it):** `scan_id` = a v4 UUID. `platform`/`project`/`image_version` must be **bare tokens** (no spaces or slashes) — e.g. `instagram`, `ig-reels`, `x-threads`, `linkedin`, `facebook`. The 7 `dims` keys are EXACTLY `hook_strength, curiosity_specificity, emotional_charge, share_worthiness, voice_match, polarity, platform_fit` (each 0–10). `post_ref` is a path under the client's project folder (e.g. `{slug}-posts/post-10.md`), never `..`, never the body.
