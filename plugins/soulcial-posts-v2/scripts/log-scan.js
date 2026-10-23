'use strict';
/*
 * log-scan.js — the SINGLE writer for the soulcial scan registry.
 *
 * One emission path. The 3 scoring skills (post-grader-v2 always; post-writer-v2 + repurpose-v2
 * once per finalized post) call this fire-and-forget at final-score. Skills NEVER inline-append.
 *
 * Boundary-safe by construction: whitelist projection into a null-proto record; no `post_text`
 * key exists; client-mode (or a regulated card) hard-nulls `post_excerpt`. Mirrors the
 * log-counsel-xp.js contract — a producer with teeth.
 *
 * Concurrency-safe with no lock: one file per record (scans/{scan_id}.jsonl). Crash-safe: each
 * record is written to a .tmp then atomically renamed, so a crash never leaves a partial file the
 * existence-dedup would mistake for a real record. Registry VIEWS are derived on-read, never here.
 *
 * Node script → crypto/new Date fine. Paths via os.homedir()+path.join — NEVER a literal '~'.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const SCHEMA = require('./scan-schema.js');

const MAX_INPUT_BYTES = 64 * 1024;
const EXCERPT_MAX = 120;
const TAG_MAX_CHARS = 90;
const TAGS_MAX = 5;

const BOUNDARY_TEXT =
  'client-data-boundary — this log holds social-grade telemetry (scores + dimension breakdown +\n' +
  'fix TAGS + a pointer into the sandboxed client folder). NO post bodies. Do not vault-promote,\n' +
  'quickshare, quicksave, or export the contents. See log-scan.js.\n';

function logRootOf(home) { return path.join(home, '.claude', 'projects', 'soulcial-grader-log'); }

// Best-effort error breadcrumb so silent rot becomes greppable. Never throws.
// `reason` can contain attacker-controlled text (e.g. a rejected dims key name), so strip
// tab/newline before append — otherwise a crafted key could forge a fake errors.log line.
function recordError(home, reason) {
  try {
    const root = logRootOf(home);
    fs.mkdirSync(root, { recursive: true });
    const clean = String(reason).replace(/[\r\n\t]/g, ' ').slice(0, 300);
    fs.appendFileSync(path.join(root, 'log-scan.errors.log'), `${new Date().toISOString()}\t${clean}\n`);
  } catch { /* breadcrumb is best-effort */ }
}

function fail(home, reason) {
  recordError(home, reason);
  return { ok: false, reason };
}

// Parse a client card's `regulated:` flag from frontmatter. Returns true | false | null
// (null = not found OR unparseable value → caller treats as regulated, fail-closed).
function parseRegulated(txt) {
  const fm = /^---\s*\n([\s\S]*?)\n---/.exec(txt);
  const body = fm ? fm[1] : txt;
  const rm = /^\s*regulated\s*:\s*(.+)$/im.exec(body);
  if (!rm) return null;
  const val = rm[1].replace(/#.*$/, '').trim().toLowerCase();
  if (val === 'false' || val === 'no') return false;
  if (val === 'true' || val === 'yes') return true;
  return null;
}

/*
 * logScan(input, opts?) → { ok:true } | { ok:true, dup:true } | { ok:false, reason }
 * input: a parsed record object OR a raw JSON string (string path enforces the 64 KB cap + parse).
 * opts.homeDir: override os.homedir() (tests only).
 * NEVER throws — every failure returns {ok:false} and drops an errors.log breadcrumb.
 */
function logScan(input, opts = {}) {
  let home;
  try {
    home = opts.homeDir || os.homedir(); // inside try so the never-throws contract is literal
    // ── Step 1: size cap + parse (only when handed raw text) ──────────────────
    let record;
    if (typeof input === 'string') {
      if (Buffer.byteLength(input, 'utf8') > MAX_INPUT_BYTES) return fail(home, 'input-too-large');
      try { record = JSON.parse(input); } catch { return fail(home, 'parse-error'); }
    } else {
      record = input;
    }
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      return fail(home, 'not-object');
    }

    // ── Step 2: whitelist-project into a null-proto record ────────────────────
    const out = Object.create(null);
    for (const k of SCHEMA.FIELDS) {
      if (k === 'dims') continue; // built explicitly below
      if (Object.prototype.hasOwnProperty.call(record, k) && record[k] !== undefined) out[k] = record[k];
    }
    // dims: read the 7 named keys EXPLICITLY (never `out.dims = record.dims`). Reject any 8th key
    // (this is where a crafted `__proto__` dims key is caught → C2).
    const inDims = record.dims;
    if (inDims === null || typeof inDims !== 'object' || Array.isArray(inDims)) {
      return fail(home, 'dims-not-object');
    }
    for (const k of Object.keys(inDims)) {
      if (!SCHEMA.DIM_KEYS.includes(k)) return fail(home, 'dims-extra-key:' + k);
    }
    const dims = Object.create(null);
    for (const k of SCHEMA.DIM_KEYS) {
      dims[k] = Object.prototype.hasOwnProperty.call(inDims, k) ? inDims[k] : undefined;
    }
    out.dims = dims;
    // (post_text is not in FIELDS → it was never copied → C.)

    // ── Step 3: charset validation BEFORE any dedup/write (scan_id → filename) ─
    if (typeof out.scan_id !== 'string' || !SCHEMA.UUID_RE.test(out.scan_id)) return fail(home, 'scan_id-bad');
    if (typeof out.client_slug !== 'string' || !SCHEMA.SLUG_RE.test(out.client_slug)) return fail(home, 'slug-bad');
    for (const k of ['project', 'platform', 'caller', 'gate', 'image_version']) {
      if (out[k] !== undefined && out[k] !== null) {
        if (typeof out[k] !== 'string' || !SCHEMA.TOKEN_RE.test(out[k])) return fail(home, k + '-bad-token');
      }
    }
    if (out.post_ref !== undefined && out.post_ref !== null) {
      const pr = String(out.post_ref);
      if (pr.includes('..')) return fail(home, 'post_ref-traversal');
      // Client artifacts live in projects/{slug}, projects/{slug}-posts, or projects/{slug}-social-engine
      // (per mode-gate). Accept any folder under projects/ whose top segment starts with the client slug;
      // block traversal above projects/ and any cross-client folder.
      const projectsRoot = path.resolve(path.join(home, '.claude', 'projects'));
      const resolved = path.resolve(projectsRoot, pr);
      const rel = path.relative(projectsRoot, resolved);
      const seg0 = rel.split(/[\\/]/)[0];
      // EXACT match to the client's known folder conventions (not a hyphen-prefix) so a slug that is
      // a prefix of another client's (acme vs acme-corp) can't cross-attribute. Extend this list if a
      // new folder convention is added in mode-gate.
      const allowed = [out.client_slug, out.client_slug + '-posts', out.client_slug + '-social-engine'];
      if (rel === '' || rel.startsWith('..') || path.isAbsolute(rel) || !allowed.includes(seg0)) {
        return fail(home, 'post_ref-outside-sandbox');
      }
    }

    // ── Step 4: required + type + enum + range ────────────────────────────────
    const v = SCHEMA.validate(out);
    if (!v.ok) return fail(home, 'validate:' + v.errors.join(','));

    // ── Step 5: defaults ──────────────────────────────────────────────────────
    if (!out.ts) out.ts = new Date().toISOString();
    out.schema_version = SCHEMA.SCHEMA_VERSION;

    // ── Step 6a: boundary — force null excerpt for client mode OR regulated card ─
    // Card existence outranks caller-supplied mode. Card read is fail-closed.
    let forceNull = out.mode === 'client';
    if (!forceNull) {
      try {
        const cardPath = path.join(home, '.claude', 'references', 'social-spine', 'clients', out.client_slug + '.md');
        if (fs.existsSync(cardPath)) {
          const reg = parseRegulated(fs.readFileSync(cardPath, 'utf8'));
          if (reg !== false) forceNull = true; // true / unparseable → regulated
        }
      } catch { forceNull = true; } // fail-closed
    }
    if (forceNull) {
      out.post_excerpt = null;
    } else if (out.post_excerpt !== undefined && out.post_excerpt !== null) {
      // Step 6b: self mode — strip pipes/newlines (renders in a derived md column), truncate ≤120.
      let s = String(out.post_excerpt).replace(/[|\r\n]/g, ' ');
      const chars = Array.from(s);
      out.post_excerpt = chars.length > EXCERPT_MAX ? chars.slice(0, EXCERPT_MAX).join('') : s;
    }

    // ── Step 6c: top_fix_tags ─────────────────────────────────────────────────
    if (Array.isArray(out.top_fix_tags)) {
      let tags = out.top_fix_tags.filter((t) => typeof t === 'string');
      if (out.mode === 'client') {
        tags = tags.filter((t) => SCHEMA.CLIENT_FIX_VOCAB.includes(t));
      } else {
        tags = tags.map((t) => {
          const c = Array.from(t.replace(/[|\r\n]/g, ' '));
          return c.length > TAG_MAX_CHARS ? c.slice(0, TAG_MAX_CHARS).join('') : c.join('');
        });
      }
      out.top_fix_tags = tags.slice(0, TAGS_MAX);
    } else if (out.top_fix_tags !== undefined) {
      out.top_fix_tags = [];
    }

    // ── Step 6d: voice_audit — bound the ONE remaining free-text sink ─────────
    // It is telemetry ("clean" / "-0.5 non-tic deviation"), not a body field. Cap + strip so a
    // caller can't smuggle a full client caption through it and puncture the boundary.
    if (out.voice_audit !== undefined && out.voice_audit !== null) {
      const c = Array.from(String(out.voice_audit).replace(/[|\r\n]/g, ' '));
      out.voice_audit = c.length > 200 ? c.slice(0, 200).join('') : c.join('');
    }

    // ── Step 7: mkdir + first-write boundary sentinel ─────────────────────────
    const root = logRootOf(home);
    const scansDir = path.join(root, 'scans');
    fs.mkdirSync(scansDir, { recursive: true });
    const boundary = path.join(root, '.client-data-boundary');
    if (!fs.existsSync(boundary)) { try { fs.writeFileSync(boundary, BOUNDARY_TEXT); } catch { /* best-effort */ } }

    // ── Step 8: dedup = existence ─────────────────────────────────────────────
    const scanFile = path.join(scansDir, out.scan_id + '.jsonl');
    if (fs.existsSync(scanFile)) return { ok: true, dup: true };

    // ── Step 9: TRULY atomic per-record write (tmp + rename) ──────────────────
    // writeFileSync alone truncates-on-open: a crash mid-write would leave a partial file that the
    // existence-dedup then treats as "already logged" → permanent silent loss. tmp+rename means the
    // final path only ever appears complete (rename is atomic on one filesystem).
    const tmpFile = scanFile + '.' + process.pid + '.tmp';
    fs.writeFileSync(tmpFile, JSON.stringify(out) + '\n');
    fs.renameSync(tmpFile, scanFile);

    // ── Step 10: success sentinel (own try/catch; never affects result) ───────
    try { fs.writeFileSync(path.join(root, '.last-write'), out.ts); } catch { /* best-effort */ }

    // ── Step 11 ───────────────────────────────────────────────────────────────
    return { ok: true };
  } catch (e) {
    return fail(home, 'exception:' + String((e && e.message) || e));
  }
}

module.exports = { logScan, parseRegulated, SCHEMA };

// ── CLI ──────────────────────────────────────────────────────────────────────
// Primary channel: --in <path> (a JSON file written with the Write tool). Fallback: stdin.
// No echo piping. A logging failure surfaces (stderr + errors.log) but is fire-and-forget upstream.
if (require.main === module) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--in');
  let raw;
  try {
    raw = (i >= 0 && args[i + 1]) ? fs.readFileSync(args[i + 1], 'utf8') : fs.readFileSync(0, 'utf8');
  } catch (e) {
    process.stderr.write('log-scan: cannot read input: ' + String((e && e.message) || e) + '\n');
    process.exit(1);
  }
  const r = logScan(raw);
  if (!r.ok) process.stderr.write('log-scan: ' + JSON.stringify(r) + '\n');
  process.exit(r.ok ? 0 : 1);
}
