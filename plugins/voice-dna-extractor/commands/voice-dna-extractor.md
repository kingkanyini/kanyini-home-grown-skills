---
description: Extract clean voice DNA audio from IG, YouTube, or local video files. Auto-cleans, quality-gates, and outputs an MP3 + voice profile card ready for ElevenLabs/Resemble. Mandatory consent gate for client work.
---

# /voice-dna-extractor

You are running <your-name>'s voice DNA extraction pipeline. The skill takes published audio (IG, YouTube, or a local video file), strips and cleans it to voice-cloning specs, and outputs a ready-to-upload MP3 plus a profile card.

**Counsel for this skill:** Authentic Voice Counsel (#13 — Halbert, Watts, Golden, Brunson) + AI Project Dev Squad (#14 — Jobs, Hogg, Hamedani, Bengio, Thattai). Run as **PERSONA MODE** during quality reviews, **AGENT MODE** for high-stakes client deliverables.

**Reference files (read on-demand):**
- `references/extraction-tools.md` — tool routing per source type
- `references/cleaning-pipeline.md` — ffmpeg recipes for the cleaning chain
- `references/voice-dna-specs.md` — target quality specs (sample rate, SNR, dBFS, format)
- `references/consent-template.md` — client consent capture flow
- `registry.json` — historical voices extracted

---

## Phase 0: Dashboard

Read `registry.json`. If non-empty, render an ASCII dashboard:

```
╔════════════════════════════════════════════════════════════════╗
║  VOICE DNA REGISTRY                                            ║
╠════════════════════════════════════════════════════════════════╣
║  [client-slug]  | [date]  | [duration]s  | quality: [score]/10 ║
║  ...                                                           ║
╚════════════════════════════════════════════════════════════════╝
```

Then `AskUserQuestion`:
- **Resume [last-client]** — continue extraction from where it stopped
- **New extraction (Recommended)** — start fresh
- **View profile cards** — list `~/.claude/references/voice-profiles/*-voice.md`

If registry is empty, skip directly to Phase 1.

---

## Phase 1: Identity & Source

Ask whose voice this is and where the audio lives. Use `AskUserQuestion`:

**Q1 — Whose voice?**
- Self (<your-name>) — bypasses consent gate
- Client — triggers consent capture in Phase 2

**Q2 — Client slug** (only if client was selected): plain-text input via `AskUserQuestion` with "Other" allowing free text. Slug must be lowercase-hyphenated (e.g., `<example-client>`, `john-smith`).

**Q3 — Source type:**
- Instagram URL (Reel, Post, IGTV)
- YouTube URL (video, Short, live archive)
- Local video file (MP4, MOV, MKV, etc.)
- Multiple sources (batch mode — repeat for each)

**Q4 — Source URL or path:** free-text via `AskUserQuestion` with "Other" enabled.

Save these to a working memo for the run. Initialize the per-client folder:

```
~/.claude/voice-dna/[client-slug]/
├── source/        # raw downloads
├── cleaned/       # cleaning pipeline outputs
├── final/         # final MP3
└── consent/       # signed consent files (client only)
```

---

## Phase 2: Consent Gate

**If self-use:** Skip with a single line — *"Self-use confirmed. Skipping consent gate."*

**If client:** This is mandatory. Cannot be skipped.

1. Read `references/consent-template.md`.
2. Present the recorded consent statement script. The client must record this on video or audio and send it to <your-name> before extraction continues.
3. `AskUserQuestion`:
   - **Recorded consent received** — proceed
   - **Written agreement signed (Recommended)** — proceed (preferred)
   - **Both received** — proceed (gold standard)
   - **Not yet** — pause and resume later
4. Save the consent files to `~/.claude/voice-dna/[client-slug]/consent/`. Record metadata in registry: `consent_date`, `consent_type` (recorded / written / both), `scope` (use cases listed in agreement).

If "Not yet" is chosen, write the working memo to `~/.claude/voice-dna/[client-slug]/PAUSED.md` with a resume note and exit.

---

## Phase 3: Extract

Read `references/extraction-tools.md` to pick the right tool for the source.

**Routing:**
| Source | Primary | Fallback |
|--------|---------|----------|
| Instagram URL | `mcp__yt-dlp-mcp__ytdlp_download_audio` | Instaloader (manual install) |
| YouTube URL | `mcp__yt-dlp-mcp__ytdlp_download_audio` | — |
| Local video | `mcp__ffmpeg-mcp__extract_audio` | ffmpeg CLI |

Save raw audio to `~/.claude/voice-dna/[client-slug]/source/raw-[timestamp].mp3` (or `.wav` if available).

If extraction fails:
- Print the actual error
- Suggest the manual fallback (e.g., "yt-dlp returned auth error on this IG post — ask the client to send the original video file directly").
- Pause via `AskUserQuestion`: **Retry** / **Switch source** / **Abort**.

---

## Phase 4: Clean (Auto-Pipeline)

Read `references/cleaning-pipeline.md` for the exact ffmpeg commands.

Run the chain end-to-end (no per-step pauses), saving intermediate files for debugging:

1. **Mono convert** — `cleaned/01-mono.wav`
2. **Resample to 48 kHz** — `cleaned/02-48k.wav`
3. **Loudness normalize to -16 LUFS** (~-18 to -12 dBFS peak) — `cleaned/03-normalized.wav`
4. **Trim leading/trailing silence** — `cleaned/04-trimmed.wav`
5. **Light denoise** (afftdn filter, mild settings) — `cleaned/05-denoised.wav`

Print a status line per step: `✓ Mono convert (4.2s)`.

If any step fails, halt the chain and report which step + the ffmpeg error. Do NOT silently fall through — voice DNA quality depends on every step.

---

## Phase 5: Quality Gate

Probe the final cleaned file with ffprobe. Read `references/voice-dna-specs.md` for thresholds.

Compute:
- **Sample rate** (target: 48 kHz, accept 44.1 kHz)
- **Duration in seconds** (target: ≥ 60s, ideal: ≥ 5min, gold: ≥ 30min)
- **Channel layout** (target: mono)
- **Estimated SNR** (target: ≥ 30 dB, ideal: ≥ 40 dB)
- **Peak dBFS** (target: -18 to -12 dBFS)
- **Format** (target: WAV or 192+ kbps MP3)

Render a quality report:

```
╔══════════ QUALITY GATE ══════════╗
║  Sample rate:    48000 Hz   ✓    ║
║  Duration:       142.3s     ⚠    ║   (target 5min+, you have 2.4min)
║  Channels:       mono       ✓    ║
║  Est. SNR:       38 dB      ✓    ║
║  Peak dBFS:      -14.2      ✓    ║
║  Score:          7.8/10          ║
╚══════════════════════════════════╝
```

Severity tags: `✓` pass, `⚠` warning, `✗` fail.

`AskUserQuestion`:
- **Continue to review (Recommended)** — proceed to manual listening gate
- **Re-extract from different source** — gather more material first
- **Abort** — back out, save nothing

---

## Phase 6: Manual Review Gate

Print the absolute file path and a short instruction:

> **Listen to:** `~/.claude\voice-dna\[client-slug]\cleaned\05-denoised.wav`
>
> Open it in any audio player. Verify:
> - It actually sounds like the speaker
> - No music, no second speaker, no advertisements
> - No clipping, distortion, or harsh artifacts

`AskUserQuestion`:
- **Approve and export (Recommended)** — final MP3 + profile card
- **Re-clean with stronger denoise** — re-run Phase 4 with aggressive afftdn settings
- **Trim further** — interactive trim (ask for start/end timestamps)
- **Discard** — abort, do not save final

---

## Phase 7: Export

Approved. Now produce the final outputs.

1. **Export final MP3** at 192 kbps to `~/.claude/voice-dna/[client-slug]/final/[client-slug]-voice-dna.mp3`. Use ffmpeg:

   ```
   ffmpeg -i cleaned/05-denoised.wav -codec:a libmp3lame -b:a 192k final/[client-slug]-voice-dna.mp3
   ```

2. **Generate voice profile card** at `~/.claude/references/voice-profiles/[client-slug]-voice.md`. Template:

   ```markdown
   # [Client Name] Voice Profile

   **Extracted:** [YYYY-MM-DD]
   **Source:** [URL or filename]
   **Consent:** [recorded / written / both / self-use]
   **Final file:** `~/.claude/voice-dna/[slug]/final/[slug]-voice-dna.mp3`

   ## Quality Stats
   - Sample rate: [X] Hz
   - Duration: [X]s
   - Channels: [mono/stereo]
   - Est. SNR: [X] dB
   - Peak dBFS: [X]
   - Quality score: [X]/10

   ## Voice DNA Notes
   *(filled in by Authentic Voice Counsel — see below)*

   ## Cloning Platform Recommendations
   - **ElevenLabs:** [✓ ready / ⚠ short — needs more] (min 30s, ideal 1-5min)
   - **Resemble Pro:** [✓ ready / ⚠ short — needs more] (min 10-25min for pro clone)
   - **OpenAI Voice Engine:** [✓ ready] (min 15s)
   - **PlayHT:** [✓ ready] (min 1min)

   ## Source Log
   - [date] [duration]s [quality score] [source URL]
   ```

3. **Run counsel review** (PERSONA MODE — quick, inline). Have each NPC read the profile card and the final MP3 metadata, then provide a 1-10 score + 1 sentence "what lands" + 1 sentence "what's weak":

   - **Halbert:** Voice authenticity check
   - **Watts:** Spiritual depth / genuineness check
   - **Golden:** Authority / value framing check
   - **Brunson:** Hook / engagement check
   - **Jobs (AI Dev):** Pipeline cleanliness check
   - **Hogg (AI Dev):** Cloning-platform readiness check

   Append synthesized notes to the **Voice DNA Notes** section of the profile card.

4. **Update `registry.json`:**

   ```json
   {
     "voices": {
       "[slug]": {
         "name": "[Client Name]",
         "first_extracted": "[YYYY-MM-DD]",
         "last_extracted": "[YYYY-MM-DD]",
         "consent_type": "[recorded/written/both/self-use]",
         "scope": "[from consent agreement]",
         "extractions": [
           {
             "date": "[YYYY-MM-DD]",
             "source": "[URL or filename]",
             "duration_s": [X],
             "quality_score": [X],
             "final_path": "[path to mp3]"
           }
         ]
       }
     }
   }
   ```

   **Read-then-merge** — never overwrite the registry.

---

## Phase 8: Handoff

Print platform-specific upload instructions:

```
╔══════════ READY FOR CLONING ══════════╗
║  File: [absolute path to final MP3]   ║
║                                       ║
║  ElevenLabs Instant Voice Clone:      ║
║    https://elevenlabs.io/app/voice-lab║
║    → Add Voice → Instant Voice Clone  ║
║    → Upload [filename]                ║
║                                       ║
║  Resemble AI Rapid Clone:             ║
║    https://app.resemble.ai/voices     ║
║    → New Voice → Rapid Clone          ║
║    → Upload [filename]                ║
╚═══════════════════════════════════════╝
```

`AskUserQuestion`:
- **Done** — close out, mark complete in registry
- **Extract another source for same voice** — back to Phase 1 with slug pre-filled
- **Start new client** — back to Phase 1 fresh

---

## Phase 9: Ethics Check (MANDATORY before close)

Before declaring the run complete, run the Ethics Check Protocol from CLAUDE.md:

1. Confirm consent matches the use case the voice will be deployed for. If client said "internal coaching only" but <your-name> plans to use the voice for paid Meta ads, **flag immediately**: "Consent scope says internal only. The intended use exceeds scope. Pause and re-confirm with client."
2. Scan the profile card for prohibited language ("steal," "rip off," "hack" in exploitative sense, "you're not broken").
3. Verify the voice profile centers the client's authentic voice — not flattened into a <your-name>-isms generic.

If any check fails, fix before closing the registry entry.

---

## Failure Modes & Resume Logic

- **IG download fails:** yt-dlp returns auth error → suggest Instaloader (`pip install instaloader`) or ask client for the file directly.
- **ffmpeg fails:** Print exact stderr. Most common: missing input file, codec mismatch, permission error on output path.
- **Quality gate fail (SNR < 25 dB):** Recommend Adobe Podcast Enhance (`https://podcast.adobe.com/enhance`) as a free web cleanup pass before re-running the skill on the enhanced file.
- **Mid-run abort:** Always leave `PAUSED.md` in the per-client folder with current phase + file paths so the next run can resume.

When resuming, read `PAUSED.md`, jump to the phase listed, and confirm with `AskUserQuestion` before proceeding.
