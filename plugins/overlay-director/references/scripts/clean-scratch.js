const fs = require('node:fs');
const path = require('node:path');
const C = require('./constants.js');

// --- path safety -----------------------------------------------------------
// True if `target` resolves strictly inside `baseDir` (not equal to it, not an escape).
// path.relative is case-insensitive on Windows (correct here); a case-sensitive FS
// port would need an explicit casefold.
function isInside(baseDir, target) {
  const rel = path.relative(path.resolve(baseDir), path.resolve(target));
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

// Reject anything that isn't a plain single path segment (blocks '', '.', '..', 'a/b', 'a\\b').
function assertSimpleName(name) {
  if (!name || name === '.' || name === '..' || /[\\/]/.test(name)) {
    throw new Error(`unsafe project name: "${name}"`);
  }
}

// --- sizing ----------------------------------------------------------------
// Recursive byte count. Never follows symlinks (counts the link as 0 so a stray
// junction can't inflate or, later, be deleted through).
function pathSize(p) {
  let st;
  try { st = fs.lstatSync(p); } catch { return 0; }
  if (st.isSymbolicLink()) return 0;
  if (st.isFile()) return st.size;
  if (st.isDirectory()) {
    let total = 0;
    for (const e of fs.readdirSync(p)) total += pathSize(path.join(p, e));
    return total;
  }
  return 0;
}

function daysSince(mtimeMs, nowMs) {
  return Math.max(0, (nowMs - mtimeMs) / 86_400_000);
}

// --- classification --------------------------------------------------------
// Top-level convenience classifier (used in tests): is this entry a heavy,
// regenerable purge target? Protected names always return false.
function isHeavy(name, isDir) {
  if (C.PURGE_PROTECT.includes(name)) return false;
  if (isDir) return C.PURGE_HEAVY_DIRS.includes(name) || C.PURGE_CACHE_DIRS.includes(name);
  return C.PURGE_FILE_PATTERNS.some((src) => new RegExp(src, 'i').test(name));
}

// Depth-aware walk. At every level, three outcomes per entry:
//   • PROTECT dir (renders/assets/.git) -> kept, NOT recursed (whole subtree safe)
//   • HEAVY dir (frames/fullqc/.thumbnails/.waveform-cache) -> removed whole, NOT recursed
//   • ordinary dir -> recurse
//   • file matching a heavy pattern -> removed (at any depth)
// Symlinks are counted as 0 and never traversed or deleted.
function walk(dir, projectDir, acc) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    let st;
    try { st = fs.lstatSync(full); } catch { continue; }
    if (st.isSymbolicLink()) continue; // never follow/delete links
    const rel = path.relative(projectDir, full);

    if (st.isDirectory()) {
      if (C.PURGE_PROTECT.includes(name)) {        // keep subtree, don't descend
        acc.totalBytes += pathSize(full);
        continue;
      }
      if (C.PURGE_HEAVY_DIRS.includes(name) || C.PURGE_CACHE_DIRS.includes(name)) {
        const b = pathSize(full);
        acc.totalBytes += b;
        acc.heavyBytes += b;
        acc.heavyItems.push({ name: rel, bytes: b, type: 'dir' });
        continue;                                  // remove whole dir, don't descend
      }
      walk(full, projectDir, acc);                 // ordinary dir -> recurse
    } else if (st.isFile()) {
      const b = st.size;
      acc.totalBytes += b;
      if (C.PURGE_FILE_PATTERNS.some((src) => new RegExp(src, 'i').test(name))) {
        acc.heavyBytes += b;
        acc.heavyItems.push({ name: rel, bytes: b, type: 'file' });
      }
    }
  }
}

// --- scan ------------------------------------------------------------------
// Inspect one project build dir (recursively): total bytes, the heavy subset, age in days.
function scanProject(projectDir, nowMs) {
  const acc = { heavyItems: [], heavyBytes: 0, totalBytes: 0 };
  walk(projectDir, projectDir, acc);
  let ageDays = 0;
  try { ageDays = daysSince(fs.statSync(projectDir).mtimeMs, nowMs); } catch {}
  return {
    project: path.basename(projectDir),
    totalBytes: acc.totalBytes,
    heavyBytes: acc.heavyBytes,
    keptBytes: acc.totalBytes - acc.heavyBytes,
    ageDays: Math.round(ageDays * 10) / 10,
    stale: ageDays >= C.SCRATCH_RETENTION_DAYS,
    heavyItems: acc.heavyItems.sort((a, b) => b.bytes - a.bytes),
  };
}

// Scan every project under the scratch base. `active` is always excluded (never offered).
// `nowMs` is injected (caller passes Date.now()) so the scan stays deterministic/testable.
function scanScratch(scratchBase, { active = null, nowMs } = {}) {
  const base = path.resolve(scratchBase);
  if (!fs.existsSync(base)) return { base, projects: [] };
  const projects = [];
  for (const name of fs.readdirSync(base)) {
    if (name === active) continue;
    const dir = path.join(base, name);
    let st;
    try { st = fs.lstatSync(dir); } catch { continue; }
    if (!st.isDirectory() || st.isSymbolicLink()) continue;
    projects.push(scanProject(dir, nowMs));
  }
  projects.sort((a, b) => b.heavyBytes - a.heavyBytes);
  return { base, projects };
}

// --- purge -----------------------------------------------------------------
// Remove ONLY the heavy items (at any depth) from one project. Dry-run unless apply:true.
// Triple-guarded: simple name, project dir inside base, every item inside project dir.
function purgeProject(scratchBase, projectName, { active = null, apply = false, nowMs } = {}) {
  assertSimpleName(projectName);
  if (active && projectName === active) {
    throw new Error(`refusing to purge the active project "${projectName}"`);
  }
  const base = path.resolve(scratchBase);
  const projectDir = path.resolve(base, projectName);
  if (!isInside(base, projectDir)) {
    throw new Error(`unsafe: project "${projectName}" resolves outside scratch base "${base}"`);
  }
  if (!fs.existsSync(projectDir)) {
    throw new Error(`project dir not found: "${projectDir}"`);
  }

  const scan = scanProject(projectDir, nowMs);
  const removed = [];
  let freedBytes = 0;
  for (const item of scan.heavyItems) {
    const target = path.join(projectDir, item.name);
    if (!isInside(projectDir, target)) continue;            // belt-and-suspenders
    if (apply) fs.rmSync(target, { recursive: true, force: true });
    removed.push({ name: item.name, bytes: item.bytes, type: item.type });
    freedBytes += item.bytes;
  }
  return { project: projectName, applied: apply, freedBytes, removed, keptBytes: scan.keptBytes };
}

module.exports = { isInside, isHeavy, scanProject, scanScratch, purgeProject };

// CLI:
//   node clean-scratch.js <scratchBase> [--active <name>]                 -> scan report (JSON)
//   node clean-scratch.js <scratchBase> [--active <name>] --apply a,b,c   -> purge a,b,c (JSON)
// Dry-run by default. nonzero exit on failure.
if (require.main === module) {
  try {
    const argv = process.argv.slice(2);
    const base = argv[0];
    if (!base) throw new Error('usage: clean-scratch.js <scratchBase> [--active <name>] [--apply <p1,p2,...>]');
    const activeIdx = argv.indexOf('--active');
    const active = activeIdx >= 0 ? argv[activeIdx + 1] : null;
    const applyIdx = argv.indexOf('--apply');
    const nowMs = Date.now();

    if (applyIdx >= 0) {
      const names = (argv[applyIdx + 1] || '').split(',').map((s) => s.trim()).filter(Boolean);
      const results = names.map((n) => purgeProject(base, n, { active, apply: true, nowMs }));
      const totalFreed = results.reduce((s, r) => s + r.freedBytes, 0);
      process.stdout.write(JSON.stringify({ applied: true, totalFreed, results }));
    } else {
      process.stdout.write(JSON.stringify(scanScratch(base, { active, nowMs })));
    }
  } catch (e) {
    process.stderr.write(`clean-scratch failed: ${e.message}\n`);
    process.exit(1);
  }
}
