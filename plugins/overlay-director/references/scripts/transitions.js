// Between-card handoff / overlap logic (Layer 1 — motion core).
//
// The "generic" diagnosis (motion-grammar-spec Part 1): overlay-director has ZERO
// between-card transitions — "every card fades to nothing before the next fades in from
// nothing" (HyperFrames' name for it: "jump cut with a dip"). HyperFrames doctrine flips
// this: it BANS mid-composition per-element exits — "the transition IS the exit." The fix
// is to OVERLAP consecutive cards so one card's departure and the next's arrival share a
// beat (motion-grammar-spec Part 2, exit doctrine; playbook P15).
//
// Pure functions, unit-tested with node:test. Numbers import from constants.js (never
// hardcoded). This module decides the SCHEDULE (who overlaps whom, by how much, with
// which transition) — it does not render; the per-move impls + the compose step consume it.
const C = require('./constants.js');

// The transition vocabulary (mirrors plan.schema.json transition_in/out enum, contract §6).
const TRANSITIONS = ['crossfade', 'blur-crossfade', 'zoom-through', 'scale-swap', 'card-morph', 'hard-cut'];

// ── CROSS-TIMELINE RENDER SPECS (L1-2) ────────────────────────────────────
// The SEEK-SAFE shape of each transition, as {from,to,ease} for the OUTGOING and INCOMING cards.
// Applied over the overlap window (TRANSITION_OVERLAP_S). OPACITY + TRANSFORM ONLY — never a filter
// tween (§0). "blur" reads via scale-drift + opacity crossfade; a literal blur, if wanted, is each
// move's OWN internal seek-safe 2-layer crossfade, not a cross-card filter tween. These specs are the
// single source the planner hands to the render home (_impl/_transitions/*.html mirror them).
const TRANSITION_SPECS = {
  crossfade: { // baseline: related points continuing
    out: { from: { opacity: 1 }, to: { opacity: 0 }, ease: 'power1.inOut' },
    in:  { from: { opacity: 0 }, to: { opacity: 1 }, ease: 'power1.inOut' },
  },
  'blur-crossfade': { // universal premium default (calm)
    out: { from: { opacity: 1, scale: 1 },    to: { opacity: 0, scale: 1.03 }, ease: 'power2.inOut' },
    in:  { from: { opacity: 0, scale: 0.97 }, to: { opacity: 1, scale: 1 },    ease: 'power2.inOut' },
  },
  'zoom-through': { // high-energy climax: old rushes past, new emerges from depth
    out: { from: { opacity: 1, scale: 1 },   to: { opacity: 0, scale: 2.5 }, ease: 'power3.in' },
    in:  { from: { opacity: 0, scale: 0.5 }, to: { opacity: 1, scale: 1 },   ease: 'power3.out' },
  },
  'scale-swap': { // same-footprint morph: one card's box becomes the next
    out: { from: { opacity: 1, scale: 1 },   to: { opacity: 0, scale: 0.9 }, ease: 'power3.inOut' },
    in:  { from: { opacity: 0, scale: 1.1 }, to: { opacity: 1, scale: 1 },   ease: 'power3.inOut' },
  },
  'card-morph': { // alias of scale-swap at the spec level (same-footprint continuity)
    out: { from: { opacity: 1, scale: 1 },    to: { opacity: 0, scale: 0.94 }, ease: 'power3.inOut' },
    in:  { from: { opacity: 0, scale: 1.06 }, to: { opacity: 1, scale: 1 },    ease: 'power3.inOut' },
  },
  'hard-cut': { // no overlap — instantaneous swap at the boundary (used during a PIP reposition)
    out: { from: { opacity: 1 }, to: { opacity: 0 }, ease: 'none', instant: true },
    in:  { from: { opacity: 0 }, to: { opacity: 1 }, ease: 'none', instant: true },
  },
};

// The seek-safe render spec for a transition kind (falls back to the calm default).
function transitionSpec(kind) { return TRANSITION_SPECS[kind] || TRANSITION_SPECS['blur-crossfade']; }

// Per-transition co-visibility window (Layer 1, Rauno hardening). Calm dissolves want a longer
// overlap so the premium blur-crossfade actually reads as a dissolve, not a fast dip; the tight,
// high-energy morphs (zoom-through / scale-swap / card-morph) keep the snappier window. hard-cut
// has no overlap (instant swap). Numbers import from constants.js (never hardcoded).
const OVERLAP_BY_TRANSITION = {
  'crossfade':      C.TRANSITION_OVERLAP_BLUR_S, // 0.3 — calm dissolve
  'blur-crossfade': C.TRANSITION_OVERLAP_BLUR_S, // 0.3 — calm/premium default
  'zoom-through':   C.TRANSITION_OVERLAP_S,      // 0.15 — tight, high-energy
  'scale-swap':     C.TRANSITION_OVERLAP_S,      // 0.15 — tight footprint morph
  'card-morph':     C.TRANSITION_OVERLAP_S,      // 0.15 — tight footprint morph (scale-swap sibling)
  'hard-cut':       0,                           // instant swap, no shared beat
};
// The co-visibility window for a transition kind (falls back to the calm/premium default).
function overlapFor(kind) {
  const v = OVERLAP_BY_TRANSITION[kind];
  return v != null ? v : C.TRANSITION_OVERLAP_BLUR_S;
}

// Move families that occupy the SAME footprint and can therefore morph in place
// (one card's box becomes the next's) rather than cross-dissolve through dead space.
const SAME_FOOTPRINT_TYPES = new Set(['card', 'image', 'quote', 'hero', 'riser', 'split']);

// Tracks / accents never drive a card-to-card handoff: karaoke is a persistent baseline
// track, bouncing-arrows is seasoning that rides ON TOP of a card, not a scene of its own.
const NON_HANDOFF_TYPES = new Set(['caption-track', 'accent']);

function isHandoffMove(m) {
  return m && !NON_HANDOFF_TYPES.has(m.move_type) && m.t_start != null && m.t_end != null;
}

// Pick ONE transition for a from->to handoff. Budget discipline (Part 2): a single primary
// carries 60-70% of a build; this returns the *default* pick per pair, callers may override
// the 1-2 accent moments (a climax gets a zoom-through) via opts.energy.
//   - climax energy               -> zoom-through (high-energy peak)
//   - same-footprint same family  -> scale-swap   (box morphs into the next)
//   - otherwise                   -> blur-crossfade (the universal calm/premium default)
// A zero/negative gap that would collide hard falls to blur-crossfade too (calm default).
function pickTransition(fromType, toType, opts = {}) {
  if (opts.energy === 'climax') return 'zoom-through';
  if (fromType && toType && fromType === toType && SAME_FOOTPRINT_TYPES.has(fromType)) return 'scale-swap';
  return 'blur-crossfade';
}

// The literal gap between two ordered moments. Positive => dead air (bad); <=0 => already
// overlapping. Used by the dead-air detector and to decide how far to pull the incoming card.
function gapBetween(a, b) { return (b.t_start || 0) - (a.t_end || 0); }

// Detect "jump cut with a dip": adjacent handoff moments separated by a positive time gap
// with no overlap. Returns the offending index pairs so Phase 3 can flag before build cost.
// (standards-check.js `dead-air` is the Layer-0 gate; this is the Layer-1 primitive it builds on.)
function deadAirGaps(moments, tol = 0) {
  const seq = moments.filter(isHandoffMove);
  const gaps = [];
  for (let i = 1; i < seq.length; i++) {
    const g = gapBetween(seq[i - 1], seq[i]);
    if (g > tol) gaps.push({ from: seq[i - 1], to: seq[i], gap: round3(g) });
  }
  return gaps;
}

// Shift the incoming card so it starts `overlap` seconds BEFORE the outgoing card ends,
// so the two share a beat (the outgoing exit and incoming entrance co-exist). Pure:
// returns a new moment, never mutates. Clamped at 0 so the first card can't go negative.
function overlapPair(outgoing, incoming, overlap = C.TRANSITION_OVERLAP_S) {
  const newStart = Math.max(0, round3((outgoing.t_end || 0) - overlap));
  // preserve the incoming card's duration by sliding t_end with t_start
  const dur = (incoming.t_end != null && incoming.t_start != null) ? incoming.t_end - incoming.t_start : null;
  const shifted = { ...incoming, t_start: newStart };
  if (dur != null) shifted.t_end = round3(newStart + dur);
  return shifted;
}

// Plan the handoffs across an ordered set of moments. For every adjacent pair of handoff
// moments, emit a handoff record (from, to, transition, gap, overlap-applied). Does NOT
// rewrite the plan by default (returns the overlapped `moments` alongside so a caller can
// opt in). Heroes/tracks/accents are passed through untouched.
//
//   opts.overlap   FORCE this overlap window for every pair (overrides the per-transition pick)
//   opts.apply     when true, the returned `moments` carry the overlapped t_start/t_end
//   opts.climaxIds set/array of move ids (or indices) that should use zoom-through
// When opts.overlap is omitted, each pair's window is chosen by its transition kind via
// overlapFor() — calm dissolves (crossfade/blur-crossfade) get the longer 0.3s co-visibility,
// tight morphs (zoom-through/scale-swap/card-morph) keep 0.15s.
function planHandoffs(moments, opts = {}) {
  const forced = opts.overlap;
  const apply = !!opts.apply;
  const climax = new Set(opts.climaxIds || []);
  const out = moments.map((m) => ({ ...m }));
  const handoffs = [];

  // indices of the handoff-eligible moments, in order
  const idx = out.map((m, i) => (isHandoffMove(m) ? i : -1)).filter((i) => i >= 0);
  for (let k = 1; k < idx.length; k++) {
    const iPrev = idx[k - 1], iCur = idx[k];
    const from = out[iPrev], to = out[iCur];
    const isClimax = climax.has(to.id) || climax.has(to.move_id) || climax.has(iCur);
    const transition = pickTransition(from.move_type, to.move_type, isClimax ? { energy: 'climax' } : {});
    const overlap = forced != null ? forced : overlapFor(transition);
    const gap = round3(gapBetween(from, to));
    if (apply) {
      const shifted = overlapPair(from, to, overlap);
      out[iCur].t_start = shifted.t_start;
      if (shifted.t_end != null) out[iCur].t_end = shifted.t_end;
    }
    handoffs.push({
      from_id: from.id || from.move_id || iPrev,
      to_id: to.id || to.move_id || iCur,
      transition, gap, overlap: round3(overlap), applied: apply,
      spec: transitionSpec(transition), // L1-2: planner hands the seek-safe render shape downstream
    });
  }
  return { moments: out, handoffs };
}

function round3(x) { return Number(Number(x).toFixed(3)); }

module.exports = {
  TRANSITIONS, TRANSITION_SPECS, SAME_FOOTPRINT_TYPES, NON_HANDOFF_TYPES, OVERLAP_BY_TRANSITION,
  isHandoffMove, pickTransition, transitionSpec, overlapFor, gapBetween, deadAirGaps, overlapPair, planHandoffs,
};
