const { test } = require('node:test');
const assert = require('node:assert');
const { frozenFraction, fidelityOk, parseFreezeIntervals } = require('../verify-fidelity.js');

test('frozenFraction sums intervals over duration', () => {
  assert.strictEqual(frozenFraction([[10, 13], [20, 22]], 100), 0.05); // (3+2)/100
  assert.strictEqual(frozenFraction([], 100), 0);
});

test('fidelityOk: rendered must not exceed source frozen fraction', () => {
  assert.strictEqual(fidelityOk(0.04, 0.05), true);
  assert.strictEqual(fidelityOk(0.06, 0.05), false);
});

test('parseFreezeIntervals parses matched start/end pairs', () => {
  const stderr = 'freeze_start: 10.0\nfreeze_end: 13.0\nfreeze_start: 20.0\nfreeze_end: 22.0\n';
  assert.deepStrictEqual(parseFreezeIntervals(stderr, 100), [[10, 13], [20, 22]]);
});

test('parseFreezeIntervals closes a trailing open freeze at duration', () => {
  const stderr = 'freeze_start: 90.0\n'; // no freeze_end -> runs to end
  assert.deepStrictEqual(parseFreezeIntervals(stderr, 100), [[90, 100]]);
});

test('parseFreezeIntervals throws on an unrecoverable mismatch', () => {
  const stderr = 'freeze_start: 10.0\nfreeze_start: 20.0\nfreeze_end: 22.0\n'; // 2 starts, 1 end, no duration to close
  assert.throws(() => parseFreezeIntervals(stderr, null), /mismatch/i);
});
