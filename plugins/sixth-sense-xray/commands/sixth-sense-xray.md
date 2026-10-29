---
description: Visual reverse-engineering — analyzes video effects and produces interactive CapCut recreation playbooks with YouTube tutorial links, and/or a HyperFrames playbook that /overlay-director import learns from
---

> **Paths:** every `references/`, `scripts/`, `assets/`, `templates/` (etc.) path in this file is relative to this plugin's folder, `${CLAUDE_PLUGIN_ROOT}`. Read them as `${CLAUDE_PLUGIN_ROOT}/references/...`, never relative to your current working folder. When you spawn subagents, pass them the absolute path.

# SixthSense X-Ray — Visual Reverse Engineering

## Overview

SixthSense X-Ray analyzes video frames to reverse-engineer every visual effect, template, and transition. It produces an interactive HTML playbook with step-by-step CapCut recreation instructions and validated YouTube tutorial links, and/or a **HyperFrames playbook** (`HYPERFRAMES_PLAYBOOK_{slug}.md`) that `/overlay-director import` reads to learn the video's editing methods. The editor choice is made at scan setup (Phase 1, Step 4b).

**Part of the SixthSense family:**
- `/sixth-sense` → finds clip-worthy moments (words + emotion + structure)
- `/sixth-sense-scissors` → cuts and cleans video (audio + silence + timing)
- `/sixth-sense-xray` → reverse-engineers visual effects (what you SEE) ← THIS SKILL

## File Locations

- **Registry:** `~/.claude/projects/sixth-sense-xray/registry.json`
- **Agent prompts:** `references/agent-prompts.md`
- **HTML template:** `references/html-template.md`
- **CapCut mapping:** `references/capcut-mapping.md`
- **HyperFrames mapping:** `references/hyperframes-mapping.md` (A6 rules + how to find Overlay Director's live files)
- **Micro-scan algorithm:** `references/micro-scan-algorithm.md`

## Counsel

Visual Visionary Counsel (#26): Justin Brown (Primal Video), Collin Michael, Meredith Marsh (VidProMom), Steve Jobs, Greg Hogg

---

## Registry Schema

```json
{
  "projects": {
    "slug": {
      "name": "Human-readable name",
      "slug": "slug",
      "video_path": "C:\\path\\to\\video.mp4",
      "output_dir": "C:\\path\\to\\output\\slug",
      "duration_seconds": 0,
      "duration_formatted": "0m00s",
      "resolution": "1920x1080",
      "fps": 30,
      "scene_count": 0,
      "frame_count": 0,
      "mosaic_count": 0,
      "scan_config": {
        "density": "smart",
        "editor": "capcut | hyperframes | both",
        "video_type": "vsl"
      },
      "hyperframes": {
        "od_reference_dir": null,
        "od_type": null
      },
      "status": {
        "preprocessing": "pending",
        "configure": "pending",
        "A1_effects": "pending",
        "A2_typography": "pending",
        "A3_color": "pending",
        "microscan": "pending",
        "A4_capcut_translate": "pending",
        "A5_gaps_analyst": "pending",
        "A6_hyperframes_translate": "pending",
        "youtube_research": "pending",
        "playbook": "pending",
        "hf_playbook": "pending",
        "deploy": "pending"
      },
      "agent_outputs": {
        "A1": "agent1_effects_transitions.md",
        "A2": "agent2_typography_text.md",
        "A3": "agent3_color_composition.md",
        "microscan": "microscan_findings.md",
        "A4": "capcut_translated.md",
        "A5": "gaps_analysis.md",
        "A6": "hyperframes_translated.md",
        "youtube": "youtube_validated.json"
      },
      "results_summary": null,
      "created": "YYYY-MM-DD",
      "last_updated": "YYYY-MM-DD"
    }
  }
}
```

---

**Editor-dependent steps.** Steps that don't apply to the chosen editor are set to `"skipped"` at
Phase 1, Step 4b, and resume logic passes over them:

| Step | `capcut` | `hyperframes` | `both` |
|------|:--------:|:-------------:|:------:|
| A4 CapCut Translator | run | skipped | run |
| A5 Gaps Analyst | run | run | run |
| A6 HyperFrames Translator | skipped | run | run |
| YouTube research (Phase 5) | run | skipped | run |
| HTML playbook + CapCut .md (Phase 6) → `playbook` | run | skipped | run |
| HyperFrames playbook (Phase 6, Step 6b) → `hf_playbook` | skipped | run | run |
| Deploy (Phase 7) | offer | local save only | offer |

**Legacy projects** (registered before the editor choice existed) have no `A6_hyperframes_translate`
or `hf_playbook` key: treat `editor` as `capcut` and both as `skipped`. To add a HyperFrames playbook to an old project,
use Phase 8's "Add HyperFrames playbook" option.

---

## PREFLIGHT — run this BEFORE the menu, every session

```bash
ffmpeg -version 2>/dev/null | head -1     # required
ffprobe -version 2>/dev/null | head -1    # required
yt-dlp --version 2>/dev/null              # optional — only for URL sources
```

If ffmpeg/ffprobe are missing, say so with the platform-correct install command and stop.
Windows: `winget install ffmpeg` · macOS: `brew install ffmpeg` · Linux: package manager.
If only `yt-dlp` is missing, that is not fatal — say so and note that URL sources fall
back to WebFetch, then continue.

## PHASE 0: Main Menu

**Every session starts here.**

1. Read `~/.claude/projects/sixth-sense-xray/registry.json`
   - If it doesn't exist, create it with `{ "projects": {} }`

2. Build the dashboard. For each project in the registry:

```
╔══════════════════════════════════════════════════════════════╗
║  SIXTHSENSE X-RAY — VISUAL REVERSE ENGINEERING              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  [PROJECT NAME]                                              ║
║  Video: [filename] ([duration])                              ║
║  Preprocessing:  ████████████ COMPLETE                       ║
║  Configure:      ████████████ COMPLETE                       ║
║  Scanners:       ████████░░░░ 2/3                            ║
║  Post-Process:   ░░░░░░░░░░░░ 0/3                            ║
║  Micro-Scan:     ░░░░░░░░░░░░ PENDING                       ║
║  YouTube:        ░░░░░░░░░░░░ PENDING                       ║
║  Playbook:       ░░░░░░░░░░░░ PENDING                       ║
║  Last worked: [date]                                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

Progress bar rules (12 chars): `█` = complete, `░` = pending.
- Scanners: count A1 + A2 + A3 statuses "complete" → X/3
- Post-Process: count A4 + A5 + A6 statuses "complete" → X/N, where N = how many of the three are not "skipped" (2 for capcut or hyperframes, 3 for both)
- Other phases: binary COMPLETE or PENDING (show SKIPPED for a step the editor choice skipped)

3. Present options via AskUserQuestion:
   - For each project: "Resume [Name]" with next recommended action
   - "New Scan" — start fresh

4. **Resume logic:** Walk status in order: preprocessing → configure → A1/A2/A3 → microscan → A4 → A5 → A6 → youtube → playbook → hf_playbook → deploy. Find the first step that is neither "complete" nor "skipped".

---

## PHASE 1: Video Intake + Preprocessing

**Triggered by:** "New Scan" or resume at preprocessing step.

### Step 1: Get Video Path
AskUserQuestion:
- "Paste video file path" (Other — user types)
- "Browse recent" — list .mp4/.mov/.mkv files in common locations (Downloads, Dropbox, Desktop)

Verify file exists with `ls -la "{path}"`.

### Step 2: Video Metadata
```bash
ffprobe -v quiet -print_format json -show_format -show_streams "{video_path}"
```
Extract: duration_seconds, resolution (width x height), fps, codec.

### Step 3: Scan Density
AskUserQuestion with 3 options:

**Quick Scan** (recommended for videos >20 min)
- "Overview every 15s + scene changes. No micro-scan. Fast."
- Sets density: "quick"

**Smart Scan** (recommended for 5-20 min videos)
- "Overview every 5s + scene changes + micro-scan at change points. Best balance."
- Sets density: "smart"

**Deep Scan** (recommended for videos <15 min)
- "Overview every 2s + full micro-scan. Catches everything."
- Sets density: "deep"

### Step 4: Video Type
AskUserQuestion:
- "VSL (Video Sales Letter)" — applies 5-act structure analysis (Hook → Education → Offer → Proof → Close)
- "Short-form (Reels/TikTok)" — fast-cut analysis, hook-first focus
- "Educational / Tutorial" — longer holds, diagram focus
- "Generic" — effects + transitions only, no pacing interpretation

### Step 4b: Output Editor
AskUserQuestion: "Who will rebuild these effects?"
- **"Both (Recommended)"** — CapCut HTML playbook for a human editor + a HyperFrames playbook Overlay Director learns from. Sets editor: "both"
- **"CapCut (human editor)"** — the original playbook: CapCut steps + YouTube tutorials. Sets editor: "capcut"
- **"Overlay Director (auto-build overlays)"** — only the HyperFrames hand-off. Skips the CapCut translator, YouTube research and HTML. Sets editor: "hyperframes"

Step 8 writes the choice into the registry, with skipped steps set per the editor table under
Registry Schema.

If editor is `hyperframes` or `both`, locate Overlay Director now (`references/hyperframes-mapping.md`,
"Live Overlay Director sources"). Step 8 stores the path in `hyperframes.od_reference_dir` and the
mapped type in `hyperframes.od_type`. Not found → tell the user, then AskUserQuestion: "Continue without library
matching" or "Switch to CapCut only".

### Step 5: Scene Detection
```bash
ffmpeg -i "{video_path}" -vf "select='gt(scene,0.3)',showinfo" -vsync vfr -f null - 2>&1 | grep "pts_time"
```
Count scene changes. Store timestamps for micro-scan triggers.

### Step 6: Frame Extraction
First create the output folder (slug = lowercase-hyphenated video filename): `mkdir -p "{output_dir}"`. Step 8 records it.
Determine interval from density: Quick=15, Smart=5, Deep=2 seconds.
```bash
ffmpeg -i "{video_path}" -vf "fps=1/{interval},drawtext=text='%{pts\:hms}':x=10:y=H-30:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.7:boxborderw=4" -q:v 2 "{output_dir}/overview_%04d.jpg" -y
```

### Step 7: Mosaic Generation
```bash
ffmpeg -i "{video_path}" -vf "fps=1/{interval},drawtext=text='%{pts\:hms}':x=10:y=10:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6:boxborderw=3,scale=480:270,tile=3x3" -q:v 2 "{output_dir}/mosaic_%03d.jpg" -y
```

Count mosaics generated. Store in registry.

### Step 8: Create Registry Entry
Generate slug from video filename (lowercase, hyphens, no extension).
Create output directory. Write registry with all metadata.
Set `status.preprocessing = "complete"`, `status.configure = "complete"`.

→ **Proceed to Phase 2.**

---

## PHASE 2: Deploy Visual Scanners

**Triggered by:** Resume at any Scanner step, or after Phase 1.

### Critical: Prompt Injection Pattern

Task subagents CANNOT read plugin reference files. The orchestrator MUST:
1. Read `references/agent-prompts.md`
2. Extract each Scanner's prompt section (between triple-backtick fences)
3. Resolve ALL `{VARIABLE}` placeholders with real values from the registry:
   - `{MOSAIC_FILES}` → "Read these mosaic files:\n- {output_dir}/mosaic_001.jpg\n- {output_dir}/mosaic_002.jpg\n..." (list all)
   - `{DETAIL_FRAMES}` → select ~10 evenly-spaced overview frames for detail: "Read these individual frames:\n- {output_dir}/overview_001.jpg\n..."
   - `{SCAN_CONFIG}` → JSON scan_config from registry
   - `{VIDEO_DURATION}` → duration_formatted
   - `{VIDEO_FILENAME}` → video filename
   - `{OUTPUT_DIR}` → output_dir path
   - `{VIDEO_TYPE}` → video type from scan_config
4. Append the Shared Rules section to each prompt
5. Inject the complete, resolved prompt into the Task instruction

### Deploy 3 Scanners in PARALLEL

Before launching, update registry: set A1_effects, A2_typography, A3_color to "in_progress".

Launch 3 Agent subagents simultaneously:

**Agent 1: A1 Effects Scanner** — subagent_type: "general-purpose"
**Agent 2: A2 Typography Scanner** — subagent_type: "general-purpose"
**Agent 3: A3 Color Scanner** — subagent_type: "general-purpose"

All three run in background (`run_in_background: true`).

### Validation (after each Agent returns)

For each scanner output, verify:
1. **File exists** at the expected path
2. **Contains expected section header:**
   - A1: `## Effect Catalog`
   - A2: `## Text Catalog`
   - A3: `## Composition Catalog`
3. **Minimum line count:** A1 ≥ 80, A2 ≥ 100, A3 ≥ 80

If validation fails:
- Set that agent's status to "failed"
- Report to the user which agent failed and why
- Offer to re-run that specific agent

If validation passes:
- Set status to "complete"
- Extract summary counts for dashboard

### Post-Scanner Summary

```
╔══════════════════════════════════════════════════════════════╗
║  SCANNER DEPLOYMENT COMPLETE                                 ║
╠══════════════════════════════════════════════════════════════╣
║  A1 Effects Scanner:     ✓ [X] effects  | [X] transitions   ║
║  A2 Typography Scanner:  ✓ [X] texts    | [X] templates     ║
║  A3 Color Scanner:       ✓ [X] layouts  | [X] colors        ║
╚══════════════════════════════════════════════════════════════╝
```

AskUserQuestion:
- "Continue to Micro-Scan + Post-Processing (Recommended)"
- "Review Scanner results first"
- "Re-run a Scanner"

→ **Proceed to Phase 3.**

---

## PHASE 3: Auto Micro-Scan

**Skip entirely if density = "quick".** Set microscan status to "complete" (skipped) and proceed.

### For Smart density:
Use scene-change timestamps from Phase 1 Step 5 as trigger points.

### For Deep density:
Use scene-change triggers PLUS compute pixel luminance diff between adjacent overview frames.

Read `references/micro-scan-algorithm.md` for:
- The luminance diff detection command
- The 15% threshold (38 on 0-255 scale)
- The overlap merge rule (within 20s → single zone)

### Micro-Scan Extraction
For each trigger zone:
```bash
mkdir -p "{output_dir}/microscan_{zone_id}"
ffmpeg -ss {zone_start} -to {zone_end} -i "{video_path}" -vf "fps=10,drawtext=text='%{pts\:hms}':x=10:y=H-30:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.7:boxborderw=4,scale=480:270,tile=3x3" -q:v 2 "{output_dir}/microscan_{zone_id}/mosaic_%03d.jpg" -y
```

### Deploy Micro-Scan Agent
Use the same 3 scanner prompts but with modified instructions:
- Add micro-scan mosaics to the input
- Add: "Focus on what the overview missed. Look for: animations in progress, text typing, elements sliding, opacity changes, short-lived graphics (<3s), edge effects."
- Add: "Do NOT re-catalog effects already found. Output SUPPLEMENTARY findings only."

Write to: `{output_dir}/microscan_findings.md`

Validate: file exists, minimum 20 lines.
Set `status.microscan = "complete"`.

→ **Proceed to Phase 4.**

---

## PHASE 4: Post-Processing

**Deploy Agent 4 (CapCut Translator), then Agent 5 (Gaps Analyst), then Agent 6 (HyperFrames Translator). Sequential. Skip any agent whose status is "skipped".**

### Agent 4: CapCut Language Translator
*Runs when editor is `capcut` or `both`.*

1. Read all scanner outputs (A1, A2, A3) + micro-scan findings (if exists)
2. Read `references/capcut-mapping.md`
3. Extract A4 prompt from agent-prompts.md
4. Resolve variables:
   - `{SCANNER_OUTPUTS}` → concatenated text of all scanner + microscan files
   - `{MICROSCAN_RESULTS}` → microscan_findings.md contents (or "No micro-scan performed" if Quick)
   - `{CAPCUT_MAPPING}` → full contents of capcut-mapping.md
5. Inject and deploy as Agent subagent

Validate: `capcut_translated.md` exists, contains `## MERGED TEMPLATE LIST` and `## MERGED TRANSITION LIST`, minimum 150 lines.
Set `status.A4_capcut_translate = "complete"` or "failed".

### Agent 5: Gaps & Cuts Analyst

1. Read all scanner outputs + micro-scan findings
2. Extract A5 prompt from agent-prompts.md
3. Resolve variables: `{SCANNER_OUTPUTS}`, `{MICROSCAN_RESULTS}`, `{VIDEO_TYPE}`
4. Inject and deploy

Validate: `gaps_analysis.md` exists, contains `## TRANSITION MAP` and `## TIMESTAMPED RECREATION MAP`, minimum 40 lines.
Set `status.A5_gaps_analyst = "complete"` or "failed".

### Agent 6: HyperFrames Translator
*Runs when editor is `hyperframes` or `both`.*

1. Read all scanner outputs + micro-scan findings + `gaps_analysis.md`
2. Read `references/hyperframes-mapping.md`
3. Build the `{OD_*}` inputs from `hyperframes.od_reference_dir` exactly as the "Live Overlay
   Director sources" table in `hyperframes-mapping.md` says. **That table is the single source for
   what goes in the catalog** (move files read directly, `_proposed/` included, plus the not-found
   fallbacks). Don't build the catalog from `_index.md` alone: it doesn't list every move.
4. Extract the A6 prompt from agent-prompts.md
5. Resolve variables: `{SCANNER_OUTPUTS}`, `{MICROSCAN_RESULTS}`, `{GAPS_ANALYSIS}`,
   `{HYPERFRAMES_MAPPING}`, `{OD_MOVES_CATALOG}`, `{OD_ENTRANCE_TABLE}`, `{OD_PALETTE}`,
   `{OD_SEEK_SAFETY}`, `{SCAN_CONFIG}`, `{VIDEO_FILENAME}`, `{SLUG}`, `{SOURCE_ID}`,
   `{VIDEO_DURATION}`, `{VIDEO_TYPE}`, `{OD_TYPE}`
6. Append Shared Rules, inject and deploy

Validate `hyperframes_translated.md`:
- It exists and has the six H2 headings in order: `## Summary`, `## STYLE PROFILE`,
  `## MOVE MATCHES`, `## NEW MOVE CANDIDATES`, `## STANDARDS PROPOSALS`, `## PORTABILITY FLAGS`.
- The Summary counts match the number of H3 entries in each section. A video with no overlays
  (every section `None.` except flags or style) is valid.
- No `suggested_altitude: global` anywhere (Rule 6).
- Every `entrance_mechanism` is in the injected entrance table (the fallback list when Overlay
  Director wasn't found).
- Every `evidence` field is a list holding `import:{SOURCE_ID}`.
- Every candidate `move_id` matches `^[a-z0-9]+(-[a-z0-9]+){1,5}$`, is at most 48 characters, and
  isn't an active move's id. **A bad name doesn't fail the run:** rename that one candidate to a
  valid kebab-case id (or drop it if no sensible name exists), add a Portability Flag saying so, and
  fix the Summary counts.

On any other failed check, re-deploy A6 once with the failure named. Still failing → status "failed".
Set `status.A6_hyperframes_translate = "complete"` or "failed".

**A6 failed:** set `status.hf_playbook = "failed"` and skip Step 6b. The dashboard shows
"HyperFrames: FAILED (re-run A6 from Phase 8)". The CapCut path, if chosen, carries on as normal.

→ **Proceed to Phase 5** (or straight to Phase 6 if YouTube research is "skipped").

---

## PHASE 5: YouTube Research + Validation

*Runs when editor is `capcut` or `both`. The searches are CapCut tutorials, so a HyperFrames-only scan skips this phase.*

### Deploy 3 Research Agents in PARALLEL

Read Agent 4's output to extract YouTube search terms per template/transition.

Group search terms into 3 batches:
- **Agent A:** Layout techniques (split screens, pillarbox, compositing, B-roll)
- **Agent B:** Text effects (typewriter, gradient text, shadows, animations, title cards)
- **Agent C:** Special effects (overlays, blend modes, keyframes, vignettes, color grading)

Each research agent uses WebSearch to find YouTube tutorials, returning: URL, title, channel, view count.

### URL Validation (CRITICAL)

After all 3 return, validate EVERY URL:

**Primary:** yt-dlp
```bash
yt-dlp --get-title "{url}" 2>/dev/null
```
If yt-dlp returns a title → URL is valid.

**Fallback (if yt-dlp not available):** WebFetch the YouTube URL and check if the page title contains relevant keywords.

**Rules:**
- URL fails validation → discard, mark technique as "no tutorial found"
- Title doesn't match claimed topic → discard
- Maximum 3 validated URLs per template, 2 per transition
- Save validated URLs to `{output_dir}/youtube_validated.json`

Set `status.youtube_research = "complete"`.

→ **Proceed to Phase 6.**

---

## PHASE 6: Playbook Generation

*Steps 1–6 (HTML + CapCut .md) run when editor is `capcut` or `both`. Step 6b runs when editor is
`hyperframes` or `both`. A HyperFrames-only scan goes straight from here to Step 2 (frames), then 6b.*

### Step 1: Read All Inputs
- Agent 4 output: `capcut_translated.md` (templates, transitions, build steps)
- Agent 5 output: `gaps_analysis.md` (timeline, pacing)
- Agent 3 output: `agent3_color_composition.md` (style guide, colors)
- Agent 2 output: `agent2_typography_text.md` (font system)
- YouTube validated URLs: `youtube_validated.json`

### Step 2: Extract Representative Frames
For each template's primary timestamp (CapCut), and for each HyperFrames MATCH and CANDIDATE's first timestamp:
```bash
ffmpeg -ss {timestamp} -i "{video_path}" -frames:v 1 -vf "scale=840:-1" "{output_dir}/frame_{slug}.jpg" -y
```

### Step 3: Read HTML Template
Read `references/html-template.md`
Extract the HTML block between the triple-backtick fence.

### Step 4: Resolve Variables
Using data from all agent outputs, resolve every `{VARIABLE}` in the template:

- Generate `{SIDEBAR_TEMPLATE_LINKS}` — one `<a>` per template from A4 output
- Generate `{SIDEBAR_TRANSITION_LINKS}` — one `<a>` per transition
- Generate `{COLOR_SWATCHES}` — swatch divs from A3 color palette
- Generate `{FONT_TABLE_ROWS}` — table rows from A2 font system
- Generate `{TEMPLATE_CARDS}` — use the Template Card Sub-Template for each template
- Generate `{TRANSITION_CARDS}` — use the Transition Card Sub-Template for each transition
- Generate `{TIMELINE_ROWS}` — timeline rows from A5 output
- Generate `{PACING_TABLE_ROWS}` — pacing table from A5 output
- Generate `{COLOR_EMOTION_ROWS}` — from A3 style guide
- Generate `{AUTHENTICITY_RULES}` — from A3 style guide
- Generate `{ESSENTIAL_VIDEO_LINKS}` — top 4-5 general YouTube links

### Step 5: Write Playbook
Write resolved HTML to: `{output_dir}/XRAY_PLAYBOOK.html`

### Step 6: Generate Markdown Version
Also write a text-only markdown version: `{output_dir}/CAPCUT_PLAYBOOK_{slug}.md`
Same content structure, no HTML/CSS, for reference and archival.

### Step 6b: Generate HyperFrames Playbook
*Only when `status.A6_hyperframes_translate = "complete"`. Set `status.hf_playbook = "in_progress"` first.*

Write `{output_dir}/HYPERFRAMES_PLAYBOOK_{slug}.md`: the frontmatter below, then the full body of
`hyperframes_translated.md`, then a `## FRAMES` section listing each frame **by filename only**
(`frame_<slug>.jpg`, kept next to the playbook) against its MATCH or CANDIDATE number. Don't
rewrite the A6 body; the headings are the import contract.

**No absolute paths in this file.** It may be shared (with a teammate, or into another person's
Overlay Director), and folder paths can carry user and client names. `source_id` identifies the video.

```yaml
---
format: xray-hyperframes-playbook
format_version: 1
source_id: {SOURCE_ID}   # normalized, e.g. final-cut-v2-742s (hyperframes-mapping.md Rule 6)
slug: {slug}
xray_video_type: {video_type}
od_type: {hyperframes.od_type}
generated: YYYY-MM-DD
counts: { matches: N, candidates: N, proposals: N, flags: N }
---
```

Set `status.hf_playbook = "complete"`.

### Step 7: Update Registry
Set `status.playbook = "complete"` if Steps 1–6 ran (CapCut). `hf_playbook` is set by Step 6b.
Populate `results_summary` (omit the keys for whichever editor was skipped):
```json
{
  "template_count": N,
  "transition_count": N,
  "color_count": N,
  "font_count": N,
  "youtube_links": N,
  "playbook_path": "...",
  "html_size_kb": N,
  "hyperframes_playbook_path": "...",
  "hf_matches": N,
  "hf_candidates": N,
  "hf_proposals": N,
  "hf_flags": N
}
```

→ **Proceed to Phase 7.**

---

## PHASE 7: Deploy + Share

**HyperFrames-only scan:** there is no HTML to deploy. Run Option 2 (save locally), set
`status.deploy = "complete"`, and go to Phase 8. The HyperFrames playbook is never deployed: it is an
input file for Overlay Director, not a page.

Otherwise, AskUserQuestion with 3 options:

### Option 1: "Deploy as website (Vercel)"

**Preflight, then confirm — this publishes to a public URL.**

1. Check the CLI is present: `npx vercel --version`. If missing, say so and fall back to
   Option 2 rather than failing here.
2. **Confirm before deploying.** The playbook embeds extracted video frames and analysis
   of the source. If that source is a client's video, deploying puts their frames on a
   public URL. Say that plainly and get a yes.

```bash
mkdir -p "{output_dir}/xray-{slug}"
cp "{output_dir}/XRAY_PLAYBOOK.html" "{output_dir}/xray-{slug}/index.html"
cp "{output_dir}"/frame_*.jpg "{output_dir}/xray-{slug}/"
# The folder name becomes the Vercel project name (--yes links to an existing project of that
# name), so it is per-video (xray-{slug}), never a generic deploy/ that other scans or skills reuse.
# Deploy from this isolated dir — never the no-arg MCP deploy, which publishes
# the current working directory and can sweep up unrelated files.
cd "{output_dir}/xray-{slug}" && npx vercel deploy --prod --yes
```
Returns live URL. Report to user.

### Option 2: "Save locally"
Confirm file locations. List all output files with sizes.

### Option 3: "Deploy + copy to a synced folder"
Deploy to Vercel (same as Option 1).
Then ask the user for a destination (e.g. a Dropbox or OneDrive folder) and copy the output folder there. Never assume a path.

Set `status.deploy = "complete"`.

→ **Proceed to Phase 8.**

---

## PHASE 8: Review + Iteration

### Playbook Summary Dashboard
```
╔══════════════════════════════════════════════════════════════╗
║  SIXTHSENSE X-RAY — PLAYBOOK COMPLETE                       ║
╠══════════════════════════════════════════════════════════════╣
║  Video: [filename] ([duration])                              ║
║  Templates: [N] | Transitions: [N]                           ║
║  Colors: [N] | Fonts: [N]                                    ║
║  YouTube links: [N] validated                                ║
║  Playbook: [output_dir]/XRAY_PLAYBOOK.html                  ║
║  Deploy URL: [vercel URL if deployed]                        ║
║  HyperFrames: [N] matches | [N] new moves | [N] proposals    ║
║  HF Playbook: [output_dir]/HYPERFRAMES_PLAYBOOK_[slug].md    ║
╚══════════════════════════════════════════════════════════════╝
```
Show only the lines for the editor(s) that ran. If `hf_playbook` is "failed", replace the two
HyperFrames lines with `HyperFrames: FAILED (re-run A6 from Phase 8)`.

AskUserQuestion (offer only the options that apply to the editor that ran):
- "Open playbook in browser" — Windows `start "" "{output_dir}/XRAY_PLAYBOOK.html"` · macOS `open "{output_dir}/XRAY_PLAYBOOK.html"` · Linux `xdg-open "{output_dir}/XRAY_PLAYBOOK.html"`
- "Show template list" — display A4 merged template/transition names
- "Send to Overlay Director" — invoke the `overlay-director` skill with args `import "{output_dir}/HYPERFRAMES_PLAYBOOK_{slug}.md"`. Overlay Director runs its own review and approval gates; X-Ray writes nothing into it.
- "Add HyperFrames playbook" — for a CapCut-only or legacy project: set editor to `both`, set `A6_hyperframes_translate` and `hf_playbook` to "pending", locate Overlay Director (Phase 1, Step 4b), run A6, then Phase 6 Steps 2 + 6b. Scanners and A5 are reused, not re-run. Also the path for re-running a failed A6.
- "Re-run a specific agent" — pick which agent to re-deploy
- "Scan another video" — go to Phase 1
- "Done for now" — save registry, end

---

## Error Handling

### FFmpeg/FFprobe Not Found
Check: `ffmpeg -version` and `ffprobe -version`. If not found, guide user to install.

### Agent Produces Empty or Malformed Output
- Check if mosaic files exist and are non-empty
- If agent returned but didn't write a file: context limit may have been hit
- For very long videos: suggest lower density or batched processing
- Offer to re-run with a note about the issue

### YouTube Validation Fails for All URLs
- Proceed without tutorial links
- Note in playbook: "Tutorial links pending manual curation"
- Offer to re-run YouTube research

### Context Overflow Warning
Read micro-scan-algorithm.md for frame budget limits. If estimated mosaics > 60, warn user:
- "This video at [density] density will generate ~[N] mosaics, which may exceed context limits."
- Suggest: lower density, or batched processing

### yt-dlp Not Available
Fall back to WebFetch for YouTube validation. If neither works, skip validation and include unvalidated URLs with a warning note.

### Overlay Director Not Found
Only matters for editor `hyperframes` or `both`. Say so at Phase 1, Step 4b and offer: continue
without library matching (every element graded NONE) or switch to CapCut only. If a resumed project's
`hyperframes.od_reference_dir` no longer exists, re-run the locate step before A6.

### Registry Corruption
Always read before writing (merge, never overwrite). If registry is unreadable, offer to rebuild from existing output files.

---

## Key Architecture Rules

1. **Skill orchestrates, ffmpeg preprocesses.** Never call ffmpeg from within a Task subagent.
2. **Agents get mosaic images, not raw video.** Mosaics are token-efficient (9 frames per image).
3. **Each agent writes to its own file.** No write conflicts during parallel execution.
4. **Registry tracks per-agent status.** Resume at any failed agent without re-running others.
5. **Agent prompts live in reference files.** Orchestrator reads and injects. Subagents cannot read plugin files.
6. **All YouTube URLs must be validated** before embedding in the playbook.
7. **Template vs Transition categorization** happens in Agent 4, not in scanners.
8. **Registry update timing:** "in_progress" BEFORE deploy, "complete" AFTER validation, "failed" on failure.
9. **HTML template is parameterized.** The orchestrator resolves all {VARIABLES} during playbook generation.
10. **Vercel deployment is optional.** Always offer local save as default.
11. **X-Ray never writes into Overlay Director.** A6 reads Overlay Director's library live; the hand-off is the `HYPERFRAMES_PLAYBOOK_{slug}.md` file. Only `/overlay-director import` changes Overlay Director, behind its own approval gate.
