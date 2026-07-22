---
description: Scaffold the self-compounding Obsidian memory layer into the client AI-Brain in the current folder (idempotent). Run from inside the client's workspace.
---

# /install-brain

Turns the AI-Brain in the current working directory into a Karpathy-style compounding wiki: adds `raw/` (inbox), `index.md`, `log.md`, `outputs/` (out-tray), `.obsidian/`, `.client-data-boundary` sentinels, and a sentinel-guarded schema block in `CLAUDE.md`. **Idempotent** — safe to re-run, never clobbers client content. The deterministic script owns all guarantees (gitignore-first, sentinel append, remote/PII halt).

## Steps

1. Confirm the current directory is the client's AI-Brain workspace (it must have `CLAUDE.md` + `layer-1-context/`). If not, ask the user to `cd` into it.
2. Preview first: `node "${CLAUDE_PLUGIN_ROOT}/scripts/install-brain.mjs" --dry-run`
3. Run it: `node "${CLAUDE_PLUGIN_ROOT}/scripts/install-brain.mjs"`
4. **If it HALTS** on a git-remote + confidential-file warning, STOP. Walk the printed remediation with the user (gitignore + untrack + history scrub) before doing anything else. Only pass `--force` if the user explicitly understands the PII exposure.
5. Report what changed (the script prints each step) and point the user at `.obsidian/WEB-CLIPPER-SETUP.md`.

## Rules

- Always run the bundled script — never hand-scaffold the tree. The script is the contract.
- The script operates on the current working directory's vault; it finds the root via `CLAUDE.md` + `layer-1-context/`.
- After install, wire the sibling commands (`/ingest`, `/brain-status`, `/brain-lint`) for the daily loop.
