---
status: active
version: 1
move_type: hero
affects: [placement.horizontal, sequence.layering]
hero_capable: true
---

# Comic Zoom-Pan (signature "wow" move)

## Purpose
The signature beat. A single multi-panel comic (2x2, four scenes telling one story, generated in the
Earthy Comic Realism skin) held over the content area while the camera **scales up and pans
quadrant-to-quadrant** in sync with narration — turning one static illustration into a 20-30s
cinematic interlude. Use it once or twice per video as the standout moment.

## When to use
- A 20-35s narration/recap lull (speaker summarizing value, screen static/low-motion).
- A 4-scene arc: before→after, problem→solution, or a 4-step pipeline.
- Density tier: hero. **Max ~2 per video** — repetition kills the wow.

## CSS
```css
.od-comic-zoompan {            /* fills the content panel, NOT edge-to-edge (leave the cam PIP live) */
  position: absolute;          /* baked left/top (principle 2) */
  overflow: hidden; border-radius: 20px; opacity: 0;
  box-shadow: 6px 8px 28px rgba(20,14,9,0.32);
}
.od-comic-zoompan img { width: 100%; height: 100%; object-fit: cover; transform-origin: 0 0; }
.od-comic-zoompan .od-cap-hero {    /* caption on a dark plate, never raw over art (principle 6) */
  position: absolute; left: 40px; bottom: 32px; max-width: 78%;
  padding: 16px 24px; border-radius: 14px;
  background: rgba(20,14,9,0.58); backdrop-filter: blur(6px);
  color: #F2EBDB; font: 700 34px/1.25 'Inter', sans-serif;
}
```

## GSAP
```js
// SEEK-SAFE: tween transform (scale/x/y) + opacity ONLY — never filter/backdrop/box-shadow.
function odComicZoomPan(elSel, t, HOLD, W, H) {
  const SC = 1.9, seg = (HOLD - 1.2) / 4;
  const q = [[0,0],[-(W*SC-W),0],[0,-(H*SC-H)],[-(W*SC-W),-(H*SC-H)]]; // 4 quadrant offsets
  tl.set(elSel,{opacity:0}); tl.set(elSel+' .img',{scale:1,x:0,y:0});
  tl.to(elSel,{opacity:1,duration:0.6,ease:'power2.out'},t);
  let k = t + 0.6;
  q.forEach((p,i)=>{ tl.to(elSel+' .img',{scale:SC,x:p[0],y:p[1],duration:i?0.7:0.8,ease:'power1.inOut'},k); k += seg; });
  tl.to(elSel,{opacity:0,duration:0.5,ease:'power1.in'},t+HOLD);
  tl.set(elSel,{opacity:0},t+HOLD+0.5);   // hard-kill
}
```

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `src` | path | — | 4-panel 2x2 comic (Phase 4), Earthy Comic Realism skin, clean quadrants |
| `caption` | string | "" | one short line on the dark plate (NOT baked into art) |
| `HOLD` | seconds | 20–30 | the narration beat length; pans split evenly across it |
| `scale` | number | 1.9 | zoom factor per quadrant |

## Placement default
`frame-center` over the **content panel only** — must leave the webcam PIP / a live region uncovered so
freeze-detect stays honest (a full-frame static hold over all pixels can trip the 0-tolerance fidelity
gate). See ``overlay-verify-render-fidelity-vs-source``.

## Provenance
Reverse-engineered from an early production build, designated the signature move by
<your-name>. Full technique + empirical validation captured during the original build.
