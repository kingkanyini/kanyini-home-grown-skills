---
status: active
version: 1
move_type: quote
affects: [placement.horizontal]
hero_capable: true
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
function odFullFrameQuote(el, t) {
  const tl = gsap.timeline();
  tl.set(el, { opacity: 0 });
  tl.to(el, { opacity: 1, duration: 0.5, ease: 'power2.out' }, t);
  tl.to(el, { opacity: 0, duration: 0.5, ease: 'power1.in' }, t + HOLD);     // fade owns life (principle 3)
  return tl;
}
```

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
