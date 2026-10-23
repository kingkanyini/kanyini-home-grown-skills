#!/usr/bin/env node
'use strict';
/*
 * scan-history.js — the READ command. "show [client] scan history."
 * Registry VIEWS are DERIVED here on demand (the writer never touches them): rebuilds
 * scan-registry.jsonl (concat) + scan-registry.md (table) from scans/*.jsonl, then prints a
 * filtered summary + score trend + weakest dim.
 *
 * Resilient by construction: per-file try/catch, skip unparseable, NEVER abort. Guards on
 * schema_version===1 && dims before "weakest dim." Header surfaces .last-write staleness.
 *
 *   node scan-history.js [--client "example-client"] [--limit 20]
 *   (test/alt home: SCAN_LOG_HOME=/tmp/foo node scan-history.js)
 *
 * v1.1 backlog (see implementation plan): O(n) glob has no cache/ceiling; staleness should also
 * derive from max(mtime scans/*.jsonl). Fine at current volume — write path stays O(1).
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { DIM_KEYS } = require('./scan-schema.js');

// Same shape mode-gate uses: lowercase, non-alnum → hyphen, collapse, trim hyphens.
function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64);
}

function homeOf(opts) { return (opts && opts.homeDir) || process.env.SCAN_LOG_HOME || os.homedir(); }
function logRootOf(home) { return path.join(home, '.claude', 'projects', 'soulcial-grader-log'); }

function loadRecords(home) {
  const scansDir = path.join(logRootOf(home), 'scans');
  let files = [];
  try { files = fs.readdirSync(scansDir).filter((f) => f.endsWith('.jsonl')); } catch { return []; }
  const recs = [];
  for (const f of files) {
    try {
      const line = fs.readFileSync(path.join(scansDir, f), 'utf8').trim();
      if (!line) continue;
      const o = JSON.parse(line);      // per-record file → one object
      recs.push(o);
    } catch { /* skip unparseable, never abort */ }
  }
  // Sort by ts ascending (fall back to filename for missing ts).
  recs.sort((a, b) => String(a.ts || '').localeCompare(String(b.ts || '')));
  return recs;
}

function weakestDim(rec) {
  if (rec.schema_version !== 1 || !rec.dims || typeof rec.dims !== 'object') return null;
  let min = Infinity, key = null;
  for (const k of DIM_KEYS) {
    const v = rec.dims[k];
    if (typeof v === 'number' && v < min) { min = v; key = k; }
  }
  return key ? { key, val: min } : null;
}

function mdCell(v) { return v === undefined || v === null ? '' : String(v).replace(/[|\r\n]/g, ' '); }

function buildMd(recs) {
  const header = '| ts | client | mode | platform | caller | overall | gate | weakest dim | top fixes | img | post_ref |\n' +
                 '|---|---|---|---|---|---|---|---|---|---|---|';
  const rows = recs.map((r) => {
    const w = weakestDim(r);
    const fixes = Array.isArray(r.top_fix_tags) ? r.top_fix_tags.join(', ') : '';
    return `| ${mdCell(r.ts)} | ${mdCell(r.client_slug)} | ${mdCell(r.mode)} | ${mdCell(r.platform)} | ${mdCell(r.caller)} | ${mdCell(r.overall)} | ${mdCell(r.gate)} | ${w ? `${w.key} (${w.val})` : ''} | ${mdCell(fixes)} | ${mdCell(r.image_version)} | ${mdCell(r.post_ref)} |`;
  });
  return [header, ...rows].join('\n') + '\n';
}

function staleness(home, nowMs) {
  try {
    const ts = fs.readFileSync(path.join(logRootOf(home), '.last-write'), 'utf8').trim();
    const then = Date.parse(ts);
    if (!Number.isFinite(then)) return null;
    const days = Math.floor((nowMs - then) / 86400000);
    return { ts, days };
  } catch { return null; }
}

/*
 * buildRegistry(opts?) → { records, filtered, md, jsonl, stale }
 * Writes scan-registry.jsonl + scan-registry.md to the log root as a side effect.
 * opts: { homeDir?, client?, limit?, nowMs? }
 */
function buildRegistry(opts = {}) {
  const home = homeOf(opts);
  const all = loadRecords(home);

  // Derived views reflect the FULL set (source of truth = scans/); filtering is a display concern.
  const jsonl = all.map((r) => JSON.stringify(r)).join('\n') + (all.length ? '\n' : '');
  const md = buildMd(all);
  try {
    const root = logRootOf(home);
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, 'scan-registry.jsonl'), jsonl);
    fs.writeFileSync(path.join(root, 'scan-registry.md'), md);
  } catch { /* derived-view write failure must never crash the read */ }

  let filtered = all;
  if (opts.client) {
    const q = slugify(opts.client);
    // Match q only as a WHOLE hyphen-delimited segment-run inside the slug (so "example-client" →
    // "example-client" matches "the-example-client"). No reverse-substring arm — a short stored slug must
    // never match a longer query, or one client's boundary-marked rows leak into another's view.
    filtered = q ? all.filter((r) => {
      const cs = String(r.client_slug || '');
      return cs === q || cs.startsWith(q + '-') || cs.endsWith('-' + q) || cs.includes('-' + q + '-');
    }) : all;
  }
  if (opts.limit && Number.isFinite(opts.limit)) filtered = filtered.slice(-opts.limit);

  const stale = opts.nowMs ? staleness(home, opts.nowMs) : staleness(home, Date.now());
  return { records: all, filtered, md, jsonl, stale };
}

function render(res, opts) {
  const lines = [];
  const s = res.stale;
  if (s) lines.push(`last scan logged: ${s.days} day(s) ago${s.days > 7 ? ' ⚠' : ''} (${s.ts})`);
  else lines.push('last scan logged: (no .last-write sentinel yet)');
  lines.push(`total scans on file: ${res.records.length}${opts.client ? ` · matching "${opts.client}": ${res.filtered.length}` : ''}`);

  const f = res.filtered;
  if (!f.length) { lines.push('(no matching scans)'); return lines.join('\n'); }

  const overalls = f.map((r) => r.overall).filter((n) => typeof n === 'number');
  if (overalls.length) {
    const avg = (overalls.reduce((a, b) => a + b, 0) / overalls.length).toFixed(1);
    lines.push(`overall: min ${Math.min(...overalls)} · avg ${avg} · max ${Math.max(...overalls)} · latest ${overalls[overalls.length - 1]}`);
    lines.push(`trend: ${overalls.slice(-12).join(' → ')}`);
  }
  lines.push('');
  lines.push(buildMd(f).trim());
  return lines.join('\n');
}

module.exports = { buildRegistry, slugify, weakestDim, loadRecords };

// ── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);
  const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : undefined; };
  const client = get('--client');
  const limitRaw = get('--limit');
  const res = buildRegistry({ client, limit: limitRaw ? parseInt(limitRaw, 10) : undefined });
  console.log(render(res, { client }));
}
