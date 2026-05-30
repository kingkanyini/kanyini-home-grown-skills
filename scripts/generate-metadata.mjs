#!/usr/bin/env node
// scripts/generate-metadata.mjs
// Generates all per-skill metadata + the top-level marketplace.json from a single config.
// Outputs: plugins/<skill>/{.claude-plugin/plugin.json, preflight.mjs, README.md, CHANGELOG.md} × 28
//          + .claude-plugin/marketplace.json
//
// Per PLAN-v3.1 §2.5 (dep graph) + §4.5 (schemas) + §4.6 (preflight contract) + §5.5 (per-skill folder contract).

import { promises as fs } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1'), '..');

// ────────────────────────────────────────────────────────────────────────────
// METADATA — one entry per skill. Tier + description + deps + prereqs.

const METADATA = {
  // T1 Foundation
  savepoint: {
    tier: 'T1',
    description: 'Save session context and git snapshots — your video game save point for agent work',
    requires: [],
    recommends: [],
    prereqs: { mcps: ['mcp__obsidian-brain__*'], clis: ['git'], envVars: [], services: [] },
    command: '/savepoint',
    usage: '/savepoint or /savepoint "brief description"',
  },
  quicksave: {
    tier: 'T1',
    description: 'Save progress of projects, conversations, or skills for personal reference',
    requires: [],
    recommends: [],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/quicksave',
    usage: '/quicksave [topic]',
  },
  'counsel-dispatch': {
    tier: 'T1',
    description: 'Dispatch a counsel member from the vault. Loads their stat sheet, embodies their voice, and logs the dispatch for XP accumulation.',
    requires: [],
    recommends: [],
    prereqs: { mcps: ['mcp__obsidian-brain__*'], clis: [], envVars: [], services: [] },
    command: '/counsel-dispatch',
    usage: '/counsel-dispatch [slug] about [topic]',
  },
  'learn-eval': {
    tier: 'T1',
    description: 'Extract reusable patterns from the session, self-evaluate quality before saving, and determine the right save location (Global vs Project)',
    requires: [],
    recommends: [],
    prereqs: { mcps: ['mcp__obsidian-brain__*'], clis: [], envVars: [], services: [] },
    command: '/learn-eval',
    usage: '/learn-eval',
  },
  // T2 Daily Intel
  'morning-compass': {
    tier: 'T2',
    description: '7-minute morning briefing for coaches — pulls from Google Calendar, Stripe, Calendly, ClickFunnels, Basecamp, Instagram, YouTube. Delivers single-page brief.',
    requires: [],
    recommends: [],
    prereqs: {
      mcps: ['mcp__composio__*', 'mcp__obsidian-brain__*'],
      clis: ['pwsh', 'node'],
      envVars: ['COMPOSIO_API_KEY'],
      services: ['Composio', 'Google Calendar', 'Stripe', 'Calendly', 'ClickFunnels', 'Basecamp', 'Instagram', 'YouTube'],
    },
    command: '/morning-compass',
    usage: '/morning-compass',
  },
  'inbox-digest': {
    tier: 'T2',
    description: 'Scan Gmail for client emails, file into vault per-client, generate per-client daily briefs',
    requires: [],
    recommends: [],
    prereqs: {
      mcps: ['mcp__gmail-gong-mcp__*', 'mcp__obsidian-brain__*'],
      clis: ['python', 'node', 'pwsh'],
      envVars: [],
      services: ['Gmail'],
    },
    command: '/inbox-digest',
    usage: '/inbox-digest <client-slug>',
  },
  'perplexity-research': {
    tier: 'T2',
    description: 'On-demand citation-rich research via Perplexity Sonar API. Quick (~10s), Standard (~30s), or Deep (2-5min) tiers.',
    requires: [],
    recommends: [],
    prereqs: {
      mcps: ['mcp__perplexity__*', 'mcp__obsidian-brain__*'],
      clis: [],
      envVars: ['PERPLEXITY_API_KEY'],
      services: ['Perplexity'],
    },
    command: '/perplexity-research',
    usage: '/perplexity-research [topic] [--depth quick|standard|deep]',
  },
  // T3 Voice
  'voice-dna-extractor': {
    tier: 'T3',
    description: 'Extract clean voice DNA audio from IG, YouTube, or local video files. Auto-cleans, quality-gates, outputs MP3 + voice profile card.',
    requires: [],
    recommends: [],
    prereqs: {
      mcps: ['mcp__yt-dlp-mcp__*', 'mcp__ffmpeg-mcp__*'],
      clis: ['yt-dlp', 'ffmpeg'],
      envVars: [],
      services: ['YouTube', 'Instagram'],
    },
    command: '/voice-dna-extractor',
    usage: '/voice-dna-extractor [url-or-path]',
  },
  'voice-dna-blueprint-builder': {
    tier: 'T3',
    description: 'Interview-based Voice DNA Blueprint generator. Walks a subject through a counsel-locked question bank (5/10/15q), then synthesizes a transcript + blueprint MD.',
    requires: [{ name: 'voice-dna-extractor', version: '^1.0.0' }],
    recommends: [{ name: 'savepoint', version: '^1.0.0' }],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/voice-dna-blueprint-builder',
    usage: '/voice-dna-blueprint-builder',
  },
  'charisma-codes': {
    tier: 'T3',
    description: 'Discover your unique Charisma Code (Energetic + Trust + Authority) using McCall Jones framework with breathwork and RPG-style discovery',
    requires: [],
    recommends: [],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/charisma-codes',
    usage: '/charisma-codes',
  },
  // T4 Build & Ship
  exportskill: {
    tier: 'T4',
    description: 'Export Claude Code skills to Claude Web project knowledge format',
    requires: [],
    recommends: [],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/exportskill',
    usage: '/exportskill [skill-name]',
  },
  quickshare: {
    tier: 'T4',
    description: 'Save any skill or content as a shareable universal AI prompt with optional access control + expiration',
    requires: [],
    recommends: [],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/quickshare',
    usage: '/quickshare [content-or-skill]',
  },
  'skill-to-site': {
    tier: 'T4',
    description: 'Turn any installed skill into a deployed Vercel chat site (Next.js + streaming Anthropic API + secret-safe env piping)',
    requires: [],
    recommends: [],
    prereqs: {
      mcps: [],
      clis: ['npx', 'node'],
      envVars: ['ANTHROPIC_API_KEY', 'VERCEL_TOKEN'],
      services: ['Vercel', 'Anthropic'],
    },
    command: '/skill-to-site',
    usage: '/skill-to-site [skill-name]',
  },
  // T5 Offer
  'offer-optimizer': {
    tier: 'T5',
    description: 'Comprehensive offer optimization — guides you through building messaging, positioning, and offer structure by reverse-engineering from your best client transformation',
    requires: [],
    recommends: [{ name: 'counsel-dispatch', version: '^1.0.0' }],
    prereqs: {
      mcps: ['mcp__claude_ai_Canva__*'],
      clis: [],
      envVars: [],
      services: ['Canva'],
    },
    command: '/offer-optimizer',
    usage: '/offer-optimizer',
  },
  'magnetic-offer-blueprint': {
    tier: 'T5',
    description: 'Embodiment-first offer creation with 3-person Council — 6 parts from soul alignment to strategic skeleton',
    requires: [],
    recommends: [],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/magnetic-offer-blueprint',
    usage: '/magnetic-offer-blueprint',
  },
  'propaganda-machine': {
    tier: 'T5',
    description: 'Build a belief-shifting content system from your Offer Optimizer using the Propaganda Machine framework',
    requires: [
      { name: 'voice-dna-blueprint-builder', version: '^1.0.0' },
      { name: 'offer-optimizer', version: '^1.0.0' },
    ],
    recommends: [{ name: 'counsel-dispatch', version: '^1.0.0' }],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/propaganda-machine',
    usage: '/propaganda-machine',
  },
  // T6 Funnels
  'funnel-hack-research': {
    tier: 'T6',
    description: 'Find the perfect funnels to hack — Phase B of the ABCDE framework. BMAD Analyst orchestrates parallel research agents.',
    requires: [],
    recommends: [],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/funnel-hack-research',
    usage: '/funnel-hack-research',
  },
  'funnel-hack-lvl-1': {
    tier: 'T6',
    description: 'Create a funnel for a new customer from scratch using the ABCDE + SWIPES framework with 3-hat copy counsel',
    requires: [],
    recommends: [{ name: 'counsel-dispatch', version: '^1.0.0' }],
    prereqs: { mcps: ['mcp__obsidian-brain__*'], clis: [], envVars: [], services: [] },
    command: '/funnel-hack-lvl-1',
    usage: '/funnel-hack-lvl-1',
  },
  'funnel-audit': {
    tier: 'T6',
    description: 'Funnel page audit with 6-agent scanning, belief architecture review, and micro-arc analysis',
    requires: [],
    recommends: [
      { name: 'counsel-dispatch', version: '^1.0.0' },
      { name: 'offer-optimizer', version: '^1.0.0' },
    ],
    prereqs: { mcps: ['mcp__obsidian-brain__*'], clis: [], envVars: [], services: [] },
    command: '/funnel-audit',
    usage: '/funnel-audit [url]',
  },
  'funnel-translate': {
    tier: 'T6',
    description: 'Voice-aware funnel translation with counsel review, formatting preservation, and Vercel deployment for team handoff',
    requires: [],
    recommends: [{ name: 'voice-dna-blueprint-builder', version: '^1.0.0' }],
    prereqs: {
      mcps: ['mcp__obsidian-brain__*'],
      clis: ['npx'],
      envVars: ['VERCEL_TOKEN'],
      services: ['Vercel'],
    },
    command: '/funnel-translate',
    usage: '/funnel-translate [source-funnel] [target-language]',
  },
  // T7 Webinar/VSL
  'webinar-forge': {
    tier: 'T7',
    description: 'Forge a Perfect Webinar script (outline + 90min + variants) with counsel guidance',
    requires: [{ name: 'voice-dna-blueprint-builder', version: '^1.0.0' }],
    recommends: [{ name: 'counsel-dispatch', version: '^1.0.0' }],
    prereqs: { mcps: ['mcp__obsidian-brain__*'], clis: [], envVars: [], services: [] },
    command: '/webinar-forge',
    usage: '/webinar-forge',
  },
  'vsl-activator': {
    tier: 'T7',
    description: 'Build high-converting VSL scripts merging Perfect Webinar + 6 Core Beliefs with VSL Allstar Squad counsel',
    requires: [],
    recommends: [
      { name: 'counsel-dispatch', version: '^1.0.0' },
      { name: 'voice-dna-blueprint-builder', version: '^1.0.0' },
    ],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/vsl-activator',
    usage: '/vsl-activator',
  },
  // T8 Email/Copy
  'daily-email-digest': {
    tier: 'T8',
    description: 'Write, review, and brainstorm emails with 3-hat counsel, Voice Foreman quality gate, and 3-level template training',
    requires: [{ name: 'voice-dna-blueprint-builder', version: '^1.0.0' }],
    recommends: [{ name: 'counsel-dispatch', version: '^1.0.0' }],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/daily-email-digest',
    usage: '/daily-email-digest',
  },
  'belief-shift-e-engine': {
    tier: 'T8',
    description: 'Build dual-path belief-shifting email sequences with entry emails, nurture + conversion CTAs, and reminder templates',
    requires: [],
    recommends: [{ name: 'offer-optimizer', version: '^1.0.0' }],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/belief-shift-e-engine',
    usage: '/belief-shift-e-engine',
  },
  'headline-creator': {
    tier: 'T8',
    description: 'High Converting Headline Creator — builds ICA avatars and generates three-tier headline sets for Facebook ads and short-form video',
    requires: [],
    recommends: [],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/headline-creator',
    usage: '/headline-creator',
  },
  // T9 Ads/Video
  'ad-copy-forge': {
    tier: 'T9',
    description: 'Convert video ad scripts into Meta-ready ad copy using the OO + Prop Machine + learned ad patterns with counsel review',
    requires: [
      { name: 'offer-optimizer', version: '^1.0.0' },
      { name: 'propaganda-machine', version: '^1.0.0' },
    ],
    recommends: [{ name: 'counsel-dispatch', version: '^1.0.0' }],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/ad-copy-forge',
    usage: '/ad-copy-forge',
  },
  'ss-ad-generator': {
    tier: 'T9',
    description: 'Subconscious Seduction Ad Generator — generate 14 psychology-driven video ads using psychological triggers + framework with 3-hat counsel',
    requires: [],
    recommends: [
      { name: 'counsel-dispatch', version: '^1.0.0' },
      { name: 'voice-dna-blueprint-builder', version: '^1.0.0' },
    ],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/ss-ad-generator',
    usage: '/ss-ad-generator',
  },
  'power-clip-pro': {
    tier: 'T9',
    description: 'Craft 3-5 minute value-first video scripts (Power Clips) with a 3-advisor counsel and 12-part framework',
    requires: [],
    recommends: [{ name: 'voice-dna-blueprint-builder', version: '^1.0.0' }],
    prereqs: { mcps: [], clis: [], envVars: [], services: [] },
    command: '/power-clip-pro',
    usage: '/power-clip-pro',
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Per-skill preflight.mjs template

function preflightScript(skill, meta) {
  return `#!/usr/bin/env node
// preflight.mjs — ${skill}
// Verifies prereqs declared in .claude-plugin/plugin.json before skill runs.
// Per PLAN-v3.1 §4.6 contract:
//   exit 0 = ready · exit 1 = missing prereq · exit 2 = config error
//   stdout = human-readable status · stderr = MISSING:<name> per line (machine-parsable)

import { promises as fs } from 'node:fs';
import path from 'node:path';

const SKILL_DIR = path.dirname(new URL(import.meta.url).pathname).replace(/^\\/([A-Z]:)/, '$1');
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
      execSync(\`\${process.platform === 'win32' ? 'where' : 'which'} \${cli}\`, { stdio: 'ignore' });
      console.log(\`✓ CLI: \${cli}\`);
    } catch {
      console.log(\`✗ CLI missing: \${cli}\`);
      console.error(\`MISSING:cli:\${cli}\`);
      missing.push(\`cli:\${cli}\`);
    }
  }

  // Env vars
  for (const v of prereqs.envVars || []) {
    if (process.env[v]) {
      console.log(\`✓ Env: \${v}\`);
    } else {
      console.log(\`✗ Env missing: \${v}\`);
      console.error(\`MISSING:env:\${v}\`);
      missing.push(\`env:\${v}\`);
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
    console.log(\`\\nPREFLIGHT FAILED — \${missing.length} prereq(s) missing. See docs/prereq-setup.md.\`);
    process.exit(1);
  }

  console.log('\\nPREFLIGHT OK — ${skill} is ready to run.');
  process.exit(0);
}

main();
`;
}

// Per-skill README.md template
function readmeContent(skill, meta) {
  return `# ${skill}

> ${meta.description}

**Tier:** ${meta.tier}
**Version:** 1.0.0
**Command:** \`${meta.command}\`

## Usage

\`\`\`
${meta.usage}
\`\`\`

## Prerequisites

${formatPrereqs(meta.prereqs, meta.requires, meta.recommends)}

Run \`node preflight.mjs\` from this skill's folder to verify all prereqs are met.

## See also

- [\`docs/skills-by-tier.md\`](../../docs/skills-by-tier.md) — full tier list
- [\`docs/prereq-setup.md\`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [\`docs/dependency-graph.md\`](../../docs/dependency-graph.md) — skill dependencies
`;
}

function formatPrereqs(p, requires = [], recommends = []) {
  const lines = [];
  if (requires.length > 0) {
    lines.push('**Required skills** (install these first):');
    for (const r of requires) lines.push(`- \`${typeof r === 'string' ? r : r.name}\``);
    lines.push('');
  }
  if (recommends.length > 0) {
    lines.push('**Recommended skills** (warning if missing, not blocking):');
    for (const r of recommends) lines.push(`- \`${typeof r === 'string' ? r : r.name}\``);
    lines.push('');
  }
  if (p.mcps?.length) {
    lines.push('**MCP servers:**');
    for (const m of p.mcps) lines.push(`- \`${m}\``);
    lines.push('');
  }
  if (p.clis?.length) {
    lines.push('**CLI tools:**');
    for (const c of p.clis) lines.push(`- \`${c}\``);
    lines.push('');
  }
  if (p.envVars?.length) {
    lines.push('**Environment variables:**');
    for (const e of p.envVars) lines.push(`- \`${e}\``);
    lines.push('');
  }
  if (p.services?.length) {
    lines.push('**External services:**');
    for (const s of p.services) lines.push(`- ${s}`);
    lines.push('');
  }
  return lines.join('\n') || 'No prerequisites — standalone skill.';
}

// Per-skill CHANGELOG.md
function changelogContent(skill) {
  return `# ${skill} — Changelog

## 1.0.0 — Initial release

First version published in the Kanyini Home-Grown Skills Marketplace.
`;
}

// ────────────────────────────────────────────────────────────────────────────
// Main

async function main() {
  console.log(`Generating metadata for ${Object.keys(METADATA).length} skills...`);

  for (const [skill, meta] of Object.entries(METADATA)) {
    const skillDir = path.join(REPO_ROOT, 'plugins', skill);

    // plugin.json — NO $schema field (top-level additionalProperties: false in plugin.schema.json)
    const pluginJson = {
      name: skill,
      version: '1.0.0',
      description: meta.description,
      author: { name: 'Kanyini' },
      tier: meta.tier,
      requires: meta.requires,
      recommends: meta.recommends,
      prereqs: meta.prereqs,
    };
    const pluginJsonPath = path.join(skillDir, '.claude-plugin', 'plugin.json');
    await fs.mkdir(path.dirname(pluginJsonPath), { recursive: true });
    await fs.writeFile(pluginJsonPath, JSON.stringify(pluginJson, null, 2) + '\n');

    // preflight.mjs
    await fs.writeFile(path.join(skillDir, 'preflight.mjs'), preflightScript(skill, meta));

    // README.md
    await fs.writeFile(path.join(skillDir, 'README.md'), readmeContent(skill, meta));

    // CHANGELOG.md
    await fs.writeFile(path.join(skillDir, 'CHANGELOG.md'), changelogContent(skill));

    console.log(`  ✓ ${skill}`);
  }

  // marketplace.json — NO $schema field (additionalProperties: false in marketplace.schema.json)
  const marketplaceJson = {
    name: 'kanyini-home-grown-skills',
    version: '1.0.0',
    description: 'Private Claude Code plugin marketplace — coaches, healers, spiritual entrepreneurs building their agentic chief of staff',
    owner: { name: 'Kanyini' },
    plugins: Object.fromEntries(
      Object.keys(METADATA).map(skill => [skill, { latest: '1.0.0', yanked: [], deprecated: false }])
    ),
  };
  await fs.writeFile(
    path.join(REPO_ROOT, '.claude-plugin', 'marketplace.json'),
    JSON.stringify(marketplaceJson, null, 2) + '\n'
  );
  console.log(`  ✓ marketplace.json (${Object.keys(METADATA).length} plugins listed)`);

  console.log('\n✅ Metadata generation complete.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(2); });
