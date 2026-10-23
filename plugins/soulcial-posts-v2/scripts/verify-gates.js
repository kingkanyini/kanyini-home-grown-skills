#!/usr/bin/env node
'use strict';
/*
 * verify-gates.js — one runner for all soulcial-posts-v2 build gates. Wired into /savepoint so the
 * guards actually run (a guard nobody runs is theater). Runs each child gate in-process-ish via
 * execFileSync; aggregates. Exit 1 if ANY gate fails — the compliance arm is safety-critical.
 *   node scripts/verify-gates.js
 */
const { execFileSync } = require('child_process');
const path = require('path');

const gates = ['verify-ethics-gate.js', 'verify-scan-logging.js', 'verify-compliance-arm.js'];
let failed = 0;
for (const g of gates) {
  try {
    const out = execFileSync(process.execPath, [path.join(__dirname, g)], { encoding: 'utf8' });
    process.stdout.write(out);
  } catch (e) {
    failed++;
    if (e.stdout) process.stdout.write(e.stdout);
    if (e.stderr) process.stderr.write(e.stderr);
    process.stderr.write(`GATE FAILED: ${g}\n`);
  }
}
if (failed) { console.error(`\n${failed} gate(s) FAILED — do not ship the spine/plugin changes until fixed.`); process.exit(1); }
console.log('\nALL SOCIAL GATES PASS.');
