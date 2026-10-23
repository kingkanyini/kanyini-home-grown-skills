export const BANDS = { yellow: 150, red: 400 };   // spec §7 (calibrate in planning §11 — placeholder-but-named)
export function band(fileCount) {
  if (fileCount > BANDS.red) return '🔴';
  if (fileCount >= BANDS.yellow) return '🟡';
  return '🟢';
}
