---
vault_source: gold-standards/editor-cut-map-format
last_synced: 2026-06-29
applies_when: source material is a long video being tightened into an editor cut-map before forge ingestion
---

# Pointer — Editor Cut Map Format (gold standard)

This file is a **pointer**. The canonical gold standard lives in the your vault:
**`gold-standards/editor-cut-map-format.md`** (read it in full before producing a cut map).

Load it as calibration BEFORE producing an **editor cut map** — the deliverable that hands a long talking-head / interview / VSL recording to a human editor to *tighten*. For ad-copy-forge specifically: applies when the source is a long video and a tightened cut + gem table feeds forge ingestion. (Note: this is separate from ad-copy-forge's own `gold-standard-fidelity` rubric, which governs generated ad copy — not the cut map.)

## Non-negotiables (summary — the vault note is the full spec)

- **Full transcript, in order.** Every removed line shown struck-through **IN CONTEXT** — never a stripped "edited lines only" list.
- **NEVER generalize a cut.** Always the exact line + the exact words removed + a **coherence pass** (with those words gone, does what remains still read? — show the before→after flow in the notes column). "Compress to ~12s" is banned.
- **Verbatim from the SRT, programmatically** (decision-map → generator). Zero hand-typing → zero drift (Fidelity Principle).
- **Script-first:** the cut map IS the source of truth; cut the video to match, then re-transcribe to verify → hand to `gold-standards/fidelity-verification-loop-for-clip-cutting`.
- **Gems table** (ranked clip pulls) + clip-hygiene (trim inside the words) + **salvage** flags (AI-read-aloud / garbled → re-capture as text/VO).
- **Interactive HTML:** collapsible sections + sticky sidebar TOC (scroll-spy) + search/highlight (Enter cycles). Deploy via the **Vercel CLI from an isolated folder** — NOT the no-param MCP deploy (it deploys the cwd, which can be `~/.claude` with secrets). `noindex` + verify the URL is actually public. Playwright-verify the interactivity before declaring done.
- **Counsel:** gem-vs-drag → Podcast All-Star #42 · timing fidelity (±2s vs SRT) → Copy Forensics #39 (gate 9.8) · content/retention → YouTube Creator #57.

If this pointer and the vault note disagree, **the vault note wins** (canonical). Plugin git history is the recovery path if the vault is unreachable.
