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
- Copy-out is atomic (`safe-copy-out.js`): temp file in the destination dir → size verify → rename.
  The destination argument must be a **full file path** (`…\folder\final.mp4`) — passing a folder
  makes the rename target the directory itself and fails with EPERM;
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

## Standards gate mechanics (Phase 3.6 + Phase 5 — Layer 0)
- **Map is GENERATED (L0-1):** `reference/standards/standards.map.json` is generated from moves-library
  `move_type:` frontmatter by `node reference/scripts/gen-standards-map.js --write` — keys are real
  move_type FAMILIES, never move_ids, so the key-space can't drift from the library. CI/pre-flight:
  `gen-standards-map.js --check` (nonzero on drift). A new move_type with no `AXIS_POLICY` entry is a
  HARD generation error — you must decide its governing axes before the map regenerates.
- **Resolver of record (L0-5):** `standards-check.js` RE-DERIVES each card's standards from the
  move-file `standards:` frontmatter (`auto` → `by_move_type[type]`) + the map. The plan's stamped
  `moment.standards[]` is informational; a mismatch is a `stamp-drift` advisory. Unknown `move_type`
  fails LOUD as a HARD `map-coverage` violation — never a silent fallback to `defaults` (L0-2).
- **Run:** `node reference/scripts/standards-check.js <plan.json>
  [--standards-dir …] [--impl-dir …] [--moves-dir …]` → `{ ok, violations[], advisories[],
  manual_review[], meta }`. `ok === no HARD violations`. Exit taxonomy: **0** clean · **1** hard
  violation · **2** checker error (bad plan / IO). Every finding carries `severity: hard|advisory`.
- **HARD machine checks:** `min-easings` (≥ `MIN_DISTINCT_EASINGS` distinct ease FAMILIES via the shared
  `ease-extract.js`) · `entrance-valid` (valid POP|SMOOTH + mechanism incl. GROW-X/GROW-Y) ·
  `palette-member` (color-axis impl hexes ∈ `color.md`) · `caption-length` (≤
  `floor(WORDS_PER_SECOND_READ×MAX_HOLD_S)` = 11) · `map-coverage` (every active move_type is a map key).
- **ADVISORY checks:** `seek-safety` static pre-filter (expanded banned list; the runtime probe is
  authoritative — see below) · `dead-air` (positive gap + no `transition_in`; legit in MVP density) ·
  `bounce-heavy` (> 60% non-POP eases in a bounce family; **POP moves exempt** — the archetype ease
  wins, L0-7) · `stamp-drift` · `impl-missing` · `move-file-missing`.
- **`manual_review` (L0-4):** the report lists axes an `ok:true` did NOT machine-verify — `layout` (no
  machine check) and `animation` seek-safety (verified by the runtime probe, not the static scan) — so
  a green result never launders an unchecked axis.
- **Runtime seek-safety gate (Phase 5, L0-3):** `node reference/scripts/seek-probe.js <impl.html …>` is
  the AUTHORITATIVE seek-safety check. It loads each impl in the gate's headless Chromium, seeks every
  paused timeline to progress [0,.25,.5,.75,1] forward AND backward, and diffs the computed style of
  every animated target; any forward≠backward mismatch fails (exit 1). The static scan only hints.
- **Placement:** the static check runs AFTER the Phase 3.5 gut-check, BEFORE ◆ Plan approval (surfaces
  violations before build cost); the runtime probe runs at Phase 5 (post-lint). Carry the report on
  `plan.standards_report` so Phase 7 counsel reads it (standards are the floor; counsel judges the ceiling).
- **Index + vault (Phase 9, L0-9/L0-10):** `node reference/scripts/gen-standards-index.js >
  reference/STANDARDS-INDEX.md` regenerates the digest (deterministic sort-by-id + staleness hash
  `STANDARDS_INDEX_HASH_LEN`; `--check` for CI drift). The local `STANDARDS-INDEX.md` is the source of
  truth (always written). The vault is a MIRROR: upsert-by-id (no dupes) each changed standard as a note
  carrying a populated `related:` session wikilink (CLAUDE.md knowledge-artifact rule); when vault MCP is
  down, write the flat fallback with `emergency_fallback: true` and migrate when MCP returns.

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
