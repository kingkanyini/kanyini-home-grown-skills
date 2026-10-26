#!/usr/bin/env node
// preflight.mjs — webinar-dev-bot
// Checks the toolkit before a build. Contract (same as every marketplace skill):
//   exit 0 = ready · exit 1 = missing prereq · exit 2 = config error
//   stdout = human-readable status · stderr = MISSING:<name> per line (machine-parsable)
// Missing pieces never block the interview/outline/HTML build; they only gate the phase that needs them.

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

// 1. Python 3.9+
let py = null;
for (const cand of process.platform === 'win32' ? ['python', 'py', 'python3'] : ['python3', 'python']) {
  try {
    const v = execFileSync(cand, ['-c', 'import sys;print("%d.%d"%sys.version_info[:2])'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    const [maj, min] = v.split('.').map(Number);
    if (maj === 3 && min >= 9) { py = cand; line(true, `Python ${v} (${cand})`); break; }
  } catch { /* try next */ }
}
if (!py) {
  line(false, 'Python 3.9+', process.platform === 'darwin' ? 'run /webinar-tutorial → Gear Up → Step 1.1' : 'install from python.org');
  missing.push('cli:python3');
}

// 2. Python packages
if (py) {
  for (const [mod, pkg] of [['pptx', 'python-pptx'], ['PIL', 'Pillow'], ['google.genai', 'google-genai']]) {
    try {
      execFileSync(py, ['-c', `import ${mod}`], { stdio: 'ignore' });
      line(true, `package ${pkg}`);
    } catch {
      line(false, `package ${pkg}`, `${py} -m pip install -r scripts/requirements.txt`);
      missing.push(`pkg:${pkg}`);
    }
  }
}

// 3. Gemini key (env var OR ~/.webinar-kit/gemini.env written by setup_key.py). Never print the key.
const keyFile = path.join(os.homedir(), '.webinar-kit', 'gemini.env');
let hasKey = Boolean(process.env.GEMINI_API_KEY);
if (!hasKey && existsSync(keyFile)) {
  try { hasKey = /^GEMINI_API_KEY=\S+/m.test(readFileSync(keyFile, 'utf8')); } catch { /* unreadable */ }
}
line(hasKey, 'Gemini key', 'run /webinar-tutorial → Gear Up → Step 1.3');
if (!hasKey) missing.push('env:GEMINI_API_KEY');

// 4. Companion skills (best-effort: read Claude Code's installed plugin list)
const installed = path.join(os.homedir(), '.claude', 'plugins', 'installed_plugins.json');
let pluginList = '';
try { pluginList = readFileSync(installed, 'utf8'); } catch { /* not readable — skip */ }
for (const skill of ['offer-optimizer', 'propaganda-machine']) {
  if (!pluginList) { console.log(`? ${skill} (couldn't read installed plugins; check with /plugin)`); continue; }
  const ok = pluginList.includes(`"${skill}@`);
  line(ok, `/${skill}`, `/plugin install ${skill}@kanyini-home-grown-skills`);
  if (!ok) missing.push(`skill:${skill}`);
}

// 5. Canva connector — only Claude can see connectors; checked in-session.
console.log('· Canva connector: checked inside Claude (needed only for the Canva design draft route)');

for (const m of missing) console.error(`MISSING:${m}`);
console.log(missing.length ? `\n${missing.length} item(s) to set up. Run /webinar-tutorial for step-by-step help.` : '\nToolkit ready.');
process.exit(missing.length ? 1 : 0);
