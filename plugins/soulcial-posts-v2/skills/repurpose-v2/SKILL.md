---
name: repurpose-v2
description: Turn one long-form input (blog, newsletter, YouTube transcript, script, talk) into a fixed set of platform-native pieces (3 for LinkedIn, 5 X/Twitter threads, 2 short-form video scripts) — each opened with a tested hook, sized to its platform, in the user's (or a client's) voice, graded 8+, and ethics-cleared. Use it when the user says "repurpose this," "turn this into posts," or "give me a week of content from this." Blotato repurpose adapted to the user's voice + ethics.
allowed-tools: Read, Write, Edit, Bash, Glob, AskUserQuestion
---

> **Paths:** every `references/` and `scripts/` path in this skill, and in the reference files it loads (a bare `social-spine/x.md` = `references/social-spine/x.md`), is relative to this plugin's root folder, `${CLAUDE_PLUGIN_ROOT}` (two levels above this skill's base directory). Never resolve them against this skill's own folder or your working folder. When you spawn subagents, pass them the absolute path.

# Repurpose v2

One long asset → a week of platform-native posts. **Public-copy exit** — runs the ethics gate on every output before ship.

> **Source & Attribution:** Adapted (not copied) from Blotato's `repurpose` (blotato.com · GitHub Blotato-Inc/blotato-skills). Blotato's skills remain unmodified.

## Spine
Mode/brand/voice via `social-spine/mode-gate.md` + `voice.md`; brand context (wedge) via `brand-context.md`.

## Workflow (per `references/repurpose-framework.md`)
1. **Extract themes.** 1 central thesis + 3–7 supporting points + every concrete asset (numbers, names, stories, wedge-adjacent takes). List back in 2–3 lines — don't make the user approve an outline.
2. **Map to outputs:** 3 LinkedIn (professional/story angles) · 5 X threads (punchy sequences) · 2 short-form scripts (visual/emotional). A theme can show up in two formats only with a different angle.
3. **Open every output with a hook** from `references/viral-hooks-library.md` — rotate categories through the batch (identical openings read like a template). Match category to theme (result→Receipt, opinion→Contrarian, mistake→Negative Frame).
4. **Write each to its platform** per `references/platform-specs.md` (LinkedIn hook in first 2 lines, ~1,200–1,500 chars; X thread tweet-1 is the hook, 4–7 beats; short-form = HOOK/BODY/CTA under 45s spoken). Native rewrite, never copy-paste. Voice per `active_voice_path`; cut transcript filler.
5. **Grade** each with `references/virality-grader.md`; loop the hook until 8+.
6. **Ethics gate** each output via `social-spine/ethics-gate.md` before ship; set `Ethics: cleared` per batch only when all pass.
7. **Return** grouped by platform with theme + hook category + score headers. Offer `post-scheduler-v2`. On any save, append to `posts-shipped.log`.

## Log the scan (terminal — fire-and-forget, once per FINALIZED output)
Each finalized output (each LinkedIn post / X thread / short-form script) gets its OWN scan record. Single writer; skills NEVER inline-append. Per output:
1. Mint `scan_id` = a fresh UUID (one per finalized output).
2. Build the record: `client_slug` = `active_brand_slug`, `mode` = `active_mode`, `project`, `platform` (this output's platform), `caller` = `"repurpose-v2"`, `overall` + the 7 `dims` + `gate` (the FINAL verdict after the ethics gate) + `voice_audit`, `top_fix_tags` (**client mode: ONLY from CLIENT_FIX_VOCAB** — weak-hook, no-curiosity-gap, low-emotion, not-shareable, voice-drift, off-polarity, platform-misfit, cta-buried, compliance-risk, off-wedge), `image_version`, `post_ref` = a pointer into the client folder (never the body). **Never set `post_excerpt` in client mode** (self mode may include a ≤120-char excerpt).
3. **Write the record with the Write tool** to `<scratchpad>/scan-repurpose-v2-<scan_id>.json` (Write handles quoting/UTF-8 — never hand-quote JSON into a shell).
4. Run: `node "${CLAUDE_PLUGIN_ROOT}/scripts/log-scan.js" --in "<that path>"`.
5. **Fire-and-forget:** a `log-scan.js` failure surfaces (stderr + errors.log) but NEVER blocks or alters the returned outputs. NEVER inline-append to any registry file.

**Field format (a mismatch = silent no-log — the writer rejects it):** `scan_id` = a v4 UUID. `platform`/`project`/`image_version` must be **bare tokens** (no spaces or slashes) — e.g. `instagram`, `ig-reels`, `x-threads`, `linkedin`, `facebook`. The 7 `dims` keys are EXACTLY `hook_strength, curiosity_specificity, emotional_charge, share_worthiness, voice_match, polarity, platform_fit` (each 0–10). `post_ref` is a path under the client's project folder (e.g. `{slug}-posts/post-10.md`), never `..`, never the body.
