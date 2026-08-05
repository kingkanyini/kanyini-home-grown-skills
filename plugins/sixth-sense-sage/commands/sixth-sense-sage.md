---
description: B-roll placement intelligence — identifies moments, builds production briefs with bilingual mapping, Artgrid sourcing, and interactive HTML playbooks
---

# SixthSense Sage — B-Roll Placement + Production Briefs

## Overview

SixthSense Sage reads translated VSL transcripts, identifies every moment that benefits from B-roll, and produces a bilingual production brief with Artgrid search terms, AI-generation prompts, and an interactive HTML playbook. It is the fourth member of the SixthSense family, focused on WHAT TO SHOW rather than what to cut, clean, or reverse-engineer.

**Part of the SixthSense family:**
- `/sixth-sense` — finds clip-worthy moments (words + emotion + structure)
- `/sixth-sense-scissors` — cuts and cleans video (audio + silence + timing)
- `/sixth-sense-xray` — reverse-engineers visual effects (what you SEE)
- `/sixth-sense-sage` — B-roll placement + production briefs (WHAT TO SHOW) **<-- THIS SKILL**

## File Locations

- **Registry:** `~/.claude/projects/sixth-sense-sage/registry.json`
- **Agent prompts:** `references/agent-prompts.md`
- **HTML template:** `references/html-template.md`
- **Tone profiles:** `references/tone-profiles.md`

## Counsel

Production Beast Counsel (#29): Daniel Schiffer (B-Roll Craft), Parker Walbeck (Practical Production), Peter McKinnon (Cinematic Eye), Ryan Connolly (DIY Filmmaker), Hayao Miyazaki (Visual Metaphor)

**Bench:** Matti Haapoja (storytelling DP), Roger Deakins (cinematography), Alex Ferrari (production business)

---

## Registry Schema

```json
{
  "projects": {
    "slug": {
      "name": "Human-readable project name",
      "slug": "slug",
      "srt_en_path": "C:\\path\\to\\translated-english.srt",
      "srt_source_path": "C:\\path\\to\\source-language.srt",
      "source_language": "German",
      "oo_path": "C:\\path\\to\\client-offer-optimizer.md",
      "tone_profile": {
        "ica_summary": "Brief ICA description from OO",
        "visual_genres": ["cinematic", "nature/organic"],
        "emotional_register": "raw/vulnerable + aspirational",
        "reference_anchors": "X meets Y description",
        "cultural_notes": "Audience-specific considerations"
      },
      "runtime": "16:41",
      "is_translated": true,
      "video_path": null,
      "output_dir": "C:\\path\\to\\output\\slug",
      "status": {
        "context": "pending",
        "a1_sweep": "pending",
        "a2_gaps": "pending",
        "a3_synthesize": "pending",
        "foreman": "pending",
        "brief": "pending",
        "playbook": "pending",
        "deploy": "pending",
        "artgrid": "pending"
      },
      "files": {
        "broll_map_a1": null,
        "broll_map_a2": null,
        "broll_map_final": null,
        "user_selections": null,
        "production_brief": null,
        "html_playbook": null
      },
      "created": "YYYY-MM-DD",
      "last_updated": "YYYY-MM-DD"
    }
  }
}
```

**Status values:** `"pending"` | `"in_progress"` | `"complete"` | `"failed"`

---

## PREFLIGHT — run this BEFORE the menu, every session

Sage is mostly analysis, so it has no heavy binary dependencies. Two optional pieces do
gate later phases, and it is worth naming them up front rather than at the moment they
fail:

```bash
npx vercel --version 2>/dev/null   # optional — publishing the playbook
ls -d ~/.claude/plugins/*/hyperframes-handoff 2>/dev/null   # optional — Phase 7
```

- **No Vercel CLI** → the playbook saves locally instead. Not a blocker; say so once.
- **No hyperframes-handoff** → Phase 7 reports unavailable and ends cleanly. Everything
  Sage produced before it is still saved and usable.

Neither of these should stop a run. Surface them once at the start so the user is not
surprised seven phases later.

## PHASE 0: Main Menu

**Every session starts here.**

1. Read `~/.claude/projects/sixth-sense-sage/registry.json`
   - If it doesn't exist, create it with `{ "projects": {} }`

2. Build the dashboard. For each project in the registry:

```
+==============================================================+
|  SIXTHSENSE SAGE -- B-ROLL PLACEMENT INTELLIGENCE            |
+==============================================================+
|                                                              |
|  [PROJECT NAME]                                              |
|  Language: [source_language] > English                       |
|  Context:       [============] COMPLETE                      |
|  Discovery A1:  [============] COMPLETE                      |
|  Discovery A2:  [============] COMPLETE                      |
|  Discovery A3:  [============] COMPLETE                      |
|  Foreman:       [............] PENDING                       |
|  Brief:         [............] PENDING                       |
|  Playbook:      [............] PENDING (M3)                  |
|  Deploy:        [............] PENDING (M3)                  |
|  Last worked: [date]                                         |
|                                                              |
+==============================================================+
```

Progress bar rules (12 chars): `=` = complete, `.` = pending, `>` = in progress.
- Discovery: individual bars for A1, A2, A3
- All other phases: binary COMPLETE, IN PROGRESS, or PENDING

3. Present options via AskUserQuestion:
   - For each project: "Resume [Name] — next: [next phase description]"
   - "New Project — start fresh"

4. **Resume logic:** Walk status in order: context > a1_sweep > a2_gaps > a3_synthesize > foreman > brief > playbook > deploy > artgrid. Find first incomplete step. Jump to that phase.

---

## PHASE 1: Client Context Intake

**Triggered by:** "New Project" or resume at context step.

### Step 1: SRT File Paths

AskUserQuestion (RPG style — Quest Briefing):

```
QUEST: THE SAGE'S FIRST READING

The Sage opens a weathered scroll case and gestures for your transcript.

"Before I can see the invisible threads in your video,
I need the words — in both tongues."
```

Present via AskUserQuestion:
- "Paste English SRT path" (Other — user types)
- "Paste source language SRT path" (Other — user types)

If user provides both in one response, parse them. Verify both files exist with `ls -la "{path}"`.

If only an English SRT is provided, ask: "Is the source language SRT available? The Sage can work without it, but bilingual mapping requires both."

### Step 1b: SRT Pre-Flight Validation

After verifying files exist, validate each SRT file:

1. Read the first 20 lines of each SRT file
2. **WebVTT detection:** If the file starts with "WEBVTT", inform user: "This is a WebVTT file, not SRT format. Please provide an SRT file, or I can attempt to convert it (strip the WEBVTT header and reformat timecodes)." Offer via AskUserQuestion: "Convert to SRT automatically" / "I'll provide an SRT file instead"
3. **Format validation:** Verify line 1 is a number (subtitle index) and line 2 contains " --> " (timecode separator). If either fails, report: "This file does not appear to be valid SRT format. Line 1 should be a number, line 2 should contain a timecode like '00:00:01,000 --> 00:00:03,000'."
4. **Encoding check:** Verify file is UTF-8 or UTF-8-BOM. If read produces garbled characters, warn: "This file may not be UTF-8 encoded. Re-save as UTF-8 before proceeding."
5. **Entry count and overflow check:** Count the number of subtitle entries (count lines matching `^\d+$` followed by a timecode line). If >400 entries (roughly >60 min video), warn user: "This SRT has [N] entries (~[estimated minutes] min video). Agent context may overflow for very long videos." Offer via AskUserQuestion: "Proceed as single pass (recommended for <90 min)" / "Use Quick density mode (fewer B-roll moments, safer for long videos)"

If validation fails on the English SRT, do not proceed to Step 2 until resolved.

### Step 2: Translation Status

AskUserQuestion:

```
The Sage examines the scrolls, noting the script...

"Was this video originally in another language,
then translated to English? Or was it born in English?"
```

- "Translated from another language (bilingual mode)" — sets `is_translated: true`, then ask source language
- "Original English (monolingual mode)" — sets `is_translated: false`

If translated, follow up:
- "German"
- "Spanish"
- "Portuguese"
- "French"
- Other (user types)

### Step 3: Offer Optimizer Selection

Ask the user where their Offer Optimizer files live, then list that directory:

```bash
# Ask first — never assume a path. If the user has no OO output, skip to Step 4.
ls -1 "{oo_directory}"
```

If the user runs `/offer-optimizer`, its output directory is the natural answer. Do NOT
hardcode or auto-scan a path: it may be someone else's client store, and enumerating
filenames from it leaks who they work with.

Present found files via AskUserQuestion:

```
INVENTORY CHECK: CLIENT ARCHIVES

The Sage rummages through the knowledge vault...

"Which client's essence should guide my vision?"
```

- List each OO file found (e.g., "example-collective Offer Optimizer.md")
- "Paste a different OO path" (Other)
- "No OO available — proceed without"

If no OO is selected, warn: "The Sage can still find B-roll moments, but sourcing recommendations and tone calibration will be less precise without the client's Offer Optimizer." Set `oo_path` to `null` in the registry. When resolving `{OO_EXCERPT}` later (Phase 4), use the fallback string: `"No Offer Optimizer provided. Sourcing suggestions based on tone profile only."`

Read the selected OO file and extract: ICA profile, transformation promise, core beliefs, industry/niche, brand voice.

### Step 4: Tone Profile Interview

Read `references/tone-profiles.md` for the schema and gold-standard example.

Conduct 4 interview rounds via AskUserQuestion:

**Round 1 — Visual Genres** (multiselect):

```
THE SAGE'S VISION CALIBRATION — Round 1 of 4

Daniel Schiffer steps forward, adjusting his lens:
"Every story has a visual language. What does THIS one look like?"
```

- "Cinematic / documentary"
- "Anime / illustrated / hand-drawn"
- "Abstract / artistic"
- "Nature / organic"
- "Urban / modern"
- "Clinical / scientific"
- "Spiritual / mystical"
- "Energetic / motivational"

(User can select multiple. Present in batches if needed: first 4, then "More options".)

**Round 2 — Emotional Register:**

```
Peter McKinnon leans in:
"Now — how should the audience FEEL when the B-roll hits?"
```

- "Raw / vulnerable"
- "Aspirational / elevated"
- "Clinical / authoritative"
- "Spiritual / contemplative"
- "Energetic / motivational"

**Round 3 — Reference Anchors:**

```
Miyazaki draws a small sketch on a napkin:
"Give me two worlds to collide. Think 'X meets Y' —
like 'Wim Hof's raw intensity meets Pina Bausch's emotional movement.'"
```

- "Type your reference anchors" (Other — user provides free text)
- "Skip — no specific references"

**Round 4 — Cultural Notes:**

```
Parker Walbeck checks the production plan:
"Any audience-specific considerations I should know?
Language, sensitivities, what DOESN'T land with this crowd?"
```

- "Type cultural notes" (Other — user provides free text)
- "Skip — no special considerations"

### Step 5: Optional Video Path

AskUserQuestion:

```
Ryan Connolly holds up a hard drive:
"Got the actual video file? I can pull frames at B-roll moments
so Julius can see exactly what he's cutting around."
```

- "Paste video file path" (Other — user types)
- "No video file — text-only mode"

If provided, verify with `ls -la "{path}"`.

### Step 6: Create Registry Entry

1. Generate slug from project name (lowercase, hyphens, no special chars)
2. Create output directory:
```bash
mkdir -p ~/.claude/projects/sixth-sense-sage/{slug}
```
3. Extract `runtime` from the English SRT file: read the last timecode in the file (the end time of the final subtitle block, e.g., `00:16:41,280`) and store as `"runtime": "16:41"` (MM:SS or H:MM:SS). This populates `{VIDEO_DURATION}` for agent prompts and `{RUNTIME}` for the HTML template.
4. Build tone profile object from interview responses
5. Read existing registry, merge new project entry, write back
6. **Registry write verification:** Immediately read back the registry file and verify it parses as valid JSON. If corrupt, warn user and offer to rewrite.
7. Set `status.context = "complete"`
8. Update `last_updated` to today's date

**Proceed to Phase 2.**

---

## PHASE 2: B-Roll Discovery (3 Agents, Sequential)

**Triggered by:** Resume at a1_sweep, a2_gaps, or a3_synthesize, or after Phase 1.

This is the core pipeline. The three agents run SEQUENTIALLY because A2 reads A1's output and A3 reads both.

### Critical: Orchestrator Prompt Injection Pattern

Task subagents CANNOT read plugin reference files. The orchestrator MUST:

1. Read `references/agent-prompts.md`
2. Extract each agent's prompt section (between the section headers)
3. Resolve ALL `{VARIABLE}` placeholders with real values from the registry:
   - `{SRT_EN_PATH}` — absolute path to the English SRT file (agents read files themselves)
   - `{SRT_SOURCE_PATH}` — absolute path to the source language SRT (if is_translated = true; only needed for A3 and Boss Foreman)
   - `{TONE_PROFILE}` — JSON-formatted tone profile from registry
   - `{OO_EXCERPT}` — relevant sections from the OO (ICA, transformation promise, core beliefs)
   - `{OUTPUT_DIR}` — output directory path
   - `{PROJECT_NAME}` — human-readable project name
   - `{PROJECT_SLUG}` — slug from registry
   - `{SOURCE_LANGUAGE}` — source language name (e.g., "German")
   - `{VIDEO_DURATION}` — total video runtime (e.g., "16:41"), extracted from the last timecode in the SRT during Phase 1
   - `{COUNSEL_NAMES}` — all 5 counsel members with roles (e.g., "Daniel Schiffer (B-roll craft), Parker Walbeck (practical production)...")

**Monolingual variable resolution (when `is_translated = false`):**
   - Set `{SOURCE_LANGUAGE}` to `"English"`
   - Set `{SRT_SOURCE_PATH}` to `"N/A -- monolingual project"` (only A3 and Boss Foreman receive this; they will skip bilingual mapping)
   - Omit `{SRT_SOURCE_CONTENT}` from all prompts
   - In Phase 5 Master Edit Sheet: skip bilingual columns (CUT-IN DE/CUT-OUT DE), use single-language template
   - In Phase 5 Master Script page: use single-column layout
   - `{A1_OUTPUT_PATH}` — path to A1's output file (for A2)
   - `{A1_A2_OUTPUT_PATHS}` — both A1 and A2 paths with labels (for A3: "A1 output: [path]\nA2 output: [path]")
   - `{LAST_BRM_ID}` — last BRM ID number from A1's output (for A2, so it continues numbering)
4. Append the Shared Rules section to each prompt
5. Inject the complete, resolved prompt into the Task instruction

### Agent A1: First Sweep Scanner

**Purpose:** Read the full English SRT. Identify every moment that benefits from B-roll.

**Deploy:**
1. Set `status.a1_sweep = "in_progress"` in registry
2. Read English SRT file content
3. Read agent-prompts.md, extract A1 section
4. Resolve all variables
5. Deploy as Task subagent

**Expected output:** `{output_dir}/broll-map-a1.md`

**Output format per moment:**
| Field | Description |
|-------|-------------|
| `id` | Sequential (BRM-001, BRM-002...) |
| `timecode_start` | From SRT (e.g., 00:06:43,840) |
| `timecode_end` | From SRT |
| `transcript_text` | The spoken text during this moment |
| `category` | One of: emotional, technical, descriptive, proof, metaphorical, aspirational |
| `why_broll` | 1-2 sentence explanation |
| `suggested_visual` | What should be shown |
| `duration_range` | Suggested B-roll duration (e.g., "3-5s") |
| `visual_type` | One of: full-screen, overlay, split-screen, PIP |
| `audio_tag` | One of: vo-continues, audio-bed, silence, mixed |
| `mood_tag` | One of: warm-grounded, cool-clinical, dark-dramatic, bright-aspirational, mystical-ethereal |

**Validation:**
1. File exists at `{output_dir}/broll-map-a1.md`
2. Minimum 80 lines
3. Contains `## Summary` section
4. Contains `## B-Roll Map` section with BRM-001 entries
5. Count actual BRM entries and compare to stated summary count

If summary count does not match actual entry count (POC bug: A1 said 62 but delivered 86), log the discrepancy but proceed — the actual entries are what matter, not the agent's arithmetic.

**Low-count sanity check:** If the video is >5 minutes (based on `runtime` in registry) and A1 found fewer than 10 BRM entries, flag to user: "A1 found only [N] moments for a [runtime] video. This may indicate a parsing issue or degenerate output. Recommend re-running A1." Offer via AskUserQuestion: "Re-run A1" / "Proceed anyway — the video may genuinely have few B-roll moments"

**On validation fail:** Report to user what's missing. Offer re-run of A1 only.

**On validation pass:**
- Set `status.a1_sweep = "complete"`
- Set `files.broll_map_a1 = "{output_dir}/broll-map-a1.md"`
- Extract: total moment count, category breakdown
- Display summary to user

### Agent A2: Gap Hunter

**Purpose:** Read A1's output + the English SRT. Find moments A1 missed.

**Deploy:**
1. Set `status.a2_gaps = "in_progress"` in registry
2. Read A1's output file
3. Extract A1's last BRM ID number (e.g., if last was BRM-086, A2 starts at BRM-087)
4. Read agent-prompts.md, extract A2 section
5. Resolve all variables including `{A1_OUTPUT_PATH}` and `{LAST_BRM_ID}` (A2 reads A1's file itself via the path)
6. Deploy as Task subagent

**Expected output:** `{output_dir}/broll-map-a2-gaps.md`

**Validation:**
1. File exists at `{output_dir}/broll-map-a2-gaps.md`
2. Minimum 20 lines
3. IDs continue from A1's last entry (no ID collisions)
4. No timecode overlaps with A1's entries (A2 should check this internally)

**On validation fail:** Report to user. Offer re-run of A2 only.

**On validation pass:**
- Set `status.a2_gaps = "complete"`
- Set `files.broll_map_a2 = "{output_dir}/broll-map-a2-gaps.md"`
- Extract: supplementary moment count
- Display summary

### Agent A3: Synthesizer

**Purpose:** Merge A1 + A2 outputs into the final B-Roll Map with visual threads and priorities.

**Deploy:**
1. Set `status.a3_synthesize = "in_progress"` in registry
2. Read both A1 and A2 output files
3. Read agent-prompts.md, extract A3 section
4. Resolve all variables including `{A1_A2_OUTPUT_PATHS}` (A3 reads both files itself via the paths)
5. Deploy as Task subagent

**Expected output:** `{output_dir}/broll-map-final.md`

**Validation (all 5 required):**
1. File exists at `{output_dir}/broll-map-final.md`
2. Contains `## Executive Summary` section
3. Contains `## Master Timeline` section
4. Contains `## Visual Threads` section with thread identifiers (Thread A through Thread L or similar)
5. Contains `## Category Breakdowns` section
6. Contains `## Production Notes` section
7. Entry count in Executive Summary matches actual table rows in Master Timeline

**Additional validation:** Compare the stated merged count against the sum of A1 + A2 entries (accounting for overlaps resolved). If the numbers diverge by more than 5, flag it but proceed.

**On validation fail:** Report what's missing. Offer re-run of A3 only.

**On validation pass:**
- Set `status.a3_synthesize = "complete"`
- Set `files.broll_map_final = "{output_dir}/broll-map-final.md"`
- Extract: merged count, thread count, priority breakdown, overlap resolutions

### Post-Discovery Dashboard

After all 3 agents complete, display:

```
+==============================================================+
|  DISCOVERY COMPLETE                                          |
+==============================================================+
|  A1 First Sweep:   [X] moments identified                   |
|  A2 Gap Hunter:    [Y] supplementary moments                |
|  A3 Synthesizer:   [Z] merged | [N] threads | priorities:   |
|                    P1: [n] | P2: [n] | P3: [n]              |
|  Overlaps resolved: [n]                                      |
+==============================================================+
```

AskUserQuestion:
- "Review the B-Roll Map" — read and display broll-map-final.md summary
- "Continue to Phase 3 (Foreman Sourcing)" — proceed
- "Re-run a specific agent" — pick A1, A2, or A3
- "Save and exit" — save registry, end session

**Proceed to Phase 3.**

---

## PHASE 3: Foreman Sourcing Decisions

**Triggered by:** Resume at foreman step, or after Phase 2 completes.

This phase presents sourcing options by thread and collects user selections. The Foreman reviews A3's final B-roll map, determines literal vs metaphorical for each moment, and proposes sourcing defaults by thread. User approves in batch (POC learning: dramatically faster than per-moment).

### Step 1: Read A3 Output

1. Read `{output_dir}/broll-map-final.md` (A3's synthesized output)
2. Extract:
   - All visual threads (Thread A through Thread L or similar) with their arc summaries and member moments
   - All standalone moments (those not assigned to any thread)
   - The priority distribution (P1/P2/P3 counts)
   - Category breakdown

### Step 2: Check for Existing Selections (Re-Run Safety)

1. Check if `{output_dir}/user-selections.json` already exists
2. If it exists:
   - Read it and compare against the current B-roll map
   - Match existing selections against the current map by `timecode_start` (not BRM ID), since A3 renumbers all entries sequentially on each run and IDs may shift
   - Identify NEW moments (in the map but not in selections) and REMOVED moments (in selections but no longer in the map)
   - If no changes: "Your previous sourcing selections are still valid. Want to review them, or skip to Phase 4?"
   - If changes exist: "Found [N] new moments and [M] removed moments since your last sourcing session. I'll only ask about the new ones."
3. If it does not exist, proceed to Step 3 (fresh sourcing)

### Step 3: Present Threads with Sourcing Defaults (Batch)

Present ALL threads in a single display. For each thread, show:

```
+==============================================================+
|  THREAD [LETTER]: [NAME]                                      |
|  Arc: [arc summary]                                           |
|  Moments: [count] | Priorities: P1:[n] P2:[n] P3:[n]         |
|                                                               |
|  PROPOSED SOURCE: [default source]                            |
|  Rationale: [why this source fits this thread]                |
+==============================================================+
```

**Default sourcing logic (Foreman heuristics):**

| Thread Content | Default Source | Rationale |
|---------------|---------------|-----------|
| Couple / emotional scenes | Artgrid stock | Story bundles provide visual consistency with same actors |
| Scientific / data / frameworks | Motion graphics / diagrams | Text, charts, and animated concepts need design, not footage |
| Abstract / metaphorical | AI-generated video (Runway Gen-3) | Non-literal imagery that stock cannot deliver |
| Props (phone, thermostat) | DIY shoot | Simple setups, specific props, example-contact's team can handle |
| Client's personal journey | Client footage | Authenticity is non-negotiable for personal moments |
| Nature / landscape / general | Artgrid stock | High-quality stock is ideal for environmental shots |
| Body language / physical | Artgrid stock | Real human bodies, not AI-generated |
| Authority citations / quotes | Motion graphics | Clean text overlays, branded graphics |

After presenting all threads, use AskUserQuestion:

```
THE SAGE'S SOURCING COUNCIL

The Foreman steps forward with a production board showing all 12 threads,
each pinned to a source type.

"Here's how I'd source this whole production.
Most threads map cleanly to one source.
Override anything that doesn't feel right."
```

- "Approved — all defaults look good"
- "Mostly good, a few adjustments needed" — then ask which threads to override, present alternatives
- "Different approach — let me re-source from scratch"

### Step 4: Present Standalone Moments (Grouped by Category)

For moments not assigned to any thread, group by B-roll category and present with proposed defaults:

```
+==============================================================+
|  STANDALONE MOMENTS (not in visual threads)                   |
+==============================================================+
|  EMOTIONAL (n moments): Artgrid stock                        |
|  TECHNICAL (n moments): Motion graphics                      |
|  DESCRIPTIVE (n moments): Artgrid stock                      |
|  PROOF (n moments): Motion graphics                          |
|  METAPHORICAL (n moments): AI-generated                      |
|  ASPIRATIONAL (n moments): Artgrid stock                     |
+==============================================================+
```

AskUserQuestion:
- "Approved — defaults work for standalones too"
- "Override some categories" — ask which, present alternatives
- "Review moment-by-moment" — show individual moments for edge cases

### Step 4b: Foreman Agent Refinement (Optional)

After the user has batch-approved thread and standalone sourcing defaults, offer detailed per-moment refinement via the Foreman agent.

AskUserQuestion:
- "Run the Foreman for detailed per-moment refinement (Recommended) — classifies literal vs metaphorical, proposes specific Artgrid search terms and AI prompts per moment"
- "Skip — batch sourcing is enough"

**If running the Foreman:**
1. Read `references/agent-prompts.md`, extract the Foreman agent prompt section
2. Resolve all variables: `{BROLL_MAP_PATH}`, `{USER_SELECTIONS_PATH}`, `{TONE_PROFILE}`, `{OUTPUT_DIR}`, `{COUNSEL_NAMES}`
3. Deploy as Task subagent
4. Expected output: `{output_dir}/foreman-sourcing-details.md`
5. On completion, display a summary of literal/metaphorical/hybrid classifications and offer to review before proceeding

### Step 5: Per-Moment Override (Optional)

If user requested adjustments in Step 3 or Step 4:

1. Show only the moments/threads that need overrides
2. For each, present 2-3 alternative sourcing options:
   - Option 1: [Original default] (recommended)
   - Option 2: [Alternative source with rationale]
   - Option 3: [Second alternative]
3. User selects per-moment via AskUserQuestion

### Step 6: Save Selections

1. Build `user-selections.json` with this schema:

```json
{
  "project_slug": "slug",
  "created": "YYYY-MM-DD",
  "last_updated": "YYYY-MM-DD",
  "source_broll_map": "broll-map-final.md",
  "thread_selections": {
    "A": {
      "name": "Thread A: Disconnected Couple to Connected Couple",
      "default_source": "artgrid",
      "moments": {
        "BRM-002": { "source": "artgrid", "override": false },
        "BRM-005": { "source": "artgrid", "override": false },
        "BRM-028": { "source": "artgrid", "override": false, "continuity_note": "Same actors as BRM-005" }
      }
    }
  },
  "standalone_selections": {
    "BRM-009": { "source": "motion_graphics", "category": "technical", "override": false },
    "BRM-015": { "source": "artgrid", "category": "proof", "override": false }
  },
  "source_summary": {
    "artgrid": 46,
    "ai_generated": 12,
    "motion_graphics": 19,
    "diy_shoot": 8,
    "client_footage": 6,
    "mixed": 6
  }
}
```

2. Write to `{output_dir}/user-selections.json`
3. Update registry:
   - `status.foreman = "complete"`
   - `files.user_selections = "{output_dir}/user-selections.json"`
   - `last_updated = today`

### Step 7: Sourcing Summary Dashboard

```
+==============================================================+
|  FOREMAN SOURCING COMPLETE                                    |
+==============================================================+
|  Artgrid Stock:        [N] moments                           |
|  AI-Generated:         [N] moments                           |
|  Motion Graphics:      [N] moments                           |
|  DIY Shoot:            [N] moments                           |
|  Client Footage:       [N] moments                           |
|  Mixed:                [N] moments                           |
|                                                               |
|  Overrides:            [N] moments changed from defaults     |
|  Total:                [N] moments sourced                   |
+==============================================================+
```

AskUserQuestion:
- "Continue to Phase 4 (Production Brief)" — proceed
- "Review selections" — display full user-selections.json
- "Re-source a specific thread" — pick thread, re-do Step 3 for that thread only
- "Save and exit" — save registry, end session

**Proceed to Phase 4.**

---

## PHASE 4: Production Brief Generator

**Triggered by:** Resume at brief step, or after Phase 3 completes.

This phase deploys a Boss Foreman agent that synthesizes all Phase 2-3 outputs into a comprehensive production brief with bilingual mapping, Artgrid search URLs, AI-gen prompts, and thread continuity guides.

### Step 1: Gather All Inputs

The orchestrator reads and prepares these files for the Boss Foreman agent:

1. **B-roll map:** `{output_dir}/broll-map-final.md` (A3 output)
2. **User selections:** `{output_dir}/user-selections.json` (Phase 3 output)
3. **English SRT:** from registry `srt_en_path`
4. **Source language SRT:** from registry `srt_source_path` (only if `is_translated = true`)
5. **Tone profile:** from registry `tone_profile`
6. **OO excerpt:** ICA summary, transformation promise, core beliefs from the registered OO. If `oo_path` is `null` in registry, set `{OO_EXCERPT}` to: `"No Offer Optimizer loaded for this project. Rely on tone profile and interview data for client context."`

Verify all files exist before deploying the agent. If any are missing, report which ones and offer to re-run the relevant phase.

### Step 2: Deploy Boss Foreman Agent

1. Set `status.brief = "in_progress"` in registry
2. Read `references/agent-prompts.md`
3. Extract the Boss Foreman prompt section
4. Resolve ALL variables:
   - `{BROLL_MAP_PATH}` — path to broll-map-final.md (agent reads this file)
   - `{USER_SELECTIONS_PATH}` — path to user-selections.json (agent reads this file)
   - `{SRT_EN_PATH}` — path to English SRT (agent reads this file)
   - `{SRT_SOURCE_PATH}` — path to source language SRT (agent reads this file, only if is_translated)
   - `{TONE_PROFILE}` — JSON tone profile injected inline
   - `{OUTPUT_DIR}` — output directory path
   - `{PROJECT_SLUG}` — slug from registry
   - `{SOURCE_LANGUAGE}` — e.g., "German"
   - `{IS_TRANSLATED}` — "true" or "false"
   - `{PROJECT_NAME}` — human-readable name
   - `{OO_EXCERPT}` — ICA summary, transformation promise, core beliefs
5. Append Shared Rules section
6. Deploy as Task subagent

**Expected output:** `{output_dir}/{PROJECT_SLUG}_PRODUCTION_BRIEF.md`

### Step 3: Boss Foreman Output Structure (8 Sections)

The Boss Foreman produces a single markdown file with these sections:

**Section 1: Brief Overview**
- Project metadata (name, video duration, language, date)
- Source breakdown table (Artgrid count, AI-gen count, motion graphics count, DIY count, client footage count, mixed count)
- Priority distribution (P1/P2/P3 counts)
- How-to-use guide for the editor

**Section 2: Master Edit Sheet (Chronological)**
- One entry per B-roll moment, ordered by timecode
- Each entry includes all fields in this format:

```
### BRM-001 | 00:00 | P1 | Thread J1

| Field | Value |
|-------|-------|
| CUT-IN DE | "[source language phrase at cut-in timecode]" |
| CUT-IN EN | "[English translation of cut-in]" |
| B-Roll | [visual description from B-roll map] |
| Duration | [duration range] |
| Type | [full/overlay/PIP/split] |
| CUT-OUT DE | "[source language phrase at cut-out timecode]" |
| CUT-OUT EN | "[English translation of cut-out]" |
| Source | [ART/AI/MG/DIY/JF/MIX] |
| Mood | [mood tag] |
| CONTINUITY | [if part of a thread: note bookend pairs, same-actor requirements] |
```

- **Bilingual mapping** (only when `is_translated = true`): For each moment, the agent cross-references the English SRT timecode against the source language SRT and extracts the EXACT source language phrase being spoken at the CUT-IN and CUT-OUT timecodes, plus their English translations
- When `is_translated = false`: CUT-IN/CUT-OUT fields use the English transcript only (no DE/source language fields)

**Section 3: Artgrid Search Terms**
- Grouped by visual need (Couples, Body Language, Corporate, Nature, etc.)
- For each Artgrid-sourced moment: 3 search queries
- Each query includes a direct search URL: `https://artgrid.io/?search=TERM`
- Filter recommendations (16:9, minimum duration, etc.)

**Section 4: AI-Gen Prompts**
- All prompts formatted for Runway Gen-3 (copyable)
- Each prompt includes: full text prompt, style tag, duration, camera movement
- Target format: 16:9, 4-8 seconds

**Section 5: Motion Graphics / Diagrams**
- For each motion graphic moment: description, text content, animation style, color palette
- Style guide reference (client's visual language from tone profile)

**Section 6: DIY Shoot List**
- Grouped by setup (e.g., "Phone/Apps Sequence," "Thermostat Sequence")
- For each: props needed, setup instructions, shots to capture (with composition and lighting notes)
- Practical enough that a team with a phone camera or basic mirrorless can execute

**Section 7: Client Footage Requests**
- For each client-footage moment: what is needed, where to find it, what to do if unavailable
- Priority order (longest lead time first)

**Section 8: Thread Visual Continuity Guide**
- For each visual thread: consistency rules (same actors, same props, same lighting, same lens)
- Bookend pair requirements (which moments MUST match visually)
- Color temperature evolution within threads
- Non-negotiable constraints per thread

### Step 4: Validation (Orchestrator, Not Agent)

After the Boss Foreman writes the brief, the orchestrator validates:

**Check 1: Entry Count**
- Count the number of `### BRM-` entries in the brief
- Compare against A3's final count from broll-map-final.md
- If mismatch: log it, report to user, offer re-run

**Check 2: Timecode Fidelity** (only when `is_translated = true`)
- For a sample of 5-10 entries, verify the CUT-IN timecode exists in both the English and source language SRTs
- If a timecode is present in English SRT but absent in source language SRT, flag it (may indicate SRT alignment issue)

**Check 3: Source Language Phrase Spot-Check** (only when `is_translated = true`)
- For the same 5-10 entries, read the source language SRT at the CUT-IN timecode
- Verify the source language phrase in the brief matches what the SRT file actually says at that timecode
- If mismatches: report to user, note the BRM IDs

**Check 4: Source Type Coverage**
- Verify every source type in user-selections.json has a corresponding section in the brief
- If Artgrid moments exist, Section 3 must have search terms
- If AI-gen moments exist, Section 4 must have prompts
- If motion graphics moments exist, Section 5 must have descriptions
- If DIY moments exist, Section 6 must have shoot instructions
- If client footage moments exist, Section 7 must have requests

### Step 5: Artgrid Search URL Generation (Orchestrator Post-Processing)

After validation, the orchestrator scans Section 3 of the brief and ensures every Artgrid search term has a direct URL. The format:

```
https://artgrid.io/?search=couple+in+bed+emotional+distance
```

- Spaces in search terms become `+` in URLs
- Each search query gets its own URL on a separate line
- If the Boss Foreman already generated URLs, verify the domain is `artgrid.io` (NOT `artlist.io`)

### Step 6: Update Registry

1. Set `status.brief = "complete"`
2. Set `files.production_brief = "{output_dir}/{PROJECT_SLUG}_PRODUCTION_BRIEF.md"`
3. Update `last_updated` to today's date

### Step 7: Brief Delivery Dashboard

```
+==============================================================+
|  PRODUCTION BRIEF COMPLETE                                    |
+==============================================================+
|  File: {PROJECT_SLUG}_PRODUCTION_BRIEF.md                    |
|  Size: [file size]                                            |
|  Entries: [N] B-roll moments mapped                          |
|                                                               |
|  Sections:                                                    |
|  1. Brief Overview          -- [OK]                          |
|  2. Master Edit Sheet       -- [N] entries, bilingual: [Y/N] |
|  3. Artgrid Search Terms    -- [N] moments, [N] URLs         |
|  4. AI-Gen Prompts          -- [N] prompts (Runway format)   |
|  5. Motion Graphics         -- [N] descriptions              |
|  6. DIY Shoot List          -- [N] setups                    |
|  7. Client Footage          -- [N] requests                  |
|  8. Thread Continuity       -- [N] threads documented        |
|                                                               |
|  Validation:                                                  |
|  Entry count:    [PASS/FAIL]                                 |
|  Timecode check: [PASS/FAIL/SKIPPED]                         |
|  Phrase check:   [PASS/FAIL/SKIPPED]                         |
|  Source coverage: [PASS/FAIL]                                |
+==============================================================+
```

AskUserQuestion:
- "Review the Production Brief" — read and display key sections
- "Continue to Phase 5 (HTML Playbook)" — proceed (Milestone 3)
- "Re-generate the brief" — re-run Boss Foreman
- "Save and exit" — save registry, end session

**Proceed to Phase 5.**

---

## PHASE 5: HTML Playbook + Deploy

**Prerequisites:** Phase 4 complete (production brief exists), registry has `status.brief = "complete"`.

### Step 1: Read Template and Data

1. Read `references/html-template.md` for the parameterized HTML templates and variable resolution guide
2. Read the project registry for metadata (`project_name`, `project_slug`, `runtime`, `last_updated`, Artgrid URLs)
3. Read `broll-map-final.md` and parse all BRM entries
4. Read `{PROJECT_SLUG}_PRODUCTION_BRIEF.md` for thread arcs, DIY shoot list, style guide, priority order

### Step 2: Color Palette Selection

AskUserQuestion:
- "Use default earth tone palette (cream, gold, charcoal, sky blue)" -- proceed with defaults from template
- "Customize the color palette" -- collect 3 accent colors + background/card/text colors
- Colors are CSS hex values injected into the template's `:root` variables

Default palette:
| Variable | Default | Role |
|----------|---------|------|
| `{COLOR_BG}` | `#1a1612` | Page background |
| `{COLOR_CARD}` | `#2a2420` | Card background |
| `{COLOR_CARD_HOVER}` | `#342e28` | Card hover state |
| `{COLOR_TEXT}` | `#f5f0e8` | Primary text |
| `{COLOR_TEXT_SEC}` | `#b8a99a` | Secondary text |
| `{COLOR_ACCENT_1}` | `#c9a84c` | Gold (headings, highlights) |
| `{COLOR_ACCENT_2}` | `#7fb5c9` | Sky blue (links, English text) |
| `{COLOR_ACCENT_3}` | `#8b6b4a` | Earth brown (borders, P3) |

### Step 3: Build Moments Data

Iterate every BRM entry in the final B-roll map and build a JavaScript object per moment:

```json
{
  "id": "BRM-001", "tc": "00:00", "p": "P1", "threads": ["J1"],
  "cat": "emotional", "cutInDe": "...", "cutInEn": "...",
  "broll": "...", "dur": "5-7s", "type": "full",
  "audio": "vo-continues", "mood": "dark-dramatic",
  "cutOutDe": "...", "cutOutEn": "...", "src": "ART",
  "search": ["query 1", "query 2"], "aiPrompt": null,
  "continuity": null, "cutCandidate": false, "note": null
}
```

For monolingual projects (`is_translated = false`): use `cutIn`/`cutOut` instead of `cutInDe`/`cutOutDe`. The template's JS rendering engine handles both formats automatically.

Build the thread map: `{"A": ["BRM-005","BRM-028",...], "B": [...]}`

Serialize both as JSON for template injection.

### Step 4: Generate HTML Sections

From the production brief, generate:

1. **Sidebar links:** One `<a>` per thread with letter and name, one per source type with count
2. **Dashboard cards:** Total moments, P1/P2/P3 counts, runtime, target coverage percentage
3. **Source breakdown bar:** Colored `<div>` segments proportional to source type counts
4. **Priority shooting order:** Ordered `<ol>` from the brief's priority guidance
5. **Thread sections:** Per thread: name, arc description, continuity notes, empty `<div class="thread-cards" data-thread="{LETTER}">` container (JS fills these at runtime)
6. **DIY shoot list:** Checklist HTML from the brief's Section 6
7. **Style guide:** Mood legend, audio handling definitions, visual types, color temperature arc, bookend pairs
8. **Source filter buttons:** One `<button>` per source type present in the data (e.g., Artgrid, AI-Gen, MoGraph, DIY, Client Footage)

### Step 5: Generate Master Script Page

1. Read the English SRT file, parse timecodes and subtitle text
2. If bilingual (`is_translated = true`): read the source language SRT, align entries by timecode
3. Generate table rows:
   - Bilingual: `<tr><td class="script-ts">{TC}</td><td class="script-de">{SOURCE_TEXT}</td><td class="script-en">{EN_TEXT}</td></tr>`
   - Monolingual: `<tr><td class="script-ts">{TC}</td><td>{TEXT}</td></tr>`
4. Add `class="minute-mark"` to the first row of each new minute
5. Set `{LANG_LABEL}`:
   - Bilingual: `"{Source Language} (Original) & English (Translation)"`
   - Monolingual: `"English"`
6. Set `{TABLE_HEADERS}` based on bilingual/monolingual

### Step 6: Resolve Templates and Write Files

1. Read Template 1 (B-Roll Playbook) from `references/html-template.md`
2. Replace all `{VARIABLE}` placeholders with generated content
3. Write to `{output_dir}/{PROJECT_SLUG}_BROLL_PLAYBOOK.html`
4. Read Template 2 (Master Script) from `references/html-template.md`
5. Replace all `{VARIABLE}` placeholders
6. Write to `{output_dir}/{PROJECT_SLUG}_MASTER_SCRIPT.html`
7. Cross-link: Playbook links to `{PROJECT_SLUG}_MASTER_SCRIPT.html`, Master Script links back to `{PROJECT_SLUG}_BROLL_PLAYBOOK.html`

### Step 7: Deploy Decision

AskUserQuestion:
- "Deploy to Vercel" -- deploy and get live URL
- "Save locally only" -- keep files in output_dir, skip deploy
- "Both" -- deploy AND keep local copies

**If deploying to Vercel:**

First, verify Vercel CLI is available:
```bash
npx vercel --version 2>/dev/null
```
If not found, inform user: "Vercel CLI not available. Install with `npm i -g vercel` or choose 'Save locally' instead." and fall back to local save.

If Vercel CLI is available, display privacy note before deploying: "Note: Vercel deployments are publicly accessible by default. The playbook contains client names, transcript text, and B-roll descriptions. Confirm this is acceptable before deploying." AskUserQuestion: "Deploy — I understand it will be public" / "Cancel — save locally only"

If confirmed, proceed:
```bash
# Create temp deploy directory
mkdir -p /tmp/{PROJECT_SLUG}-deploy
cp {output_dir}/{PROJECT_SLUG}_BROLL_PLAYBOOK.html /tmp/{PROJECT_SLUG}-deploy/index.html
cp {output_dir}/{PROJECT_SLUG}_MASTER_SCRIPT.html /tmp/{PROJECT_SLUG}-deploy/{PROJECT_SLUG}_MASTER_SCRIPT.html
cd /tmp/{PROJECT_SLUG}-deploy
npx vercel deploy --prod --yes
```

- The playbook becomes `index.html` so it loads at the root URL
- The master script keeps its filename for cross-linking
- Store the returned Vercel URL in the registry

### Step 8: Update Registry

1. Set `status.playbook = "complete"`
2. Set `files.playbook_html = "{output_dir}/{PROJECT_SLUG}_BROLL_PLAYBOOK.html"`
3. Set `files.master_script_html = "{output_dir}/{PROJECT_SLUG}_MASTER_SCRIPT.html"`
4. If deployed: set `deploy.vercel_url = "{returned_url}"`
5. Update `last_updated`

### Step 9: Completion Dashboard

```
+==============================================================+
|  HTML PLAYBOOK COMPLETE                                       |
+==============================================================+
|  Playbook: {PROJECT_SLUG}_BROLL_PLAYBOOK.html                |
|  Master Script: {PROJECT_SLUG}_MASTER_SCRIPT.html            |
|  Moments: {MOMENT_COUNT} cards rendered                      |
|  Threads: {THREAD_COUNT} with sidebar navigation             |
|  Palette: {PALETTE_NAME}                                     |
|                                                               |
|  Features:                                                    |
|  - Sidebar nav with thread + source links                    |
|  - Search (text, BRM ID, thread, category)                   |
|  - Filters (priority, source type)                           |
|  - Collapsible cards with full B-roll details                |
|  - Copy buttons for Artgrid search terms + AI prompts        |
|  - Artgrid direct search links                               |
|  - DIY shoot checklist (interactive)                         |
|  - Print-friendly layout                                     |
|  - Mobile responsive                                         |
|                                                               |
|  Deploy: {VERCEL_URL or "Local only"}                        |
|  Local:  {output_dir}/                                       |
+==============================================================+
```

AskUserQuestion:
- "Continue to Phase 6 (Artgrid Browser Integration)" -- proceed
- "Open the playbook in browser" -- open local file or Vercel URL
- "Re-generate with different palette" -- re-run from Step 2
- "Save and exit" -- save registry, end session

---

## PHASE 6: Artgrid Browser Integration

**Prerequisites:** Phase 5 complete (playbook exists). Production brief has Artgrid search terms (Section 3).

**Reference file:** Read `references/artgrid-integration.md` for Playwright patterns, element selectors, and workflow details.

### Step 1: Artgrid Opt-In

AskUserQuestion:
- "Open Artgrid for clip sourcing" -- proceed to browser integration
- "Skip -- I'll source clips manually" -- mark Phase 6 as skipped in registry, proceed to completion

If skipped: set `status.artgrid = "skipped"`, display final completion dashboard, end session.

### Step 2: Open Artgrid and Authenticate

1. Open Playwright browser (default Chromium, no Chrome profile)
2. Navigate to `https://artgrid.io`
3. Display message: "Artgrid is open. Please sign in if needed."
4. AskUserQuestion: "I'm logged in and ready" / "I need help signing in" / "Cancel Artgrid sourcing"

**Critical rules:**
- NEVER close the browser during login. The user sees the window and is actively interacting.
- NEVER type credentials via Playwright. Authentication is manual.
- If user needs help: guide them to click "Log In" in the top right, enter their credentials manually.

### Step 3: Create Project Collection

1. Navigate to any search result or clip page
2. Click "Add to collection" on any clip
3. Type the project slug as the collection name (e.g., "example-collective", "EXAMPLE-BREATHWORK")
4. Click "Create" to establish the collection
5. The first clip gets added automatically. Confirm with user: "Created collection '{PROJECT_SLUG}'. First clip added."

If the collection already exists (from a prior session): skip creation, use the existing collection.

### Step 4: Thread-by-Thread Sourcing

Read the production brief Section 3 (Artgrid Search Terms). For each thread that has Artgrid-sourced moments:

1. **Run search:** Click the search combobox, type the first search term for this thread, press Enter
2. **Screenshot results:** Take a browser snapshot of the results grid
3. **Present to user:** "Thread {LETTER}: {THREAD_NAME}. Search: '{TERM}'. Here are the results."

AskUserQuestion:
- "Add clip #{N} to collection" -- click into the clip, add to project collection
- "Try next search term" -- run the next search query for this thread
- "Browse this story" -- click the story link to see related clips by the same filmmaker
- "Skip this thread" -- move to the next thread
- "Done with Artgrid" -- exit the sourcing loop

For each clip the user selects:
1. Click into the clip details page
2. Click "Add to collection"
3. Click "Add" next to the project collection name
4. Verify "Remove" button appears (confirms clip is in the collection)
5. Note the clip URL and filmmaker for the summary report

**Story bundles:** When a clip belongs to a story with multiple related clips, offer to browse the story. Story bundles are ideal for visual thread consistency (same actors, same camera, same setting across multiple clips).

### Step 5: Get Collection URL

After sourcing is complete:

1. Navigate to "My Collections" tab (under user's footage nav)
2. Find the project collection
3. Click the "Share" icon
4. Read the shareable URL from the textbox in the share dialog
5. URL format: `https://artgrid.io/my-collection/{ID}/{slug}`

### Step 6: Existing Collections Scan (Optional)

AskUserQuestion:
- "Scan existing collections for reusable clips" -- proceed to scan
- "Skip" -- move to completion

**If scanning:**
1. Navigate to "My Collections" tab
2. Screenshot the list of all collections (names and clip counts)
3. AskUserQuestion: "Which collections should I scan?" -- present collection names as selectable options
4. For each selected collection:
   - Open the collection
   - Screenshot its contents
   - Flag any clips that appear in 3+ project collections as "potentially overused"
5. Report findings to user

**Rules:**
- NEVER scan all collections by default. User selects.
- NEVER delete or modify existing collections. Read-only browsing.
- Overuse flags are suggestions, not restrictions.

### Step 7: Update Registry

1. Set `status.artgrid = "complete"` (or `"skipped"` if opted out)
2. Set `artgrid.collection_url = "{SHAREABLE_URL}"` (if created)
3. Set `artgrid.clips_added = {COUNT}` (number of clips added during this session)
4. If a story was found: set `artgrid.story_url = "{STORY_URL}"` and `artgrid.story_name = "{STORY_NAME}"`
5. Update `last_updated`

### Step 8: Phase 6 Completion Dashboard

```
+==============================================================+
|  ARTGRID SOURCING COMPLETE                                    |
+==============================================================+
|  Collection: {PROJECT_SLUG}                                  |
|  URL: {COLLECTION_URL}                                       |
|  Clips Added: {COUNT}                                        |
|  Threads Sourced: {THREADS_LIST}                             |
|  Stories Found: {STORY_NAMES or "None"}                      |
|                                                               |
|  Existing Collections Scanned: {SCANNED_LIST or "Skipped"}  |
|  Reusable Clips Found: {REUSE_COUNT or "N/A"}               |
+==============================================================+
```

### Step 9: Final Project Completion

If all phases are complete, display the master completion dashboard:

```
+==============================================================+
|  SIXTH SENSE SAGE -- PROJECT COMPLETE                         |
+==============================================================+
|  Project: {PROJECT_NAME}                                     |
|  Runtime: {RUNTIME}                                          |
|                                                               |
|  Phase 1: Interview .............. COMPLETE                  |
|  Phase 2: Discovery (3 agents) ... COMPLETE                  |
|  Phase 3: Sourcing + Brief ....... COMPLETE                  |
|  Phase 4: Production Brief ....... COMPLETE                  |
|  Phase 5: HTML Playbook .......... COMPLETE                  |
|  Phase 6: Artgrid Sourcing ....... {COMPLETE/SKIPPED}        |
|                                                               |
|  Deliverables:                                                |
|  - B-Roll Map: {MOMENT_COUNT} moments, {THREAD_COUNT} threads|
|  - Production Brief: {BRIEF_FILE}                            |
|  - HTML Playbook: {VERCEL_URL or LOCAL_PATH}                 |
|  - Master Script: {MASTER_SCRIPT_PATH}                       |
|  - Artgrid Collection: {COLLECTION_URL or "N/A"}            |
+==============================================================+
```

AskUserQuestion:
- "Open the playbook" -- open Vercel URL or local file
- "Re-run a specific phase" -- select phase to re-run
- "Start a new project" -- reset for new SRT files
- "Continue to Phase 7 (Hyperframes Handoff)" -- bridge to motion graphics build
- "Done" -- end session

---

## PHASE 7: Hyperframes Handoff (Optional)

**Prerequisites:** Phase 4 complete (production brief exists). At least one `motion_graphics` source decision in `user-selections.json`. Word-level `transcript.json` available (run `/transcript-extractor-plus` first if not).

Thin wrapper around the standalone `/hyperframes-handoff` skill. Bridges Sage's structured B-roll intelligence into a Hyperframes-ready project directory so the user can build motion graphics without re-explaining what Sage already knew.

### Step 1: Verify preconditions

1. Check `user-selections.json` for at least one `motion_graphics` source. If none: "No motion_graphics moments selected. Re-run Phase 3 and pick `motion_graphics` for at least one BRM, or skip this phase."
2. Check for word-level `transcript.json`. If only SRT exists: "Word-level transcript required. Run `/transcript-extractor-plus` on the source video first, then resume Phase 7."

### Step 2: Confirm scope

AskUserQuestion:
- "Default — manifest + transcript + video copy only (Tier 1)"
- "Scaffold full HTML stubs + design.md (Tier 2)"
- "Skip — I'll run /hyperframes-handoff manually later" — set `status.hyperframes_handoff = "skipped"` and end

### Step 3: Invoke the standalone skill

**Preflight — this phase needs the `hyperframes-handoff` skill, which ships separately.**
Check for it first. If `build_handoff.py` is not present, say so plainly, set
`status.hyperframes_handoff = "unavailable"`, and end this phase cleanly — everything
Sage produced up to here is already saved and usable. Do not fail the run.

```bash
HANDOFF="$(ls -d ~/.claude/plugins/*/hyperframes-handoff/scripts/build_handoff.py 2>/dev/null | head -1)"
[ -n "$HANDOFF" ] || { echo "hyperframes-handoff not installed — skipping Phase 7"; }

python "$HANDOFF" \
    --sage-output-dir {output_dir} \
    --project-slug {slug} \
    --transcript {transcript_path} \
    --source-video {video_path} \
    [--scaffold-stubs]
```

The standalone skill handles: validation gate, atomic emit, idempotency, manifest hash check, versioning on input change, privacy flag propagation, tone-to-design lookup.

### Step 4: Update registry

1. Set `status.hyperframes_handoff = "complete"` (or `"skipped"`)
2. Set `files.hyperframes_manifest = "{output_dir}/hyperframes/hyperframes.json"`
3. Update `last_updated`

### Step 5: Suggest next step

```
Hyperframes project at: {output_dir}/hyperframes/
Preview:    cd {output_dir}/hyperframes && npx hyperframes preview
Privacy:    {flag_state} — public deploy will gate if "required"
```

If `privacy.contains_client_data` is true, remind the user that Hyperframes deploy will refuse public Vercel pushes without re-confirmation.

**End of project pipeline. Phase 7 is the last optional phase.**

---

## Key Architecture Rules

1. **Skill orchestrates, agents scan.** The orchestrator reads + resolves agent prompts. Subagents cannot read plugin files.
2. **Agents are sequential in Phase 2.** A2 needs A1's output, A3 needs both. Never run them in parallel.
3. **Each agent writes to its own file.** No write conflicts. A1 writes broll-map-a1.md, A2 writes broll-map-a2-gaps.md, A3 writes broll-map-final.md.
4. **Registry tracks per-phase status.** Resume at any failed phase without re-running completed ones.
5. **Agent prompts live in reference files.** Orchestrator injects resolved prompts into Task instructions.
6. **Gold-standard examples in agent prompts improve output quality.** Include the example-collective POC example in each agent's prompt.
7. **OO-as-Bible:** All sourcing decisions reference the client's Offer Optimizer. Tone profile is derived from OO data.
8. **Bilingual mapping only activates when `is_translated = true`.** Monolingual projects skip source-language cross-referencing.
9. **Artgrid (NOT Artlist) for stock footage sourcing.** This was a POC correction. All prompts, UI text, and documentation must say "Artgrid."
10. **All output deployed to Vercel unless user chooses local save.** Vercel is the default deployment target.
11. **User selections are stored separately from the B-Roll Map.** Re-running Phase 2 does not destroy Foreman selections from Phase 3.
12. **Count validation is mandatory.** After A3, verify that stated entry counts match actual table rows. Log discrepancies.

---

## Error Handling

### Agent Produces Empty Output
- Check if SRT file was readable (file exists, non-zero size, contains valid SRT format)
- Check if the SRT content was too large for the agent's context (for very long videos, consider chunking)
- Offer retry with a note about the issue

### Agent Validation Fails
- Show what's missing (e.g., "A3 output is missing the Visual Threads section")
- Set that agent's status to "failed" in registry
- Offer re-run of that specific agent only
- Do NOT re-run upstream agents unless the user requests it

### SRT File Not Found
- Ask user for correct path
- Offer to browse common locations (Downloads, Dropbox, Desktop)
- If source language SRT is missing, offer to proceed in monolingual mode

### OO File Not Found
- Proceed without OO but warn: tone profile will rely entirely on the interview responses
- Counsel notes will be less specific without OO context

### A1 Count Discrepancy
- Log the discrepancy (e.g., "A1 reported 62 in summary but delivered 86 entries")
- Use the ACTUAL entry count, not the agent's stated count
- This is a known agent behavior — the output is correct even when the math is wrong

### Registry Corruption
- Always read before writing — merge, never overwrite
- After every registry write, read back and verify valid JSON (see Phase 1 Step 6)
- If registry is unreadable (malformed JSON), offer to:
  - **Rebuild from existing output files:** Scan `~/.claude/projects/sixth-sense-sage/` for project directories. For each directory, check for: `broll-map-a1.md` (a1_sweep), `broll-map-a2-gaps.md` (a2_gaps), `broll-map-final.md` (a3_synthesize), `user-selections.json` (foreman), `*_PRODUCTION_BRIEF.md` (brief), `*_BROLL_PLAYBOOK.html` (playbook). Set status to `"complete"` for each found file's corresponding phase. Reconstruct registry entry from file metadata (slug from directory name, dates from file timestamps).
  - Start fresh with a new registry

### Context Overflow for Long Videos
- For SRTs with more than 3000 lines, warn user that agents may hit context limits
- Offer to chunk the SRT into segments (first half / second half) and run discovery in two passes
- A3 Synthesizer would then merge outputs from both passes

---

## B-Roll Category Definitions

These categories guide A1's classification and downstream sourcing decisions:

| Category | Definition | Example |
|----------|-----------|---------|
| **emotional** | Vulnerability, pain points, breakthrough moments, personal stories | Speaker shares childhood trauma, tears up during testimony |
| **technical** | Scientific concepts, research citations, methodologies | Polyvagal theory diagram, ACE study statistics, nervous system illustration |
| **descriptive** | "Imagine this..." scenes, future-pacing, before/after visualizations | "Picture yourself waking up without anxiety" — show person waking calm |
| **proof** | Client testimonials, results, statistics, authority citations | "87% of participants reported..." — show data visualization |
| **metaphorical** | Parables, analogies, abstract concepts | Fish/water analogy — show fish swimming; thermostat metaphor — show thermostat |
| **aspirational** | Transformation promises, "what if" scenarios, desired outcomes | "What if you could..." — show person living the desired life |

---

## Moment Output Field Reference

Each B-roll moment captured by the agents includes these fields:

| Field | Values | Usage |
|-------|--------|-------|
| `visual_type` | full-screen (replaces camera), overlay (speaker still visible), split-screen, PIP (picture-in-picture) | Tells editor HOW to composite the B-roll |
| `audio_tag` | vo-continues (speaker's voice plays over), audio-bed (B-roll has own ambient/music), silence (dramatic pause), mixed (VO + subtle ambient) | Tells editor what happens to the audio track |
| `mood_tag` | warm-grounded, cool-clinical, dark-dramatic, bright-aspirational, mystical-ethereal | Guides color grading and footage selection |
| `duration_range` | "3-5s", "6-10s", "10-15s" | Recommended B-roll duration at this moment |
| `category` | emotional, technical, descriptive, proof, metaphorical, aspirational | Drives sourcing strategy in Phase 3 |
