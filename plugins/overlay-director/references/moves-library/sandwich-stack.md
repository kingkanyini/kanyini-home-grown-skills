---
status: active
version: 1
move_type: stack
affects: [density]
hero_capable: false
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: SCALE-POP
---

# Sandwich Stack

## Purpose
A sequential reveal of stacked items — a short list or steps that build one line at a time.

## When to use
- 2–4 list items / steps that accumulate as the speaker enumerates them.
- Density tier: promoted. Each item is short.

## CSS
```css
.od-sandwich-stack {
  position: absolute;                  /* baked left/top (principle 2) */
  left: 8%; top: 22%; width: 38%;
  display: flex; flex-direction: column; gap: 12px;
  opacity: 1;
}
.od-sandwich-stack .od-item {
  padding: 14px 20px; border-radius: 18px;
  background: rgba(247,240,228,0.16); border: 1px solid rgba(255,255,255,0.35);
  backdrop-filter: blur(12px); color: #241B14;
  font: 600 24px/1.2 'Inter', sans-serif; opacity: 0;
}
.od-sandwich-stack .od-item .od-num { color: #B06A3B; font-weight: 800; margin-right: 10px; } /* clay */
```

## GSAP
```js
/* SMOOTH / SCALE-POP (Layer 1 motion upgrade). Each item scale-pops into place (0.9->1) as it fades,
   on the house power3.out (was a power2.out left-crawl). Items still reveal on their spoken-enumeration
   beats (gate: staggerReveal). The WHOLE stack's visible life ends with the group fade. */
function odSandwichStack(el, t, beats) { // beats = [t1, t2, ...] one per item, relative offsets added by caller
  const items = [...el.querySelectorAll('.od-item')];
  const tl = gsap.timeline();
  items.forEach((it, i) => {
    tl.set(it, { opacity: 0, scale: 0.9, transformOrigin: '0% 50%' });
    tl.to(it, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }, beats[i]);
  });
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);     // group fade owns life (principle 3)
  return tl;
}
```

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `items` | string[] | — | 2–4 short items |
| `beats` | seconds[] | — | reveal time per item (anchored to spoken enumeration) |
| `HOLD` | seconds | `holdTime(totalWords)` | held until last item read |

## Placement default
`content-area` (upper-left) — column stays opposite the cam; reveal is top-down.

## Impl
`_impl/sandwich-stack.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
