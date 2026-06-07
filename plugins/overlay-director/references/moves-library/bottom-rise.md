---
status: active
version: 1
move_type: riser
affects: [placement.vertical]
hero_capable: false
---

# Bottom Rise

## Purpose
A callout that rises from the lower edge for a beat of emphasis, then settles.

## When to use
- A punchline, a stat, a "here's the thing made concrete" moment that wants motion.
- Density tiers: base, promoted.

## CSS
```css
.od-bottom-rise {
  position: absolute;                  /* baked left/top (principle 2) */
  left: 8%; bottom: 12%;
  max-width: 40%;
  padding: 18px 24px;
  border-radius: 22px;
  background: rgba(247,240,228,0.16);
  border: 1px solid rgba(255,255,255,0.35);
  border-left: 5px solid #B06A3B;       /* clay accent bar — visually distinct from liquid-glass-card so the
                                           variety engine's card/riser alternation reads as real variety */
  backdrop-filter: blur(12px);
  box-shadow: 4px 6px 22px rgba(20,14,9,0.26);
  color: #241B14; font: 600 26px/1.25 'Inter', sans-serif;
  opacity: 0;
}
```

## GSAP
```js
function odBottomRise(el, t) {
  const tl = gsap.timeline();
  tl.set(el, { opacity: 0, bottom: '8%' });                                  // animate bottom (%), not translateY
  tl.to(el, { opacity: 1, bottom: '12%', duration: 0.5, ease: 'back.out(2.5)' }, t); // overshoot strong enough to clear the gate overshoot floor
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);     // fade owns life (principle 3)
  return tl;
}
```

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `copy` | string | — | the callout (voice/ban-checked) |
| `tier` | base\|promoted | base | promoted scales size + hold |
| `HOLD` | seconds | `holdTime(words)` | 2.5–4.5s |

## Placement default
`content-area` (bottom-left) — rises within the lower safe margin, opposite the cam.

## Impl
`_impl/bottom-rise.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
