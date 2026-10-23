---
status: active
version: 1
move_type: timeline
affects: [placement.vertical]
hero_capable: false
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: GROW-Y
---

# Date Timeline

## Purpose
A short vertical timeline: dated nodes fade down a connector that draws itself top→bottom. The Nate Herk "Preview → GA" payload. The drawing connector is the anchor; the nodes ride it.

## Anatomy
- **Connector** — a thin vertical line. It grows via `scaleY: 0→1` with `transform-origin: top` (GROW-Y, seek-safe, no reflow). This is the entrance anchor.
- **Nodes** — 2–4 dated entries (date cap + label). Each is a dot on the line plus text; they fade + drop in (`y` transform) as the line passes their position, staggered.
- **Resolution pill** — an optional closing pill at the bottom (e.g. `AVAILABLE BROADLY`) that POPs after the last node.

## When to use
- A sequence of dated milestones (2–4). A launch arc, a rollout, a roadmap beat.
- Density tier: promoted.

## CSS
```css
.od-timeline { position: absolute; left: 7%; top: 26%; width: 44%; opacity: 0; }
.od-timeline .od-head { font: 800 60px/1.02 'Inter', sans-serif; color: #FFF; margin-bottom: 34px; }
.od-timeline .od-track { position: relative; padding-left: 40px; }
.od-timeline .od-connector { position: absolute; left: 7px; top: 6px; bottom: 44px; width: 3px;
  transform-origin: top center; transform: scaleY(0); background: #4FD6C8; }   /* CARD_TEAL connector */
.od-timeline .od-node { position: relative; margin-bottom: 34px; opacity: 0; }
.od-timeline .od-dot { position: absolute; left: -40px; top: 4px; width: 16px; height: 16px;
  border-radius: 50%; background: #4FD6C8; box-shadow: 0 0 0 4px rgba(79,214,200,0.18); }
.od-timeline .od-date { font: 800 26px/1 'Inter', sans-serif; color: #C6F94E;
  letter-spacing: .04em; }                                                     /* CARD_LIME date */
.od-timeline .od-label { font: 600 20px/1.2 'Inter', sans-serif; color: rgba(255,255,255,0.6);
  text-transform: uppercase; letter-spacing: .1em; margin-top: 6px; }
.od-timeline .od-pill { display: inline-flex; align-items: center; gap: 8px; margin-left: 40px;
  padding: 10px 18px; border-radius: 999px; border: 1px solid rgba(198,249,78,0.5);
  font: 700 16px/1 'Inter', sans-serif; letter-spacing: .1em; text-transform: uppercase;
  color: #C6F94E; opacity: 0; }
```

## GSAP (helper form — absolute t)
```js
function odDateTimeline(el, t) {
  const conn = el.querySelector('.od-connector'), nodes = el.querySelectorAll('.od-node'),
        pill = el.querySelector('.od-pill'); const tl = gsap.timeline();
  tl.set(el, { opacity: 1 });
  tl.fromTo(conn, { scaleY: 0 }, { scaleY: 1, duration: 0.5, ease: 'power2.out' }, t);     // connector draws
  nodes.forEach((n, i) => {
    tl.fromTo(n, { opacity: 0, y: -12 },
                 { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, t + 0.15 + i * 0.2); // node drops
  });
  const end = t + 0.15 + nodes.length * 0.2 + 0.1;
  tl.fromTo(pill, { opacity: 0, scale: 0.85 },
               { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)' }, end);       // resolution POP
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);
  return tl;
}
```

## API / Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `head` | string | — | the arc headline (e.g. `Preview to GA`) |
| `nodes` | `{date,label}[]` | — | 2–4 dated milestones |
| `resolution` | string | — | optional closing pill label |
| `HOLD` | seconds | `holdTime(words)` | — |

## Entrance
`SMOOTH` / `GROW-Y` — the connector grows top→bottom via `scaleY` (`transform-origin: top`, `power2.out`); nodes `power3.out` drop; resolution pill `back.out(1.5)` POP. Three distinct easing families. (GROW-Y is the directional-scale sibling of the SVG `DRAW` mechanism — a line growing, not a stroke-dashoffset draw.)

## Placement default
`content-area` (left). Narrow column; keep clear of a right-side PIP.

## Impl
`_impl/date-timeline.html` — canonical render. Re-derive + re-gate on any motion change.
