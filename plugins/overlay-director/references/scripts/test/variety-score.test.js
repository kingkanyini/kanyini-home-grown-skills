const { test } = require('node:test');
const assert = require('node:assert');
const { varietyScore, top3MoveShare, top3TypeShare, isCalcified, maxConcurrentCards, concurrencyFlag,
  collectEaseStrings, distinctEasings, distinctMechanisms, belowMinEasings, motionVariety } = require('../variety-score.js');
const C = require('../constants.js');

test('empty plan: score 1, share 0', () => {
  assert.deepStrictEqual(varietyScore([], 0), { variety_score: 1, D: 1, R: 1, W: 1 });
  assert.strictEqual(top3MoveShare([]), 0);
});

test('all identical move_type, no heroes: low diversity + run violations', () => {
  const m = Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, move_id: 'liquid-glass-card', move_type: 'card', hero: false, t_start: i * 10 }));
  const r = varietyScore(m, 60);
  // D = 1/6; violations: i=1..5 each repeat within window => 5 violations; R = 1 - 5/5 = 0
  assert.ok(Math.abs(r.D - 1 / 6) < 1e-9);
  assert.strictEqual(r.R, 0);
  // single 90s bucket with 6 moments, 1 distinct type => not diverse; eligible=1 diverse=0 => W=0
  assert.strictEqual(r.W, 0);
  assert.strictEqual(r.variety_score, Number((0.4 * (1 / 6)).toFixed(2)));
  assert.strictEqual(top3MoveShare(m), 1);
});

test('hero exempts a repeat from run violation', () => {
  const m = [
    { id: 'a', move_id: 'x', move_type: 'card', hero: false, t_start: 0 },
    { id: 'b', move_id: 'x', move_type: 'card', hero: true,  t_start: 10 },
    { id: 'c', move_id: 'y', move_type: 'pill', hero: false, t_start: 20 },
  ];
  const r = varietyScore(m, 30);
  // i=1 is hero -> not a violation; i=2 differs -> not a violation; violations=0 -> R=1
  assert.strictEqual(r.R, 1);
});

test('fully varied alternating types in one window: high score', () => {
  const m = [
    { id: 'a', move_id: 'x', move_type: 'card', hero: false, t_start: 0 },
    { id: 'b', move_id: 'y', move_type: 'pill', hero: false, t_start: 30 },
    { id: 'c', move_id: 'z', move_type: 'quote', hero: false, t_start: 60 },
  ];
  const r = varietyScore(m, 90);
  // D = 3/3 = 1; violations 0 -> R=1; one 90s bucket [0,90) has 3 moments 3 types -> eligible=1 diverse=1 -> W=1
  assert.strictEqual(r.variety_score, 1);
});

test('top3MoveShare picks the three most frequent move_ids', () => {
  const m = [
    ...Array(4).fill({ move_id: 'a' }), ...Array(3).fill({ move_id: 'b' }),
    ...Array(2).fill({ move_id: 'c' }), ...Array(1).fill({ move_id: 'd' }),
  ];
  // top3 = a,b,c = 9 of 10
  assert.strictEqual(top3MoveShare(m), 0.9);
});

test('D-normalization: long video cycling the full library scores D=1, not distinct/N', () => {
  // 40 cards across 8 move_types; without normalization D would be 8/40=0.2
  const types = ['card', 'hero', 'pill', 'quote', 'image', 'split', 'stack', 'lower-third'];
  const m = Array.from({ length: 40 }, (_, i) => ({ id: `c${i}`, move_id: `mv${i % 8}`, move_type: types[i % 8], hero: false, t_start: i * 5 }));
  const r = varietyScore(m, 200, 8); // libraryTypeCount = 8
  assert.strictEqual(r.D, 1); // min(40,8)=8 distinct=8 -> 1
});

test('top3TypeShare counts by family (move_type), not specific move', () => {
  const m = [
    { move_id: 'a1', move_type: 'card' }, { move_id: 'a2', move_type: 'card' },
    { move_id: 'b1', move_type: 'pill' }, { move_id: 'c1', move_type: 'quote' },
  ];
  // types: card=2, pill=1, quote=1 -> top3 = all 3 types = 4/4 = 1
  assert.strictEqual(top3TypeShare(m), 1);
  // by move_id all distinct -> top3 = 3/4 = 0.75
  assert.strictEqual(top3MoveShare(m), 0.75);
});

test('isCalcified is N-gated: short plans never flag', () => {
  assert.strictEqual(isCalcified(0.9, 4), false);  // below N gate
  assert.strictEqual(isCalcified(0.9, 8), true);   // N>=8 and share>0.6
  assert.strictEqual(isCalcified(0.5, 8), false);  // share below threshold
});

// ── motion variety (Layer 1) ──────────────────────────────────────────────
test('collectEaseStrings unions explicit easings[], per-axis eases, and archetype-derived (raw strings)', () => {
  const m = [
    { easings: ['power3.out', 'power1.in'] },
    { ease: 'sine.inOut' },
    { entrance_archetype: 'POP' },              // derives ENTRANCE_POP_EASE
    { entrance_ease: 'none', exit_ease: 'power1.in' },
  ];
  const arr = collectEaseStrings(m);
  assert.ok(arr.includes('power3.out') && arr.includes('power1.in') && arr.includes('sine.inOut'));
  assert.ok(arr.includes(C.ENTRANCE_POP_EASE)); // back.out(1.4)
  assert.ok(arr.includes('none'));
});

test('archetype-derived ease is skipped when an explicit entrance ease is present', () => {
  // SMOOTH archetype but an explicit entrance_ease -> only the explicit one counts, not the derived default
  const arr = collectEaseStrings([{ entrance_archetype: 'SMOOTH', entrance_ease: 'expo.out' }]);
  assert.deepStrictEqual(arr, ['expo.out']);
});

test('distinctEasings counts FAMILIES not raw strings (L1-1 / PHANTOM#3)', () => {
  // three DISTINCT back.out strings collapse to ONE 'back' family
  const bouncy = [{ ease: 'back.out(1.4)' }, { ease: 'back.out(2.5)' }, { ease: 'back.out(1.7)' }];
  assert.strictEqual(distinctEasings(bouncy), 1);
  assert.strictEqual(belowMinEasings(bouncy), true); // N>=3 and only 1 family -> monotone flag fires
  // power3.out + power1.in + back.out(1.4) + none = 4 families
  assert.strictEqual(distinctEasings(
    [{ ease: 'power3.out' }, { ease: 'power1.in' }, { ease: 'back.out(1.4)' }, { ease: 'none' }]), 4);
});

test('distinctMechanisms counts entrance_mechanism values', () => {
  const m = [
    { entrance_mechanism: 'SCALE-POP' }, { entrance_mechanism: 'SCALE-POP' },
    { entrance_mechanism: 'RISE' }, { entrance_mechanism: 'CLIP-REVEAL' }, {},
  ];
  assert.strictEqual(distinctMechanisms(m), 3);
});

test('belowMinEasings flags a monotone plan but is N-gated', () => {
  // 4 cards all power2.out -> 1 distinct family -> below the >=3 floor
  const monotone = Array.from({ length: 4 }, () => ({ ease: 'power2.out' }));
  assert.strictEqual(distinctEasings(monotone), 1);
  assert.strictEqual(belowMinEasings(monotone), true);
  // a varied plan clears the floor
  const varied = [{ ease: 'power3.out' }, { ease: 'power1.in' }, { ease: 'back.out(1.4)' }, { ease: 'none' }];
  assert.strictEqual(belowMinEasings(varied), false);
  // a 2-card plan can't physically carry 3 eases -> never flagged (N gate)
  assert.strictEqual(belowMinEasings([{ ease: 'power2.out' }, { ease: 'power2.out' }]), false);
});

test('motionVariety returns the plan facet with the constant floor', () => {
  const mv = motionVariety([
    { entrance_mechanism: 'SCALE-POP', ease: 'power3.out', exit_ease: 'power1.in' },
    { entrance_mechanism: 'RISE', ease: 'back.out(2.5)' },
    { entrance_mechanism: 'DRAW', ease: 'none' },
  ]);
  assert.strictEqual(mv.distinct_mechanisms, 3);
  assert.ok(mv.distinct_easings >= 4);   // power3, power1, back, none
  assert.strictEqual(mv.below_min_easings, false);
  assert.strictEqual(mv.min_distinct_easings, C.MIN_DISTINCT_EASINGS);
});

test('maxConcurrentCards counts overlapping lifetimes; back-to-back is not overlap', () => {
  const overlapping = [
    { t_start: 0, t_end: 10 }, { t_start: 2, t_end: 12 }, { t_start: 4, t_end: 6 },
  ];
  assert.strictEqual(maxConcurrentCards(overlapping), 3);
  assert.strictEqual(concurrencyFlag(overlapping), true); // > 2
  const sequential = [
    { t_start: 0, t_end: 5 }, { t_start: 5, t_end: 10 }, { t_start: 10, t_end: 15 },
  ];
  assert.strictEqual(maxConcurrentCards(sequential), 1);
  assert.strictEqual(concurrencyFlag(sequential), false);
});
