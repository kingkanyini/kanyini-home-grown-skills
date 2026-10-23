# obsidian-brain-install

**Tier:** T1 — Foundation / Memory · **Slash command:** `/obsidian-brain-install` (+ `/ingest`, `/brain-status`, `/brain-lint`)

Scaffold a **self-compounding Obsidian memory layer** into an AI-Brain workspace — the practical version of Andrej Karpathy's "LLM-Wiki" idea. Instead of retrieval re-deriving answers every time, your AI incrementally maintains a persistent, cross-linked Markdown wiki that **compounds**: one new source updates many related pages, and every future question reads from it.

The magic word is **reasoning, not memory**. Your `layer-1-context/` folder *becomes* the wiki:

- **`raw/`** — the inbox. You drop sources here; the AI never edits them (treated as untrusted).
- **`layer-1-context/`** — the brain. The AI tends and cross-links it with `[[wiki-links]]`.
- **`outputs/`** — the out-tray. Deliverables land here, never read back.

A deterministic Node engine owns the guarantees so nothing depends on the AI "remembering" to do them: `.gitignore` written first, a sentinel-bounded schema block that makes re-runs idempotent, a **remote/PII HALT** if confidential client files are tracked to a git remote, and `.client-data-boundary` sentinels. NSA-reviewed, 9.18/10.

## Commands

| Command | What it does |
|---|---|
| `/obsidian-brain-install` | Idempotently scaffold the memory layer into the workspace you're in. Safe to re-run — never clobbers your content. |
| `/ingest` | Weave a dropped source from `raw/` into the wiki — updates related pages, surfaces contradictions (never auto-resolves), dedups. Safe-mode, pull-only. |
| `/brain-status` | One-command health read → `HEALTH.md` (file band, contradictions, drift, orphans, days-since-lint). Green = trust it. |
| `/brain-lint` | Deterministic maintenance scan → `LINT-REPORT.md` (broken links, orphans, drift, stale raw). Surfaces, never auto-fixes. |

## Usage example

```
# From inside your AI-Brain workspace (a folder with CLAUDE.md + layer-1-context/):
/obsidian-brain-install          # scaffolds raw/, index.md, log.md, outputs/, .obsidian/, schema block

# Then the daily loop:
#  1. Drop an article / transcript / PDF into raw/
/ingest                          # weaves it into the wiki
/brain-status                    # is the brain healthy?
```

## Requirements

- **Node** (already required by Claude Code).
- **git** — optional; enables the confidential-file HALT safety check.
- **Obsidian desktop** — optional; gives you the visual graph view. The memory is plain Markdown either way.

## Not in v1

Sharded index · semantic contradiction detection · push-trigger ingest · Pinecone recall tier · NotebookLM research tier · log rotation. These are the documented upgrade path.
