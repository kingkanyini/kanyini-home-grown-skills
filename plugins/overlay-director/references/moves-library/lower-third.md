---
status: active
version: 1
move_type: lower-third
affects: [placement.vertical]
hero_capable: false
---

# Lower Third

## Purpose
Name / role / source label band, low and unobtrusive — identifies without stealing focus.

## When to use
- Introducing a speaker, citing a source, labeling on-screen context.
- Density tier: base. One at a time.

## CSS
```css
.od-lower-third {
  position: absolute;                  /* baked left/top (principle 2) */
  left: 6%; bottom: 9%;
  padding: 12px 20px;
  border-radius: 16px;
  background: rgba(20,14,9,0.55);       /* plate — legibility */
  border-left: 4px solid #B06A3B;       /* clay accent bar */
  color: #F7F0E4; opacity: 0;
}
.od-lower-third .od-name { font: 700 26px/1.1 'Inter', sans-serif; }
.od-lower-third .od-role { font: 500 17px/1.2 'Inter', sans-serif; color: #D9A05B; margin-top: 3px; }
```

## GSAP
```js
function odLowerThird(el, t) {
  const tl = gsap.timeline();
  tl.set(el, { opacity: 0, x: 0, left: '4%' });                              // animate left (px/%), not translate
  tl.to(el, { opacity: 1, left: '6%', duration: 0.4, ease: 'power2.out' }, t);
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);     // fade owns life (principle 3)
  return tl;
}
```

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `name` | string | — | primary label |
| `role` | string | "" | ochre subtitle |
| `HOLD` | seconds | `holdTime(words)` | 2.5–4.5s |

## Placement default
`inline` (lower-left) — anchored low so it never competes with the speaker's face.

## Impl
`_impl/lower-third.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
