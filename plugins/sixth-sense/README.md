# sixth-sense

> 6-agent video intelligence scanner — identifies clip-worthy segments across Content, Emotion, and Structure

**Tier:** T9
**Version:** 1.0.0
**Command:** `/sixth-sense`

## Usage

```
/sixth-sense path/to/video.mp4
```

## Prerequisites

**Recommended skills** (warning if missing, not blocking):
- `sixth-sense-scissors`
- `transcript-extractor-plus`

**CLI tools:**
- `sixth-sense`
- `uv`
- `ffmpeg`

**External services:**
- The sixth-sense preprocessing engine is a separate package and REQUIRED — this skill orchestrates, the engine does the ffmpeg/Whisper/scene work. Install: uv tool install git+https://github.com/kingkanyini/sixth-sense-engine
- Do NOT run `pip install sixth-sense` — that name belongs to an unrelated PyPI package.
- Python 3.13+. GPU optional: NVIDIA/CUDA accelerates transcription; CPU and Apple Silicon both work.


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
