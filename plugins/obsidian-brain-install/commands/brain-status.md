---
description: One-command health read of the AI-Brain — file band, contradictions, drift, orphans, days-since-lint. Writes HEALTH.md.
---

# /brain-status

Run the health check on the AI-Brain in the current folder and write `HEALTH.md` — the plain-language "is my brain healthy?" surface.

## Steps

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain-status.mjs"` (operates on the current vault).
2. Show the user `HEALTH.md`. Read them the verdict: 🟢 green = trust it; 🔴 red = don't put a deliverable in front of a client until it's cleared.

## Rules

- Read-only. Never edits wiki pages.
- The band: 🟢 under ~150 pages · 🟡 150–400 (watch) · 🔴 over 400 (time for the Pinecone tier).
