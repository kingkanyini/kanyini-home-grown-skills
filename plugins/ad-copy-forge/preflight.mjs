#!/usr/bin/env node
// preflight.mjs — ad-copy-forge
// Verifies prereqs declared in .claude-plugin/plugin.json before skill runs.
// Per PLAN-v3.1 §4.6 contract:
//   exit 0 = ready · exit 1 = missing prereq · exit 2 = config error
//   stdout = human-readable status · stderr = MISSING:<name> per line (machine-parsable)

import { promises as fs } from 'node:fs';
import path from 'node:path';

const SKILL_DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1');
const PLUGIN_JSON = path.join(SKILL_DIR, '.claude-plugin', 'plugin.json');

async function main() {
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(PLUGIN_JSON, 'utf8'));
  } catch (err) {
    console.error('CONFIG_ERROR: cannot read plugin.json:', err.message);
    process.exit(2);
  }

  const { prereqs = {} } = manifest;
  const missing = [];

  // MCPs — check via marker file or env (best-effort; real verification happens at MCP layer)
  for (const mcp of prereqs.mcps || []) {
    // No reliable shell check from preflight; document the expectation.
    console.log('Expects MCP:', mcp);
  }

  // CLIs — verify on PATH
  const { execSync } = await import('node:child_process');
  for (const cli of prereqs.clis || []) {
    try {
      execSync(`${process.platform === 'win32' ? 'where' : 'which'} ${cli}`, { stdio: 'ignore' });
      console.log(`✓ CLI: ${cli}`);
    } catch {
      console.log(`✗ CLI missing: ${cli}`);
      console.error(`MISSING:cli:${cli}`);
      missing.push(`cli:${cli}`);
    }
  }

  // Env vars
  for (const v of prereqs.envVars || []) {
    if (process.env[v]) {
      console.log(`✓ Env: ${v}`);
    } else {
      console.log(`✗ Env missing: ${v}`);
      console.error(`MISSING:env:${v}`);
      missing.push(`env:${v}`);
    }
  }

  // External services — informational only
  for (const svc of prereqs.services || []) {
    console.log('Expects service auth:', svc);
  }

  // Skill dependencies (other plugins required at runtime)
  for (const dep of manifest.requires || []) {
    const depName = typeof dep === 'string' ? dep : dep.name;
    console.log('Requires installed skill:', depName);
  }

  if (missing.length > 0) {
    console.log(`\nPREFLIGHT FAILED — ${missing.length} prereq(s) missing. See docs/prereq-setup.md.`);
    process.exit(1);
  }

  console.log('\nPREFLIGHT OK — ad-copy-forge is ready to run.');
  process.exit(0);
}

main();
