# sixth-sense-xray

> Visual reverse-engineering — analyzes video effects and produces interactive CapCut recreation playbooks with YouTube tutorial links

**Tier:** T9
**Version:** 1.0.0
**Command:** `/sixth-sense-xray`

## Usage

```
/sixth-sense-xray path/to/video.mp4
```

## Prerequisites

**Recommended skills** (warning if missing, not blocking):
- `sixth-sense`

**CLI tools:**
- `ffmpeg`
- `ffprobe`

**External services:**
- Optional: yt-dlp for URL sources — a WebFetch fallback exists
- Optional: Vercel CLI to publish the playbook; local save is always offered


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
