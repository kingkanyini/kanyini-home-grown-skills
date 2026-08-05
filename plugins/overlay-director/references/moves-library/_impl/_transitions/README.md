# Between-Card Transitions — Render Home (Layer 1, v2 L1-2)

Closes ARCHITECT's "signature transitions have a planner but no builder" gap — one of <your-name>'s
four headline asks ("no signature transitions"). `reference/scripts/transitions.js` is the **planner**
(who overlaps whom, with which transition); the files here are the **render home** (the seek-safe
tween SHAPES the compose step applies to realize each transition).

## The problem these solve
overlay-director's default was "jump cut with a dip" — every card fades to nothing before the next
fades in from nothing, with **zero** between-card transitions. HyperFrames doctrine flips it: it BANS
mid-composition per-element exits — **the transition IS the exit**. The fix: **overlap** consecutive
cards by `TRANSITION_OVERLAP_S` (constants.js, 0.15s) so one card's departure and the next's arrival
share a beat, and give that shared beat a deliberate shape (blur-crossfade / zoom-through / scale-swap
/ crossfade / card-morph / hard-cut).

## The cross-timeline seek-safe pattern (the load-bearing idea)
The whole skill renders by SEEKING a **paused** GSAP timeline frame-by-frame, forward AND backward
(duration probing). A transition spans **two moves = two paused child timelines**. The seek-safe way
to couple them:

1. **One master progress drives both children.** HyperFrames' compose runtime
   (`collectRootChildCandidates`, see `_impl/REGISTRATION.md`) auto-nests every child whose
   `window.__timelines[childId]` exists and seeks each child by `child.totalTime(masterTime − childStart)`.
   You do NOT hand-write a cross-fade timeline that tweens both cards — each child stays its own
   independent, seek-safe timeline.
2. **The overlap is a start-offset, not a new tween.** To overlap, the planner sets the incoming
   child's `childStart = outgoingChild.end − TRANSITION_OVERLAP_S` (this is exactly what
   `transitions.js overlapPair` / `planHandoffs` compute). During `[incoming.start, outgoing.end]`
   BOTH children are live: the outgoing runs its **exit** shape, the incoming runs its **entrance**
   shape. Because each child is independently seek-safe, their overlap is seek-safe for free — no
   shared state, no cross-timeline tween to go stale on a backward seek.
3. **Opacity + transform ONLY.** Every transition shape is `opacity` / `scale` / `x` / `y` / `rotation`
   (§0 seek-safe set). NEVER a `filter` / `backdrop-filter` / `stdDeviation` tween across the handoff.
   A literal *blur* feel, if wanted, is each move's OWN internal seek-safe 2-layer blur↔sharp crossfade
   (see `liquid-glass-card` impl) — it is never introduced at the transition layer.
4. **Every exit ends in a hard-kill.** The outgoing child's last beat is `tl.set(target,{opacity:0}, end)`
   so a backward seek past the handoff can't leave it faintly lit.

## Why the recipe files show BOTH cards in one timeline
A standalone HTML has ONE root `data-composition-id`, so each recipe here demonstrates the handoff with
the outgoing (`.od-out`) and incoming (`.od-in`) elements in a **single** paused timeline — this is the
runnable, gate-able proof that the overlap SHAPE is seek-safe. In production compose the identical
shapes live on **two** child timelines offset by `TRANSITION_OVERLAP_S` (per the pattern above); the
single-timeline demo and the two-timeline composition produce the same frames because the shapes are
pure `opacity`/`transform`. The `out`/`in` tween values here are mirrored 1:1 from
`transitions.js TRANSITION_SPECS` (the single source of truth) — `transitionSpec(kind)` returns them,
and `planHandoffs` attaches `spec` to every handoff record so the renderer never re-invents them.

## Files
| Recipe | `transition` id | When the planner picks it |
|--------|-----------------|---------------------------|
| `crossfade.html` | `crossfade` | baseline — related points continuing |
| `blur-crossfade.html` | `blur-crossfade` | **universal default** (calm/premium), 60–70% of a build |
| `zoom-through.html` | `zoom-through` | high-energy climax (`energy:'climax'`) |
| `scale-swap.html` | `scale-swap` | same-footprint morph (from_type === to_type, footprint family) |

`card-morph` shares scale-swap's shape (same-footprint continuity); `hard-cut` is an instantaneous
swap with NO overlap (used *during* a PIP reposition — Layer 3) and needs no dwell recipe.

## Budget discipline (motion-grammar-spec Part 2)
ONE primary transition carries 60–70% of a build (default `blur-crossfade`); never a different
transition per scene. Reserve `zoom-through` for 1–2 climax handoffs. `pickTransition()` encodes this:
same-footprint→scale-swap, climax→zoom-through, everything else→blur-crossfade.
