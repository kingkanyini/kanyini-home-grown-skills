const { test } = require('node:test');
const assert = require('node:assert');
const { planToTable } = require('../plan-to-table.js');

const plan = {
  mode: 'MVP', type: 'tutorial', variety_score: 0.72, top3_move_share: 0.66,
  moments: [
    { id: 'm1', t_start: 12.4, t_end: 17, move_id: 'liquid-glass-card', move_type: 'card',
      copy: 'Level up', copy_provenance: 'distilled', hero: false,
      placement: { mode: 'content-area' }, density_tier: 'base' },
  ],
};

test('renders header, mode line, and one row', () => {
  const out = planToTable(plan);
  assert.match(out, /MVP \/ tutorial/);
  assert.match(out, /variety_score: 0\.72/);
  assert.match(out, /m1/);
  assert.match(out, /liquid-glass-card/);
  assert.match(out, /00:12/); // t_start formatted mm:ss
});

// build a plan with N moments so the calcification N-gate is satisfied
function bigPlan(typeShare) {
  const moments = Array.from({ length: 8 }, (_, i) => ({
    id: `m${i}`, t_start: i * 10, t_end: i * 10 + 4, move_id: 'liquid-glass-card', move_type: 'card',
    copy: 'x', copy_provenance: 'distilled', hero: false, placement: { mode: 'content-area' }, density_tier: 'base',
  }));
  return { mode: 'MVP', type: 'tutorial', variety_score: 0.5, top3_move_share: 0.9, top3_type_share: typeShare, moments };
}

test('flags calcification when move_type share exceeds threshold AND N>=8', () => {
  const out = planToTable(bigPlan(0.66)); // 0.66 > 0.60, N=8
  assert.match(out, /CALCIFICATION/);
});

test('no calcification flag below threshold', () => {
  const out = planToTable(bigPlan(0.40));
  assert.doesNotMatch(out, /CALCIFICATION/);
});

test('no calcification flag for short plans even above threshold (N-gate)', () => {
  const out = planToTable(plan); // 1 moment, top3_move_share 0.66 -> below N gate
  assert.doesNotMatch(out, /CALCIFICATION/);
});
