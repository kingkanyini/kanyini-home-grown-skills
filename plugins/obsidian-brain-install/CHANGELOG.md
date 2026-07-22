# Changelog

All notable changes to `obsidian-brain-install` are documented here.

## [1.0.0] — 2026-07-22

Initial release.

- `/obsidian-brain-install` — idempotent scaffolder for a self-compounding Obsidian memory layer (Layer-1 becomes the wiki: `raw/` inbox, `layer-1-context/` brain, `outputs/` out-tray, `index.md`, `log.md`, `.obsidian/` + web-clipper wiring).
- `/ingest` — safe-mode, pull-only ingestion: weaves a `raw/` source into related pages, surfaces contradictions non-destructively, dedups to `raw/processed/`.
- `/brain-status` — writes `HEALTH.md` (file band, contradictions, drift, orphans, days-since-lint, last-ingest) with a one-number health verdict.
- `/brain-lint` — deterministic, surface-only maintenance scan → `LINT-REPORT.md`.
- Deterministic Node engine enforces: `.gitignore`-first, sentinel-bounded idempotent schema block, remote/PII HALT on tracked confidential files, `.client-data-boundary` sentinels.
- NSA Elite Squad reviewed (design 4.5–7.0 → verified 9.18); shipped with a zero-dependency test suite (33 tests) maintained in the source repo.
