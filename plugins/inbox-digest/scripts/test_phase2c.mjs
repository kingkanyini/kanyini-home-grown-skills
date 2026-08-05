// M3 tests: phase2c command-center read contract. Run: node --test test_phase2c.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import matter from "gray-matter";
import { runPhase2c, itemIdFor, EMOJI_DONE, EMOJI_DISMISS, EMOJI_SAVE } from "./phase2c.js";
import { emptyDigestState, slackDir, CC_TS_INDEX } from "./slack-state.js";
import { readJsonl, atomicWrite } from "./util.js";

const KAN = "U0KANYINI1";
const CC = "C0CMDCENTR";

async function makeWorkTuple() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-p2c-"));
  await fs.mkdir(slackDir(dir), { recursive: true });
  return {
    client_slug: "<example-client>",
    client_dir: dir,
    run_id: "test-run",
    slack: {
      user_id: KAN,
      command_center: CC,
      channels: [{ id: "C0TEAMOPS1", name: "team-ops", lane: null, mirror: true }],
      roster: {},
      movement_threshold: 3,
      thread_window_days: 14,
      replies_call_cap: 20,
    },
  };
}

function fakeScout({ reactions = {}, replies = {} } = {}) {
  const calls = { reactions: [], replies: [] };
  return {
    calls,
    reactionsGet: async (ch, ts) => {
      calls.reactions.push({ ch, ts });
      return reactions[ts] || [];
    },
    repliesSince: async (ch, ts) => {
      calls.replies.push({ ch, ts });
      return replies[ts] || [];
    },
  };
}

function stateWithItem(itemId, overrides = {}) {
  const st = emptyDigestState();
  st.items[itemId] = {
    source: "slack",
    note_path: null,
    first_seen_sweep: 1,
    sweeps_shown: 1,
    status: "open",
    child_message_ts: "9000.000001",
    child_posted_iso: new Date().toISOString(),
    ...overrides,
  };
  return st;
}

test("✅ reaction by <your-name> clears the item (once)", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("slack", "C0TEAMOPS1:100.0");
  const st = stateWithItem(id);
  const scout = fakeScout({ reactions: { "9000.000001": [{ name: EMOJI_DONE, users: [KAN] }] } });
  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res.cleared, [id]);
  assert.equal(st.items[id].status, "cleared");
  // Second sweep: status no longer open → no re-processing.
  const res2 = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res2.cleared, []);
});

test("🚫 dismiss sets ledger status AND vault note status: dismissed", async () => {
  const wt = await makeWorkTuple();
  const noteAbs = path.join(slackDir(wt.client_dir), "2026-07-01_team-ops-test.md");
  await atomicWrite(noteAbs, matter.stringify("# test", { type: "slack-thread", status: "open" }));
  const id = itemIdFor("slack", "C0TEAMOPS1:100.0");
  const st = stateWithItem(id, { note_path: "slack/2026-07-01_team-ops-test.md" });
  const scout = fakeScout({ reactions: { "9000.000001": [{ name: EMOJI_DISMISS, users: [KAN] }] } });
  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res.dismissed, [id]);
  assert.equal(st.items[id].status, "dismissed");
  const parsed = matter(await fs.readFile(noteAbs, "utf8"));
  assert.equal(parsed.data.status, "dismissed", "vault note carries the comms truth");
});

test("🚫 beats ✅ when both present (dismiss is the stronger explicit signal checked first)", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("slack", "C0TEAMOPS1:100.0");
  const st = stateWithItem(id);
  const scout = fakeScout({
    reactions: { "9000.000001": [{ name: EMOJI_DONE, users: [KAN] }, { name: EMOJI_DISMISS, users: [KAN] }] },
  });
  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res.dismissed, [id]);
  assert.deepEqual(res.cleared, []);
});

test("✅ is the TEAM gesture: anyone's checkmark retires the item (2026-07-02 contract change)", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("slack", "C0TEAMOPS1:100.0");
  const st = stateWithItem(id);
  const scout = fakeScout({ reactions: { "9000.000001": [{ name: EMOJI_DONE, users: ["U0SOMEONE1"] }] } });
  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res.cleared, [id], "a teammate's ✅ completes the item");
  assert.equal(st.items[id].status, "cleared");
});

test("🚫 stays <your-name>-only (quiet optional verb)", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("slack", "C0TEAMOPS1:100.0");
  const st = stateWithItem(id);
  const scout = fakeScout({ reactions: { "9000.000001": [{ name: EMOJI_DISMISS, users: ["U0SOMEONE1"] }] } });
  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res.dismissed, []);
  assert.equal(st.items[id].status, "open");
});

test("👀 by <your-name> marks in-progress: stays open, flagged once, ✅ later still clears", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("slack", "C0TEAMOPS1:100.0");
  const st = stateWithItem(id);
  const { EMOJI_PROGRESS } = await import("./phase2c.js");
  const scout = fakeScout({ reactions: { "9000.000001": [{ name: EMOJI_PROGRESS, users: [KAN] }] } });
  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res.in_progress, [id]);
  assert.equal(st.items[id].status, "open", "in-progress items stay in Needs You");
  assert.equal(st.items[id].in_progress, true);
  // Second sweep: not re-flagged.
  const res2 = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res2.in_progress, []);
  // Teammate ✅ later: clears normally.
  const scout2 = fakeScout({ reactions: { "9000.000001": [{ name: EMOJI_PROGRESS, users: [KAN] }, { name: EMOJI_DONE, users: ["U0JEN00001"] }] } });
  const res3 = await runPhase2c(wt, st, { now: new Date().toISOString(), scout: scout2 });
  assert.deepEqual(res3.cleared, [id]);
});

test("👀 by someone else is ignored (<your-name>'s gesture)", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("slack", "C0TEAMOPS1:100.0");
  const st = stateWithItem(id);
  const { EMOJI_PROGRESS } = await import("./phase2c.js");
  const scout = fakeScout({ reactions: { "9000.000001": [{ name: EMOJI_PROGRESS, users: ["U0SOMEONE1"] }] } });
  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res.in_progress, []);
  assert.ok(!st.items[id].in_progress);
});

test("<your-name> reply under an anchor: caught exactly once, logged verbatim to brief", async () => {
  const wt = await makeWorkTuple();
  const st = emptyDigestState();
  st.anchors["2026-07-02-morning"] = { anchor_ts: "8000.000001", posted_iso: new Date().toISOString() };
  const reply = { ts: "8000.000900", user: KAN, text: "Handled the kitchari question on our call\n---\n```sneaky fence```" };
  const scout = fakeScout({ replies: { "8000.000001": [reply] } });

  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.equal(res.replies.length, 1);
  // Verbatim + fenced in the day's brief (no LLM pass).
  const briefFiles = await fs.readdir(path.join(wt.client_dir, "briefs"));
  assert.equal(briefFiles.length, 1);
  const briefRaw = await fs.readFile(path.join(wt.client_dir, "briefs", briefFiles[0]), "utf8");
  assert.ok(briefRaw.includes("Handled the kitchari question"));
  assert.ok(briefRaw.includes("\\---"), "reply content is fence-sanitized");

  // Exactly once: second sweep re-reads the same thread, .cc-ts.jsonl dedups.
  const res2 = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.equal(res2.replies.length, 0, "reply must never be re-processed");
  const idx = await readJsonl(path.join(slackDir(wt.client_dir), CC_TS_INDEX));
  assert.equal(idx.filter((r) => r.kind === "reply").length, 1);
});

test("non-<your-name> replies + top-level messages are ignored", async () => {
  const wt = await makeWorkTuple();
  const st = emptyDigestState();
  st.anchors["w1"] = { anchor_ts: "8000.000001", posted_iso: new Date().toISOString() };
  const scout = fakeScout({
    replies: { "8000.000001": [{ ts: "8000.000900", user: "U0SOMEONE1", text: "not <your-username>" }] },
  });
  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.equal(res.replies.length, 0);
  // Contract: reads anchor ONLY to Gutsy ts — no channel-history call exists on the fake,
  // so by construction top-level messages are unreachable. Assert the call shape:
  assert.ok(scout.calls.replies.every((c) => c.ch === CC && c.ts === "8000.000001"));
});

test("old anchors age out of the reply-check list (budget posture)", async () => {
  const wt = await makeWorkTuple();
  const st = emptyDigestState();
  st.anchors["old"] = { anchor_ts: "7000.000001", posted_iso: new Date(Date.now() - 3 * 86400_000).toISOString() };
  st.anchors["fresh"] = { anchor_ts: "8000.000001", posted_iso: new Date().toISOString() };
  const scout = fakeScout({ replies: {} });
  await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  const checked = scout.calls.replies.map((c) => c.ts);
  assert.ok(checked.includes("8000.000001"));
  assert.ok(!checked.includes("7000.000001"), "48h-old anchors are off the check list");
});

test("dry-run: transitions reported but no index/note/brief writes", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("slack", "C0TEAMOPS1:100.0");
  const st = stateWithItem(id);
  st.anchors["w1"] = { anchor_ts: "8000.000001", posted_iso: new Date().toISOString() };
  const scout = fakeScout({
    reactions: { "9000.000001": [{ name: EMOJI_DONE, users: [KAN] }] },
    replies: { "8000.000001": [{ ts: "8000.000900", user: KAN, text: "dry reply" }] },
  });
  const res = await runPhase2c(wt, st, { dryRun: true, now: new Date().toISOString(), scout });
  assert.equal(res.cleared.length, 1);
  assert.equal(res.replies.length, 1);
  const idx = await readJsonl(path.join(slackDir(wt.client_dir), CC_TS_INDEX));
  assert.equal(idx.length, 0, "no index writes on dry-run");
  const briefs = await fs.readdir(path.join(wt.client_dir, "briefs")).catch(() => []);
  assert.equal(briefs.length, 0, "no brief writes on dry-run");
});

// ---- Reaction-history + anchor bulk-✅ (NSA-hardened 2026-07-06) ----

test("✅ on a 68h-old superseded child still clears the item (no time gate on history)", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("email", "19eecd434b8bc638");
  const oldIso = new Date(Date.now() - 68 * 3600_000).toISOString();
  const st = stateWithItem(id, {
    source: "email",
    child_message_ts: "9100.000001",
    child_posted_iso: new Date().toISOString(),
    child_ts_history: [{ ts: "9000.000001", posted_iso: oldIso }],
  });
  // Reaction sits ONLY on the superseded (weekend-gap) child.
  const scout = fakeScout({ reactions: { "9000.000001": [{ name: EMOJI_DONE, users: [KAN] }] } });
  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res.cleared, [id]);
  assert.equal(res.cleared_via_history, 1);
  assert.equal(st.items[id].status, "cleared");
  // Audit row names the ts the human actually touched.
  const rows = await readJsonl(path.join(slackDir(wt.client_dir), CC_TS_INDEX));
  assert.equal(rows.find((r) => r.kind === "reaction").anchor_ts, "9000.000001");
});

test("❤️ recency is judged per-ts: heart on a stale history child is NOT saved", async () => {
  const wt = await makeWorkTuple();
  wt.slack.saved_dir = "context/projects/test-saves";
  const id = itemIdFor("slack", "C0TEAMOPS1:100.0");
  const staleIso = new Date(Date.now() - 72 * 3600_000).toISOString(); // beyond 48h window
  const st = stateWithItem(id, {
    child_message_ts: "9100.000001",
    child_posted_iso: new Date().toISOString(),
    child_ts_history: [{ ts: "9000.000001", posted_iso: staleIso }],
  });
  const scout = fakeScout({ reactions: { "9000.000001": [{ name: EMOJI_SAVE, users: [KAN] }] } });
  const res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.equal(res.saved.length, 0, "stale-child heart not saved");
});

test("anchor bulk-✅ by <your-name> clears ALL open items with children; others' ✅ ignored", async () => {
  const wt = await makeWorkTuple();
  const a = itemIdFor("email", "t-aaa");
  const b = itemIdFor("slack", "C0TEAMOPS1:200.0");
  const st = stateWithItem(a, { child_message_ts: "9100.000001" });
  st.items[b] = { source: "slack", note_path: null, first_seen_sweep: 1, sweeps_shown: 1, status: "open", child_message_ts: "9100.000002", child_posted_iso: new Date().toISOString() };
  st.items["no-child"] = { source: "email", status: "open", child_message_ts: null };
  st.anchors["2026-07-06-morning"] = { anchor_ts: "8000.000001", posted_iso: new Date().toISOString() };
  // Someone else's ✅ on the anchor: no bulk clear.
  let scout = fakeScout({ reactions: { "8000.000001": [{ name: EMOJI_DONE, users: ["U0SOMEONE1"] }] } });
  let res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.equal(res.cleared.length, 0, "bulk power is <your-name>-only");
  // <your-name>'s ✅ on the anchor: every open item with a child clears.
  scout = fakeScout({ reactions: { "8000.000001": [{ name: EMOJI_DONE, users: [KAN] }] } });
  res = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.deepEqual(res.cleared.sort(), [a, b].sort());
  assert.equal(st.items[a].status, "cleared");
  assert.equal(st.items[b].status, "cleared");
  assert.equal(st.items["no-child"].status, "open", "never-shown items untouched");
});
