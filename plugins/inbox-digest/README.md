# inbox-digest

> Scan Gmail for client emails, file into vault per-client, generate per-client daily briefs

**Tier:** T2
**Version:** 1.0.0
**Command:** `/inbox-digest`

## Usage

```
/inbox-digest <client-slug>
```

## Prerequisites

**MCP servers:**
- `mcp__gmail-gong-mcp__*`
- `mcp__obsidian-brain__*`

**CLI tools:**
- `python`
- `node`
- `pwsh`

**External services:**
- Gmail


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
