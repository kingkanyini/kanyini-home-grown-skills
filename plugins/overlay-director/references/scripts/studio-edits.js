// Applies Studio edits onto a plan, GSAP-safely. Pure: caller resolves move_type after swap.
function applyEdits(plan, studioEdits) {
  const next = JSON.parse(JSON.stringify(plan));
  const byId = new Map(next.moments.map(m => [m.id, m]));
  const deleted = new Set();

  for (const e of studioEdits.edits) {
    const m = byId.get(e.moment_id);
    switch (e.op) {
      case 'move':
        if (!m) break;
        m.placement.mode = 'inline';
        m.placement.left = e.computed_left;   // pre-GSAP computed px (principle 2)
        m.placement.top = e.computed_top;
        break;
      case 'retime': {
        if (!m) break;
        const d = e.delta_t || 0;
        m.timing.data_start += d;             // move the card as a unit (principle 9)
        m.timing.gsap_beats = m.timing.gsap_beats.map(b => Number((b + d).toFixed(3)));
        break;
      }
      case 'swap-move':
        if (m) m.move_id = e.new_move_id;     // move_type re-resolved by orchestrator from frontmatter
        break;
      case 'rewrite-copy':
        if (m) { m.copy = e.new_copy; m.copy_provenance = 'distilled'; }
        break;
      case 'delete':
        if (m) deleted.add(e.moment_id);
        break;
      case 'add':
        if (e.moment) { next.moments.push(e.moment); byId.set(e.moment.id, e.moment); }
        break;
    }
  }
  next.moments = next.moments.filter(m => !deleted.has(m.id));
  return next;
}

module.exports = { applyEdits };

// CLI: node studio-edits.js <plan.json> <studio-edits.json> [out.json]
// Bakes edits into the plan; writes to out.json if given, else stdout.
if (require.main === module) {
  const fs = require('node:fs');
  const plan = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const edits = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
  const out = JSON.stringify(applyEdits(plan, edits), null, 2);
  if (process.argv[4]) fs.writeFileSync(process.argv[4], out);
  else process.stdout.write(out);
}
