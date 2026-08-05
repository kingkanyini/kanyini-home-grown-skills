---
status: active
version: 1
move_type: pip
affects: [placement.horizontal, placement.vertical]
hero_capable: false
standards: auto
entrance_archetype: SMOOTH
entrance_mechanism: SLIDE
---

# PIP Reframe

## Purpose
The connective tissue of the Nate Herk broadcast system. Between scenes, the presenter "picture-in-picture" glides between named presets so the frame keeps rearranging around the cards instead of cutting flat. This is not a card that enters and exits — the PIP persists; the reframe is a repositioning.

## What this actually is (no camera op)
There is no second camera and no physical webcam element being moved. The "PIP" is a **HyperFrames compositing illusion**: a layer that shows a **zoomed/cropped view of the source footage** (the presenter is already in the footage), inset into the frame and composited to read as a picture-in-picture. Reframing = re-transforming that footage-crop layer within the frame. It is fully overlay/composition-doable at author time — pan/scale the footage layer, no re-shoot, no camera move. Everything below animates that composited crop, not a camera.

## Named presets
| Preset | Container (left / top / width) | Reads as |
|--------|--------------------------------|----------|
| `top-right-box` | `72% / 6% / 22%` | small talking-head, cards own the frame |
| `left-third-hero` | `5% / 30% / 30%` | presenter steps forward, cards go supporting |
| `over-screenrec` | `75% / 62% / 20%` | tucked corner over a screen recording |

Presets are the placement vocabulary; author more per brand as needed. Keep the PIP aspect ratio constant across presets (only position + size change).

## The seek-safe reframe pattern (the important part)
Container position stays **baked at the DESTINATION preset** (`left`/`top`/`width` in %) — principle 2 forbids translating the container. The glide rides an **inner wrapper** (`.od-pip-inner`, `transform-origin: top left`):

1. Compute the source→destination delta in px: `dx = srcLeftPx - destLeftPx`, `dy = srcTopPx - destTopPx`, `scale = srcWidthPx / destWidthPx`.
2. Set the inner to the source pose: `{ x: dx, y: dy, scale }` — the PIP renders exactly at the source preset.
3. Tween the inner to identity: `{ x: 0, y: 0, scale: 1 }` — it glides into the baked destination.

Only `transform` moves (seek-safe). The container never translates. Reversible on backward seek during duration probing. The `.od-pip-inner` here stands in for the zoomed/cropped footage layer — in a real build it holds the footage crop, not a separate camera feed. If the edit uses a hard cut to black between scenes, it happens *during* the reposition; this move can also glide continuously.

## When to use
- Between two scenes, as the handoff — one card system leaves, the PIP reframes, the next enters. Pairs with the Layer 1 between-card transitions.
- Not a per-scene decoration. Reframe on meaningful shifts, not every card.

## CSS
```css
.od-pip { position: absolute; left: 5%; top: 30%; width: 30%; }   /* baked at DESTINATION (left-third-hero) */
.od-pip .od-pip-inner { transform-origin: top left; width: 100%; aspect-ratio: 4 / 5; }
.od-pip .od-frame { width: 100%; height: 100%; border-radius: 20px; overflow: hidden;
  background: #16181C; border: 1px solid rgba(255,255,255,0.12); }
/* .od-frame holds a zoomed/cropped view of the source FOOTAGE layer (compositing illusion),
   NOT a live webcam element. Here a placeholder box stands in for that footage crop. */
```

## GSAP (helper form — absolute t)
```js
// presets in px for a 1920x1080 canvas
const PIP = { 'top-right-box':{l:1382,t:65,w:422}, 'left-third-hero':{l:96,t:324,w:576},
              'over-screenrec':{l:1440,t:670,w:384} };
function odPipReframe(inner, from, to, t) {
  const a = PIP[from], b = PIP[to];                       // container is baked at `to`
  const dx = a.l - b.l, dy = a.t - b.t, scale = a.w / b.w;
  const tl = gsap.timeline();
  tl.set(inner, { x: dx, y: dy, scale });                 // start at source pose
  tl.to(inner, { x: 0, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }, t);  // glide to destination
  return tl;                                              // no exit — the PIP persists
}
```

## API / Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `from` | preset id | — | source preset |
| `to` | preset id | — | destination (container baked here) |
| `at` | seconds | — | when the reframe fires (on the scene handoff) |
| `duration` | seconds | `0.6` | glide length |

## Entrance
`entrance_archetype: SMOOTH` · `entrance_mechanism: SLIDE`. `power3.out`, no overshoot — a bouncing webcam reads broken. The PIP has no entrance/exit of its own; it is repositioned.

## Placement default
Whichever preset is the destination. The PIP is a persistent element, not content-area content.

## Impl
`_impl/pip-reframe.html` — canonical render demonstrating `top-right-box → left-third-hero`. Re-derive + re-gate on any motion change.
