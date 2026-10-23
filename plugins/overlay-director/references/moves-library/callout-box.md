---
status: active
version: 1
move_type: callout
affects: [placement.horizontal]
hero_capable: false
standards: auto
entrance_archetype: POP
entrance_mechanism: SCALE-POP
---

# Callout Box

## Purpose
Wrap a single figure (a number, a term, a short phrase) in a 1px teal rounded box so it reads as "the thing to notice." The smallest, punchiest Nate Herk payload. POPs in, holds, fades.

## Anatomy
- **Box** — 1px `CARD_TEAL` border, generous radius, transparent-to-dark interior. Contains an optional tiny label above the figure.
- **Figure** — the hero value/word. The box + figure scale `.9→1` with a POP (`back.out`) and fade together as one unit.

## When to use
- A stat, a coined term, a one-word answer that deserves a beat of its own.
- Density tier: base / promoted. One figure per box.

## CSS
```css
.od-callout { position: absolute; left: 8%; top: 40%; opacity: 0; }
.od-callout .od-inner { transform-origin: left center; }               /* transform rides inner (principle 2) */
.od-callout .od-box { display: inline-block; padding: 22px 30px; border-radius: 18px;
  border: 1px solid #4FD6C8; background: rgba(10,10,10,0.35); }         /* CARD_TEAL border */
.od-callout .od-label { font: 700 14px/1 'Inter', sans-serif; letter-spacing: .16em;
  text-transform: uppercase; color: #4FD6C8; margin-bottom: 10px; }
.od-callout .od-figure { font: 800 56px/1 'Inter', sans-serif; color: #FFF; }
```

## GSAP (helper form — absolute t)
```js
function odCalloutBox(el, t) {
  const inner = el.querySelector('.od-inner'); const tl = gsap.timeline();
  tl.set(el, { opacity: 1 });
  tl.fromTo(inner, { opacity: 0, scale: 0.9 },
               { opacity: 1, scale: 1, duration: 0.42, ease: 'back.out(1.5)' }, t);   // POP
  tl.to(inner, { opacity: 0, duration: 0.35, ease: 'power1.in' }, t + HOLD);
  return tl;
}
```

## API / Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `label` | string | — | optional tiny teal cap above the figure |
| `figure` | string | — | the hero value / word |
| `HOLD` | seconds | `holdTime(words)` | short by nature |

## Entrance
`entrance_archetype: POP` · `entrance_mechanism: SCALE-POP` (inner scale 0.9→1, `back.out(1.5)`). This is a designated POP move per the entrance standard.

## Placement default
`inline` / `content-area`. Small footprint; place near the thing it points at, clear of a right-side PIP.

## Impl
`_impl/callout-box.html` — canonical render. Re-derive + re-gate on any motion change.
