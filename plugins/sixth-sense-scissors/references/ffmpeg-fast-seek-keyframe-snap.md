---
type: gou
tags:
  - ffmpeg
  - clip-cutting
  - sixth-sense-scissors
  - recall-technique
  - seek-precision
created: 2026-05-17
updated: 2026-05-17
source: '<your-related-note>'
confidence: high
sensitive: false
related:
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
---

## Insight

**ffmpeg `-ss N -i INPUT` (fast seek) snaps to the nearest preceding keyframe, NOT the exact second. For frame-accurate cuts — especially for Recall Technique hook extracts where every 50ms matters — use `-i INPUT -ss N` (slow seek) on a small working file, OR two-stage seek `-ss BIG -i INPUT -ss SMALL` where the precise offset is inside the small post-input seek.**

## Context

<your-related-note> — Clip #2 "What You Don't Eliminate Becomes You" (Recall Technique applied). Word-level Whisper identified the hook line " what" starting at source 06:00.94. ffmpeg cut with `-ss 360.94 -i SRC -t 3.10` produced output that, when re-transcribed, started with " Like" (probability 0.574, ~80ms of trailing audio from the previous word " like" at 06:00.82-06:00.94). Same issue on the body cut — caught trailing " um" before the intended " you know" start.

Reason: 4K H.264 sources have keyframes every ~2-3 seconds. Fast seek (`-ss` before `-i`) snaps to the keyframe at or before the requested timestamp, then re-encodes from THAT point. The actual output's first frame is the keyframe-aligned position, not the requested timestamp.

Re-cutting the body with `-i SRC -ss 8.16` (slow seek into the 80s working file) produced a frame-accurate cut on " you know" — and the HOOK with `-i body.mp4 -ss 22.85` (slow seek into 60s body file) produced a clean " what" start.

## Why It Matters

- **Recall Technique cuts depend on precise word boundaries.** A 50-80ms slip catches the trailing consonant of the preceding word, breaking the cold-open's punchiness.
- **Body openings depend on clean entry.** Catching the trailing "um" before "you know what's really interesting" makes the body feel stuttery and unprofessional.
- **Fidelity verification loop FAILS silently with imprecise seeks.** Re-transcribing the cut catches the bleed (Whisper reports the leading word), but the iteration cost is one full re-cut + re-transcribe cycle.
- **Slow seek into the FULL source** for a 4K talk is impractically slow (decodes minutes before the cut point).

## How to Apply

### Pattern A — Slow-seek on a working file (preferred for Scissors)

Pre-extract a working window (60-80s) around the target with fast-seek + re-encode. Then cut HOOK and BODY from the working file with slow-seek:

```bash
# Pre-extract working window (fast seek OK here — we have buffer at both ends)
ffmpeg -y -ss <window_start> -i SRC \
  -t <window_dur> \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k \
  working_window.mp4

# Frame-accurate HOOK cut from working file (slow seek, but file is small so fast in practice)
ffmpeg -y -i working_window.mp4 -ss <hook_start_in_window> -t <hook_dur> \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k \
  hook.mp4

# Frame-accurate BODY cut from working file
ffmpeg -y -i working_window.mp4 -ss <body_start_in_window> -t <body_dur> \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k \
  body.mp4
```

### Pattern B — Two-stage seek directly from source (faster, less accurate)

For when you don't want to pre-extract:

```bash
ffmpeg -y -ss <approx_seek_before_keyframe> -i SRC \
  -ss <precise_offset> -t <duration> \
  -c:v libx264 -crf 18 -preset medium -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 192k \
  output.mp4
```

The first `-ss` (before `-i`) gets ffmpeg into the rough vicinity quickly via keyframe seek. The second `-ss` (after `-i`) does precise frame-accurate seeking WITHIN the partially-decoded stream. Total target = first + second.

NOTE: Pattern B does NOT always achieve frame-accuracy on long 4K sources — Pattern A is more reliable. Test against word-level Whisper to verify.

### Pattern C — Slow-seek directly from source (slowest, most accurate)

For one-off cuts where pre-extracting isn't worth the setup:

```bash
ffmpeg -y -i SRC -ss <precise_offset> -t <duration> \
  -c:v libx264 ... \
  output.mp4
```

Slow on 4K sources (must decode from start). Use only when Patterns A/B aren't applicable.

## Connections

- <your-related-note> — Recall Technique cuts demand frame-accurate hook extracts; this is the practical implementation
- <your-related-note> — fidelity loop catches the bleed but each iteration costs a full re-cut; using Pattern A or B from the start saves iterations
- Scissors `auto-cut-pipeline.md` reference doc — should bake Pattern A into the standard pipeline
- Scissors pitfall registry — add this as a hard pitfall entry
