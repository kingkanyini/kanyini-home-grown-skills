const { test } = require('node:test');
const assert = require('node:assert');
const { holdTime, needsSplit } = require('../timing.js');

test('short copy clamps to MIN_HOLD (2.5s)', () => {
  assert.strictEqual(holdTime(2), 2.5); // 2/2.5 = 0.8 -> floor 2.5
});

test('mid copy scales by 2.5 wps', () => {
  assert.strictEqual(holdTime(8), 3.2); // 8/2.5 = 3.2, within [2.5, 4.5]
});

test('long copy clamps to MAX_HOLD (4.5s)', () => {
  assert.strictEqual(holdTime(20), 4.5); // 20/2.5 = 8 -> ceiling 4.5
});

test('needsSplit true only when read-time exceeds the ceiling', () => {
  assert.strictEqual(needsSplit(8), false);  // 3.2s
  assert.strictEqual(needsSplit(12), true);  // 4.8s > 4.5
});
