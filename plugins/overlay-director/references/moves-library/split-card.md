---
status: active
version: 1
move_type: split
affects: [placement.horizontal]
hero_capable: false
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: SCALE-POP
---

# Split Card

## Purpose
A two-up compare: this-vs-that, before/after, problem/solution — side by side.

## When to use
- Any A/B contrast worth showing in one frame.
- Density tier: promoted. Keep each side to a few words.

## CSS
```css
.od-split-card {
  position: absolute;                  /* left baked so a 70%-wide box is centered, NOT translate (principle 2) */
  left: 15%; top: 26%; width: 70%;     /* (100-70)/2 = 15% -> true horizontal center, clears 7% margin */
  display: grid; grid-template-columns: 1fr 1fr; gap: 18px;
  opacity: 0;
}
.od-split-card .od-side {
  padding: 20px 22px; border-radius: 20px;
  background: rgba(247,240,228,0.16); border: 1px solid rgba(255,255,255,0.35);
  backdrop-filter: blur(12px); color: #241B14;
  font: 600 24px/1.25 'Inter', sans-serif;
}
.od-split-card .od-side.b { border-color: #B06A3B; }   /* clay accent on the "after"/"solution" side */
.od-split-card .od-label { font-size: 14px; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: #7C8B6F; margin-bottom: 8px; }  /* sage */
```

## GSAP
```js
/* SMOOTH / SCALE-POP (Layer 1 motion upgrade). Each side scale-pops (0.9->1) as it fades, on the
   house power3.out (was power2.out). The staggered A-then-B reveal (0.25s lag) is preserved so the
   compare still reads left-first (gate: crossoverLag). */
function odSplitCard(el, t) {
  const a = el.querySelector('.od-a'), b = el.querySelector('.od-b');
  const tl = gsap.timeline();
  tl.set(el, { opacity: 1 }).set([a, b], { opacity: 0, scale: 0.9, transformOrigin: '50% 50%' });
  tl.to(a, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }, t);
  tl.to(b, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }, t + 0.25);   // staggered reveal (lag)
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);     // fade owns life (principle 3)
  return tl;
}
```

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `labelA` / `copyA` | string | — | left side (e.g. "Before") |
| `labelB` / `copyB` | string | — | right side (e.g. "After", clay accent) |
| `HOLD` | seconds | `holdTime(totalWords)` | both sides counted |

## Placement default
`content-area` — wide two-up, kept high enough to clear a lower-framed speaker.

## Impl
`_impl/split-card.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
