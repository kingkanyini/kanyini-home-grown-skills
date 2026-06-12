# overlay-director

> Turn any talking-head/screen-recording video into a counsel-reviewed animated-overlay HyperFrames build — auto-drafted from an accumulating playbook, tweaked by you, getting faster with every video

**Tier:** T9
**Version:** 1.0.0
**Command:** `/overlay-director`

## Usage

```
/overlay-director path/to/talking-head.mp4
```

## Prerequisites

**Recommended skills** (warning if missing, not blocking):
- `counsel-dispatch`

**CLI tools:**
- `node`
- `npx`
- `ffmpeg`

**External services:**
- hyperframes v0.6.x via npx — install: claude plugin marketplace add bradautomates/claude-video, then claude plugin install hyperframes, hyperframes-cli, hyperframes-media
- Vault MCP (mcp__obsidian-brain__*) is OPTIONAL — without a vault, the skill cold-starts from its shipped playbook digest (Phase 0.5d)
- Optional: Imaginator art generation (Gemini) — without it, art cards become labeled placeholders
- Move-gate tooling: run npm install inside references/moves-library/_impl/gate/ before registering new moves


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
