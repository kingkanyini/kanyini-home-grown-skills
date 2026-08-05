// standards-check.js — Layer 0 conformance validator (CONTRACT §5 + v2 hardening L0-2/4/5/6/7/8).
//
// checkPlan RE-DERIVES each card's standards from the move-file frontmatter + standards.map.json
// (the authoritative resolver of record); the plan's stamped moment.standards[] is informational
// and a mismatch is flagged as a `stamp-drift` advisory (L0-5). Unknown move_type fails LOUD as a
// hard `map-coverage` violation, never a silent fallback to defaults (L0-2).
//
// Report: { ok, violations[], advisories[], manual_review[], meta }.
//   ok === (no HARD violations). Per-finding `severity: hard|advisory` (L0-4).
//   manual_review lists axes an `ok:true` did NOT machine-verify, so ok never launders an
//   unchecked axis (layout has no machine check; seek-safety is verified by the runtime probe
//   seek-probe.js, not by this static scan).
//
// Exit taxonomy (CLI): 0 = clean, 1 = one+ hard violation, 2 = checker error (bad plan / IO).
// Documented + poison-tested.
//
// Machine checks — HARD:      min-easings, entrance-valid, palette-member, caption-length, map-coverage
//                  ADVISORY:   seek-safety (static pre-filter), dead-air, bounce-heavy, stamp-drift,
//                              impl-missing, move-file-missing
// The authoritative seek-safety gate is reference/scripts/seek-probe.js (runtime), not this file.

const fs = require('node:fs');
const path = require('node:path');
const C = require('./constants.js');
const { extractEases, distinctEaseFamilies, bounceShare } = require('./ease-extract.js');

const ARCHETYPES = ['POP', 'SMOOTH'];
const MECHANISMS = ['FADE', 'ZOOM-IN', 'SCALE-POP', 'RISE', 'SLIDE', 'DRAW', 'BLUR-STREAK', 'CLIP-REVEAL', 'GROW-X', 'GROW-Y'];

const DEFAULT_STANDARDS_DIR = path.join(__dirname, '..', 'standards');
const DEFAULT_IMPL_DIR = path.join(__dirname, '..', 'moves-library', '_impl');
const DEFAULT_MOVES_DIR = path.join(__dirname, '..', 'moves-library');

const BOUNCE_ADVISORY_SHARE = 0.6; // > this fraction of non-POP eases in a bounce family -> advisory

// Authoritative per-check severity (L0-4). Mirrored in each axis .md `severity:` for humans.
const SEVERITY = {
  'min-easings': 'hard',
  'entrance-valid': 'hard',
  'palette-member': 'hard',
  'caption-length': 'hard',
  'map-coverage': 'hard',
  'seek-safety': 'advisory',
  'dead-air': 'advisory',
  'bounce-heavy': 'advisory',
  'stamp-drift': 'advisory',
  'impl-missing': 'advisory',
  'move-file-missing': 'advisory',
};

// ── pure helpers ────────────────────────────────────────────────────────────

function captionCap() {
  return Math.floor(C.WORDS_PER_SECOND_READ * C.MAX_HOLD_S);
}

function wordCount(str) {
  if (!str) return 0;
  return String(str).trim().split(/\s+/).filter(Boolean).length;
}

function normalizeHex(h) {
  let x = h.toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(x)) x = '#' + x[1] + x[1] + x[2] + x[2] + x[3] + x[3];
  return x;
}

function extractHexes(text) {
  const out = new Set();
  const re = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
  let m;
  while ((m = re.exec(text))) out.add(normalizeHex(m[0]));
  return out;
}

// Preview-only scaffolding (e.g. draw-board's `.od-footage-sim` glass backdrop) exists ONLY so an
// impl renders visibly in the standalone gate; it is deleted in production (root goes transparent —
// the footage IS the glass). It must not be palette-checked. Strip such regions before extracting
// colors: explicit `preview-only:start/end` fences (CSS or HTML comment, the general convention) plus
// the documented `.od-footage-sim { … }` backdrop rule. (Layer2 tags the div `data-preview-only`.)
function stripPreviewOnly(html) {
  return String(html)
    .replace(/\/\*\s*preview-only:start\s*\*\/[\s\S]*?\/\*\s*preview-only:end\s*\*\//g, '')
    .replace(/<!--\s*preview-only:start\s*-->[\s\S]*?<!--\s*preview-only:end\s*-->/g, '')
    .replace(/\.od-footage-sim\s*\{[^}]*\}/g, '');
}

function parsePalette(colorMd) {
  const set = new Set();
  const block = colorMd.match(/<!--\s*palette:machine([\s\S]*?)-->/);
  if (!block) return set;
  const re = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;
  let m;
  while ((m = re.exec(block[1]))) set.add(normalizeHex(m[0]));
  return set;
}

// From an index at a '(', return the substring INSIDE the balanced parens (quote-aware,
// multi-line by construction). null if unbalanced.
function extractBalanced(text, openIdx) {
  let depth = 0, quote = null;
  for (let i = openIdx; i < text.length; i++) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') { i++; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') { quote = ch; continue; }
    if (ch === '(') depth++;
    else if (ch === ')') { depth--; if (depth === 0) return text.slice(openIdx + 1, i); }
  }
  return null;
}

// Banned targets INSIDE a .to(/.fromTo( tween (L0-3 expanded). Static pre-filter only — ADVISORY.
const BANNED_TWEEN = [
  ['backdrop-filter', /backdrop-?filter\s*:/i],
  ['filter', /\bfilter\s*:/i],
  ['stdDeviation', /stdDeviation/],
  ['feDisplacementMap', /feDisplacementMap|displacementmap/i],
  ['feTurbulence', /feTurbulence|baseFrequency/i],
  ['transition-on-filter', /transition\s*:[^;}'"`]*filter/i],
];

// Whole-file banned patterns outside tweens (SMIL / CSS transitions on filter primitives) — ADVISORY.
const BANNED_FILE = [
  ['smil-animate-filter', /<animate[^>]*attributeName\s*=\s*["'](?:stdDeviation|baseFrequency|scale)["']/i],
  ['css-transition-filter', /transition\s*:[^;{}]*\b(?:filter|backdrop-filter)\b/i],
];

// Static scan: banned targets tweened inside a .to(/.fromTo( call + whole-file SMIL/CSS filter anim.
function scanSeekSafety(html, file) {
  const out = [];
  const re = /\.(to|fromTo)\s*\(/g;
  let m;
  while ((m = re.exec(html))) {
    const kind = m[1];
    const args = extractBalanced(html, re.lastIndex - 1);
    if (args == null) continue;
    for (const [target, rx] of BANNED_TWEEN) if (rx.test(args)) out.push({ file, kind: `.${kind}(`, target });
  }
  for (const [target, rx] of BANNED_FILE) if (rx.test(html)) out.push({ file, kind: 'file', target });
  return out;
}

// Resolver of record (L0-2/L0-5). Explicit array wins; 'auto'/undefined resolves by move_type;
// unmapped move_type throws (fail-loud).
function resolveStandards(moveType, frontmatterStandards, map) {
  if (Array.isArray(frontmatterStandards) && frontmatterStandards.length) return frontmatterStandards.slice();
  const byType = map && map.by_move_type;
  if (byType && Object.prototype.hasOwnProperty.call(byType, moveType)) return byType[moveType].slice();
  const e = new Error(`unmapped move_type: ${moveType}`);
  e.code = 'UNMAPPED_MOVE_TYPE';
  e.moveType = moveType;
  throw e;
}

function loadMap(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, 'standards.map.json'), 'utf8'));
}

// Parse a move .md frontmatter (CRLF-tolerant) -> { move_type, standards } where standards is
// an array (explicit) | 'auto' | undefined.
function parseMoveFrontmatter(text) {
  const norm = String(text).replace(/\r\n/g, '\n');
  const fm = norm.match(/^---\n([\s\S]*?)\n---/);
  const body = fm ? fm[1] : '';
  const move_type = (body.match(/^move_type:\s*(.+)$/m) || [])[1];
  let standards;
  const sLine = body.match(/^standards:\s*(.+)$/m);
  if (sLine) {
    const v = sLine[1].trim();
    if (v.startsWith('[')) {
      standards = (v.match(/\[([^\]]*)\]/) || [, ''])[1].split(',').map(s => s.trim()).filter(Boolean);
    } else {
      standards = v; // 'auto'
    }
  }
  return { move_type: move_type ? move_type.trim() : undefined, standards };
}

function readMoveFrontmatter(movesDir, moveId) {
  const p = path.join(movesDir, `${moveId}.md`);
  if (!fs.existsSync(p)) return null;
  return parseMoveFrontmatter(fs.readFileSync(p, 'utf8'));
}

// Scan every impl HTML for a move_id (exact + `<id>-*` variants; non-recursive → excludes gate/).
function scanImplsForMove(implDir, moveId) {
  let names;
  try { names = fs.readdirSync(implDir); } catch { return { found: false, files: [], eases: [], hexes: new Map(), seek: [] }; }
  const files = names.filter(f => f.endsWith('.html') && (f === `${moveId}.html` || f.startsWith(`${moveId}-`)));
  if (!files.length) return { found: false, files: [], eases: [], hexes: new Map(), seek: [] };
  const eases = [];
  const hexes = new Map();
  const seek = [];
  for (const f of files) {
    const html = fs.readFileSync(path.join(implDir, f), 'utf8');
    for (const e of extractEases(html)) eases.push(e);
    for (const hx of extractHexes(stripPreviewOnly(html))) if (!hexes.has(hx)) hexes.set(hx, f);
    for (const s of scanSeekSafety(html, f)) seek.push(s);
  }
  return { found: true, files, eases, hexes, seek };
}

// Every active library move_type must be a map key (L0-2 coverage, library-wide).
function checkLibraryCoverage(movesDir, map) {
  const missing = [];
  let names;
  try { names = fs.readdirSync(movesDir); } catch { return missing; }
  for (const f of names) {
    if (!f.endsWith('.md') || f === '_index.md') continue;
    const { move_type } = parseMoveFrontmatter(fs.readFileSync(path.join(movesDir, f), 'utf8'));
    if (move_type && !(map.by_move_type && Object.prototype.hasOwnProperty.call(map.by_move_type, move_type))) {
      missing.push({ move_id: f.replace(/\.md$/, ''), move_type });
    }
  }
  return missing;
}

// ── main check ────────────────────────────────────────────────────────────

function checkPlan(plan, opts = {}) {
  const standardsDir = opts.standardsDir || DEFAULT_STANDARDS_DIR;
  const implDir = opts.implDir || DEFAULT_IMPL_DIR;
  const movesDir = opts.movesDir || DEFAULT_MOVES_DIR;

  const map = loadMap(standardsDir);
  const palette = parsePalette(fs.readFileSync(path.join(standardsDir, 'color.md'), 'utf8'));
  const cap = captionCap();

  const findings = [];
  const emit = (f) => findings.push({ ...f, severity: SEVERITY[f.check] || 'advisory' });

  const moments = Array.isArray(plan.moments) ? plan.moments : [];

  // Authoritative re-derivation per referenced move (L0-5): read move-file frontmatter,
  // resolve via map, cache. move-file move_type is authoritative over the stamped moment.
  const referenced = [...new Set(moments.map(m => m.move_id).filter(Boolean))];
  const resolvedByMove = {}; // move_id -> { standards[], moveType } | { unmapped:true } | null
  for (const mid of referenced) {
    const fmeta = readMoveFrontmatter(movesDir, mid);
    if (!fmeta) {
      emit({ move_id: mid, standard: '(meta)', check: 'move-file-missing', detail: `no move file ${mid}.md in ${movesDir}; falling back to stamped move_type/standards` });
      resolvedByMove[mid] = null;
      continue;
    }
    try {
      resolvedByMove[mid] = { standards: resolveStandards(fmeta.move_type, fmeta.standards, map), moveType: fmeta.move_type };
    } catch (e) {
      if (e.code === 'UNMAPPED_MOVE_TYPE') {
        emit({ move_id: mid, standard: 'map-coverage', check: 'map-coverage', detail: `move_type '${e.moveType}' is not a key in standards.map.json (run gen-standards-map.js --write)` });
        resolvedByMove[mid] = { unmapped: true, moveType: fmeta.move_type };
      } else { throw e; }
    }
  }

  // Resolve a moment's standards from the authoritative cache (fallback to stamped move_type).
  const resolvedOf = (m) => {
    const r = resolvedByMove[m.move_id];
    if (r && r.standards) return r.standards;
    if (r && r.unmapped) return null;
    try { return resolveStandards(m.move_type, m.standards, map); }
    catch { return null; }
  };

  // Per-moment: entrance-valid, caption-length, stamp-drift
  for (const m of moments) {
    const std = resolvedOf(m);
    if (!std) continue;
    if (std.includes('entrance')) {
      const okArch = ARCHETYPES.includes(m.entrance_archetype);
      const okMech = MECHANISMS.includes(m.entrance_mechanism);
      if (!okArch || !okMech) {
        emit({ move_id: m.move_id, standard: 'entrance', check: 'entrance-valid', detail: `moment ${m.id}: archetype=${m.entrance_archetype || '∅'} mechanism=${m.entrance_mechanism || '∅'} (need POP|SMOOTH + a valid mechanism)` });
      }
    }
    if (std.includes('writing')) {
      const w = wordCount(m.copy);
      if (w > cap) emit({ move_id: m.move_id, standard: 'writing', check: 'caption-length', detail: `moment ${m.id}: ${w} words > cap ${cap} (split into sequential cards)` });
    }
    if (Array.isArray(m.standards) && m.standards.length) {
      const a = m.standards.slice().sort().join(',');
      const b = std.slice().sort().join(',');
      if (a !== b) emit({ move_id: m.move_id, standard: '(meta)', check: 'stamp-drift', detail: `moment ${m.id}: stamped [${m.standards.join(',')}] != resolved [${std.join(',')}] (re-stamp from the resolver)` });
    }
  }

  // Pairwise (advisory): dead-air handoff
  const sorted = moments.filter(m => typeof m.t_start === 'number').slice().sort((a, b) => a.t_start - b.t_start);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1], cur = sorted[i];
    if (typeof prev.t_end !== 'number') continue;
    const gap = cur.t_start - prev.t_end;
    const handoff = cur.transition_in && cur.transition_in !== 'hard-cut';
    if (gap > 0 && !handoff) emit({ move_id: cur.move_id, standard: 'timing', check: 'dead-air', detail: `moment ${cur.id} starts ${gap.toFixed(2)}s after ${prev.id} ends with no transition_in handoff` });
  }

  // Impl-derived: seek-safety (advisory) + palette-member (hard) + easing families
  const colorMoves = new Set(moments.filter(m => { const s = resolvedOf(m); return s && s.includes('color'); }).map(m => m.move_id));
  const popMoves = new Set(moments.filter(m => m.entrance_archetype === 'POP').map(m => m.move_id));
  const animMoves = new Set(moments.filter(m => { const s = resolvedOf(m); return s && s.includes('animation'); }).map(m => m.move_id));
  const layoutMoves = new Set(moments.filter(m => { const s = resolvedOf(m); return s && s.includes('layout'); }).map(m => m.move_id));
  const allEases = [];
  const nonPopEases = [];

  for (const mid of referenced) {
    const scan = scanImplsForMove(implDir, mid);
    if (!scan.found) {
      emit({ move_id: mid, standard: 'animation', check: 'impl-missing', detail: `no impl HTML for '${mid}' in ${implDir} (easing/seek/palette not scannable)` });
      continue;
    }
    for (const e of scan.eases) { allEases.push(e); if (!popMoves.has(mid)) nonPopEases.push(e); }
    for (const s of scan.seek) emit({ move_id: mid, standard: 'animation', check: 'seek-safety', detail: `${s.file}: banned '${s.target}' in ${s.kind} — static pre-filter; seek-probe.js is authoritative` });
    if (colorMoves.has(mid)) {
      for (const [hx, file] of scan.hexes) if (!palette.has(hx)) emit({ move_id: mid, standard: 'color', check: 'palette-member', detail: `${file}: ${hx} not in allowed palette (color.md)` });
    }
  }

  // min-easings (hard) across the plan — distinct FAMILIES via ease-extract (L0-6)
  let distinct = distinctEaseFamilies(allEases).length;
  if (distinct === 0 && typeof plan.distinct_easings === 'number') distinct = plan.distinct_easings;
  if (distinct < C.MIN_DISTINCT_EASINGS) emit({ move_id: '(plan)', standard: 'animation', check: 'min-easings', detail: `${distinct} distinct easing FAMILIES across referenced impls < ${C.MIN_DISTINCT_EASINGS} (reads monotone)` });

  // bounce-heavy (advisory) — POP moves exempt (L0-7)
  const bShare = bounceShare(nonPopEases);
  if (bShare > BOUNCE_ADVISORY_SHARE) emit({ move_id: '(plan)', standard: 'animation', check: 'bounce-heavy', detail: `${Math.round(bShare * 100)}% of non-POP eases are in a bounce family (> ${Math.round(BOUNCE_ADVISORY_SHARE * 100)}%) — bounce is a POP accent, not the default settle` });

  // Library-wide map coverage (hard) — every active move_type is a map key
  for (const miss of checkLibraryCoverage(movesDir, map)) {
    emit({ move_id: miss.move_id, standard: 'map-coverage', check: 'map-coverage', detail: `library move_type '${miss.move_type}' is not a key in standards.map.json` });
  }

  const violations = findings.filter(f => f.severity === 'hard');
  const advisories = findings.filter(f => f.severity === 'advisory');

  // manual_review: axes an ok:true did NOT machine-verify (L0-4)
  const manual_review = [];
  if (animMoves.size) manual_review.push({ axis: 'animation', check: 'seek-safety', reason: 'runtime probe (seek-probe.js) is authoritative; the static scan here is advisory-only', moves: [...animMoves].sort() });
  if (layoutMoves.size) manual_review.push({ axis: 'layout', reason: 'no machine check on this axis — manual review required', moves: [...layoutMoves].sort() });

  return {
    ok: violations.length === 0,
    violations,
    advisories,
    manual_review,
    meta: {
      distinct_easing_families: distinct,
      bounce_share_non_pop: Number(bShare.toFixed(2)),
      caption_cap: cap,
      referenced_moves: referenced.length,
      palette_size: palette.size,
      map_move_types: Object.keys(map.by_move_type || {}).length,
    },
  };
}

module.exports = {
  loadMap, resolveStandards, checkPlan, checkLibraryCoverage,
  captionCap, wordCount, normalizeHex, extractHexes, parsePalette, extractBalanced,
  scanSeekSafety, scanImplsForMove, parseMoveFrontmatter, readMoveFrontmatter,
  ARCHETYPES, MECHANISMS, SEVERITY,
};

// CLI: node standards-check.js <plan.json> [--standards-dir <dir>] [--impl-dir <dir>] [--moves-dir <dir>]
if (require.main === module) {
  const args = process.argv.slice(2);
  const planPath = args.find(a => !a.startsWith('--'));
  const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
  if (!planPath) {
    process.stderr.write('usage: standards-check.js <plan.json> [--standards-dir <dir>] [--impl-dir <dir>] [--moves-dir <dir>]\n');
    process.exit(2);
  }
  let report;
  try {
    const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
    report = checkPlan(plan, { standardsDir: flag('--standards-dir'), implDir: flag('--impl-dir'), movesDir: flag('--moves-dir') });
  } catch (err) {
    process.stderr.write(`standards-check failed: ${err.message}\n`);
    process.exit(2);
  }
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');
  process.exit(report.ok ? 0 : 1);
}
