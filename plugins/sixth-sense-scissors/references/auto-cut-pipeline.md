# Auto-Cut Pipeline Template

## Overview
This is the Python script template for the segment extraction + concat demuxer approach. Generate this file customized to the specific video and segment list.

## Template: auto_cut.py

```python
"""
Sixth Sense Scissors — Auto-Cut Pipeline
Extracts keep-segments, validates A/V sync, concats losslessly.
Usage: python auto_cut.py [recording_id]
"""
import subprocess
import os
import sys
import shutil
import time

# ============================================================
# SEGMENT DEFINITIONS
# Paste segment lists here per recording.
# Each entry is (start_seconds, end_seconds).
# ============================================================

RECORDINGS = {
    "default": {
        "source": "{SOURCE_VIDEO_PATH}",
        "segments": [
            # (start, end),  # seg 1
            # (start, end),  # seg 2
            # ... generated from silence detection
        ],
    },
}

# ============================================================
# CONFIG — match the skill defaults
# ============================================================

CRF = 18
AUDIO_BITRATE = "192k"
CUT_BUFFER = 0.15         # seconds of buffer on each side of a keep segment (protects first/last syllables)
TOLERANCE_SEG = 0.15      # per-segment duration tolerance (seconds)
TOLERANCE_AV_SYNC = 0.08  # A/V sync tolerance per segment
TOLERANCE_FINAL = 0.5     # final output total duration tolerance


def get_duration(filepath, stream="v:0"):
    """Get stream duration via ffprobe."""
    cmd = [
        "ffprobe", "-v", "quiet",
        "-select_streams", stream,
        "-show_entries", "stream=duration",
        "-of", "csv=p=0",
        filepath
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    try:
        return float(result.stdout.strip())
    except ValueError:
        return None


def fmt_time(seconds):
    """Format seconds as m:ss.ff"""
    m = int(seconds) // 60
    s = seconds - m * 60
    return f"{m}:{s:05.2f}"


def extract_segment(source, start, end, output_path, seg_num, total):
    """Extract a single segment with re-encoding. Applies CUT_BUFFER to protect syllables."""
    # Apply buffer: start earlier, end later (clamp to 0 and don't overlap)
    buffered_start = max(0, start - CUT_BUFFER)
    buffered_end = end + CUT_BUFFER
    duration = buffered_end - buffered_start
    print(f"  [{seg_num:2d}/{total}] {fmt_time(buffered_start)} -> {fmt_time(buffered_end)} ({duration:.2f}s) ... ", end="", flush=True)

    cmd = [
        "ffmpeg", "-y",
        "-ss", str(buffered_start),
        "-to", str(buffered_end),
        "-i", source,
        "-c:v", "libx264", "-crf", str(CRF), "-preset", "medium",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", AUDIO_BITRATE,
        "-movflags", "+faststart",
        output_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print("FAILED")
        print(f"    stderr: {result.stderr[-200:]}")
        return False

    # Validate
    v_dur = get_duration(output_path, "v:0")
    a_dur = get_duration(output_path, "a:0")

    if v_dur is None or a_dur is None:
        print("FAILED (can't read duration)")
        return False

    av_diff = abs(v_dur - a_dur)
    dur_diff = abs(v_dur - duration)

    ok = True
    warnings = []

    if dur_diff > TOLERANCE_SEG:
        warnings.append(f"duration off by {dur_diff:.3f}s")
        ok = False
    if av_diff > TOLERANCE_AV_SYNC:
        warnings.append(f"A/V drift {av_diff:.3f}s")
        ok = False

    if ok:
        print(f"OK (v={v_dur:.2f}s a={a_dur:.2f}s)")
    else:
        print(f"FAIL: {', '.join(warnings)} (v={v_dur:.2f}s a={a_dur:.2f}s)")

    # Return the real verdict. This used to `return True` unconditionally, which meant
    # every caller read a desynced or mis-cut segment as a success and the only trace
    # was a WARN line in stdout.
    return ok


def concat_segments(seg_dir, seg_count, output_path):
    """Concat all segments losslessly."""
    concat_file = os.path.join(seg_dir, "concat.txt")
    with open(concat_file, "w") as f:
        for i in range(1, seg_count + 1):
            seg_path = f"seg_{i:02d}.mov"
            f.write(f"file '{seg_path}'\n")

    cmd = [
        "ffmpeg", "-y",
        "-f", "concat", "-safe", "0",
        "-i", concat_file,
        "-c", "copy",
        "-movflags", "+faststart",
        output_path
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    return result.returncode == 0


def run_pipeline(recording_id, force=False):
    """Run the full extract-validate-concat pipeline.

    force=True proceeds past failed segment validation. Default halts.
    """
    if recording_id not in RECORDINGS:
        print(f"No segment definition for recording {recording_id}")
        print(f"Available: {', '.join(RECORDINGS.keys())}")
        return False

    config = RECORDINGS[recording_id]
    source = config["source"]
    segments = config["segments"]
    output_name = f"{os.path.splitext(os.path.basename(source))[0]}_clean.mov"

    # Resolve paths relative to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    source_path = os.path.normpath(os.path.join(script_dir, source))
    output_path = os.path.join(script_dir, output_name)
    temp_dir = os.path.join(script_dir, f"temp_{recording_id}")

    print(f"\n{'='*60}")
    print(f"  Sixth Sense Scissors — Auto-Cut Pipeline")
    print(f"{'='*60}")
    print(f"  Source:   {os.path.basename(source_path)}")
    print(f"  Segments: {len(segments)}")

    expected_total = sum(end - start for start, end in segments)
    print(f"  Expected: {fmt_time(expected_total)} ({expected_total:.1f}s)")
    print(f"  Output:   {output_name}")
    print()

    if not os.path.exists(source_path):
        print(f"  ERROR: Source not found: {source_path}")
        return False

    os.makedirs(temp_dir, exist_ok=True)

    # Phase 1: Extract segments
    print("Phase 1: Extracting segments...")
    all_ok = True
    for i, (start, end) in enumerate(segments, 1):
        seg_path = os.path.join(temp_dir, f"seg_{i:02d}.mov")
        if not extract_segment(source_path, start, end, seg_path, i, len(segments)):
            all_ok = False

    if not all_ok:
        print("\n  HALT: one or more segments failed validation (see FAIL lines above).")
        print(f"  Segments kept for diagnosis at: {temp_dir}")
        print("  Concatenating these would produce a mis-cut or desynced clip.")
        print("  Re-cut the failing segment, or re-run with --force to proceed anyway.")
        if not force:
            return False
        print("  --force set. Continuing with concat despite failures.\n")

    # Phase 2: Concat
    print(f"\nPhase 2: Concatenating {len(segments)} segments...")
    if not concat_segments(temp_dir, len(segments), output_path):
        print("  FAILED: Concat error")
        return False
    print("  Concat complete.")

    # Phase 3: Validate final output
    print("\nPhase 3: Validating final output...")
    v_dur = get_duration(output_path, "v:0")
    a_dur = get_duration(output_path, "a:0")

    if v_dur is None or a_dur is None:
        print("  FAILED: Can't read output duration")
        return False

    av_diff = abs(v_dur - a_dur)
    total_diff = abs(v_dur - expected_total)

    print(f"  Video duration:  {fmt_time(v_dur)} ({v_dur:.2f}s)")
    print(f"  Audio duration:  {fmt_time(a_dur)} ({a_dur:.2f}s)")
    print(f"  A/V difference:  {av_diff:.3f}s {'OK' if av_diff < TOLERANCE_AV_SYNC else 'WARN'}")
    print(f"  vs Expected:     {total_diff:.3f}s {'OK' if total_diff < TOLERANCE_FINAL else 'WARN'}")

    # Phase 4: Cleanup
    final_ok = av_diff < TOLERANCE_AV_SYNC and total_diff < TOLERANCE_FINAL

    if not final_ok:
        print(f"\nPhase 4: SKIPPED — final output failed validation.")
        print(f"  Segments kept for diagnosis at: {temp_dir}")
    else:
        print(f"\nPhase 4: Cleaning up {len(segments)} temp files...")
        # Cloud-sync folders (Dropbox, OneDrive) lock files mid-sync and rmtree throws
        # PermissionError AFTER a successful cut — which reads as "the cut failed".
        # Retry, then warn and move on. Never let cleanup fail the run.
        for attempt in range(3):
            try:
                shutil.rmtree(temp_dir)
                print("  Done.")
                break
            except PermissionError:
                if attempt < 2:
                    time.sleep(3)
                else:
                    print(f"  WARN: could not remove {temp_dir} (locked by sync client).")
                    print("  The cut succeeded. Delete the temp folder manually later.")

    # Summary
    source_dur = get_duration(source_path, "v:0") or 0
    removed = source_dur - v_dur if source_dur else 0
    print(f"\n{'='*60}")
    print(f"  SUMMARY")
    print(f"{'='*60}")
    print(f"  Original:  {fmt_time(source_dur)} ({source_dur:.1f}s)")
    print(f"  Clean cut: {fmt_time(v_dur)} ({v_dur:.1f}s)")
    print(f"  Removed:   {fmt_time(removed)} ({removed:.1f}s)")
    print(f"  A/V sync:  {'PASS' if av_diff < TOLERANCE_AV_SYNC else 'FAIL'} ({av_diff:.3f}s drift)")
    print(f"  Output:    {output_path}")
    print(f"{'='*60}\n")

    return av_diff < TOLERANCE_AV_SYNC


if __name__ == "__main__":
    rec_id = sys.argv[1] if len(sys.argv) > 1 else "default"
    success = run_pipeline(rec_id)
    sys.exit(0 if success else 1)
```

## Customization Points

When generating auto_cut.py for a specific video:
1. Replace `{SOURCE_VIDEO_PATH}` with relative path from script to video
2. Populate the segments list from Phase 3 silence detection
3. Add multiple recordings to `RECORDINGS` dict for batch processing
4. Adjust CRF/AUDIO_BITRATE if user requested different quality

## Key FFmpeg Flags

| Flag | Why |
|------|-----|
| `-ss {start}` before `-i` | Fast input seeking (keyframe-accurate) |
| `-to {end}` | Absolute end time in input |
| `-pix_fmt yuv420p` | CapCut/editor compatibility (iPhone sometimes uses yuv420p10le) |
| `-movflags +faststart` | moov atom at start for fast seeking |
| `-c:v libx264 -crf 18` | Near-lossless H.264 re-encode |
| `-c:a aac -b:a 192k` | High-quality AAC audio |
| `-c copy` (concat step) | Lossless concatenation, no re-encode |

## Validation Thresholds

| Check | Threshold | When |
|-------|-----------|------|
| Per-segment duration | 150ms | After each segment extraction |
| Per-segment A/V sync | 80ms | After each segment extraction |
| Final total duration | 500ms | After concat |
| Final A/V sync | 100ms | After concat |
