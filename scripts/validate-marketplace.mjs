#!/usr/bin/env node
// scripts/validate-marketplace.mjs
// Validates .claude-plugin/marketplace.json against schemas/marketplace.schema.json.
//
// Enforces PLAN-v3.1 §2.5 mandatory validator behavior (HARDENED v3.1):
//   0. Self-loop pre-check → SelfDependencyError
//   1. Kahn's algorithm topological sort → throw on cycle
//   2. Verify every requires:/recommends: target exists in marketplace + has plugins/<name>/ folder
//   2b. Verify EVERY plugin key in marketplace.json has matching plugins/<name>/ folder (ARCHITECT R3)
//   3. Verify semver pinning — object form preferred, bare string warned
//   4. MCP reverse-index completeness → MissingMCPReverseIndexError
//   5. Cross-matrix row count = plugins.length → IncompleteCrossMatrixError
//
// Diamond dependency conflict detection (§4.6 v3.1) → DiamondConflictError
// Transitive deprecated dep WARN (§4.6 v3.1)
//
// Exit 0 = all valid. Exit 1 = at least one failure.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Ajv2020 as Ajv } from 'ajv/dist/2020.js';
import semver from 'semver';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1'), '..');
const MARKETPLACE_PATH = path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json');
const MARKETPLACE_SCHEMA = path.join(REPO_ROOT, 'schemas', 'marketplace.schema.json');
const DEPENDENCY_GRAPH_PATH = path.join(REPO_ROOT, 'docs', 'dependency-graph.md');
const PLUGINS_DIR = path.join(REPO_ROOT, 'plugins');

const errors = [];
const warnings = [];

function err(name, msg) { errors.push(`${name}: ${msg}`); }
function warn(name, msg) { warnings.push(`${name}: ${msg}`); }

function depName(d) { return typeof d === 'string' ? d : d.name; }
function depVersion(d) { return typeof d === 'string' ? '*' : d.version; }

async function main() {
  // 1. Schema validation
  const schema = JSON.parse(await fs.readFile(MARKETPLACE_SCHEMA, 'utf8'));
  const marketplace = JSON.parse(await fs.readFile(MARKETPLACE_PATH, 'utf8'));
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(marketplace)) {
    for (const e of validate.errors) err('SchemaError', `${e.instancePath || '/'} ${e.message}`);
  }

  // marketplace.plugins is an ARRAY of { name, source } (Claude Code schema). Derive the
  // name list from it. Per-plugin version/deps come from each plugin.json, loaded below.
  const pluginKeys = (marketplace.plugins || []).map(p => p.name);

  // 2b. Every plugin key has matching plugins/<name>/ folder
  for (const name of pluginKeys) {
    const folder = path.join(PLUGINS_DIR, name);
    try { await fs.access(folder); } catch {
      err('MissingPluginFolder', `marketplace.json declares '${name}' but plugins/${name}/ folder is missing`);
    }
  }

  // Load each plugin.json to get requires/recommends/deprecated
  const plugins = {};
  for (const name of pluginKeys) {
    const pluginJsonPath = path.join(PLUGINS_DIR, name, '.claude-plugin', 'plugin.json');
    try {
      plugins[name] = JSON.parse(await fs.readFile(pluginJsonPath, 'utf8'));
    } catch {
      err('PluginJsonMissing', `Cannot read plugins/${name}/.claude-plugin/plugin.json`);
      plugins[name] = null;
    }
  }

  // Validator step 0: self-loop pre-check (NEW v3.1 per Hogg)
  for (const [name, p] of Object.entries(plugins)) {
    if (!p) continue;
    const allDeps = [...(p.requires || []), ...(p.recommends || [])].map(depName);
    if (allDeps.includes(name)) {
      err('SelfDependencyError', `Plugin '${name}' lists itself in requires or recommends. Contributors typo their own skill names — this catches it.`);
    }
  }

  // Validator step 2: requires/recommends targets exist
  for (const [name, p] of Object.entries(plugins)) {
    if (!p) continue;
    for (const dep of [...(p.requires || []), ...(p.recommends || [])]) {
      const d = depName(dep);
      if (!plugins[d]) {
        err('DanglingDependency', `Plugin '${name}' references unknown skill '${d}'`);
      }
    }
  }

  // Validator step 3: semver pinning warnings
  for (const [name, p] of Object.entries(plugins)) {
    if (!p) continue;
    for (const dep of p.requires || []) {
      if (typeof dep === 'string') {
        warn('BareStringDep', `Plugin '${name}' uses bare-string require '${dep}' (means '*'). Use {name, version} object form.`);
      }
    }
  }

  // Validator step 1: Kahn's algorithm topological sort on requires[]
  const requiresEdges = {};
  for (const [name, p] of Object.entries(plugins)) {
    if (!p) continue;
    requiresEdges[name] = (p.requires || []).map(depName);
  }

  const inDegree = {};
  for (const name of Object.keys(plugins)) inDegree[name] = 0;
  for (const [name, deps] of Object.entries(requiresEdges)) {
    for (const d of deps) {
      if (plugins[d]) inDegree[d] = (inDegree[d] || 0) + 1;
    }
  }

  const queue = Object.keys(inDegree).filter(n => inDegree[n] === 0);
  const sorted = [];
  while (queue.length > 0) {
    const n = queue.shift();
    sorted.push(n);
    for (const d of requiresEdges[n] || []) {
      inDegree[d] -= 1;
      if (inDegree[d] === 0) queue.push(d);
    }
  }
  if (sorted.length !== Object.keys(plugins).length) {
    const cyclic = Object.keys(inDegree).filter(n => inDegree[n] > 0);
    err('CycleDetected', `Hard requires cycle: ${cyclic.join(' → ')}`);
  }

  // Diamond conflict detection (NEW v3.1 per Hogg)
  // For each plugin, walk transitive requires, collect all (skill, version-range) pairs per dep.
  // If two paths demand non-overlapping ranges for the same dep → DiamondConflictError.
  for (const [root, p] of Object.entries(plugins)) {
    if (!p) continue;
    const seen = new Map();  // depName → [{path, range}]
    function walk(current, pathSoFar) {
      const cur = plugins[current];
      if (!cur) return;
      for (const dep of cur.requires || []) {
        const d = depName(dep);
        const v = depVersion(dep);
        const fullPath = [...pathSoFar, d];
        if (!seen.has(d)) seen.set(d, []);
        seen.get(d).push({ path: fullPath, range: v });
        walk(d, fullPath);
      }
    }
    walk(root, [root]);

    for (const [d, occurrences] of seen.entries()) {
      if (occurrences.length < 2) continue;
      // Check if all ranges are compatible (intersect)
      const ranges = occurrences.map(o => o.range).filter(r => r !== '*');
      if (ranges.length < 2) continue;
      // Version source is each plugin's own plugin.json (release-train `latest` removed 2026-06-04).
      const latest = plugins[d]?.version;
      if (!latest) continue;
      // Find which ranges are NOT satisfied by latest
      const unsatisfied = occurrences.filter(o => o.range !== '*' && !semver.satisfies(latest, o.range));
      if (unsatisfied.length > 0 && occurrences.some(o => o.range !== '*' && semver.satisfies(latest, o.range))) {
        // Some paths satisfied, some not — diamond conflict
        err('DiamondConflictError',
          `Plugin '${root}' has conflicting transitive requirements on '${d}':\n` +
          occurrences.map(o => `      Path: ${o.path.join(' → ')} requires ${o.range}`).join('\n') +
          `\n      Latest available: ${latest}`
        );
      }
    }
  }

  // Transitive deprecated dep WARN (NEW v3.1)
  for (const [name, p] of Object.entries(plugins)) {
    if (!p) continue;
    for (const dep of p.requires || []) {
      const d = depName(dep);
      const target = plugins[d];
      if (target?.deprecated) {
        warn('DeprecatedTransitiveDep',
          `Plugin '${name}' depends on '${d}' which is deprecated` +
          (target.replacedBy ? ` (replacedBy: ${target.replacedBy})` : '') +
          '. Install proceeds, but update plugin.json.requires[].'
        );
      }
    }
  }

  // Validator step 4: MCP reverse-index completeness (NEW v3.1)
  // Every MCP family in any plugin's prereqs.mcps[] must appear in docs/dependency-graph.md.
  const allMCPs = new Set();
  for (const p of Object.values(plugins)) {
    if (!p) continue;
    for (const m of p.prereqs?.mcps || []) {
      // Normalize: strip trailing __* or specific tool name to get the family
      const family = m.match(/^(mcp__[a-zA-Z0-9_-]+)/)?.[1];
      if (family) allMCPs.add(family);
    }
  }
  try {
    const depGraph = await fs.readFile(DEPENDENCY_GRAPH_PATH, 'utf8');
    for (const family of allMCPs) {
      if (!depGraph.includes(family)) {
        err('MissingMCPReverseIndexError', `MCP family '${family}' used by skills but missing from docs/dependency-graph.md MCP reverse-index`);
      }
    }

    // Validator step 5: Cross-matrix row count (NEW v3.1)
    // Heuristic: count table rows in dependency-graph.md, expect >= pluginKeys.length per matrix
    // Simple check: every skill name must appear as a row in some matrix.
    for (const name of pluginKeys) {
      if (!depGraph.includes(name)) {
        err('IncompleteCrossMatrixError', `Skill '${name}' missing from docs/dependency-graph.md cross-matrix`);
      }
    }
  } catch (e) {
    if (e.code === 'ENOENT') {
      warn('DependencyGraphMissing', `docs/dependency-graph.md not found — MCP reverse-index + cross-matrix not validated. Required before push.`);
    } else throw e;
  }

  // Report
  console.log(`validate-marketplace: ${pluginKeys.length} plugins, ${allMCPs.size} MCP families`);
  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} warnings:`);
    for (const w of warnings) console.log(`  ${w}`);
  }
  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} errors:`);
    for (const e of errors) console.log(`  ${e}`);
    process.exit(1);
  }
  console.log(`\n✅ Marketplace valid. Topological order: ${sorted.length} skills.`);
}

main().catch(err => { console.error('FATAL:', err); process.exit(2); });
