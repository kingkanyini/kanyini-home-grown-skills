const C = require('./constants.js');
const { isCalcified } = require('./variety-score.js');

function mmss(s) {
  const t = Math.max(0, Math.round(s));
  const m = Math.floor(t / 60), sec = t % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function planToTable(plan) {
  const lines = [];
  lines.push(`### Plan — ${plan.mode} / ${plan.type}`);
  // Calcification is judged on the FAMILY (move_type) share, gated on card count.
  const typeShare = plan.top3_type_share != null ? plan.top3_type_share : plan.top3_move_share;
  const calc = isCalcified(typeShare, plan.moments.length);
  const typeLine = plan.top3_type_share != null ? `  ·  top3_type_share: ${plan.top3_type_share}` : '';
  lines.push(`variety_score: ${plan.variety_score}  ·  top3_move_share: ${plan.top3_move_share}${typeLine}` + (calc ? `  ·  ⚠️ CALCIFICATION (>${C.CALCIFICATION_FLAG}, N≥${C.CALCIFICATION_MIN_N})` : ''));
  lines.push('');
  lines.push('| # | Time | Move | Type | Copy | Src | Place | Tier | Hero |');
  lines.push('|---|------|------|------|------|-----|-------|------|------|');
  for (const m of plan.moments) {
    lines.push(`| ${m.id} | ${mmss(m.t_start)}–${mmss(m.t_end)} | ${m.move_id} | ${m.move_type} | ${(m.copy || '').slice(0, 40)} | ${m.copy_provenance === 'verbatim' ? 'Q' : 'D'} | ${m.placement.mode} | ${m.density_tier} | ${m.hero ? '★' : ''} |`);
  }
  return lines.join('\n');
}

module.exports = { planToTable };

// CLI: node plan-to-table.js <plan.json>  -> writes the review table to stdout
if (require.main === module) {
  const fs = require('node:fs');
  const plan = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  process.stdout.write(planToTable(plan));
}
