---
vault_source: gold-standards/emails/<your-username>
last_synced: 2026-07-10
---
# Email Voice Exemplar Library — POINTER

Canonical library of King <your-name>'s best-performing email exemplars lives in the your vault:

**`gold-standards/emails/<your-username>/`** (see its `_index.md`)

14 best-performing 2025 emails + the goodbye/final gold standard, as individual typed files
(`email_type` / `subject` / `offer` / `descriptor` frontmatter). Single source of truth.

## Runtime bundle (what the skill actually loads)

The skill loads type-matched exemplars from files bundled HERE in `reference/`, NOT by reading the
vault's Dropbox path at draft time (that path can be absent on a fresh machine / cron run / Dropbox
smart-sync stub, causing silent uncalibrated generation — NSA/PHANTOM review 2026-07-10). Currently
bundled runtime exemplars:

- `sunday-reflections-example.md`  → Sunday Reflections
- `goodbye-final-example.md`       → goodbye / final / last-call (wired in the SOS module, Email 5)

To add another type's runtime exemplar: copy the chosen file from the vault library into this folder
and point the relevant skill section at it (the way the SOS module points at the goodbye example).
Refresh from the vault, never fork.

_(The former single-file `<your-username>-best-performing-emails-2025.md` was split into the vault library on
2026-07-10 and removed here to keep one source of truth. Plugin git history retains it.)_
