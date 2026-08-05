// M5 tests: full item lifecycle (spec §7 verbatim) — appears → ages → ✅ clears →
// tally reflects; 🚫 never reappears; inferred clear resurrects on client follow-up;
// batched acknowledgment fires once. Run: node --test test_digest_lifecycle.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import matter from "gray-matter";
import { postDigest, updateLedger } from "./digest-post.js";
import { runPhase2c, itemIdFor, EMOJI_DONE, EMOJI_DISMISS } from "./phase2c.js";
import { emptyDigestState, slackDir } from "./slack-state.js";
import { atomicWrite } from "./util.js";

const KAN = "U0KANYINI1";
const CC = "C0CMDCENTR";
const THREAD = "C0KMARA001:100.0";
const NOTE = "2026-07-02_kanyini-<example-client>-ask.md";

function cfg() {
  return {
    user_id: KAN,
    command_center: CC,
    channels: [{ id: "C0KMARA001", name: "<your-username>-<example-client>", lane: null, mirror: false }],
    roster: { U0MARA0001: "<example-client>" },
    movement_threshold: 3,
    thread_window_days: 14,
    replies_call_cap: 20,
  };
}

async function makeWorkTuple() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-life-"));
  await fs.mkdir(slackDir(dir), { recursive: true });
  return { client_slug: "<example-client>", client_dir: dir, run_id: "t", slack: cfg() };
}

async function writeNote(clientDir, { lastFrom, lastIso }) {
  await atomicWrite(path.join(slackDir(clientDir), NOTE), matter.stringify("# ask", {
    type: "slack-thread", source: "slack", client: "<example-client>",
    thread_key: THREAD, channel_id: "C0KMARA001", channel_name: "<your-username>-<example-client>",
    slack_ts: ["100.0"], subject: "Can you approve the plan?", owner: "U0MARA0001",
    ts_first: "2026-07-02T08:00:00Z", ts_last: lastIso, last_from: lastFrom,
    last_msg_iso: lastIso, lane: null, lane_source: null, status: "open",
    mirror: false, watch: false,
  }));
  return `slack/${NOTE}`;
}

let globalTs = 1000; // shared across fakes so ts never collides between sweeps
function fakeGutsy() {
  const g = { posts: [], updates: [] };
  g.postMessage = async (ch, opts) => {
    const ts = `${++globalTs}.1`;
    g.posts.push({ ch, ts, ...opts });
    return { ts, channel: ch };
  };
  g.updateMessage = async (ch, ts, opts) => {
    g.updates.push({ ch, ts, ...opts });
    return { ts, channel: ch };
  };
  return g;
}

function ctxFor(st, gutsy, { now, cc = { cleared: [], dismissed: [], replies: [] }, phase2b = null } = {}) {
  return {
    gutsy, scout: null, gutsyBotId: "B0G1", teamUrl: "https://gc.slack.com",
    phase2b, nudges: [], cc, digestState: st, filedCount: 1, briefPath: null,
    dryRun: false, now, persistState: async () => {},
  };
}

const D = (h) => new Date(`2026-07-02T${String(h).padStart(2, "0")}:05:00`).toISOString();
const D3 = (h) => new Date(`2026-07-03T${String(h).padStart(2, "0")}:05:00`).toISOString();

test("full lifecycle: appears 🆕 → ages ⏳ → ✅ clears → Cleared tally → stays gone", async () => {
  const wt = await makeWorkTuple();
  const st = emptyDigestState();
  const rel = await writeNote(wt.client_dir, { lastFrom: "them", lastIso: "2026-07-02T07:50:00Z" });
  const id = itemIdFor("slack", THREAD);

  // Sweep 1 (morning): item appears as 🆕 child.
  let g = fakeGutsy();
  await postDigest(wt, ctxFor(st, g, { now: D(8), phase2b: { new_thread_paths: [rel], merged_thread_paths: [] } }));
  assert.equal(g.posts.length, 2);
  assert.ok(g.posts[1].text.includes("🆕"));
  assert.equal(st.items[id].sweeps_shown, 1);
  const firstChildTs = st.items[id].child_message_ts;

  // Sweep 2 (next morning — sticky): re-renders with ⏳, new child message.
  g = fakeGutsy();
  await postDigest(wt, ctxFor(st, g, { now: D3(8) }));
  assert.ok(g.posts[1].text.includes("⏳"), "age marker escalates, never re-renders as new");
  assert.notEqual(st.items[id].child_message_ts, firstChildTs, "fresh child = fresh reaction anchor");
  assert.equal(st.items[id].sweeps_shown, 2);

  // <your-name> taps ✅ on the latest child → phase2c clears it.
  const scout = {
    reactionsGet: async (ch, ts) => (ts === st.items[id].child_message_ts ? [{ name: EMOJI_DONE, users: [KAN] }] : []),
    repliesSince: async () => [],
  };
  const ccRes = await runPhase2c(wt, st, { now: D3(12), scout });
  assert.deepEqual(ccRes.cleared, [id]);

  // Sweep 3 (quiet evening): no digest post — the cleared tally rides the footer.
  g = fakeGutsy();
  const res = await postDigest(wt, ctxFor(st, g, { now: D3(18), cc: { cleared: [id], dismissed: [], replies: [] } }));
  assert.equal(res.posted, false, "cleared alone is not signal; evening stays conditional");
  assert.ok(g.updates[0].text.includes("1 cleared"), "footer acknowledges the clear");

  // Sweep 4 (next morning, always posts): item no longer renders; Cleared line shows.
  g = fakeGutsy();
  const res4 = await postDigest(wt, ctxFor(st, g, {
    now: new Date("2026-07-04T08:05:00").toISOString(),
    cc: { cleared: [id], dismissed: [], replies: [] },
  }));
  assert.equal(res4.posted, true);
  const anchorText = g.posts[0].text;
  assert.ok(!anchorText.includes("Can you approve"), "cleared item gone from digest");
  assert.ok(anchorText.includes("Cleared: 1 handled"));
  // ✅-cleared items never resurrect on later activity:
  await writeNote(wt.client_dir, { lastFrom: "them", lastIso: "2026-07-03T19:00:00Z" });
  const model = await updateLedger(wt, st, { phase2b: { new_thread_paths: [`slack/${NOTE}`], merged_thread_paths: [] }, nudges: [], teamUrl: null, now: D3(19) });
  assert.equal(st.items[id].status, "cleared", "explicit ✅ is final");
  assert.equal(model.needsYou.length, 0);
});

test("🚫 dismissed item never reappears, vault note carries status", async () => {
  const wt = await makeWorkTuple();
  const st = emptyDigestState();
  const rel = await writeNote(wt.client_dir, { lastFrom: "them", lastIso: "2026-07-02T07:50:00Z" });
  const id = itemIdFor("slack", THREAD);
  const g = fakeGutsy();
  await postDigest(wt, ctxFor(st, g, { now: D(8), phase2b: { new_thread_paths: [rel], merged_thread_paths: [] } }));

  const scout = {
    reactionsGet: async () => [{ name: EMOJI_DISMISS, users: [KAN] }],
    repliesSince: async () => [],
  };
  await runPhase2c(wt, st, { now: D(12), scout });
  assert.equal(st.items[id].status, "dismissed");
  const noteFm = matter(await fs.readFile(path.join(slackDir(wt.client_dir), NOTE), "utf8")).data;
  assert.equal(noteFm.status, "dismissed");

  // New client activity — dismissed stays dismissed (a chosen letting-go).
  await writeNote(wt.client_dir, { lastFrom: "them", lastIso: "2026-07-02T13:00:00Z" });
  // (rewrite resets status:open in the NOTE, but the LEDGER's explicit dismissal rules the digest)
  const model = await updateLedger(wt, st, { phase2b: { new_thread_paths: [rel], merged_thread_paths: [] }, nudges: [], teamUrl: null, now: D(13) });
  assert.equal(model.needsYou.length, 0);
  assert.equal(st.items[id].status, "dismissed");
});

test("inferred done: <your-name>'s reply latest → cleared_inferred; client follow-up RESURRECTS as 🆕", async () => {
  const wt = await makeWorkTuple();
  const st = emptyDigestState();
  const rel = await writeNote(wt.client_dir, { lastFrom: "them", lastIso: "2026-07-02T07:50:00Z" });
  const id = itemIdFor("slack", THREAD);

  // Sweep 1: open item.
  await updateLedger(wt, st, { phase2b: { new_thread_paths: [rel], merged_thread_paths: [] }, nudges: [], teamUrl: null, now: D(8) });
  st.items[id].sweeps_shown = 2; // pretend it rendered twice
  assert.equal(st.items[id].status, "open");

  // <your-name> replies in the thread → note's last_from flips to "me" → inferred clear.
  await writeNote(wt.client_dir, { lastFrom: "me", lastIso: "2026-07-02T11:00:00Z" });
  let model = await updateLedger(wt, st, { phase2b: { new_thread_paths: [], merged_thread_paths: [rel] }, nudges: [], teamUrl: null, now: D(12) });
  assert.equal(st.items[id].status, "cleared_inferred");
  assert.equal(model.needsYou.length, 0);

  // <example-client> replies again → inference was wrong → resurrect as 🆕-with-history.
  await writeNote(wt.client_dir, { lastFrom: "them", lastIso: "2026-07-02T15:00:00Z" });
  model = await updateLedger(wt, st, { phase2b: { new_thread_paths: [], merged_thread_paths: [rel] }, nudges: [], teamUrl: null, now: D(16) });
  assert.equal(st.items[id].status, "open");
  assert.equal(st.items[id].sweeps_shown, 0, "renders 🆕 again");
  assert.equal(st.items[id].resurrected, true);
  assert.equal(model.needsYou.length, 1);
});

test("email inferred done: red nudge gone → cleared_inferred; red returns → reopens", async () => {
  const wt = await makeWorkTuple();
  const st = emptyDigestState();
  const red = { thread_id: "em1", tier: "red", subject: "Client ask", note_path: "inbox/x.md", last_msg_iso: "2026-07-01T00:00:00Z" };
  await updateLedger(wt, st, { phase2b: null, nudges: [red], teamUrl: null, now: D(8) });
  const id = itemIdFor("email", "em1");
  assert.equal(st.items[id].status, "open");

  // Next sweep: aging no longer reports the red (he replied) → inferred clear.
  await updateLedger(wt, st, { phase2b: null, nudges: [], teamUrl: null, now: D(12) });
  assert.equal(st.items[id].status, "cleared_inferred");

  // Red comes back (client followed up) → resurrect.
  await updateLedger(wt, st, { phase2b: null, nudges: [red], teamUrl: null, now: D(18) });
  assert.equal(st.items[id].status, "open");
  assert.equal(st.items[id].sweeps_shown, 0);
});

test("acknowledgment floor: batched, timestamp-anchored, fires even on a quiet conditional turn", async () => {
  const wt = await makeWorkTuple();
  const st = emptyDigestState();
  st.anchors["2026-07-02-morning"] = { anchor_ts: "555.1", posted_iso: D(8), base_text: "*Morning*", footers: [] };
  const g = fakeGutsy();
  const cc = {
    cleared: [], dismissed: [],
    replies: [
      { ts: "556.1", anchor_ts: "555.1", iso: "2026-07-02T10:04:00", text: "on it" },
      { ts: "557.1", anchor_ts: "555.1", iso: "2026-07-02T10:30:00", text: "also this" },
    ],
  };
  const res = await postDigest(wt, ctxFor(st, g, { now: D(12), cc }));
  assert.equal(res.posted, false, "quiet midday still doesn't post a digest");
  const ack = g.posts.find((p) => p.text.includes("Caught 2 replies"));
  assert.ok(ack, "ONE batched acknowledgment");
  assert.equal(ack.thread_ts, "555.1", "threaded under the anchor the replies hung on");
  assert.ok(ack.text.includes("10:04"), "timestamp-anchored");
  assert.ok(ack.text.includes("logged to the vault"));
  assert.equal(g.posts.length, 1, "no other posts on the quiet turn");
});
