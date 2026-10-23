import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { findVaultRoot } from './lib/vault.mjs';
import { band } from './lib/health.mjs';
export { band };

function listWikiPages(v) {
  const dir = path.join(v, 'layer-1-context');
  const out = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { if (e.name !== 'outputs') walk(p); }
      else if (e.name.endsWith('.md') && !e.name.startsWith('.')) out.push(p);
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return out;
}

const LINK_RE = /\[\[([^\]]+)\]\]/g;

function pageLinkTargets(body) {
  const out = new Set();
  for (const m of body.matchAll(LINK_RE)) {
    let target = m[1].split('|')[0].split('#')[0].trim();
    if (!target || target.startsWith('CONTRADICTED')) continue;
    out.add(target);
  }
  return out;
}

function countOrphans(pages, bodies) {
  const slugs = pages.map(p => path.basename(p, '.md'));
  const perPageTargets = bodies.map(pageLinkTargets);
  // A slug counts as "linked" only when a DIFFERENT page links to it —
  // a page linking solely to itself must not rescue it from orphan status.
  return slugs.filter((s, i) => {
    if (s === 'index') return false;
    const linkedByOtherPage = perPageTargets.some((targets, j) => slugs[j] !== s && targets.has(s));
    return !linkedByOtherPage;
  }).length;
}

function computeDaysSinceLint(v) {
  const reportPath = path.join(v, 'LINT-REPORT.md');
  if (!fs.existsSync(reportPath)) return null;
  return Math.max(0, Math.floor((Date.now() - fs.statSync(reportPath).mtimeMs) / 86400000));
}

function computeLastIngest(v) {
  const logPath = path.join(v, 'log.md');
  if (!fs.existsSync(logPath)) return null;
  const lines = fs.readFileSync(logPath, 'utf8').split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line && line.toLowerCase().includes('ingest')) return line;
  }
  return null;
}

export function computeHealth(v) {
  const pages = listWikiPages(v);
  const bodies = pages.map(p => fs.readFileSync(p, 'utf8'));
  const contradictions = bodies.filter(b => b.includes('[[CONTRADICTED')).length;
  const indexTxt = fs.existsSync(path.join(v, 'index.md')) ? fs.readFileSync(path.join(v, 'index.md'), 'utf8') : '';
  const slugs = pages.map(p => path.basename(p, '.md'));
  const drift = slugs.filter(s => !indexTxt.includes(s)).length;
  const rawFiles = fs.existsSync(path.join(v, 'raw'))
    ? fs.readdirSync(path.join(v, 'raw')).filter(f => f !== 'processed' && f !== 'assets') : [];
  return {
    files: pages.length, band: band(pages.length), drift, contradictions,
    unprocessedRaw: rawFiles.length, generated: new Date().toISOString(),
    orphans: countOrphans(pages, bodies),
    daysSinceLint: computeDaysSinceLint(v),
    lastIngest: computeLastIngest(v),
  };
}

export function writeHealth(v) {
  const h = computeHealth(v);
  const ok = h.contradictions === 0 && h.drift === 0 && h.daysSinceLint !== null && h.daysSinceLint <= 14;
  const md = `# Brain Health

generated: ${h.generated}

- Wiki pages: **${h.files}** ${h.band}  ${h.band === '🔴' ? '(time for Pinecone — see the upgrade path)' : ''}
- Open contradictions: **${h.contradictions}** ${h.contradictions ? '🔴 clear these before shipping a deliverable' : '🟢'}
- Index drift (pages missing from index.md): **${h.drift}** ${h.drift ? '🔴 run /brain-lint' : '🟢'}
- Unprocessed files in raw/: **${h.unprocessedRaw}**
- Orphan pages: **${h.orphans}** ${h.orphans ? '🟡' : '🟢'}
- Days since last lint: **${h.daysSinceLint ?? 'never'}** ${(h.daysSinceLint === null || h.daysSinceLint > 14) ? '🔴 run /brain-lint' : '🟢'}
- Last ingest: ${h.lastIngest ?? '_none yet_'}

**Verdict:** ${ok ? '🟢 healthy — trust it.' : '🔴 do NOT put a deliverable in front of a client until cleared.'}
`;
  const p = path.join(v, 'HEALTH.md');
  fs.writeFileSync(p, md);
  return p;
}

if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  const root = findVaultRoot(process.cwd());
  if (!root) { console.error('[brain-status] No AI-Brain here.'); process.exit(1); }
  console.log('[brain-status] wrote ' + writeHealth(root));
}
