const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { isInside, isHeavy, scanProject, scanScratch, purgeProject } = require('../clean-scratch.js');

function tmpDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'od-clean-')); }
const NOW = 1_700_000_000_000; // fixed clock for deterministic ageDays

// Build a realistic project build folder; returns its path.
function makeProject(base, name) {
  const d = path.join(base, name);
  fs.mkdirSync(d, { recursive: true });
  // heavy (should be purged)
  fs.writeFileSync(path.join(d, 'source-densified.mp4'), Buffer.alloc(5000, 1));
  fs.writeFileSync(path.join(d, 'render.log'), Buffer.alloc(300, 1));
  fs.writeFileSync(path.join(d, 'contact-sheet.png'), Buffer.alloc(400, 1));
  fs.writeFileSync(path.join(d, 'audio16k.mp3'), Buffer.alloc(800, 1));
  fs.mkdirSync(path.join(d, 'frames'));
  fs.writeFileSync(path.join(d, 'frames', 'f0001.png'), Buffer.alloc(200, 1));
  fs.mkdirSync(path.join(d, '.thumbnails'));
  fs.writeFileSync(path.join(d, '.thumbnails', 't.png'), Buffer.alloc(100, 1));
  // kept (must survive)
  fs.writeFileSync(path.join(d, 'plan.json'), Buffer.alloc(120, 2));
  fs.writeFileSync(path.join(d, 'index.html'), Buffer.alloc(90, 2));
  fs.mkdirSync(path.join(d, 'renders'));
  fs.writeFileSync(path.join(d, 'renders', 'final.mp4'), Buffer.alloc(1000, 2));
  fs.mkdirSync(path.join(d, 'assets'));
  fs.writeFileSync(path.join(d, 'assets', 'art1.png'), Buffer.alloc(600, 2));
  fs.mkdirSync(path.join(d, '.git'));
  fs.writeFileSync(path.join(d, '.git', 'HEAD'), Buffer.alloc(40, 2));
  return d;
}

test('isHeavy classifies regenerable artifacts, protects keepers', () => {
  assert.strictEqual(isHeavy('source-densified.mp4', false), true);
  assert.strictEqual(isHeavy('render.log', false), true);
  assert.strictEqual(isHeavy('contact-sheet.png', false), true);
  assert.strictEqual(isHeavy('frames', true), true);
  assert.strictEqual(isHeavy('.thumbnails', true), true);
  // keepers
  assert.strictEqual(isHeavy('plan.json', false), false);
  assert.strictEqual(isHeavy('index.html', false), false);
  assert.strictEqual(isHeavy('renders', true), false);
  assert.strictEqual(isHeavy('assets', true), false);
  assert.strictEqual(isHeavy('.git', true), false);
});

test('scanProject separates heavy bytes from kept bytes', () => {
  const base = tmpDir();
  const d = makeProject(base, 'projA');
  const s = scanProject(d, NOW);
  assert.strictEqual(s.project, 'projA');
  assert.ok(s.heavyBytes > 0 && s.keptBytes > 0);
  assert.strictEqual(s.heavyBytes + s.keptBytes, s.totalBytes);
  // the densified mp4 is the biggest heavy item
  assert.strictEqual(s.heavyItems[0].name, 'source-densified.mp4');
});

test('scanScratch excludes the active project and sorts by heavy size', () => {
  const base = tmpDir();
  makeProject(base, 'small');
  const big = makeProject(base, 'big');
  fs.writeFileSync(path.join(big, 'extra-densified.mp4'), Buffer.alloc(99_000, 1));
  makeProject(base, 'current');
  const { projects } = scanScratch(base, { active: 'current', nowMs: NOW });
  const names = projects.map((p) => p.project);
  assert.ok(!names.includes('current'));        // active protected
  assert.strictEqual(projects[0].project, 'big'); // sorted desc by heavyBytes
});

test('purgeProject dry-run removes nothing but reports freed bytes', () => {
  const base = tmpDir();
  const d = makeProject(base, 'projA');
  const res = purgeProject(base, 'projA', { nowMs: NOW }); // apply defaults false
  assert.strictEqual(res.applied, false);
  assert.ok(res.freedBytes > 0);
  assert.ok(fs.existsSync(path.join(d, 'source-densified.mp4'))); // still there
});

test('purgeProject apply deletes heavy items, keeps render/assets/plan/.git', () => {
  const base = tmpDir();
  const d = makeProject(base, 'projA');
  const res = purgeProject(base, 'projA', { apply: true, nowMs: NOW });
  assert.ok(res.freedBytes > 0);
  // heavy gone
  assert.ok(!fs.existsSync(path.join(d, 'source-densified.mp4')));
  assert.ok(!fs.existsSync(path.join(d, 'render.log')));
  assert.ok(!fs.existsSync(path.join(d, 'frames')));
  assert.ok(!fs.existsSync(path.join(d, '.thumbnails')));
  // kept survive
  assert.ok(fs.existsSync(path.join(d, 'renders', 'final.mp4')));
  assert.ok(fs.existsSync(path.join(d, 'assets', 'art1.png')));
  assert.ok(fs.existsSync(path.join(d, 'plan.json')));
  assert.ok(fs.existsSync(path.join(d, '.git', 'HEAD')));
});

test('recurses into nested build dirs: sweeps nested densified/logs, protects nested renders/assets/.git', () => {
  const base = tmpDir();
  const d = path.join(base, 'nested');
  fs.mkdirSync(path.join(d, 'demo-build', 'renders'), { recursive: true });
  fs.mkdirSync(path.join(d, 'demo-build', 'assets'), { recursive: true });
  fs.mkdirSync(path.join(d, 'demo-build', '.git'), { recursive: true });
  fs.mkdirSync(path.join(d, 'demo-build', 'frames'), { recursive: true });
  // nested heavy (should be swept even though one level down)
  fs.writeFileSync(path.join(d, 'demo-build', 'source-densified.mp4'), Buffer.alloc(9000, 1));
  fs.writeFileSync(path.join(d, 'demo-build', 'render.log'), Buffer.alloc(120, 1));
  fs.writeFileSync(path.join(d, 'demo-build', 'frames', 'f1.png'), Buffer.alloc(300, 1));
  // nested keepers (must survive)
  fs.writeFileSync(path.join(d, 'demo-build', 'renders', 'final.mp4'), Buffer.alloc(2000, 2));
  fs.writeFileSync(path.join(d, 'demo-build', 'assets', 'art.png'), Buffer.alloc(700, 2));
  fs.writeFileSync(path.join(d, 'demo-build', '.git', 'HEAD'), Buffer.alloc(40, 2));

  const scan = scanProject(d, NOW);
  const names = scan.heavyItems.map((i) => i.name.replace(/\\/g, '/'));
  assert.ok(names.includes('demo-build/source-densified.mp4'));
  assert.ok(names.includes('demo-build/render.log'));
  assert.ok(names.includes('demo-build/frames'));

  const res = purgeProject(base, 'nested', { apply: true, nowMs: NOW });
  assert.ok(res.freedBytes >= 9000);
  // nested heavy gone
  assert.ok(!fs.existsSync(path.join(d, 'demo-build', 'source-densified.mp4')));
  assert.ok(!fs.existsSync(path.join(d, 'demo-build', 'render.log')));
  assert.ok(!fs.existsSync(path.join(d, 'demo-build', 'frames')));
  // nested keepers survive — protected subtrees at depth
  assert.ok(fs.existsSync(path.join(d, 'demo-build', 'renders', 'final.mp4')));
  assert.ok(fs.existsSync(path.join(d, 'demo-build', 'assets', 'art.png')));
  assert.ok(fs.existsSync(path.join(d, 'demo-build', '.git', 'HEAD')));
});

test('purgeProject refuses the active project', () => {
  const base = tmpDir();
  makeProject(base, 'current');
  assert.throws(() => purgeProject(base, 'current', { active: 'current', apply: true, nowMs: NOW }), /active/i);
});

test('purgeProject refuses path-escape names', () => {
  const base = tmpDir();
  assert.throws(() => purgeProject(base, '..', { apply: true, nowMs: NOW }), /unsafe/i);
  assert.throws(() => purgeProject(base, 'a/b', { apply: true, nowMs: NOW }), /unsafe/i);
});

test('isInside containment guard', () => {
  assert.strictEqual(isInside('/a/b', '/a/b/c'), true);
  assert.strictEqual(isInside('/a/b', '/a/b'), false);   // equal is not "inside"
  assert.strictEqual(isInside('/a/b', '/a/c'), false);   // sibling escapes
});
