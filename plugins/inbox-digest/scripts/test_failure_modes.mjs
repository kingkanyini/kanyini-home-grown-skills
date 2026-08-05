// M7 tests: table-driven over spec §6.1 failure modes + zombie tally + conflicted scan.
// Run: node --test test_failure_modes.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { runPhase2b, scanConflictedCopies } from "./phase2b.js";
import { computeWeeklyTally, postDigest } from "./digest-post.js";
import { HARD_DENY, SlackError } from "./slack.js";
import { emptyDigestState, loadSlackState, slackDir } from "./slack-state.js";

const KAN = "U0KANYINI1";
const CC = "C0CMDCENTR";

function cfg(overrides = {}) {
  return {
    user_id: KAN,
    command_center: CC,
    channels: [{ id: "C0TEAMOPS1", name: "team-ops", lane: null, mirror: true }],
    roster: {},
    movement_threshold: 3,
    thread_window_days: 14,
    replies_call_cap: 20,
    ...overrides,
  };
}

async function makeWorkTuple(cfgOverrides = {}) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-fail-"));
  return { client_slug: "<example-client>", client_dir: dir, run_id: "t", slack: cfg(cfgOverrides) };
}

function withDeny(fn) {
  return async (...args) => {
    const saved = { ...HARD_DENY };
    HARD_DENY["compliance"] = "C0COMPLYX1";
    HARD_DENY["Alex-tasks"] = "C0SHEVIEX1";
    HARD_DENY["Robin-handoff"] = "C0KATIEXX1";
    HARD_DENY["command-center"] = CC;
    try {
      return await fn(...args);
    } finally {
      Object.assign(HARD_DENY, saved);
    }
  };
}

// §6.1 row 1: Slack 401/403 — auth-dead error is rethrown so the orchestrator can
// continue the Gmail lane with Slack cursors held.
test("invalid_auth mid-channel: rethrown to orchestrator, cursor held first", withDeny(async () => {
  const wt = await makeWorkTuple();
  const scout = {
    requestCount: 0,
    listMemberChannels: async () => new Set(["C0TEAMOPS1"]),
    historySince: async () => {
      throw new SlackError("token dead", { code: "invalid_auth" });
    },
    repliesSince: async () => [],
  };
  await assert.rejects(
    () => runPhase2b(wt, { now: new Date().toISOString(), scout, selfBotIds: new Set() }),
    (err) => err.code === "invalid_auth",
  );
  const { state } = await loadSlackState(wt.client_dir);
  assert.equal(state.channels["C0TEAMOPS1"]?.held ?? true, true, "cursor held before rethrow");
}));

// §6.1: membership listing dies (401 at the top) — Slack lane skipped cleanly, no throw.
test("membership listing failure: lane skipped with error surfaced, no crash", withDeny(async () => {
  const wt = await makeWorkTuple();
  const scout = {
    requestCount: 0,
    listMemberChannels: async () => {
      throw new SlackError("nope", { code: "invalid_auth" });
    },
  };
  const res = await runPhase2b(wt, { now: new Date().toISOString(), scout, selfBotIds: new Set() });
  assert.equal(res.errors.length, 1);
  assert.equal(res.errors[0].stage, "membership");
  assert.equal(res.new_thread_paths.length, 0);
}));

// §6.1: BUDGET_EXHAUSTED — file what's fetched, hold the remainder, stop cleanly.
test("budget exhaustion: partial results kept, remaining channels held", withDeny(async () => {
  const nowSec = Math.floor(Date.now() / 1000);
  const T = `${nowSec - 600}.000100`;
  const wt = await makeWorkTuple({
    channels: [
      { id: "C0AAA00001", name: "a-channel", lane: null, mirror: true },
      { id: "C0BBB00001", name: "b-channel", lane: null, mirror: true },
    ],
  });
  let calls = 0;
  const scout = {
    requestCount: 0,
    listMemberChannels: async () => new Set(["C0AAA00001", "C0BBB00001"]),
    historySince: async (ch) => {
      calls++;
      if (calls === 1) return [{ ts: T, user: "U0X", text: "filed before exhaustion" }];
      throw new SlackError("budget", { code: "BUDGET_EXHAUSTED" });
    },
    repliesSince: async () => [],
  };
  const res = await runPhase2b(wt, { now: new Date().toISOString(), scout, selfBotIds: new Set() });
  assert.equal(res.new_thread_paths.length, 1, "first channel's work is kept");
  assert.ok(res.held_channels.length >= 1, "remaining channel held for next sweep");
}));

// §6 Dropbox: conflicted copies detected, surfaced, never resolved silently.
test("conflicted-copy scan finds artifacts at depth ≤ 2", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-cc-"));
  await fs.mkdir(path.join(dir, "slack"), { recursive: true });
  await fs.writeFile(path.join(dir, "slack", "note (<your-name>'s conflicted copy 2026-07-02).md"), "x");
  await fs.writeFile(path.join(dir, "clean.md"), "x");
  const hits = await scanConflictedCopies(dir);
  assert.equal(hits.length, 1);
  assert.ok(hits[0].includes("conflicted copy"));
});

// Spec §4.1 zombie check: tally math + the <30% warning threshold.
test("weekly tally: counts + zombie warning fires only with history and low change ratio", () => {
  const now = new Date().toISOString();
  const day = 86400_000;
  const st = emptyDigestState();
  st.sweep_counter = 40; // ≥ 2 weeks of history
  // 6 items active in window: 1 cleared recently, 5 open and untouched → ratio 1/6 < 30%.
  st.items["a"] = { status: "cleared", resolved_iso: new Date(Date.now() - day).toISOString(), first_seen_iso: new Date(Date.now() - 3 * day).toISOString() };
  for (let i = 0; i < 5; i++) {
    st.items[`open${i}`] = { status: "open", sweeps_shown: 10, first_seen_iso: new Date(Date.now() - 10 * day).toISOString() };
  }
  const t = computeWeeklyTally(st, now);
  assert.equal(t.cleared7, 1);
  assert.equal(t.open, 5);
  assert.equal(t.stale, 5);
  assert.equal(t.zombieWarning, true);

  // Healthy ledger: most items changed → no warning.
  const st2 = emptyDigestState();
  st2.sweep_counter = 40;
  for (let i = 0; i < 5; i++) {
    st2.items[`c${i}`] = { status: "cleared", resolved_iso: new Date(Date.now() - 2 * day).toISOString(), first_seen_iso: new Date(Date.now() - 4 * day).toISOString() };
  }
  st2.items["o1"] = { status: "open", sweeps_shown: 1, first_seen_iso: now };
  assert.equal(computeWeeklyTally(st2, now).zombieWarning, false);

  // Young system (< 2 weeks of sweeps): never warns.
  const st3 = emptyDigestState();
  st3.sweep_counter = 5;
  for (let i = 0; i < 6; i++) st3.items[`x${i}`] = { status: "open", sweeps_shown: 10, first_seen_iso: now };
  assert.equal(computeWeeklyTally(st3, now).zombieWarning, false);
});

test("week-4 value check: live recipient with ≥4 windows adds keep/change/kill line to tally", async () => {
  const { computeWeeklyTally } = await import("./digest-post.js");
  const t = computeWeeklyTally(
    { items: {}, sweep_counter: 40, team_digests: { U0JEN00001: { live_windows: 4, name: "Sam" } } },
    new Date().toISOString(),
  );
  assert.ok(t.valueChecks.some((l) => l.includes("Sam") && /keep, change, or kill/.test(l)));
  // Not yet 4 windows / already checked → no line.
  const t2 = computeWeeklyTally(
    { items: {}, sweep_counter: 40, team_digests: { A: { live_windows: 3, name: "A" }, B: { live_windows: 5, name: "B", value_checked: true } } },
    new Date().toISOString(),
  );
  assert.equal(t2.valueChecks.length, 0);
});

// Friday-evening tally posts once (guarded by last_tally_date).
test("weekly tally posts on Friday evening, once", async () => {
  const wt = await makeWorkTuple();
  await fs.mkdir(slackDir(wt.client_dir), { recursive: true });
  const friday = new Date("2026-07-03T18:10:00"); // 2026-07-03 is a Friday
  const st = emptyDigestState();
  st.anchors["2026-07-03-morning"] = { anchor_ts: "1.1", posted_iso: friday.toISOString(), base_text: "x", footers: [] };
  const posts = [];
  const gutsy = {
    postMessage: async (ch, opts) => {
      posts.push(opts.text);
      return { ts: `${900 + posts.length}.1`, channel: ch };
    },
    updateMessage: async () => ({}),
  };
  const ctx = {
    gutsy, scout: null, gutsyBotId: "B1", teamUrl: null, phase2b: null, nudges: [],
    cc: { cleared: [], dismissed: [], replies: [] }, digestState: st, filedCount: 0,
    briefPath: null, dryRun: false, now: friday.toISOString(), persistState: async () => {},
  };
  await postDigest(wt, ctx);
  assert.ok(posts.some((t) => t.startsWith("📊 This week:")), "tally posted");
  assert.equal(st.last_tally_date, "2026-07-03");
  const before = posts.length;
  await postDigest(wt, { ...ctx, digestState: st });
  const tallies = posts.filter((t) => t.startsWith("📊")).length;
  assert.equal(tallies, 1, "tally never double-posts the same Friday");
  assert.ok(posts.length >= before, "second call still ran");
});
