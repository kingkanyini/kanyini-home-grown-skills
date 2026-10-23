const fs = require('node:fs');
const path = require('node:path');

function safeCopyOut(srcRender, destFinal) {
  const srcSize = fs.statSync(srcRender).size;
  if (srcSize === 0) throw new Error('refusing to copy out an empty (0-byte) render');

  const destDir = path.dirname(destFinal);
  fs.mkdirSync(destDir, { recursive: true });
  const tmp = path.join(destDir, `${path.basename(destFinal)}.${process.pid}.tmp`);

  // Copy into a temp file IN the destination dir (same volume as final -> rename is atomic).
  fs.copyFileSync(srcRender, tmp);
  const tmpSize = fs.statSync(tmp).size;
  if (tmpSize !== srcSize) {
    try { fs.unlinkSync(tmp); } catch {}
    throw new Error(`copy-out size mismatch: src ${srcSize} != tmp ${tmpSize}`);
  }
  try {
    fs.renameSync(tmp, destFinal); // atomic within the destination volume
  } catch (e) {
    try { fs.unlinkSync(tmp); } catch {} // never leave an orphaned temp on failure
    throw new Error(`copy-out rename failed: ${e.message}`);
  }
  return { ok: true, bytes: tmpSize, dest: destFinal };
}

module.exports = { safeCopyOut };

// CLI: node safe-copy-out.js <renderFile> <destFinal>  -> JSON result to stdout; nonzero exit on failure
if (require.main === module) {
  try {
    process.stdout.write(JSON.stringify(safeCopyOut(process.argv[2], process.argv[3])));
  } catch (e) {
    process.stderr.write(`safe-copy-out failed: ${e.message}\n`);
    process.exit(1);
  }
}
