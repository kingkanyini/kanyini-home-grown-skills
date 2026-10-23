const { execFileSync } = require('node:child_process');
const C = require('./constants.js');

function frozenFraction(intervals, durationS) {
  if (!durationS) return 0;
  const frozen = intervals.reduce((a, [s, e]) => a + Math.max(0, e - s), 0);
  return Number((frozen / durationS).toFixed(4));
}

function fidelityOk(renderedFrozen, sourceFrozen) {
  return renderedFrozen <= sourceFrozen + C.FREEZE_TOLERANCE;
}

// Pure parser (unit-tested): extract [start,end] intervals from ffmpeg freezedetect stderr.
// Throws on a start/end count mismatch (truncated stderr) rather than silently zeroing a
// real freeze — a swallowed freeze would let fidelityOk pass when it must fail.
function parseFreezeIntervals(stderr, durationS) {
  const starts = [...stderr.matchAll(/freeze_start:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));
  const ends = [...stderr.matchAll(/freeze_end:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));
  // A trailing freeze with no freeze_end means it runs to the end of the stream.
  if (starts.length === ends.length + 1 && durationS != null) ends.push(durationS);
  if (starts.length !== ends.length) {
    throw new Error(`freeze parse mismatch: ${starts.length} starts, ${ends.length} ends — stderr may be truncated`);
  }
  return starts.map((s, i) => [s, ends[i]]);
}

// Thin wrapper: run ffmpeg freezedetect (params pinned in constants for reproducibility),
// then parse. Not unit-tested (shells out); parseFreezeIntervals carries the tested logic.
function detectFreezes(file, durationS, { noise = C.FREEZE_DETECT_NOISE, freezeDur = C.FREEZE_DETECT_DURATION_S } = {}) {
  let stderr = '';
  try {
    execFileSync('ffmpeg', ['-i', file, '-vf', `freezedetect=n=${noise}:d=${freezeDur}`, '-map', '0:v:0', '-f', 'null', '-'],
      { stdio: ['ignore', 'ignore', 'pipe'] });
  } catch (e) { stderr = (e.stderr || '').toString(); }
  return parseFreezeIntervals(stderr, durationS);
}

module.exports = { frozenFraction, fidelityOk, parseFreezeIntervals, detectFreezes };

// CLI: node verify-fidelity.js <sourceFile> <renderFile> <durationS>
// Prints {sourceFrozen, renderFrozen, ok}; exit 2 if the render is less faithful than the source.
if (require.main === module) {
  const [, , sourceFile, renderFile, dur] = process.argv;
  const d = parseFloat(dur);
  const sourceFrozen = frozenFraction(detectFreezes(sourceFile, d), d);
  const renderFrozen = frozenFraction(detectFreezes(renderFile, d), d);
  const ok = fidelityOk(renderFrozen, sourceFrozen);
  process.stdout.write(JSON.stringify({ sourceFrozen, renderFrozen, ok }));
  if (!ok) process.exit(2);
}
