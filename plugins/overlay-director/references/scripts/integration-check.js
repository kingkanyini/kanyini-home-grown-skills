// Integration gate — the parallel-build safety net (CIPHER#7 / ARCHITECT hardening).
// Four agents author move impls independently; the ONE invariant a parallel build can break
// is REGISTRATION rule 1: every root data-composition-id (== the window.__timelines key) must
// be UNIQUE across the whole library, or two moves collide on compose. This scans every impl
// and proves it. Pure Node, no browser needed. CLI: `node reference/scripts/integration-check.js`
// Exit 0 = all unique + keys match; exit 1 = collision/mismatch found.

const fs = require('fs');
const path = require('path');

const IMPL_DIR = path.join(__dirname, '..', 'moves-library', '_impl');
const SKIP = new Set(['_TEMPLATE.html']); // templates carry @@placeholders, not real ids

function scanImpl(file) {
  const html = fs.readFileSync(file, 'utf8');
  const idMatch = html.match(/data-composition-id="([^"@]+)"/); // first real (non-placeholder) root id
  const keyMatch = html.match(/__timelines\[\s*["']([^"']+)["']\s*\]/); // registration key
  return { file: path.basename(file), id: idMatch && idMatch[1], key: keyMatch && keyMatch[1] };
}

function check(implDir = IMPL_DIR) {
  const files = fs.readdirSync(implDir)
    .filter((f) => f.endsWith('.html') && !SKIP.has(f))
    .map((f) => path.join(implDir, f));

  const rows = files.map(scanImpl).filter((r) => r.id); // impls that declare a composition id
  const violations = [];

  // 1. registration key must equal the declared composition id (REGISTRATION rule 1/2)
  for (const r of rows) {
    if (r.key && r.key !== r.id) {
      violations.push({ kind: 'key-mismatch', file: r.file, detail: `data-composition-id="${r.id}" but __timelines["${r.key}"]` });
    }
  }
  // 2. every composition id is globally unique
  const seen = new Map();
  for (const r of rows) {
    if (seen.has(r.id)) {
      violations.push({ kind: 'id-collision', file: r.file, detail: `id "${r.id}" also in ${seen.get(r.id)}` });
    } else {
      seen.set(r.id, r.file);
    }
  }
  return { ok: violations.length === 0, count: rows.length, ids: [...seen.keys()].sort(), violations };
}

if (require.main === module) {
  const res = check();
  if (res.ok) {
    console.log(`integration-check OK — ${res.count} impls, ${res.ids.length} unique composition ids, no collisions.`);
    process.exit(0);
  }
  console.error(`integration-check FAILED — ${res.violations.length} violation(s):`);
  for (const v of res.violations) console.error(`  [${v.kind}] ${v.file}: ${v.detail}`);
  process.exit(1);
}

module.exports = { check, scanImpl };
