---
status: active
version: 1
move_type: draw-board
affects: [placement, density, ink-color]
hero_capable: true
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: DRAW
---

# Draw-Board (the "glass board")

## Purpose
The marquee signature device — Ali Abdaal's hand-drawn "glass board." Bright marker ink
(handwriting + shapes) floats over the LIVE footage as if the presenter is drawing on the
inside of a pane of glass between the camera and themselves. It is the identity-defining move:
one accumulating diagram that gets recalled and re-emphasized across a segment.

Three sub-modes, one grammar:
- **write-on-text** — sky-blue ALL-CAPS handwriting that pen-traces glyph-by-glyph, on a speech-synced word grid.
- **annotate-shape** — hand-drawn circle / box / yellow lasso / arrow / underline / check / circled-number.
- **diagram-recall** — a persistent multi-layer diagram; old marks never fade, new colored emphasis
  is layered on later (blue base → yellow lasso → green boxes/checks → red strike).

## When to use
- A talking-head teaching beat where the presenter is "working something out" on screen.
- Building a framework live: numbered pillars, boxes, arrows between concepts.
- Recalling/reusing the same diagram 3-4× across a segment, adding one new colored mark each recall.
- Density tiers: promoted · hero. This is never a quiet base caption — it owns attention.

## The look (pixel-verified against Ali reference frames)
- **Ink floats on full-brightness "glass"** — the default background is the live footage at 100%,
  NOT dimmed. (`dim` param adds an optional darkening plate only when the footage is too busy.)
- **Marker, not a font** — fat round-cap strokes, ALL-CAPS, uneven drifting baseline + irregular
  per-word sizing/rotation and per-letter unevenness. Rebuilt with a handwriting webfont +
  deterministic jitter, and the copy pen-traces letter-by-letter (not a per-word block wipe) so the
  handwriting reads as internally consistent with the genuinely stroked shapes.
- **Hand-drawn shapes** — lumpy authored Béziers where the path start ≠ end (slight overshoot at
  closure), a **double-stroke** (thick pass, then a thinner faster pass a beat later), and a
  **static felt-tip wobble** (`feTurbulence`+`feDisplacementMap`). Never a clean geometric primitive.
- **Additive emphasis + recall** — never redraw a mark to emphasize it; layer a NEW color on top.
  Blue is the base ink; yellow lasso / green box+check / red strike are emphasis passes.
- **Anchor 50-150ms AFTER the spoken word** — the ink is a reaction, not a prediction.

## Colors (from `constants.js` — never hardcode elsewhere)
| Role | Constant | Value |
|------|----------|-------|
| Primary ink (handwriting, base shapes) | `DRAWBOARD_INK` | `#3B9BE8` |
| Highlighter / lasso (fat, translucent) | `DRAWBOARD_HL_YELLOW` | `#F2D021` |
| Positive (boxes, underlines, checks) | `DRAWBOARD_GREEN` | `#3FBF52` |
| Negative (hatch / strike) | `DRAWBOARD_RED` | `#E24B3A` |

## CSS (essentials — full canonical CSS lives in each `_impl`)
```css
/* Overlay root is TRANSPARENT in production — the footage IS the glass.
   Impl files add an .od-footage-sim plate ONLY so the ink is visible in a standalone gate render. */
[data-composition-id^="draw-board"] .od-board {
  position: absolute; inset: 0;             /* full-frame overlay, position baked (principle 2) */
  pointer-events: none;
}
[data-composition-id^="draw-board"] .od-dim {  /* optional `dim` param */
  position: absolute; inset: 0; background: rgba(0,0,0,0.8);
  opacity: 0;                                /* GLASS default = 0; fade to reveal a darkening plate */
}
/* Handwriting: marker webfont + fallback stack, ALL-CAPS, blue ink.
   The .od-word is the jitter+spacing container; the CLIP lives on each glyph (.od-char),
   split from the word text at runtime, so the reveal is a per-LETTER pen trace, not a word wipe. */
[data-composition-id^="draw-board"] .od-ink {
  font-family: 'Permanent Marker', 'Bradley Hand', 'Segoe Print', 'Comic Sans MS', cursive;
  color: #3B9BE8;                            /* DRAWBOARD_INK */
  text-transform: uppercase;
}
[data-composition-id^="draw-board"] .od-word {
  display: inline-block;
  transform-origin: left center;             /* per-word baseline/rotation jitter rides this */
}
[data-composition-id^="draw-board"] .od-char {
  display: inline-block;
  clip-path: inset(0 100% 0 0);              /* hidden until this glyph's left-to-right stroke (seek-safe) */
  transform-origin: left center;             /* per-letter baseline/rotation jitter rides this */
}
/* Shapes: fat round-cap marker strokes. NO CSS `filter:` inside any tween (seek-safety). */
[data-composition-id^="draw-board"] .od-ink path {
  fill: none; stroke-linecap: round; stroke-linejoin: round;
}
```

## GSAP (the three seek-safe primitives)
```js
// 1. WRITE-ON — per-CHARACTER left-to-right clipPath PEN TRACE (clipPath is seek-safe; full string/frame).
//    Each word BEAT stays on the speech-synced grid (i / WPS); within a word the glyphs write out
//    back-to-back across a write window, so it reads as writing, not a word-block wipe. Ease is
//    power1.inOut (stroke accelerate-in / settle-out), NOT the old linear 'none' swipe.
//    Static jitter (deterministic hash — NO Math.random) applied ONCE via gsap.set: per-word baseline
//    drift + per-glyph unevenness. Words are split into .od-char spans at runtime.
const SLOT = 1 / DRAWBOARD_WRITE_ON_WPS, WRITE_WINDOW = SLOT * 0.86;   // 14% of the slot is the pen-lift gap
words.forEach((w, i) => {
  const j = (n) => { const x = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453; return x - Math.floor(x); };
  gsap.set(w, { y: (j(1) - 0.5) * 10, rotation: (j(2) - 0.5) * 5, scale: 0.92 + j(3) * 0.16 }); // static, per-word
  const chars = Array.from(w.textContent); w.textContent = '';
  const stagger = WRITE_WINDOW / chars.length, dur = Math.min(stagger, 0.14);
  chars.forEach((ch, c) => {
    const s = document.createElement('span'); s.className = 'od-char'; s.textContent = ch; w.appendChild(s);
    gsap.set(s, { y: (cjit(i,c,1)-0.5)*4, rotation: (cjit(i,c,2)-0.5)*4, clipPath: 'inset(0 100% 0 0)' }); // static
    tl.to(s, { clipPath: 'inset(0 0% 0 0)', duration: dur, ease: 'power1.inOut' }, i / DRAWBOARD_WRITE_ON_WPS + c * stagger);
  });
});
// Optional: per-.od-line marginLeft jitter (±4px, deterministic, static) so the left edge wanders line-to-line.

// 2. ANNOTATE-SHAPE — double-stroke svg-path-draw on a lumpy Bézier (start≠end). Wobble is a STATIC filter.
tl.to(thick, { strokeDashoffset: 0, duration: D,        ease: 'power2.out' }, cue);                        // 1st pass
tl.to(thin,  { strokeDashoffset: 0, duration: D * DRAW_SECONDARY_DUR_FACTOR, ease: 'power2.out' },
      cue + DRAW_SECONDARY_LAG_S);                                                                          // 2nd pass lags
tl.to(arrowhead, { strokeDashoffset: 0, duration: 0.14, ease: 'none' }, cue + D + 0.05);                    // head LAST

// 3. DIAGRAM-RECALL — separate SVG layer per color; each layer draws on its own cue; nothing fades.
//    (blue base drawn first, then yellow lasso, then green box+checks, then red strike — additive.)

// EXIT — fade the whole ink layer (never reverse a draw), then hard-kill. Or hold-to-cut (omit exit).
tl.to('.od-ink', { opacity: 0, duration: 0.4, ease: 'power1.in' }, END);
tl.set('.od-ink', { opacity: 0 }, END + 0.4);
```

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `mode` | write-on-text \| annotate-shape \| diagram-recall | write-on-text | selects the sub-mode |
| `copy` | string (ALL-CAPS) | — | write-on-text: the handwritten words (voice/ban-checked, uppercased at render) |
| `shape` | circle \| box \| lasso \| arrow \| underline \| check \| circled-number | circle | annotate-shape: which mark |
| `arrow_style` | straight \| curved \| dashed | straight | annotate-shape + `shape:arrow` |
| `ink` | blue \| yellow \| green \| red | blue | maps to the `DRAWBOARD_*` constants; base marks blue, emphasis colored |
| `anchor` | {x,y} % or px | — | where the mark lands (baked left/top, principle 2) |
| `recall_layers` | [{ink, shape\|copy, cue}] | — | diagram-recall: ordered additive passes, each drawn on its `cue` |
| `dim` | 0-0.8 | 0 | optional darkening plate opacity between footage and ink (GLASS default = 0) |
| `write_on_wps` | number | `DRAWBOARD_WRITE_ON_WPS` (2.2) | handwriting reveal speed (words/sec) |
| `tier` | promoted \| hero | promoted | hero = owns the frame, recall device |

## Placement default
`full-frame overlay` — the ink layer covers the frame; each mark's own `anchor` bakes its
`left`/`top`. Content is authored to clear the talking head (Ali writes to the right of himself);
the drafter should keep marks off the cam-occupied third (principle 5).

## Seek-safety (verified — this move renders by seeking a PAUSED timeline)
- Only `strokeDashoffset`, `clipPath` (full string/frame), `opacity`, and static `transform` are
  tweened. **No** CSS `filter:` / `backdrop-filter` / `stdDeviation` inside any `.to(`/`.fromTo(`.
- Felt-tip wobble = a **static** `feTurbulence`+`feDisplacementMap` SVG filter (`filter="url(#..)"`
  attribute), applied once, never tweened.
- Handwriting jitter = a **deterministic** `Math.sin` hash (per-word by index + per-glyph by
  word/char index, no `Math.random`/`Date.now`), applied once via `gsap.set` — identical on every
  forward/backward seek. The per-character reveal tweens only `clipPath` (full `inset()` string/frame)
  with a `power1.inOut` ease; still purely `clipPath`/`opacity`/static-`transform`, no filter tweens.
- Exit fades the ink layer opacity (never reverses a draw) with a trailing `tl.set({opacity:0})`
  hard-kill; diagram-recall may instead hold-to-cut (resting seek state = the complete diagram).

## Timeline duration ≠ `data-duration` (drafter must map hold from the tweens)
The paused GSAP timeline's **duration is the end of its last tween**, NOT the `data-duration`
attribute (which is only composition metadata). Progress 1.0 = the last tween's end
(~5.7s write-on / ~5.7s annotate / ~6.3s recall here), not the 7–9s `data-duration`. When the
drafter/engine seeks by progress or computes a card's read-hold, derive it from the tween schedule
(entrance draw-in + accumulation + optional exit), not from `data-duration`. For a longer on-screen
hold, extend the exit cue / add a hold beat — bumping `data-duration` alone does nothing to the ink.

## Palette conformance (all ink is `DRAWBOARD_*`)
Every **ink** color in the impls is a `DRAWBOARD_*` constant (`#3B9BE8`/`#F2D021`/`#3FBF52`/`#E24B3A`) —
no stray hex. The only non-palette colors are: (a) `.od-footage-sim` (tagged `data-preview-only="true"`)
— a standalone-gate preview backdrop that simulates live footage and is **deleted when compositing over
real footage** (production root is `background: transparent`); (b) `.od-dim` = `rgba(0,0,0,0.8)` — the
documented black `dim` param plate (opacity 0 by default = glass). A palette-membership check should
**exclude `[data-preview-only]` and `.od-dim`** — neither is a sanctioned ink color.

## Impl
- `_impl/draw-board-write-on.html` — write-on-text: letter-by-letter blue handwriting pen trace on a speech-synced word grid (id `draw-board-write-on`).
- `_impl/draw-board-annotate.html` — annotate-shape catalog: circle/box/lasso/arrow(×3)/underline/check/circled-number, all double-stroke + static wobble (id `draw-board-annotate`).
- `_impl/draw-board-recall.html` — diagram-recall: the accumulating 3-column framework, blue→yellow→green→red additive layers (id `draw-board-recall`).

### Sub-mode resolution — ONE move_type, three impl ids (registration contract)
`draw-board` is a **single `move_type`** (the Variety Engine alternates on it, standards.map resolves
it once). The `mode` param selects **which of three impls renders**:

| `mode` | impl file | `data-composition-id` |
|--------|-----------|-----------------------|
| `write-on-text` (default) | `_impl/draw-board-write-on.html` | `draw-board-write-on` |
| `annotate-shape` | `_impl/draw-board-annotate.html` | `draw-board-annotate` |
| `diagram-recall` | `_impl/draw-board-recall.html` | `draw-board-recall` |

The REGISTRATION contract (rule 1) assumes `data-composition-id == move_id` 1:1. Draw-board is the
one **1-move_type → 3-impl** case: each impl keeps a **unique** `data-composition-id` (`draw-board-{write-on|annotate|recall}`)
so `window.__timelines` keys never collide when sub-modes are composed into the same build, while the
catalog/variety layer still treats them as the single `draw-board` move_type. Compose/registry should
resolve `move_id: draw-board` + `mode` → the impl id above; it is NOT three separate moves.

Each impl is a self-contained registered composition with a UNIQUE `data-composition-id`. Re-derive +
re-gate on any motion change (Fidelity Principle).
</content>
</invoke>
