# voice-dna-extractor

> Extract clean voice DNA audio from IG, YouTube, or local video files. Auto-cleans, quality-gates, outputs MP3 + voice profile card.

**Tier:** T3
**Version:** 1.0.0
**Command:** `/voice-dna-extractor`

## Usage

```
/voice-dna-extractor [url-or-path]
```

## Prerequisites

**MCP servers:**
- `mcp__yt-dlp-mcp__*`
- `mcp__ffmpeg-mcp__*`

**CLI tools:**
- `yt-dlp`
- `ffmpeg`

**External services:**
- YouTube
- Instagram


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
