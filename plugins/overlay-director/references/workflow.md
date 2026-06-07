# Overlay Director — Workflow Mechanics

Deep mechanics behind `commands/overlay-director.md`. Subagent-readable (skill-local; no MCP needed).

## Failure handling baseline

| Failure | Behavior |
|---------|----------|
| **Render fails mid-pass** | v1 re-runs the render from scratch (documented + accepted). A resumable checkpoint is a Non-Goal (v1.1+). |
| **Imaginator fails / returns garbage** | Retry once. Then emit a **labeled placeholder card** and carry a flag to the ◆ pre-render gate. Never silently omit a planned card. |
| **Bad / empty transcript** | Caught in Phase 1 by `preflight.transcriptQC`. STOP before anchors are drafted. |
| **Disk pressure** | Caught in Phase 0.5 by `preflight.diskOk` (need ≈ source × `SCRATCH_SIZE_FACTOR`). Abort with the shortfall stated. |
| **MCP / vault down at Phase 9 write** | Write proposed principles to a skill-local flat fallback with `emergency_fallback: true` (per CLAUDE.md); migrate to vault when reachable. The build never blocks on vault *write*. The flat-fallback note MUST carry a `source_session:` stamp at creation (the down-vault path bypasses the MCP write that normally enforces the Source-Link Rule), and the later vault migration MUST convert it to a `related:` wikilink — otherwise this is exactly where a floating artifact slips in. |
| **Vault down at Phase 0.5 read-refresh** | The build DOES block when the vault MCP is configured but unreachable — `gen-principles-index.isStale` can't confirm the digest is current, and subagents must not read a stale digest. With no vault MCP in the environment at all, no-vault mode runs from the shipped digest instead — see Phase 0.5(d) in the command file. |

## Source-safety enforcement (spec §10)
- Phase 0 resolves the source to an absolute realpath; it is read-only for the whole run.
- `preflight.assertWriteSafe(sourceRealpath, target)` runs on every write target — it realpaths
  **both** sides (symlink/junction-aware) and throws if the target resolves inside the source's
  directory subtree.
- Copy-out is atomic (`safe-copy-out.js`): temp file in the destination dir → size verify → rename;
  temp is cleaned up on any rename failure. (Cross-volume: temp lives in dest so rename stays
  same-volume. A copy+fsync+verify+swap fallback for exotic DFS/junction cross-volume cases is a
  v1.1 enhancement.)

## Studio-edits contract (Task 9 spike finding)
**HyperFrames `preview` is a read-only studio** ("Start the studio for previewing compositions") — it
does NOT emit a `studio-edits.json` and does not persist drag-repositioning to any file. The
composition source of truth is `index.html`.

Therefore the **primary branch is `source: studio-json`, written by the skill** (not by the Studio):
during Phase 6 the skill captures <your-name>'s verbal nudges via AskUserQuestion into `studio-edits.json`,
then `studio-edits.applyEdits` bakes them GSAP-safe into `plan.json` + `index.html`. For a `move`, the
skill reads the element's pre-GSAP computed `left`/`top` (px) before baking
(`overlay-bake-position-via-left-top-not-translate`). The `source: html-marker-block` branch is kept
in the schema for future-proofing (if a later HyperFrames version emits one) but is dormant in v1.

### Parse-and-bake ops (`studio-edits.js`)
- `move` → `placement.mode='inline'`, `left`/`top` = computed px.
- `retime` → `data_start += delta_t`; every `gsap_beats[i] += delta_t` (`overlay-move-card-as-a-unit`).
- `swap-move` → `move_id = new_move_id`; orchestrator re-resolves `move_type` from frontmatter.
- `rewrite-copy` → `copy = new_copy`, `copy_provenance = 'distilled'` (re-run voice/ban check).
- `delete` → drop the moment. `add` → append a full moment object.

## Learning loop mechanics (spec §8)
- **Delta rule:** compare draft vs post-Studio `plan.json` field-by-field. Propose a principle only for
  a **systematic** delta — same transform on ≥ `SYSTEMATIC_DELTA_CARDS` cards or a recurring
  move-swap / copy-rewrite. Single sub-threshold nudges are logged, not proposed.
- **Delta equivalence class (what counts as "the same transform"):** key on the `affects:` axis + the
  *sign/direction* of change. Positional: same axis (e.g. `placement.horizontal`) AND same sign of
  delta (all leftward, or all toward-off-center) = one systematic delta; opposite directions on the
  same axis are NOT the same transform. Move-swap: same `from→to` move pair. Copy-rewrite: same
  field. This makes binning deterministic across runs (two operators get the same count).
- **Contradiction-detector input set:** the detector compares a proposed principle against ALL existing
  structured principles — that means **both** the vault `overlay-*` notes (from the regenerated index)
  **and** the type-file principles declared in each `playbook/types/<type>.md` frontmatter
  (`principles: [{id, affects, value}]`). Without the type-file principles in the input set, the most
  likely collisions (global-vs-type, e.g. `ad-center-hero` vs `overlay-content-area-centering`) would
  be invisible. **Axis normalization:** parse every `affects:` into a flat array of axis strings (vault
  notes carry an array; type files carry YAML-list `affects:` per principle) and compare element-wise,
  so `placement.horizontal` matches regardless of array vs bare-string surface form.
- **Abstraction altitude:** present each candidate at *instance* / *pattern (type-tag)* / *principle
  (global)*. Single-video deltas default to type-tag or a watch-list. Global promotion needs evidence
  across ≥ `GLOBAL_PROMOTION_VIDEOS` videos.
- **Contradiction detection:** key on the structured `affects:` axis (not fuzzy text). If a proposed
  principle shares an axis (e.g. `placement.horizontal`) with an existing one but asserts an opposing
  value, surface both and force resolve (supersede / scope-narrow / reject). No silent coexistence.
- **Graduation / de-namespace:** principles start `overlay-`-scoped; after a 2nd skill references one
  OR it validates across 3+ videos, propose promoting to an un-prefixed shared principle. Already-global
  concepts (Fidelity) link out rather than fork (`overlay-never-overwrite-source`).
- **Cold-start:** if the 12 vault notes are absent on first run, scaffold them idempotently from
  `playbook/global.md`; lean on Standard defaults until history accrues.
- **Precedence tiebreak:** equal-scope conflicts resolve by `approved_at` frontmatter timestamp, not
  file mtime (see `density-modes.md`).

## Scratch concurrency
Single-writer per `<project>` scratch dir is **assumed** (no lock). Legitimately deferred per
avoid-premature-complexity; stated here so a future second-writer scenario is a known gap, not a surprise.

## v1.1 backlog (deferred, evidence-gated)
- Cadence/inter-onset-interval dimension in `variety_score` (Visual Visionary #26 craft note).
- Digest tamper-detection (hash of the index file body vs its stamped hash).
- Cross-volume copy+fsync+verify+swap fallback.
- Resumable render checkpoint.
- Per-video selectable art-direction skins.
