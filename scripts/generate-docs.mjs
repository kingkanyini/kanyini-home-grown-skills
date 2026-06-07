#!/usr/bin/env node
// scripts/generate-docs.mjs
// Auto-generates 3 metadata-driven docs from per-skill plugin.json:
//   - docs/skills-by-tier.md
//   - docs/dependency-graph.md (Mermaid DAG + cross-matrix + MCP reverse-index)
//   - docs/prereq-setup.md (MCP/CLI/env-var setup grouped by service)

import { promises as fs } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1'), '..');
const PLUGINS_DIR = path.join(REPO_ROOT, 'plugins');
const DOCS_DIR = path.join(REPO_ROOT, 'docs');

const TIER_NAMES = {
  T1: 'Foundation / Memory',
  T2: 'Daily Intel',
  T3: 'Voice / Personalization',
  T4: 'Build & Ship',
  T5: 'Offer & Messaging',
  T6: 'Funnels',
  T7: 'Webinar / VSL',
  T8: 'Email / Copy',
  T9: 'Ads / Video',
};

function depName(d) { return typeof d === 'string' ? d : d.name; }

async function loadPlugins() {
  const dirs = (await fs.readdir(PLUGINS_DIR, { withFileTypes: true }))
    .filter(d => d.isDirectory())
    .map(d => d.name);
  const plugins = {};
  for (const name of dirs) {
    const p = path.join(PLUGINS_DIR, name, '.claude-plugin', 'plugin.json');
    try { plugins[name] = JSON.parse(await fs.readFile(p, 'utf8')); }
    catch { /* skip */ }
  }
  return plugins;
}

function classifyTier(plugin) {
  if ((plugin.requires || []).length > 1) return 'LEAF';
  if ((plugin.requires || []).length === 1) return 'MID';
  return 'ROOT';
}

async function generateSkillsByTier(plugins) {
  const lines = [
    '# Skills by Tier',
    '',
    `The marketplace ships ${Object.keys(plugins).length} skills across ${new Set(Object.values(plugins).map(p => p.tier)).size} tiers. Install order matters — install T1 Foundation first; later tiers may depend on earlier ones (see [dependency-graph.md](./dependency-graph.md)).`,
    '',
  ];

  for (const [code, name] of Object.entries(TIER_NAMES)) {
    const skills = Object.entries(plugins)
      .filter(([, p]) => p.tier === code)
      .map(([n, p]) => ({ name: n, ...p }));
    if (skills.length === 0) continue;
    lines.push(`## ${code} — ${name}`);
    lines.push('');
    for (const s of skills) {
      lines.push(`### \`${s.name}\``);
      lines.push('');
      lines.push(s.description);
      lines.push('');
      const hardDeps = (s.requires || []).map(d => `\`${depName(d)}\``).join(', ') || '_none_';
      const softDeps = (s.recommends || []).map(d => `\`${depName(d)}\``).join(', ') || '_none_';
      lines.push(`- **Requires:** ${hardDeps}`);
      lines.push(`- **Recommends:** ${softDeps}`);
      lines.push('');
    }
  }
  await fs.writeFile(path.join(DOCS_DIR, 'skills-by-tier.md'), lines.join('\n'));
}

async function generateDependencyGraph(plugins) {
  const names = Object.keys(plugins);
  const lines = [
    '# Dependency Graph',
    '',
    'Per PLAN-v3.1 §2.5. Three views: (1) Mermaid DAG of skill→skill dependencies, (2) cross-matrix of prereq class × dep tier, (3) MCP reverse-index for `hermes-doctor` (Phase 2).',
    '',
    '## 1. Skill → Skill DAG',
    '',
    '```mermaid',
    'graph LR',
  ];

  // Mermaid edges
  for (const name of names) {
    const p = plugins[name];
    for (const r of p.requires || []) {
      lines.push(`    ${depName(r)} --> ${name}`);
    }
  }
  lines.push('```');
  lines.push('');
  lines.push('Soft dependencies (`recommends:`) are not shown — they cascade noise; see per-skill `plugin.json` for the full list.');
  lines.push('');

  // Cross-matrix
  lines.push('## 2. Cross-Matrix (Prereq Class × Dep Tier)');
  lines.push('');
  lines.push('Two orthogonal taxonomies — skill→skill graph tier AND external-prereq class. Both matter for install ordering and `hermes-doctor` (Phase 2).');
  lines.push('');
  lines.push('| Skill | Dep Tier | Prereq Class |');
  lines.push('|-------|----------|--------------|');
  for (const name of names) {
    const p = plugins[name];
    const depTier = classifyTier(p);
    const hasMCPs = (p.prereqs?.mcps || []).length > 0;
    const hasCLIs = (p.prereqs?.clis || []).length > 0;
    const hasServices = (p.prereqs?.services || []).length > 0;
    let prereqClass;
    if (hasMCPs && (hasCLIs || hasServices)) prereqClass = 'Heavy-prereq';
    else if (hasMCPs) prereqClass = 'Vault-only';
    else if (hasCLIs || hasServices) prereqClass = 'Service-only';
    else prereqClass = 'Standalone';
    lines.push(`| \`${name}\` | ${depTier} | ${prereqClass} |`);
  }
  lines.push('');

  // MCP reverse-index
  lines.push('## 3. MCP Reverse-Index');
  lines.push('');
  lines.push('When an MCP server is down or missing, which skills break? `hermes-doctor` (Phase 2) uses this to answer in O(1).');
  lines.push('');
  const mcpMap = new Map();
  for (const [name, p] of Object.entries(plugins)) {
    for (const m of p.prereqs?.mcps || []) {
      const family = m.match(/^(mcp__[a-zA-Z0-9_-]+)/)?.[1] || m;
      if (!mcpMap.has(family)) mcpMap.set(family, []);
      mcpMap.get(family).push(name);
    }
  }
  lines.push('| MCP Family | Skills That Depend On It |');
  lines.push('|------------|--------------------------|');
  for (const [family, skills] of [...mcpMap.entries()].sort()) {
    lines.push(`| \`${family}\` | ${skills.map(s => `\`${s}\``).join(', ')} |`);
  }
  lines.push('');

  await fs.writeFile(path.join(DOCS_DIR, 'dependency-graph.md'), lines.join('\n'));
}

async function generatePrereqSetup(plugins) {
  // Group prereqs by category
  const allMCPs = new Set();
  const allCLIs = new Set();
  const allEnvVars = new Set();
  const allServices = new Set();
  for (const p of Object.values(plugins)) {
    for (const m of p.prereqs?.mcps || []) allMCPs.add(m);
    for (const c of p.prereqs?.clis || []) allCLIs.add(c);
    for (const e of p.prereqs?.envVars || []) allEnvVars.add(e);
    for (const s of p.prereqs?.services || []) allServices.add(s);
  }

  const MCP_INSTALL = {
    'mcp__obsidian-brain__*': 'See https://github.com/obsidian-brain/mcp — install into your Claude Code MCP config pointing at your Obsidian vault.',
    'mcp__perplexity__*': 'See https://github.com/perplexity/mcp — requires `PERPLEXITY_API_KEY` env var.',
    'mcp__yt-dlp-mcp__*': 'See https://github.com/yt-dlp/mcp — requires `yt-dlp` CLI on PATH.',
    'mcp__ffmpeg-mcp__*': 'See https://github.com/ffmpeg/mcp — requires `ffmpeg` CLI on PATH.',
    'mcp__gmail-gong-mcp__*': 'See https://github.com/gongrzhe/gmail-mcp — requires Gmail OAuth credentials.',
    'mcp__composio__*': 'See https://docs.composio.dev/mcp — requires `COMPOSIO_API_KEY`. Bridges 100+ services (Calendar, Stripe, Calendly, ClickFunnels, etc.).',
    'mcp__claude_ai_Canva__*': 'Built into claude.ai — link your Canva account in the integrations panel.',
  };

  const CLI_INSTALL = {
    'git': 'Pre-installed on most systems. Mac: `brew install git`. Windows: https://git-scm.com.',
    'node': 'Install Node.js 20+ from https://nodejs.org or via your package manager.',
    'npx': 'Bundled with Node.js.',
    'python': 'Install Python 3.10+ from https://python.org or your package manager.',
    'pwsh': 'PowerShell 7+. Windows: comes pre-installed. Mac: `brew install powershell`.',
    'yt-dlp': 'Install: `pip install yt-dlp` or `brew install yt-dlp`.',
    'ffmpeg': 'Mac: `brew install ffmpeg`. Windows: `winget install ffmpeg`. Linux: `apt install ffmpeg`.',
  };

  const lines = [
    '# Prerequisite Setup',
    '',
    'This guide walks through every external dependency the Phase 1 bundle uses. Not every skill needs every dependency — see each skill\'s `README.md` for its specific list, or run `node preflight.mjs` from the skill\'s folder.',
    '',
    '## MCP Servers',
    '',
  ];
  for (const m of [...allMCPs].sort()) {
    lines.push(`### \`${m}\``);
    lines.push('');
    lines.push(MCP_INSTALL[m] || '_(install docs TBD — see skill README)_');
    lines.push('');
  }

  lines.push('## CLI Tools');
  lines.push('');
  for (const c of [...allCLIs].sort()) {
    lines.push(`### \`${c}\``);
    lines.push('');
    lines.push(CLI_INSTALL[c] || '_(install docs TBD)_');
    lines.push('');
  }

  lines.push('## Environment Variables');
  lines.push('');
  lines.push('Set these in your `.env` file or your shell environment. Never commit `.env` to git.');
  lines.push('');
  lines.push('| Variable | Used by | Where to get |');
  lines.push('|----------|---------|--------------|');
  for (const e of [...allEnvVars].sort()) {
    const users = Object.entries(plugins)
      .filter(([, p]) => p.prereqs?.envVars?.includes(e))
      .map(([n]) => `\`${n}\``)
      .join(', ');
    lines.push(`| \`${e}\` | ${users} | _(set per service docs)_ |`);
  }
  lines.push('');

  lines.push('## External Services');
  lines.push('');
  lines.push('Some skills call out to managed services. You\'ll need accounts + auth for each.');
  lines.push('');
  for (const s of [...allServices].sort()) {
    const users = Object.entries(plugins)
      .filter(([, p]) => p.prereqs?.services?.includes(s))
      .map(([n]) => `\`${n}\``)
      .join(', ');
    lines.push(`- **${s}** — used by ${users}`);
  }

  await fs.writeFile(path.join(DOCS_DIR, 'prereq-setup.md'), lines.join('\n'));
}

async function main() {
  const plugins = await loadPlugins();
  await fs.mkdir(DOCS_DIR, { recursive: true });
  await generateSkillsByTier(plugins);
  await generateDependencyGraph(plugins);
  await generatePrereqSetup(plugins);
  console.log('✓ docs/skills-by-tier.md');
  console.log('✓ docs/dependency-graph.md');
  console.log('✓ docs/prereq-setup.md');
}

main().catch(err => { console.error('FATAL:', err); process.exit(2); });
