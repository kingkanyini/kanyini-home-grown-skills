#!/usr/bin/env node
// preflight.mjs — five-min-texter
// Verifies prereqs declared in .claude-plugin/plugin.json before the skill runs.
// Per the marketplace §4.6 contract:
//   exit 0 = ready · exit 1 = missing required prereq · exit 2 = config/read error
//   stdout = human-readable status · stderr = MISSING:<name> per line (machine-parsable)
//
// n8n-mcp is a RECOMMEND, not a hard require — its absence is logged, never a non-zero exit.
// The wizard can still run the whole intake without it; it only assists the n8n build in Phase 2.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_DIR = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_JSON = path.join(SKILL_DIR, '.claude-plugin', 'plugin.json');

// The engine files that MUST be present for the skill to function (a broken install = config error).
const REQUIRED_FILES = [
  'engine/workflow.n8n.json',
  'engine/error-workflow.n8n.json',
  'engine/lib/config-check.js',
  'commands/five-min-texter.md',
  'config.template.json',
];

async function main() {
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(PLUGIN_JSON, 'utf8'));
  } catch (err) {
    console.error('CONFIG_ERROR: cannot read plugin.json:', err.message);
    process.exit(2);
  }

  // Engine integrity — a missing core file is a broken install (config error), not a prereq gap.
  for (const rel of REQUIRED_FILES) {
    try {
      await fs.access(path.join(SKILL_DIR, rel));
      console.log(`✓ file: ${rel}`);
    } catch {
      console.error(`CONFIG_ERROR: required file missing: ${rel}`);
      process.exit(2);
    }
  }

  const { prereqs = {} } = manifest;
  const missing = [];

  // MCPs — informational only (recommends; never a non-zero exit).
  for (const mcp of prereqs.mcps || []) {
    console.log('Expects MCP (optional, assists Phase 2 build):', mcp);
  }

  // CLIs — verify on PATH (node is the only hard requirement).
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

  for (const v of prereqs.envVars || []) {
    if (process.env[v]) {
      console.log(`✓ Env: ${v}`);
    } else {
      console.log(`✗ Env missing: ${v}`);
      console.error(`MISSING:env:${v}`);
      missing.push(`env:${v}`);
    }
  }

  // External services — configured during the Setup walkthrough; informational here.
  for (const svc of prereqs.services || []) {
    console.log('Expects service auth (set up in Phase 2):', svc);
  }

  if (missing.length > 0) {
    console.log(`\nPREFLIGHT FAILED — ${missing.length} required prereq(s) missing.`);
    process.exit(1);
  }

  console.log('\nPREFLIGHT OK — five-min-texter is ready. Run /five-min-texter from the plugin root.');
  process.exit(0);
}

main();
