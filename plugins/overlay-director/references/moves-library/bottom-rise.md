---
status: active
version: 1
move_type: riser
affects: [placement.vertical]
hero_capable: false
standards: auto
entrance_archetype: POP
entrance_mechanism: RISE
---

# Bottom Rise

## Purpose
A callout that rises from the lower edge for a beat of emphasis, then settles.

## When to use
- A punchline, a stat, a "here's the thing made concrete" moment that wants motion.
- Density tiers: base, promoted.

## CSS
```css
.od-bottom-rise {
  position: absolute;                  /* baked left/top (principle 2) */
  left: 8%; bottom: 12%;
  max-width: 40%;
  padding: 18px 24px;
  border-radius: 22px;
  background: rgba(247,240,228,0.16);
  border: 1px solid rgba(255,255,255,0.35);
  border-left: 5px solid #B06A3B;       /* clay accent bar — visually distinct from liquid-glass-card so the
                                           variety engine's card/riser alternation reads as real variety */
  backdrop-filter: blur(12px);
  box-shadow: 4px 6px 22px rgba(20,14,9,0.26);
  color: #241B14; font: 600 26px/1.25 'Inter', sans-serif;
  opacity: 0;
}
```

## GSAP
```js
/* POP / RISE (Layer 1 motion upgrade). Container keeps the seek-safe bottom rise (8%->12%, baked
   bottom — NOT translateY) on back.out(2.5), which also clears the gate's overshoot floor. The rise
   now carries a coupled velocity-blur: 3 opacity-decaying ghost copies trail BELOW the lead and
   collapse into it on the SAME window+ease (§0 recipe b — never a live filter/blur tween). */
function odBottomRise(el, t) {
  const tl = gsap.timeline(), STEP = 14 /* BLUR_GHOST_STEP_PX */;
  tl.set(el, { opacity: 0, bottom: '8%' });
  [1, 2, 3].forEach(i => tl.fromTo(el.querySelector(`.od-ghost[data-i="${i}"]`),
    { y: i * STEP, opacity: 0.36 / i }, { y: 0, opacity: 0, duration: 0.5, ease: 'back.out(2.5)' }, t));
  tl.to(el, { opacity: 1, bottom: '12%', duration: 0.5, ease: 'back.out(2.5)' }, t); // overshoot clears the gate floor
  tl.to(el, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD);     // fade owns life (principle 3)
  return tl;
}
```
> **RISE mechanism — documented legacy exception (v2 hardening L1-3, ARCHITECT).**
> CONTRACT §1 defines `RISE` as an inner-`y` transform (baked container, transform on the inner wrapper)
> for all NEW moves. `bottom-rise` is the ONE legacy exception: it rises via the container's baked
> `bottom` (%) with a `back.out(2.5)` overshoot, because the FROZEN objective gate (`_impl/gate`,
> `overshoot` assertion) requires a real overshoot on `bottom` — a no-overshoot `power3.out` (or an
> inner-`y` rise that doesn't move `bottom`) would FAIL the gate. Per CONTRACT §0/§9 the frozen gate +
> legacy guarantee are the tie-breaker, so the `bottom` overshoot is retained with NO behavior change.
> The seek-safe velocity-blur ghost-echo is what modernizes the rise instead. (The matching `entrance.md`
> RISE-row exception note is Layer 0's.)

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `copy` | string | — | the callout (voice/ban-checked) |
| `tier` | base\|promoted | base | promoted scales size + hold |
| `HOLD` | seconds | `holdTime(words)` | 2.5–4.5s |

## Placement default
`content-area` (bottom-left) — rises within the lower safe margin, opposite the cam.

## Impl
`_impl/bottom-rise.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
