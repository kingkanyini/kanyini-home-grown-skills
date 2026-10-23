const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { safeCopyOut } = require('../safe-copy-out.js');

function tmpDir() { return fs.mkdtempSync(path.join(os.tmpdir(), 'od-cpo-')); }

test('copies render to destination and verifies size', () => {
  const a = tmpDir(), b = tmpDir();
  const src = path.join(a, 'render.mp4');
  const dst = path.join(b, 'final.mp4');
  fs.writeFileSync(src, Buffer.alloc(2048, 7));
  const res = safeCopyOut(src, dst);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(fs.statSync(dst).size, 2048);
  // no leftover tmp files in dest
  assert.ok(!fs.readdirSync(b).some(f => f.endsWith('.tmp')));
});

test('throws on size mismatch (simulated truncation) and leaves no final', () => {
  const a = tmpDir(), b = tmpDir();
  const src = path.join(a, 'render.mp4');
  fs.writeFileSync(src, Buffer.alloc(0)); // zero-byte render = invalid
  const dst = path.join(b, 'final.mp4');
  assert.throws(() => safeCopyOut(src, dst), /empty|size/i);
  assert.ok(!fs.existsSync(dst));
});

test('rename failure cleans up the temp file (dest path is an existing directory)', () => {
  const a = tmpDir(), b = tmpDir();
  const src = path.join(a, 'render.mp4');
  fs.writeFileSync(src, Buffer.alloc(1024, 3));
  // destFinal is itself a directory -> rename(tmp, dir) throws; tmp lives in b (parent)
  const dstDir = path.join(b, 'final.mp4');
  fs.mkdirSync(dstDir);
  assert.throws(() => safeCopyOut(src, dstDir), /rename failed/i);
  assert.ok(!fs.readdirSync(b).some(f => f.endsWith('.tmp')));
});
