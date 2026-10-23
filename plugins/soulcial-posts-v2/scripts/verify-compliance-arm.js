#!/usr/bin/env node
'use strict';
/*
 * verify-compliance-arm.js — SAFETY-CRITICAL build gate.
 * The compliance auto-arm is what made the weight-loss near-miss impossible to repeat. A future
 * edit that silently deletes the arm formula or the boot-anchor display would re-open it with no
 * error surface. This guard greps the two load-bearing files and exits 1 if either safeguard is gone.
 *   node scripts/verify-compliance-arm.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const spine = path.join(__dirname, '..', 'references', 'social-spine');
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch (_) { return ''; } };

const modeGate = read(path.join(spine, 'mode-gate.md'));
const clientCard = read(path.join(spine, 'client-card.md'));
const ethicsGate = read(path.join(spine, 'ethics-gate.md'));

const errs = [];

// 1. Boot-anchor display token — mode-gate must still surface the armed state.
if (!/compliance\(REGULATED\)/.test(modeGate)) {
  errs.push('mode-gate.md missing boot-anchor token "compliance(REGULATED)"');
}

// 2. armFloor read-through — mode-gate delegates the floor to client-card.md.
if (!(/armFloor/.test(modeGate) && /client-card\.md/.test(modeGate))) {
  errs.push('mode-gate.md no longer routes the compliance floor (armFloor) through client-card.md');
}

// 3. client-card.md must remain the SOLE PRODUCER of the floor.
if (!/armFloor\s*=\s*cardExists/.test(clientCard)) {
  errs.push('client-card.md missing the sole-producer floor formula (armFloor = cardExists ? ...)');
}

// 4. SAFETY INVARIANT: ethics-gate must ASSEMBLE regulated_flag = armFloor || detect(finalCopy) — the
//    always-on detect() OR at gate time is what makes G2/G4 (regulated:false / omitted over bad copy)
//    still arm. Losing this re-opens the silent-disarm gap.
if (!/regulated_flag\s*=\s*armFloor\s*\|\|\s*detect/.test(ethicsGate)) {
  errs.push('ethics-gate.md no longer ASSEMBLES regulated_flag = armFloor || detect(finalCopy) at gate time');
}

// 5. Consume-not-recompute contract must remain stated in ethics-gate.
if (!/do NOT re-derive/i.test(ethicsGate)) {
  errs.push('ethics-gate.md no longer states the consume-not-recompute (do NOT re-derive) contract');
}

if (errs.length) { console.error('FAIL (compliance arm drift):\n  - ' + errs.join('\n  - ')); process.exit(1); }
console.log('PASS: compliance auto-arm intact (boot-anchor token · read-through · sole-producer formula · consume contract)');
