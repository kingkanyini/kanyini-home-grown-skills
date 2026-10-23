# snapshot

> Take high-def screenshots from videos, websites, or extract photos from PDFs

**Tier:** T9
**Version:** 1.0.0
**Command:** `/snapshot`

## Usage

```
/snapshot
```

## Prerequisites

**CLI tools:**
- `ffmpeg`

**External services:**
- Optional: Playwright MCP for website capture — without it, offer a different route
- Optional: Canva MCP for Canva export routes
- Optional: Imaginator edit route needs the separate Imaginator skill (not in this marketplace) plus python + GEMINI_API_KEY; without it the route is hidden


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
