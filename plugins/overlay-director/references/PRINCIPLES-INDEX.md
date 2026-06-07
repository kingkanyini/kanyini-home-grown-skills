# PRINCIPLES-INDEX (GENERATED — do not edit by hand)

<!-- index-hash: 928d07be33332967 -->
> Regenerated at Phase 0.5 from your vault notes. Vault is canonical; this is a digest.

- **`overlay-anchor-cards-to-audio`** — Tie each card to its line with a ~0.4s lead-in.  _(affects: timing.anchor)_
- **`overlay-bake-position-via-left-top-not-translate`** — GSAP wipes translate; capture pre-GSAP computed left/top and bake those.  _(affects: placement.bake)_
- **`overlay-caption-legibility-plate`** — Captions over art sit on a dark blurred plate for mobile legibility.  _(affects: legibility)_
- **`overlay-card-timing-discipline`** — Lead-in, read-time hold (2.5-4.5s), clean exits, collision-free.  _(affects: timing.discipline)_
- **`overlay-content-area-centering`** — Shift cards off-center to clear the cam; full-frame elements stay centered.  _(affects: placement.horizontal)_
- **`overlay-densify-keyframes-before-render`** — Sparse keyframes stall/freeze/lag; densify a scratch copy first.  _(affects: render.keyframes)_
- **`overlay-fade-tween-owns-visible-lifetime`** — Extend a card by moving its fade-out, not data-duration.  _(affects: timing.lifetime)_
- **`overlay-move-card-as-a-unit`** — Shift data_start and every GSAP beat by the same delta.  _(affects: timing.shift)_
- **`overlay-mvp-density-first`** — Start sparse and promote select moments to hero.  _(affects: density)_
- **`overlay-never-overwrite-source`** — Source is read-only; densify/copy-first (scoped CLAUDE.md Fidelity).  _(affects: source.safety)_
- **`overlay-vary-move-types-for-rhythm`** — Density isn't variety; alternate move types so it reads authored.  _(affects: sequence.variety)_
- **`overlay-verify-render-fidelity-vs-source`** — Freeze-detect both; rendered frozen% must be <= source.  _(affects: render.fidelity)_