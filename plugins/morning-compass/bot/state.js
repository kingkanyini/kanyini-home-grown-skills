import { promises as fs } from 'node:fs';
import lockfile from 'proper-lockfile';

const BOT_OWNED = new Set(['energy_history', 'last_feedback_rating', 'paused_until']);
const SKILL_OWNED = new Set([
  'last_brief_timestamp', 'last_brief_content',
  'rock_start_dates_cache', 'skip_days_consecutive'
]);

export async function readState(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function writeFieldWithLock(filePath, field, value, allowedSet, ownerName) {
  if (!allowedSet.has(field)) {
    throw new Error(`Field "${field}" is not ${ownerName}-owned`);
  }
  await lockfile.lock(filePath, { retries: { retries: 5, minTimeout: 50 } });
  try {
    const state = JSON.parse(await fs.readFile(filePath, 'utf8'));
    state[field] = value;
    const tmp = filePath + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(state, null, 2));
    await fs.rename(tmp, filePath);
  } finally {
    await lockfile.unlock(filePath);
  }
}

export async function writeBotField(filePath, field, value) {
  return writeFieldWithLock(filePath, field, value, BOT_OWNED, 'bot');
}

export async function writeSkillField(filePath, field, value) {
  return writeFieldWithLock(filePath, field, value, SKILL_OWNED, 'skill');
}

export async function appendJsonl(filePath, obj) {
  await fs.appendFile(filePath, JSON.stringify(obj) + '\n');
}

export async function readJsonlTail(filePath, n) {
  const raw = await fs.readFile(filePath, 'utf8');
  const lines = raw.trim().split('\n').filter(Boolean);
  return lines.slice(-n).map(l => JSON.parse(l));
}
