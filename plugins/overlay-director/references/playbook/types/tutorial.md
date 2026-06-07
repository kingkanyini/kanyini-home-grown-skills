---
type: playbook-type
scope: tutorial
principles:
  - id: tutorial-point-at-action
    affects: sequence.variety
    value: accent-on-ui
  - id: tutorial-cards-off-center
    affects: placement.horizontal
    value: off-center
  - id: tutorial-concept-image-holds-topic
    affects: sequence.layering
    value: two-layer
  - id: tutorial-illumination-over-arrows
    affects: sequence.variety
    value: spotlight-for-passages
  - id: tutorial-read-ahead-leadin
    affects: timing.leadin
    value: negative-for-labels
  - id: tutorial-screenshare-pip-corner
    affects: placement.horizontal
    value: pip-corner
---

# Playbook — Tutorial

For screen-recordings / how-to / step-by-step content.

## Density default
**Standard** lean — tutorials carry more labeled steps than a talking-head. ~1 card / 20–30s.

## Preferred move palette
- `top-pill` for step/chapter markers ("Step 2").
- `sandwich-stack` for enumerated lists/steps that build.
- `liquid-glass-card` for per-step insight labels.
- `bouncing-arrows` to point at the exact UI element being clicked.
- `image-card` for concept asides — **held for the full topic span**, not a brief pop (see Two-Layer Overlay below).

## Type principles
- **Steps get pills, insights get cards** — keep the two visually distinct so the viewer parses structure.
- **Point at the action** — when the speaker says "click here", a `bouncing-arrows` accent on the target beats a text card. `affects: [sequence.variety]`
- Cards stay off-center (global #5 holds; no type override). `affects: [placement.horizontal]`

## Two-Layer Overlay (concept images hold; triggers stay transient)

Tutorials carry two kinds of overlay that live on different clocks:

- **Topic layer** — concept/illustrative `image-card`s. A concept image enters when the
  topic is introduced and holds for the **entire span the speaker discusses it**, exiting
  when the talk moves on. Example: a WhisperFlow roadrunner/coyote image holds across the
  whole WhisperFlow segment (~03:58→04:09), not a 2.5s pop.
- **Trigger layer** — `bouncing-arrows` / `top-pill` / `liquid-glass-card` action cards tied
  to a single click/open/download. These stay brief and fire **on top of** the held image.

**Why this needs its own rule:** the no-overlap auto-fix guarantees `max_concurrent=1` by
trimming each card's exit to the next card's entrance. A concept image held for 10–15s would
get trimmed the instant the next click card fires. So a held concept image must be tagged to
the **topic layer** and exempted from the trigger layer's trim — the two layers are allowed
to coexist. Without the layer split you cannot have both "card every click" density and an
illustration that breathes underneath it. Hold duration = the image-card's GSAP fade-out
tween (global #3), set to the topic's last spoken word + ~0.4s. `affects: [sequence.layering]`
See vault ``overlay-two-layer-concept-image-hold``.

## Screen-share grammar (Abdaal reference, 2026-06-01)

Reverse-engineered from Ali Abdaal's Claude Code guide (sanctioned reference — he's
the educational-scripting anchor in YouTube Creator Counsel #57). Reviewed + hardened
by Visual Visionary #26. These apply to **screen-recording-dominant** tutorials.

- **Illumination over arrows for passages.** When the speaker reads/explains a long
  static on-screen block, use `reading-spotlight` (held lit region, dimmed surround)
  instead of `bouncing-arrows`. Arrows = transient click pointer; spotlight = held
  passage reader. `affects: [sequence.variety]`
- **PIP-corner layout variant.** In screen-share-dominant sections the screen IS the
  frame and the webcam shrinks to a small rounded corner PIP. Note this **inverts** the
  talking-head bias: bias cards to clear wherever the PIP actually sits (Abdaal parks it
  upper-left; <your-name>'s <example-brand> build had it right). Cards bake to the screen-region.
  `affects: [placement.horizontal]`
- **Read-ahead pre-reveal for labels.** For list/option labels the viewer is meant to
  scan ahead of, lead-in is **negative** — the label appears ~0.5s BEFORE the word.
  This is not a conflict with "anchor 0.4s before"; it's the same rule with a bigger
  lead-in: `leadIn ≥ 0.4s, default 0.4s, label/list = 0.5s`. Add ±0.1s jitter across a
  stack of labels so they don't tick like a metronome [Marsh]. `affects: [timing.leadin]`
- **Calm, not hype.** Adopt the *grammar* of a borrowed technique, never its *tone*.
  Re-skin every borrowed move to cream/gold/sage + gouache and down-tune to calm before
  it ships. If a move only works at high energy (bouncing karaoke, punchline bubbles),
  it's Abdaal's, not <your-name>'s — strip the energy or leave it out [Collin, voice guardrail].

## P6b — Reserved caption lane + source-text floor (VV#26)

Additive to global #6 (caption plate). When a persistent caption track
(`karaoke-caption`) is in the comp:
- The **bottom 18% of frame is a reserved lane** — no other move's text or tether may
  enter it (tool-tags default to top-right, callout tails stay above it) [Brown].
- Any move that highlights/dims **captured screen text** (`reading-spotlight`) must
  **scale the active region** so its text clears ~28px-equivalent at 9:16. Dimming the
  surround without enlarging the subject just makes already-small source text the
  brightest unreadable thing on screen [Brown].

## Geometry gate — vision-derive → inspect-verify → human-fallback

Some screen-share moves need on-screen coordinates the **transcript cannot provide**:
`reading-spotlight` region boxes, `top-pill` callout tether points (and the deferred
`cycle-diagram` node/edge topology). The transcript can't supply these — but **vision
can**, from two surfaces already in the pipeline. Don't default to asking the human;
ask only as a fallback when vision is unsure.

**The loop:**
1. **DERIVE (vision over the SOURCE).** The `watch` skill extracts source frames at the
   moment's timestamp. A vision pass reads the frame and locates the target — the doc
   block to spotlight, the button to tether — as `{left,top,w,h}` / `{x,y}` in the
   frame's pixel space. Auto-draft fills the stub with these coords.
   - **Fidelity-Principle math:** derive at `watch --resolution 1024` (the 512px default
     is too coarse for a pixel box) and **re-scale to the source's native dims** (e.g.
     1920×1080) from the actual frame dimensions — never eyeball the mapping. Re-derive
     from the transformed frame, don't retrofit. (→ CLAUDE.md Fidelity Principle.)
2. **VERIFY (vision over the COMPOSITION).** After render, `npx hyperframes inspect`
   seeks the built composition (source + overlays) and screenshots card-visible frames.
   Its native findings catch overflow/clipping; a vision pass on those shots confirms the
   overlay landed on the **right** target (spotlight lit the intended paragraph, not one
   off by 200px). If off, self-correct the coords and re-render that segment.
3. **HUMAN FALLBACK.** Only when vision is low-confidence does the moment carry
   `needs_studio_input: true` for a Studio-tweak pass. **Render must refuse any moment
   still flagged `needs_studio_input`** [Hogg] — but most moments should clear vision and
   never reach this gate.

**Forgiveness varies by move** — calibrate the confidence threshold per move:
- `reading-spotlight` region — forgiving (a slightly loose box still reads); low bar to
  auto-accept.
- `top-pill` `tether` tail at a small button — tight; vision should punt to human
  fallback sooner.

> **Ordering prerequisite (Hogg, load-bearing):** the per-card `layer` field +
> layer-aware no-overlap auto-fix must ship BEFORE `reading-spotlight` and any held/
> tethered move. Without it, a held topic-layer spotlight gets its exit trimmed to the
> next caption's entrance — the hold is destroyed and the scrub shows it vanishing early.
> These moves are *documented* now; the engine code (layer field, vision-derive pass,
> inspect-verify loop, per-move render logic) is the next build task — see
> ``overlay-vision-derived-geometry-loop``.
