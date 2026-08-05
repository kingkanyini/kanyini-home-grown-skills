# Micro-Scan Algorithm

*Loaded by the orchestrator during Phase 3. Defines how visual changes are detected between overview frames and when to trigger high-framerate micro-scans.*

---

## Overview

The micro-scan system detects visual changes between sequential overview frames, then extracts high-framerate captures (10fps) around those change points. This catches animations, slide-ins, typewriter text, and short-lived effects that the overview scan (every 2-15 seconds) misses entirely.

**POC validation:** On the EXAMPLE-BRAND VSL, overview scan (1 frame/30s) found 18 effects. Micro-scan found 5 additional effects the overview completely missed — typewriter name tag, book cover slide-in, globe icon, "The Missing Key" combo, and edge vignette border.

---

## When Micro-Scan Activates

| Density | Micro-Scan | Trigger Sources |
|---------|:----------:|----------------|
| Quick | OFF | No micro-scan (speed priority) |
| Smart | ON | Scene-change triggers only |
| Deep | ON | Scene-change triggers + pixel luminance diff triggers |

---

## Trigger Algorithm

### Source 1: Scene-Change Detection (Smart + Deep)

During overview frame extraction, ffmpeg's scene detection identifies hard cuts:
```bash
ffmpeg -i "{video_path}" -vf "select='gt(scene,0.3)',showinfo" -vsync vfr -f null - 2>&1 | grep "pts_time"
```

Each detected scene change timestamp becomes a micro-scan trigger point.

**Threshold:** `scene > 0.3` (same as overview extraction). This catches hard cuts, fades, and major visual transitions but ignores minor lighting shifts.

### Source 2: Pixel Luminance Diff (Deep only)

For sequential pairs of overview frames NOT already flagged as scene changes, compute average luminance difference:

```bash
ffmpeg -i "{frame_A}" -i "{frame_B}" -filter_complex "[0][1]blend=all_mode=difference" -f image2 "{diff_output}" -y
```

Then measure mean pixel value of the difference image:
```bash
ffprobe -v quiet -f lavfi -i "movie={diff_output},signalstats" -show_entries frame_tags=lavfi.signalstats.YAVG -of csv=p=0 2>/dev/null | head -1
```

**Trigger threshold:** If mean luminance diff > 38 (on 0-255 scale, ~15%), flag as a micro-scan trigger.

**Why 15%:** POC testing showed:
- Stable speaker footage between frames: <5% diff (~12 luminance)
- Effects appearing/disappearing: 20-35% diff (~50-90 luminance)
- Hard cuts between scenes: >40% diff (caught by scene detection already)
- The 15% threshold catches overlay appearances without triggering on minor hand gestures or lighting shifts.

### Source 3: Overlap Merge

If two trigger points are within 20 seconds of each other, merge their windows into a single continuous micro-scan zone:
- Merged start = earliest trigger - 15 seconds
- Merged end = latest trigger + 15 seconds

This prevents redundant overlapping captures and reduces total frame count.

---

## Micro-Scan Extraction

For each trigger zone (after overlap merge):

```bash
ffmpeg -ss {zone_start} -to {zone_end} -i "{video_path}" \
  -vf "fps=10,drawtext=text='%{pts\:hms}':x=10:y=H-30:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.7:boxborderw=4" \
  -q:v 2 "{output_dir}/microscan_{zone_id}/frame_%04d.jpg" -y
```

**Output:** ~300 frames per 30-second window at 10fps.

### Mosaic Generation for Agent Consumption

Group micro-scan frames into 3x3 grids (same format as overview mosaics):
```bash
ffmpeg -ss {zone_start} -to {zone_end} -i "{video_path}" \
  -vf "fps=10,drawtext=text='%{pts\:hms}':x=10:y=10:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.6:boxborderw=3,scale=384:216,tile=3x3" \
  -q:v 2 "{output_dir}/microscan_{zone_id}/mosaic_%03d.jpg" -y
```

Each 30-second window produces ~33 mosaic images (300 frames / 9 per mosaic). The micro-scan agent reads these mosaics to identify animations and short-lived effects.

---

## Frame Budget by Density

| Density | Overview Frames | Micro-Scan Frames | Total Est. Tokens | Max Video Length |
|---------|----------------|-------------------|-------------------|-----------------|
| Quick (15s) | 40-60 | 0 | ~10K (7 mosaics) | 60 min |
| Smart (5s) | 80-120 | 100-500 (scene triggers) | ~36K (14 + 10 mosaics) | 30 min |
| Deep (2s) | 250+ | 500-2000 (scene + luminance) | ~87K (28 + 30 mosaics) | 15 min |

**Token estimate:** ~1,500 tokens per mosaic image when read by an agent.

**Context safety:** If total estimated mosaics exceed 60 (risk zone for agent context), warn the user and suggest:
- Lowering density
- Batched processing (see below)

---

## Batched Processing for Long Videos

For videos exceeding the density ceiling (e.g., 25 min video at Deep):

1. Split video at natural scene boundaries (from ffmpeg scene detection)
2. Create segments of ≤ max duration for the selected density
3. Process each segment independently through Phases 1-3
4. Each segment gets its own overview mosaics and micro-scan windows
5. Merge all segment outputs before Phase 4 (CapCut translation)

**Segment naming:** `{slug}_seg01`, `{slug}_seg02`, etc.
**Agent outputs merge:** Concatenate with segment headers, then Agent 4 deduplicates across segments.

---

## Micro-Scan Agent Instructions

The micro-scan agent receives the same 3 scanner prompts as the overview agents, but with these modifications:

1. **Input:** Micro-scan mosaics PLUS the overview scanner outputs (so it knows what was already found)
2. **Mission:** "Focus on what the overview missed. Look for: animations in progress, text typing in/out, elements sliding in/out, opacity changes, short-lived graphics (<3 seconds), and edge effects."
3. **Output:** Supplementary findings only — do NOT re-catalog effects already found by overview scanners
4. **File:** `{OUTPUT_DIR}/microscan_findings.md`

**Validation:** File exists, minimum 20 lines (even a "no new findings" report should explain what was checked).
