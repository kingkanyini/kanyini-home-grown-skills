---
status: active
version: 1
move_type: spotlight
affects: [sequence.layering, sequence.variety, placement.horizontal]
hero_capable: false
requires: [layer-field, needs-studio-input]
---

# Reading Spotlight

## Purpose
A held **illumination** box that lights ONE region of an on-screen document (a
Claude response, a code block, a list) while the surround dims to warm sepia.
Points by light, not by arrow. Walks down the doc one block at a time, in sync
with narration. Reverse-engineered from Ali Abdaal's Claude Code guide (a
sanctioned reference — Abdaal is the educational-scripting anchor in YouTube
Creator Counsel #57). Re-skinned to <your-name>'s warm/calm aesthetic.

> **Crown-jewel move** (Visual Visionary #26, 2026-06-01): the only one in the
> batch that introduces a genuinely new visual grammar — *selective dimming*.
> `bouncing-arrows` says "look here" for a click; reading-spotlight says "read
> THIS passage" for a held block.

## When to use
- A screen-share where the speaker reads/explains a long static block and you
  want the viewer's eye on the exact paragraph being discussed.
- The held alternative to `bouncing-arrows` (arrows = transient click pointer;
  spotlight = held passage reader).
- **TOPIC LAYER** (see tutorial playbook → Two-Layer Overlay): holds for the
  full block's spoken span, exempt from the `max_concurrent=1` trigger-layer trim.
- Density tiers: base · promoted.

## Counsel-locked build rules (VV#26 2026-06-01)
1. **Cross-fade discrete cards, never tween the dim.** Each doc block = a NEW
   spotlight card (opacity 0→1), the prior card hard-killed to `opacity:0`. The
   `box-shadow` spread is a **static constant per card** — tweening the spread is
   scrub-unsafe (headless Chrome can paint stale shadow geometry on a backward
   seek). [Hogg]
2. **Scale the active region, don't just dim around it.** Dimming the surround
   without enlarging the subject makes already-tiny source text the brightest
   *unreadable* thing on screen. If the lit block < ~22% of frame height, scale
   the captured region so its text clears ~28px-equivalent at 9:16. [Brown]
3. **Warm dim, feathered gold edge** — sepia/charcoal surround at low opacity,
   never pure black; spotlight edge feathered gold, not hard white. [Collin]
4. **Region coords are authored, not transcript-derived** — see `needs_studio_input`.

## CSS
```css
.od-reading-spotlight {
  position: absolute;                  /* baked left/top (principle 2) */
  border-radius: 14px;
  box-shadow: 0 0 0 9999px rgba(38,27,20,0.52);  /* STATIC warm-sepia dim-surround (rule 1) */
  outline: 2px solid rgba(217,160,91,0.55);       /* feathered gold edge (rule 3) */
  opacity: 0;
}
```

## GSAP
```js
/* Discrete card per block. HOLD = the block's spoken span (topic-layer). */
function odReadingSpotlight(el, t) {
  const tl = gsap.timeline();
  tl.set(el, { opacity: 0, left: el.dataset.left, top: el.dataset.top });   // baked, not translate
  tl.to(el, { opacity: 1, duration: 0.4, ease: 'power2.out' }, t);          // box brightens, surround dims
  tl.to(el, { opacity: 0, duration: 0.35, ease: 'power1.in' }, t + HOLD);   // fade owns life (principle 3)
  tl.set(el, { opacity: 0 }, t + HOLD + 0.36);                              // hard-kill, seek-safe (rule 1)
  return tl;
}
```
> Moving to the next block = a NEW spotlight card at the next region
> (move-as-a-unit, principle 9), not a tween of this one — keeps each block's
> hold independently seek-safe.

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `region` | {left,top,w,h} | — | doc block to illuminate (baked px) — **vision-derived from `watch` frames; human-fallback only if low-confidence** |
| `dim` | 0–1 | 0.52 | warm-sepia surround opacity (rule 3) |
| `min_active_height_pct` | number | 22 | below this, scale the region up (rule 2) |
| `layer` | topic\|trigger | topic | held; exempt from trigger-layer trim |
| `holdMode` | topic-span\|fixed | topic-span | life = (next-block anchor − this anchor), per Marsh |
| `HOLD` | seconds | block's spoken span | topic-layer hold, not holdTime(words) |

## Placement default
`screen-region` — baked to the on-screen block. Pairs with the PIP-corner layout
variant (see tutorial playbook). **`region` is vision-derived from `watch` source
frames (derive → inspect-verify → human-fallback loop, see playbook "Geometry
gate"). Spotlight regions are forgiving — low bar to auto-accept. Render refuses
any moment still flagged `needs_studio_input` after the fallback.**

## Impl
`_impl/reading-spotlight.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
