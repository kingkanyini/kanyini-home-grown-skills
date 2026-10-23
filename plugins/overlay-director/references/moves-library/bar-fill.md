---
status: active
version: 1
move_type: chart
affects: [placement.vertical]
hero_capable: false
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: GROW-X
---

# Bar Fill

## Purpose
Horizontal bars that grow left→right to compare a few values. The Nate Herk "numbers moved" payload. A counter snaps to its final value at the bar tip the instant the bar arrives.

## The seek-safe rule (why scaleX, not width)
Bars grow via **`scaleX` on an inner bar element with `transform-origin: left`** — NOT a `width` tween. A width tween triggers layout reflow every frame and reads mushy; a `scaleX` transform is GPU-clean and seek-safe (deterministic on backward seek during duration probing). Each track holds a full-width inner bar pre-sized to its value's fraction of the track, then `scaleX` runs 0→1.

## The counter snap (seek-safe)
The final number sits at the bar tip, pre-rendered in the DOM at `opacity: 0`. It does not count up (a live text tween goes stale on backward seek). It **POPs to full opacity at the exact frame the bar finishes** — visually it "snaps to the tip on arrival." Count-up is a future option only if driven from tween progress.

## When to use
- 2–5 values worth a quick magnitude compare. Keep labels short.
- Density tier: promoted.

## CSS
```css
.od-bar-fill { position: absolute; left: 6%; top: 34%; width: 50%; opacity: 0; }
.od-bar-fill .od-row { display: grid; grid-template-columns: 150px 1fr; align-items: center;
  gap: 18px; margin: 14px 0; }
.od-bar-fill .od-name { font: 700 20px/1 'Inter', sans-serif; color: rgba(255,255,255,0.75);
  text-transform: uppercase; letter-spacing: .06em; }
.od-bar-fill .od-track { position: relative; height: 34px; border-radius: 8px;
  background: rgba(255,255,255,0.07); }
.od-bar-fill .od-bar { position: absolute; inset: 0; border-radius: 8px;
  transform-origin: left center; transform: scaleX(0); background: #C6F94E; }  /* CARD_LIME */
.od-bar-fill .od-bar.teal { background: #4FD6C8; }                              /* CARD_TEAL */
.od-bar-fill .od-count { position: absolute; top: 50%; transform: translateY(-50%);
  font: 800 20px/1 'Inter', sans-serif; color: #0A0A0A; padding-right: 10px; right: 0; opacity: 0; }
```
Each `.od-bar` is set to its value fraction via an inline `--frac` that scopes the resting scaleX target; the tween runs `scaleX: var(--frac)`.

## GSAP (helper form — absolute t)
```js
function odBarFill(el, t) {
  const rows = el.querySelectorAll('.od-row'); const tl = gsap.timeline();
  tl.set(el, { opacity: 1 });
  rows.forEach((row, i) => {
    const bar = row.querySelector('.od-bar'), count = row.querySelector('.od-count');
    const frac = parseFloat(bar.dataset.frac), at = t + i * 0.12;                    // stagger
    tl.to(bar, { scaleX: frac, duration: 0.45, ease: 'power3.out' }, at);            // fill, ease-out
    tl.to(count, { opacity: 1, duration: 0.18, ease: 'back.out(1.6)' }, at + 0.45);  // snap at tip
  });
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);
  return tl;
}
```

## API / Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `rows` | `{name,value,frac,color}[]` | — | `frac` = value/max, 0–1; `color` = `lime`\|`teal` |
| `stagger` | seconds | `0.12` | per-row offset |
| `HOLD` | seconds | `holdTime(words)` | — |

## Entrance
`SMOOTH` / `GROW-X` — the declared mechanism is the directional `scaleX` fill (`transform-origin: left`, no width tween). Each bar fills `power3.out` (ease-out) staggered `0.12s`; each counter POPs `back.out(1.6)` at its bar tip. Three distinct easing families inside one move.

## Placement default
`content-area` (left). Keep bars clear of a right-side PIP.

## Impl
`_impl/bar-fill.html` — canonical render. Re-derive + re-gate on any motion change.
