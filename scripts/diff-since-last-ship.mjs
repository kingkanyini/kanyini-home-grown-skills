#!/usr/bin/env node
// scripts/diff-since-last-ship.mjs
// Drift detection — outputs which source skills changed since the last ship cycle.
// Per PLAN-v3.1 §4.6.2 (PHANTOM mandate). Compares mtime + content hash against
// .last-ship-manifest.json (auto-generated on every successful push, gitignored).
//
// Output: prints list of changed skills (one per line). Empty output = no changes.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';

const SOURCE_ROOT = path.join(os.homedir(), '.claude', 'plugins', 'local');
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1'), '..');
const MANIFEST_PATH = path.join(REPO_ROOT, '.last-ship-manifest.json');

const PHASE_1_SKILLS = [
  'savepoint', 'quicksave', 'counsel-dispatch', 'learn-eval',
  'morning-compass', 'inbox-digest', 'perplexity-research',
  'voice-dna-extractor', 'voice-dna-blueprint-builder', 'charisma-codes',
  'exportskill', 'quickshare', 'skill-to-site',
  'offer-optimizer', 'magnetic-offer-blueprint', 'propaganda-machine',
  'funnel-hack-research', 'funnel-hack-lvl-1', 'funnel-audit', 'funnel-translate',
  'webinar-forge', 'vsl-activator',
  'daily-email-digest', 'belief-shift-e-engine', 'headline-creator',
  'ad-copy-forge', 'ss-ad-generator', 'power-clip-pro',
];

async function hashSkill(skillName) {
  const dir = path.join(SOURCE_ROOT, skillName);
  const hash = createHash('sha256');
  const entries = [];

  async function walk(d) {
    let dirEntries;
    try {
      dirEntries = await fs.readdir(d, { withFileTypes: true });
    } catch { return; }
    for (const e of dirEntries) {
      if (e.name === 'node_modules' || e.name === '__pycache__' || e.name === '.git') continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) {
        await walk(p);
      } else if (e.isFile()) {
        const buf = await fs.readFile(p);
        entries.push({ p: path.relative(dir, p), sha: createHash('sha256').update(buf).digest('hex') });
      }
    }
  }
  await walk(dir);
  entries.sort((a, b) => a.p.localeCompare(b.p));
  for (const e of entries) hash.update(`${e.p}\t${e.sha}\n`);
  return hash.digest('hex');
}

async function main() {
  const current = {};
  for (const skill of PHASE_1_SKILLS) {
    current[skill] = await hashSkill(skill);
  }

  let manifest = {};
  try {
    manifest = JSON.parse(await fs.readFile(MANIFEST_PATH, 'utf8'));
  } catch {
    // First run — no manifest. Everything is "changed."
    if (process.argv.includes('--write-manifest')) {
      await fs.writeFile(MANIFEST_PATH, JSON.stringify(current, null, 2));
      console.log('# No prior manifest. Wrote new one.');
      return;
    }
    console.log('# No prior manifest exists. All skills will be processed.');
    for (const s of PHASE_1_SKILLS) console.log(s);
    return;
  }

  const changed = PHASE_1_SKILLS.filter(s => manifest[s] !== current[s]);

  if (process.argv.includes('--write-manifest')) {
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(current, null, 2));
    console.log(`# Updated manifest. ${changed.length} skills changed since last ship.`);
  }

  for (const s of changed) console.log(s);
  if (changed.length === 0) console.log('# No changes since last ship.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(2); });
