---
status: active
version: 1
move_type: pill
affects: [placement.vertical]
hero_capable: false
---

# Top Pill

## Purpose
A short tag / chapter marker / status token, parked at the top edge. With the
`tether` param, becomes a **speech-bubble callout** — a rounded aside tethered to
an on-screen spot (folded here per VV#26 2026-06-01: "a tethered bubble is a pill
with a tail," not a new move).

## When to use
- Section/chapter labels, a short status ("Step 2"), a topic tag.
- **Tethered aside** (`tether:{x,y}`): a gentle reframe/reassurance bubble pointing
  at a spot — re-skinned from Abdaal's comedic peach bubble to <your-name>'s calm
  voice: warm cream bubble, sage outline, gouache tail; use for an aside ("breathe
  here"), NOT a punchline. If it can only work as a gag, don't use it [Collin].
- Density tier: base. Short copy only (1–4 words).

## CSS
```css
.od-top-pill {
  position: absolute;                  /* centered via auto-margins, NOT translate (principle 2) */
  top: 7%; left: 0; right: 0; margin: 0 auto; width: max-content;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(247,240,228,0.18);
  border: 1px solid rgba(255,255,255,0.35);
  backdrop-filter: blur(10px);
  color: #241B14; font: 700 18px/1 'Inter', sans-serif;
  letter-spacing: .04em; opacity: 0;
}
```

## GSAP
```js
function odTopPill(el, t) {
  const tl = gsap.timeline();
  tl.set(el, { opacity: 0, top: '5%' });
  tl.to(el, { opacity: 1, top: '7%', duration: 0.35, ease: 'power2.out' }, t);
  tl.to(el, { opacity: 0, duration: 0.35, ease: 'power1.in' }, t + HOLD);    // fade owns life (principle 3)
  return tl;
}
```

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `copy` | string | — | 1–4 words |
| `tether` | {x,y} | — | callout mode: baked anchor the tail points to — **vision-derived from `watch` frames, but TIGHT (small-button targets): punt to human-fallback sooner than spotlight** (see playbook "Geometry gate"). Bake the tail INTO the bubble element so one `tl.set opacity:0` hard-kills the whole thing [Hogg]. Opaque fill + 4.5:1 text, never enter the reserved bottom-18% caption lane [Brown] |
| `HOLD` | seconds | `holdTime(words)` | clamps to 2.5s for short copy. Callout mode = TRIGGER layer, cap ~3s [Marsh] |

## Placement default
`content-area` (top-center) — sits in the upper safe margin, clear of the subject.
In callout mode, baked near the `tether` spot (still clear of the bottom-18% lane).

## Impl
`_impl/top-pill.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
