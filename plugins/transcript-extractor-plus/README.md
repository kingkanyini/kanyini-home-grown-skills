# transcript-extractor-plus

> Transcribe videos in any language and translate to any target language using Whisper + AI translation

**Tier:** T9
**Version:** 1.0.0
**Command:** `/transcript-extractor-plus`

## Usage

```
/transcript-extractor-plus
```

## Prerequisites

**Recommended skills** (warning if missing, not blocking):
- `sixth-sense-scissors`

**CLI tools:**
- `ffmpeg`
- `yt-dlp`

**External services:**
- whisper.cpp — Windows: built inside WSL at ~/whisper.cpp. macOS: brew install whisper-cpp. Linux: build from source.
- Whisper model ggml-medium.bin — download via models/download-ggml-model.sh medium


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
