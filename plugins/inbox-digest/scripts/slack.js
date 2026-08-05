#!/usr/bin/env node
// Slack Web API client for the Command Center Sentinel (spec §2, §5).
// Native fetch (Node 18+), zero npm deps — matches the self-contained-CLI pattern
// documented in run-example.bat.
//
// Two apps, two tokens (spec §2 two-app split):
//   SLACK_SCOUT_TOKEN — "example-client Capture", read-only (history/read/reactions:read)
//   SLACK_GUTSY_TOKEN — "Gutsy", write-only (chat:write)
//
// CLI: node slack.js --check   # authenticate both tokens + assert exact scopes

import process from "node:process";
import { loadEnv, log } from "./util.js";

const API = "https://slack.com/api";

// Spec §2 exact scope lists. The sweep asserts granted == expected every run
// (scope-drift assertion — catches a well-meaning human adding scopes at api.slack.com).
export const SCOUT_SCOPES = [
  "channels:history",
  "groups:history",
  "channels:read",
  "groups:read",
  "reactions:read",
];
export const GUTSY_SCOPES = ["chat:write"];

/**
 * HARD DENY-LIST — spec §5: enforced in CODE, by channel ID, on top of the
 * frontmatter allowlist. `sweep_set = (allowlist ∩ bot_member_channels) − HARD_DENY`.
 * `#command-center` is deny-listed for CAPTURE (its only read is the Phase 2c
 * scoped contract in phase2c.js).
 *
 * Entry values:
 *   "C…"           — real channel ID (denied)
 *   "NOT_CREATED"  — the channel does not exist in the workspace yet (verified
 *                    2026-07-02: #compliance/#Alex-tasks/#Robin-handoff were never
 *                    created). MUST be replaced with the real ID the day one of
 *                    these channels is created — before inviting any bot near it.
 *   null           — unconfigured → FAIL-CLOSED: live sweeps refuse to run.
 */
export const HARD_DENY = {
  "compliance": "NOT_CREATED",
  "Alex-tasks": "NOT_CREATED",
  "Robin-handoff": "NOT_CREATED",
  "command-center": "C0BETT5GZA6", // capture-denied; Phase 2c reads it under its own contract (verified 2026-07-02)
};

export function hardDenyIds() {
  return Object.values(HARD_DENY).filter((v) => v && v !== "NOT_CREATED");
}

/** Throws unless every HARD_DENY entry is configured (real ID or explicit NOT_CREATED). */
export function assertDenyListReady() {
  const missing = Object.entries(HARD_DENY)
    .filter(([, id]) => !id)
    .map(([name]) => name);
  if (missing.length) {
    const e = new Error(
      `HARD_DENY channel IDs not configured: ${missing.join(", ")} — fill them in scripts/slack.js (M0 Step 5) before a live Slack sweep`,
    );
    e.code = "DENY_LIST_UNCONFIGURED";
    throw e;
  }
}

export class SlackError extends Error {
  constructor(message, { code, status, retryAfter } = {}) {
    super(message);
    this.name = "SlackError";
    this.code = code || "slack_error";
    this.status = status || null;
    this.retryAfter = retryAfter || null;
  }
}

/**
 * Minimal Slack Web API client with the spec §5 operational posture baked in:
 *  - per-sweep request budget (caller sets; exceeded → BUDGET_EXHAUSTED, caller
 *    files what it has and holds cursors),
 *  - honors Retry-After on 429 (bounded retries),
 *  - cursor pagination helpers.
 * `fetchImpl` is injectable for tests.
 */
export class SlackClient {
  constructor(token, { budget = Infinity, fetchImpl = fetch, maxRetryWaitSec = 120, sleepImpl } = {}) {
    if (!token) throw new SlackError("missing Slack token", { code: "no_token" });
    this.token = token;
    this.budget = budget;
    this.requestCount = 0;
    this.fetchImpl = fetchImpl;
    this.maxRetryWaitSec = maxRetryWaitSec;
    this.sleepImpl = sleepImpl || ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.grantedScopes = null; // set by authTest()
  }

  remainingBudget() {
    return this.budget - this.requestCount;
  }

  /**
   * One API call. Form-encoded POST (Slack's canonical style for Web API).
   * 429 → wait Retry-After (capped) and retry, max 3 attempts. Every attempt
   * (including retries) counts against the budget — rate-limit waits are not free.
   */
  async call(method, params = {}) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      if (this.requestCount >= this.budget) {
        throw new SlackError(`request budget exhausted before ${method}`, { code: "BUDGET_EXHAUSTED" });
      }
      this.requestCount++;

      const body = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null) continue;
        body.set(k, typeof v === "boolean" ? String(v) : String(v));
      }

      const res = await this.fetchImpl(`${API}/${method}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.token}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (res.status === 429) {
        const retryAfter = Math.min(
          parseInt(res.headers.get("retry-after") || "30", 10) || 30,
          this.maxRetryWaitSec,
        );
        if (attempt === 3) {
          throw new SlackError(`rate limited on ${method} (giving up after ${attempt} attempts)`, {
            code: "rate_limited", status: 429, retryAfter,
          });
        }
        await log("warn", `slack 429 on ${method} — waiting ${retryAfter}s (attempt ${attempt})`);
        await this.sleepImpl(retryAfter * 1000);
        continue;
      }

      // Capture granted scopes when Slack echoes them (auth.test and most methods do).
      const scopesHeader = res.headers.get("x-oauth-scopes");
      if (scopesHeader) this.grantedScopes = scopesHeader.split(",").map((s) => s.trim()).filter(Boolean);

      let data;
      try {
        data = await res.json();
      } catch {
        throw new SlackError(`non-JSON response from ${method} (http ${res.status})`, { status: res.status });
      }
      if (!data.ok) {
        throw new SlackError(`${method} failed: ${data.error}`, { code: data.error, status: res.status });
      }
      return data;
    }
    throw new SlackError(`unreachable retry loop exit for ${method}`);
  }

  /** auth.test — identity + (via header) granted scopes. */
  async authTest() {
    const data = await this.call("auth.test");
    return {
      user_id: data.user_id,
      bot_id: data.bot_id || null,
      team: data.team,
      user: data.user,
      url: data.url || null, // workspace base URL — permalink construction
      scopes: this.grantedScopes || [],
    };
  }

  /**
   * Scope-drift assertion (spec §2): granted scopes must EQUAL the expected list —
   * a missing scope breaks the sweep, an extra scope means someone widened the app.
   * Returns {ok, missing, extra}.
   */
  assertScopes(expected) {
    const granted = new Set(this.grantedScopes || []);
    const want = new Set(expected);
    const missing = expected.filter((s) => !granted.has(s));
    const extra = [...granted].filter((s) => !want.has(s));
    return { ok: missing.length === 0 && extra.length === 0, missing, extra };
  }

  /** Channels this bot is a member of (for sweep_set = allowlist ∩ membership − HARD_DENY). */
  async listMemberChannels() {
    const ids = new Set();
    let cursor;
    do {
      const data = await this.call("users.conversations", {
        types: "public_channel,private_channel",
        exclude_archived: false,
        limit: 200,
        cursor,
      });
      for (const ch of data.channels || []) ids.add(ch.id);
      cursor = data.response_metadata?.next_cursor || "";
    } while (cursor);
    return ids;
  }

  /** Members of a channel (visibility-wall joins) — existing read scopes cover it. */
  async membersOf(channelId) {
    const ids = new Set();
    let cursor;
    do {
      const data = await this.call("conversations.members", { channel: channelId, limit: 200, cursor });
      for (const u of data.members || []) ids.add(u);
      cursor = data.response_metadata?.next_cursor || "";
    } while (cursor);
    return ids;
  }

  /**
   * conversations.history since `oldest` (exclusive: inclusive=false is Slack's
   * default for oldest, but we pass it EXPLICITLY per spec §3 — the boundary rule
   * must be visible in code, not implied). Paginates. Returns messages
   * oldest-first. `limit` per page respects the non-Marketplace 15-message cap.
   */
  async historySince(channelId, oldestTs, { pageLimit = 15, maxMessages = 1000 } = {}) {
    const out = [];
    let cursor;
    do {
      const data = await this.call("conversations.history", {
        channel: channelId,
        oldest: oldestTs || "0",
        inclusive: false,
        limit: pageLimit,
        cursor,
      });
      out.push(...(data.messages || []));
      cursor = data.has_more ? data.response_metadata?.next_cursor || "" : "";
      if (out.length >= maxMessages) break;
    } while (cursor);
    // Slack returns newest-first; callers reason oldest-first.
    return out.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
  }

  /**
   * conversations.replies for one thread since `oldest` (exclusive). The parent
   * message is returned as element zero of the FIRST page — the caller filters it
   * (spec §3(ii)); we filter here so no caller can forget.
   */
  async repliesSince(channelId, threadTs, oldestTs, { pageLimit = 15, maxMessages = 500 } = {}) {
    const out = [];
    let cursor;
    do {
      const data = await this.call("conversations.replies", {
        channel: channelId,
        ts: threadTs,
        oldest: oldestTs || threadTs,
        inclusive: false,
        limit: pageLimit,
        cursor,
      });
      for (const m of data.messages || []) {
        if (m.ts === threadTs) continue; // parent element — never a "new reply"
        out.push(m);
      }
      cursor = data.has_more ? data.response_metadata?.next_cursor || "" : "";
      if (out.length >= maxMessages) break;
    } while (cursor);
    return out.sort((a, b) => parseFloat(a.ts) - parseFloat(b.ts));
  }

  /** reactions.get for a message (Phase 2c — Gutsy-authored child messages only). */
  async reactionsGet(channelId, ts) {
    const data = await this.call("reactions.get", { channel: channelId, timestamp: ts, full: true });
    return data.message?.reactions || [];
  }

  /** chat.postMessage — Gutsy only. Returns {ts, channel}. */
  async postMessage(channelId, { text, blocks, thread_ts } = {}) {
    const data = await this.call("chat.postMessage", {
      channel: channelId,
      text: text || "",
      blocks: blocks ? JSON.stringify(blocks) : undefined,
      thread_ts,
      unfurl_links: false,
      unfurl_media: false,
    });
    return { ts: data.ts, channel: data.channel };
  }

  /** chat.update — Gutsy editing its own message (turn footer, spec §4). */
  async updateMessage(channelId, ts, { text, blocks } = {}) {
    const data = await this.call("chat.update", {
      channel: channelId,
      ts,
      text: text || "",
      blocks: blocks ? JSON.stringify(blocks) : undefined,
    });
    return { ts: data.ts, channel: data.channel };
  }
}

/** Build the Scout client from env (throws if token missing). */
export function scoutClient(opts = {}) {
  return new SlackClient(process.env.SLACK_SCOUT_TOKEN, opts);
}

/** Build the Gutsy client from env (throws if token missing). */
export function gutsyClient(opts = {}) {
  return new SlackClient(process.env.SLACK_GUTSY_TOKEN, opts);
}

/**
 * Run the scope-drift assertion for one app; logs loudly on drift.
 * Returns the auth.test identity (callers want bot_id for the self-message filter).
 */
export async function assertApp(client, expectedScopes, label) {
  const ident = await client.authTest();
  const drift = client.assertScopes(expectedScopes);
  if (!drift.ok) {
    await log(
      "error",
      `SCOPE DRIFT app=${label} missing=[${drift.missing.join(",")}] extra=[${drift.extra.join(",")}] — granted scopes no longer match the spec §2 list`,
    );
    const e = new SlackError(`scope drift on ${label}`, { code: "SCOPE_DRIFT" });
    e.drift = drift;
    throw e;
  }
  return ident;
}

// ── CLI: node slack.js --check ──────────────────────────────────────────────
async function checkCli() {
  await loadEnv();
  let failed = false;
  for (const [label, token, expected] of [
    ["example-client Capture (Scout)", process.env.SLACK_SCOUT_TOKEN, SCOUT_SCOPES],
    ["Gutsy (Herald)", process.env.SLACK_GUTSY_TOKEN, GUTSY_SCOPES],
  ]) {
    if (!token) {
      console.log(`✗ ${label}: token not set in ~/.env.env`);
      failed = true;
      continue;
    }
    try {
      const client = new SlackClient(token);
      const ident = await client.authTest();
      const drift = client.assertScopes(expected);
      if (drift.ok) {
        console.log(`✓ ${label}: authenticated as ${ident.user} (team ${ident.team}); scopes exact match`);
      } else {
        console.log(`✗ ${label}: SCOPE MISMATCH — missing [${drift.missing.join(", ")}], extra [${drift.extra.join(", ")}]`);
        failed = true;
      }
    } catch (err) {
      console.log(`✗ ${label}: ${err.message}`);
      failed = true;
    }
  }
  const denyMissing = Object.entries(HARD_DENY).filter(([, id]) => !id).map(([n]) => n);
  if (denyMissing.length) {
    console.log(`… HARD_DENY IDs still needed for: ${denyMissing.join(", ")} (fill in scripts/slack.js — live sweeps fail-closed until then)`);
  } else {
    console.log("✓ HARD_DENY channel IDs configured");
  }
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && process.argv[1].endsWith("slack.js")) {
  if (process.argv.includes("--check")) {
    checkCli().catch((err) => {
      console.error("fatal:", err);
      process.exit(1);
    });
  } else {
    console.log("usage: node slack.js --check");
    process.exit(2);
  }
}
