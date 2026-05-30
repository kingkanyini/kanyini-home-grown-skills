---
name: Skill broken
about: A specific skill isn't working as expected
title: '[skill-broken] '
labels: ['bug', 'needs-triage']
---

## Which skill?

`/skill-name` (e.g., `/morning-compass`, `/voice-dna-blueprint-builder`)

## What did you try to do?

Describe the command or workflow you ran.

## What happened?

Describe the error or unexpected behavior. Paste error messages if possible.

## What did you expect?

Describe what should have happened.

## Environment

- **OS:** Windows / Mac / Linux
- **Claude Code version:** (run `claude --version`)
- **Marketplace version:** v1.0.0
- **Skill version:** (from `plugins/<skill>/.claude-plugin/plugin.json`)

## Have you run `preflight.mjs` for this skill?

The preflight script verifies your prereqs are set up correctly. Run it:

```bash
node ~/.claude/plugins/<skill>/preflight.mjs
```

What was the output?

## Anything else?

Logs, screenshots, related issues, etc.
