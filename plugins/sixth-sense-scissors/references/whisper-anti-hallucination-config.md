---
type: gou-gold-standard
tags:
  - whisper
  - faster-whisper
  - transcription
  - hallucination-prevention
  - sixth-sense-scissors
  - transcript-extractor-plus
scope: workflow
applies_to:
  - sixth-sense-scissors
  - transcript-extractor-plus
  - sixth-sense
  - sixth-sense-sage
  - watch
  - voice-profile-build
  - voice-dna-extractor
kind: config
status: stable
qualified_by: <your-username>
qualification_date: 2026-05-16
qualification_score: 9.0
last_validated: 2026-05-16
version: 1
replicable: true
confidence: high
pii_firewall: true
redaction_status: redacted
source_session: '<your-related-note>'
aliases:
  - "faster-whisper anti-hallucination"
  - "whisper repetition prevention"
related:
  - '<your-related-note>'
  - '<your-related-note>'
---

# GOU Gold Standard — Whisper Anti-Hallucination Config

## The Insight

When transcribing for fidelity verification (or any high-stakes transcription), invoke `faster-whisper` with **`condition_on_previous_text=False`, `temperature=0.0`, `no_repeat_ngram_size=3`, `compression_ratio_threshold=2.0`** to prevent the language model from imagining repeated phrases at segment boundaries.

## Why It's Gold

Default `faster-whisper` settings allow the LM to condition on prior text, which sometimes causes spurious repetitions when audio is ambiguous near segment boundaries — the LM "imagines" the speaker repeated themselves.

Empirically proven in <your-related-note>: v3 <example-client> transcript hallucinated **"I'm going to do this. I'm going to do this. I'm going to do this. I'm going to do this."** across two segments (v3 t=57.54-58.90). The audio contained none of this — the v2 transcription of the same audio range was clean. Difference was purely the segment boundary shift, which triggered the LM to confabulate.

After applying the four-flag config in v4 + v5, transcripts came back verbatim-accurate with zero hallucinated repetitions. The clip then passed the <your-related-note> gate at ≥98%.

Without this config, the fidelity verification loop would generate false negatives (verification reports content that's not actually in the cut) — wasting iteration cycles chasing phantom fixes.

## When to Apply

Fires whenever transcribing for any of:

- **Fidelity verification** — checking a cut's actual spoken content matches expectations
- **Voice DNA extraction** — capturing speaker patterns for cloning/profile-building
- **Caption generation** — captions must match what's spoken, not what the LM imagines
- **Translation source** — translation drift compounds if source is hallucinated
- **Quote extraction** — pulling verbatim quotes from a talk

Skip these settings (use defaults) only when:

- Transcribing for rough/exploratory summary (LM smoothing actually helps readability at the cost of fidelity)
- The use case explicitly benefits from punctuation/grammar inference

## How to Apply

```python
from faster_whisper import WhisperModel

model = WhisperModel("large-v3", device="cuda", compute_type="float16")

segments_iter, info = model.transcribe(
    str(audio_or_video_path),
    word_timestamps=True,           # required for word-level downstream work
    vad_filter=False,               # let silence land in transcript instead of being filtered
    beam_size=5,                    # standard search width
    language="en",                  # or specific lang code
    condition_on_previous_text=False,   # ⚠️ KEY: prevents LM from imagining repetitions based on prior text
    temperature=0.0,                # ⚠️ KEY: deterministic decoding, no sampling
    no_repeat_ngram_size=3,         # ⚠️ KEY: prevents 3+ word repetition runs (catches "I'm going to do this" loops)
    compression_ratio_threshold=2.0,   # ⚠️ KEY: rejects segments where output is suspiciously compressed (a hallucination signature)
)
```

### Why each flag matters

| Flag | Default | Why we override |
|------|---------|-----------------|
| `condition_on_previous_text` | `True` | Default lets LM "remember" prior text and continue patterns. This is the primary repetition-hallucination cause. Set False = each segment transcribed independently from audio only. |
| `temperature` | `[0.0, 0.2, 0.4, 0.6, 0.8, 1.0]` (fallback ladder) | Default escalates temperature on uncertain segments → creative completions. Set `0.0` = always deterministic, no fallback creativity. |
| `no_repeat_ngram_size` | unset | Hard block on the same 3-word sequence repeating. Catches "I'm going to do this" / "I'm going to do this" loops. |
| `compression_ratio_threshold` | `2.4` | When Whisper's output compresses tightly (high repetition), it's a hallucination signature. Lower threshold = stricter rejection. |

### Tradeoffs

- **Slightly less context-aware.** Without `condition_on_previous_text`, Whisper can't carry vocabulary preferences across segments (e.g., consistent spelling of unusual names). Acceptable for fidelity work.
- **Slightly more "ums" and disfluencies** in output. Acceptable — we want raw audio fidelity.
- **Marginally slower on uncertain segments** (no temperature-fallback shortcut). Trivial difference.

## Anti-Patterns (Failure Modes This Prevents)

- **Phantom repetitions.** "I'm going to do this. I'm going to do this. I'm going to do this. I'm going to do this." on clean audio. Without this config, this is the dominant Whisper failure mode for talking-head content.
- **Vocabulary drift across segments.** Default `condition_on_previous_text` can cause unusual words from segment 3 to "infect" segment 7 with phantom mentions.
- **Confabulated content at audio gaps.** Default temperature-fallback fills uncertain segments with plausible-but-wrong text.
- **Compressed-output hallucinations.** A 5-second segment yielding "yeah yeah yeah yeah yeah" is a signature; the threshold catches it.

## Validation History

- **Spawning incident:** v3 <example-client> transcript hallucinated "I'm going to do this" 4× on clean audio. v4 with all four flags returned clean. v5 verified ≥98% verbatim match.
- **Qualification date:** 2026-05-16
- **Counsel review:** <your-name> direct
- **Replication count:** 1 engagement (<example-client> Lymphatic). Future clips in same project + any future Whisper-based fidelity work will replicate.
- **Last re-validated:** 2026-05-16

## Cross-Skill Applicability

| Skill | How It Applies |
|---|---|
| `sixth-sense-scissors` | Mandatory in fidelity verification loop and Phase 6 re-transcription. |
| `transcript-extractor-plus` | Recommended for any TEP run intended for captions or verbatim quote extraction. Skip for summary-only mode. |
| `sixth-sense` (preprocess) | Recommended; current `decoupled_preprocess.py` may not yet use these flags — opportunity to upgrade. |
| `voice-profile-build`, `voice-dna-extractor` | Mandatory — voice profiles depend on verbatim accuracy. |
| `watch` | When `/watch` uses local Whisper backend, apply these flags. Groq/OpenAI API has its own knobs (not directly mappable). |

## Connections

- <your-related-note> — spawning session
- <your-related-note> — paired workflow that depends on this config to function reliably
- Scissors pitfall registry — should add "Whisper hallucination at segment boundaries" as a new entry pointing here
- CLAUDE.md "Fidelity Principle" — global principle this config operationalizes for transcription
