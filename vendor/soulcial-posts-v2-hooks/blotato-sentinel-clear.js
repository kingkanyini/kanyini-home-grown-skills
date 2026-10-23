'use strict';
/*
 * blotato-sentinel-clear.js — PostToolUse companion to blotato-publish-guard.js.
 *
 * After a Blotato create_post fires, DECREMENT the armed sentinel's `remaining` count and
 * delete it at 0. One arming authorizes exactly the confirmed target set (N platforms) — a
 * multi-platform publish (one create_post per platform) consumes the budget cleanly, then the
 * next publish requires fresh explicit intent. Always exits 0 — clearing never blocks.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const SENTINEL = path.join(os.homedir(), '.claude', '.blotato-armed.json');

let payload = '';
process.stdin.on('data', (d) => (payload += d));
process.stdin.on('end', () => {
  let tool = '';
  try { tool = (JSON.parse(payload || '{}').tool_name) || ''; } catch (_) {}
  if (/^mcp__blotato__blotato_create_post/.test(tool)) {
    try {
      const s = JSON.parse(fs.readFileSync(SENTINEL, 'utf8'));
      const remaining = ((typeof s.remaining === 'number') ? s.remaining : 1) - 1;
      if (remaining > 0) {
        s.remaining = remaining;
        fs.writeFileSync(SENTINEL, JSON.stringify(s));
      } else {
        fs.unlinkSync(SENTINEL);
      }
    } catch (_) {
      // unreadable/missing -> ensure it is gone (fail-closed)
      try { fs.unlinkSync(SENTINEL); } catch (_) {}
    }
  }
  process.exit(0);
});
