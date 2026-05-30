# perplexity-research

> On-demand citation-rich research via Perplexity Sonar API. Quick (~10s), Standard (~30s), or Deep (2-5min) tiers.

**Tier:** T2
**Version:** 1.0.0
**Command:** `/perplexity-research`

## Usage

```
/perplexity-research [topic] [--depth quick|standard|deep]
```

## Prerequisites

**MCP servers:**
- `mcp__perplexity__*`
- `mcp__obsidian-brain__*`

**Environment variables:**
- `PERPLEXITY_API_KEY`

**External services:**
- Perplexity


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
