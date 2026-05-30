# Cleaning Pipeline — ffmpeg Recipes

The full chain transforms raw extracted audio into voice-DNA-ready WAV. Each step writes to its own intermediate file so you can debug a single stage without re-running everything.

## Working directory

All paths are relative to `~/.claude/voice-dna/[client-slug]/`. Source goes into `source/`, intermediate into `cleaned/`, final into `final/`.

## The Chain

### Step 1: Mono convert

Voice cloning expects mono. If source is stereo, downmix to mono with equal weight.

```
ffmpeg -y -i source/raw.mp3 -ac 1 cleaned/01-mono.wav
```

`-ac 1` = 1 audio channel.

### Step 2: Resample to 48 kHz

48 kHz is the voice-cloning gold standard. Most sources are already 44.1 or 48 — this step normalizes.

```
ffmpeg -y -i cleaned/01-mono.wav -ar 48000 cleaned/02-48k.wav
```

`-ar 48000` = audio rate.

### Step 3: Loudness normalize to -16 LUFS

Brings audio into the -18 to -12 dBFS peak range that voice cloning platforms expect. Uses EBU R128 two-pass loudnorm.

```
ffmpeg -y -i cleaned/02-48k.wav -af "loudnorm=I=-16:TP=-1.5:LRA=11" cleaned/03-normalized.wav
```

- `I=-16` = integrated loudness target (LUFS)
- `TP=-1.5` = true peak ceiling
- `LRA=11` = loudness range

For more accurate results, do a two-pass: first pass measures, second pass applies measured values. For this skill, single-pass is fine — it's not broadcast-grade.

### Step 4: Trim leading/trailing silence

Removes dead air at start/end. Keeps internal pauses (those carry speaker rhythm).

```
ffmpeg -y -i cleaned/03-normalized.wav -af "silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_silence=0.1:start_threshold=-50dB,areverse" cleaned/04-trimmed.wav
```

The double silenceremove + areverse trick trims both ends. Threshold -50 dB catches most silence without cutting quiet breath.

### Step 5: Light denoise

Removes consistent background hum (AC, computer fan, room tone). Mild settings — aggressive denoise destroys voice character.

```
ffmpeg -y -i cleaned/04-trimmed.wav -af "afftdn=nf=-25" cleaned/05-denoised.wav
```

`afftdn` = FFT-based denoise. `nf=-25` = noise floor target (-25 dB).

### Aggressive denoise (only if user requests in Phase 6)

For clearly noisy source (street recording, poor mic):

```
ffmpeg -y -i cleaned/04-trimmed.wav -af "afftdn=nf=-35:nt=w" cleaned/05-denoised.wav
```

`nt=w` = white noise model (more aggressive). Use only if the user explicitly opts in — destroys some voice detail.

## Final Export to MP3

After Phase 6 approval, export to MP3 at 192 kbps:

```
ffmpeg -y -i cleaned/05-denoised.wav -codec:a libmp3lame -b:a 192k final/[slug]-voice-dna.mp3
```

192 kbps is the cloning-platform sweet spot — small enough to upload fast, high enough to preserve detail.

## Quality Probe (Phase 5)

Use ffprobe to read final stats:

```
ffprobe -v quiet -print_format json -show_streams -show_format cleaned/05-denoised.wav
```

Parse:
- `streams[0].sample_rate` → sample rate
- `streams[0].channels` → channel count
- `format.duration` → duration seconds
- `format.bit_rate` → bitrate

## SNR Estimation (rough)

ffmpeg has no direct SNR measure. Estimate by measuring volume during silent moments vs speech:

```
ffmpeg -i cleaned/05-denoised.wav -af "volumedetect" -f null -
```

Returns `mean_volume` and `max_volume` in dBFS. Rough SNR ≈ `max_volume - mean_volume + 10` (very approximate). For real SNR, route through Adobe Podcast Enhance which scores it natively.

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| "Conversion failed" | Bad input file path | Verify source file exists |
| "Invalid argument" on `-af` | Filter chain syntax error | Quote the filter string |
| "Permission denied" on output | Write target locked | Close any audio player using the file |
| Silent output file | Source had no audio track | Re-extract from a different source |
| Distorted output | Loudnorm pushed levels too hard | Reduce `I=-16` to `I=-18` |
