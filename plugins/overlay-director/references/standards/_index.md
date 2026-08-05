# Standards — Catalog

The Standards Backbone (Layer 0). Every feature/move, when drafted and built, is routed through the
standards that apply to its `move_type`, validated by `standards-check.js`, and surfaced to counsel.
Standards are the **floor** (machine-checkable conformance); counsel judges the **ceiling**.

- Each axis file (`<axis>.md`) carries frontmatter: `id`, `axis`, `applies_to`, `checks` (each check
  flagged `machine: true|false` + `severity: hard|advisory`), `confidence`.
- Resolution (one resolver of record, L0-5): `standards-check.js` RE-DERIVES a move's standards from
  the move-file `standards:` frontmatter (explicit list or `auto`) + `standards.map.json`. A plan's
  stamped `standards[]` is informational — a mismatch is a `stamp-drift` advisory. An unmapped
  `move_type` is a HARD `map-coverage` violation, never a silent fallback (L0-2).
- Severity + `ok` (L0-4): `ok === no HARD violations`. The report also carries `manual_review` for axes
  `ok:true` did NOT machine-verify (layout has no machine check; seek-safety is verified by the runtime
  probe `seek-probe.js`, not the static scan) so a green result never launders an unchecked axis.
- The build stamps each card with its resolved `standards[]` + `entrance_archetype` at Phase 3; the
  **Phase 3.6 Standards gate** runs the machine checks before build cost; **Phase 5** runs the runtime
  `seek-probe.js`; Phase 7 counsel reads the report; Phase 9 regenerates `STANDARDS-INDEX.md` + upserts
  into the vault.

## Catalog

| Standard | Governs | Applies to | Machine checks (severity) |
|----------|---------|------------|----------------|
| **<your-related-note>** | easing law (≥3 distinct ease FAMILIES, `power3.out` default), seek-safety, coupled velocity-blur, no dead-air handoff, transforms-on-inner-wrapper | `all` | `min-easings` (hard), `seek-safety-runtime` (hard, via `seek-probe.js`), `seek-safety-static` (advisory), `bounce-heavy` (advisory) |
| **<your-related-note>** | POP vs SMOOTH archetypes (the FEEL) + FADE/ZOOM-IN/SCALE-POP/RISE/SLIDE/DRAW/BLUR-STREAK/CLIP-REVEAL/GROW-X/GROW-Y mechanisms (the MOVE) + per-move-type defaults + POP precedence | card, hero, quote, lower-third, pill, riser, image, split, stack, accent, draw-board, headline, chart, pipeline, callout, lane, grid, timeline, pip | `entrance-valid` (hard) |
| **<your-related-note>** | allowed palette (warm glass tokens + draw-board inks + CARD lime/teal/amber), two-tone one-accent, legibility plate, semantic trio | all visual moves | `palette-member` (hard) |
| **<your-related-note>** | <your-name> voice + AI-isms ban, caption word cap (`floor(WPS×MAX_HOLD)`=11), verbatim-vs-distilled, draw-board ALL-CAPS | all copy-bearing moves | `caption-length` (hard) |
| **<your-related-note>** | lead-in (`LEAD_IN_S`), read-hold clamp, clean exit + hard-kill, collision-free, dead-air handoff | `all` | `dead-air` (advisory) |
| **<your-related-note>** | content-area centering, placement defaults, PIP presets (top-right-box / left-third-hero / over-screenrec) | all placed moves | — (manual_review) |

Plan-independent: `map-coverage` (hard) asserts every ACTIVE library `move_type` is a map key.

## Machine map (GENERATED)
`standards.map.json` is GENERATED from moves-library `move_type:` frontmatter by
`gen-standards-map.js` (`--write` to regenerate, `--check` for CI drift) so the key-space can never
drift from the library. `defaults` = `[animation, timing, writing]`; `by_move_type` maps each family to
its axis list (values from the L0-owned `AXIS_POLICY`). Consumed by `resolveStandards()`.

## Searchable — standard → axis id
`animation` · `entrance` · `color` · `writing` · `timing` · `layout`
