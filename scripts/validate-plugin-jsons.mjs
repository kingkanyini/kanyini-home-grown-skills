#!/usr/bin/env node
// scripts/validate-plugin-jsons.mjs
// Validates every plugins/<skill>/.claude-plugin/plugin.json against schemas/plugin.schema.json.
// Also enforces PLAN-v3.1 §4.6: every skill must ship preflight.mjs AND preflight.mjs
// must import (text-match) its sibling plugin.json's prereqs block.
//
// Exit 0 = all valid. Exit 1 = at least one failure.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Ajv2020 as Ajv } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1'), '..');
const PLUGINS_DIR = path.join(REPO_ROOT, 'plugins');
const SCHEMA_PATH = path.join(REPO_ROOT, 'schemas', 'plugin.schema.json');

async function main() {
  const schema = JSON.parse(await fs.readFile(SCHEMA_PATH, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  const skills = (await fs.readdir(PLUGINS_DIR, { withFileTypes: true }))
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let failures = 0;
  const results = [];

  for (const skill of skills) {
    const pluginJsonPath = path.join(PLUGINS_DIR, skill, '.claude-plugin', 'plugin.json');
    const preflightPath = path.join(PLUGINS_DIR, skill, 'preflight.mjs');
    const readmePath = path.join(PLUGINS_DIR, skill, 'README.md');
    const changelogPath = path.join(PLUGINS_DIR, skill, 'CHANGELOG.md');

    // §5.5.1 required files check
    const required = [
      { path: pluginJsonPath, name: '.claude-plugin/plugin.json' },
      { path: preflightPath, name: 'preflight.mjs' },
      { path: readmePath, name: 'README.md' },
      { path: changelogPath, name: 'CHANGELOG.md' },
    ];

    const missing = [];
    for (const r of required) {
      try { await fs.access(r.path); } catch { missing.push(r.name); }
    }

    if (missing.length > 0) {
      failures += 1;
      results.push({ skill, status: 'fail', errors: [`Missing required files: ${missing.join(', ')}`] });
      continue;
    }

    // Schema validation
    const pluginJson = JSON.parse(await fs.readFile(pluginJsonPath, 'utf8'));
    const valid = validate(pluginJson);

    if (!valid) {
      failures += 1;
      results.push({
        skill,
        status: 'fail',
        errors: validate.errors.map(e => `${e.instancePath || '/'} ${e.message}`),
      });
      continue;
    }

    // §4.6 preflight.mjs contract — must reference its sibling plugin.json's prereqs
    const preflight = await fs.readFile(preflightPath, 'utf8');
    if (!preflight.includes('plugin.json') && !preflight.includes('prereqs')) {
      failures += 1;
      results.push({
        skill,
        status: 'fail',
        errors: ['preflight.mjs does not reference plugin.json or prereqs — must consume the prereqs block per PLAN-v3.1 §4.6'],
      });
      continue;
    }

    // Name must match folder name
    if (pluginJson.name !== skill) {
      failures += 1;
      results.push({
        skill,
        status: 'fail',
        errors: [`plugin.json.name='${pluginJson.name}' does not match folder name='${skill}'`],
      });
      continue;
    }

    results.push({ skill, status: 'pass' });
  }

  // Report
  console.log(`validate-plugin-jsons: ${skills.length} skills`);
  for (const r of results) {
    if (r.status === 'pass') {
      console.log(`  ✓ ${r.skill}`);
    } else {
      console.log(`  ✗ ${r.skill}`);
      for (const e of r.errors) console.log(`      ${e}`);
    }
  }

  if (failures > 0) {
    console.log(`\n❌ ${failures}/${skills.length} skills failed validation.`);
    process.exit(1);
  }
  console.log(`\n✅ All ${skills.length} plugin.json files valid.`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(2); });
