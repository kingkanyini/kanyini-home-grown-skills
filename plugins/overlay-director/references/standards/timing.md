---
id: timing
axis: timing
applies_to: [all]
checks:
  - { id: dead-air, rule: "adjacent cards (by t_start) with a positive time gap AND no transition_in handoff flagged read as dead air", machine: true, severity: advisory }
  - { id: lead-in, rule: "a card enters LEAD_IN_S (~0.4s) before its anchor word", machine: false, severity: advisory }
  - { id: read-hold, rule: "hold = clamp(words / WORDS_PER_SECOND_READ, MIN_HOLD_S, MAX_HOLD_S)", machine: false, severity: advisory }
  - { id: clean-exit, rule: "a card's fade clears before the next card's entrance unless an overlap handoff is declared", machine: false, severity: advisory }
  - { id: collision-free, rule: "no more than MAX_CONCURRENT_CARDS (2) cards live at once", machine: false, severity: advisory }
confidence: high
---

# Timing Standard — lead-in, hold, exit, handoff

A card's timing has four parts, all enforced (`overlay-card-timing-discipline`):

1. **Lead-in** — the card enters `LEAD_IN_S` (~0.4s) before its anchor word lands, so it arrives just
   ahead of the spoken line, never on a grid divorced from speech.
2. **Read-hold** — `hold = clamp(words / WORDS_PER_SECOND_READ, MIN_HOLD_S, MAX_HOLD_S)` = clamp(words
   / 2.5, 2.5s, 4.5s). Longer copy splits into sequential cards rather than dwelling past the ceiling.
3. **Clean exit** — the card's fade clears before the next card's entrance, ends on a trailing
   hard-kill (`opacity:0`), UNLESS the two cards declare an overlap handoff.
4. **Collision-freedom** — no more than `MAX_CONCURRENT_CARDS` (2) cards live at once.

## Dead-air handoff (machine — advisory)
The transition IS the exit. When two adjacent cards (sorted by `t_start`) leave a positive time gap
between the first's end and the second's start AND the second declares no `transition_in` handoff (or
`hard-cut`), that gap reads as dead air — the banned "jump cut with a dip" (`overlay-vary-move-types-for-rhythm`).

The `dead-air` check surfaces these pairs as **advisories** (not build-blocking): a positive gap can be
legitimate spacing in an MVP-density plan (~1 card / 25–40s, `overlay-mvp-density-first`), so counsel
(Phase 7) judges whether a given gap wants an overlap handoff. Overlap consecutive cards by
`TRANSITION_OVERLAP_S` when the intent is a handoff, or declare a `transition_in`
(`crossfade|blur-crossfade|zoom-through|scale-swap|card-morph`).
