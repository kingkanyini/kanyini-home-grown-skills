const path = require('node:path');
const fs = require('node:fs');
const C = require('./constants.js');

// Resolve symlinks/junctions on the deepest EXISTING ancestor, re-append the
// non-existent tail. Degrades to path.resolve() for fully non-existent paths.
function realpathBestEffort(p) {
  let cur = path.resolve(p);
  const tail = [];
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const real = fs.realpathSync(cur);
      return tail.length ? path.join(real, ...tail.reverse()) : real;
    } catch {
      const parent = path.dirname(cur);
      if (parent === cur) return path.resolve(p); // hit root, nothing existed
      tail.push(path.basename(cur));
      cur = parent;
    }
  }
}

function estimateScratchNeed(sourceBytes) { return sourceBytes * C.SCRATCH_SIZE_FACTOR; }
function diskOk(freeBytes, sourceBytes) { return freeBytes >= estimateScratchNeed(sourceBytes); }

function transcriptQC({ wordCount, durationS, gaps = [] }) {
  const flags = [];
  if (!wordCount || wordCount <= 0) flags.push('transcript is empty');
  if (durationS > 0 && wordCount > 0) {
    const wps = wordCount / durationS;
    if (wps < C.TRANSCRIPT_WPS_MIN) flags.push(`words/sec ${wps.toFixed(2)} below floor ${C.TRANSCRIPT_WPS_MIN}`);
    if (wps > C.TRANSCRIPT_WPS_MAX) flags.push(`words/sec ${wps.toFixed(2)} above ceiling ${C.TRANSCRIPT_WPS_MAX}`);
  }
  for (const g of gaps) if (g > C.TRANSCRIPT_SILENT_GAP_S) flags.push(`silent gap ${g}s exceeds ${C.TRANSCRIPT_SILENT_GAP_S}s`);
  return { ok: flags.length === 0, flags };
}

// Throw if writeTarget resolves inside the source file's directory subtree.
// Both sides are run through realpathBestEffort so a symlink/junction whose real
// target sits inside the source dir cannot bypass the check. (Note: path.relative
// is case-insensitive on Windows — correct here; a case-sensitive FS port (WSL ext4)
// would need an explicit casefold.)
function assertWriteSafe(sourceRealpath, writeTarget) {
  const srcDir = realpathBestEffort(path.dirname(sourceRealpath));
  const tgt = realpathBestEffort(writeTarget);
  const rel = path.relative(srcDir, tgt);
  const inside = rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
  if (inside) throw new Error(`unsafe write: target "${tgt}" is inside source directory "${srcDir}" — source is read-only`);
}

module.exports = { estimateScratchNeed, diskOk, transcriptQC, assertWriteSafe };
