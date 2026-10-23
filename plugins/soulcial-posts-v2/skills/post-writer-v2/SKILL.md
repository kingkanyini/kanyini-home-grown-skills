---
name: post-writer-v2
description: Write a complete social post (hook + body + CTA) in the user's (or a client's) voice, sized to the platform, hook-first, with the CTA matched to the platform's algorithm-reward metric. Auto-loops the virality grader to 8+ and runs the ethics gate before returning. Triggers on "write me a [platform] post about X," any specific topic + platform. Blotato post-writer adapted to the user's voice + ethics.
allowed-tools: Read, Write, Edit, Bash, Glob, AskUserQuestion
---

> **Paths:** every `references/` and `scripts/` path in this skill, and in the reference files it loads (a bare `social-spine/x.md` = `references/social-spine/x.md`), is relative to this plugin's root folder, `${CLAUDE_PLUGIN_ROOT}` (two levels above this skill's base directory). Never resolve them against this skill's own folder or your working folder. When you spawn subagents, pass them the absolute path.

# Post Writer v2

Take a topic + platform, return a finished, graded, ethics-cleared post. This is a **public-copy exit** — it MUST run the ethics gate before returning.

> **Source & Attribution:** Adapted (not copied) from Blotato's `post-writer` (blotato.com · GitHub Blotato-Inc/blotato-skills). Blotato's skills remain unmodified.

## Spine
1. Ensure mode/brand/voice via `social-spine/mode-gate.md` + `voice.md` (if invoked standalone).
2. Brand context via `social-spine/brand-context.md` (reuse/lean-capture; need the wedge).

## Workflow
1. **Hook first (50% of the score).** Draft 3 variations from `references/viral-hooks-library.md` matched to the angle + this week's wedge. Rewrite the winner 3–5×. Pass the first-3-words test + thumb-stop. Ask the metaphor dial (brand-context `metaphor_dial`) if unset. Leave the body alone until the hook really holds up.
2. **Body.** One idea. Real numbers/names/moments. "You/your." Active voice, rhythm (build then break). Length per `references/platform-specs.md`. Voice per `active_voice_path` — protected tics honored, no spiritual-bypass, open plain not hyped.
3. **CTA matched to the platform's reward metric** (`references/platform-specs.md`: LinkedIn=comments, IG feed=saves, IG Reels=completion, FB=shares, X/Threads=replies, TikTok=completion). One CTA, delivered as a soft invite in his voice — never begging, never manufactured scarcity.
4. **Grade.** Run `references/virality-grader.md`; apply top-3 fixes; loop until ≥8/10. Mechanical feeder only.
5. **Ethics gate (mandatory).** Run `references/social-spine/ethics-gate.md` (compliance > soul-lens > virality). Do not emit while `Ethics: pending`; set `cleared` on pass.
6. **Return** the final post + platform + hook pattern + score + one line on why it works, and offer scheduling via `post-scheduler-v2`. If in a `content-coach-v2` flow, hand back for the read-through step.

Never return a post below 8/10 or with `Ethics: pending`.

## Log the scan (terminal — fire-and-forget, once per finalized post)
After step 6, before/alongside returning (single writer; skills NEVER inline-append):
1. Mint `scan_id` = a fresh UUID (one per finalized post).
2. Build the record: `client_slug` = `active_brand_slug`, `mode` = `active_mode`, `project`, `platform`, `caller` = `"post-writer-v2"`, `overall` + the 7 `dims` + `gate` (the FINAL verdict after the ethics gate — may be `BLOCKED-compliance`/`BLOCKED-ethics`) + `voice_audit`, `top_fix_tags` (**client mode: ONLY from CLIENT_FIX_VOCAB** — weak-hook, no-curiosity-gap, low-emotion, not-shareable, voice-drift, off-polarity, platform-misfit, cta-buried, compliance-risk, off-wedge), `image_version`, `post_ref` = a pointer into the client folder (never the body). **Never set `post_excerpt` in client mode** (self mode may include a ≤120-char excerpt).
3. **Write the record with the Write tool** to `<scratchpad>/scan-post-writer-v2-<scan_id>.json` (Write handles quoting/UTF-8 — never hand-quote JSON into a shell).
4. Run: `node "${CLAUDE_PLUGIN_ROOT}/scripts/log-scan.js" --in "<that path>"`.
5. **Fire-and-forget:** a `log-scan.js` failure surfaces (stderr + errors.log) but NEVER blocks or alters the returned post. NEVER inline-append to any registry file.

**Field format (a mismatch = silent no-log — the writer rejects it):** `scan_id` = a v4 UUID. `platform`/`project`/`image_version` must be **bare tokens** (no spaces or slashes) — e.g. `instagram`, `ig-reels`, `x-threads`, `linkedin`, `facebook`. The 7 `dims` keys are EXACTLY `hook_strength, curiosity_specificity, emotional_charge, share_worthiness, voice_match, polarity, platform_fit` (each 0–10). `post_ref` is a path under the client's project folder (e.g. `{slug}-posts/post-10.md`), never `..`, never the body.
