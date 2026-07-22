import fs from 'node:fs';
import path from 'node:path';

export function isAiBrain(dir) {
  return fs.existsSync(path.join(dir, 'CLAUDE.md')) &&
         fs.existsSync(path.join(dir, 'layer-1-context'));
}

export function findVaultRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    if (isAiBrain(dir)) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

// Create-if-absent, never clobber a non-empty file (Global Constraint).
export function writeIfAbsent(filePath, content) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) return 'skipped';
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return 'created';
}
