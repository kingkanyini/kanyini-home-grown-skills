---
status: active
version: 1
move_type: image
affects: [placement.horizontal, density]
hero_capable: true
---

# Image Card

## Purpose
An illustration/concept card carrying generated art (inherits `art-direction.md`). Includes a
`doctor` variant (warm practitioner character) for health/coaching content.

## When to use
- A concept that lands better shown than told; a metaphor; a character beat.
- Density tiers: base, promoted, hero.

## CSS
```css
.od-image-card {
  position: absolute;                  /* baked left/top (principle 2) */
  width: 36%;
  border-radius: 24px; overflow: hidden;
  box-shadow: 6px 8px 28px rgba(20,14,9,0.3);
  opacity: 0;
}
.od-image-card img { display: block; width: 100%; }
/* MANDATORY dark blur caption plate for mobile legibility (principle 6) */
.od-image-card .od-caption {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 14px 18px;
  background: rgba(20,14,9,0.55);                 /* plate */
  backdrop-filter: blur(8px);
  color: #F7F0E4; font: 600 20px/1.25 'Inter', sans-serif;
}
```

## GSAP
```js
function odImageCard(el, t) {
  const tl = gsap.timeline();
  tl.set(el, { opacity: 0, left: (el.dataset.left) });                       // baked left/top, not translate
  tl.to(el, { opacity: 1, duration: 0.45, ease: 'power2.out' }, t);
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);     // fade owns life (principle 3)
  return tl;
}
```

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `src` | path | — | generated art (Phase 4); inherits art-direction suffix |
| `caption` | string | "" | rendered on the dark blur plate (NOT baked into the image) |
| `variant` | base\|doctor | base | `doctor` = warm practitioner character |
| `size` | base\|sticker | base | `sticker` = small branded **tool-tag** (logo + name) when a tool is named — folded here per VV#26 2026-06-01 ("image-card, but small"). Wrap the vendor logo in a cream/gold rounded chip with sage label so the mark sits inside <your-name>'s frame, not as foreign vendor chrome [Collin]. Default placement `top-right` when a karaoke track is present, to clear the bottom lane [Brown]. Auto-dismiss the prior sticker when a new tool is named — never stack [Marsh] |
| `asset_ref` | string | "" | sticker mode: which app logo to resolve at the art step [Hogg] |
| `HOLD` | seconds | `holdTime(words)` | 2.5–4.5s; sticker floor ~2s |

## Placement default
`content-area` — weighted to the side opposite the cam. Caption plate is non-negotiable (principle 6).

## Impl
`_impl/image-card.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
