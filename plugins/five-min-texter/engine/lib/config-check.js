// config-check.js — the config <-> engine placeholder 1:1 contract validator.
//
// The plan calls an unfilled/orphan placeholder "the highest-probability silent handoff failure."
// This closes it: it scans EVERY engine file for {{PLACEHOLDER}} tokens and proves the config's
// _placeholder_map covers each one exactly once (no ORPHAN placeholder the wizard forgot to fill),
// and that every map entry points at a real placeholder (no DEAD config field). With {filled:true}
// it also asserts every mapped source resolves to a non-empty value (the go-live gate).
//
//   node engine/lib/config-check.js               # structural check (template ok even with empty values)
//   node engine/lib/config-check.js --filled      # go-live check (values must be present)

const fs = require('fs');
const path = require('path');

const PLACEHOLDER_RE = /\{\{([A-Z0-9_]+)\}\}/g;
// Required sub-fields for the two assembled placeholders (FAQ_TEXT, VOICE_DNA_BLOCK).
const ASSEMBLY_REQUIRED = { faq: ['services', 'hours', 'location'], voice_dna: ['cadence', 'sign_off'] };
// Placeholders whose values are only known DURING the Setup walkthrough (not the intake interview).
// The Phase-1 content gate (scope='content') skips emptiness for these; they fill in Phase 2.
const LIVE_ONLY = new Set(['TWILIO_FROM', 'AIRTABLE_BASE', 'WEBHOOK_PUBLIC_URL', 'OWNER_TELEGRAM_CHAT_ID', 'ERROR_WORKFLOW_ID']);

function collectEnginePlaceholders(engineDir) {
  const found = new Set();
  for (const f of fs.readdirSync(engineDir)) {
    if (!/\.(json|md)$/.test(f)) continue;
    const txt = fs.readFileSync(path.join(engineDir, f), 'utf8');
    let m;
    while ((m = PLACEHOLDER_RE.exec(txt))) found.add(m[1]);
  }
  return [...found].sort();
}

const isEmpty = (v) => v == null || (typeof v === 'string' && v.trim() === '');

function assemblyEmpty(key, obj) {
  if (!obj || typeof obj !== 'object') return true;
  for (const req of ASSEMBLY_REQUIRED[key] || []) {
    const v = obj[req];
    if (Array.isArray(v) ? v.length === 0 : isEmpty(v)) return true;
  }
  return false;
}

// scope: 'all' (every placeholder must be non-empty — the go-live gate) | 'content' (interview-captured
// fields only; the 5 LIVE_ONLY placeholders are allowed empty — the Phase-1 gate).
function checkConfig({ configPath, engineDir, filled = false, scope = 'all' }) {
  const enginePlaceholders = collectEnginePlaceholders(engineDir);
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const map = config._placeholder_map || {};
  const mapped = Object.keys(map);

  const orphanPlaceholders = enginePlaceholders.filter((p) => !mapped.includes(p)); // engine token, no config source
  const deadEntries = mapped.filter((p) => !enginePlaceholders.includes(p)); // config maps a non-existent token

  const missingFields = [];
  const emptyFields = [];
  for (const [ph, src] of Object.entries(map)) {
    const checkEmpty = filled && !(scope === 'content' && LIVE_ONLY.has(ph));
    if (typeof src === 'string' && src.startsWith('@assemble:')) {
      const key = src.slice('@assemble:'.length);
      if (!(key in config)) { missingFields.push(`${ph} -> ${src} (no '${key}' object)`); continue; }
      if (checkEmpty && assemblyEmpty(key, config[key])) emptyFields.push(`${ph} (assembled from ${key})`);
    } else {
      if (!(src in config)) { missingFields.push(`${ph} -> ${src} (field missing)`); continue; }
      if (checkEmpty && isEmpty(config[src])) emptyFields.push(`${ph} -> ${src}`);
    }
  }

  const ok =
    orphanPlaceholders.length === 0 &&
    deadEntries.length === 0 &&
    missingFields.length === 0 &&
    (!filled || emptyFields.length === 0);

  return { ok, filled, scope, enginePlaceholders, orphanPlaceholders, deadEntries, missingFields, emptyFields };
}

module.exports = { checkConfig, collectEnginePlaceholders };

if (require.main === module) {
  const content = process.argv.includes('--content'); // Phase-1 gate: interview fields must be filled
  const filled = content || process.argv.includes('--filled'); // go-live gate: everything filled
  const scope = content ? 'content' : 'all';
  const engineDir = path.join(__dirname, '..');
  // Layout-agnostic config resolution. In the published plugin everything is collapsed under one
  // skill root (config.{json,template.json} sits as a SIBLING of engine/, i.e. __dirname/../..).
  // An explicit --config=<path> overrides (the wizard can pass it). The old kit hardcoded a
  // ../../skill/five-min-texter climb + config* name that does NOT exist in the plugin layout.
  const skillRoot = path.join(__dirname, '..', '..');
  const argHit = process.argv.find((a) => a.startsWith('--config='));
  const explicit = argHit ? argHit.slice('--config='.length) : null;
  const filledPath = explicit || path.join(skillRoot, 'config.json');
  const templatePath = path.join(skillRoot, 'config.template.json');
  const configPath = fs.existsSync(filledPath) ? filledPath : templatePath;
  // Fail LOUD on a genuinely-missing config — never silently validate against a wrong default.
  if (!fs.existsSync(configPath)) {
    console.error(`config-check: no config found (looked for ${filledPath}${explicit ? '' : ' then ' + templatePath}) — cannot validate.`);
    process.exit(2);
  }
  const r = checkConfig({ configPath, engineDir, filled, scope });
  const modeLabel = content ? 'content (Phase-1)' : filled ? 'filled (go-live)' : 'structural';
  console.log(`config-check (${modeLabel}) on ${path.basename(configPath)}: ${r.ok ? 'OK' : 'FAIL'}`);
  console.log(`  engine placeholders (${r.enginePlaceholders.length}): ${r.enginePlaceholders.join(', ')}`);
  if (r.orphanPlaceholders.length) console.log(`  ORPHAN placeholders (no config source): ${r.orphanPlaceholders.join(', ')}`);
  if (r.deadEntries.length) console.log(`  DEAD map entries (no such placeholder): ${r.deadEntries.join(', ')}`);
  if (r.missingFields.length) console.log(`  MISSING fields: ${r.missingFields.join(' | ')}`);
  if (filled && r.emptyFields.length) console.log(`  EMPTY (fill before go-live): ${r.emptyFields.join(' | ')}`);
  process.exit(r.ok ? 0 : 1);
}
