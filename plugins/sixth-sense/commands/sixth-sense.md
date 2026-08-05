---
description: 6-agent video intelligence scanner — identifies clip-worthy segments across Content, Emotion, and Structure
---

# SixthSense — Video Intelligence Scanner

## Overview

SixthSense is a 6-agent video intelligence scanner that analyzes long-form video (30-60 min) and identifies clip-worthy segments across 3 lenses:
- **Content Intelligence** (what's being SAID) — P1-A Scanner + P1-B Deep Diver
- **Energy & Emotion** (how it FEELS) — P2-A Scanner + P2-B Deep Diver
- **Structure & Virality** (how it PERFORMS) — P3-A Scanner + P3-B Deep Diver

The Python CLI (`sixth-sense`) handles preprocessing (FFmpeg, Whisper, audio analysis, scene detection). This skill orchestrates the 6-agent scanning workflow and produces the final report.

## File Locations

- **Registry:** `~/.claude/projects/sixth-sense/registry.json`
- **Agent prompts:** `references/agent-prompts.md`
- **Scoring rubric:** `references/scoring-rubric.md`
- **Consensus algorithm:** `references/consensus-algorithm.md`
- **Report template:** `references/report-template.md`

## Registry Schema

```json
{
  "projects": {
    "slug": {
      "name": "Human-readable name",
      "slug": "slug",
      "video_path": "C:\\path\\to\\video.mp4",
      "save_file": "C:\\path\\to\\video_preprocessed.json",
      "output_dir": "C:\\path\\to\\output\\slug",
      "duration_seconds": 0,
      "duration_formatted": "0m00s",
      "transcript_segments": 0,
      "word_count": 0,
      "scan_config": {
        "clip_targets": [],
        "platforms": [],
        "content_focus": [],
        "max_clips_per_target": 10
      },
      "created": "YYYY-MM-DD",
      "last_updated": "YYYY-MM-DD",
      "status": {
        "preprocessing": "pending",
        "configure": "pending",
        "P1-A": "pending",
        "P1-B": "pending",
        "P2-A": "pending",
        "P2-B": "pending",
        "P3-A": "pending",
        "P3-B": "pending",
        "consensus": "pending",
        "report": "pending"
      },
      "agent_outputs": {
        "P1-A": "p1a_content_scanner.md",
        "P1-B": "p1b_content_deep_diver.md",
        "P2-A": "p2a_emotion_scanner.md",
        "P2-B": "p2b_emotion_deep_diver.md",
        "P3-A": "p3a_structure_scanner.md",
        "P3-B": "p3b_structure_deep_diver.md"
      },
      "results_summary": null
    }
  }
}
```

---

## PREFLIGHT — run this BEFORE the menu, every session

Check dependencies before asking for a video. Discovering a missing engine an hour into
a scan is the difference between a ten-second message and a wasted afternoon.

```bash
ffmpeg -version 2>/dev/null | head -1     # required
uv --version 2>/dev/null                   # required
sixth-sense --help 2>/dev/null | head -1   # required — the preprocessing engine
```

Report anything missing **in plain language with the fix**, then stop:

| Missing | Say this |
|---|---|
| `ffmpeg` | "ffmpeg isn't installed. Windows: `winget install ffmpeg` · macOS: `brew install ffmpeg` · Linux: your package manager." |
| `uv` | "uv isn't installed. See https://docs.astral.sh/uv/ — then re-run." |
| `sixth-sense` | "The preprocessing engine isn't installed. This skill orchestrates; the engine does the ffmpeg/Whisper/scene work, so nothing can run without it. Install: `uv tool install git+https://github.com/<your-github-handle>/sixth-sense-engine`" |

**Never suggest `pip install sixth-sense`** — that name belongs to an unrelated package
on PyPI and would install a stranger's code.

Also worth surfacing once, before a long run: transcription is much faster on an NVIDIA
GPU. On CPU or Apple Silicon it still works, just slower. Say so rather than letting the
user think it has hung.

## PHASE 0: Main Menu

**Every session starts here.**

1. Read `~/.claude/projects/sixth-sense/registry.json`
   - If it doesn't exist, create it with `{ "projects": {} }`

2. Build the dashboard. For each project in the registry, calculate progress:

```
╔══════════════════════════════════════════════════════════════╗
║  SIXTHSENSE — VIDEO INTELLIGENCE SCANNER                     ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  [PROJECT NAME]                                              ║
║  Video: [filename] ([duration])                              ║
║  Preprocessing:  ████████████ COMPLETE                       ║
║  Configure:      ████████████ COMPLETE                       ║
║  Scanners:       ████████░░░░ 2/3                            ║
║  Deep Divers:    ░░░░░░░░░░░░ 0/3                            ║
║  Consensus:      ░░░░░░░░░░░░ PENDING                       ║
║  Report:         ░░░░░░░░░░░░ PENDING                       ║
║  Last worked: [date]                                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

Progress bar rules (12 chars total):
- `█` = complete, `░` = pending
- Scanners: count P1-A + P2-A + P3-A statuses that are "complete" → X/3
- Deep Divers: count P1-B + P2-B + P3-B statuses that are "complete" → X/3
- Other phases: binary COMPLETE or PENDING

3. Present options via AskUserQuestion:
   - For each existing project: "Resume [Name]" with description showing next recommended action
   - "New Scan" with description "Scan a new video"

4. **Resume logic:** Walk the status object in order: preprocessing → configure → P1-A/P2-A/P3-A → P1-B/P2-B/P3-B → consensus → report. Find the first incomplete step and recommend it.

---

## PHASE 1: Video Intake + Preprocessing

**Triggered by:** "New Scan" selection or resume at preprocessing step.

### Step 1: Get Video Path
Ask for the video file path via AskUserQuestion:
- "Paste video path" (Other option — user types the path)
- "Browse recent" — list .mp4/.mov/.mkv files in common locations

### Step 2: Check for Existing Save File
Look for `[video_name]_preprocessed.json` in the same directory as the video, or in the SixthSense output directory.

If save file exists:
- Read it to extract metadata (duration, segment count, word count)
- AskUserQuestion: "Save file found ([duration], [segments] segments). Use it?" / "Re-preprocess from scratch"

If no save file:
- Run preprocessing: `uv run sixth-sense preprocess "[video_path]"`
- Wait for completion. This takes 2-10 minutes depending on video length.

### Step 3: Generate Human-Readable Files
Check if the output directory already has `transcript_timestamped.txt` and `energy_map.txt`.

If missing, generate them from the save file JSON:
- **transcript_timestamped.txt:** Read `data.transcript` array. For each segment, write `[MM:SS] text` (convert start seconds to MM:SS).
- **energy_map.txt:** Read `data.audio_features` array. For each window, write `[MM:SS] Energy: [bars] | Tempo: [BPM] BPM | [silence]% silence` where bars = energy * 10 mapped to `█`/`░` characters (30 chars wide).

### Step 4: Create Registry Entry
Generate a slug from the video filename (lowercase, hyphens, no extension).
Create the output directory if needed.
Write the registry entry with all metadata from the save file.
Set `status.preprocessing = "complete"`.

→ **Proceed to Phase 2.**

---

## PHASE 2: Configure Targets

**Triggered by:** Resume at configure step, or after Phase 1.

### Clip Target Presets (from Python CLI)

| Key | Label | Range |
|-----|-------|-------|
| reels | Reels / TikTok | 15-60s |
| shorts | YouTube Shorts | 60-180s |
| power | Power Clips (3-5 min) | 180-300s |
| youtube | YouTube (5-10 min) | 300-600s |
| highlight | Highlight Reel (30s-2min) | 30-120s |

### Configuration Flow

Present a single AskUserQuestion with 2 options:

**Option 1: Quick Config (Recommended)**
Description: "Reels + Shorts + Power Clips | All platforms | All focus areas | 10 clips per target"
Sets:
```json
{
  "clip_targets": [
    { "label": "Reels / TikTok", "min_seconds": 15, "max_seconds": 60, "priority": 2 },
    { "label": "YouTube Shorts", "min_seconds": 60, "max_seconds": 180, "priority": 2 },
    { "label": "Power Clips", "min_seconds": 180, "max_seconds": 300, "priority": 1 }
  ],
  "platforms": ["tiktok", "youtube", "instagram", "linkedin"],
  "content_focus": ["teaching", "stories", "hooks", "vulnerability", "humor", "quotes", "energy"],
  "max_clips_per_target": 10
}
```

**Option 2: Custom Config**
Walk through each setting:
1. AskUserQuestion: Which clip targets? (Reels / Shorts / Power Clips / YouTube Long / Highlight Reel — multiSelect)
2. AskUserQuestion: Which platforms? (TikTok / YouTube / Instagram / LinkedIn — multiSelect)
3. AskUserQuestion: Content focus? (Teaching / Stories / Hooks / Vulnerability / Humor / Quotes / Energy — multiSelect)
4. AskUserQuestion: Max clips per target? (5 / 10 / 15 / 20)

### Save Config
Update the registry entry with the scan_config.
Set `status.configure = "complete"`.

→ **Proceed to Phase 3.**

---

## PHASE 3: Deploy Scanners

**Triggered by:** Resume at any Scanner step, or after Phase 2.

### Critical: Prompt Injection Pattern

Task subagents CANNOT read plugin reference files. The orchestrator MUST:
1. Read `references/agent-prompts.md`
2. Read `references/scoring-rubric.md`
3. Extract each Scanner's prompt section
4. Resolve ALL `{VARIABLE}` placeholders with real values from the registry
5. Append the Shared Rules section to each prompt
6. Inject the complete, resolved prompt into the Task instruction

### Variable Resolution

From the registry entry, resolve these variables:
- `{TRANSCRIPT_FILE}` → `[output_dir]/transcript_timestamped.txt`
- `{ENERGY_MAP_FILE}` → `[output_dir]/energy_map.txt`
- `{SAVE_FILE_PATH}` → `[save_file]` (only for P3-A/P3-B)
- `{SCAN_CONFIG}` → JSON-formatted scan_config from registry
- `{VIDEO_DURATION}` → duration_formatted (e.g., "54m12s")
- `{VIDEO_FILENAME}` → video filename
- `{OUTPUT_DIR}` → output_dir

### Deploy 3 Scanners in PARALLEL

Before launching, update registry: set P1-A, P2-A, P3-A status to "in_progress".

Launch 3 Task subagents simultaneously using the Task tool:

**Task 1: P1-A Content Scanner**
- subagent_type: "general-purpose"
- Inject the resolved P1-A prompt
- Tell the agent: "You are P1-A. Read the transcript and energy map files, then write your output to the specified path."

**Task 2: P2-A Emotion Scanner**
- subagent_type: "general-purpose"
- Inject the resolved P2-A prompt
- Tell the agent: "You are P2-A. Read the transcript and energy map files, then write your output to the specified path."

**Task 3: P3-A Structure Scanner**
- subagent_type: "general-purpose"
- Inject the resolved P3-A prompt (includes save file path for scene/frame data)
- Tell the agent: "You are P3-A. Read the transcript, energy map, and save file, then write your output to the specified path."

### Validation (after each Task returns)

For each Scanner output, verify:
1. **File exists** at the expected path
2. **Contains final rankings table** — search for `## FINAL SCANNER RANKINGS`
3. **Minimum line count** — at least 20 lines (a real Scanner output is 50-150+ lines)

If validation fails for any agent:
- Set that agent's status to "failed" in registry
- Report the failure to the user
- Offer to re-run that specific agent

If validation passes:
- Set that agent's status to "complete" in registry
- Extract segment count from the output for the dashboard

### Post-Scanner Summary

Display a summary:
```
╔══════════════════════════════════════════════════════════════╗
║  SCANNER DEPLOYMENT COMPLETE                                 ║
╠══════════════════════════════════════════════════════════════╣
║  P1-A Content Scanner:   ✓ [X] segments | Top: [score]      ║
║  P2-A Emotion Scanner:   ✓ [X] moments  | Top: [score]      ║
║  P3-A Structure Scanner:  ✓ [X] segments | Top: [score]      ║
╚══════════════════════════════════════════════════════════════╝
```

AskUserQuestion:
- "Deploy Deep Divers now (Recommended)" — proceed to Phase 4
- "Review Scanner results first" — read and display each Scanner's output
- "Re-run a Scanner" — pick which one to re-deploy

→ **Proceed to Phase 4.**

---

## PHASE 4: Deploy Deep Divers

**Triggered by:** Resume at any Deep Diver step, or after Phase 3.

### Same Injection Pattern as Phase 3

1. Read agent-prompts.md and scoring-rubric.md
2. Extract each Deep Diver's prompt
3. Resolve ALL variables — including `{SCANNER_OUTPUT}` which points to the corresponding Scanner's output file
4. Append Shared Rules
5. Inject into Task instructions

### Additional Variable: {SCANNER_OUTPUT}

- P1-B gets: `{SCANNER_OUTPUT}` → `[output_dir]/p1a_content_scanner.md`
- P2-B gets: `{SCANNER_OUTPUT}` → `[output_dir]/p2a_emotion_scanner.md`
- P3-B gets: `{SCANNER_OUTPUT}` → `[output_dir]/p3a_structure_scanner.md`

### Deploy 3 Deep Divers in PARALLEL

Before launching, update registry: set P1-B, P2-B, P3-B status to "in_progress".

**Task 1: P1-B Content Deep Diver**
- subagent_type: "general-purpose"
- Inject resolved P1-B prompt
- "You are P1-B. Read the Scanner output, transcript, and energy map. Analyze the top 10 segments. Write your output to the specified path."

**Task 2: P2-B Emotion Deep Diver**
- subagent_type: "general-purpose"
- Inject resolved P2-B prompt
- "You are P2-B. Read the Scanner output, transcript, and energy map. Analyze the top 10 moments + Emotion-Only Discoveries. Write your output to the specified path."

**Task 3: P3-B Structure Deep Diver**
- subagent_type: "general-purpose"
- Inject resolved P3-B prompt (includes save file path)
- "You are P3-B. Read the Scanner output, transcript, energy map, and save file. Analyze the top 10 segments. Write your output to the specified path."

### Validation (after each Task returns)

For each Deep Diver output, verify:
1. **File exists** at the expected path
2. **Contains `## FINAL ADJUSTED RANKINGS`** section header
3. **Minimum line count** — at least 100 lines (a real Deep Diver output is 300-700+ lines)

Same failure handling as Phase 3: mark failed, report, offer re-run.

### Post-Deep-Diver Summary

```
╔══════════════════════════════════════════════════════════════╗
║  DEEP DIVER DEPLOYMENT COMPLETE                              ║
╠══════════════════════════════════════════════════════════════╣
║  P1-B Content Deep Diver:   ✓ Top: [score] | [title]        ║
║  P2-B Emotion Deep Diver:   ✓ Top: [score] | [title]        ║
║  P3-B Structure Deep Diver:  ✓ Top: [score] | [title]       ║
╚══════════════════════════════════════════════════════════════╝
```

AskUserQuestion:
- "Run Consensus Merge + Generate Report (Recommended)"
- "Review Deep Diver results first"
- "Re-run a Deep Diver"

→ **Proceed to Phase 5.**

---

## PHASE 5: Consensus Merge + Report

**Triggered by:** Resume at consensus step, or after Phase 4.

### Step 1: Read All 6 Agent Outputs

Read all 6 output files from the output directory:
- `p1a_content_scanner.md`
- `p1b_content_deep_diver.md`
- `p2a_emotion_scanner.md`
- `p2b_emotion_deep_diver.md`
- `p3a_structure_scanner.md`
- `p3b_structure_deep_diver.md`

### Step 2: Read Consensus Algorithm

Read `references/consensus-algorithm.md`

### Step 3: Execute the 8-Step Algorithm

Follow the consensus algorithm exactly:

1. **Collect** final scores from the 3 Deep Diver `## FINAL ADJUSTED RANKINGS` tables
2. **Deduplicate** overlapping segments (>50% timestamp overlap = same segment)
3. **Classify** by flag count (triple / double / single / emotion-only)
4. **Calculate** consensus scores per the formulas
5. **Assign** tiers (GOLD / STRONG / SOLID / REFERENCE)
6. **Rank** (flag count primary, score secondary; promote emotion-only 0.85+)
7. **Assemble** clip packages (A: Quick Wins, B: Deep Value, C: The Story)
8. **Write** consensus-merge.json to the output directory

Update registry: set `status.consensus = "complete"`.

### Step 4: Read Report Template

Read `references/report-template.md`

### Step 5: Generate SIXTHSENSE_REPORT.md

Follow the report template. For each section, pull data from the source specified in the Assembly Map:

- **Header:** Registry metadata
- **Agents Deployed:** Segment counts from each agent output
- **Consensus Map:** Top 5-8 segments from consensus algorithm, with multi-lens breakdown
- **Scanner full results:** Paste ranked tables + post-table sections from P1-A, P2-A, P3-A
- **Deep Diver summaries:** Top 3 highlights + rankings from P1-B, P2-B, P3-B
- **Energy Profile:** Read energy_map.txt, extract top 5 peaks and valleys
- **Clip Packages:** From consensus algorithm output
- **Summary Statistics:** Derived totals and averages

Write the report to: `[output_dir]/SIXTHSENSE_REPORT.md`

Update registry:
- Set `status.report = "complete"`
- Populate `results_summary` with: total_segments, triple_flagged count, highest_score, top_clip title
- Update `last_updated`

→ **Proceed to Phase 6.**

---

## PHASE 6: Review + Iteration

**Triggered by:** Resume after report, or after Phase 5.

### Report Summary Dashboard

```
╔══════════════════════════════════════════════════════════════╗
║  SIXTHSENSE REPORT COMPLETE                                  ║
╠══════════════════════════════════════════════════════════════╣
║  Video: [filename] ([duration])                              ║
║  Total segments: [N]                                         ║
║  GOLD: [N] | STRONG: [N] | SOLID: [N]                       ║
║  Triple-flagged: [N] | Double: [N] | Single: [N]            ║
║  Top clip: "[title]" — [score]                               ║
║                                                              ║
║  Report saved: [output_dir]/SIXTHSENSE_REPORT.md            ║
╚══════════════════════════════════════════════════════════════╝
```

### Review Options

AskUserQuestion:
- "Read full report" — Read and display the entire SIXTHSENSE_REPORT.md
- "Show top 5 clips" — Display just the Consensus Map section
- "Show specific agent" — Follow up with which agent (P1-A, P1-B, P2-A, P2-B, P3-A, P3-B)
- "Re-run an agent" — Pick which agent to re-deploy (useful if one had issues)

### Re-run Logic

If the user wants to re-run an agent:
1. AskUserQuestion: Which agent? (P1-A / P1-B / P2-A / P2-B / P3-A / P3-B)
2. Set that agent's status back to "pending" in registry
3. Re-deploy using the same injection pattern as Phase 3/4
4. After completion, offer to re-run consensus + report to incorporate new results

### Session End

After review, AskUserQuestion:
- "Scan another video" — Go to Phase 1
- "Done for now" — Save registry, display file locations, end

---

## Error Handling

### Preprocessing Fails
- Check if `uv` is installed: `uv --version`
- Check if sixth-sense package is installed: `uv run sixth-sense --help`
- If not installed: `cd ~/Projects\sixth-sense && uv pip install -e .`
- Common issue: FFmpeg not in PATH. Check: `ffmpeg -version`

### Agent Produces Empty or Malformed Output
- Check if transcript/energy map files exist and are non-empty
- If the agent returned but didn't write a file, the Task may have hit a context limit
- For very long transcripts (90+ min video): consider splitting the transcript and running agents on chunks
- Offer to re-run with a note to the agent about the specific issue

### Registry Corruption
- Always read before writing (merge, don't overwrite)
- If registry is unreadable, offer to rebuild from existing output files

---

## Key Architecture Rules

1. **Skill orchestrates, Python preprocesses.** This skill NEVER touches FFmpeg, Whisper, or audio analysis directly.
2. **Agents get human-readable files.** Transcript and energy map as `.txt`, not raw JSON. Only P3-A/P3-B get the full JSON save file (for scene/frame data).
3. **Each agent writes to its own file.** No write conflicts during parallel execution.
4. **Registry tracks per-agent status.** Resume at any failed agent without re-running others.
5. **Agent prompts live in reference files.** The orchestrator reads and injects them. This keeps the main skill focused on flow and makes prompts reusable for the future Python port.
6. **Scoring tiers are consistent across all agents.** 0.90 means the same thing from any agent.
7. **Registry update timing:** Mark "in_progress" BEFORE deploying Task. Mark "complete" AFTER validation passes. Mark "failed" on validation failure.
