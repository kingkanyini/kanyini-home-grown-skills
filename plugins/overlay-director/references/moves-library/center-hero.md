---
status: active
version: 1
move_type: hero
affects: [placement.horizontal, density.hero]
hero_capable: true
---

# Center Hero

## Purpose
A promoted signature beat that owns the frame for a moment — the visual exclamation point.

## When to use
- The single most important line in a section; a reveal; a payoff.
- Density tier: hero only. Use sparingly (avoid ≥3 consecutive heroes).

## CSS
```css
.od-center-hero {
  position: absolute; inset: 0;        /* full-frame container -> true centering, NO translate (principle 2) */
  display: grid; place-items: center;
  text-align: center;
  color: #F7F0E4;                       /* cream on darkened frame */
  opacity: 0;
}
.od-center-hero .od-line {
  width: 64%;
  font: 800 56px/1.1 'Inter', system-ui, sans-serif;
  text-shadow: 0 2px 18px rgba(20,14,9,0.6);
}
.od-center-hero::before {              /* gentle vignette so text reads over any footage */
  content: ''; position: absolute; inset: -40% -20%;
  background: radial-gradient(ellipse at center, rgba(20,14,9,0.45), transparent 70%);
  z-index: -1;
}
```

## GSAP
```js
function odCenterHero(el, t) {
  const line = el.querySelector('.od-line');
  const tl = gsap.timeline();
  tl.set(el, { opacity: 0 }).set(line, { scale: 0.94 });                    // scale the inner line, not the full-frame container
  tl.to(el, { opacity: 1, duration: 0.5, ease: 'power3.out' }, t)
    .to(line, { scale: 1, duration: 0.5, ease: 'power3.out' }, t);
  tl.to(el, { opacity: 0, duration: 0.5, ease: 'power1.in' }, t + HOLD);    // fade owns visible life (principle 3)
  return tl;
}
```

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `copy` | string | — | the hero line (short — split long copy) |
| `HOLD` | seconds | `holdTime(words)` | 2.5–4.5s |

## Placement default
`frame-center` — wide element stays centered (clip otherwise, principle 5). Do not shift off-center.

## Impl
`_impl/center-hero.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
