---
status: active
version: 1
move_type: lane
affects: [placement.vertical]
hero_capable: false
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: SLIDE
---

# Slider Lane

## Purpose
One horizontal track per dimension with a knob that glides to a rest position, implying a reading on a scale (a "scan" beat). The Nate Herk QA/eval payload. Lanes stagger down; each ends with a right-aligned tag.

## Anatomy
- **Track** — a thin full-width rounded rail per dimension, with a left-aligned dimension name.
- **Knob** — a dot/handle that starts at the left (x=0) and slides via an `x` transform to its rest position (a fraction of the track), `power3.out`. A filled sub-rail follows behind it (`scaleX` on an inner fill).
- **Tag** — a short right-aligned label (the verdict) that fades in once the knob rests.

## When to use
- 2–4 scored dimensions (quality, speed, cost). Reads as a live scan/eval.
- Density tier: promoted.

## CSS
```css
.od-slider { position: absolute; left: 6%; top: 34%; width: 52%; opacity: 0; }
.od-slider .od-lane { margin: 22px 0; }
.od-slider .od-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
.od-slider .od-name { font: 700 20px/1 'Inter', sans-serif; color: rgba(255,255,255,0.8);
  text-transform: uppercase; letter-spacing: .06em; }
.od-slider .od-tag { font: 700 16px/1 'Inter', sans-serif; color: #C6F94E; opacity: 0;
  text-transform: uppercase; letter-spacing: .08em; }               /* CARD_LIME verdict */
.od-slider .od-rail { position: relative; height: 10px; border-radius: 999px;
  background: rgba(255,255,255,0.08); }
.od-slider .od-fill { position: absolute; inset: 0; border-radius: 999px; transform-origin: left center;
  transform: scaleX(0); background: rgba(79,214,200,0.5); }         /* CARD_TEAL fill trail */
.od-slider .od-knob { position: absolute; top: 50%; left: 0; width: 26px; height: 26px;
  margin: -13px 0 0 -13px; border-radius: 50%; background: #C6F94E; }
```

## GSAP (helper form — absolute t)
```js
function odSliderLane(el, t) {
  const lanes = el.querySelectorAll('.od-lane'); const tl = gsap.timeline();
  tl.set(el, { opacity: 1 });
  lanes.forEach((ln, i) => {
    const rail = ln.querySelector('.od-rail'), knob = ln.querySelector('.od-knob'),
          fill = ln.querySelector('.od-fill'), tag = ln.querySelector('.od-tag');
    const frac = parseFloat(knob.dataset.frac), px = rail.clientWidth * frac, at = t + i * 0.16;
    tl.fromTo(knob, { x: 0 }, { x: px, duration: 0.55, ease: 'power3.out' }, at);      // glide
    tl.to(fill, { scaleX: frac, duration: 0.55, ease: 'power3.out' }, at);             // trail follows
    tl.to(tag, { opacity: 1, duration: 0.25, ease: 'power2.out' }, at + 0.5);          // verdict on rest
  });
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);
  return tl;
}
```

## API / Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `lanes` | `{name,frac,tag}[]` | — | `frac` = knob rest position 0–1; `tag` = verdict |
| `stagger` | seconds | `0.16` | per-lane offset |
| `HOLD` | seconds | `holdTime(words)` | — |

## Entrance
`SMOOTH` / `SLIDE` (knob `x` transform `power3.out`), fill trail `power3.out`, verdict tag `power2.out` fade. Knobs never bounce — a slider that overshoots reads broken.

## Placement default
`content-area` (left). Keep clear of a right-side PIP.

## Impl
`_impl/slider-lane.html` — canonical render. Re-derive + re-gate on any motion change.
