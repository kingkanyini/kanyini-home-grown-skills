#!/usr/bin/env node
'use strict';
/*
 * verify-scan-logging.js — build gate: the scan-logging wiring must not silently rot.
 * Asserts (1) all 3 scoring skills reference log-scan.js (else grades ship unlogged), and
 * (2) log-scan.js still imports scan-schema.js (producer ≡ consumer — the single schema).
 * Exits 1 on drift.
 *   node scripts/verify-scan-logging.js
 */
const fs = require('fs');
const path = require('path');

const skillsBase = path.join(__dirname, '..', 'skills');
const doors = ['post-grader-v2', 'post-writer-v2', 'repurpose-v2'];

const missing = doors.filter((d) => {
  try { return !/log-scan\.js/.test(fs.readFileSync(path.join(skillsBase, d, 'SKILL.md'), 'utf8')); }
  catch (_) { return true; }
});

let schemaWired = false;
try {
  schemaWired = /require\(\s*['"]\.\/scan-schema\.js['"]\s*\)/.test(fs.readFileSync(path.join(__dirname, 'log-scan.js'), 'utf8'));
} catch (_) { schemaWired = false; }

const errs = [];
if (missing.length) errs.push('scoring skill(s) missing log-scan.js reference: ' + missing.join(', '));
if (!schemaWired) errs.push('log-scan.js no longer imports scan-schema.js (schema drift risk)');

if (errs.length) { console.error('FAIL: ' + errs.join(' | ')); process.exit(1); }
console.log('PASS: 3 scoring skills reference log-scan.js; log-scan.js imports scan-schema.js');
