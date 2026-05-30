import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnRunner } from '../spawn.js';

test('spawnRunner triggers MorningCompass-Refresh task for refresh mode', () => {
  const cmd = spawnRunner('refresh', { dryBuildOnly: true });
  assert.equal(cmd.executable, 'schtasks.exe');
  assert.ok(cmd.args.includes('/Run'));
  assert.ok(cmd.args.includes('/TN'));
  assert.ok(cmd.args.includes('MorningCompass-Refresh'));
});

test('spawnRunner triggers MorningCompass-Manual task for manual mode', () => {
  const cmd = spawnRunner('manual', { dryBuildOnly: true });
  assert.equal(cmd.executable, 'schtasks.exe');
  assert.ok(cmd.args.includes('MorningCompass-Manual'));
});

test('spawnRunner returns null for unmapped mode', () => {
  const cmd = spawnRunner('unknown-mode', { dryBuildOnly: true });
  assert.equal(cmd, null);
});
