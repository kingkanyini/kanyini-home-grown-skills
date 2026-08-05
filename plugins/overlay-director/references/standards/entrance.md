---
id: entrance
axis: entrance
applies_to: [card, hero, quote, lower-third, pill, riser, image, split, stack, accent, draw-board, headline, chart, pipeline, callout, lane, grid, timeline, pip]
checks:
  - { id: entrance-valid, rule: "every card that carries the entrance axis declares a valid entrance_archetype (POP|SMOOTH) AND entrance_mechanism (FADE|ZOOM-IN|SCALE-POP|RISE|SLIDE|DRAW|BLUR-STREAK|CLIP-REVEAL|GROW-X|GROW-Y)", machine: true, severity: hard }
  - { id: archetype-mechanism-fit, rule: "POP overshoot only via back.out(1.2–1.7); SMOOTH never overshoots (power3.out/expo.out)", machine: false, severity: advisory }
  - { id: pop-precedence, rule: "the entrance_archetype ease WINS — a POP move's back.out is sanctioned and is NOT a no-bounce / min-easings / bounce-heavy violation", machine: false, severity: advisory }
  - { id: mechanism-default-fit, rule: "mechanism is the move-type default unless density/brand justifies an override", machine: false, severity: advisory }
confidence: high
---

# Entrance Standard — POP vs SMOOTH

Every entrance declares **two axes**: the FEEL (archetype) and the MOVE (mechanism). Ease is
resolved by applying the archetype's ease to the mechanism. <your-name>'s language: "MTV pop-up on some,
smooth-in on others."

## Archetype table (the FEEL) — CONTRACT §1

| Archetype | Ease | Duration | Overshoot | Use for |
|-----------|------|----------|-----------|---------|
| **POP** (energetic / "MTV") | `back.out(1.4)` (keep ≤ `back.out(1.7)`, `ENTRANCE_POP_EASE`) | 0.35–0.5s (`ENTRANCE_POP_DUR`) | slight | accents, `callout-box`, badges, `top-pill`, `bouncing-arrows`, circled-numbers, pipeline status pills, `bar-fill` arrival, two-tone accent keyword |
| **SMOOTH** (calm / premium) | `power3.out` (or `expo.out`, `ENTRANCE_SMOOTH_EASE`) | 0.4–0.7s (`ENTRANCE_SMOOTH_DUR`) | none | headlines, `full-frame-quote`, `center-hero`, `liquid-glass-card` (base), `image-card`, `lower-third`, draw-board text, `karaoke-caption`, `reading-spotlight` |

Density/brand override: Cinematic mode biases SMOOTH; a playful brand biases POP. Stored per-move as
`entrance_archetype` (default-by-type, overridable).

## Mechanism table (the MOVE — all seek-safe) — CONTRACT §1

| Mechanism | What moves (seek-safe) | Tag |
|-----------|------------------------|-----|
| **FADE** | `opacity` only | legacy |
| **ZOOM-IN** | inner `scale` up from ~0.94 | legacy: center-hero |
| **SCALE-POP** | inner `scale` 0.9→1 (SMOOTH, `SCALE_POP_FROM_SMOOTH`) / 0.8→1 (POP, `SCALE_POP_FROM_POP`) + opacity | new (house entrance) |
| **RISE** | container `bottom`/`top` %, or inner `y` | legacy: bottom-rise |
| **SLIDE** | inner `x`/`y` | — |
| **DRAW** | SVG `strokeDashoffset: len→0` | new |
| **BLUR-STREAK** | seek-safe ghost-echo (`BLUR_GHOST_COUNT`/`BLUR_GHOST_STEP_PX`) or 2-layer constant-blur crossfade — NEVER a live blur tween | new |
| **CLIP-REVEAL** | `clipPath` inset/circle, set as a full string per frame | new |
| **GROW-X** | inner `scaleX` 0→1 from a fixed edge (directional fill) — bar-fill, pipeline top-border | new |
| **GROW-Y** | inner `scaleY` 0→1 from a fixed edge (directional fill) — date-timeline connector | new |

All mechanisms obey the SEEK-SAFETY LAW (CONTRACT §0): transforms ride an inner `.od-inner` wrapper;
container position stays baked in `left`/`top`/`bottom`. See `animation.md` for the banned-tween list.
GROW-X/GROW-Y use `transform: scaleX/scaleY` on the inner wrapper with `transform-origin` at the fill's
anchor edge — seek-safe (transform only), never a width/height tween.

## POP precedence (L0-7 — the archetype ease wins)
When a move's `entrance_archetype` is **POP**, its `back.out(1.2–1.7)` overshoot is the *sanctioned*
settle for that move. It is NOT a no-bounce violation, and its `back` family does NOT count against the
`bounce-heavy` advisory (POP moves are exempted from that share). The "bounce is a turn-off" rule in
`animation.md` governs the DEFAULT settle on SMOOTH moves; it never overrides a move that has
deliberately chosen POP. Specialist (this move's archetype) beats generalist (the global no-bounce lean).

## RISE reconcile (legacy exception — coordinated with Layer 1)
§1 RISE = inner `y` for NEW moves. Legacy `bottom-rise` keeps its gate-forced `bottom` overshoot as a
DOCUMENTED exception (the frozen objective motion gate + §9 legacy guarantee are the tie-breaker). No
behavior change to `bottom-rise`; see its move doc.

## Per-move-type default mapping (spec Part 6 + Part 4B)

| move_type / move_id | Default archetype | Default mechanism | Note |
|---------------------|-------------------|-------------------|------|
| `liquid-glass-card` (card) | SMOOTH | SCALE-POP | + coupled velocity-blur; hero tier adds glow-bloom |
| `center-hero` (hero) | SMOOTH | ZOOM-IN | glow-bloom power-on; SCALE-POP alt |
| `comic-zoom-pan` (hero) | SMOOTH | ZOOM-IN | camera push between quadrants |
| `full-frame-quote` (quote) | SMOOTH | CLIP-REVEAL | or per-word kinetic type-in; draw the quote marks |
| `lower-third` | SMOOTH | DRAW | draw the accent bar + small inner pop |
| `top-pill` (pill) | POP | SCALE-POP | spring-pop; tether drawn via DRAW |
| `bottom-rise` (riser) | SMOOTH | RISE | + BLUR-STREAK on the rise; `power3.out` (was `back.out(2.5)`) |
| `image-card` (image) | SMOOTH | SCALE-POP | or CLIP-REVEAL iris; sine Ken-Burns idle |
| `split-card` (split) | SMOOTH | SLIDE | mirrored book-open |
| `sandwich-stack` (stack) | SMOOTH | SCALE-POP | per-item, staggered; POP for playful brands |
| `bouncing-arrows` (accent) | POP | SCALE-POP | seasoning only |
| `draw-board` text | SMOOTH | DRAW | handwritten write-on, word-by-word |
| `two-tone-headline` | SMOOTH | SCALE-POP | headline SMOOTH; accent keyword POP |
| `bar-fill` | POP | SCALE-POP | POP on value arrival |
| `pipeline-build` | POP | SLIDE | left-to-right build; POP status pills |
| `callout-box` | POP | SCALE-POP | teal-outlined box, scale .9→1 |
| `slider-lane` | SMOOTH | SLIDE | QA scan beats |
| `segmented-grid` | SMOOTH | SCALE-POP | cell loader + hero number |
| `date-timeline` | SMOOTH | DRAW | draw the connector; nodes RISE down it |

`reading-spotlight` and `karaoke-caption` carry no discrete entrance archetype (held illumination /
persistent baseline track) — they are intentionally NOT in the entrance-axis map.
