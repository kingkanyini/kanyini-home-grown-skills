---
status: active
version: 1
move_type: pipeline
affects: [placement.horizontal]
hero_capable: false
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: GROW-X
---

# Pipeline Build

## Purpose
N stage boxes reveal left→right to show a sequence or a parallel fan-out. Each box carries a colored top-border that draws in; a status pill POPs in at the end to "seal" the run. The Nate Herk orchestration payload.

## Anatomy
- **Stage boxes** — a horizontal row of N boxes (stage index + label). Each has a 3px colored **top-border** (`CARD_LIME` active, `CARD_TEAL` pending). Boxes fade + scale-pop in, staggered L→R; the top-border draws via `scaleX` on an inner strip.
- **Status pill** — a small pill with a `•` dot + label (e.g. `COORDINATING`). POPs in last with `back.out` — the only overshoot.

## When to use
- Steps in a process, or agents/stages in a parallel run. 3–5 boxes reads best.
- Density tier: promoted.

## CSS
```css
.od-pipeline { position: absolute; left: 6%; top: 40%; width: 62%; opacity: 0; }
.od-pipeline .od-stages { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 14px; }
.od-pipeline .od-stage { position: relative; padding: 20px 18px; border-radius: 10px;
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.10); opacity: 0; }
.od-pipeline .od-topbar { position: absolute; left: 0; top: 0; height: 3px; width: 100%;
  transform-origin: left center; transform: scaleX(0); background: #C6F94E; }  /* CARD_LIME */
.od-pipeline .od-stage.pending .od-topbar { background: #4FD6C8; }             /* CARD_TEAL */
.od-pipeline .od-idx { font: 700 13px/1 'Inter', sans-serif; letter-spacing: .12em;
  color: rgba(255,255,255,0.45); text-transform: uppercase; }
.od-pipeline .od-label { font: 700 22px/1.1 'Inter', sans-serif; color: #FFF; margin-top: 8px; }
.od-pipeline .od-pill { display: inline-flex; align-items: center; gap: 8px; margin-top: 22px;
  padding: 8px 16px; border-radius: 999px; border: 1px solid #C6F94E;
  font: 700 15px/1 'Inter', sans-serif; letter-spacing: .1em; color: #C6F94E;
  text-transform: uppercase; opacity: 0; }
.od-pipeline .od-pill .od-dot { width: 8px; height: 8px; border-radius: 50%; background: #C6F94E; }
```

## GSAP (helper form — absolute t)
```js
function odPipelineBuild(el, t) {
  const stages = el.querySelectorAll('.od-stage'), pill = el.querySelector('.od-pill');
  const tl = gsap.timeline(); tl.set(el, { opacity: 1 });
  stages.forEach((s, i) => {
    const at = t + i * 0.14, top = s.querySelector('.od-topbar');
    tl.fromTo(s, { opacity: 0, scale: 0.92 },
                 { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' }, at);   // box scale-pop
    tl.to(top, { scaleX: 1, duration: 0.35, ease: 'power2.out' }, at + 0.1);         // top-border draw
  });
  const end = t + stages.length * 0.14 + 0.2;
  tl.fromTo(pill, { opacity: 0, scale: 0.8 },
               { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.6)' }, end);  // status pill POP
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);
  return tl;
}
```

## API / Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `stages` | `{idx,label,state}[]` | — | `state` = `active`\|`pending` → lime/teal top-border |
| `status` | string | — | status pill label (e.g. `COORDINATING`) |
| `stagger` | seconds | `0.14` | per-box offset |
| `HOLD` | seconds | `holdTime(words)` | — |

## Entrance
`SMOOTH` / `GROW-X` — the declared mechanism is the colored top-border filling via `scaleX` (`transform-origin: left`). Each box also fades + scale-pops `power3.out` as it lands; the status pill POPs `back.out(1.6)` at the end. Distinct easing families across the move.

## Placement default
`content-area` (left/lower). Wide row; keep clear of a right-side PIP.

## Impl
`_impl/pipeline-build.html` — canonical render. Re-derive + re-gate on any motion change.
