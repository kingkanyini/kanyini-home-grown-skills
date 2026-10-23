#!/usr/bin/env node
'use strict';
/*
 * verify-ethics-gate.js — the real build gate (run manually or in CI).
 * The 3 public-copy doors MUST reference social-spine/ethics-gate.md, or public copy could
 * ship ungated. Exits 1 on drift so this can't silently rot.
 *   node scripts/verify-ethics-gate.js
 */
const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '..', 'skills');
const doors = ['content-coach-v2', 'post-writer-v2', 'repurpose-v2'];
const fail = doors.filter((d) => {
  try { return !/social-spine\/ethics-gate\.md/.test(fs.readFileSync(path.join(base, d, 'SKILL.md'), 'utf8')); }
  catch (_) { return true; }
});
if (fail.length) {
  console.error('FAIL: public-copy door(s) missing ethics-gate reference: ' + fail.join(', '));
  process.exit(1);
}
console.log('PASS: all 3 public-copy doors reference social-spine/ethics-gate.md');
