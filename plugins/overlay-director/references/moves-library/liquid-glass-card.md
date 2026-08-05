---
status: active
version: 1
move_type: card
affects: [placement.horizontal, density]
hero_capable: true
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: SCALE-POP
---

# Liquid Glass Card

## Purpose
The workhorse. A frosted glass card holding one labeled point/insight, anchored to a spoken
line and shifted off true-center to clear the talking head.

## When to use
- A point worth captioning that isn't a hero beat or a full quote.
- Tutorial steps, talking-head insights, ad value-props.
- Density tiers: base (most cards), promoted (slightly larger/longer), hero (frame-weight moment).

## CSS
```css
.od-liquid-glass-card {
  position: absolute;               /* baked left/top, NEVER translate (principle 2) */
  max-width: 34%;
  padding: 22px 26px;
  border-radius: 24px;
  background: rgba(247,240,228,0.16);          /* glass-tint */
  border: 1px solid rgba(255,255,255,0.35);    /* glass-stroke rim */
  backdrop-filter: blur(14px) saturate(120%);
  box-shadow: 6px 8px 28px rgba(20,14,9,0.28);
  color: #241B14;                               /* ink */
  font: 600 28px/1.25 'Inter', system-ui, sans-serif;
  opacity: 0;                                   /* fade tween owns visibility (principle 3) */
}
.od-liquid-glass-card .od-eyebrow {
  font-size: 15px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
  color: #B06A3B; margin-bottom: 6px;           /* clay */
}
```

## GSAP
```js
/* SMOOTH / SCALE-POP (Layer 1 motion upgrade). House ease power3.out (was power2.out).
   The inner .od-inner wrapper scale-pops 0.9->1 so the CONTAINER position stays baked (§0);
   the blur->sharp two-layer cross-fade is the seek-safe coupled "comes into focus" velocity-blur
   (see _impl — NEVER a live filter tween). Visible life = the fade (principle 3). */
function odLiquidGlassCard(el, t) { // t = data-start (s); inner = the .od-inner scale wrapper
  const tl = gsap.timeline(), inner = el.querySelector('.od-inner');
  tl.set(inner, { scale: 0.9, transformOrigin: '50% 50%' });
  tl.to(el, { opacity: 1, duration: 0.5, ease: 'power3.out' }, t);                 // entrance (lead-in)
  tl.to(inner, { scale: 1, duration: 0.5, ease: 'power3.out' }, t);                // scale-pop settle
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);           // exit owns end of life
  return tl;
}
```

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `eyebrow` | string | "" | small clay label above the headline |
| `copy` | string | — | the point (voice/ban-checked) |
| `tier` | base\|promoted\|hero | base | scales max-width / font / hold |
| `HOLD` | seconds | `holdTime(words)` | from `timing.js` (2.5–4.5s) |

## Placement default
`content-area` — shifted off true-center to the side opposite the cam (principle 5). For
untouched cards a global content-area class does the shift; hand-placed cards bake inline left/top.

## Impl
`_impl/liquid-glass-card.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
