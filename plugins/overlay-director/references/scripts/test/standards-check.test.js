const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const S = require('../standards-check.js');
const C = require('../constants.js');

// ── temp fixture env: standardsDir (map + color.md), implDir, movesDir ────────
function w(dir, name, body) { fs.writeFileSync(path.join(dir, name), body); }

function makeEnv() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'std-check2-'));
  const standardsDir = path.join(root, 'standards');
  const implDir = path.join(root, 'impl');
  const movesDir = path.join(root, 'moves');
  [standardsDir, implDir, movesDir].forEach(d => fs.mkdirSync(d));

  w(standardsDir, 'standards.map.json', JSON.stringify({
    version: 1,
    defaults: ['animation', 'timing', 'writing'],
    by_move_type: {
      card: ['animation', 'color', 'entrance', 'timing', 'writing', 'layout'],
      quote: ['animation', 'timing', 'writing'], // no entrance/color/layout
    },
  }));
  w(standardsDir, 'color.md', ['---', 'id: color', '---',
    '<!-- palette:machine', '#241b14', '#f7f0e4', '#ffffff', '-->'].join('\n'));

  const cardMove = (mt = 'card', std = 'auto') => ['---', 'status: active', `move_type: ${mt}`, `standards: ${std}`, '---', '# move'].join('\n');
  for (const id of ['good-card', 'bad-seek', 'bad-color', 'two-ease', 'bouncy']) w(movesDir, `${id}.md`, cardMove());
  w(movesDir, 'quote-move.md', cardMove('quote'));

  w(implDir, 'good-card.html', `
    <style>.od-card{color:#241b14;background:#f7f0e4}</style>
    <script>
      const tl = gsap.timeline({paused:true});
      tl.set(el,{filter:'blur(6px)'});
      tl.to(el,{opacity:1,ease:'power3.out'},0)
        .to(el,{opacity:0,ease:'power1.in'},2)
        .fromTo(inner,{scale:0.9},{scale:1,ease:'expo.out'},0);
    </script>`);
  w(implDir, 'quote-move.html', `<script>tl.to(a,{opacity:1,ease:'power3.out'}).to(a,{opacity:0,ease:'power1.in'}).fromTo(b,{y:1},{y:0,ease:'sine.inOut'})</script>`);
  w(implDir, 'bad-seek.html', `<script>tl.to(el,{opacity:1,filter:'blur(0px)',ease:'power3.out'}).to(el,{opacity:0,ease:'power1.in'}).fromTo(x,{y:1},{y:0,ease:'expo.out'})</script>`);
  w(implDir, 'bad-color.html', `<style>.x{color:#ff00ff}</style><script>tl.to(el,{opacity:1,ease:'power3.out'}).to(el,{opacity:0,ease:'power1.in'}).fromTo(a,{x:1},{x:0,ease:'sine.inOut'})</script>`);
  w(implDir, 'two-ease.html', `<script>tl.to(el,{opacity:1,ease:'power3.out'}).to(el,{opacity:0,ease:'power1.in'})</script>`);
  w(implDir, 'bouncy.html', `<script>
    tl.to(a,{x:1,ease:'back.out(1.4)'}).to(a,{x:2,ease:'back.out(1.2)'}).to(a,{x:3,ease:'back.out(1.6)'}).to(a,{x:4,ease:'back.out(1.5)'})
      .to(a,{y:1,ease:'power3.out'}).to(a,{y:2,ease:'sine.inOut'})</script>`);

  return { root, standardsDir, implDir, movesDir };
}

const ENV = makeEnv();
const OPTS = { standardsDir: ENV.standardsDir, implDir: ENV.implDir, movesDir: ENV.movesDir };

function moment(over = {}) {
  return {
    id: 'm1', move_id: 'good-card', move_type: 'card', t_start: 0, t_end: 3,
    copy: 'short clean line', entrance_archetype: 'SMOOTH', entrance_mechanism: 'SCALE-POP',
    transition_in: 'blur-crossfade', ...over,
  };
}

// ── pure helpers ──────────────────────────────────────────────────────────
test('captionCap derives from constants', () => {
  assert.strictEqual(S.captionCap(), Math.floor(C.WORDS_PER_SECOND_READ * C.MAX_HOLD_S));
});

test('normalizeHex expands 3-digit', () => {
  assert.strictEqual(S.normalizeHex('#FFF'), '#ffffff');
});

test('parseMoveFrontmatter reads move_type + standards (CRLF-tolerant)', () => {
  assert.deepStrictEqual(S.parseMoveFrontmatter('---\nmove_type: card\nstandards: auto\n---\n# x'),
    { move_type: 'card', standards: 'auto' });
  const crlf = S.parseMoveFrontmatter('---\r\nmove_type: hero\r\nstandards: [color, writing]\r\n---\r\n# x');
  assert.strictEqual(crlf.move_type, 'hero');
  assert.deepStrictEqual(crlf.standards, ['color', 'writing']);
});

test('scanSeekSafety flags expanded banned list in .to but not .set', () => {
  assert.strictEqual(S.scanSeekSafety(`tl.set(el,{filter:'blur(6px)'})`, 'f').length, 0);
  assert.ok(S.scanSeekSafety(`tl.to(el,{filter:'blur(0)'})`, 'f').some(v => v.target === 'filter'));
  assert.ok(S.scanSeekSafety(`tl.fromTo(f,{attr:{stdDeviation:8}},{attr:{stdDeviation:0}})`, 'f').some(v => v.target === 'stdDeviation'));
  assert.ok(S.scanSeekSafety(`tl.to(f,{attr:{baseFrequency:0.2}})`, 'f').some(v => v.target === 'feTurbulence'));
});

// ── resolveStandards fail-loud (L0-2) ────────────────────────────────────────
test('resolveStandards: explicit array wins; auto resolves by type; UNMAPPED throws', () => {
  const map = S.loadMap(ENV.standardsDir);
  assert.deepStrictEqual(S.resolveStandards('card', ['writing'], map), ['writing']);
  assert.ok(S.resolveStandards('card', 'auto', map).includes('entrance'));
  assert.throws(() => S.resolveStandards('mystery', 'auto', map), /unmapped move_type/);
});

// ── clean plan (L0-11 clean baseline) ────────────────────────────────────────
test('clean plan passes ok:true with manual_review surfaced', () => {
  const plan = { moments: [moment({ id: 'a', t_start: 0, t_end: 3 }), moment({ id: 'b', t_start: 2.9, t_end: 6 })] };
  const r = S.checkPlan(plan, OPTS);
  assert.strictEqual(r.ok, true, JSON.stringify(r.violations));
  assert.ok(r.manual_review.some(x => x.axis === 'animation' && x.check === 'seek-safety'));
  assert.ok(r.manual_review.some(x => x.axis === 'layout'));
  assert.strictEqual(r.meta.caption_cap, 11);
});

// ── min-easings (poison + clean) ─────────────────────────────────────────────
test('min-easings: 2-family impl flags (poison); 3-family passes (clean)', () => {
  const poison = S.checkPlan({ moments: [moment({ move_id: 'two-ease' })] }, OPTS);
  assert.ok(poison.violations.some(v => v.check === 'min-easings'));
  const clean = S.checkPlan({ moments: [moment({ move_id: 'good-card' })] }, OPTS);
  assert.ok(!clean.violations.some(v => v.check === 'min-easings'));
});

// ── entrance-valid (poison + clean + GROW + exempt) ──────────────────────────
test('entrance-valid: missing archetype flags (poison); GROW-X accepted (clean)', () => {
  const poison = S.checkPlan({ moments: [moment({ entrance_archetype: undefined })] }, OPTS);
  assert.ok(poison.violations.some(v => v.check === 'entrance-valid'));
  const grow = S.checkPlan({ moments: [moment({ entrance_mechanism: 'GROW-X' })] }, OPTS);
  assert.ok(!grow.violations.some(v => v.check === 'entrance-valid'));
});

test('entrance-valid: quote move_type (no entrance axis) is exempt', () => {
  const r = S.checkPlan({ moments: [{ id: 'q', move_id: 'quote-move', move_type: 'quote', t_start: 0, t_end: 3, copy: 'a quote' }] }, OPTS);
  assert.ok(!r.violations.some(v => v.check === 'entrance-valid'));
});

// ── caption-length (poison + clean) ─────────────────────────────────────────
test('caption-length: 12 words flags (poison); 11 passes (clean)', () => {
  const poison = S.checkPlan({ moments: [moment({ copy: Array(12).fill('w').join(' ') })] }, OPTS);
  assert.ok(poison.violations.some(v => v.check === 'caption-length'));
  const clean = S.checkPlan({ moments: [moment({ copy: Array(11).fill('w').join(' ') })] }, OPTS);
  assert.ok(!clean.violations.some(v => v.check === 'caption-length'));
});

// ── palette-member (poison + clean) ──────────────────────────────────────────
test('palette-member: off-palette hex flags (poison); good-card passes (clean)', () => {
  const poison = S.checkPlan({ moments: [moment({ move_id: 'bad-color' })] }, OPTS);
  assert.ok(poison.violations.some(v => v.check === 'palette-member' && v.detail.includes('#ff00ff')));
  const clean = S.checkPlan({ moments: [moment({ move_id: 'good-card' })] }, OPTS);
  assert.ok(!clean.violations.some(v => v.check === 'palette-member'));
});

// ── map-coverage fail-loud (poison) ─────────────────────────────────────────
test('map-coverage: unmapped move_type is a HARD violation (poison), never silent default', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'std-cov-'));
  const md = path.join(root, 'moves');
  fs.mkdirSync(md);
  w(md, 'mystery-move.md', '---\nmove_type: mystery\nstandards: auto\n---\n# x');
  const r = S.checkPlan({ moments: [{ id: 'z', move_id: 'mystery-move', move_type: 'mystery', t_start: 0, t_end: 2, copy: 'hi' }] },
    { standardsDir: ENV.standardsDir, implDir: ENV.implDir, movesDir: md });
  assert.ok(r.violations.some(v => v.check === 'map-coverage'), JSON.stringify(r.violations));
  assert.strictEqual(r.ok, false);
});

test('checkLibraryCoverage returns unmapped move_types', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'std-cov2-'));
  const md = path.join(root, 'moves');
  fs.mkdirSync(md);
  w(md, 'ok-move.md', '---\nmove_type: card\n---');
  w(md, 'bad-move.md', '---\nmove_type: nope\n---');
  assert.deepStrictEqual(S.checkLibraryCoverage(md, S.loadMap(ENV.standardsDir)), [{ move_id: 'bad-move', move_type: 'nope' }]);
});

// ── seek-safety static → ADVISORY (not hard) ────────────────────────────────
test('seek-safety static scan is an ADVISORY, not a hard violation (L0-3/L0-4)', () => {
  const r = S.checkPlan({ moments: [moment({ move_id: 'bad-seek' })] }, OPTS);
  assert.ok(r.advisories.some(v => v.check === 'seek-safety'));
  assert.ok(!r.violations.some(v => v.check === 'seek-safety'));
});

// ── bounce-heavy (advisory) + POP exemption (L0-7) ──────────────────────────
test('bounce-heavy: >60% non-POP bounce eases advises; POP moves exempt', () => {
  const smooth = S.checkPlan({ moments: [moment({ move_id: 'bouncy', entrance_archetype: 'SMOOTH' })] }, OPTS);
  assert.ok(smooth.advisories.some(v => v.check === 'bounce-heavy'));
  const pop = S.checkPlan({ moments: [moment({ move_id: 'bouncy', entrance_archetype: 'POP' })] }, OPTS);
  assert.ok(!pop.advisories.some(v => v.check === 'bounce-heavy'));
});

// ── stamp-drift (advisory, L0-5) ─────────────────────────────────────────────
test('stamp-drift: stamped standards[] != resolved is an advisory (not authoritative)', () => {
  const r = S.checkPlan({ moments: [moment({ standards: ['writing'] })] }, OPTS);
  assert.ok(r.advisories.some(v => v.check === 'stamp-drift'));
  assert.strictEqual(r.violations.length, 0);
});

// ── dead-air (advisory) ─────────────────────────────────────────────────────
test('dead-air: positive gap no handoff = advisory; overlap = clean', () => {
  const gap = S.checkPlan({ moments: [moment({ id: 'a', t_start: 0, t_end: 3 }), moment({ id: 'b', t_start: 5, t_end: 8, transition_in: undefined })] }, OPTS);
  assert.ok(gap.advisories.some(v => v.check === 'dead-air'));
  const overlap = S.checkPlan({ moments: [moment({ id: 'a', t_start: 0, t_end: 3 }), moment({ id: 'b', t_start: 2.5, t_end: 6, transition_in: undefined })] }, OPTS);
  assert.ok(!overlap.advisories.some(v => v.check === 'dead-air'));
});

// ── move-file-missing advisory ──────────────────────────────────────────────
test('move-file-missing: unknown move file yields advisory, falls back to stamped move_type', () => {
  const r = S.checkPlan({ moments: [{ id: 'x', move_id: 'ghost', move_type: 'card', t_start: 0, t_end: 3, copy: 'hi', entrance_archetype: 'SMOOTH', entrance_mechanism: 'FADE' }] }, OPTS);
  assert.ok(r.advisories.some(v => v.check === 'move-file-missing'));
});

// ── CLI exit taxonomy (L0-4): 0 clean / 1 hard violation / 2 checker error ───
const { execFileSync } = require('node:child_process');
const CLI = path.join(__dirname, '..', 'standards-check.js');
function runCli(plan) {
  const p = path.join(ENV.root, `cli-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(p, typeof plan === 'string' ? plan : JSON.stringify(plan));
  try {
    execFileSync('node', [CLI, p, '--standards-dir', ENV.standardsDir, '--impl-dir', ENV.implDir, '--moves-dir', ENV.movesDir], { stdio: 'pipe' });
    return 0;
  } catch (e) { return e.status; }
}

test('CLI exit 0 on a clean plan', () => {
  assert.strictEqual(runCli({ moments: [moment(), moment({ id: 'm2', t_start: 2.9, t_end: 6 })] }), 0);
});

test('CLI exit 1 on a hard violation (min-easings)', () => {
  assert.strictEqual(runCli({ moments: [moment({ move_id: 'two-ease' })] }), 1);
});

test('CLI exit 2 on a poison/malformed plan (checker error)', () => {
  assert.strictEqual(runCli('{ this is not json'), 2);
});
