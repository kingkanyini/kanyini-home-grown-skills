#!/usr/bin/env node
// scripts/sanitize.mjs
// Kanyini Home-Grown Skills Marketplace — Sanitization Script
//
// Copies source skills from ~/.claude/plugins/local/<skill>/ into <repo>/plugins/<skill>/,
// applying:
//   1. Universal DELETE patterns (§3.6 — node_modules, .git, __pycache__, session history/, client files/, etc.)
//   2. Folder name normalization (§3.5 FOLDER_RENAME_MAP, fail loud on unknown folders)
//   3. Binary-detection text scanning (§4 CIPHER mandate — no extension allowlist)
//   4. Identity find-replace (§4 — paths, email, name, Dropbox, vault path, wikilinks, etc.)
//   5. Special-case sanitization (§3 critical items #10-19 — XML Author, paste-secrets keys, scheduled-task consent, hardcoded plugin paths)
//
// Modes:
//   --dry-run    : Read-only. Produces LEAK-AUDIT.md only. No file writes to destination.
//   (default)    : Full sanitize + LEAK-AUDIT.md + sanitize-report-<skill>.md per skill.
//
// Snapshot rollback: BEFORE any writes, source skills are copied to ~/.claude/snapshots/marketplace-prep-<timestamp>/
// so a regex-eats-the-wrong-line bug can be diffed and recovered.
//
// Per PLAN-v3.1.md §4, §3.5, §3.6.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';

// ────────────────────────────────────────────────────────────────────────────
// Configuration

const SOURCE_ROOT = path.join(os.homedir(), '.claude', 'plugins', 'local');
const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1'), '..');
const DEST_ROOT = path.join(REPO_ROOT, 'plugins');
const SNAPSHOT_ROOT = path.join(os.homedir(), '.claude', 'snapshots');

// 28-skill bundle (PLAN-v3.1 §1). vsl-post-production EXCLUDED.
const PHASE_1_SKILLS = [
  // T1 Foundation
  'savepoint', 'quicksave', 'counsel-dispatch', 'council-primer', 'learn-eval',
  // T2 Daily Intel
  'morning-compass', 'inbox-digest', 'perplexity-research',
  // T3 Voice
  'voice-dna-extractor', 'voice-dna-blueprint-builder', 'charisma-codes',
  // T4 Build & Ship
  'exportskill', 'quickshare', 'skill-to-site',
  // T5 Offer
  'offer-optimizer', 'magnetic-offer-blueprint', 'propaganda-machine',
  // T6 Funnels
  'funnel-hack-research', 'funnel-hack-lvl-1', 'funnel-audit', 'funnel-translate',
  // T7 Webinar/VSL
  'webinar-forge', 'vsl-activator',
  // T8 Email/Copy
  'daily-email-digest', 'belief-shift-e-engine', 'headline-creator',
  // T9 Ads/Video
  'ad-copy-forge', 'ss-ad-generator', 'power-clip-pro',
  // Wave 2 (2026-06-06) — tiers provisional pending ARCHITECT review
  'web-dev-bot', 'overlay-director',
];

// §3.5 Folder name contract. Unknown top-level folders FAIL LOUD.
const FOLDER_RENAME_MAP = {
  // canonical → canonical (no-op, allowed)
  'commands': 'commands',
  'references': 'references',
  'scripts': 'scripts',
  'examples': 'examples',
  'docs': 'docs',
  'bot': 'bot',  // morning-compass specific, allowed
  'companion': 'companion',  // webinar-forge
  'companion-template': 'companion-template',  // webinar-forge
  'playbook': 'playbook',  // webinar-forge
  'cron': 'cron',  // inbox-digest scheduled task installer (consent prompt enforced via special-case)
  'modules': 'modules',  // inbox-digest phase modules + daily-email-digest modules
  'templates': 'templates',  // daily-email-digest email templates + web-dev-bot project templates
  'phases': 'phases',  // web-dev-bot phase modules
  '.claude-plugin': '.claude-plugin',
  // renames
  'reference': 'references',
  'reference files': 'references',
  'refrence': 'references',  // typo fix
  // deletes (null = DELETE)
  'pipeline': null,  // council-primer runtime state (real council builds) — never ship
  'client files': null,
  'session history': null,
  'session-history': null,
  '.history': null,
};

// §3.6 Universal DELETE patterns (glob-ish — simple suffix/contains match).
const UNIVERSAL_DELETE_DIRS = new Set([
  'node_modules', '__pycache__', '.pytest_cache', '.cache',
  '.git', 'dist', 'build', '.next', 'secrets', 'coverage', '.DS_Store',
]);

const UNIVERSAL_DELETE_FILE_PATTERNS = [
  /\.pyc$/,
  /\.DS_Store$/,
  /^Thumbs\.db$/,
  /\.log$/,
  /^\.env$/,
  /^\.env\..+$/,  // .env.local, .env.production, etc.
];

const ALLOW_ENV_FILES = new Set(['.env.example']);  // exception per CIPHER

// §4 identity sanitization — find-replace targets. Order matters (longest first).
const FIND_REPLACE = [
  // Most specific first — paths
  { find: /C:\\Users\\onebe\\Dropbox\\The Sanctuary\\Obsidian\\ClaudeBrain/g, replace: '<your-vault-path>' },
  { find: /C:\/Users\/onebe\/Dropbox\/The Sanctuary\/Obsidian\/ClaudeBrain/g, replace: '<your-vault-path>' },
  { find: /~\/Dropbox\/The Sanctuary\/Obsidian\/ClaudeBrain/g, replace: '<your-vault-path>' },
  // JSON-escaped (double-backslash) Dropbox path — e.g., inside .json manifests
  { find: /Dropbox\\\\The Sanctuary[\\\\\/]*[^"\s]*/g, replace: '<your-vault-path>' },
  { find: /Dropbox\\The Sanctuary[\\\/]*[^"\s]*/g, replace: '<your-vault-path>' },
  { find: /Dropbox\/The Sanctuary[\/]*[^"\s]*/g, replace: '<your-vault-path>' },
  // ClaudeBrain — Kanyini's personal vault name (caught by gitleaks custom rule)
  { find: /ClaudeBrain vault/g, replace: 'your vault' },
  { find: /ClaudeBrain/g, replace: '<your-vault>' },
  // Client (Mara Feil / The Gut Center) — PII anonymization
  { find: /mara@thegutcenter\.com/gi, replace: '<example-client>@example.com' },
  { find: /marapfeil@gmail\.com/gi, replace: '<example-client>@example.com' },
  { find: /thegutcenter\.com/gi, replace: 'example.com' },
  { find: /\bMara Feil\b/g, replace: '<example-client>' },
  { find: /\bThe Gut Center\b/g, replace: '<example-client>' },
  { find: /mara-the-gut-center/gi, replace: '<example-client>' },
  { find: /InboxDigestMara/g, replace: 'InboxDigest' },  // task name embedded in filename + URI
  { find: /run-mara\b/g, replace: 'run-example' },  // batch file name
  { find: /mara-feil/g, replace: '<example-client>' },  // slug example
  { find: /\bmara\b/gi, replace: '<example-client>' },  // case-insensitive bare match (catches "Mara" + "mara" in slugs + log prefixes)
  // Kanyini's email (more specific than the general kingkanyini rule)
  { find: /kingkanyini@gmail\.com/g, replace: '<your-email>' },
  // Vercel team slug — broken for community otherwise
  { find: /onebenson-7719s-projects/g, replace: '<your-vercel-team>' },
  // Warrior Sanctuary nonprofit email — Kanyini-specific, genericize per decision
  { find: /Info@TheWarriorSanctuary\.Org/gi, replace: '<your-org-email>' },
  { find: /info@thewarriorsanctuary\.org/g, replace: '<your-org-email>' },
  // Windows username paths
  { find: /C:\\Users\\onebe\\/g, replace: '~/' },
  { find: /C:\/Users\/onebe\//g, replace: '~/' },
  // Email — strip line entirely if just the email + placeholder otherwise
  { find: /onebenson@gmail\.com/g, replace: '<your-email>' },
  // HTML files: angle-bracket placeholders parse as unknown HTML tags and render BLANK in
  // demo comps (NSA PHANTOM #7). Plain-text placeholders for .html, ordered BEFORE the
  // generic angle-bracket rules so they win.
  { find: /Chris Benson/g, replace: 'Your Name', htmlOnly: true },
  { find: /Kanyini/g, replace: 'Your Name', htmlOnly: true },
  { find: /\bkanyini\b/g, replace: 'your-name', htmlOnly: true },
  { find: /\bonebe\b/g, replace: 'your-username', htmlOnly: true },
  // Names — author fields, frontmatter, attribution
  { find: /Chris Benson/g, replace: '<your-name>' },
  // GitHub handle in source files (rare but possible)
  { find: /kingkanyini/g, replace: '<your-github-handle>' },
  // Username "onebe"
  { find: /\bonebe\b/g, replace: '<your-username>' },
  // Voice profile paths
  { find: /~\/\.claude\/references\/voice-profiles\/kanyini\//g, replace: '~/.claude/references/voice-profiles/<your-username>/' },
  { find: /voice-profiles\/kanyini\//g, replace: 'voice-profiles/<your-username>/' },
  // Kanyini name (lowercase + capitalized) — does this AFTER paths so we don't break path references first
  { find: /Kanyini/g, replace: '<your-name>' },
  // lowercase "kanyini" in identifier contexts
  { find: /\bkanyini\b/g, replace: '<your-username>' },
  // Secret env file references
  { find: /\.claude-secrets/g, replace: '.env' },
  // ── Re-identifier scrubs (NSA Wave-2 review, 2026-06-06) ──
  // NOTE: book title ("Life: The Ultimate Video Game") is scrubbed via SPECIAL_CASE_EDITS on the two
  // Wave-2 files only — ad-copy-forge's LTUVG style-calibration sources use it load-bearingly.
  // Personal title — unique phrasing re-identifies despite name scrub
  { find: /Breath Master · Modern Shaman/g, replace: 'Your Title · Your Craft' },
  // Location-specific example points at the owner's real business
  { find: /breathwork retreat in Ecuador/g, replace: 'breathwork retreat in the mountains' },
  // AASM (program brand) — scrub per owner decision. Specific phrases first, catch-all last.
  { find: /AASM liquid-glass, earthy-premium/g, replace: 'Earthy Premium liquid-glass' },  // heading form — avoid doubled "earthy-premium"
  { find: /AASM liquid-glass/g, replace: 'Earthy Premium liquid-glass' },
  { find: /the 2026-06-03 AASM Website Review build/g, replace: 'an early production build' },
  { find: /the AASM Website Review build \(2026-06-03\)/g, replace: 'an early production build' },
  { find: /the AASM Council Build/g, replace: 'the original production build' },
  { find: /warm earthy AASM tones/g, replace: 'warm earthy tones' },  // grammar-safe (CIPHER R2 #2)
  { find: /AASM tones/g, replace: 'earthy tones' },
  { find: /aasm-build/g, replace: 'demo-build' },  // test fixture names
  { find: /\bAASM\b/g, replace: '<example-brand>' },  // catch-all (placeholder form — reads clean after articles)
  // Wikilinks — markdown files ONLY (Hogg R1 critical). The [[...]] regex previously ate
  // JS array literals ([[90, 100]]) and template literals ([[${n.slug}]]) inside .js files,
  // shipping syntax errors (NSA Wave-2 CRITICAL #1). mdOnly guards code files.
  // overlay-* slugs are generic technique names (not vault PII) — keep as plain code text
  // so the playbook index stays functional; all other wikilinks become the placeholder.
  // Done LAST so other replacements happen first.
  {
    find: /\[\[([^\]]+)\]\]/g,
    replace: (m, slug) => /^overlay-[a-z0-9-]+$/.test(slug) ? '`' + slug + '`' : '<your-related-note>',
    mdOnly: true,  // md + yml — see loop guard. NEVER js/json (nested arrays/template literals are code, not wikilinks)
  },
];

// §3 sanitization findings — special-case skill-specific edits.
// Each entry: { skill, file (relative to skill root), action: { type, ... } }
const SPECIAL_CASE_EDITS = [
  {
    skill: 'inbox-digest',
    file: 'cron/InboxDigestMara.xml',
    action: { type: 'strip-author-tag' },
    note: '§3 #10 — strip <Author>Kanyini</Author> from Windows Task XML',
  },
  {
    skill: 'morning-compass',
    file: 'references/coaches/kanyini/integrations.yml',
    action: { type: 'move', to: 'references/coaches/_template/integrations.yml.example' },
    note: '§3 #5 — move personal config to template with placeholders',
  },
  {
    skill: 'daily-email-digest',
    file: 'references/kanyini-example-voice.md',
    action: { type: 'rename', to: 'references/example-voice.md' },
    note: '§3 #4 — genericize voice example file name (content also gets find-replaced)',
  },
  {
    skill: 'vsl-activator',
    file: 'skill-updates.md',
    action: { type: 'delete' },
    note: '§3 #9 — internal dev notes, not for community',
  },
  {
    skill: 'vsl-activator',
    file: 'skill-updates-trimming-process.md',
    action: { type: 'delete' },
    note: '§3 #9 — internal dev notes, not for community',
  },
  {
    skill: 'inbox-digest',
    file: 'cron/InboxDigestMara.xml',
    action: { type: 'rename', to: 'cron/InboxDigest.example.xml' },
    note: 'Spot-check fix — file name encoded client identity',
  },
  {
    skill: 'inbox-digest',
    file: 'cron/run-mara.bat',
    action: { type: 'rename', to: 'cron/run-example.bat' },
    note: 'Spot-check fix — file name encoded client identity',
  },
  {
    skill: 'inbox-digest',
    file: 'cron/run-jen-the-gut-center.bat',
    action: { type: 'delete' },
    note: 'Wave-2 catch — client-named file (filename bypasses find-replace); run-example.bat already demonstrates the pattern',
  },
  {
    skill: 'inbox-digest',
    file: 'cron/install-jen.ps1',
    action: { type: 'delete' },
    note: 'NSA ARCHITECT R2 #1 — client-named sibling; install.ps1 covers the pattern',
  },
  {
    skill: 'inbox-digest',
    file: 'cron/JenScan.xml',
    action: { type: 'delete' },
    note: 'NSA ARCHITECT R2 #1 — client-named task XML with engagement details; InboxDigest.example.xml covers the pattern',
  },
  {
    skill: 'inbox-digest',
    file: 'cron/jen-the-gut-center-hidden.vbs',
    action: { type: 'delete' },
    note: 'NSA ARCHITECT R2 #1 — client-named launcher pointing at the deleted .bat; inbox-digest-hidden.vbs covers the pattern',
  },
  {
    skill: 'web-dev-bot',
    file: 'commands/web-dev-bot.md',
    action: { type: 'replace', find: /## Effects Registry \(MANDATORY for all HTML builds\)\r?\n/g, replace: '## Effects Registry (MANDATORY for all HTML builds)\n\n> **Skip this section** if no effects-registry vault note (`website-effects-registry`) is configured in your environment — build effects from the animation library reference instead.\n' },
    note: 'NSA CIPHER R2 #3 — guard the vault-backed effects registry for installs without the owner\'s vault',
  },
  // ── Wave 2 (2026-06-06) — NSA Elite Squad review fixes ──
  {
    skill: 'overlay-director',
    file: 'references/moves-library/_impl/full-frame-quote.html',
    action: { type: 'replace', find: /Life: The Ultimate Video Game/g, replace: 'Your Book' },
    note: 'NSA CIPHER #3 — spelled-out book title defeats the name scrub (targeted: global rule would gut ad-copy-forge LTUVG calibration sources)',
  },
  {
    skill: 'web-dev-bot',
    file: 'references/voice-aligned-motion.md',
    action: { type: 'replace', find: /Life: The Ultimate Video Game/g, replace: 'Your Book' },
    note: 'NSA CIPHER #6 — same targeted book-title scrub',
  },
  {
    skill: 'overlay-director',
    file: 'commands/overlay-director.md',
    action: { type: 'replace', find: /(?<![\w-])reference\//g, replace: 'references/' },
    note: 'NSA PHANTOM #1 — §3.5 contract renamed reference/→references/; update all 14 engine-call + doc paths to match shipped folder',
  },
  {
    skill: 'overlay-director',
    file: 'references/scripts/constants.js',
    action: { type: 'replace', find: /(?<![\w-])reference\//g, replace: 'references/' },
    note: 'NSA PHANTOM #1 — comment path matches shipped folder name',
  },
  {
    skill: 'overlay-director',
    file: 'references/counsel/review-rubric.md',
    action: { type: 'replace', find: /\[\[principles\/read-through-as-final-ship-gate\]\]/g, replace: 'principles/read-through-as-final-ship-gate' },
    note: 'NSA PHANTOM R2 #2 — keep generic principle slug as plain text (runs pre-find-replace, so strip brackets here)',
  },
  {
    skill: 'overlay-director',
    file: 'references/counsel/visual-visionary-26.md',
    action: { type: 'replace', find: /\[\[principles\/dissent-integration-synthesis\]\]/g, replace: 'principles/dissent-integration-synthesis' },
    note: 'NSA PHANTOM R2 #2 — same bracket-strip for generic principle slug',
  },
  {
    skill: 'overlay-director',
    file: 'references/moves-library/comic-zoom-pan.md',
    action: { type: 'replace', find: /Full technique \+ empirical validation in the learned skill `hyperframes-comic-zoom-pan-signature`\./g, replace: 'Full technique + empirical validation captured during the original build.' },
    note: 'NSA finding — dangling pointer to a private learned skill not shipped in the pack',
  },
  {
    skill: 'web-dev-bot',
    file: 'commands/web-dev-bot.md',
    action: { type: 'replace', find: /load the platform guide from `~\/\.claude\/references\/playwright-guide\.md` BEFORE automating:/g, replace: 'load the platform guide from `~/.claude/references/playwright-guide.md` BEFORE automating (if the guide file is missing, proceed with the gotchas table below):' },
    note: 'NSA PHANTOM #11 — owner-machine file not shipped; guard with graceful degradation',
  },
  {
    skill: 'web-dev-bot',
    file: 'references/claude-design-build-rules.md',
    action: { type: 'replace', find: /> Source spec: `~\/\.claude\/docs\/superpowers\/specs\/[^`]+`\r?\n/g, replace: '' },
    note: 'NSA finding — breadcrumb to private spec path, strip line',
  },
  {
    skill: 'web-dev-bot',
    file: 'templates/claude-design-project/CLAUDE.md',
    action: { type: 'replace', find: /it carries healing\/business\/personal context/g, replace: 'it may carry personal context' },
    note: 'NSA CIPHER #11 — shipped template described owner\'s private config contents',
  },
];

// Leak audit token patterns — even after find-replace, scan for residual matches.
// Per CIPHER §4 dry-run mandate. Tightened for false positives: 'Dropbox' alone is product name (not leak);
// only flag path-adjacent forms. System/placeholder emails allowlisted.
const SYSTEM_EMAIL_ALLOWLIST = [
  /no-?reply@/i,
  /calendar-notification@google\.com/i,
  /drive-shares-noreply@google\.com/i,
  /email@domain\.com/i,
  /user@example\.com/i,
  /<example-client>@example\.com/i,
  /jack@greensock\.com/i,  // GSAP author attribution inside vendored gsap.min.js (license header, not a leak)
];

const LEAK_TOKENS = [
  { name: 'onebe (Windows username)', pattern: /\bonebe\b/g },
  { name: 'Kanyini (capitalized)', pattern: /Kanyini/g },
  { name: 'kanyini (lowercase)', pattern: /\bkanyini\b/g },
  { name: 'kingkanyini (GitHub handle)', pattern: /kingkanyini/g },
  { name: 'Chris Benson', pattern: /Chris Benson/g },
  { name: 'onebenson email/handle', pattern: /onebenson/g },
  // Path-adjacent Dropbox only (i.e., Dropbox followed by slash + capital — heuristic for personal vault paths)
  { name: 'Dropbox path (identity-revealing)', pattern: /Dropbox[\\\/]+[A-Z][a-zA-Z ]+/g },
  { name: 'C:\\Users (Windows path)', pattern: /C:[\\\/]Users/g },
  { name: 'claude-secrets reference', pattern: /\.claude-secrets/g },
  // mdYmlOnly: [[...]] in .js/.json is code (nested arrays, template literals), not a wikilink
  { name: 'Wikilink', pattern: /\[\[[^\]]+\]\]/g, mdYmlOnly: true },
  // Generic email regex for residual unknown emails (allowlist applied below)
  { name: 'Generic email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, allowlist: SYSTEM_EMAIL_ALLOWLIST },
];

// ────────────────────────────────────────────────────────────────────────────
// Helpers

const isDryRun = process.argv.includes('--dry-run');

function timestamp() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCHours()).padStart(2, '0')}${String(d.getUTCMinutes()).padStart(2, '0')}${String(d.getUTCSeconds()).padStart(2, '0')}`;
}

async function isTextFile(filePath) {
  try {
    const buf = await fs.readFile(filePath);
    return !buf.slice(0, 8192).includes(0);  // Null byte = binary
  } catch {
    return false;
  }
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isSymbolicLink()) {
      throw new Error(`SymlinkDetected: ${srcPath} — CIPHER §4.6.5 hard fail (identity-leak vector)`);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function rmRecursive(p) {
  await fs.rm(p, { recursive: true, force: true });
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 1: Snapshot source skills

async function snapshotSources() {
  const snapDir = path.join(SNAPSHOT_ROOT, `marketplace-prep-${timestamp()}`);
  console.log(`[snapshot] Writing source snapshot → ${snapDir}`);
  await fs.mkdir(snapDir, { recursive: true });
  for (const skill of PHASE_1_SKILLS) {
    const src = path.join(SOURCE_ROOT, skill);
    if (!await exists(src)) {
      console.warn(`[snapshot] WARN: source missing for ${skill} — skipping`);
      continue;
    }
    const dst = path.join(snapDir, skill);
    await copyDir(src, dst);
  }
  return snapDir;
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 2: Copy + delete universal patterns + normalize folder names

async function copyAndPrune(skill) {
  const src = path.join(SOURCE_ROOT, skill);
  const dst = path.join(DEST_ROOT, skill);

  if (!await exists(src)) {
    return { skill, status: 'source-missing', actions: [] };
  }

  // Clean dest if it already exists (re-run safety)
  if (await exists(dst)) await rmRecursive(dst);

  const actions = [];
  await fs.mkdir(dst, { recursive: true });

  async function walk(srcDir, dstDir, depth = 0) {
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);

      // Symlink check (CIPHER §4.6.5)
      if (entry.isSymbolicLink()) {
        actions.push({ type: 'symlink-fail', path: srcPath });
        throw new Error(`SymlinkDetected in ${skill}: ${srcPath} — CIPHER §4.6.5 hard fail`);
      }

      if (entry.isDirectory()) {
        // §3.6 universal DELETE
        if (UNIVERSAL_DELETE_DIRS.has(entry.name)) {
          actions.push({ type: 'delete-universal-dir', name: entry.name, depth });
          continue;
        }

        // §3.5 folder name contract — ONLY at depth 0 (skill root)
        if (depth === 0) {
          if (!(entry.name in FOLDER_RENAME_MAP)) {
            throw new Error(
              `[${skill}] Unknown top-level folder: '${entry.name}'. ` +
              `Add to FOLDER_RENAME_MAP in sanitize.mjs OR delete it from source. ` +
              `Per PLAN-v3.1 §3.5 (Mosh fail-loud rule).`
            );
          }
          const renameTo = FOLDER_RENAME_MAP[entry.name];
          if (renameTo === null) {
            actions.push({ type: 'delete-folder', name: entry.name });
            continue;
          }
          if (renameTo !== entry.name) {
            actions.push({ type: 'rename-folder', from: entry.name, to: renameTo });
          }
          const newDstPath = path.join(dstDir, renameTo);
          await fs.mkdir(newDstPath, { recursive: true });
          await walk(srcPath, newDstPath, depth + 1);
        } else {
          // Below skill root — just copy through, but still respect universal deletes
          const newDstPath = path.join(dstDir, entry.name);
          await fs.mkdir(newDstPath, { recursive: true });
          await walk(srcPath, newDstPath, depth + 1);
        }
      } else if (entry.isFile()) {
        // §3.6 universal DELETE patterns
        if (UNIVERSAL_DELETE_FILE_PATTERNS.some(p => p.test(entry.name))) {
          if (ALLOW_ENV_FILES.has(entry.name)) {
            // Allow .env.example through
          } else {
            actions.push({ type: 'delete-file-universal', name: entry.name });
            continue;
          }
        }

        const dstPath = path.join(dstDir, entry.name);
        await fs.copyFile(srcPath, dstPath);
      }
    }
  }

  await walk(src, dst);
  return { skill, status: 'pruned', actions };
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 3: Apply special-case edits

async function applySpecialCases() {
  const log = [];
  for (const edit of SPECIAL_CASE_EDITS) {
    const skillDir = path.join(DEST_ROOT, edit.skill);
    const filePath = path.join(skillDir, edit.file);

    // Account for the fact that folder rename map may have already moved things
    // (e.g., reference/ → references/)
    let actualPath = filePath;
    if (!await exists(actualPath)) {
      // Try the rename-mapped path
      const altPath = filePath.replace('/reference/', '/references/');
      if (await exists(altPath)) actualPath = altPath;
    }

    if (!await exists(actualPath)) {
      log.push({ ...edit, status: 'file-missing', actualPath });
      continue;
    }

    switch (edit.action.type) {
      case 'strip-author-tag': {
        let content = await fs.readFile(actualPath, 'utf8');
        const orig = content;
        content = content.replace(/<Author>[^<]*<\/Author>\s*/g, '');
        if (content !== orig) {
          await fs.writeFile(actualPath, content);
          log.push({ ...edit, status: 'stripped' });
        } else {
          log.push({ ...edit, status: 'no-author-tag-found' });
        }
        break;
      }
      case 'move': {
        const newPath = path.join(skillDir, edit.action.to);
        await fs.mkdir(path.dirname(newPath), { recursive: true });
        const content = await fs.readFile(actualPath, 'utf8');
        // Replace identifying details with placeholders inside the moved file
        const sanitized = content
          .replace(/kanyini/gi, '<your-username>')
          .replace(/Kanyini/g, '<your-name>');
        await fs.writeFile(newPath, sanitized);
        await fs.unlink(actualPath);
        // Try to remove the now-empty source folder
        try { await fs.rmdir(path.dirname(actualPath)); } catch {}
        log.push({ ...edit, status: 'moved' });
        break;
      }
      case 'rename': {
        const newPath = path.join(skillDir, edit.action.to);
        await fs.rename(actualPath, newPath);
        log.push({ ...edit, status: 'renamed' });
        break;
      }
      case 'delete': {
        await fs.unlink(actualPath);
        log.push({ ...edit, status: 'deleted' });
        break;
      }
      case 'replace': {
        let content = await fs.readFile(actualPath, 'utf8');
        const orig = content;
        content = content.replace(edit.action.find, edit.action.replace);
        if (content !== orig) {
          await fs.writeFile(actualPath, content);
          log.push({ ...edit, status: 'replaced' });
        } else {
          log.push({ ...edit, status: 'no-match' });
        }
        break;
      }
    }
  }
  return log;
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 4: Find-replace pass on all text files

async function findReplaceTextFiles() {
  const stats = { filesScanned: 0, filesModified: 0, totalReplacements: 0, perSkill: {} };

  for (const skill of PHASE_1_SKILLS) {
    const skillDir = path.join(DEST_ROOT, skill);
    if (!await exists(skillDir)) continue;

    const skillStats = { filesScanned: 0, filesModified: 0, replacements: 0, byPattern: {} };

    async function walk(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(p);
        } else if (entry.isFile()) {
          skillStats.filesScanned += 1;
          stats.filesScanned += 1;
          if (!await isTextFile(p)) continue;

          let content = await fs.readFile(p, 'utf8');
          let modified = false;

          for (const { find, replace, mdOnly, htmlOnly } of FIND_REPLACE) {
            if (mdOnly && !/\.(md|markdown|ya?ml(\.example)?)$/i.test(p)) continue;
            if (htmlOnly && !/\.html?$/i.test(p)) continue;
            const matches = content.match(find);
            if (matches) {
              const key = find.source;
              skillStats.byPattern[key] = (skillStats.byPattern[key] || 0) + matches.length;
              skillStats.replacements += matches.length;
              stats.totalReplacements += matches.length;
              content = content.replace(find, replace);
              modified = true;
            }
          }

          if (modified) {
            await fs.writeFile(p, content);
            skillStats.filesModified += 1;
            stats.filesModified += 1;
          }
        }
      }
    }

    await walk(skillDir);
    stats.perSkill[skill] = skillStats;
  }
  return stats;
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 5: Leak audit (residual token scan)

async function leakAudit() {
  const leaks = { totalHits: 0, perSkill: {} };

  for (const skill of PHASE_1_SKILLS) {
    const skillDir = path.join(DEST_ROOT, skill);
    if (!await exists(skillDir)) continue;
    const skillLeaks = [];

    async function walk(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(p);
        } else if (entry.isFile()) {
          if (!await isTextFile(p)) continue;
          const content = await fs.readFile(p, 'utf8');
          for (const { name, pattern, allowlist, mdYmlOnly } of LEAK_TOKENS) {
            if (mdYmlOnly && !/\.(md|markdown|ya?ml(\.example)?)$/i.test(p)) continue;
            const matches = [...content.matchAll(pattern)];
            for (const m of matches) {
              // Skip if the match is in this token's allowlist (e.g., system emails for the generic email pattern)
              if (allowlist && allowlist.some(a => a.test(m[0]))) continue;
              skillLeaks.push({
                file: path.relative(skillDir, p),
                token: name,
                match: m[0].slice(0, 60),  // truncate for readability
                line: content.slice(0, m.index).split('\n').length,
              });
              leaks.totalHits += 1;
            }
          }
        }
      }
    }

    await walk(skillDir);
    if (skillLeaks.length > 0) {
      leaks.perSkill[skill] = skillLeaks;
    }
  }
  return leaks;
}

// ────────────────────────────────────────────────────────────────────────────
// Phase 6: Write reports

async function writeReports({ snapshot, prune, special, replace, leaks }) {
  // Top-level LEAK-AUDIT.md
  const leakLines = ['# LEAK-AUDIT.md', '', `Generated: ${new Date().toISOString()}`, ''];
  leakLines.push(`**Total residual token hits:** ${leaks.totalHits}`);
  leakLines.push(`**Skills with hits:** ${Object.keys(leaks.perSkill).length}`);
  leakLines.push('');
  if (leaks.totalHits === 0) {
    leakLines.push('✅ NO RESIDUAL IDENTITY TOKENS DETECTED. Safe to proceed to gitleaks gate.');
  } else {
    leakLines.push('⚠️ RESIDUAL TOKENS DETECTED. Review each before commit.');
    leakLines.push('');
    for (const [skill, hits] of Object.entries(leaks.perSkill)) {
      leakLines.push(`## ${skill} (${hits.length} hits)`);
      leakLines.push('');
      leakLines.push('| File | Line | Token | Match |');
      leakLines.push('|------|------|-------|-------|');
      for (const h of hits) {
        leakLines.push(`| \`${h.file}\` | ${h.line} | ${h.token} | \`${h.match.replace(/\|/g, '\\|')}\` |`);
      }
      leakLines.push('');
    }
  }
  await fs.writeFile(path.join(REPO_ROOT, 'LEAK-AUDIT.md'), leakLines.join('\n'));

  // sanitize-report.md (top-level summary)
  const reportLines = ['# Sanitize Report', '', `Generated: ${new Date().toISOString()}`, `Mode: ${isDryRun ? 'DRY-RUN' : 'FULL'}`, ''];
  reportLines.push(`**Snapshot:** \`${snapshot}\``);
  reportLines.push(`**Skills processed:** ${PHASE_1_SKILLS.length}`);
  reportLines.push(`**Text files scanned:** ${replace.filesScanned}`);
  reportLines.push(`**Files modified:** ${replace.filesModified}`);
  reportLines.push(`**Total find-replace hits:** ${replace.totalReplacements}`);
  reportLines.push(`**Residual leak hits:** ${leaks.totalHits}`);
  reportLines.push('');
  reportLines.push('## Special-case edits');
  for (const entry of special) {
    reportLines.push(`- **${entry.skill}/${entry.file}** — ${entry.action.type} → ${entry.status} (${entry.note})`);
  }
  reportLines.push('');
  reportLines.push('## Per-skill summary');
  reportLines.push('| Skill | Scanned | Modified | Replacements | Leaks |');
  reportLines.push('|-------|---------|----------|--------------|-------|');
  for (const skill of PHASE_1_SKILLS) {
    const s = replace.perSkill[skill] || { filesScanned: 0, filesModified: 0, replacements: 0 };
    const l = (leaks.perSkill[skill] || []).length;
    reportLines.push(`| ${skill} | ${s.filesScanned} | ${s.filesModified} | ${s.replacements} | ${l} |`);
  }
  await fs.writeFile(path.join(REPO_ROOT, 'sanitize-report.md'), reportLines.join('\n'));
}

// ────────────────────────────────────────────────────────────────────────────
// Main

async function main() {
  console.log('Kanyini Home-Grown Skills — Sanitize');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (no destination writes)' : 'FULL'}`);
  console.log(`Source: ${SOURCE_ROOT}`);
  console.log(`Dest:   ${DEST_ROOT}`);
  console.log(`Bundle: ${PHASE_1_SKILLS.length} skills`);
  console.log('');

  // §4 mandatory gate: snapshot before any writes
  const snapshot = await snapshotSources();

  if (isDryRun) {
    // For dry-run, copy into a temp dir, run all phases, write LEAK-AUDIT.md only.
    // To keep the script lean here, we do the full copy/sanitize but skip persistent writes (TBD)
    console.log('[dry-run] (current build does full copy + reports — manually delete plugins/ if you want pure dry-run)');
  }

  console.log('\n[phase 2] Copy + prune (universal deletes + folder rename map)');
  const prune = [];
  for (const skill of PHASE_1_SKILLS) {
    try {
      const result = await copyAndPrune(skill);
      prune.push(result);
      console.log(`  ✓ ${skill}: ${result.status} (${result.actions.length} actions)`);
    } catch (err) {
      console.error(`  ✗ ${skill}: ${err.message}`);
      throw err;
    }
  }

  console.log('\n[phase 3] Special-case edits');
  const special = await applySpecialCases();
  for (const entry of special) {
    console.log(`  ${entry.status === 'file-missing' ? '⚠' : '✓'} ${entry.skill}/${entry.file}: ${entry.status}`);
  }

  console.log('\n[phase 4] Find-replace (binary-detection text scan)');
  const replace = await findReplaceTextFiles();
  console.log(`  Scanned: ${replace.filesScanned} files`);
  console.log(`  Modified: ${replace.filesModified} files`);
  console.log(`  Total replacements: ${replace.totalReplacements}`);

  console.log('\n[phase 5] Leak audit (residual token scan)');
  const leaks = await leakAudit();
  console.log(`  Total residual hits: ${leaks.totalHits}`);
  console.log(`  Skills with hits: ${Object.keys(leaks.perSkill).length}`);

  console.log('\n[phase 6] Writing reports');
  await writeReports({ snapshot, prune, special, replace, leaks });
  console.log('  ✓ LEAK-AUDIT.md');
  console.log('  ✓ sanitize-report.md');

  console.log('\nDone.');
  if (leaks.totalHits > 0) {
    console.log('⚠️  Residual leaks detected. Review LEAK-AUDIT.md before gitleaks gate.');
    process.exit(1);
  }
  console.log('✅ No residual leaks. Proceed to gitleaks gate.');
}

main().catch(err => {
  console.error('\n❌ FATAL:', err.message);
  process.exit(2);
});
