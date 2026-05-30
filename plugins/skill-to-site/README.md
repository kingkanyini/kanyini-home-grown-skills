# skill-to-site

> Turn any installed skill into a deployed Vercel chat site (Next.js + streaming Anthropic API + secret-safe env piping)

**Tier:** T4
**Version:** 1.0.0
**Command:** `/skill-to-site`

## Usage

```
/skill-to-site [skill-name]
```

## Prerequisites

**CLI tools:**
- `npx`
- `node`

**Environment variables:**
- `ANTHROPIC_API_KEY`
- `VERCEL_TOKEN`

**External services:**
- Vercel
- Anthropic


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
