const { test } = require('node:test');
const assert = require('node:assert');
const { applyEdits } = require('../studio-edits.js');

const base = () => ({
  moments: [
    { id: 'm1', move_id: 'liquid-glass-card', move_type: 'card', copy: 'old', copy_provenance: 'distilled',
      placement: { mode: 'content-area' }, timing: { data_start: 10, gsap_beats: [10.4, 12, 15] } },
    { id: 'm2', move_id: 'top-pill', move_type: 'pill', copy: 'keep',
      placement: { mode: 'content-area' }, timing: { data_start: 30, gsap_beats: [30.4, 33] } },
  ],
});

test('move bakes inline left/top from pre-GSAP computed px', () => {
  const out = applyEdits(base(), { source: 'studio-json', edits: [{ moment_id: 'm1', op: 'move', computed_left: 220, computed_top: 140 }] });
  const m = out.moments.find(x => x.id === 'm1');
  assert.strictEqual(m.placement.mode, 'inline');
  assert.strictEqual(m.placement.left, 220);
  assert.strictEqual(m.placement.top, 140);
});

test('retime shifts data_start and ALL gsap beats by delta_t', () => {
  const out = applyEdits(base(), { source: 'studio-json', edits: [{ moment_id: 'm1', op: 'retime', delta_t: 2 }] });
  const m = out.moments.find(x => x.id === 'm1');
  assert.strictEqual(m.timing.data_start, 12);
  assert.deepStrictEqual(m.timing.gsap_beats, [12.4, 14, 17]);
});

test('swap-move changes move_id; rewrite-copy sets distilled provenance', () => {
  const out = applyEdits(base(), { source: 'studio-json', edits: [
    { moment_id: 'm1', op: 'swap-move', new_move_id: 'center-hero' },
    { moment_id: 'm2', op: 'rewrite-copy', new_copy: 'fresh' },
  ]});
  assert.strictEqual(out.moments.find(x => x.id === 'm1').move_id, 'center-hero');
  const m2 = out.moments.find(x => x.id === 'm2');
  assert.strictEqual(m2.copy, 'fresh');
  assert.strictEqual(m2.copy_provenance, 'distilled');
});

test('delete drops the moment', () => {
  const out = applyEdits(base(), { source: 'studio-json', edits: [{ moment_id: 'm2', op: 'delete' }] });
  assert.strictEqual(out.moments.length, 1);
  assert.strictEqual(out.moments[0].id, 'm1');
});

test('add appends a full moment supplied in the edit payload', () => {
  const moment = { id: 'm3', move_id: 'center-hero', move_type: 'hero', copy: 'new', copy_provenance: 'distilled',
    placement: { mode: 'frame-center' }, timing: { data_start: 50, gsap_beats: [50.4, 53] }, t_start: 50, hero: true };
  const out = applyEdits(base(), { source: 'studio-json', edits: [{ moment_id: 'm3', op: 'add', moment }] });
  assert.strictEqual(out.moments.length, 3);
  assert.strictEqual(out.moments[2].id, 'm3');
  assert.strictEqual(out.moments[2].move_type, 'hero');
});
