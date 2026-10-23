const crypto = require('node:crypto');
const C = require('./constants.js');

function bodyFingerprint(body) {
  return body ? crypto.createHash('sha256').update(body).digest('hex').slice(0, 12) : '';
}

// Hash the fields the build actually depends on: slug, title, summary, the SORTED
// affects axes, a fingerprint of the note BODY (so a body rewrite is detected — the
// digest only carries the summary, but staleness must track the canonical note), and
// confidence (lifecycle). affects is sorted so reordering is not false-staleness.
function indexHash(notes) {
  const canon = notes
    .map(n => `${n.slug}|${n.title}|${n.summary}|${(n.affects || []).slice().sort().join(',')}|${bodyFingerprint(n.body)}|${n.confidence || ''}`)
    .sort()
    .join('\n');
  return crypto.createHash('sha256').update(canon).digest('hex').slice(0, C.INDEX_HASH_LEN);
}

function renderIndex(notes) {
  const hash = indexHash(notes);
  const lines = [];
  lines.push('# PRINCIPLES-INDEX (GENERATED — do not edit by hand)');
  lines.push('');
  lines.push(`<!-- index-hash: ${hash} -->`);
  lines.push('> Regenerated at Phase 0.5 from your vault notes. Vault is canonical; this is a digest.');
  lines.push('');
  for (const n of [...notes].sort((a, b) => a.slug.localeCompare(b.slug))) {
    lines.push(`- **[[${n.slug}]]** — ${n.summary}` + ((n.affects && n.affects.length) ? `  _(affects: ${n.affects.join(', ')})_` : ''));
  }
  return lines.join('\n');
}

function isStale(indexMd, notes) {
  // Anchored to the exact comment form + exact hash length; a malformed/truncated
  // hash fails to match and is treated as stale (fail-safe -> regenerate).
  const re = new RegExp(`<!--\\s*index-hash:\\s*([0-9a-f]{${C.INDEX_HASH_LEN}})\\s*-->`);
  const m = indexMd.match(re);
  if (!m) return true;
  return m[1] !== indexHash(notes);
}

module.exports = { renderIndex, indexHash, isStale, bodyFingerprint };

// CLI: node gen-principles-index.js <notes.json>  -> writes the digest to stdout
if (require.main === module) {
  const fs = require('node:fs');
  const notes = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  process.stdout.write(renderIndex(notes));
}
