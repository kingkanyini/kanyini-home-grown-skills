// Runs the motion gate on all 12 effects, writes gate-results.json (per-effect pass + the
// LF-normalized sha256 of the _impl file it gated), exits nonzero if any fail.
// The recorded hash lets the render preflight refuse to ship an effect that changed since it was gated.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const { gateEffect } = require('./motion-gate.js');
const IMPL = path.join(__dirname, '..');
const ORDER = ['liquid-glass-card','center-hero','full-frame-quote','image-card','lower-third','top-pill',
  'bottom-rise','split-card','sandwich-stack','bouncing-arrows','reading-spotlight','karaoke-caption'];
const sha = s => crypto.createHash('sha256').update(s.replace(/\r\n/g,'\n'),'utf8').digest('hex');

(async () => {
  const results = {}; let allPass = true;
  for (const id of ORDER) {
    let r; try { r = await gateEffect(id); } catch (e) { r = { pass:false, failures:['gate threw: '+e.message] }; }
    const hash = sha(fs.readFileSync(path.join(IMPL, `${id}.html`), 'utf8'));
    results[id] = { pass: r.pass, hash, failures: r.failures || [] };
    if (!r.pass) allPass = false;
    console.log(`${id}: ${r.pass ? 'PASS' : 'FAIL ' + JSON.stringify(r.failures)}`);
  }
  // stable output (no timestamp) so git only churns when a verdict/hash actually changes
  fs.writeFileSync(path.join(__dirname, 'gate-results.json'),
    JSON.stringify({ allPass, results }, null, 2).replace(/\r\n/g,'\n') + '\n', 'utf8');
  console.log(allPass ? 'ALL 12 PASS' : 'SOME FAILED');
  process.exit(allPass ? 0 : 1);
})();
