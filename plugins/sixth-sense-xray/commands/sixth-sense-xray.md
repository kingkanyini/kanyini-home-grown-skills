---
description: Visual reverse-engineering — analyzes video effects and produces interactive CapCut recreation playbooks with YouTube tutorial links
---

# SixthSense X-Ray — Visual Reverse Engineering

## Overview

SixthSense X-Ray analyzes video frames to reverse-engineer every visual effect, template, and transition. It produces an interactive HTML playbook with step-by-step CapCut recreation instructions and validated YouTube tutorial links.

**Part of the SixthSense family:**
- `/sixth-sense` → finds clip-worthy moments (words + emotion + structure)
- `/sixth-sense-scissors` → cuts and cleans video (audio + silence + timing)
- `/sixth-sense-xray` → reverse-engineers visual effects (what you SEE) ← THIS SKILL

## File Locations

- **Registry:** `~/.claude/projects/sixth-sense-xray/registry.json`
- **Agent prompts:** `references/agent-prompts.md`
- **HTML template:** `references/html-template.md`
- **CapCut mapping:** `references/capcut-mapping.md`
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
        "editor": "capcut",
        "video_type": "vsl"
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
        "youtube_research": "pending",
        "playbook": "pending",
        "deploy": "pending"
      },
      "agent_outputs": {
        "A1": "agent1_effects_transitions.md",
        "A2": "agent2_typography_text.md",
        "A3": "agent3_color_composition.md",
        "microscan": "microscan_findings.md",
        "A4": "capcut_translated.md",
        "A5": "gaps_analysis.md",
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
║  Post-Process:   ░░░░░░░░░░░░ 0/2                            ║
║  Micro-Scan:     ░░░░░░░░░░░░ PENDING                       ║
║  YouTube:        ░░░░░░░░░░░░ PENDING                       ║
║  Playbook:       ░░░░░░░░░░░░ PENDING                       ║
║  Last worked: [date]                                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

Progress bar rules (12 chars): `█` = complete, `░` = pending.
- Scanners: count A1 + A2 + A3 statuses "complete" → X/3
- Post-Process: count A4 + A5 statuses "complete" → X/2
- Other phases: binary COMPLETE or PENDING

3. Present options via AskUserQuestion:
   - For each project: "Resume [Name]" with next recommended action
   - "New Scan" — start fresh

4. **Resume logic:** Walk status in order: preprocessing → configure → A1/A2/A3 → microscan → A4 → A5 → youtube → playbook → deploy. Find first incomplete step.

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

### Step 5: Scene Detection
```bash
ffmpeg -i "{video_path}" -vf "select='gt(scene,0.3)',showinfo" -vsync vfr -f null - 2>&1 | grep "pts_time"
```
Count scene changes. Store timestamps for micro-scan triggers.

### Step 6: Frame Extraction
Determine interval from density: Quick=15, Smart=5, Deep=2 seconds.
```bash
ffmpeg -i "{video_path}" -vf "fps=1/{interval},drawtext=text='%{{pts\:hms}}':x=10:y=H-30:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.7:boxborderw=4" -q:v 2 "{output_dir}/overview_%04d.jpg" -y
```

### Step 7: Mosaic Generation
```bash
ffmpeg -i "{video_path}" -vf "fps=1/{interval},drawtext=text='%{{pts\:hms}}':x=10:y=10:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6:boxborderw=3,scale=480:270,tile=3x3" -q:v 2 "{output_dir}/mosaic_%03d.jpg" -y
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
ffmpeg -ss {zone_start} -to {zone_end} -i "{video_path}" -vf "fps=10,drawtext=text='%{{pts\:hms}}':x=10:y=H-30:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.7:boxborderw=4,scale=480:270,tile=3x3" -q:v 2 "{output_dir}/microscan_{zone_id}/mosaic_%03d.jpg" -y
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

**Deploy Agent 4 (CapCut Translator) then Agent 5 (Gaps Analyst). Sequential.**

### Agent 4: CapCut Language Translator

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

→ **Proceed to Phase 5.**

---

## PHASE 5: YouTube Research + Validation

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

### Step 1: Read All Inputs
- Agent 4 output: `capcut_translated.md` (templates, transitions, build steps)
- Agent 5 output: `gaps_analysis.md` (timeline, pacing)
- Agent 3 output: `agent3_color_composition.md` (style guide, colors)
- Agent 2 output: `agent2_typography_text.md` (font system)
- YouTube validated URLs: `youtube_validated.json`

### Step 2: Extract Representative Frames
For each template's primary timestamp:
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
Same content structure, no HTML/CSS, for reference/archival.

### Step 7: Update Registry
Set `status.playbook = "complete"`.
Populate `results_summary`:
```json
{
  "template_count": N,
  "transition_count": N,
  "color_count": N,
  "font_count": N,
  "youtube_links": N,
  "playbook_path": "...",
  "html_size_kb": N
}
```

→ **Proceed to Phase 7.**

---

## PHASE 7: Deploy + Share

AskUserQuestion with 3 options:

### Option 1: "Deploy as website (Vercel)"

**Preflight, then confirm — this publishes to a public URL.**

1. Check the CLI is present: `npx vercel --version`. If missing, say so and fall back to
   Option 2 rather than failing here.
2. **Confirm before deploying.** The playbook embeds extracted video frames and analysis
   of the source. If that source is a client's video, deploying puts their frames on a
   public URL. Say that plainly and get a yes.

```bash
mkdir -p "{output_dir}/deploy"
cp "{output_dir}/XRAY_PLAYBOOK.html" "{output_dir}/deploy/index.html"
cp "{output_dir}"/frame_*.jpg "{output_dir}/deploy/"
# Deploy from the isolated deploy/ dir — never the no-arg MCP deploy, which publishes
# the current working directory and can sweep up unrelated files.
cd "{output_dir}/deploy" && npx vercel deploy --prod --yes
```
Returns live URL. Report to user.

### Option 2: "Save locally"
Confirm file locations. List all output files with sizes.

### Option 3: "Deploy + copy to Dropbox"
Deploy to Vercel (same as Option 1).
Then copy output folder to `~/<your-vault-path>

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
╚══════════════════════════════════════════════════════════════╝
```

AskUserQuestion:
- "Open playbook in browser" — `start "" "{output_dir}/XRAY_PLAYBOOK.html"`
- "Show template list" — display A4 merged template/transition names
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
