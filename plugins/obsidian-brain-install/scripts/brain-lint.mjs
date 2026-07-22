import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { findVaultRoot } from './lib/vault.mjs';

function pages(v) {
  const dir = path.join(v, 'layer-1-context');
  const out = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) { if (e.name !== 'outputs') walk(p); }
    else if (e.name.endsWith('.md')) out.push(p);
  }};
  if (fs.existsSync(dir)) walk(dir);
  return out;
}
const linksIn = (txt) => [...txt.matchAll(/\[\[([^\]|#]+)/g)]
  .map(m => m[1].trim()).filter(s => !s.startsWith('CONTRADICTED'));

export function lint(v) {
  const ps = pages(v);
  const slugs = new Set(ps.map(p => path.basename(p, '.md')));
  const bodies = new Map(ps.map(p => [path.basename(p, '.md'), fs.readFileSync(p, 'utf8')]));
  const brokenLinks = [];
  // Per-page link provenance: linkedFrom.get(target) = set of slugs (other than target) that link to it.
  const linkedFrom = new Map();
  for (const [slug, body] of bodies) for (const l of linksIn(body)) {
    if (!slugs.has(l)) brokenLinks.push(`${slug} → [[${l}]]`);
    if (l !== slug) {
      if (!linkedFrom.has(l)) linkedFrom.set(l, new Set());
      linkedFrom.get(l).add(slug);
    }
  }
  // A page is an orphan only if no OTHER page links to it — a self-link does not rescue it.
  const orphans = [...slugs].filter(s => s !== 'index' && !(linkedFrom.get(s)?.size));
  const idx = fs.existsSync(path.join(v, 'index.md')) ? fs.readFileSync(path.join(v, 'index.md'), 'utf8') : '';
  const drift = [...slugs].filter(s => !idx.includes(s));
  const rawDir = path.join(v, 'raw');
  const staleRaw = fs.existsSync(rawDir)
    ? fs.readdirSync(rawDir).filter(f => !['processed', 'assets'].includes(f)) : [];
  // outputs with no log.md mention (partial-write detector)
  const log = fs.existsSync(path.join(v, 'log.md')) ? fs.readFileSync(path.join(v, 'log.md'), 'utf8') : '';
  const outDir = path.join(v, 'outputs');
  const orphanOutputs = fs.existsSync(outDir)
    ? fs.readdirSync(outDir, { recursive: true }).filter(f => String(f).endsWith('.md') && !log.includes(path.basename(String(f)))) : [];
  return { brokenLinks, orphans, drift, staleRaw, orphanOutputs };
}

export function writeLintReport(v) {
  const r = lint(v);
  const sec = (t, arr) => `## ${t} (${arr.length})\n` + (arr.length ? arr.map(x => `- ${x}`).join('\n') : '- none') + '\n';
  const md = `# Lint Report\n\ngenerated: ${new Date().toISOString()}\n\n_Surfaced, not fixed. Each item is a proposal for you to accept._\n\n`
    + sec('Broken links', r.brokenLinks) + sec('Orphan pages', r.orphans)
    + sec('Index drift', r.drift) + sec('Unprocessed raw/', r.staleRaw)
    + sec('Outputs with no log entry (possible partial write)', r.orphanOutputs);
  const p = path.join(v, 'LINT-REPORT.md');
  fs.writeFileSync(p, md);
  return p;
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  const root = findVaultRoot(process.cwd());
  if (!root) { console.error('[brain-lint] No AI-Brain here.'); process.exit(1); }
  console.log('[brain-lint] wrote ' + writeLintReport(root));
}
