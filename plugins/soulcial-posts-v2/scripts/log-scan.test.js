'use strict';
/*
 * log-scan.test.js — dependency-free test harness for the single writer.
 * Each test runs against a throwaway temp home (homeDir override) so the real ~/.claude is never touched.
 *   node log-scan.test.js
 * Covers plan tests A B C C2 D E F H I J + the 6a regulated-card force-null path.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { logScan } = require('./log-scan.js');

let pass = 0, failN = 0;
function ok(name, cond, extra) { if (cond) { pass++; console.log('  PASS', name); } else { failN++; console.error('  FAIL', name, extra || ''); } }

function freshHome() { return fs.mkdtempSync(path.join(os.tmpdir(), 'scanlog-')); }
function scansDir(home) { return path.join(home, '.claude', 'projects', 'soulcial-grader-log', 'scans'); }
function readAll(home) {
  const d = scansDir(home);
  let files = [];
  try { files = fs.readdirSync(d).filter((f) => f.endsWith('.jsonl')); } catch { return []; }
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(d, f), 'utf8').trim()));
}
function baseRec(over) {
  return Object.assign({
    scan_id: crypto.randomUUID(),
    client_slug: 'the-example-client', mode: 'self', project: 'example-posts', platform: 'instagram',
    caller: 'post-grader-v2', overall: 8.4, gate: 'PASS',
    dims: { hook_strength: 8, curiosity_specificity: 7, emotional_charge: 8, share_worthiness: 7, voice_match: 9, polarity: 6, platform_fit: 8 },
    voice_audit: 'clean', top_fix_tags: [], image_version: 'v2', post_excerpt: 'hello world', post_ref: null,
  }, over);
}
function writeCard(home, regLine) {
  const dir = path.join(home, '.claude', 'references', 'social-spine', 'clients');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'the-example-client.md'), `---\nslug: the-example-client\n${regLine}\n---\nbody\n`);
}

// A — self → excerpt kept
(() => { const h = freshHome(); const r = logScan(baseRec(), { homeDir: h }); const recs = readAll(h);
  ok('A self excerpt kept', r.ok && recs.length === 1 && recs[0].post_excerpt === 'hello world', JSON.stringify(r)); })();

// B — client → excerpt forced null, post_ref present kept
(() => { const h = freshHome(); const r = logScan(baseRec({ mode: 'client', post_ref: 'the-example-client-posts/p10.md', post_excerpt: 'leaky' }), { homeDir: h });
  const recs = readAll(h); ok('B client excerpt null + post_ref kept', r.ok && recs[0].post_excerpt === null && recs[0].post_ref === 'the-example-client-posts/p10.md', JSON.stringify(recs[0])); })();

// C — post_text injected → dropped
(() => { const h = freshHome(); const r = logScan(baseRec({ post_text: 'SECRET BODY' }), { homeDir: h });
  const recs = readAll(h); ok('C post_text dropped', r.ok && !('post_text' in recs[0]), JSON.stringify(Object.keys(recs[0]))); })();

// C2 — __proto__ in dims → rejected, no pollution
(() => { const h = freshHome(); const base = baseRec();
  const raw = JSON.stringify(base).replace('"dims":{', '"dims":{"__proto__":{"polluted":1},');
  const r = logScan(raw, { homeDir: h });
  ok('C2 __proto__ dims rejected', r.ok === false && readAll(h).length === 0, JSON.stringify(r));
  ok('C2 no prototype pollution', ({}).polluted === undefined); })();

// D — same scan_id twice → one file, second is dup
(() => { const h = freshHome(); const rec = baseRec(); const r1 = logScan(rec, { homeDir: h }); const r2 = logScan(rec, { homeDir: h });
  ok('D dedup one file', r1.ok && r2.ok && r2.dup === true && readAll(h).length === 1, JSON.stringify(r2)); })();

// E — bad gate → no write; missing dim key → no write
(() => { const h = freshHome(); const r = logScan(baseRec({ gate: 'NOPE' }), { homeDir: h });
  ok('E bad gate rejected', r.ok === false && readAll(h).length === 0, JSON.stringify(r));
  const h2 = freshHome(); const bad = baseRec(); delete bad.dims.polarity; const r2 = logScan(bad, { homeDir: h2 });
  ok('E missing dim rejected', r2.ok === false && readAll(h2).length === 0, JSON.stringify(r2)); })();

// F — no card → today's behavior (self excerpt kept) == A with a client-ish slug and no card
(() => { const h = freshHome(); const r = logScan(baseRec({ client_slug: 'brand-x', post_excerpt: 'kept' }), { homeDir: h });
  ok('F no card → excerpt kept', r.ok && readAll(h)[0].post_excerpt === 'kept', JSON.stringify(r)); })();

// 6a — regulated card + self mode → excerpt forced null (card outranks mode)
(() => { const h = freshHome(); writeCard(h, 'regulated: true'); const r = logScan(baseRec({ mode: 'self', post_excerpt: 'leak' }), { homeDir: h });
  ok('6a regulated card forces null', r.ok && readAll(h)[0].post_excerpt === null, JSON.stringify(r));
  const h2 = freshHome(); writeCard(h2, 'regulated: false'); const r2 = logScan(baseRec({ mode: 'self', post_excerpt: 'okvisible' }), { homeDir: h2 });
  ok('6a regulated:false keeps excerpt (self)', r2.ok && readAll(h2)[0].post_excerpt === 'okvisible', JSON.stringify(r2));
  const h3 = freshHome(); writeCard(h3, 'regulated: DELETED-GIBBERISH'); const r3 = logScan(baseRec({ mode: 'self', post_excerpt: 'leak' }), { homeDir: h3 });
  ok('6a unparseable regulated → fail-closed null', r3.ok && readAll(h3)[0].post_excerpt === null, JSON.stringify(r3)); })();

// H — logger forced to fail (scans path is a FILE) → {ok:false} + errors.log line
(() => { const h = freshHome(); const root = path.join(h, '.claude', 'projects', 'soulcial-grader-log');
  fs.mkdirSync(root, { recursive: true }); fs.writeFileSync(path.join(root, 'scans'), 'i am a file, not a dir');
  const r = logScan(baseRec(), { homeDir: h });
  const errLog = path.join(root, 'log-scan.errors.log');
  ok('H forced-fail returns ok:false', r.ok === false, JSON.stringify(r));
  ok('H errors.log written', fs.existsSync(errLog) && fs.readFileSync(errLog, 'utf8').trim().length > 0); })();

// I — slug traversal AND scan_id traversal → both rejected, no write
(() => { const h = freshHome(); const r1 = logScan(baseRec({ client_slug: '../../etc' }), { homeDir: h });
  ok('I slug traversal rejected', r1.ok === false, JSON.stringify(r1));
  const h2 = freshHome(); const r2 = logScan(baseRec({ scan_id: '../../x' }), { homeDir: h2 });
  ok('I scan_id traversal rejected', r2.ok === false && readAll(h2).length === 0, JSON.stringify(r2)); })();

// J — pipe/newline in self excerpt → stripped
(() => { const h = freshHome(); const r = logScan(baseRec({ post_excerpt: 'line1|pipe\nline2\rtail' }), { homeDir: h });
  const ex = readAll(h)[0].post_excerpt; ok('J pipe/newline stripped', r.ok && !/[|\r\n]/.test(ex), JSON.stringify(ex)); })();

// K — voice_audit stuffed with a long body + pipes/newlines → capped ≤200 + stripped (boundary)
(() => { const h = freshHome(); const big = 'X'.repeat(500) + '|leak\nmore'; const r = logScan(baseRec({ voice_audit: big }), { homeDir: h });
  const va = readAll(h)[0].voice_audit; ok('K voice_audit capped', r.ok && Array.from(va).length === 200, `len=${va && Array.from(va).length}`);
  ok('K voice_audit stripped', r.ok && !/[|\r\n]/.test(va)); })();

// L — post_ref sandbox: {slug}-posts and {slug}-social-engine accepted; cross-client rejected
(() => { const h = freshHome(); const r1 = logScan(baseRec({ mode: 'client', post_ref: 'the-example-client-posts/post-10.md' }), { homeDir: h });
  ok('L {slug}-posts accepted', r1.ok, JSON.stringify(r1));
  const h2 = freshHome(); const r2 = logScan(baseRec({ mode: 'client', post_ref: 'the-example-client-social-engine/p.md' }), { homeDir: h2 });
  ok('L {slug}-social-engine accepted', r2.ok, JSON.stringify(r2));
  const h3 = freshHome(); const r3 = logScan(baseRec({ mode: 'client', post_ref: 'other-client/p.md' }), { homeDir: h3 });
  ok('L cross-client post_ref rejected', r3.ok === false && readAll(h3).length === 0, JSON.stringify(r3)); })();

// M — errors.log injection: a dims key with a newline must NOT forge extra log lines
(() => { const h = freshHome(); const base = baseRec();
  const raw = JSON.stringify(base).replace('"dims":{', '"dims":{"evil\\nFORGED\\tLINE":1,');
  const r = logScan(raw, { homeDir: h });
  const errLog = path.join(h, '.claude', 'projects', 'soulcial-grader-log', 'log-scan.errors.log');
  const lines = fs.existsSync(errLog) ? fs.readFileSync(errLog, 'utf8').split('\n').filter(Boolean) : [];
  ok('M dims-key rejected', r.ok === false, JSON.stringify(r));
  ok('M errors.log not forged (one line)', lines.length === 1 && !/FORGED/.test(lines[0].replace(/dims-extra-key.*/, '')), JSON.stringify(lines)); })();

console.log(`\n${pass} passed, ${failN} failed`);
process.exit(failN ? 1 : 0);
