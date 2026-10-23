---
status: active
version: 1
move_type: hero
affects: [placement.horizontal, density.hero]
hero_capable: true
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: ZOOM-IN
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
/* SMOOTH / ZOOM-IN (Layer 1 motion upgrade). Deeper scale-pop (0.9->1, was 0.94) on power3.out,
   plus an ambient glow-bloom "power-on": the .od-bloom halo fades in on the settle (peak <= 0.45)
   then a bounded sine breathe (finite yoyo, opacity only = seek-safe). Scale the inner line, never
   the full-frame container (§0). */
function odCenterHero(el, t) {
  const line = el.querySelector('.od-line'), bloom = el.querySelector('.od-bloom');
  const tl = gsap.timeline();
  tl.set(el, { opacity: 0 }).set(line, { scale: 0.9 }).set(bloom, { opacity: 0 });
  tl.to(el, { opacity: 1, duration: 0.5, ease: 'power3.out' }, t)
    .to(line, { scale: 1, duration: 0.5, ease: 'power3.out' }, t);
  tl.to(bloom, { opacity: 0.45, duration: 0.5, ease: 'power3.out' }, t)                   // power-on peak = GLOW_BLOOM_PEAK
    .to(bloom, { opacity: 0.30, duration: 1.0, ease: 'sine.inOut', yoyo: true, repeat: 1 }, t + 0.6); // breathe
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
