---
type: gou-gold-standard
tags:
  - edit-map
  - cut-map
  - video-edit
  - transcript
  - editor-handoff
  - example-collective-style
  - interactive-html
  - surgical-cuts
scope: workflow
applies_to:
  - transcript-extractor-plus
  - sixth-sense-scissors
  - sixth-sense-sage
  - sixth-sense
  - watch
  - overlay-director
  - ad-copy-forge
kind: policy
status: stable
qualified_by: <your-username>
qualification_date: 2026-06-29
qualification_score: 9
last_validated: 2026-06-29
version: 1
replicable: true
confidence: high
pii_firewall: true
redaction_status: universal
source_session: "<your-related-note>"
aliases:
  - editor cut map
  - edit map format
  - cut map template
  - surgical cut map
description: "Gold-standard FORMAT for the editor cut-map deliverable when
  tightening a long talking-head/interview recording: example-collective-style full transcript
  in order, every removed line struck-through IN CONTEXT with exact words out +
  a coherence pass, gems in a ranked clip table, built script-first via an
  SRT->decision-map generator, shipped as an interactive HTML page (collapsible
  sections, sidebar TOC, search/highlight) deployed to Vercel. Fires for any
  transcript/video-edit skill producing a human-editor handoff. Never generalize
  a cut."
related:
  - "<your-related-note>"
  - "<your-related-note>"
  - "<your-related-note>"
  - "<your-related-note>"
  - "<your-related-note>"
  - "<your-related-note>"
  - "<your-related-note>"
  - "<your-related-note>"
---
# GOU Gold Standard — Editor Cut Map Format (transcript / video edit)

## The Insight

When the job is to **tighten a long talking-head / interview recording and hand it to a human editor**, the deliverable is an interactive **Editor Cut Map**: the **full transcript, in order**, with every removed line shown struck-through **in context** (the exact words out + a coherence check), the strongest lines pulled to a ranked **Gems** table, wrapped in an interactive HTML page (collapsible sections, sidebar TOC, search/highlight) deployed to a live URL. It is built **script-first** — the cut map IS the source of truth; the editor cuts the video to match it, then re-transcribes to verify.

## Why It's Gold

- **The editor needs the cut IN CONTEXT, not a stripped list.** <your-name>, 2026-06-29: *"the lines that are being removed need to be given context. Just look at how the one for example-collective was."* A list of removals with no surrounding transcript is unusable.
- **You never generalize a cut.** *"Compress the résumé to ~12s"* is banned — that's a target, not an edit. Every cut is the **exact line + the exact words removed + a coherence pass** (with those words gone, does what remains still read?). This is the discipline that took the deliverable from a ~7 to a 9.
- **Verbatim text is pulled programmatically from the SRT** (zero transcription drift — a direct instance of the CLAUDE.md Fidelity Principle). Hand-retyping the transcript introduces drift and fails the fidelity bar.
- Counsel-validated across three independent panels (gem calls, timing fidelity to 9.8, content/retention) before ship.

## The Non-Negotiables (the format rules)

1. **Full transcript, in order.** Removed lines appear in their surrounding context, struck-through — never a stripped "edited lines only" list (<your-name> rejected that variant explicitly).
2. **Never generalize a cut.** Always: the exact line → the exact words removed → the coherence pass. The notes column literally shows the flow, e.g. *"Flow: '…I help them' → 'I also DJ produce.'"* Like the example-collective-example-contact `IMG_8960_edit-map` (the canonical reference — in the editor's project Dropbox; see <your-related-note> for the example-collective lineage).
3. **Partial / within-line cuts are surgical too.** When a line is half-kept (TRIM), name the kept words vs the cut words — never "tighten this."
4. **Verbatim from the SRT, programmatically.** Author a tagged decision-map; a generator pulls the verbatim text per run straight from the SRT. No hand-typing.
5. **KEEP runs merged for readability; edited lines shown granularly.** Untouched stretches collapse into one verbatim row so the eye goes to the cuts; CUT/TRIM rows stay line-level.
6. **Timecodes verified against the SRT to ±2s** (Copy Forensics audit, below).
7. **Script-first.** The cut map is the source of truth. Cut the video to match it, then re-transcribe the cut to verify (hand off to <your-related-note>). See <your-related-note>.

## Architecture — decision-map → generator

The repeatable build (reference implementation: a `build_editmap.py`-style generator):

1. **Parse the SRT** into entries `(idx, start_s, end_s, verbatim_text)`.
2. **Author a decision map** = a list of `(entry_start, entry_end, tag, note)` runs covering EVERY entry (assert full coverage, no gaps). Tags:
   - `K` keep · `C` cut (full run removed) · `P` partial-trim (keep the run but cut specific words, named in the note) · `G` gem (keep + clip pull) · `S` salvage (re-capture as text/VO) · `Q` interviewer question.
3. **Generate the HTML**: pull verbatim text per run from the SRT, merge contiguous `K` runs, render rows. `C` rows are struck-through; the **notes column carries the coherence check** (`Flow: "<kept-before>" → "<kept-after>"`). `G`/`S` rows are highlighted.
4. **Coverage assertion** in the generator: every transcript entry index is covered exactly once.

This keeps the editorial judgment in the decision-map (human-authored) and guarantees the displayed transcript is byte-faithful to the source.

## The Gems table (clip pulls)

- A **ranked** table of the strongest, most authentic lines — these double as Reels/Shorts pulls.
- **Clip hygiene:** specify clip-IN / clip-OUT points trimmed *inside the words* — skip leading stammers ("they tried tried they"), end before a dangling "and." A gem's entry-start timecode is often a few seconds before the spoken phrase; give the phrase's real in-point.
- **SALVAGE flag (💾):** lines that are AI-output read off-screen, or garbled audio, get marked re-capture-as-text/VO — do NOT cut them as talking-head, and don't let an adjacent garbled-audio cut delete them.

## Caption-fix section

List Whisper proper-noun / term mis-hears to fix in **captions, not cuts** (e.g. a name conflated, a foreign-language term mangled). Pairs with <your-related-note>.

## Counsel review flow (which panel for what)

| Concern | Panel | Bar |
|---|---|---|
| Gem-vs-drag, voice, vulnerability calls | Podcast All-Star #42 (Bartlett / Ferriss / Watkins) | hardened to ≥9 |
| **Timing-mark fidelity vs the SRT** | Copy Forensics #39 (Georgi / Bencivenga / Halbert) | **9.8** |
| Content / retention (is the *edit* good for the platform) | YouTube Creator #57 (Abdaal / Galloway / D'Avella) | flags macro structure |
| After the editor cuts the video | <your-related-note> | ≥98% |

Run agent-mode; each member scores + flags + proposes line edits; synthesize, apply, re-verify.

## Interactive HTML spec (every detail)

**Layout:** CSS grid, sticky left sidebar (~250px) + main; max-width ~1440px; responsive collapse to single column under ~820px.

**Sidebar:** title; a **search box**; **Expand all / Collapse all** buttons; a **TOC** of every section with scroll-spy active-highlight (IntersectionObserver) and a per-section cut-count badge.

**Collapsible sections:** each section (Gems, Intro, each answer, Demo, Editor Notes) is its own `<section class="sec">` with a clickable `<h3 class="sec-h">` (caret rotates; `.collapsed` hides the body via display:none).

**Search + highlight:** debounced input → `TreeWalker` over the main content's text nodes, wrapping matches in `<mark class="hl">` (skip `script/style/thead/.sec-meta/.badge`). **Enter cycles** matches (Shift+Enter back) with a `n / N` counter; sections containing a hit auto-expand; empty query clears all marks (unwrap + normalize). Escape the regex special chars in the query.

**Content order:** H1 + subtitle · 4-up stats grid · changelog (process note: example-collective-style, surgical, counsel-applied) · "How to use" info box · legend · **Gems** section · **edit-map sections** (Intro kept-whole + one per answer + Demo) · **Editor Notes** (where the drag lives, clip hygiene, salvage, caption fixes) · footer (provenance + companion file list).

**Design tokens (example-collective dark/amber):** `--bg:#0d0d0d`, `--accent:#ffb938`, `--gold:#ffd76b`; row tags → keep green `#5fd065`, cut orange `#ef7350` (struck-through, `opacity:.72`), trim amber `#e0b84a`, gem gold, salvage purple `#d8c0ff`; **Consolas monospace timecodes**; 3px left-border tint per tag; `<mark.hl>` amber, `.cur` bright. Add `<link rel="icon" href="data:,">` to suppress the favicon 404 / keep the console clean.

## Deploy + verify

- **Deploy via the Vercel CLI from an ISOLATED folder**: `cd <deploy-folder> && vercel deploy --prod --yes`. The folder contains only `index.html`.
- **DO NOT use the no-parameter MCP `deploy_to_vercel`** — it deploys the *current project / cwd*, which can be `~/.claude` (full of configs/secrets). Always scope the deploy to a clean folder.
- Page `<meta name="robots" content="noindex, nofollow">`; **verify it's actually public** — `curl` for HTTP 200 and grep for an auth wall (new Vercel projects can have Deployment Protection that gates the URL behind login).
- **Browser-verify the interactivity with Playwright** before declaring done: assert section count, call `toggleSec` (collapse toggles), call the search fn (mark count + counter), `expandAll(false)` collapses all. The favicon 404 is the only acceptable console error.
- Save the generated HTML into the project's deliverable folder too (scratchpad is session-ephemeral).

## When to Apply

Fires when a transcript/video-edit skill is **handing a long recording to a human editor to tighten**: interview, self-interview, talking-head, VSL, podcast, co-working session. Also when the user says "trim it down / it drags / cut the dragging parts" on a long take.

## When NOT to Use

- **Short-form clip cutting** where the clip range is already chosen → use <your-related-note> + Scissors, not a full cut map.
- **Pure transcription** with no edit intent → just deliver the `.txt`/`.srt`.
- **Machine-driven auto-cut** (the editor wants a silence-cut EDL, not editorial judgment) → that's the Scissors mechanical path.
- When the source is so short the full transcript fits on one screen — the example-collective single-table form is enough; the sidebar/collapse machinery is overkill.

## Empirical Validation

N=1, battle-built. **Voice DNA Interview** — <your-name>'s own 29-minute self-interview (5 Voice DNA questions + an AI-build demo), 2026-06-29. The format went through ~6 iterations under live direction, converging on these rules:

- First pass used generalized cuts ("compress résumé to ~12s") → <your-name>: *"we never generalize when we are doing cuts… it's always specific to what the line is and then what are the words that we are taking out, and then we do another pass: does what remains make sense?"* → rewrote to surgical line-level cuts with coherence passes.
- A stripped "edited lines only" variant was rejected → *"the lines that are being removed need to be given context… look at how the one for example-collective was."* → full transcript in context.
- A separate "rewritten tightened script" block (no timecodes) caused confusion → dropped; the edit map itself is the source of truth.
- **Counsel:** Podcast All-Star #42 (gem calls 7.83→~9, reinstated a raw confession beat), Copy Forensics #39 (**timing fidelity 9.8/10** vs the SRT, fixed 6 drifts), YouTube Creator #57 (content review; called the line-cuts "9-grade, editor-ready"; flagged macro structure as a separate parked decision).
- **<your-name> sign-off:** "this is great" after the example-collective-style + interactive build. Playwright-verified interactivity (collapse, search, TOC) live at a Vercel URL.

## Cross-Skill Applicability

| Skill | How it applies |
|---|---|
| `transcript-extractor-plus` | **Primary producer** — after transcribe + cut-analysis, emit this cut map for the editor handoff. |
| `sixth-sense-scissors` | Consumes the cut map's decisions to cut, then runs the fidelity loop on the result. |
| `sixth-sense-sage` / `sixth-sense` | When a long source is being prepped for an editor rather than auto-clipped. |
| `watch` | When asked to map cuts on a long video for a human editor. |
| `overlay-director` | The kept/gem segments feed the overlay build. |
| `ad-copy-forge` | When a long talking-head video is the source, the gem table + tightened keeps feed forge ingestion. |

Skills should reference this note via the hub's skinny-pointer pattern (`vault_source: gold-standards/editor-cut-map-format`) and load it as calibration before producing a cut map.

## Connections

- <your-related-note> — the next step after the editor cuts (re-transcribe → compare → ≥98%).
- <your-related-note> — the method this format embodies.
- <your-related-note> — the caption-fix section's companion.
- <your-related-note> — how the gem pulls become short-form clips.
- <your-related-note> — "never generalize a cut" is an instance of executing the explicit edit, not a paraphrase.
- The example-collective-example-contact `IMG_8960` edit-map is the visual design lineage (full-transcript table, status-tinted rows, in-context cuts).
