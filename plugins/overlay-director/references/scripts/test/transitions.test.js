const { test } = require('node:test');
const assert = require('node:assert');
const {
  TRANSITIONS, TRANSITION_SPECS, OVERLAP_BY_TRANSITION, isHandoffMove, pickTransition, transitionSpec,
  overlapFor, gapBetween, deadAirGaps, overlapPair, planHandoffs,
} = require('../transitions.js');
const C = require('../constants.js');

test('TRANSITIONS enum matches the plan schema vocabulary', () => {
  assert.deepStrictEqual(TRANSITIONS,
    ['crossfade', 'blur-crossfade', 'zoom-through', 'scale-swap', 'card-morph', 'hard-cut']);
});

test('pickTransition: blur-crossfade is the universal default', () => {
  assert.strictEqual(pickTransition('card', 'image'), 'blur-crossfade');
  assert.strictEqual(pickTransition('lower-third', 'pill'), 'blur-crossfade');
});

test('pickTransition: same-footprint same family morphs (scale-swap)', () => {
  assert.strictEqual(pickTransition('card', 'card'), 'scale-swap');
  assert.strictEqual(pickTransition('image', 'image'), 'scale-swap');
  // same type but NOT a footprint family (e.g. accent) -> falls back to the default
  assert.strictEqual(pickTransition('accent', 'accent'), 'blur-crossfade');
});

test('pickTransition: climax energy overrides to zoom-through', () => {
  assert.strictEqual(pickTransition('card', 'hero', { energy: 'climax' }), 'zoom-through');
  assert.strictEqual(pickTransition('card', 'card', { energy: 'climax' }), 'zoom-through');
});

test('isHandoffMove: tracks and accents and timing-less moments are excluded', () => {
  assert.strictEqual(isHandoffMove({ move_type: 'card', t_start: 0, t_end: 3 }), true);
  assert.strictEqual(isHandoffMove({ move_type: 'caption-track', t_start: 0, t_end: 3 }), false);
  assert.strictEqual(isHandoffMove({ move_type: 'accent', t_start: 0, t_end: 3 }), false);
  assert.strictEqual(isHandoffMove({ move_type: 'card' }), false); // no timing
});

test('gapBetween and deadAirGaps detect the jump-cut-with-a-dip', () => {
  const moments = [
    { id: 'a', move_type: 'card', t_start: 0, t_end: 3 },
    { id: 'b', move_type: 'image', t_start: 3.5, t_end: 6 },   // 0.5s dead air
    { id: 'c', move_type: 'quote', t_start: 6, t_end: 9 },     // back-to-back (no gap)
  ];
  assert.strictEqual(gapBetween(moments[0], moments[1]), 0.5);
  const gaps = deadAirGaps(moments);
  assert.strictEqual(gaps.length, 1);
  assert.strictEqual(gaps[0].from.id, 'a');
  assert.strictEqual(gaps[0].to.id, 'b');
  assert.strictEqual(gaps[0].gap, 0.5);
});

test('overlapPair pulls the incoming card back by the overlap and preserves its duration', () => {
  const out = { t_start: 0, t_end: 3 };
  const inc = { t_start: 3.5, t_end: 6 }; // duration 2.5
  const shifted = overlapPair(out, inc); // default overlap = TRANSITION_OVERLAP_S
  assert.strictEqual(shifted.t_start, Number((3 - C.TRANSITION_OVERLAP_S).toFixed(3)));
  assert.strictEqual(Number((shifted.t_end - shifted.t_start).toFixed(3)), 2.5); // duration preserved
});

test('overlapPair clamps the first card so t_start never goes negative', () => {
  const shifted = overlapPair({ t_start: 0, t_end: 0.1 }, { t_start: 0.1, t_end: 1 }, 0.5);
  assert.strictEqual(shifted.t_start, 0);
});

test('overlapPair does not mutate its inputs', () => {
  const inc = { t_start: 3.5, t_end: 6 };
  overlapPair({ t_start: 0, t_end: 3 }, inc);
  assert.strictEqual(inc.t_start, 3.5); // unchanged
});

test('planHandoffs emits a record per adjacent handoff pair and picks transitions', () => {
  const moments = [
    { id: 'a', move_type: 'card', t_start: 0, t_end: 3 },
    { id: 'b', move_type: 'card', t_start: 3, t_end: 6 },     // same family -> scale-swap
    { id: 'k', move_type: 'caption-track', t_start: 0, t_end: 10 }, // track: skipped
    { id: 'c', move_type: 'image', t_start: 6, t_end: 9 },    // card->image -> blur-crossfade
  ];
  const { handoffs } = planHandoffs(moments);
  assert.strictEqual(handoffs.length, 2);
  assert.strictEqual(handoffs[0].transition, 'scale-swap');   // a->b
  assert.strictEqual(handoffs[1].transition, 'blur-crossfade'); // b->c
  assert.strictEqual(handoffs[0].applied, false);             // default is non-destructive
});

test('planHandoffs apply:true overlaps the cards; climaxIds force zoom-through', () => {
  const moments = [
    { id: 'a', move_type: 'card', t_start: 0, t_end: 3 },
    { id: 'b', move_type: 'hero', t_start: 3.4, t_end: 7 },
  ];
  const { moments: out, handoffs } = planHandoffs(moments, { apply: true, climaxIds: ['b'] });
  assert.strictEqual(handoffs[0].transition, 'zoom-through');
  assert.strictEqual(out[1].t_start, Number((3 - C.TRANSITION_OVERLAP_S).toFixed(3)));
  assert.strictEqual(handoffs[0].applied, true);
  // original untouched
  assert.strictEqual(moments[1].t_start, 3.4);
});

test('transitionSpec returns a seek-safe shape (opacity/scale/ease only) for every vocab entry', () => {
  const SAFE_KEYS = new Set(['opacity', 'scale', 'x', 'y', 'rotation']);
  for (const kind of TRANSITIONS) {
    const spec = transitionSpec(kind);
    assert.ok(spec.out && spec.in, `${kind} has out+in`);
    for (const side of ['out', 'in']) {
      for (const phase of ['from', 'to']) {
        for (const k of Object.keys(spec[side][phase])) {
          assert.ok(SAFE_KEYS.has(k), `${kind}.${side}.${phase} key ${k} must be a seek-safe transform/opacity`);
        }
      }
    }
  }
});

test('transitionSpec falls back to blur-crossfade for an unknown kind', () => {
  assert.strictEqual(transitionSpec('nope'), TRANSITION_SPECS['blur-crossfade']);
});

test('zoom-through uses out-family climax easing; hard-cut is instant', () => {
  assert.strictEqual(transitionSpec('zoom-through').out.ease, 'power3.in');
  assert.strictEqual(transitionSpec('zoom-through').in.ease, 'power3.out');
  assert.strictEqual(transitionSpec('hard-cut').out.instant, true);
});

test('planHandoffs attaches the render spec to each handoff', () => {
  const moments = [
    { id: 'a', move_type: 'card', t_start: 0, t_end: 3 },
    { id: 'b', move_type: 'card', t_start: 3, t_end: 6 },
  ];
  const { handoffs } = planHandoffs(moments);
  assert.strictEqual(handoffs[0].transition, 'scale-swap');
  assert.strictEqual(handoffs[0].spec, TRANSITION_SPECS['scale-swap']);
});

test('planHandoffs with a custom overlap window', () => {
  const moments = [
    { id: 'a', move_type: 'card', t_start: 0, t_end: 3 },
    { id: 'b', move_type: 'quote', t_start: 3, t_end: 6 },
  ];
  const { moments: out } = planHandoffs(moments, { apply: true, overlap: 0.5 });
  assert.strictEqual(out[1].t_start, 2.5);
});

// ── B5: per-transition co-visibility window (Rauno hardening) ──────────────
test('overlapFor: calm dissolves get the longer blur window, tight morphs the tighter one', () => {
  assert.strictEqual(overlapFor('blur-crossfade'), C.TRANSITION_OVERLAP_BLUR_S); // 0.3
  assert.strictEqual(overlapFor('crossfade'), C.TRANSITION_OVERLAP_BLUR_S);      // 0.3
  assert.strictEqual(overlapFor('zoom-through'), C.TRANSITION_OVERLAP_S);        // 0.15
  assert.strictEqual(overlapFor('scale-swap'), C.TRANSITION_OVERLAP_S);          // 0.15
  assert.strictEqual(overlapFor('card-morph'), C.TRANSITION_OVERLAP_S);          // 0.15
  assert.strictEqual(overlapFor('hard-cut'), 0);                                 // instant
  // the two windows must actually differ, else the split is a no-op
  assert.ok(C.TRANSITION_OVERLAP_BLUR_S > C.TRANSITION_OVERLAP_S);
});

test('overlapFor: unknown kind falls back to the calm/premium blur window', () => {
  assert.strictEqual(overlapFor('nope'), C.TRANSITION_OVERLAP_BLUR_S);
});

test('OVERLAP_BY_TRANSITION covers every vocab entry except hard-cut logic', () => {
  for (const kind of TRANSITIONS) {
    assert.ok(Object.prototype.hasOwnProperty.call(OVERLAP_BY_TRANSITION, kind), `${kind} has an overlap window`);
  }
});

test('planHandoffs: a blur-crossfade pair applies the longer 0.3s overlap', () => {
  const moments = [
    { id: 'a', move_type: 'card', t_start: 0, t_end: 3 },
    { id: 'b', move_type: 'image', t_start: 3, t_end: 6 }, // card->image -> blur-crossfade
  ];
  const { moments: out, handoffs } = planHandoffs(moments, { apply: true });
  assert.strictEqual(handoffs[0].transition, 'blur-crossfade');
  assert.strictEqual(handoffs[0].overlap, C.TRANSITION_OVERLAP_BLUR_S);
  assert.strictEqual(out[1].t_start, Number((3 - C.TRANSITION_OVERLAP_BLUR_S).toFixed(3)));
});

test('planHandoffs: a scale-swap pair keeps the tighter 0.15s overlap', () => {
  const moments = [
    { id: 'a', move_type: 'card', t_start: 0, t_end: 3 },
    { id: 'b', move_type: 'card', t_start: 3, t_end: 6 }, // same family -> scale-swap
  ];
  const { moments: out, handoffs } = planHandoffs(moments, { apply: true });
  assert.strictEqual(handoffs[0].transition, 'scale-swap');
  assert.strictEqual(handoffs[0].overlap, C.TRANSITION_OVERLAP_S);
  assert.strictEqual(out[1].t_start, Number((3 - C.TRANSITION_OVERLAP_S).toFixed(3)));
});

test('planHandoffs: an explicit opts.overlap still forces the window for every pair', () => {
  const moments = [
    { id: 'a', move_type: 'card', t_start: 0, t_end: 3 },
    { id: 'b', move_type: 'image', t_start: 3, t_end: 6 }, // would be blur-crossfade (0.3) by default
  ];
  const { handoffs } = planHandoffs(moments, { apply: true, overlap: 0.5 });
  assert.strictEqual(handoffs[0].overlap, 0.5);
});
