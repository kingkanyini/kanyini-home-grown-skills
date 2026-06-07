---
status: active
version: 1
move_type: accent
affects: []
hero_capable: false
---

# Bouncing Arrows

## Purpose
A brief attention accent — an arrow (or pair) bouncing toward on-screen action. Seasoning, not a meal.

## When to use
- Pointing at a button, a detail, a spot the speaker references ("click here", "look at this").
- Density tier: base. Must never be the only move in a 90s window (see `_index.md`).

## CSS
```css
.od-bouncing-arrows {
  position: absolute;                  /* baked left/top (principle 2) */
  width: 64px; height: 64px;
  color: #B06A3B;                       /* clay */
  filter: drop-shadow(2px 3px 6px rgba(20,14,9,0.4));
  opacity: 0;
}
.od-bouncing-arrows svg { width: 100%; height: 100%; }
```

## GSAP
```js
/* The bounce is a looped sub-tween; the card's visible life is still the opacity fade (principle 3). */
function odBouncingArrows(el, t) {
  const tl = gsap.timeline();
  tl.set(el, { opacity: 0 });
  tl.to(el, { opacity: 1, duration: 0.3, ease: 'power2.out' }, t);
  tl.to(el, { y: -14, duration: 0.5, ease: 'sine.inOut', yoyo: true, repeat: Math.max(1, Math.floor(HOLD / 0.5)) }, t); // bounce within hold (Math.floor per seek-safety contract, never round/ceil)
  tl.to(el, { opacity: 0, duration: 0.3, ease: 'power1.in' }, t + HOLD);     // fade owns life
  return tl;
}
```

> Note: the bounce uses `y` (a transient animation offset), but the card's BASE position is
> still baked via `left`/`top` (principle 2) — `y` returns to 0 via yoyo, so it never fights the bake.

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `direction` | down\|up\|left\|right | down | arrow orientation |
| `HOLD` | seconds | `holdTime(0)` → 2.5s | accent is brief |

## Placement default
`inline` — placed adjacent to the thing it points at; bakes left/top from that target.

## Impl
`_impl/bouncing-arrows.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
