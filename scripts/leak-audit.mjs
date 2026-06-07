#!/usr/bin/env node
// scripts/leak-audit.mjs
// Standalone leak audit — scans plugins/ for any residual Kanyini-specific identity tokens
// post-sanitize. Used by pre-commit hooks + CI + manual `npm run leak-audit`.
// Per PLAN-v3.1 §4 (CIPHER dry-run mandate).
//
// Exit 0 = clean. Exit 1 = at least one hit found.
// Generates LEAK-AUDIT.md at repo root.

import { promises as fs } from 'node:fs';
import path from 'node:path';

const REPO_ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Z]:)/, '$1'), '..');
const PLUGINS_DIR = path.join(REPO_ROOT, 'plugins');

// System/placeholder emails — false positives, don't flag.
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
  { name: 'onebenson email prefix', pattern: /onebenson/g },
  // Path-adjacent Dropbox only (heuristic: Dropbox followed by slash + capital letter — personal vault paths)
  { name: 'Dropbox path (identity-revealing)', pattern: /Dropbox[\\\/]+[A-Z][a-zA-Z ]+/g },
  { name: 'ClaudeBrain vault folder', pattern: /ClaudeBrain/g },
  { name: 'C:\\Users (Windows path)', pattern: /C:[\\\/]Users/g },
  { name: 'claude-secrets reference', pattern: /\.claude-secrets/g },
  // mdYmlOnly: [[...]] in .js/.json is code (nested arrays, template literals), not a vault wikilink —
  // matches the sanitizer's mdOnly semantics (Wave-2 fix: the old scrub corrupted shipped JS).
  { name: 'Wikilink', pattern: /\[\[[^\]]+\]\]/g, mdYmlOnly: true },
  // Generic email with allowlist for system addresses
  { name: 'Generic email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, allowlist: SYSTEM_EMAIL_ALLOWLIST },
];

// Client slugs in FILE NAMES — find-replace only scans contents, so client-named files
// (run-jen-the-gut-center.bat, JenScan.xml) sail through. NSA ARCHITECT R2 #1.
const FILENAME_LEAK_PATTERNS = [
  { name: 'Client name in filename (jen)', pattern: /jen(?![a-z])|jen[-_]?scan|install[-_]?jen/i },
  { name: 'Client name in filename (mara)', pattern: /\bmara\b|mara[-._]/i },
  { name: 'Client name in filename (gut-center)', pattern: /gut[-_]?center/i },
];

// Allowlist — files where these tokens are EXPECTED (legitimate attribution).
const ALLOWLIST_PATHS = [
  /README\.md$/,
  /LICENSE$/,
  /CHANGELOG\.md$/,
  /\.gitleaks\.toml$/,
  /\.claude-plugin[\\\/]marketplace\.json$/,
  /\.claude-plugin[\\\/]plugin\.json$/,
];

async function isTextFile(filePath) {
  try {
    const buf = await fs.readFile(filePath);
    return !buf.slice(0, 8192).includes(0);
  } catch { return false; }
}

function isAllowed(filePath) {
  return ALLOWLIST_PATHS.some(p => p.test(filePath));
}

async function main() {
  const hits = [];

  async function walk(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); }
    catch { return; }
    for (const entry of entries) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '__pycache__' || entry.name === '.git') continue;
        await walk(p);
      } else if (entry.isFile()) {
        const rel = path.relative(REPO_ROOT, p);
        if (isAllowed(rel)) continue;
        // Filename-level scan — runs even for binary files (names leak regardless of content)
        for (const { name, pattern } of FILENAME_LEAK_PATTERNS) {
          if (pattern.test(entry.name)) {
            hits.push({ file: rel, line: 0, token: name, match: entry.name });
          }
        }
        if (!await isTextFile(p)) continue;
        const content = await fs.readFile(p, 'utf8');
        for (const { name, pattern, allowlist, mdYmlOnly } of LEAK_TOKENS) {
          if (mdYmlOnly && !/\.(md|markdown|ya?ml(\.example)?)$/i.test(p)) continue;
          const matches = [...content.matchAll(pattern)];
          for (const m of matches) {
            if (allowlist && allowlist.some(a => a.test(m[0]))) continue;
            hits.push({
              file: rel,
              line: content.slice(0, m.index).split('\n').length,
              token: name,
              match: m[0].slice(0, 80),
            });
          }
        }
      }
    }
  }

  await walk(PLUGINS_DIR);

  // Report
  const lines = ['# LEAK-AUDIT.md', '', `Generated: ${new Date().toISOString()}`, ''];
  lines.push(`**Total hits:** ${hits.length}`);
  lines.push('');
  if (hits.length === 0) {
    lines.push('✅ NO RESIDUAL IDENTITY TOKENS DETECTED in plugins/.');
    lines.push('Safe to proceed to gitleaks gate.');
  } else {
    lines.push('⚠️ RESIDUAL TOKENS DETECTED. Review each before commit.');
    lines.push('');
    lines.push('| File | Line | Token | Match |');
    lines.push('|------|------|-------|-------|');
    for (const h of hits) {
      lines.push(`| \`${h.file}\` | ${h.line} | ${h.token} | \`${h.match.replace(/\|/g, '\\|')}\` |`);
    }
  }

  await fs.writeFile(path.join(REPO_ROOT, 'LEAK-AUDIT.md'), lines.join('\n'));
  console.log(`leak-audit: ${hits.length} hits across ${new Set(hits.map(h => h.file)).size} files`);
  console.log(`Report: LEAK-AUDIT.md`);

  if (hits.length > 0) process.exit(1);
}

main().catch(err => { console.error('FATAL:', err); process.exit(2); });
