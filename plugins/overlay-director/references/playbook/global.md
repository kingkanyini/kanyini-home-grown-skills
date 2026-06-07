# Playbook — Global Core

Applies to every video type unless a type file or a higher-precedence rule overrides (see
`density-modes.md` precedence). Concepts are canonical in the vault; this is the operational digest.

## The 12 seed principles (reverse-engineered from the original production build)

1. **Densify keyframes before render/scrub** — sparse keyframes stall/freeze/lag. ``overlay-densify-keyframes-before-render``
2. **Bake position via `left`/`top`, never `translate`** — GSAP sets `translate:none` on animated els; capture offsets pre-GSAP, convert. ``overlay-bake-position-via-left-top-not-translate``
3. **A card's visible life = its GSAP fade tween, not `data-duration`** — to extend, move the fade-out. ``overlay-fade-tween-owns-visible-lifetime``
4. **Anchor every card to a spoken moment** — lead-in ~0.4s before the word. ``overlay-anchor-cards-to-audio``
5. **Content-area centering** — shift cards off true-center to clear the cam; wide/full-frame elements stay frame-centered (clip otherwise). ``overlay-content-area-centering``
6. **Illustration captions need a dark blur plate** for mobile legibility. ``overlay-caption-legibility-plate``
7. **Verify render fidelity** — freeze-detect vs source (rendered frozen% ≤ source); QC frames at card-visible times. ``overlay-verify-render-fidelity-vs-source``
8. **MVP density first** — promote select moments to hero. ``overlay-mvp-density-first``
9. **Move a card as a unit** — shift `data-start` + every GSAP beat by the same delta. ``overlay-move-card-as-a-unit``
10. **Never overwrite the source** — read-only; densify/copy-first. ``overlay-never-overwrite-source`` (→ CLAUDE.md Fidelity Principle)
11. **Vary move types for rhythm** — density ≠ variety; alternate move types so it reads authored. ``overlay-vary-move-types-for-rhythm``
12. **Card timing is a discipline** — lead-in, read-time hold, clean exits, collision-free. ``overlay-card-timing-discipline``

## Default move palette (global)
`liquid-glass-card` (workhorse) · `lower-third` · `top-pill` · `image-card` · occasional `bottom-rise`.
Heroes (`center-hero`, `full-frame-quote`) reserved for promoted moments. `bouncing-arrows` is accent only.

## Default density
MVP unless the type file or the operator raises it. ~1 card / 25–40s; promote, don't start dense.
