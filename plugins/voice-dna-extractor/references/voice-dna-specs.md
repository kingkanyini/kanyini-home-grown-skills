# Voice DNA Specs — Target Quality Thresholds

Target specs for the major voice cloning platforms as of 2025-2026. The skill's quality gate scores against these.

## Hard Minimums (auto-block below these)

| Spec | Min | Source |
|------|-----|--------|
| Sample rate | 22 kHz | Below this, no platform produces usable clones |
| Duration | 15s | OpenAI Voice Engine minimum |
| Channels | mono OR stereo (downmixable) | n/a |
| Format | MP3, WAV, OGG, AAC, FLAC, WebM | Most platforms |

If any hard minimum fails, **block the run** and report the failing spec. User can override only by responding "Force continue" in the Phase 5 question.

## Soft Targets (warn but allow)

| Spec | Target | Ideal | Gold |
|------|--------|-------|------|
| Sample rate | 44.1 kHz | 48 kHz | 48 kHz |
| Duration | 60s | 5 min | 30 min |
| SNR | 30 dB | 40 dB | 40+ dB |
| Peak dBFS | -18 to -12 | -15 | -15 |
| Format | 192 kbps MP3 | WAV | WAV |
| Channels | mono | mono | mono |

## Platform-Specific Minimums

| Platform | Min Duration | Ideal | Notes |
|----------|--------------|-------|-------|
| ElevenLabs Instant Voice Clone | 30s | 1-5 min | Sweet spot at 3 min |
| ElevenLabs Professional Voice Clone | 30 min | 1-3 hr | Pro tier required |
| Resemble Rapid Clone | 10s | 1-3 min | Fast preview tier |
| Resemble Professional Clone | 10-25 min | 30+ min | Full emotional range |
| OpenAI Voice Engine | 15s | 1+ min | Most permissive |
| PlayHT Voice Cloning | 1 min | 5+ min | Quality scales with duration |

## Quality Score Formula

The skill computes a 1-10 quality score from the soft targets:

```
score = 0
if sample_rate >= 48000: score += 2
elif sample_rate >= 44100: score += 1.5
else: score += 0.5

if duration >= 1800: score += 3       # 30 min gold
elif duration >= 300: score += 2.5    # 5 min ideal
elif duration >= 60: score += 1.5     # 1 min target
elif duration >= 15: score += 0.5     # bare minimum

if est_snr >= 40: score += 2
elif est_snr >= 30: score += 1.5
elif est_snr >= 20: score += 0.5

if -18 <= peak_dbfs <= -12: score += 1.5
elif -22 <= peak_dbfs <= -10: score += 1
else: score += 0.3

if channels == 1: score += 1.5
else: score += 0.5  # will be downmixed but penalized for source

# round to one decimal
```

## Score Interpretation

| Score | Verdict | Action |
|-------|---------|--------|
| 9.0-10.0 | Gold standard | Ship to any platform, including Pro tiers |
| 7.5-8.9 | Production ready | Ship to Instant/Rapid clone tiers, sufficient for most coaching/agency work |
| 6.0-7.4 | Usable with caveats | Works for OpenAI Voice Engine and ElevenLabs Instant, may sound "thin" on demanding contexts |
| 4.0-5.9 | Marginal | Re-clean with stronger settings, or get more source material |
| < 4.0 | Don't ship | Source is too poor. Get raw recording from client or skip this source. |

## Variety Requirements (qualitative — for profile card notes)

Voice cloning quality scales with **content variety**, not just duration. The Authentic Voice Counsel review checks:

- **Tonal range:** does the source span teaching, storytelling, Q&A, emotional moments?
- **Sentence types:** statements, questions, exclamations, pauses?
- **Speaker isolation:** is this only the target speaker, or are there interruptions / co-hosts?
- **Authentic vs. performed:** is this their normal speaking voice, or a stage persona?

A 3-minute clip of varied tonal content beats a 15-minute monotone narration. Single-tone training = single-tone output.

## When Specs Fail — Recovery Options

1. **SNR below 30 dB:** Run source through Adobe Podcast Enhance (https://podcast.adobe.com/enhance) — free, web-based, studio-quality cleanup.
2. **Duration below 60s:** Concatenate multiple sources from the same speaker. Use ffmpeg's `concat` demuxer to join cleanly.
3. **Sample rate below 44.1 kHz:** Almost always means heavily-compressed source (old phone calls, low-quality podcasts). Cannot upsample meaningful detail — get original recording.
4. **Stereo with different content per channel:** Rare but possible (interview where each speaker is on one channel). Use `-map_channel 0.0.0` to extract just the target channel.
