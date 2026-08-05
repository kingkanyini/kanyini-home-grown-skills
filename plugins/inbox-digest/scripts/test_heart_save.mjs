// ❤️-save tests (heart reaction → promote thread note to the projects umbrella).
// VAULT_ROOT is overridden BEFORE imports (dynamic) so nothing touches the real vault.
// Run: node --test test_heart_save.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";

const FAKE_VAULT = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-vault-"));
process.env.VAULT_ROOT = FAKE_VAULT;

const matter = (await import("gray-matter")).default;
const { runPhase2c, itemIdFor, EMOJI_DONE, EMOJI_DISMISS, EMOJI_SAVE, pruneResolvedItems } = await import("./phase2c.js");
const { emptyDigestState, slackDir } = await import("./slack-state.js");
const { atomicWrite } = await import("./util.js");

const KAN = "U0KANYINI1";
const CC = "C0CMDCENTR";
const SAVED_DIR = "context/projects/the-example-client/slack";
const NOTE = "2026-07-02_team-huddle-plan.md";

async function makeWorkTuple({ savedDir = SAVED_DIR } = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-heart-"));
  await fs.mkdir(slackDir(dir), { recursive: true });
  await atomicWrite(
    path.join(slackDir(dir), NOTE),
    matter.stringify("# the plan\n\nthread content here", {
      type: "slack-thread", source: "slack", client: "<example-client>",
      thread_key: "C0BEW0F4XPB:100.0", channel_id: "C0BEW0F4XPB", channel_name: "team-huddle",
      slack_ts: ["100.0"], subject: "the plan", owner: "U0MARA0001",
      ts_first: "2026-07-02T08:00:00Z", ts_last: "2026-07-02T08:00:00Z",
      last_from: "them", last_msg_iso: "2026-07-02T08:00:00Z",
      lane: null, status: "open", mirror: false, watch: false,
    }),
  );
  return {
    client_slug: "<example-client>",
    client_dir: dir,
    run_id: "t",
    slack: {
      user_id: KAN, command_center: CC, saved_dir: savedDir,
      channels: [{ id: "C0BEW0F4XPB", name: "team-huddle", lane: null, mirror: false }],
      roster: {}, movement_threshold: 3, thread_window_days: 14, replies_call_cap: 20,
    },
  };
}

function stateWithItem(id, overrides = {}) {
  const st = emptyDigestState();
  st.items[id] = {
    source: "slack", note_path: `slack/${NOTE}`, first_seen_sweep: 1, sweeps_shown: 1,
    status: "open", child_message_ts: "9000.1", child_posted_iso: new Date().toISOString(),
    ...overrides,
  };
  return st;
}

function scoutWith(reactions) {
  return { reactionsGet: async () => reactions, repliesSince: async () => [] };
}

test("❤️ by <your-name> saves the whole thread note to the umbrella with provenance + related link", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("slack", "C0BEW0F4XPB:100.0");
  const st = stateWithItem(id);
  const NOW = "2026-07-02T19:00:00.000Z";
  const res = await runPhase2c(wt, st, { now: NOW, scout: scoutWith([{ name: EMOJI_SAVE, users: [KAN] }]) });
  assert.equal(res.saved.length, 1);
  assert.equal(res.saved[0].path, `${SAVED_DIR}/2026-07/${NOTE}`, "saved full-threads organized by month");
  const saved = matter(await fs.readFile(path.join(FAKE_VAULT, SAVED_DIR, "2026-07", NOTE), "utf8"));
  assert.equal(saved.data.type, "saved-thread");
  assert.equal(saved.data.saved_from, id);
  assert.ok(saved.data.related.includes("[[the-example-client]]"), "no floating artifacts — umbrella link required");
  assert.equal(saved.data.mirror, false, "mirror flag preserved on the copy");
  assert.ok(saved.content.includes("thread content here"), "whole thread body copied");
  // Original untouched:
  const orig = matter(await fs.readFile(path.join(slackDir(wt.client_dir), NOTE), "utf8"));
  assert.equal(orig.data.type, "slack-thread");
  assert.equal(st.items[id].saved, true);
  assert.equal(st.items[id].status, "open", "❤️ does not change task status");
});

test("❤️ saves exactly once (saved flag) and works on already-✅'d items", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("slack", "C0BEW0F4XPB:100.0");
  const st = stateWithItem(id, { status: "cleared" }); // hearted AFTER being done
  const scout = scoutWith([{ name: EMOJI_SAVE, users: [KAN] }]);
  const res1 = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.equal(res1.saved.length, 1, "cleared items are still heart-eligible");
  const res2 = await runPhase2c(wt, st, { now: new Date().toISOString(), scout });
  assert.equal(res2.saved.length, 0, "never re-saved");
});

test("✅ and ❤️ together: item clears AND saves in one sweep", async () => {
  const wt = await makeWorkTuple();
  const id = itemIdFor("slack", "C0BEW0F4XPB:100.0");
  const st = stateWithItem(id);
  const res = await runPhase2c(wt, st, {
    now: new Date().toISOString(),
    scout: scoutWith([{ name: EMOJI_DONE, users: [KAN] }, { name: EMOJI_SAVE, users: [KAN] }]),
  });
  assert.deepEqual(res.cleared, [id]);
  assert.equal(res.saved.length, 1);
});

test("someone else's ❤️ is ignored; no saved_dir config disables hearts", async () => {
  const wt1 = await makeWorkTuple();
  const id = itemIdFor("slack", "C0BEW0F4XPB:100.0");
  const st1 = stateWithItem(id);
  const r1 = await runPhase2c(wt1, st1, { now: new Date().toISOString(), scout: scoutWith([{ name: EMOJI_SAVE, users: ["U0SOMEONE1"] }]) });
  assert.equal(r1.saved.length, 0, "only <your-name>'s heart counts");

  const wt2 = await makeWorkTuple({ savedDir: null });
  const st2 = stateWithItem(id);
  const r2 = await runPhase2c(wt2, st2, { now: new Date().toISOString(), scout: scoutWith([{ name: EMOJI_SAVE, users: [KAN] }]) });
  assert.equal(r2.saved.length, 0, "feature off without saved_dir");
});

test("registry: ✅/🚫/❤️ each append one dated line under a month heading; zero-quote for mirror:false", async () => {
  const regDir = `${SAVED_DIR}-registry-test`;
  const wt = await makeWorkTuple({ savedDir: regDir });
  const id = itemIdFor("slack", "C0BEW0F4XPB:100.0");

  // 🚫 a mirror:false item (subject must NOT leak into the registry)
  const st1 = stateWithItem(id, { summary: null, mirror: false, channel_name: "team-huddle" });
  await runPhase2c(wt, st1, { now: "2026-07-02T18:30:00.000Z", scout: scoutWith([{ name: EMOJI_DISMISS, users: [KAN] }]) });

  // ✅ + ❤️ a normal item
  const id2 = itemIdFor("slack", "C0BEW0F4XPB:200.0");
  const st2 = stateWithItem(id2, { summary: "Approve the kitchari label copy?", mirror: true, channel_name: "team-huddle" });
  await runPhase2c(wt, st2, { now: "2026-07-02T18:31:00.000Z", scout: scoutWith([{ name: EMOJI_DONE, users: [KAN] }, { name: EMOJI_SAVE, users: [KAN] }]) });

  const reg = await fs.readFile(path.join(FAKE_VAULT, regDir, "_registry.md"), "utf8");
  assert.ok(reg.includes("## 2026-07"), "month heading created");
  assert.ok(reg.includes("🚫 dismissed · **1:1 thread (team-huddle)**"), "mirror:false registers zero-quote");
  assert.ok(!reg.match(/dismissed · \*\*[^*]*plan/i), "no subject text in the 1:1 item's LABEL (vault wikilink pointer is fine)");
  assert.ok(reg.includes("✅ done · **Approve the kitchari label copy?**"), "cleared line with subject");
  assert.ok(reg.includes("❤️ saved · **Approve the kitchari label copy?**"), "saved line present");
  assert.ok(reg.includes(`[[${regDir}/2026-07/${NOTE.replace(".md", "")}]]`), "saved line links the month-foldered copy");
  assert.ok(reg.includes("- 2026-07-02 18:31"), "dated to the minute");
  const fm = matter(reg);
  assert.equal(fm.data.type, "resolution-registry");
  assert.ok(fm.data.related.includes("[[the-example-client]]"));
});

test("prune: resolved items >30d leave digest-state; open + inferred + recent stay", async () => {
  const { emptyDigestState: empty } = await import("./slack-state.js");
  const st = empty();
  const now = "2026-07-02T18:00:00.000Z";
  const old = "2026-05-20T00:00:00.000Z";
  st.items["a"] = { status: "cleared", resolved_iso: old };
  st.items["b"] = { status: "dismissed", resolved_iso: old };
  st.items["c"] = { status: "cleared", resolved_iso: "2026-07-01T00:00:00.000Z" }; // recent
  st.items["d"] = { status: "open" };
  st.items["e"] = { status: "cleared_inferred", resolved_iso: old }; // must stay resurrectable
  const cfg = { saved_dir: SAVED_DIR };
  assert.equal(pruneResolvedItems(st, cfg, now), 2);
  assert.deepEqual(Object.keys(st.items).sort(), ["c", "d", "e"]);
  // Registry disabled → never prunes (no durable record exists)
  const st2 = empty();
  st2.items["a"] = { status: "cleared", resolved_iso: old };
  assert.equal(pruneResolvedItems(st2, { saved_dir: null }, now), 0);
});

test("dry-run: save reported, no file written", async () => {
  const dryDir = `${SAVED_DIR}-dryrun`; // isolated target so earlier live tests can't collide
  const wt = await makeWorkTuple({ savedDir: dryDir });
  const id = itemIdFor("slack", "C0BEW0F4XPB:100.0");
  const st = stateWithItem(id);
  const res = await runPhase2c(wt, st, { dryRun: true, now: "2026-07-02T19:05:00.000Z", scout: scoutWith([{ name: EMOJI_SAVE, users: [KAN] }]) });
  assert.equal(res.saved.length, 1, "reports what it WOULD save");
  await assert.rejects(() => fs.access(path.join(FAKE_VAULT, dryDir, "2026-07", NOTE)), "no vault write on dry-run");
});
