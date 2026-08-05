---
description: Transcribe videos in any language and translate to any target language using Whisper + AI translation
---

# Transcript Extractor Plus

## Overview

Transcribe video/audio files in any language using Whisper (local STT — whisper.cpp, via WSL on Windows / native on macOS+Linux), then translate to any target language using Claude AI. Supports local files and YouTube URLs. Outputs clean text transcripts, timestamped SRT subtitles, or both.

## Gold Standard — Editor Cut Map

When the job is to **tighten a long talking-head / interview / VSL recording for a human editor** (beyond transcribe / translate / mechanical cut-analysis), produce an **editor cut map** calibrated against the gold standard: read `references/gold-standard-editor-cut-map.md` FIRST. Non-negotiables: **never generalize a cut** (exact line + exact words removed + a coherence pass); full transcript shown **in context**; verbatim from the SRT (decision-map → generator); script-first; gems table; interactive HTML (collapse + sidebar TOC + search) deployed via the Vercel CLI from an isolated folder.

## File Locations

- **Registry (slim):** `~/.claude/projects/transcript-extractor-plus/registry.json` — dashboard data only (name, duration, languages, status)
- **Archive (full):** `~/.claude/projects/transcript-extractor-plus/registry-archive.json` — complete project data (file paths, speakers, settings, cut analysis config)
- **Translation agent prompt:** `references/translation-agent-prompt.md`
- **Cut analysis agent prompt:** `references/cut-analysis-agent-prompt.md`
- **Default output dir:** a `Transcripts/` folder beside the source file. Never write to a hardcoded absolute path — ask if the source location is not obvious.

## Supported Languages (Whisper)

Common languages (use ISO 639-1 codes with `--language`):
- de (German), en (English), fr (French), es (Spanish), it (Italian), pt (Portuguese)
- nl (Dutch), pl (Polish), ru (Russian), ja (Japanese), zh (Chinese), ko (Korean)
- ar (Arabic), tr (Turkish), hi (Hindi), sv (Swedish), da (Danish), no (Norwegian)
- Full list: any of Whisper's 99 supported languages. If the user names a language, map it to the ISO code.

## Dependencies

**Detect the platform FIRST.** Everything below branches on it, and `wsl` does not exist
outside Windows — running the Windows checks on macOS throws an unreadable error rather
than returning `MISSING`. Never show a `wsl` command to a non-Windows user.

| Platform | How whisper.cpp is invoked | Prefix used below as `$WHISPER` |
|---|---|---|
| **Windows** | Through WSL | `wsl -e bash -c "…"` |
| **macOS / Linux** | Natively — binary on PATH | run directly, no wrapper |

| Tool | Location | Check Command |
|------|----------|---------------|
| ffmpeg | PATH | `ffmpeg -version` |
| yt-dlp | PATH | `yt-dlp --version` |
| whisper-cli | **Win:** WSL `~/whisper.cpp/build/bin/whisper-cli` · **macOS/Linux:** `whisper-cli` on PATH | see Step 1 |
| Whisper model | `~/whisper.cpp/models/ggml-medium.bin` (same relative path both platforms) | see Step 1 |

Install guidance, per platform — only ever quote the row that matches:

| Platform | whisper.cpp | ffmpeg |
|---|---|---|
| Windows | Build in WSL: `cd ~/whisper.cpp && cmake -B build && cmake --build build --config Release` | `winget install ffmpeg` |
| macOS | `brew install whisper-cpp` | `brew install ffmpeg` |
| Linux | Build from source, or distro package | `apt install ffmpeg` / equivalent |

## Dual-File Registry Pattern

The registry uses two files: a **slim registry** for fast dashboard rendering, and a **full archive** for processing details.

### Slim Registry Schema (`registry.json`)

```json
{
  "saved_presets": {
    "preset-name": {
      "source_language": "de",
      "source_language_name": "German",
      "target_language": "en",
      "target_language_name": "English",
      "content_type": "ad",
      "speaker_mode": "single",
      "native_speaker": true,
      "output_format": "both",
      "whisper_model": "medium",
      "output_location": "next_to_source",
      "cut_analysis": {
        "enabled": true,
        "flags": ["silence", "restart", "filler", "false_start", "mistake", "stumble"],
        "silence_threshold_seconds": 2
      }
    }
  },
  "last_settings": { ... },
  "projects": {
    "slug": {
      "name": "Human-readable name",
      "source_name": "original_filename.mp4",
      "duration_formatted": "0m00s",
      "languages": "German -> English",
      "content_type": "testimonial|interview|montage|lecture|podcast|ad",
      "speaker_mode": "single|multi",
      "last_updated": "YYYY-MM-DD",
      "status": {
        "intake": "pending",
        "audio_extract": "pending",
        "transcription": "pending",
        "translation": "pending",
        "cut_analysis": "pending|skipped",
        "export": "pending"
      }
    }
  }
}
```

### Full Archive Schema (`registry-archive.json`)

```json
{
  "projects": {
    "slug": {
      "name": "Human-readable name",
      "slug": "slug",
      "source_type": "local|youtube",
      "source_path": "C:\\path\\to\\video.mp4 or https://youtube.com/...",
      "audio_path": "path to extracted .wav",
      "output_dir": "C:\\path\\to\\output\\slug",
      "duration_seconds": 0,
      "duration_formatted": "0m00s",
      "source_language": "de",
      "source_language_name": "German",
      "target_language": "en",
      "target_language_name": "English",
      "content_type": "testimonial|interview|montage|lecture|podcast|ad",
      "speaker_mode": "single|multi",
      "native_speaker": true,
      "output_format": "text|srt|both",
      "speakers": [],
      "whisper_model": "medium",
      "created": "YYYY-MM-DD",
      "last_updated": "YYYY-MM-DD",
      "status": {
        "intake": "pending",
        "audio_extract": "pending",
        "transcription": "pending",
        "translation": "pending",
        "cut_analysis": "pending",
        "export": "pending"
      },
      "files": {
        "source_transcript_txt": null,
        "source_srt": null,
        "translated_transcript_txt": null,
        "translated_srt": null,
        "cut_list": null,
        "annotated_source_txt": null,
        "annotated_translated_txt": null
      },
      "cut_analysis": {
        "enabled": false,
        "flags": [],
        "silence_threshold_seconds": 2
      }
    }
  }
}
```

### Read/Write Rules

| Action | Read From | Write To |
|--------|-----------|----------|
| Dashboard (Phase 0) | slim registry only | — |
| Resume project (load details) | archive | — |
| Create new project (Phase 1) | — | both (full to archive, slim to registry) |
| Update phase status (Phases 2-5) | archive (for processing) | both (status to registry, full update to archive) |
| File validation on resume | archive (has file paths) | — |
| Cross-project clip check | archive (has file paths) | — |

### Slim Entry Construction

When writing to the slim registry, extract from the full entry:
- `name`, `duration_formatted`, `content_type`, `speaker_mode`, `last_updated`, `status`
- `source_name`: `os.path.basename(source_path)`
- `languages`: `"{source_language_name} -> {target_language_name}"` or `"{source_language_name} (transcription only)"` if same

**Notes on `cut_analysis`:**
- `cut_analysis` at the project level is only populated when `content_type: "ad"` or user explicitly enables it
- `status.cut_analysis` is set to `"skipped"` for non-ad content types (not `"pending"`)
- `saved_presets` is at the registry root, separate from `last_settings` — presets are named, last_settings is automatic

---

## PHASE 0: Main Menu

**Every session starts here.**

1. Read `~/.claude/projects/transcript-extractor-plus/registry.json` (slim registry)
   - If it doesn't exist, create it with `{ "saved_presets": {}, "last_settings": {}, "projects": {} }`
   - Also ensure `registry-archive.json` exists (create with `{ "projects": {} }` if missing)

2. Build the dashboard. For each project in the registry, calculate progress:

```
╔══════════════════════════════════════════════════════════════╗
║  TRANSCRIPT EXTRACTOR PLUS                                    ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  [PROJECT NAME]                                              ║
║  Source: [filename or URL] ([duration])                      ║
║  Languages: [source] → [target]                              ║
║  Intake:        ████████████ COMPLETE                        ║
║  Audio Extract: ████████████ COMPLETE                        ║
║  Transcription: ████████░░░░ IN PROGRESS                     ║
║  Translation:   ░░░░░░░░░░░░ PENDING                        ║
║  Cut Analysis:  ░░░░░░░░░░░░ PENDING  (ad content only)     ║
║  Export:        ░░░░░░░░░░░░ PENDING                        ║
║  Last worked: [date]                                         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

Progress bar rules (12 chars total):
- `█` = complete, `▓` = in_progress, `░` = pending
- Each phase is binary: COMPLETE, IN PROGRESS, or PENDING

3. Present options via AskUserQuestion:
   - For each existing project: "Resume [Name]" with description showing next step and language pair
   - "New Project" with description "Transcribe + translate a new video"
   - "Batch Process Folder" with description "Scan a folder for videos — shared settings, process all sequentially"

4. **Resume logic:** When a project is selected, read its full entry from `registry-archive.json`. Walk the status object in order: intake → audio_extract → transcription → translation → cut_analysis → export. Find the first incomplete step and resume there. Treat `"skipped"` as complete (skip over it). Cut analysis is only active when `cut_analysis.enabled == true` in the project — if not enabled, treat as skipped.

5. **File validation on resume:** Before resuming a project, verify that files from completed phases still exist (file paths are in the archive entry). For each "complete" phase, check:
   - `transcription: complete` → verify `source_transcript_txt` and `source_srt` files exist
   - `translation: complete` → verify `translated_transcript_txt` and `translated_srt` files exist
   - `cut_analysis: complete` → verify `cut_list`, `annotated_source_txt`, and `annotated_translated_txt` files exist
   - If any file is missing, warn the user and offer to re-run that phase: "Output file [path] is missing. Re-run [phase]?"

---

## PHASE 1: Video Intake

**Triggered by:** "New Project" selection or resume at intake step.

### Step 1: Dependency Check

Run these checks silently:

```bash
# Platform first — everything below depends on it.
uname -s 2>/dev/null || echo "Windows"
```

**Windows:**
```bash
ffmpeg -version 2>/dev/null | head -1
yt-dlp --version 2>/dev/null
wsl -e bash -c "test -f ~/whisper.cpp/build/bin/whisper-cli && echo OK || echo MISSING"
wsl -e bash -c "test -f ~/whisper.cpp/models/ggml-medium.bin && echo OK || echo MISSING"
```

**macOS / Linux:**
```bash
ffmpeg -version 2>/dev/null | head -1
yt-dlp --version 2>/dev/null
command -v whisper-cli >/dev/null && echo OK || echo MISSING
test -f ~/whisper.cpp/models/ggml-medium.bin && echo OK || echo MISSING
```

If whisper-cli or the model is missing:
- Report what's missing, and quote **only** the install row for the detected platform.
- To fetch the model:
  - Windows — `wsl -e bash -c "cd ~/whisper.cpp && bash models/download-ggml-model.sh medium"`
  - macOS/Linux — `cd ~/whisper.cpp && bash models/download-ggml-model.sh medium`
- Do NOT proceed until dependencies are satisfied.

### Step 2: Get Video Source

AskUserQuestion:
- "Local file" — description: "Video or audio file on your machine (MP4, MOV, MKV, WAV, MP3)"
- "YouTube URL" — description: "Paste a YouTube link — will download audio automatically"

**If Local file:**
- Ask for the file path (user types via Other option or suggest recent video files)
- Validate the file exists: `test -f "[path]"`
- Extract duration: `ffprobe -v error -show_entries format=duration -of csv=p=0 "[path]"`

**If YouTube URL:**
- Ask for the URL
- Validate it's a YouTube URL (contains youtube.com or youtu.be)
- Get video info without downloading: `yt-dlp --print title --print duration "[url]"`

### Step 3: Configure Languages

**Smart defaults:** Offer up to 3 options depending on what exists in the registry:

AskUserQuestion: "How should we configure this project?"

- **Option 1: "Same as last time"** — Only show if `last_settings` exists. Description: "[source_language_name] → [target_language_name], [content_type], [speaker_mode], [output_format]". Apply all `last_settings` values, skip Steps 3-4 entirely, go straight to Step 5.
- **Option 2: "Load a preset"** — Only show if `saved_presets` has entries. Description: "Choose from saved configurations". Present a follow-up AskUserQuestion listing each preset by name with its key settings as the description (e.g., "ad — German → English, single speaker, cut analysis ON"). On selection, apply all preset values including `cut_analysis` config. Skip Steps 3-4, go to Step 5.
- **Option 3: "Configure fresh"** — Always available. Proceed with individual questions below.

**Preset validation:** On preset load, verify all required keys exist (`source_language`, `target_language`, `content_type`, `speaker_mode`, `output_format`, `whisper_model`). If any key is missing, warn the user and fall through to "Configure fresh."

If no `last_settings` AND no `saved_presets` exist, skip this offer and go straight to the questions.

AskUserQuestion (2 questions):

**Question 1: "What language is the video in?"**
- "German (de)" — most common use case, listed first
- "Auto-detect" — Whisper will identify the language from the first 30 seconds
- "Other language" — user types the language name; map to ISO code

**Question 2: "What language should it be translated to?"**
- "English (en)" — most common target, listed first
- "Same (transcription only)" — skip translation entirely, just transcribe
- "Other language" — user types the language name

**If user picks "Same (transcription only)":** Set target_language = source_language. Skip Phase 4 entirely.

### Step 4: Configure Output

AskUserQuestion (up to 4 questions):

**Question 1: "What type of content is this?"**
- "Testimonial / Review" — one or more people giving feedback, continuous take
- "Interview / Q&A" — interviewer asks questions, interviewee answers
- "Montage / Trailer / Hype Reel" — edited video with music, cuts, multiple clips
- "Ad / Direct-to-Camera" — raw ad recording (1-10 min), single take or multiple takes, needs cut analysis
- "VSL / Long-Form Sales Video" — raw sales video (10+ min), structured (hook → story → offer → close), needs cut analysis with relaxed thresholds
- "Lecture / Presentation" — single speaker teaching or presenting

Content type determines post-processing format in Phase 3. "Podcast / Conversation" can be entered via Other.

**If "Ad / Direct-to-Camera" is selected:**
- Auto-set `speaker_mode: "single"` (skip Question 2 or pre-fill it)
- Auto-upgrade `output_format` to `"both"` (SRT required for gap detection in cut analysis)
- After Question 4 (output format), ask: **"Enable cut analysis? (Recommended for ads)"**
  - "Yes, find cut points" — set `cut_analysis: { enabled: true, flags: ["silence", "restart", "filler", "false_start", "mistake", "stumble"], silence_threshold_seconds: 2 }`
  - "No, just transcribe" — set `cut_analysis: { enabled: false, flags: [], silence_threshold_seconds: 2 }`

**If "VSL / Long-Form Sales Video" is selected:**
- Auto-set `speaker_mode: "single"` (skip Question 2 or pre-fill it)
- Auto-upgrade `output_format` to `"both"` (SRT required for gap detection in cut analysis)
- Auto-enable cut analysis with **relaxed VSL thresholds**: `cut_analysis: { enabled: true, flags: ["silence", "restart", "filler", "false_start", "mistake", "stumble"], silence_threshold_seconds: 3 }`
- VSLs have more intentional dramatic pauses than short ads — 3s prevents false positives on deliberate delivery choices

**Question 2: "Speaker mode?"**
- "Single speaker" — one person talking, no labels needed
- "Multi-speaker" — conversations/interviews, label speakers
- "Auto-detect" — will check during transcription and ask if unclear

**Auto-set from content type:** Interview → multi-speaker. Montage → multi-speaker. Still ask for confirmation.

**Question 3: "Is the speaker a native [source_language] speaker?"**
- "Yes, native speaker" — standard processing
- "No, non-native / accented" — triggers accent review in Phase 3

Only ask this if source_language is not English (non-native English is common enough to always handle). Record `native_speaker: true/false` in registry.

**Question 4: "Output format?"**
- "Both text + SRT (Recommended)" — get clean readable text AND timestamped subtitles
- "Clean text only" — plain readable transcript
- "SRT subtitles only" — timestamped subtitle file

### Step 5: Choose Output Location

AskUserQuestion:

**"Where should the transcripts be saved?"**
- "Next to source file" — create a `Transcripts/` folder in the same directory as the source video (e.g. video at `~/Videos/project/video.mp4` → `~/Videos/project/Transcripts/`). This is the default and recommended option.
- "Custom location" — user specifies a path (via Other)

**For local files:** Default to "Next to source file" as the first/recommended option.
**For YouTube URLs:** Default to "Default transcripts folder" as the first/recommended option.

### Step 6: Create Registry Entry

- Generate slug from video filename or YouTube title (lowercase, hyphens, no extension)
- Create output directory based on Step 5 selection
- Write **full entry to archive** (`registry-archive.json`) with all configuration, including:
  - `cut_analysis` object if content_type is "ad" or user enabled it
  - `status.cut_analysis` set to `"pending"` if cut analysis enabled, `"skipped"` if not
  - `files.cut_list`, `files.annotated_source_txt`, `files.annotated_translated_txt` set to `null`
- Write **slim entry to registry** (`registry.json`) with: name, source_name, duration_formatted, languages, content_type, speaker_mode, last_updated, status
- Update `last_settings` at registry root with this project's settings (for smart defaults on next run)
- Set `status.intake = "complete"` in both files

### Step 7: Offer to Save as Preset

After the registry entry is created, offer to save these settings as a reusable preset:

AskUserQuestion: "Save these settings as a preset for future projects?"
- "Yes, save preset" — ask for a preset name (suggest one based on content type), then write to `saved_presets` in registry root
- "No, continue" — proceed without saving

→ **Proceed to Phase 2.**

---

## PHASE 1B: Batch Mode

**Triggered by:** "Batch Process Folder" selection from Phase 0.

### Step 1: Select Folder

Ask the user for a folder path (or suggest the folder from the most recent project in the registry).

Scan the folder for video/audio files:
```bash
ls -1 "[folder_path]" | grep -iE '\.(mp4|mov|mkv|avi|wav|mp3|m4a|webm)$'
```

Display the file list with durations (use `ffprobe` for each). Let the user select which files to include via AskUserQuestion:
- "All [N] files" — process every video found
- "Select files" — present each file as a checkbox-style option; user picks via multiple rounds

### Step 2: Shared Settings

Run Steps 3-5 from Phase 1 **once** — language, content type, speaker mode, native speaker, output format, output location. These settings apply to all files in the batch.

Exception: if the folder contains a mix of content types (e.g., testimonials + interviews), ask: "Same content type for all, or configure each file separately?"

### Step 3: Create Registry Entries

For each selected file:
- Generate a unique slug from the filename
- Create a full entry in the archive and a slim entry in the registry with shared settings
- Set `status.intake = "complete"` in both

Write all entries in a single update per file (one write to archive, one write to slim registry).

### Step 4: Optimized Batch Processing

**Pipeline:** `[Parallel] Extract all audio → [Per file] Transcribe → Translate → Cut Analyze → [Once] Export summary`

**Phase 2 (Audio Extraction):** Run ffmpeg for ALL files in parallel (independent processes). Each file's extraction is an independent ffmpeg call that doesn't compete for the same resources:
```bash
# Launch all extractions simultaneously
ffmpeg -i "[file1]" -ar 16000 -ac 1 -c:a pcm_s16le "[out1]/audio.wav" -y &
ffmpeg -i "[file2]" -ar 16000 -ac 1 -c:a pcm_s16le "[out2]/audio.wav" -y &
# ... wait for all to complete
```

**Phases 3-4B (Transcription → Translation → Cut Analysis):** Sequential per file. Whisper is CPU/GPU-bound and must run one at a time. Translation and cut analysis chain after each transcription.

Between each file, display a mini progress bar:

```
╔══════════════════════════════════════════════════════════════╗
║  BATCH PROGRESS: [completed]/[total]                         ║
╠══════════════════════════════════════════════════════════════╣
║  ✓ file1.mp4 — COMPLETE                                      ║
║  ▶ file2.mp4 — TRANSCRIBING...                               ║
║  ○ file3.mp4 — PENDING                                       ║
╚══════════════════════════════════════════════════════════════╝
```

If a file fails at any phase, log the error, skip to the next file, and report all failures at the end. Do NOT stop the entire batch for one failure.

### Step 5: Batch Summary

After all files are processed, show a combined summary with all output file paths and any errors encountered.

**If cut analysis was enabled for the batch**, include a combined cut analysis summary:
```
╔══════════════════════════════════════════════════════════════╗
║  BATCH CUT ANALYSIS SUMMARY                                  ║
╠══════════════════════════════════════════════════════════════╣
║  file1.mov — 12 cuts, clean: 2:34 of 3:45 (68%)             ║
║  file2.mov — 8 cuts, clean: 1:52 of 2:30 (75%)              ║
║  file3.mov — 15 cuts, clean: 3:10 of 5:00 (63%)             ║
║  ────────────────────────────────────────────────────────────║
║  TOTAL: 35 cuts, clean: 7:36 of 11:15 (68%)                 ║
╚══════════════════════════════════════════════════════════════╝
```

---

## PHASE 2: Audio Extraction

**Triggered by:** Resume at audio_extract step, or after Phase 1.

### For Local Files

Extract audio as 16kHz mono WAV (Whisper's required format):

```bash
ffmpeg -i "[source_path]" -ar 16000 -ac 1 -c:a pcm_s16le "[output_dir]/audio.wav" -y
```

### For YouTube URLs

Download audio only, then convert:

```bash
# Download best audio
yt-dlp -x --audio-format wav -o "[output_dir]/audio_raw.%(ext)s" "[youtube_url]"

# Convert to Whisper format (16kHz mono)
ffmpeg -i "[output_dir]/audio_raw.wav" -ar 16000 -ac 1 -c:a pcm_s16le "[output_dir]/audio.wav" -y
```

### After Extraction

- Verify audio file exists and is non-empty
- Get duration from the WAV: `ffprobe -v error -show_entries format=duration -of csv=p=0 "[output_dir]/audio.wav"`
- Update archive: `audio_path`, `duration_seconds`, `duration_formatted`
- Set `status.audio_extract = "complete"` in both registry and archive
- Update `duration_formatted` in slim registry if it changed

→ **Proceed to Phase 3.**

---

## PHASE 3: Transcription (Whisper)

**Triggered by:** Resume at transcription step, or after Phase 2.

### Convert Audio Path (Windows only)

**Windows:** paths must be converted for WSL.
- A Windows drive path like `D:\videos\clip.mp4` becomes `/mnt/d/videos/clip.mp4`
- Use `wsl -e bash -c "wslpath '[windows_path]'"` or convert manually.

**macOS / Linux:** no conversion. Use the path as-is.

### Run Whisper

**Windows:**
```bash
wsl -e bash -c "~/whisper.cpp/build/bin/whisper-cli \
  -m ~/whisper.cpp/models/ggml-{whisper_model}.bin \
  -f '{wsl_audio_path}' \
  --language {source_language_code} \
  --output-srt \
  --output-txt \
  --output-file '{wsl_output_dir}/{slug}' \
  --print-progress"
```

**macOS / Linux:**
```bash
whisper-cli \
  -m ~/whisper.cpp/models/ggml-{whisper_model}.bin \
  -f '{audio_path}' \
  --language {source_language_code} \
  --output-srt \
  --output-txt \
  --output-file '{output_dir}/{slug}' \
  --print-progress
```

**Notes:**
- `--language auto` or omit the flag for auto-detection
- `--output-srt` generates `{slug}.srt`
- `--output-txt` generates `{slug}.txt`
- `--print-progress` shows progress in real-time
- For the model flag: use whatever model is configured (default: `ggml-medium.bin`)
- Timeout: allow up to 10 minutes for a 15-min video

**If source_language is "auto":** After Whisper completes, detect the language from the first line of output or from Whisper's auto-detection log. Update the registry with the detected language.

### Multi-Speaker Handling

If `speaker_mode` is "multi":

**Step 1: Name Discovery Pass**
Read the raw transcript. Search for self-introductions ("Ich bin...", "My name is...", "Ich heiß..."), direct address by name, or any identifiable speaker cues. Build a speaker list: `[{name, first_appearance_timestamp}]`.

- If names are found, present them: "I identified these speakers: [list]. Correct? Any to rename or add?"
- If no names found, ask: "I couldn't identify speaker names. Can you provide them, or use generic labels?"
- Record confirmed names in registry `speakers` array: `["example-contact", "example-contact-two"]`. For montage content with unidentifiable clips, record known names plus `"Client"` as a generic entry. This array is used by the translation agent for speaker label consistency.

**Step 2: Speaker Labeling**
AskUserQuestion:
  - "AI speaker labeling (Recommended)" — Claude inserts speaker labels using the confirmed names and context (questions vs answers, topic shifts, direct address patterns)
  - "Skip speaker labels" — leave transcript as-is
  - "I'll label them manually" — save transcript and let user edit

**AI Labeling Protocol:**
1. Use confirmed speaker names (e.g., `example-contact:`, `example-contact-two:`), never generic "Speaker 1/2"
2. For montage/trailer with unidentifiable short clips, use `Client:` as a generic label
3. Format: `Speaker Name: Dialogue text` — speaker label on its own line for new speakers
4. Timestamp marker at each topic shift or speaker exchange, not every single line

### Post-Process: Add Minute Markers to .txt

After Whisper generates the raw `.txt` and `.srt` files, **rebuild the .txt with minute markers** using the SRT timestamps.

**Paragraph Grouping Rules (by content_type):**

**Testimonial / Review:**
- New paragraph at topic shifts or pauses >3 seconds (detectable from SRT timestamp gaps)
- Aim for 30-60 second chunks
- If multiple people give separate testimonials in one video, add `--- [Speaker Name] ---` header between each

```
[0:00] Paragraph of testimonial text...

[0:30] Next paragraph...
```

**Interview / Q&A:**
- New paragraph at each speaker change
- Timestamp on the first line of each exchange (not every single line)
- Use confirmed speaker names from the Name Discovery Pass

```
[0:00] example-contact: Question text?

example-contact-two: Response text...

[0:30] example-contact: Next question?
```

**Montage / Trailer / Hype Reel:**
- Each clip/cut gets its own line
- Non-speech gaps >5 seconds: insert `[M:SS] — MUSIC / VISUALS —`
- Use section headers for structural shifts: `--- SECTION TITLE ---`
- Labels: host name for direct-to-camera, `Client:` for unidentified testimonial clips

```
[0:00] example-contact: Hook or opening text...

[0:30] — MUSIC / VISUALS —

--- CLIENT TESTIMONIAL MONTAGE ---

[1:05] Client: Quote text...

--- OUTRO ---

[2:38] example-contact: Credentials and CTA...
```

**Ad / Direct-to-Camera:**
- Most granular format — optimized for identifying cut points
- Each sentence or complete thought gets its own line with a timestamp
- Gaps >2s get explicit markers: `[M:SS] — SILENCE (Xs) —`
- Timestamp every 10-15 seconds minimum, more frequently when content is dense
- Restarts and retakes go on separate lines, never merged into paragraphs
- Filler words are preserved as-is (cut analysis will flag them later)
- No paragraph grouping — every line is independently addressable

```
[0:00] Hallo, ich bin example-contact und ich möchte euch heute erzählen...

[0:08] — SILENCE (3s) —

[0:11] Also, ich arbeite seit drei Jahren mit der Methode...

[0:18] Ich arbeite seit drei Jahren mit der Atemtechnik und es hat mein Leben verändert.

[0:25] ähm...

[0:27] — SILENCE (4s) —

[0:31] Die Ergebnisse, die ich gesehen habe, sind unglaublich.
```

**VSL / Long-Form Sales Video:**
- Group by ~60 second chunks (readability over granularity for 10-60 min videos)
- Timestamp at the start of each group: `[M:SS]`
- Director cues ("Cut", "machen wir nochmal") preserved inline — cut analysis flags them later
- No per-sentence splitting (unlike short ad format) — paragraph flow is more useful for VSL review
- Best for videos >10 minutes where per-sentence granularity reduces readability

```
[0:00] Opening hook text, first 60 seconds of content grouped together...

[1:00] Next section of the VSL, continuing the narrative flow...

[2:00] Cut, machen wir nochmal. [restart preserved inline for cut analysis]

[3:00] Clean version of the retake, continuing...
```

**Lecture / Presentation:**
- Standard paragraph grouping at topic transitions
- Aim for 60-90 second chunks
- No speaker labels unless there's a Q&A segment

**Podcast / Conversation:**
- Same as Interview but with more casual grouping
- Timestamp every 1-2 minutes minimum

**Building the .txt:**
1. Parse the `.srt` file to extract timestamps and text
2. Apply the content-type grouping rules above
3. Add `[M:SS]` markers at the start of each group
4. Write the rebuilt `.txt` with minute markers and paragraph breaks

This makes the .txt useful for quickly jumping to specific parts of the video for clipping.

### Validate Output

Check that output files were created:
- `[output_dir]/{slug}.txt` — must exist, non-empty, and contain `[M:SS]` minute markers
- `[output_dir]/{slug}.srt` — must exist and be non-empty

**Hallucination scan:** After Whisper produces output, scan for common hallucination patterns:
- Repeated nonsense tokens (same unusual word appearing 3+ times in quick succession, e.g., "ISNIC ISNIC ISNIC")
- Repeated phrases that loop verbatim across multiple SRT entries
- Timestamps where text is identical to the previous entry (copy-paste hallucination)

If hallucinations are detected, flag the affected timestamps and offer:
- "Re-run transcription with different model" — try large or small
- "Remove hallucinated segments" — delete the repeated tokens, keep surrounding text
- "Ignore — continue as-is"

If missing or empty:
- Check Whisper error output
- Common issues: model not found, audio format wrong, out of memory
- Offer to retry with smaller model if memory issue

### Cross-Project Clip Recognition (if `content_type: montage`)

For montage/trailer content, clips are often pulled from other videos that may already be transcribed.

1. Check the registry for other projects with the same `output_dir` or overlapping `source_path` directory
2. If matching projects exist, compare short phrases from the current montage against their source transcripts
3. When a match is found (>80% text overlap for a 5+ word segment), use the existing project's translation for consistency rather than re-translating the clip independently
4. Report matches: "Found [N] clips that match existing transcripts — translations will be consistent."
5. If no other projects exist in the registry, skip this step silently

This prevents the same speaker's words from being translated differently across projects.

### Accent Review (if `native_speaker: false`)

Non-native speakers produce predictable Whisper errors: phonetically similar but semantically wrong words.

1. Read the full transcript and flag words that seem contextually wrong:
   - Does this word make sense in the speaker's apparent meaning?
   - Are there near-homophones that fit better? (e.g., German: Vorwürfe/Vorworte, gekostet/verdient)
2. Present flagged words: `[Timestamp] | Whisper heard | Likely meant | Reason`
3. Let the user confirm corrections before proceeding to translation
4. Apply confirmed corrections to both .txt and .srt files
5. If no suspicious words found, skip this step silently

### Cleanup Temp Audio

After transcription is validated:
- Delete the temp audio file: `rm "[output_dir]/audio.wav"`
- If YouTube, also delete `audio_raw.wav`
- Set `audio_path = null` in registry (audio has been consumed)
- If deletion fails, warn but do not block — transcription is already complete

### Update Registry (Both Files)

- **Archive:** Set `files.source_transcript_txt` and `files.source_srt` paths, set `audio_path = null`
- **Both:** Set `status.transcription = "complete"`, update `last_updated`

### Display Preview

Show the first 20 lines of the transcript to the user so they can verify quality:

```
╔══════════════════════════════════════════════════════════════╗
║  TRANSCRIPTION COMPLETE                                      ║
╠══════════════════════════════════════════════════════════════╣
║  Language: [detected/specified]                              ║
║  Duration: [formatted]                                       ║
║  Lines: [count]                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Preview (first 20 lines):                                   ║
║  [transcript preview here]                                   ║
╚══════════════════════════════════════════════════════════════╝
```

AskUserQuestion:
- "Looks good — translate now (Recommended)" — proceed to Phase 4
- "View full transcript" — read and display the entire file
- "Re-run transcription" — try again (offer different model or language)
- (If target_language = source_language): "Export now" — skip to Phase 5

→ **Proceed to Phase 4 (or Phase 5 if transcription-only). After Phase 4, proceed to Phase 4B if cut analysis is enabled, otherwise skip to Phase 5.**

---

## PHASE 4: Translation

**Triggered by:** Resume at translation step, or after Phase 3.

**Skip this phase entirely if `target_language == source_language`.**

### Determine Translation Approach

Based on transcript length:
- **Short transcripts (under 500 lines):** Translate inline — Claude reads the transcript and translates directly in the current session. No subagent needed.
- **Long transcripts (500+ lines):** Deploy a Task subagent for translation to avoid context window pressure.

### Inline Translation (Short Transcripts)

1. Read `references/translation-agent-prompt.md`
2. Read the source transcript file(s)
3. Follow the translation agent prompt rules directly:
   - Translate the .txt file → write to `[output_dir]/{slug}_[target_lang].txt`
   - If output_format includes SRT: translate the .srt file → write to `[output_dir]/{slug}_[target_lang].srt`
4. Preserve all timestamps, speaker labels, and structure

### Subagent Translation (Long Transcripts)

1. Read `references/translation-agent-prompt.md`
2. Resolve ALL `{VARIABLE}` placeholders with real values from the registry
3. Set file paths:
   - `{TRANSCRIPT_FILE}` → source transcript path (use .srt if output includes SRT, else .txt)
   - `{OUTPUT_TXT_FILE}` → `[output_dir]/{slug}_[target_lang].txt`
   - `{OUTPUT_SRT_FILE}` → `[output_dir]/{slug}_[target_lang].srt`
4. **Cruise Control Gate:** Before launching, present:
   AskUserQuestion: "This translation agent will make ~10-15 tool calls. How do you want to handle approvals?"
   - "Cruise Control (Recommended)" — description: "Auto-approve all tool calls. Toggle with Shift+Tab before I launch."
   - "Manual approval" — description: "Approve each tool call individually (slower but more control)"
   If "Cruise Control": Remind user to press Shift+Tab to enable auto-approve, confirm they've done it, then launch. After agent completes, remind: "Agent done. Shift+Tab to re-enable manual approval if desired."
5. Launch Task subagent with the fully resolved prompt injected as the instruction
6. Wait for completion

### Validate Translation

Check that output files were created and are non-empty:
- `[output_dir]/{slug}_[target_lang].txt` (if output_format includes text)
- `[output_dir]/{slug}_[target_lang].srt` (if output_format includes SRT)

Quick sanity check:
- Line count of translation should be within 20% of source line count
- SRT sequence numbers should match between source and translated versions

### Update Registry (Both Files)

- **Archive:** Set `files.translated_transcript_txt` and/or `files.translated_srt` paths
- **Both:** Set `status.translation = "complete"`, update `last_updated`

→ **Proceed to Phase 4B if `cut_analysis.enabled == true`, otherwise skip to Phase 5.**

---

## PHASE 4B: Cut Analysis

**Triggered by:** Resume at cut_analysis step (when enabled), or after Phase 4.

**Skip this phase entirely if `cut_analysis.enabled` is not `true`.** Set `status.cut_analysis = "skipped"` and proceed to Phase 5.

### Determine Analysis Approach

Based on SRT entry count and content type:
- **Short recordings (under 200 SRT entries for ads, under 400 for VSL):** Analyze inline — Claude reads the SRT and source files and performs cut analysis directly in the current session. Most ad recordings are 1-5 minutes = 30-80 entries, so this is the typical path. VSLs are longer but inline works up to ~60 minutes.
- **Long recordings (200+ for ads, 400+ for VSL):** Deploy a Task subagent for analysis to avoid context window pressure.

### Inline Analysis (Short Recordings)

1. Read `references/cut-analysis-agent-prompt.md`
2. Read the source SRT file, source TXT file, and translated TXT file (if it exists)
3. Follow the cut analysis agent prompt rules directly:
   - Generate cut list → write to `[output_dir]/{slug}_cuts.md`
   - Generate annotated source → write to `[output_dir]/{slug}_annotated.txt`
   - Generate annotated translation → write to `[output_dir]/{slug}_en_annotated.txt` (only if translated file exists)

### Subagent Analysis (Long Recordings)

1. Read `references/cut-analysis-agent-prompt.md`
2. Resolve ALL `{VARIABLE}` placeholders with real values from the registry
3. **Cruise Control Gate:** Before launching, present:
   AskUserQuestion: "This cut analysis agent will make ~15-25 tool calls. How do you want to handle approvals?"
   - "Cruise Control (Recommended)" — description: "Auto-approve all tool calls. Toggle with Shift+Tab before I launch."
   - "Manual approval" — description: "Approve each tool call individually (slower but more control)"
   If "Cruise Control": Remind user to press Shift+Tab to enable auto-approve, confirm they've done it, then launch. After agent completes, remind: "Agent done. Shift+Tab to re-enable manual approval if desired."
4. Launch Task subagent with the fully resolved prompt injected as the instruction
5. Wait for completion

### Validate Cut Analysis

Check that output files were created and are non-empty:
- `[output_dir]/{slug}_cuts.md` — must exist and contain the cuts table
- `[output_dir]/{slug}_annotated.txt` — must exist and preserve all original source text
- `[output_dir]/{slug}_en_annotated.txt` — must exist if translation was performed

Quick sanity check:
- Cut list timecodes are in chronological order
- Total of (cuts + trims + clean segments) covers the full duration (within 2s)
- Annotated files contain ALL lines from the original source files (no text removed)

### Agent Artifact Cleanup (MANDATORY)

After cut analysis completes (whether inline or subagent), scan the output directory for non-deliverable files:

```bash
# Remove any temp scripts or artifacts left by the agent
find "[output_dir]" -maxdepth 1 \( -name "*.py" -o -name "*.js" -o -name "*.sh" -o -name "*.tmp" \) -delete
```

Only these files should remain in the output directory:
- Source: `{slug}.txt`, `{slug}.srt`
- Translated: `{slug}_{target_lang}.txt`, `{slug}_{target_lang}.srt`
- Cut analysis: `{slug}_cuts.md`, `{slug}_annotated.txt`, `{slug}_en_annotated.txt`

If any unexpected files are found and removed, note it briefly: "Cleaned up [N] temp files from output directory."

### Update Registry (Both Files)

- **Archive:** Set `files.cut_list`, `files.annotated_source_txt`, and `files.annotated_translated_txt` paths
- **Both:** Set `status.cut_analysis = "complete"`, update `last_updated`

### Display Preview

```
╔══════════════════════════════════════════════════════════════╗
║  CUT ANALYSIS COMPLETE                                       ║
╠══════════════════════════════════════════════════════════════╣
║  Total flags: [N] (CUT: [n], TRIM: [n], REVIEW: [n])       ║
║  Estimated clean footage: [X:XX] of [total] ([X]%)          ║
╠══════════════════════════════════════════════════════════════╣
║  Files:                                                      ║
║  • Cut list:     [path]_cuts.md                              ║
║  • Annotated DE: [path]_annotated.txt                        ║
║  • Annotated EN: [path]_en_annotated.txt                     ║
╚══════════════════════════════════════════════════════════════╝
```

AskUserQuestion:
- "View cut list" — display the full cuts markdown
- "Looks good — export now" — proceed to Phase 5
- "Re-run with different threshold" — adjust silence threshold and re-analyze

→ **Proceed to Phase 5.**

---

## PHASE 5: Export & Review

**Triggered by:** Resume at export step, or after Phase 3/4.

### Display Summary

```
╔══════════════════════════════════════════════════════════════╗
║  TRANSCRIPT EXTRACTOR PLUS — COMPLETE                        ║
╠══════════════════════════════════════════════════════════════╣
║  Video: [name]                                               ║
║  Duration: [formatted]                                       ║
║  Languages: [source] → [target]                              ║
║  Speaker mode: [single/multi]                                ║
╠══════════════════════════════════════════════════════════════╣
║  Output Files:                                               ║
║  ┌──────────────────────────────────────────────────────────┐║
║  │ [source_lang] transcript: [path].txt                     │║
║  │ [source_lang] subtitles:  [path].srt                     │║
║  │ [target_lang] transcript: [path].txt                     │║
║  │ [target_lang] subtitles:  [path].srt                     │║
║  │ (if cut analysis enabled:)                                │║
║  │ Cut list:           [path]_cuts.md                        │║
║  │ Annotated source:   [path]_annotated.txt                  │║
║  │ Annotated translate: [path]_en_annotated.txt              │║
║  └──────────────────────────────────────────────────────────┘║
║  Output directory: [output_dir]                              ║
╚══════════════════════════════════════════════════════════════╝
```

### Review Options

AskUserQuestion:
- "Read translated transcript" — display the full translated text
- "Compare side by side" — show source and translated text in alternating blocks (10 lines each)
- "Re-translate" — go back to Phase 4 with option to adjust (e.g., more literal, more natural, different target language)
- "New project" — go back to Phase 0

### Set Export Complete

- Set `status.export = "complete"` in both registry and archive
- Update `last_updated` in both files

---

## Error Handling

### YouTube Download Fails
- Check if URL is valid and video is available
- yt-dlp may need updating: `pip install --upgrade yt-dlp`
- Some videos are geo-restricted or age-gated — inform user

### Whisper Fails or Produces Garbage
- **Out of memory:** Offer smaller model (small instead of medium)
- **Wrong language detected:** Re-run with explicit `--language` flag
- **Empty output:** Check audio file — may be silence or corrupt
- **Garbled text:** Audio quality may be too low. Suggest re-recording or trying large-v3 model

### Translation Quality Issues
- Offer to re-translate with specific instructions (e.g., "more formal", "preserve colloquialisms", "technical vocabulary")
- For domain-specific content, user can provide a glossary that gets injected into the translation prompt

### WSL Not Running (Windows only — skip this whole section on macOS/Linux)
- Check WSL: `wsl -l -v`
- If WSL is off: `wsl -d Ubuntu -- bash -c "echo ready"`
- If the whisper binary isn't found, it may need rebuilding: guide user through `cd ~/whisper.cpp && cmake -B build && cmake --build build --config Release`

### whisper-cli Not Found (macOS / Linux)
- Check it's on PATH: `command -v whisper-cli`
- macOS: `brew install whisper-cpp`
- Linux: build from source — `git clone https://github.com/ggerganov/whisper.cpp && cd whisper.cpp && cmake -B build && cmake --build build --config Release`
- Never suggest `wsl` here. It does not exist on these platforms.

---

## Key Architecture Rules

1. **Detect the platform before anything else.** On Windows, Whisper runs in WSL and everything else runs natively — always convert paths between Windows ↔ WSL format. On macOS/Linux, `whisper-cli` runs directly and no conversion happens. Never emit a `wsl` command to a non-Windows user; `wsl` is not a command there, so the check errors instead of returning `MISSING`.
2. **Short transcripts translate inline.** Only spawn subagents for 500+ line transcripts.
3. **Dual-file registry: slim + archive.** Slim registry (`registry.json`) has dashboard data. Archive (`registry-archive.json`) has full project details. Dashboard reads slim only. Processing reads archive. Status updates write to both.
4. **Translation agent prompt lives in reference file.** Orchestrator reads and injects it with resolved variables.
5. **Model is configurable per project.** Default is medium, but user can override at intake.
6. **Language codes follow ISO 639-1.** Map user-friendly names to codes internally.
7. **Output files use language suffix.** Source: `{slug}.txt`, Translated: `{slug}_{target_lang}.txt`
8. **Always preview before proceeding.** Show first 20 lines of transcript after each major step so user can verify quality.
9. **Single registry write per phase.** Read the archive once at phase start, collect all updates in memory, write once at phase end (to both files). Aim for ~6 writes per project (one per phase), not 10+. Exception: batch mode writes once after all entries are created.
10. **Cut analysis is opt-in.** Only triggered when `cut_analysis.enabled == true`. Default for "ad" content type, off for everything else.
11. **Never overwrite originals.** Cut analysis output files use `_annotated` and `_cuts` suffixes. Source `.txt` and `.srt` files are never modified by cut analysis.
12. **SRT-based gap detection.** Silence detection uses SRT timestamp gaps, not audio analysis. This is fast and reliable.
13. **Presets are separate from last_settings.** `saved_presets` stores named configs. `last_settings` auto-updates after every project. Both live at slim registry root.
14. **Batch audio extraction runs in parallel.** Independent ffmpeg calls. Whisper transcription remains sequential (CPU/GPU bound).
