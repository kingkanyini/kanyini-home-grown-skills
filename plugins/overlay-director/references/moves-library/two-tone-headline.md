---
status: active
version: 1
move_type: headline
affects: [placement.horizontal]
hero_capable: true
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: SCALE-POP
---

# Two-Tone Headline

## Purpose
The Nate Herk "broadcast card" skeleton. A left-anchored statement where the color swap does ~80% of the "designed" feel: a white headline with exactly ONE accent-color keyword. Three parts, three lifespans.

## Skeleton (three slots, three lifespans)
- `• KICKER` — tiny uppercase, wide-tracked, top-left. Enters first, **fades first** on exit.
- **Headline** — one or two lines, white, with ONE keyword in an accent color (`CARD_LIME` operational/active, or `CARD_TEAL` cool/secondary). The headline settles SMOOTH; the accent keyword may POP a beat behind it.
- `— annotation` — thin, low-contrast, bottom. Enters last, **fades last** on exit.

The accent keyword carries the meaning. Pick the ONE word the viewer should leave with. Never two accent words (per playbook P17).

## When to use
- A section-opening statement or claim that owns the left frame while the presenter PIP sits right.
- Density tier: promoted / hero. Keep the headline to ~2–6 words per line.

## CSS
```css
.od-two-tone { position: absolute; left: 6%; top: 30%; width: 52%; opacity: 0; }
.od-two-tone .od-inner { transform-origin: left center; }          /* transforms ride inner (principle 2) */
.od-two-tone .od-kicker {
  font: 700 15px/1 'Inter', sans-serif; letter-spacing: .22em; text-transform: uppercase;
  color: #C6F94E; margin-bottom: 22px; opacity: 0; }                /* • prefix + lime dot */
.od-two-tone .od-head {
  font: 800 76px/1.06 'Inter', sans-serif; color: #FFFFFF; letter-spacing: -.01em; opacity: 0; }
.od-two-tone .od-accent { color: #C6F94E; display: inline-block; }  /* the ONE keyword; CARD_LIME | CARD_TEAL */
.od-two-tone .od-annot {
  font: 500 22px/1.3 'Inter', sans-serif; color: rgba(255,255,255,0.55);
  margin-top: 20px; opacity: 0; }
.od-two-tone .od-scrim {                                            /* static legibility plate, NOT tweened */
  position: absolute; inset: -6% -8% -8% -8%; z-index: -1;
  background: radial-gradient(120% 120% at 0% 40%, rgba(10,10,10,0.72), rgba(10,10,10,0) 70%); }
```

## GSAP (helper form — absolute t)
```js
function odTwoToneHeadline(el, t) {
  const k = el.querySelector('.od-kicker'), h = el.querySelector('.od-head'),
        acc = el.querySelector('.od-accent'), an = el.querySelector('.od-annot');
  const tl = gsap.timeline();
  tl.set(el, { opacity: 1 });
  tl.to(k, { opacity: 1, duration: 0.3, ease: 'power2.out' }, t);                          // kicker first
  tl.fromTo(h, { opacity: 0, scale: 0.9 },
               { opacity: 1, scale: 1, duration: 0.55, ease: 'power3.out' }, t + 0.12);     // SMOOTH scale-pop
  tl.fromTo(acc, { scale: 0.8 }, { scale: 1, duration: 0.42, ease: 'back.out(1.5)' }, t + 0.32); // accent POP
  tl.to(an, { opacity: 1, duration: 0.4, ease: 'power2.out' }, t + 0.5);                    // annotation last
  // exit: kicker first, annotation last
  tl.to(k,  { opacity: 0, duration: 0.3, ease: 'power1.in' }, t + HOLD);
  tl.to(h,  { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD + 0.12);
  tl.to(an, { opacity: 0, duration: 0.4, ease: 'power1.in' }, t + HOLD + 0.24);
  return tl;
}
```

## API / Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `kicker` | string | — | tiny uppercase tag, `•`-prefixed |
| `head` | string[] | — | 1–2 lines; wrap the accent word in `.od-accent` |
| `accent` | `lime` \| `teal` | `lime` | maps to `CARD_LIME` / `CARD_TEAL` |
| `annotation` | string | — | thin bottom line |
| `HOLD` | seconds | `holdTime(words)` | read-time hold |

## Entrance
`entrance_archetype: SMOOTH` (headline settles, no bounce) · `entrance_mechanism: SCALE-POP` (inner scale 0.9→1). The accent keyword rides a short `back.out(1.5)` POP a beat behind — the only overshoot in the move.

## Placement default
`content-area` (left third/half), high enough to clear a lower-framed speaker and clear of a right-side PIP.

## Impl
`_impl/two-tone-headline.html` — canonical render. Re-derive + re-gate on any motion change.
