// gen-standards-index.js — mirror of gen-principles-index.js for the Standards Backbone.
// Parses reference/standards/*.md (the canonical axis files) into a digest and renders
// STANDARDS-INDEX.md with a staleness hash. Phase 9 regenerates this when standards change.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const C = require('./constants.js');

const DEFAULT_STANDARDS_DIR = path.join(__dirname, '..', 'standards');

function bodyFingerprint(body) {
  return body ? crypto.createHash('sha256').update(body).digest('hex').slice(0, 12) : '';
}

// Parse one axis file's frontmatter + H1 subtitle into a standard record. CRLF-tolerant.
function parseStandardFile(rawText) {
  const text = String(rawText).replace(/\r\n/g, '\n');
  const fmMatch = text.match(/^---\n([\s\S]*?)\n---/);
  const fm = fmMatch ? fmMatch[1] : '';
  const body = fmMatch ? text.slice(fmMatch[0].length) : text;

  const scalar = (k) => {
    const m = fm.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : '';
  };
  const id = scalar('id');
  const axis = scalar('axis');
  const confidence = scalar('confidence');

  const appliesRaw = (fm.match(/^applies_to:\s*\[([^\]]*)\]/m) || [])[1] || '';
  const applies_to = appliesRaw.split(',').map(s => s.trim()).filter(Boolean);

  const machineChecks = [];
  for (const line of fm.split('\n')) {
    if (!/^\s*-\s*\{/.test(line)) continue;
    const cid = (line.match(/id:\s*([\w-]+)/) || [])[1];
    if (cid && /machine:\s*true/.test(line)) machineChecks.push(cid);
  }

  const h1 = (body.match(/^#\s+(.+)$/m) || [])[1] || id;
  const summary = h1.includes(' — ') ? h1.split(' — ').slice(1).join(' — ').trim() : h1.trim();

  return { id, axis, applies_to, confidence, machineChecks, summary };
}

function loadStandards(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md') && f !== '_index.md')
    .map(f => parseStandardFile(fs.readFileSync(path.join(dir, f), 'utf8')))
    .filter(s => s.id);
}

// Hash the fields the build depends on: id, axis, SORTED applies_to, SORTED machine checks,
// confidence, and a fingerprint of the summary. Sorted arrays => reordering is not false-staleness.
function indexHash(standards) {
  const canon = standards
    .map(s => `${s.id}|${s.axis}|${(s.applies_to || []).slice().sort().join(',')}|${(s.machineChecks || []).slice().sort().join(',')}|${s.confidence || ''}|${bodyFingerprint(s.summary)}`)
    .sort()
    .join('\n');
  return crypto.createHash('sha256').update(canon).digest('hex').slice(0, C.STANDARDS_INDEX_HASH_LEN);
}

function renderIndex(standards) {
  const hash = indexHash(standards);
  const lines = [];
  lines.push('# STANDARDS-INDEX (GENERATED — do not edit by hand)');
  lines.push('');
  lines.push(`<!-- index-hash: ${hash} -->`);
  lines.push('> Regenerated at Phase 9 from reference/standards/*.md. The axis files are canonical; this is a digest.');
  lines.push('');
  for (const s of [...standards].sort((a, b) => a.id.localeCompare(b.id))) {
    const machine = (s.machineChecks && s.machineChecks.length) ? s.machineChecks.join(', ') : '—';
    const applies = (s.applies_to && s.applies_to.length) ? s.applies_to.join(', ') : 'all';
    lines.push(`- **[[${s.id}]]** — ${s.summary}  _(applies: ${applies} · machine: ${machine})_`);
  }
  return lines.join('\n');
}

function isStale(indexMd, standards) {
  const re = new RegExp(`<!--\\s*index-hash:\\s*([0-9a-f]{${C.STANDARDS_INDEX_HASH_LEN}})\\s*-->`);
  const m = indexMd.match(re);
  if (!m) return true;
  return m[1] !== indexHash(standards);
}

module.exports = { renderIndex, indexHash, isStale, bodyFingerprint, parseStandardFile, loadStandards };

// CLI: node gen-standards-index.js [standardsDir] [--check <indexPath>]
//   default        -> writes the regenerated digest to stdout
//   --check <path> -> exits 1 if the on-disk index is stale vs the axis files (PHANTOM#5)
if (require.main === module) {
  const args = process.argv.slice(2);
  const ci = args.indexOf('--check');
  const checkPath = ci >= 0 ? args[ci + 1] : undefined; // the --check value is a FILE, not the dir
  const dir = args.find(a => !a.startsWith('--') && a !== checkPath) || DEFAULT_STANDARDS_DIR;
  const standards = loadStandards(dir);
  if (ci >= 0) {
    const idxPath = checkPath || path.join(dir, '..', 'STANDARDS-INDEX.md');
    const current = fs.existsSync(idxPath) ? fs.readFileSync(idxPath, 'utf8') : '';
    if (isStale(current, standards)) {
      process.stderr.write(`STANDARDS-INDEX.md is STALE vs reference/standards/*.md — run gen-standards-index.js > STANDARDS-INDEX.md\n`);
      process.exit(1);
    }
    process.stdout.write('STANDARDS-INDEX.md is up to date\n');
    process.exit(0);
  }
  process.stdout.write(renderIndex(standards));
}
