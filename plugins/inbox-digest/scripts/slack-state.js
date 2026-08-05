// Machine-owned Sentinel state (spec §3 step 1).
// Two files under <clientDir>/slack/, atomic-written, human hands off:
//   slack-state.json  — per-channel cursors, thread registry, per-thread reply watermarks
//   digest-state.json — the digest item ledger (spec §4.1) + posted-anchor records
// Config (allowlist, user IDs) stays in the hub frontmatter; runtime state lives HERE.
//
// Corrupt/rolled-back read (Dropbox is a second writer we don't control): alert,
// rebuild conservatively from the append-only dedup indexes (.slack-ts.jsonl /
// .cc-ts.jsonl), never guess forward — a behind-cursor re-fetch heals via dedup;
// a forward-guessed cursor silently loses messages (spec §6.1 rows 5–6).

import path from "node:path";
import { promises as fs } from "node:fs";
import { atomicWrite, readJsonl, log } from "./util.js";

export const SLACK_DIRNAME = "slack";
export const SLACK_STATE_FILE = "slack-state.json";
export const DIGEST_STATE_FILE = "digest-state.json";
export const SLACK_TS_INDEX = ".slack-ts.jsonl"; // {thread_key, ts, note_path, channel_id}
export const CC_TS_INDEX = ".cc-ts.jsonl";       // {kind: reaction|reply, gutsy_ts, ts|key, processed_iso}

export function slackDir(clientDir) {
  return path.join(clientDir, SLACK_DIRNAME);
}

export function emptySlackState() {
  return {
    schema_v: 1,
    // channel_id -> { cursor: "<ts>", held: bool }  (cursor = last INGESTED parent ts)
    channels: {},
    // thread_key ("<channel_id>:<thread_ts>") -> { channel_id, thread_ts,
    //   watermark: "<last ingested reply ts>", last_activity: "<ts>", last_checked_iso, watch?: bool }
    threads: {},
    // rotating sweep order — starved channels go FIRST next sweep (spec §5)
    channel_order: [],
  };
}

export function emptyDigestState() {
  return {
    schema_v: 1,
    // item_id -> { source: "slack"|"email", note_path, first_seen_sweep, sweeps_shown,
    //   status: "open"|"cleared"|"cleared_inferred"|"dismissed", child_message_ts }
    items: {},
    // sweep window id ("<date>-<slot>") -> { anchor_ts, posted_iso }  (digest-pending idempotency, §3 step 7)
    anchors: {},
    // pending digest retry marker: { window_id, created_iso } | null
    digest_pending: null,
    sweep_counter: 0,
  };
}

async function loadStateFile(filePath, emptyFactory, rebuildFn) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return { state: emptyFactory(), rebuilt: false };
    throw err;
  }
  try {
    const state = JSON.parse(raw);
    if (!state || typeof state !== "object" || !state.schema_v) throw new Error("missing schema_v");
    return { state, rebuilt: false };
  } catch (err) {
    await log("error", `sentinel state CORRUPT at ${path.basename(filePath)} (${err.message}) — conservative rebuild from dedup indexes; re-fetch will heal via dedup`);
    const state = await rebuildFn();
    return { state, rebuilt: true };
  }
}

/** Load slack-state.json; on corruption rebuild cursors/registry from .slack-ts.jsonl. */
export async function loadSlackState(clientDir) {
  const dir = slackDir(clientDir);
  return loadStateFile(path.join(dir, SLACK_STATE_FILE), emptySlackState, async () => {
    const state = emptySlackState();
    const idx = await readJsonl(path.join(dir, SLACK_TS_INDEX));
    for (const row of idx) {
      if (!row.thread_key || !row.ts) continue;
      const [channelId, threadTs] = String(row.thread_key).split(":");
      if (!channelId || !threadTs) continue;
      // Cursor = max parent/broadcast ts seen per channel (evidence-only, never forward).
      const ch = state.channels[channelId] || (state.channels[channelId] = { cursor: "0", held: false });
      if (parseFloat(row.ts) > parseFloat(ch.cursor)) ch.cursor = row.ts;
      // Registry entry with watermark = max ingested ts for that thread.
      const t = state.threads[row.thread_key] || (state.threads[row.thread_key] = {
        channel_id: channelId,
        thread_ts: threadTs,
        watermark: threadTs,
        last_activity: threadTs,
        last_checked_iso: null,
      });
      if (parseFloat(row.ts) > parseFloat(t.watermark)) t.watermark = row.ts;
      if (parseFloat(row.ts) > parseFloat(t.last_activity)) t.last_activity = row.ts;
    }
    state.channel_order = Object.keys(state.channels);
    return state;
  });
}

export async function saveSlackState(clientDir, state) {
  await atomicWrite(path.join(slackDir(clientDir), SLACK_STATE_FILE), JSON.stringify(state, null, 2));
}

/** Load digest-state.json; on corruption start empty (items re-derive from notes over sweeps). */
export async function loadDigestState(clientDir) {
  const dir = slackDir(clientDir);
  return loadStateFile(path.join(dir, DIGEST_STATE_FILE), emptyDigestState, async () => {
    // The ledger is presentation state (spec §4.1: vault note = comms truth). Starting
    // empty means items re-enter as 🆕 — annoying, never lossy. cc index still
    // prevents re-acknowledging old replies.
    return emptyDigestState();
  });
}

export async function saveDigestState(clientDir, state) {
  await atomicWrite(path.join(slackDir(clientDir), DIGEST_STATE_FILE), JSON.stringify(state, null, 2));
}

/** thread_key helper — the stable Slack item identity (spec §4.1). */
export function threadKey(channelId, threadTs) {
  return `${channelId}:${threadTs}`;
}

/**
 * Rotate channel sweep order so held/starved channels go first (spec §5).
 * `heldIds` = channels not finished last sweep. Others follow in rotated order.
 */
export function nextChannelOrder(state, allowedIds) {
  const prev = (state.channel_order || []).filter((id) => allowedIds.includes(id));
  const fresh = allowedIds.filter((id) => !prev.includes(id));
  const held = allowedIds.filter((id) => state.channels[id]?.held);
  const rest = [...prev, ...fresh].filter((id) => !held.includes(id));
  // Rotate the non-held tail by one so no fixed channel permanently leads.
  if (rest.length > 1) rest.push(rest.shift());
  return [...held, ...rest];
}

/**
 * Prune the thread registry: active = last_activity within `windowDays` OR watch:true.
 * Closed notes are the caller's business (it knows note status); we prune on time only.
 */
export function pruneRegistry(state, nowIso, windowDays = 14) {
  const cutoff = (new Date(nowIso).getTime() - windowDays * 86400_000) / 1000;
  let pruned = 0;
  for (const [key, t] of Object.entries(state.threads)) {
    if (t.watch) continue;
    if (parseFloat(t.last_activity) < cutoff) {
      delete state.threads[key];
      pruned++;
    }
  }
  return pruned;
}
