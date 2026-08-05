// M1 tests: SlackClient (mocked fetch), scope-drift assertion, HARD_DENY fail-closed,
// slack-state corrupt-rebuild. Run: node --test test_slack_wrapper.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import {
  SlackClient,
  SlackError,
  SCOUT_SCOPES,
  HARD_DENY,
  assertDenyListReady,
} from "./slack.js";
import {
  loadSlackState,
  saveSlackState,
  emptySlackState,
  threadKey,
  nextChannelOrder,
  pruneRegistry,
  SLACK_TS_INDEX,
  SLACK_STATE_FILE,
  slackDir,
} from "./slack-state.js";
import { appendJsonl } from "./util.js";

// ── fetch mock helpers ───────────────────────────────────────────────────────
function jsonResponse(body, { status = 200, headers = {} } = {}) {
  return {
    status,
    headers: { get: (k) => headers[k.toLowerCase()] ?? null },
    json: async () => body,
  };
}

function mockFetch(script) {
  // script: array of (url, params) => response, consumed in order; or a fn.
  let i = 0;
  const calls = [];
  const fn = async (url, init) => {
    const params = Object.fromEntries(new URLSearchParams(init.body));
    calls.push({ url, params });
    const handler = Array.isArray(script) ? script[Math.min(i++, script.length - 1)] : script;
    return handler(url, params);
  };
  fn.calls = calls;
  return fn;
}

async function tmpClientDir() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-test-"));
  return dir;
}

// ── SlackClient ──────────────────────────────────────────────────────────────

test("429 honors Retry-After then succeeds", async () => {
  const waits = [];
  const fetchImpl = mockFetch([
    () => jsonResponse({}, { status: 429, headers: { "retry-after": "7" } }),
    () => jsonResponse({ ok: true, ts: "1.1" }),
  ]);
  const c = new SlackClient("xoxb-test", {
    fetchImpl,
    sleepImpl: async (ms) => waits.push(ms),
  });
  const data = await c.call("chat.postMessage", { channel: "C1", text: "hi" });
  assert.equal(data.ok, true);
  assert.deepEqual(waits, [7000]);
  assert.equal(c.requestCount, 2); // retries count against budget
});

test("budget exhaustion throws BUDGET_EXHAUSTED", async () => {
  const fetchImpl = mockFetch([() => jsonResponse({ ok: true })]);
  const c = new SlackClient("xoxb-test", { fetchImpl, budget: 1 });
  await c.call("auth.test");
  await assert.rejects(() => c.call("auth.test"), (err) => err.code === "BUDGET_EXHAUSTED");
});

test("slack error surfaces the API error code", async () => {
  const fetchImpl = mockFetch([() => jsonResponse({ ok: false, error: "channel_not_found" })]);
  const c = new SlackClient("xoxb-test", { fetchImpl });
  await assert.rejects(() => c.call("conversations.history", { channel: "C0" }), (err) => {
    assert.ok(err instanceof SlackError);
    return err.code === "channel_not_found";
  });
});

test("membersOf paginates and returns a Set of user ids", async () => {
  const fetchImpl = mockFetch([
    () => jsonResponse({ ok: true, members: ["U1", "U2"], response_metadata: { next_cursor: "c2" } }),
    () => jsonResponse({ ok: true, members: ["U3"], response_metadata: { next_cursor: "" } }),
  ]);
  const c = new SlackClient("xoxb-test", { fetchImpl });
  const m = await c.membersOf("C1");
  assert.deepEqual([...m].sort(), ["U1", "U2", "U3"]);
  assert.equal(fetchImpl.calls[1].params.cursor, "c2");
});

test("historySince paginates, passes inclusive=false, returns oldest-first", async () => {
  const fetchImpl = mockFetch([
    () =>
      jsonResponse({
        ok: true,
        messages: [{ ts: "300.0" }, { ts: "200.0" }],
        has_more: true,
        response_metadata: { next_cursor: "cur2" },
      }),
    () => jsonResponse({ ok: true, messages: [{ ts: "100.0" }], has_more: false }),
  ]);
  const c = new SlackClient("xoxb-test", { fetchImpl });
  const msgs = await c.historySince("C1", "50.0");
  assert.deepEqual(msgs.map((m) => m.ts), ["100.0", "200.0", "300.0"]);
  assert.equal(fetchImpl.calls[0].params.inclusive, "false");
  assert.equal(fetchImpl.calls[0].params.oldest, "50.0");
  assert.equal(fetchImpl.calls[1].params.cursor, "cur2");
});

test("repliesSince filters the parent element and defaults oldest to thread_ts", async () => {
  const fetchImpl = mockFetch([
    () =>
      jsonResponse({
        ok: true,
        messages: [{ ts: "100.0" }, { ts: "150.0" }, { ts: "175.0" }],
        has_more: false,
      }),
  ]);
  const c = new SlackClient("xoxb-test", { fetchImpl });
  const replies = await c.repliesSince("C1", "100.0", null);
  assert.deepEqual(replies.map((m) => m.ts), ["150.0", "175.0"]); // parent 100.0 filtered
  assert.equal(fetchImpl.calls[0].params.oldest, "100.0");
  assert.equal(fetchImpl.calls[0].params.inclusive, "false");
});

test("scope-drift assertion catches missing AND extra scopes", async () => {
  const fetchImpl = mockFetch([
    () =>
      jsonResponse(
        { ok: true, user_id: "U1", team: "T", user: "scout" },
        { headers: { "x-oauth-scopes": "channels:history,groups:history,channels:read,groups:read,reactions:read,chat:write" } },
      ),
  ]);
  const c = new SlackClient("xoxb-test", { fetchImpl });
  await c.authTest();
  const drift = c.assertScopes(SCOUT_SCOPES);
  assert.equal(drift.ok, false);
  assert.deepEqual(drift.extra, ["chat:write"]);
  assert.deepEqual(drift.missing, []);
});

test("scope assertion passes on exact match", async () => {
  const fetchImpl = mockFetch([
    () =>
      jsonResponse(
        { ok: true, user_id: "U1", team: "T", user: "scout" },
        { headers: { "x-oauth-scopes": SCOUT_SCOPES.join(",") } },
      ),
  ]);
  const c = new SlackClient("xoxb-test", { fetchImpl });
  await c.authTest();
  assert.equal(c.assertScopes(SCOUT_SCOPES).ok, true);
});

test("HARD_DENY fail-closed: unconfigured IDs throw DENY_LIST_UNCONFIGURED", () => {
  const hasNull = Object.values(HARD_DENY).some((v) => !v);
  if (hasNull) {
    assert.throws(() => assertDenyListReady(), (err) => err.code === "DENY_LIST_UNCONFIGURED");
  } else {
    assert.doesNotThrow(() => assertDenyListReady());
  }
});

// ── slack-state ──────────────────────────────────────────────────────────────

test("state roundtrip: save then load", async () => {
  const dir = await tmpClientDir();
  const state = emptySlackState();
  state.channels["C1"] = { cursor: "123.456", held: false };
  state.threads[threadKey("C1", "100.0")] = {
    channel_id: "C1",
    thread_ts: "100.0",
    watermark: "120.0",
    last_activity: "120.0",
    last_checked_iso: null,
  };
  await saveSlackState(dir, state);
  const { state: loaded, rebuilt } = await loadSlackState(dir);
  assert.equal(rebuilt, false);
  assert.equal(loaded.channels["C1"].cursor, "123.456");
  assert.equal(loaded.threads["C1:100.0"].watermark, "120.0");
});

test("corrupt slack-state.json rebuilds conservatively from .slack-ts.jsonl", async () => {
  const dir = await tmpClientDir();
  const sdir = slackDir(dir);
  await fs.mkdir(sdir, { recursive: true });
  // Evidence: two ingested messages in one thread, one in another channel.
  await appendJsonl(path.join(sdir, SLACK_TS_INDEX), { thread_key: "C1:100.0", ts: "100.0", note_path: "a.md", channel_id: "C1" });
  await appendJsonl(path.join(sdir, SLACK_TS_INDEX), { thread_key: "C1:100.0", ts: "150.0", note_path: "a.md", channel_id: "C1" });
  await appendJsonl(path.join(sdir, SLACK_TS_INDEX), { thread_key: "C2:90.0", ts: "90.0", note_path: "b.md", channel_id: "C2" });
  await fs.writeFile(path.join(sdir, SLACK_STATE_FILE), "{ this is not json", "utf8");

  const { state, rebuilt } = await loadSlackState(dir);
  assert.equal(rebuilt, true);
  // Cursor from evidence only (max ingested ts), never guessed forward.
  assert.equal(state.channels["C1"].cursor, "150.0");
  assert.equal(state.channels["C2"].cursor, "90.0");
  assert.equal(state.threads["C1:100.0"].watermark, "150.0");
});

test("nextChannelOrder puts held channels first and rotates the rest", () => {
  const state = emptySlackState();
  state.channels = {
    C1: { cursor: "0", held: false },
    C2: { cursor: "0", held: true },
    C3: { cursor: "0", held: false },
  };
  state.channel_order = ["C1", "C2", "C3"];
  const order = nextChannelOrder(state, ["C1", "C2", "C3"]);
  assert.equal(order[0], "C2"); // held first
  assert.deepEqual(new Set(order), new Set(["C1", "C2", "C3"]));
});

test("pruneRegistry keeps watch:true and recent threads, drops stale", () => {
  const state = emptySlackState();
  const nowSec = Date.now() / 1000;
  state.threads = {
    "C1:old": { channel_id: "C1", thread_ts: "old", watermark: "1", last_activity: String(nowSec - 20 * 86400), watch: false },
    "C1:watched": { channel_id: "C1", thread_ts: "w", watermark: "1", last_activity: String(nowSec - 40 * 86400), watch: true },
    "C1:fresh": { channel_id: "C1", thread_ts: "f", watermark: "1", last_activity: String(nowSec - 2 * 86400) },
  };
  const pruned = pruneRegistry(state, new Date().toISOString(), 14);
  assert.equal(pruned, 1);
  assert.ok(!state.threads["C1:old"]);
  assert.ok(state.threads["C1:watched"]);
  assert.ok(state.threads["C1:fresh"]);
});
