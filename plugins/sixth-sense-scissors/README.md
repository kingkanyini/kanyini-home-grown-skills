# sixth-sense-scissors

> Auto-cut video recordings — silence detection, A/V-synced cuts, dual-language edit maps, and iterative creative cut consultation

**Tier:** T9
**Version:** 1.0.0
**Command:** `/sixth-sense-scissors`

## Usage

```
/sixth-sense-scissors path/to/video.mp4
```

## Prerequisites

**Recommended skills** (warning if missing, not blocking):
- `sixth-sense`
- `transcript-extractor-plus`

**CLI tools:**
- `ffmpeg`
- `ffprobe`
- `python`

**External services:**
- Optional: a local faster-whisper install accelerates the Phase 6 fidelity loop; an API transcription fallback is documented


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
