# Contributing

This marketplace is currently **closed to external contributions** — Kanyini authors all skills, and the access model is collaborator-invite-only. This document exists to record the conventions skills must follow, so when contributions open later (Phase 3+), the rules are clear.

## Folder-name contract

Per PLAN-v3.1 §3.5. **All skill folders must use kebab-case, plural for collections, no spaces. Sanitizer FAILS LOUD on unknown folders.**

### Canonical folder names

| Canonical | Purpose |
|-----------|---------|
| `commands/` | Slash command definitions (one Markdown file per command) |
| `references/` | Reference material the skill reads at runtime |
| `scripts/` | Executable scripts (Node, Python, PowerShell) |
| `examples/` | Curated demo content shipped with the skill (must pass anonymization checklist) |
| `docs/` | Skill-specific documentation |
| `.claude-plugin/` | Required Claude Code plugin metadata (`plugin.json`) |

### Forbidden at skill root

- `node_modules/`, `.git/`, `.env*` (except `.env.example`), `__pycache__/`, `.pytest_cache/`, `dist/`, `build/`, `.cache/`
- `client files/`, `client-files/`, `session history/`, `session-history/`, `.history/`
- Any folder not in the canonical list above

## Per-skill folder contract (§5.5)

Every skill MUST ship:

- `.claude-plugin/plugin.json` (validates against `schemas/plugin.schema.json`)
- `README.md` (skill purpose + slash command + one usage example)
- `CHANGELOG.md` (starts at `1.0.0`)
- `preflight.mjs` (exit 0/1/2 per [§4.6 contract](../README.md), stdout = human-readable status, stderr = `MISSING:<name>`)

## Examples folder anonymization checklist

Per PLAN-v3.1 §3.5.1. Before any file enters `examples/`, every line gets scanned for:

- [ ] No real client names — replace with `<example-client>`
- [ ] No real revenue numbers — replace with round figures (`$50k`, not `$47,338`)
- [ ] No real URLs — replace with `example.com`
- [ ] No real email addresses — replace with `user@example.com`
- [ ] No screenshots containing client UI
- [ ] No real timestamps — use `YYYY-MM-DD` placeholder format
- [ ] No industry/niche specifics that could re-identify

If a file can't be anonymized cleanly, **delete it** rather than ship.

## Schema $id rule

Both `schemas/marketplace.schema.json` and `schemas/plugin.schema.json` declare `$id: https://kanyini.dev/schemas/<name>.schema.json`. Cross-schema references use `$ref` with the absolute `$id`. When Phase 2 adds `preflight.schema.json`, it follows the same URL pattern.

## Skill naming

Skill names (kebab-case, lowercase start, no consecutive hyphens) are enforced by the schema regex `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`. Violations fail `npm run validate:plugins`.

## Submission process (currently closed)

For now, all skill changes flow through Kanyini. If you have ideas for a skill or a fix for an existing one, see [`FEEDBACK.md`](FEEDBACK.md) for the right channel.

When contributions open (Phase 3+ if/when announced), the submission flow will be: fork → branch → submit PR with the per-skill folder contract above passing all validators.
