import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  readState, writeBotField, writeSkillField,
  appendJsonl, readJsonlTail
} from '../state.js';

const TEST_DIR = path.join(os.tmpdir(), 'mc-test-' + Date.now());
const STATE_FILE = path.join(TEST_DIR, 'morning-compass-test.json');

test.before(async () => {
  await fs.mkdir(TEST_DIR, { recursive: true });
  await fs.writeFile(STATE_FILE, JSON.stringify({
    schema_version: 1,
    energy_history: [],
    skip_days_consecutive: 0,
    last_feedback_rating: null,
    rock_start_dates_cache: { _refreshed_at: null },
    last_brief_timestamp: null,
    last_brief_content: null,
    paused_until: null
  }));
});

test.after(async () => {
  await fs.rm(TEST_DIR, { recursive: true, force: true });
});

test('readState returns parsed JSON', async () => {
  const s = await readState(STATE_FILE);
  assert.equal(s.schema_version, 1);
  assert.deepEqual(s.energy_history, []);
});

test('writeBotField updates only allowed fields', async () => {
  await writeBotField(STATE_FILE, 'energy_history', [
    { date: '2026-05-05', bucket: 'mid', raw_value: null }
  ]);
  const s = await readState(STATE_FILE);
  assert.equal(s.energy_history.length, 1);
  assert.equal(s.energy_history[0].bucket, 'mid');
});

test('writeBotField rejects skill-owned fields', async () => {
  await assert.rejects(
    () => writeBotField(STATE_FILE, 'last_brief_timestamp', '2026-05-05T06:00:00Z'),
    /not bot-owned/
  );
});

test('writeSkillField updates only allowed fields', async () => {
  await writeSkillField(STATE_FILE, 'last_brief_timestamp', '2026-05-05T06:00:00Z');
  const s = await readState(STATE_FILE);
  assert.equal(s.last_brief_timestamp, '2026-05-05T06:00:00Z');
});

test('writeSkillField rejects bot-owned fields', async () => {
  await assert.rejects(
    () => writeSkillField(STATE_FILE, 'energy_history', []),
    /not skill-owned/
  );
});

test('appendJsonl adds line to JSONL file', async () => {
  const f = path.join(TEST_DIR, 'test.jsonl');
  await appendJsonl(f, { schema_version: 1, ts: '2026-05-05T06:00:00Z', type: 'test' });
  await appendJsonl(f, { schema_version: 1, ts: '2026-05-05T07:00:00Z', type: 'test2' });
  const lines = (await fs.readFile(f, 'utf8')).trim().split('\n');
  assert.equal(lines.length, 2);
  assert.equal(JSON.parse(lines[0]).type, 'test');
});

test('readJsonlTail returns last N lines as parsed objects', async () => {
  const f = path.join(TEST_DIR, 'test2.jsonl');
  for (let i = 0; i < 10; i++) {
    await appendJsonl(f, { schema_version: 1, idx: i });
  }
  const tail = await readJsonlTail(f, 3);
  assert.equal(tail.length, 3);
  assert.equal(tail[0].idx, 7);
  assert.equal(tail[2].idx, 9);
});
