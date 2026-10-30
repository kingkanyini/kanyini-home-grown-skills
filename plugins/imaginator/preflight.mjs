#!/usr/bin/env node
// preflight.mjs — imaginator
// Checks the toolkit before a generation. Contract (same as every marketplace skill):
//   exit 0 = ready · exit 1 = missing prereq · exit 2 = config error
//   stdout = human-readable status · stderr = MISSING:<name> per line (machine-parsable)
// The OpenArt video engine needs none of the Python pieces; only Gemini images and Veo video do.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const missing = [];
const line = (ok, label, hint = '') => console.log(`${ok ? '✓' : '✗'} ${label}${!ok && hint ? `  →  ${hint}` : ''}`);

// Declared prereqs (plugin.json). python3 gets the richer check below; any other CLI is a PATH check.
const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));   // safe with spaces in the path
let prereqs = {};
try {
  prereqs = JSON.parse(readFileSync(path.join(SKILL_DIR, '.claude-plugin', 'plugin.json'), 'utf8')).prereqs || {};
} catch (err) {
  console.error('CONFIG_ERROR: cannot read plugin.json:', err.message);
  process.exit(2);
}
for (const cli of (prereqs.clis || []).filter(c => c !== 'python3')) {
  try {
    execFileSync(process.platform === 'win32' ? 'where' : 'which', [cli], { stdio: 'ignore' });
    line(true, `CLI ${cli}`);
  } catch {
    line(false, `CLI ${cli}`, `install ${cli}`);
    missing.push(`cli:${cli}`);
  }
}
for (const svc of prereqs.services || []) console.log(`· Service: ${svc}`);

// 1. Python 3.9+ (the skill's commands say `python`; use whichever name works here)
let py = null;
for (const cand of process.platform === 'win32' ? ['python', 'py', 'python3'] : ['python3', 'python']) {
  try {
    const v = execFileSync(cand, ['-c', 'import sys;print("%d.%d"%sys.version_info[:2])'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const [maj, min] = v.split('.').map(Number);
    if (maj === 3 && min >= 9) { py = cand; line(true, `Python ${v} (run it as: ${cand})`); break; }
  } catch { /* try next */ }
}
if (!py) {
  line(false, 'Python 3.9+', 'install from python.org (needed for Gemini images and Veo video)');
  missing.push('cli:python3');
}

// 2. Python packages
if (py) {
  for (const [mod, pkg] of [['google.genai', 'google-genai'], ['PIL', 'Pillow']]) {
    try {
      execFileSync(py, ['-c', `import ${mod}`], { stdio: 'ignore' });
      line(true, `package ${pkg}`);
    } catch {
      line(false, `package ${pkg}`, `${py} -m pip install google-genai pillow`);
      missing.push(`pkg:${pkg}`);
    }
  }
}

// 3. Gemini key: env var, or the private file the first-run setup writes. Never print the key.
const keyFile = path.join(os.homedir(), '.imaginator.env');
let hasKey = Boolean(process.env.GEMINI_API_KEY);
if (!hasKey && existsSync(keyFile)) {
  try { hasKey = /^export GEMINI_API_KEY=\S+/m.test(readFileSync(keyFile, 'utf8')); } catch { /* unreadable */ }
}
line(hasKey, 'Gemini key', 'run /imaginator: its first-run setup walks you through it (not needed for the OpenArt engine)');
if (!hasKey) missing.push('env:GEMINI_API_KEY');

// 4. Optional tools: reported, never counted as missing
for (const cli of ['ffprobe']) {
  let ok = true;
  try { execFileSync(process.platform === 'win32' ? 'where' : 'which', [cli], { stdio: 'ignore' }); } catch { ok = false; }
  console.log(`${ok ? '✓' : '·'} ${cli} (optional: verifies downloaded video clips)`);
}

// 5. MCP connectors: only Claude can see them; checked in-session.
console.log('· OpenArt MCP (second video engine) and Canva connector: checked inside Claude, both optional');

for (const m of missing) console.error(`MISSING:${m}`);
console.log(missing.length ? `\n${missing.length} item(s) to set up. Run /imaginator and it will walk you through them.` : '\nToolkit ready.');
process.exit(missing.length ? 1 : 0);
