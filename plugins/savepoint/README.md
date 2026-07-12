# savepoint

> Save session context and git snapshots — your video game save point for agent work

**Tier:** T1
**Version:** 1.1.0
**Command:** `/savepoint`

## Usage

```
/savepoint or /savepoint "brief description"
```

## Prerequisites

**CLI tools:**
- `git`

> **Optional — vault sync (locked by default):** This build saves session notes to a local file and needs no MCP server. An advanced mode syncs to a personal Obsidian vault via the `mcp__obsidian-brain__*` MCP and snapshots `~/.claude.json`. It is disabled by default — set `VAULT_FEATURES: UNLOCKED` in `commands/savepoint.md` to enable it (requires that MCP plus the config-snapshot scripts).

Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
