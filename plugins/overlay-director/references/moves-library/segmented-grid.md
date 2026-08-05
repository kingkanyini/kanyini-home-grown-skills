---
status: active
version: 1
move_type: grid
affects: [placement.horizontal]
hero_capable: false
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: FADE
---

# Segmented Grid

## Purpose
A grid of cells that light up sequentially to imply coverage or completion, paired with a hero number. The Nate Herk "97%" payload. The filling grid does the feeling; the number lands the fact.

## Anatomy
- **Grid** — a rectangular field of small cells (e.g. 10×5). Cells fill sequentially (staggered opacity) up to the coverage fraction; the rest stay dim. Filled cells use `CARD_LIME`.
- **Hero number** — a large figure (e.g. `97%`) with a tiny label, sitting beside or above the grid. It POPs in as the fill completes.

## When to use
- A completion / coverage / share stat that benefits from a "filling up" feel.
- Density tier: promoted / hero.

## Seek-safety
Cells are pre-rendered; the fill is staggered **opacity** only (each cell `0.18 → 1`), fully seek-safe. The hero number is static in the DOM and POPs its opacity in on completion (no live count-up, which goes stale on backward seek).

## CSS
```css
.od-seg { position: absolute; left: 7%; top: 30%; width: 52%; opacity: 0;
  display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 48px; }
.od-seg .od-hero { }
.od-seg .od-num { font: 800 132px/0.9 'Inter', sans-serif; color: #C6F94E; opacity: 0; }  /* CARD_LIME */
.od-seg .od-cap { font: 700 22px/1 'Inter', sans-serif; letter-spacing: .14em;
  text-transform: uppercase; color: rgba(255,255,255,0.6); margin-top: 14px; }
.od-seg .od-cells { display: grid; grid-template-columns: repeat(10, 1fr); gap: 8px; }
.od-seg .od-cell { width: 100%; aspect-ratio: 1; border-radius: 6px;
  background: rgba(255,255,255,0.08); opacity: 0.18; }
.od-seg .od-cell.on { background: #C6F94E; }
```

## GSAP (helper form — absolute t)
```js
function odSegmentedGrid(el, t) {
  const cells = el.querySelectorAll('.od-cell.on'), num = el.querySelector('.od-num');
  const tl = gsap.timeline(); tl.set(el, { opacity: 1 });
  cells.forEach((c, i) => {
    tl.to(c, { opacity: 1, duration: 0.14, ease: 'power1.out' }, t + i * 0.03);   // sequential light-up
  });
  const end = t + cells.length * 0.03 + 0.1;
  tl.fromTo(num, { opacity: 0, scale: 0.85 },
               { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)' }, end);  // hero number POP
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);
  return tl;
}
```

## API / Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `cols` / `rows` | int | `10` / `5` | grid shape |
| `fraction` | 0–1 | — | share of cells that get `.on` |
| `number` | string | — | hero figure (e.g. `97%`) |
| `caption` | string | — | tiny cap under the number |
| `HOLD` | seconds | `holdTime(words)` | — |

## Entrance
`SMOOTH` / `FADE` (cells stagger opacity, `power1.out`), hero number `back.out(1.5)` POP on completion. The staggered light-up plus the POP give two distinct easings.

## Placement default
`content-area` (left). Keep clear of a right-side PIP.

## Impl
`_impl/segmented-grid.html` — canonical render. Re-derive + re-gate on any motion change.
