---
id: animation
axis: animation
applies_to: [all]
checks:
  - { id: min-easings, rule: "≥ MIN_DISTINCT_EASINGS (3) distinct GSAP ease FAMILIES across referenced impls (families, not strings — back.out(1.2)/(1.4) are one family)", machine: true, severity: hard }
  - { id: seek-safety-runtime, rule: "seek-probe.js backward-seek probe: forward and backward seeks to the same progress yield identical rendered state on every animated target", machine: true, severity: hard, verified_by: seek-probe.js }
  - { id: seek-safety-static, rule: "static pre-filter: no banned tween targets (filter:, backdrop-filter, stdDeviation, feDisplacementMap, feTurbulence/baseFrequency, transition:filter, SMIL <animate> on filter primitives) inside a .to(/.fromTo( — a HINT, the runtime probe is authoritative", machine: true, severity: advisory }
  - { id: bounce-heavy, rule: "> 60% of NON-POP eases in a bounce family (back/bounce/elastic) reads as bounce-abuse; POP moves exempt", machine: true, severity: advisory }
  - { id: default-ease, rule: "entrance settle uses power3.out/expo.out unless the archetype is POP (back.out)", machine: false, severity: advisory }
  - { id: transforms-on-inner, rule: "scale/x/y/rotation ride an inner .od-inner wrapper; container position stays baked in left/top", machine: false, severity: advisory }
confidence: high
---

# Animation Standard — the easing law

Easing is tone of voice. The single highest lever against "generic" output.

## Easing law
- **Default entrance settle: `power3.out`** (long-tail, no overshoot) or `expo.out`. NOT `power2.out`,
  NOT `back.out` as a default (bounce = "#1 instant turn-off").
- `.out` = entrances · `.in` = exits · `.inOut` = symmetric/continuous · `sine.inOut` = ambient/idle ·
  `back.out(1.2–1.7)` = playful accents ONLY · `none`/`steps` = mechanical (draw, typing, counters).
- **≥ `MIN_DISTINCT_EASINGS` (3) distinct easing FAMILIES per build** — a build using fewer reads
  monotone. This is the `min-easings` machine check, counted on FAMILIES via `ease-extract.js`
  (`back.out(1.2)` and `back.out(1.4)` are one `back` family, not two) so it catches the exact monotony
  it exists to flag. `standards-check.js` and `variety-score.js` share that one extractor.

## POP precedence (L0-7)
The no-bounce default below governs the DEFAULT settle. It does NOT override a move whose
`entrance_archetype` is **POP** — that move's `back.out(1.2–1.7)` is sanctioned and is exempt from the
`bounce-heavy` advisory. See `entrance.md` §POP precedence. Specialist beats generalist.

## Seek-safety (CONTRACT §0 — hard law)
The skill renders by SEEKING a paused timeline frame-by-frame, forward AND backward. Therefore:
- **Tweenable:** `opacity`, `transform` (`scale`/`x`/`y`/`rotation`/`skew`), `clipPath` (full string per
  frame), SVG `strokeDashoffset`, `fill`/`stroke`/`color`, CSS custom props feeding the above.
- **BANNED to tween:** CSS `filter` (incl. blur), `backdrop-filter`, `box-shadow` geometry, SVG
  `feGaussianBlur stdDeviation`, `feDisplacementMap` scale, `feTurbulence`/`baseFrequency`, CSS
  `transition:` on filter, and SMIL `<animate>` on filter primitives. These go stale on backward seek.
- **Two checks, one law (L0-3):** the `seek-safety-static` scan (looks for the banned targets above
  inside a `.to(`/`.fromTo(`) is a fast pre-filter and is **advisory only** — it can miss custom-prop
  indirection and can't see runtime state. The **`seek-safety-runtime` probe (`seek-probe.js`) is the
  HARD gate**: it seeks each paused timeline to progress [0,.25,.5,.75,1] forward AND backward and
  diffs the computed style of every animated target; any forward≠backward mismatch fails the build. A
  green static scan never launders seek-safety — `standards-check.js` lists the animation axis under
  `manual_review` so `ok:true` doesn't imply the runtime probe ran.
- **Blur / velocity-blur → seek-safe recipes ONLY:** (a) two-layer opacity crossfade (a constant-blur
  layer + a constant-sharp layer, crossfade opacity); OR (b) N opacity-decaying transform ghost echoes
  (`BLUR_GHOST_COUNT`, `BLUR_GHOST_STEP_PX`). NEVER a live blur tween.
- Every opacity-exit ends with a trailing hard-kill: `tl.set(target, {opacity:0}, exitEnd)`.

## Coupled velocity-blur
On any moving entrance, couple the blur to the move on the **same window + ease** — reads as speed that
snaps sharp. Implemented seek-safely (ghost-echo or 2-layer crossfade), never a `filter` tween.

## No dead-air handoff
The transition IS the exit. Overlap consecutive cards (`TRANSITION_OVERLAP_S`) so one card's departure
and the next's arrival share a beat. Never fade a card to nothing into a gap before the next fades in
from nothing. See `timing.md` (`dead-air` check) and the `transition_in` enum.

## Transforms on inner wrapper
Position is baked in `left`/`top`/`bottom` on the CONTAINER (principle 2). Transforms ride an inner
`.od-inner` wrapper so container position stays baked. Already how `center-hero` and `comic-zoom-pan`
work; every upgrade obeys it.
