const { test } = require('node:test');
const assert = require('node:assert');
const P = require('../seek-probe.js');

// Only the PURE comparator is unit-tested — the browser driver (probeImpl) is an integration
// gate run at Phase 5 with the gate harness's Chromium, not in the fast unit suite.

test('valuesEqual: opacity within tolerance; matrix strings need exact match', () => {
  assert.ok(P.valuesEqual('0.500', '0.502', 0.01));   // numeric within tol
  assert.ok(!P.valuesEqual('0.5', '0.7', 0.01));       // numeric out of tol
  assert.ok(P.valuesEqual('matrix(1,0,0,1,0,0)', 'matrix(1,0,0,1,0,0)', 0)); // exact
  assert.ok(!P.valuesEqual('matrix(1,0,0,1,0,0)', 'matrix(0.9,0,0,0.9,0,0)', 0));
  assert.ok(!P.valuesEqual('blur(0px)', 'blur(6px)', 0)); // stale filter mismatch
});

test('diffSampleSets: identical forward/backward is seek-safe (no mismatch)', () => {
  const fwd = { '0': { t0: { opacity: '0', transform: 'none' } }, '1': { t0: { opacity: '1', transform: 'matrix(1,0,0,1,0,0)' } } };
  const bwd = JSON.parse(JSON.stringify(fwd));
  assert.deepStrictEqual(P.diffSampleSets(fwd, bwd), []);
});

test('diffSampleSets: a filter that goes stale on backward seek is flagged', () => {
  // forward reaches sharp (blur(0)); backward seek leaves it stale (blur(6px))
  const fwd = { '0.5': { t0: { opacity: '1', filter: 'blur(0px)' } } };
  const bwd = { '0.5': { t0: { opacity: '1', filter: 'blur(6px)' } } };
  const m = P.diffSampleSets(fwd, bwd);
  assert.strictEqual(m.length, 1);
  assert.strictEqual(m[0].prop, 'filter');
  assert.strictEqual(m[0].forward, 'blur(0px)');
  assert.strictEqual(m[0].backward, 'blur(6px)');
});

test('diffSampleSets: opacity drift beyond tolerance is flagged, within tolerance is not', () => {
  assert.strictEqual(P.diffSampleSets(
    { '0.5': { t0: { opacity: '0.5' } } }, { '0.5': { t0: { opacity: '0.9' } } }).length, 1);
  assert.strictEqual(P.diffSampleSets(
    { '0.5': { t0: { opacity: '0.500' } } }, { '0.5': { t0: { opacity: '0.503' } } }).length, 0);
});
