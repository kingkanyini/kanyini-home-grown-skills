---
status: active
version: 1
move_type: quote
affects: [placement.horizontal]
hero_capable: true
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: CLIP-REVEAL
---

# Full Frame Quote

## Purpose
A verbatim quote that deserves the whole frame — copy_provenance is always `verbatim`.
With the `kicker` param, this move also serves as a **chapter divider** (a full-frame
"Part 1 / <title>" section card — folded here per VV#26 2026-06-01 rather than a
separate `chapter-divider` move, since full-frame-quote already owns the frame + big type).

## When to use
- A line worth quoting exactly (the speaker's own words, a cited source).
- **Chapter divider** (`kicker:"Part 1"` + `title`): a ~2s breath between major
  tutorial sections. Re-skin to <your-name>: gouache-texture cream bg, sentence-case
  title ("Part 1 · clearing the inbox"), not bold all-caps slab [Collin].
- Density tiers: promoted, hero.

## CSS
```css
.od-full-frame-quote {
  position: absolute; inset: 0;        /* full frame; stays centered (principle 5) */
  display: grid; place-items: center;
  padding: 10%;
  background: rgba(20,14,9,0.5);        /* darken footage so the quote reads */
  color: #F7F0E4; text-align: center;
  font: 700 44px/1.3 'Inter', system-ui, sans-serif;
  opacity: 0;
}
.od-full-frame-quote .od-mark { color: #D9A05B; font-size: 1.4em; }  /* ochre quote marks */
.od-full-frame-quote .od-attrib { font: 500 22px/1.2 'Inter', sans-serif; color: #D9A05B; margin-top: 18px; }
```

## GSAP
```js
/* SMOOTH / CLIP-REVEAL (Layer 1 motion upgrade) — the highest-gap move gets a signature entrance.
   The dark plate keeps its seek-safe opacity arc (gate: opacityArc), while the inner text is wiped
   in left-to-right via a per-frame clipPath STRING set through a proxy onUpdate (§0: clipPath set as
   a full string each frame, NEVER a filter tween), plus a gentle scale settle. House power3.out. */
function odFullFrameQuote(el, t) {
  const tl = gsap.timeline(), inner = el.querySelector('.od-inner'), wipe = { p: 100 };
  const setClip = () => { inner.style.clipPath = `inset(0% ${wipe.p}% 0% 0%)`; }; setClip(); // seed frame 0
  tl.set(el, { opacity: 0 }).set(inner, { scale: 0.97, transformOrigin: '50% 50%' });
  tl.to(el, { opacity: 1, duration: 0.5, ease: 'power3.out' }, t);
  tl.to(inner, { scale: 1, duration: 0.6, ease: 'power3.out' }, t + 0.05);
  tl.to(wipe, { p: 0, duration: 1.0, ease: 'power3.out', onUpdate: setClip }, t + 0.05); // left->right reveal, dur = CLIP_REVEAL_DUR
  tl.to(el, { opacity: 0, duration: 0.5, ease: 'power1.in' }, t + HOLD);     // fade owns life (principle 3)
  return tl;
}
```
> Impl uses `CLIP_REVEAL_DUR` (1.0s) from `constants.js` — impls carry the literal (standalone HTML
> can't `require`), the constant is the source of record (v2 hardening G1).

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `copy` | string | — | the verbatim quote (or the section title in divider mode) |
| `attrib` | string | "" | attribution line (ochre) |
| `kicker` | string | "" | divider mode: small "Part N" pill above the title — solid app-brand fill + white text, never cream-on-cream [Brown] |
| `icon` | path | "" | divider mode: optional app-icon badge above the kicker |
| `HOLD` | seconds | `holdTime(words)` | quotes often hit the 4.5s ceiling — split if longer. Divider: 0.3s in / 1.4s hold / 0.3s out, hold flexes ±0.5s to the real section pause [Marsh]. Suppress any karaoke track during the divider [Brown] |

## Placement default
`frame-center` — full-frame element stays centered (clip otherwise, principle 5). Never shift off-center.

## Impl
`_impl/full-frame-quote.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
