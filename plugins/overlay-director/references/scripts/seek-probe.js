// seek-probe.js — AUTHORITATIVE runtime seek-safety gate (L0-3, CIPHER#1/PHANTOM#4/CONDUIT#5).
//
// The whole skill renders by SEEKING a paused GSAP timeline frame-by-frame, forward AND backward.
// A seek-safe timeline is a pure function of time: seeking to progress p during a forward sweep and
// during a backward sweep must yield IDENTICAL rendered state on every animated target. Blur/filter
// tweens go stale on the backward seek — this probe catches exactly that, where the static scan in
// standards-check.js only guesses. This runtime probe is the HARD gate; the static scan is advisory.
//
// Reuses the proven headless-Chromium harness under moves-library/_impl/gate (its pinned Playwright
// + locally-inlined GSAP — file:// + CDN stalls headless). The pure comparator (diffSampleSets /
// valuesEqual) is dependency-free and unit-tested; the browser driver is lazy-required so tests never
// launch Chromium.
//
// Exit: 0 = seek-safe, 1 = mismatch (not seek-safe), 2 = probe error.

const fs = require('node:fs');
const path = require('node:path');

const GATE_DIR = path.join(__dirname, '..', 'moves-library', '_impl', 'gate');
const PROGRESS_POINTS = [0, 0.25, 0.5, 0.75, 1];
const ANIMATED_PROPS = ['opacity', 'transform', 'filter', 'backdropFilter', 'clipPath', 'strokeDashoffset'];
const OPACITY_TOL = 0.01;

// ── pure comparator (unit-tested, no browser) ───────────────────────────────

// Equal within tolerance for numeric props; exact string match otherwise.
function valuesEqual(a, b, tol = OPACITY_TOL) {
  if (a === b) return true;
  const na = parseFloat(a), nb = parseFloat(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && String(a).trim() !== '' && String(b).trim() !== '') {
    // only treat as numeric when the WHOLE value is a number (e.g. opacity "0.5"), not "matrix(...)"
    if (/^-?\d*\.?\d+$/.test(String(a).trim()) && /^-?\d*\.?\d+$/.test(String(b).trim())) {
      return Math.abs(na - nb) <= tol;
    }
  }
  return false;
}

// forward/backward: { [progress]: { [targetKey]: { prop: value } } }.
// Returns mismatches where the same (progress,target,prop) differs forward vs backward.
function diffSampleSets(forward, backward, opts = {}) {
  const tol = opts.tol == null ? OPACITY_TOL : opts.tol;
  const mismatches = [];
  for (const p of Object.keys(forward)) {
    const fAtP = forward[p] || {};
    const bAtP = backward[p] || {};
    for (const key of Object.keys(fAtP)) {
      const fv = fAtP[key] || {};
      const bv = bAtP[key] || {};
      for (const prop of Object.keys(fv)) {
        if (!valuesEqual(fv[prop], bv[prop], prop === 'opacity' ? tol : 0)) {
          mismatches.push({ progress: Number(p), target: key, prop, forward: fv[prop], backward: bv[prop] });
        }
      }
    }
  }
  return mismatches;
}

// ── browser driver (lazy-required) ──────────────────────────────────────────

function loadGsap() {
  return fs.readFileSync(path.join(GATE_DIR, 'assets', 'gsap.min.js'), 'utf8');
}

async function probeImpl(implPath, opts = {}) {
  const points = opts.progressPoints || PROGRESS_POINTS;
  const { chromium } = require(path.join(GATE_DIR, 'node_modules', 'playwright')); // lazy
  const gsap = loadGsap();
  const html = fs.readFileSync(implPath, 'utf8')
    .replace(/<script src="[^"]*gsap[^"]*"><\/script>/i, `<script>${gsap}</script>`);

  const browser = await chromium.launch({ headless: true, timeout: 30000 });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const perTimeline = [];
  try {
    await page.setContent(html, { waitUntil: 'load' });
    await page.waitForFunction('!!window.__timelines && Object.keys(window.__timelines).length > 0', { timeout: 15000 });
    const ids = await page.evaluate(() => Object.keys(window.__timelines));

    for (const id of ids) {
      // enumerate animated DOM targets once, tag them with a stable index key
      const targetCount = await page.evaluate((id) => {
        const tl = window.__timelines[id];
        const tweens = tl.getChildren(true, true, false);
        const set = new Set();
        for (const tw of tweens) for (const t of tw.targets()) if (t && t.nodeType === 1) set.add(t);
        window.__probeTargets = window.__probeTargets || {};
        window.__probeTargets[id] = [...set];
        return window.__probeTargets[id].length;
      }, id);

      const dur = await page.evaluate((id) => window.__timelines[id].duration(), id);

      // Prime: play the full range once so GSAP records every tween's start state (`.to()` tweens
      // don't capture their from-value until first rendered). Without this, the fresh-init forward
      // frame at progress 0 differs from the arrived-from-end backward frame — a boundary artifact,
      // not true staleness. After priming, only genuinely seek-UNSAFE props (a filter that won't
      // revert on backward seek) differ forward vs backward.
      await page.evaluate((id) => { const tl = window.__timelines[id]; tl.totalTime(tl.duration()); tl.totalTime(0); }, id);
      await page.waitForTimeout(30);

      const capture = async (p) => page.evaluate(({ id, p, props }) => {
        const tl = window.__timelines[id];
        tl.totalTime(p * tl.duration());
        const els = window.__probeTargets[id];
        const out = {};
        els.forEach((el, i) => {
          const cs = getComputedStyle(el);
          const rec = {};
          for (const pr of props) rec[pr] = cs[pr];
          out['t' + i] = rec;
        });
        return out;
      }, { id, p, props: ANIMATED_PROPS });

      const forward = {};
      for (const p of points) { forward[p] = await capture(p); await page.waitForTimeout(15); }
      const backward = {};
      for (const p of [...points].reverse()) { backward[p] = await capture(p); await page.waitForTimeout(15); }

      const mismatches = diffSampleSets(forward, backward);
      perTimeline.push({ id, targets: targetCount, duration: dur, seek_safe: mismatches.length === 0, mismatches });
    }
  } finally {
    await browser.close();
  }
  return { file: path.basename(implPath), ok: perTimeline.every(t => t.seek_safe), timelines: perTimeline };
}

module.exports = { valuesEqual, diffSampleSets, probeImpl, ANIMATED_PROPS, PROGRESS_POINTS };

// CLI: node seek-probe.js <impl.html> [impl2.html ...]
if (require.main === module) {
  const files = process.argv.slice(2).filter(a => !a.startsWith('--'));
  if (!files.length) { process.stderr.write('usage: seek-probe.js <impl.html> [more.html ...]\n'); process.exit(2); }
  (async () => {
    const reports = [];
    for (const f of files) reports.push(await probeImpl(f));
    process.stdout.write(JSON.stringify({ ok: reports.every(r => r.ok), reports }, null, 2) + '\n');
    process.exit(reports.every(r => r.ok) ? 0 : 1);
  })().catch(err => { process.stderr.write(`seek-probe error: ${err.message}\n`); process.exit(2); });
}
