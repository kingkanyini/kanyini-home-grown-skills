---
description: Deterministic maintenance scan of the AI-Brain — orphans, broken links, drift, stale raw. Surfaces a report, never auto-fixes.
---

# /brain-lint

Scan the AI-Brain in the current folder for broken `[[links]]`, orphan pages, index drift, unprocessed `raw/`, and outputs with no log entry. Writes `LINT-REPORT.md`.

## Steps

1. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/brain-lint.mjs"` (operates on the current vault).
2. Walk the report with the user. Each item is a proposal — fix on their approval, one at a time.

## Rules

- Surfaces only. NEVER auto-fixes. Semantic contradiction-hunting is a v1.1 item, not in scope.
- Run it after ~10 ingests or every ~2 weeks.
