---
id: layout
axis: layout
applies_to: [card, hero, lower-third, pill, riser, image, split, stack, spotlight, draw-board, headline, chart, pipeline, callout, lane, grid, timeline, pip]
checks:
  - { id: content-area-centering, rule: "cards shift off true-center to clear the talking head; wide/full-frame moves stay frame-centered", machine: false, severity: advisory }
  - { id: pip-preset-valid, rule: "a PIP reframe targets a named preset (top-right-box | left-third-hero | over-screenrec)", machine: false, severity: advisory }
  - { id: placement-default, rule: "each move honors its placement default (content-area | frame-center | inline)", machine: false, severity: advisory }
confidence: medium
note: "layout has NO machine check — standards-check.js lists layout-bearing moves under manual_review so ok:true never implies layout was verified (L0-4)"
---

# Layout Standard — placement, centering, PIP

## Content-area centering
Shift cards off true-center to clear the talking head / cam (`overlay-content-area-centering`).
Untouched cards inherit the shift from a global content-area class; hand-placed cards bake an inline
`left`/`top`. **Exception:** wide / full-frame elements (`full-frame-quote`, `center-hero`,
`comic-zoom-pan`) stay frame-centered — shifting them clips content.

## Placement defaults (per move)
| Placement mode | Moves |
|----------------|-------|
| `content-area` (off-center) | `liquid-glass-card`, `image-card`, `split-card`, `sandwich-stack`, `top-pill` (top), `bottom-rise` (bottom), card-system payloads |
| `frame-center` | `center-hero`, `full-frame-quote`, `comic-zoom-pan` |
| `inline` | `lower-third` (lower), `bouncing-arrows` |
| `screen-region` | `reading-spotlight` |

## PIP presets (connective reframe)
The webcam PIP container animates between named presets as connective tissue between scenes; the hard
cut to black happens *during* the reposition (Nate Herk grammar):
- **`top-right-box`** — small boxed cam, top-right.
- **`left-third-hero`** — cam occupies the left third, content right.
- **`over-screenrec`** — small cam floating over a screen recording.
