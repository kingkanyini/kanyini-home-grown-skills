'use strict';
/*
 * blotato-publish-guard.js — PreToolUse guard for the -v2 social suite's publish boundary.
 *
 * Denies any mcp__blotato__* tool call unless a valid, fresh armed sentinel with publishes
 * remaining exists. The sentinel is written by post-scheduler-v2 ONLY when every publish gate
 * passes (ship_enabled AND explicit_publish_intent AND prepublish_checklist_passed AND
 * target_confirmed AND ethics_cleared). This makes "publishing is OFF by default and requires
 * explicit intent + ethics-cleared" a harness-enforced boundary at the one point where real
 * harm occurs (a live post).
 *
 * Scoped single-use: the sentinel carries `remaining` = the number of platforms the user
 * confirmed in one armed flow. list_accounts passes without consuming; each create_post
 * decrements via the PostToolUse clear hook, and the sentinel is deleted at 0. So one arming
 * authorizes EXACTLY the confirmed target set — no more (fixes the multi-platform seam while
 * keeping fresh-intent-per-batch). Fail-closed: no sentinel / stale / remaining<=0 = DENY.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const SENTINEL = path.join(os.homedir(), '.claude', '.blotato-armed.json');
const TTL_MS = 5 * 60 * 1000; // an armed window older than 5 min is treated as stale

let payload = '';
process.stdin.on('data', (d) => (payload += d));
process.stdin.on('end', () => {
  let tool = '';
  try { tool = (JSON.parse(payload || '{}').tool_name) || ''; } catch (_) {}

  // Only guard the Blotato MCP write/read surface. Everything else passes through.
  if (!/^mcp__blotato__/.test(tool)) process.exit(0);

  try {
    const s = JSON.parse(fs.readFileSync(SENTINEL, 'utf8'));
    const age = Date.now() - (s.ts || 0);
    const remaining = (typeof s.remaining === 'number') ? s.remaining : 1;
    if (age >= 0 && age < TTL_MS && remaining > 0) process.exit(0); // armed + fresh + budget -> allow
    process.stderr.write(
      'BLOCKED: the Blotato publish sentinel is stale or spent. Re-arm via post-scheduler-v2 ' +
      '(explicit "publish" intent + passed pre-publish checklist + Ethics: cleared).'
    );
    process.exit(2);
  } catch (_) {
    process.stderr.write(
      'BLOCKED: Blotato publishing is not armed. Publishing is OFF by default and requires ' +
      'explicit "publish" intent + a passed pre-publish checklist + Ethics: cleared (post-scheduler-v2 ' +
      'writes the armed sentinel). Everything else in the -v2 suite works fully offline.'
    );
    process.exit(2);
  }
});
