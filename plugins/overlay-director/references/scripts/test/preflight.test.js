const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { estimateScratchNeed, diskOk, transcriptQC, assertWriteSafe } = require('../preflight.js');

test('scratch estimate uses 1.3 factor', () => {
  assert.strictEqual(estimateScratchNeed(1000), 1300);
});

test('diskOk true when free >= need, false otherwise', () => {
  assert.strictEqual(diskOk(1300, 1000), true);
  assert.strictEqual(diskOk(1299, 1000), false);
});

test('transcriptQC flags empty transcript', () => {
  const r = transcriptQC({ wordCount: 0, durationS: 120, gaps: [] });
  assert.strictEqual(r.ok, false);
  assert.ok(r.flags.some(f => /empty/i.test(f)));
});

test('transcriptQC flags wps out of range', () => {
  const fast = transcriptQC({ wordCount: 1000, durationS: 60, gaps: [] }); // ~16.7 wps
  assert.strictEqual(fast.ok, false);
  assert.ok(fast.flags.some(f => /words\/sec/i.test(f)));
});

test('transcriptQC flags long silent gap', () => {
  const r = transcriptQC({ wordCount: 200, durationS: 120, gaps: [5, 40] });
  assert.ok(r.flags.some(f => /gap/i.test(f)));
});

test('transcriptQC passes a healthy transcript', () => {
  const r = transcriptQC({ wordCount: 300, durationS: 120, gaps: [3, 8] }); // 2.5 wps
  assert.strictEqual(r.ok, true);
  assert.deepStrictEqual(r.flags, []);
});

test('assertWriteSafe throws when target is inside source dir', () => {
  const src = path.resolve('/videos/raw/talk.mp4');
  assert.throws(() => assertWriteSafe(src, path.resolve('/videos/raw/overlay/index.html')), /source/i);
});

test('assertWriteSafe passes when target is outside source dir', () => {
  const src = path.resolve('/videos/raw/talk.mp4');
  assert.doesNotThrow(() => assertWriteSafe(src, path.resolve('/scratch/proj/index.html')));
});

test('assertWriteSafe catches a junction/symlink whose real target is inside the source dir (skips if unprivileged)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'od-pf-'));
  const srcDir = path.join(root, 'raw');
  fs.mkdirSync(srcDir);
  const src = path.join(srcDir, 'talk.mp4');
  fs.writeFileSync(src, 'x');
  const link = path.join(root, 'sneaky-link');
  try {
    fs.symlinkSync(srcDir, link, 'junction'); // dir junction works without admin on Windows
  } catch {
    return; // unprivileged environment — skip rather than false-fail
  }
  // link -> srcDir, so link/out.html realpaths to srcDir/out.html which is INSIDE the source dir
  assert.throws(() => assertWriteSafe(src, path.join(link, 'out.html')), /source/i);
});
