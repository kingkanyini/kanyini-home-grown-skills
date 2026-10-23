# Effect Sub-Comp Registration Contract (verified against engine source)

**Verified against engine source:** `hyperframes/packages/core/src/runtime/timeline.ts`
(master timeline looked up by `timelineRegistry[root.getAttribute("data-composition-id")]`)
and `.../runtime/init.ts` (`collectRootChildCandidates` auto-nests each child whose
`__timelines[childId]` exists with play/pause). A shared `'root'` key collides on compose.

## Rules
1. Root `data-composition-id` is UNIQUE and equals the move_id.
2. Register `window.__timelines["<move_id>"] = gsap.timeline({ paused: true })` SYNCHRONOUSLY at
   script eval (top-level). Only the first seek/visual apply may await `document.fonts.ready`.
3. Beats authored at local t=0. Position baked via left/top/bottom (px/%), never translate.
   Opacity/transform fade owns visible life. No Math.random/Date.now.
4. Selectors: `[data-composition-id="<move_id>"] .od-*` or `.od-*`. Never bare `#id`.
5. Pinned GSAP URL across all files: https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js
6. SEEK-SAFETY: never tween filter / backdrop-filter / box-shadow geometry (stale on backward
   seek during duration probing). liquid-glass blur = two-layer opacity cross-fade ONLY
   (constant blur layer ↔ constant sharp layer). reading-spotlight shadow = static constant;
   the "walk" = cross-fade between ≥2 discrete lit-region states. Finite repeats, Math.floor.
   Every opacity-exit gets a trailing tl.set(target,{opacity:0}, exitEnd) hard-kill.

## Card→impl translation (worked example: liquid-glass-card)
Card helper (un-paused, absolute t):
    function odLiquidGlassCard(el, t){ const tl=gsap.timeline();
      tl.set(el,{opacity:0,filter:'blur(6px)'}); tl.to(el,{opacity:1,filter:'blur(0px)',...},t);
      tl.to(el,{opacity:0,...},t+HOLD); return tl; }
Impl (paused, local t, seek-safe two-layer cross-fade):
    const tl = gsap.timeline({paused:true}); const HOLD = 3.0;
    const S = '[data-composition-id="liquid-glass-card"]';
    tl.set(`${S} .od-blur`, {opacity:1}).set(`${S} .od-sharp`, {opacity:0});
    tl.to(`${S} .od-card`, {opacity:1, duration:0.4, ease:'power2.out'}, 0);     // card fades in
    tl.to(`${S} .od-sharp`,{opacity:1, duration:0.4, ease:'power2.out'}, 0)       // sharp rises
      .to(`${S} .od-blur`, {opacity:0, duration:0.4, ease:'power2.out'}, 0);      // blurred falls = "comes into focus"
    tl.to(`${S} .od-card`, {opacity:0, duration:0.4, ease:'power1.in'}, HOLD);
    tl.set(`${S} .od-card`, {opacity:0}, HOLD + 0.4);                             // hard-kill
NOTE: the cross-fade is a deliberate seek-safe 2-state dissolve, faithful to "comes into focus
while fading in." Do NOT "fix" it back to a tweened filter — that reintroduces the backward-seek
stale-blur bug. (Fidelity Principle: re-derive intent from the transformed seek-safe form.)

## Headless render flags (backdrop-filter compositing)
Render with GPU compositing enabled so backdrop-filter composites (HyperFrames default browser-GPU
auto-detect covers this; if glass renders flat, pass --enable-gpu / --use-gl=angle to the render).

## Provenance hash survives compose
Each composed `compositions/<id>.html` carries its source sha256 as an HTML comment. If the inliner
ever strips comments, move it to a `data-impl-hash` attribute on #root. Guard degrades safe.
