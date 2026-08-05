// Phase 2c — command-center read (Sentinel spec §3 step 4). The ONLY read of
// #command-center, under a scoped contract:
//   - reads anchored ONLY to Gutsy-authored message ts recorded in digest-state.json
//     (reactions.get on per-item child messages + conversations.replies on Gutsy
//     messages for <your-name>'s replies),
//   - author filter: <your-name>'s user ID only,
//   - top-level non-threaded channel messages are IGNORED,
//   - own watermark/dedup index .cc-ts.jsonl → each reply processed exactly ONCE,
//   - reply content: fence-sanitized, appended VERBATIM to the day's brief (no LLM
//     pass), mirror:false, never enters client comms notes / lanes / thread registry.
//
// Budget posture (spec §5, amended NSA 2026-07-06): reactions are checked on the
// LATEST digest's child messages PLUS up to 3 superseded children per item
// (child_ts_history — sweeps can gap 68h+ and reactions land on the child the human
// actually saw) and the latest anchor (bulk-✅). ≤4 reactions.get per still-open item,
// self-limiting once cleared. Replies remain checked only on recent anchors + children
// within the 48h window.

import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { appendJsonl, readJsonl, sanitizeBody, atomicWrite, log, todayIso, VAULT_ROOT } from "./util.js";
import { slackDir, CC_TS_INDEX } from "./slack-state.js";

export const EMOJI_DONE = "white_check_mark"; // ✅ retire/complete — honored from ANYONE (2026-07-02)
export const EMOJI_DISMISS = "no_entry_sign"; // 🚫 optional quiet verb, <your-name>-only ("not doing this")
export const EMOJI_SAVE = "heart";            // ❤️ <your-name>-only — promote the item's thread to the brain
export const EMOJI_PROGRESS = "eyes";         // 👀 <your-name>-only — "I'm on it": stops age-nagging, logs in-progress

// How far back Gutsy messages stay on the reply-check list (two days ≈ 6 sweeps).
const REPLY_CHECK_WINDOW_MS = 48 * 3600 * 1000;

/** item_id rule (spec §4.1): Slack = thread_key; Gmail = thread id. */
export function itemIdFor(source, key) {
  return `${source}:${key}`;
}

/**
 * Update a vault note's frontmatter `status` (dismiss path). Atomic read-modify-write;
 * comms truth lives on the note (spec §4.1 reconciliation rule).
 */
async function setNoteStatus(clientDir, noteRel, status) {
  const abs = noteRel.startsWith("slack/")
    ? path.join(slackDir(clientDir), path.basename(noteRel))
    : path.join(clientDir, noteRel);
  let parsed;
  try {
    parsed = matter(await fs.readFile(abs, "utf8"));
  } catch (err) {
    await log("warn", `phase2c could not update note status (${noteRel}): ${err.message}`);
    return false;
  }
  parsed.data.status = status;
  await atomicWrite(abs, matter.stringify(parsed.content, parsed.data));
  return true;
}

/**
 * Phase 2c entry. Mutates `digestState.items` (status transitions); caller saves state.
 * Returns { cleared, dismissed, replies } — replies = [{ts, iso, text}] for the
 * acknowledgment floor (M5) and the brief append.
 */
export async function runPhase2c(workTuple, digestState, { dryRun = false, now, scout } = {}) {
  const slackCfg = workTuple.slack;
  const result = { cleared: [], dismissed: [], replies: [], saved: [], in_progress: [] };
  if (!slackCfg) return result;
  const cc = slackCfg.command_center;
  const kan = slackCfg.user_id;
  const nowIso = now || new Date().toISOString();
  const dir = slackDir(workTuple.client_dir);
  const ccIndexPath = path.join(dir, CC_TS_INDEX);
  const processed = new Set(
    (await readJsonl(ccIndexPath)).map((r) => `${r.kind}|${r.anchor_ts || ""}|${r.ts || r.emoji || ""}|${r.item_id || ""}`),
  );
  const cutoffMs = new Date(nowIso).getTime() - REPLY_CHECK_WINDOW_MS;

  // ── Reactions on digest child messages: ✅ done · 🚫 dismiss · ❤️ save-to-brain ──
  // Status transitions apply to open/cleared_inferred items; ❤️ works on ANY unsaved
  // item whose child was posted within the recency window (you can heart something
  // you already ✅'d). Only <your-name>'s reactions count; only in #command-center — by
  // construction, since this is the only surface this phase reads.
  //
  // Reaction-history (NSA 2026-07-06): each sweep re-posts children and supersedes the
  // old ts, but a ✅ often lands on a PRIOR sweep's child (observed 68h weekend gaps).
  // We read reactions on the current child AND up to 3 superseded ones (kept by count,
  // NO time gate — a 48h cutoff would re-lose weekend reactions; that window remains
  // replies-only). Budget: ≤3 extra reactions.get per still-open item, self-limiting
  // once an item clears. ❤️ recency is judged per-ts against THAT child's posted_iso.
  let clearedViaHistory = 0;
  for (const [itemId, item] of Object.entries(digestState.items || {})) {
    if (!item.child_message_ts) continue;
    const wantsStatus = item.status === "open" || item.status === "cleared_inferred";
    const tsList = [
      { ts: item.child_message_ts, posted_iso: item.child_posted_iso || null, current: true },
      ...[...(item.child_ts_history || [])].reverse().map((h) => ({ ts: h.ts, posted_iso: h.posted_iso, current: false })),
    ];
    const heartEligible =
      !item.saved &&
      slackCfg.saved_dir &&
      tsList.some((e) => e.posted_iso && new Date(e.posted_iso).getTime() >= cutoffMs);
    if (!wantsStatus && !heartEligible) continue;
    const perTs = []; // [{ts, current, posted_iso, reactions}]
    for (const e of tsList) {
      try {
        perTs.push({ ...e, reactions: await scout.reactionsGet(cc, e.ts) });
      } catch (err) {
        await log("warn", `phase2c reactions.get failed item=${itemId} ts=${e.ts}: ${err.message}`);
      }
    }
    if (!perTs.length) continue;
    // Find the entry (newest-first) carrying the reaction — its ts goes to the audit
    // ledger so the dedup row names the message the human actually touched.
    const findTs = (name, requireKan) =>
      perTs.find((e) =>
        e.reactions.some((r) => r.name === name && (requireKan ? (r.users || []).includes(kan) : (r.users || []).length > 0)),
      ) || null;
    const mine = (name) => !!findTs(name, true);
    // ✅ is the team gesture: ANY user's checkmark retires the item (<your-name> 2026-07-02).
    const anyone = (name) => !!findTs(name, false);
    // 👀 in-progress: <your-name> marks "I'm on it" — item stays open, stops age-escalating,
    // registry records the transition once. Cleared/dismissed later as normal.
    if (wantsStatus && item.status === "open" && !item.in_progress && mine(EMOJI_PROGRESS)) {
      item.in_progress = true;
      item.in_progress_iso = nowIso;
      result.in_progress.push(itemId);
      if (!dryRun) {
        await appendJsonl(ccIndexPath, { kind: "reaction", item_id: itemId, anchor_ts: findTs(EMOJI_PROGRESS, true).ts, emoji: EMOJI_PROGRESS, processed_iso: nowIso });
        await registryAppend(workTuple, item, itemId, "in_progress", nowIso);
      }
    }
    // Reaction beats inference on conflict (spec §4.1) — explicit ✅/🚫 wins.
    if (wantsStatus && mine(EMOJI_DISMISS)) {
      item.status = "dismissed";
      item.resolved_iso = nowIso;
      result.dismissed.push(itemId);
      if (!dryRun) {
        if (item.note_path) await setNoteStatus(workTuple.client_dir, item.note_path, "dismissed");
        await appendJsonl(ccIndexPath, { kind: "reaction", item_id: itemId, anchor_ts: findTs(EMOJI_DISMISS, true).ts, emoji: EMOJI_DISMISS, processed_iso: nowIso });
        await registryAppend(workTuple, item, itemId, "dismissed", nowIso);
      }
    } else if (wantsStatus && anyone(EMOJI_DONE)) {
      const found = findTs(EMOJI_DONE, false);
      if (!found.current) clearedViaHistory++;
      item.status = "cleared";
      item.resolved_iso = nowIso;
      result.cleared.push(itemId);
      if (!dryRun) {
        await appendJsonl(ccIndexPath, { kind: "reaction", item_id: itemId, anchor_ts: found.ts, emoji: EMOJI_DONE, processed_iso: nowIso });
        await registryAppend(workTuple, item, itemId, "cleared", nowIso);
      }
    }
    // ❤️ recency per-ts (CIPHER H5): the heart must sit on a child posted within the
    // window — judged by THAT child's own posted_iso, not the current child's.
    const heartFound = findTs(EMOJI_SAVE, true);
    const heartFresh =
      heartFound && heartFound.posted_iso && new Date(heartFound.posted_iso).getTime() >= cutoffMs;
    if (heartEligible && heartFresh) {
      try {
        const savedRel = await saveThreadToBrain(workTuple, item, itemId, nowIso, dryRun);
        item.saved = true;
        item.saved_path = savedRel;
        result.saved.push({ item_id: itemId, path: savedRel, child_message_ts: item.child_message_ts });
        if (!dryRun) {
          await appendJsonl(ccIndexPath, { kind: "save", item_id: itemId, anchor_ts: item.child_message_ts, emoji: EMOJI_SAVE, processed_iso: nowIso });
          await registryAppend(workTuple, item, itemId, "saved", nowIso, savedRel);
        }
      } catch (err) {
        await log("error", `phase2c ❤️-save failed item=${itemId}: ${err.message} — will retry next sweep`);
      }
    }
  }

  // ── Anchor bulk-✅ (<your-name> 2026-07-06): his ✅ on the LATEST digest anchor — the
  // "one message" he actually sees — clears ALL open items shown in a digest (any item
  // with a child). <your-name>-only (bulk power stays with the owner); per-item ✅ on
  // children still works as above. Idempotent: only open/cleared_inferred items flip.
  const latestAnchor = Object.values(digestState.anchors || {})
    .filter((a) => a.anchor_ts)
    .sort((a, b) => String(a.posted_iso || "").localeCompare(String(b.posted_iso || "")))
    .pop();
  if (latestAnchor) {
    try {
      const anchorReactions = await scout.reactionsGet(cc, latestAnchor.anchor_ts);
      if (anchorReactions.some((r) => r.name === EMOJI_DONE && (r.users || []).includes(kan))) {
        for (const [itemId, item] of Object.entries(digestState.items || {})) {
          if (!item.child_message_ts) continue;
          if (item.status !== "open" && item.status !== "cleared_inferred") continue;
          item.status = "cleared";
          item.resolved_iso = nowIso;
          result.cleared.push(itemId);
          if (!dryRun) {
            await appendJsonl(ccIndexPath, { kind: "reaction", item_id: itemId, anchor_ts: latestAnchor.anchor_ts, emoji: EMOJI_DONE, processed_iso: nowIso });
            await registryAppend(workTuple, item, itemId, "cleared", nowIso);
          }
        }
        await log("info", `phase2c anchor bulk-✅ anchor=${latestAnchor.anchor_ts} cleared_all_open`);
      }
    } catch (err) {
      await log("warn", `phase2c anchor bulk-✅ read failed: ${err.message}`);
    }
  }

  // ── Shadow-approval reads (team digests, spec §2.4): <your-name>-only ✅ on the
  // 🕶️ shadow post approves that recipient's window. Separate loop = separate ts
  // namespace from item children (audit advisory: one ts, one ledger namespace).
  for (const [uid, led] of Object.entries(digestState.team_digests || {})) {
    if (!led.shadow_ts || !led.window || led.shadow_approved?.[led.window]) continue;
    let reactions;
    try {
      reactions = await scout.reactionsGet(cc, led.shadow_ts);
    } catch (err) {
      await log("warn", `phase2c shadow-approval read failed uid=${uid}: ${err.message}`);
      continue;
    }
    if (reactions.some((r) => r.name === EMOJI_DONE && (r.users || []).includes(kan))) {
      (led.shadow_approved ??= {})[led.window] = true;
      if (!dryRun) {
        await appendJsonl(ccIndexPath, { kind: "shadow_approval", item_id: uid, anchor_ts: led.shadow_ts, emoji: EMOJI_DONE, processed_iso: nowIso });
      }
      await log("info", `phase2c shadow digest APPROVED recipient=${uid} window=${led.window}`);
    }
  }

  // ── <your-name> replies threaded under recent Gutsy messages ─────────────────────
  // Check list = recent anchors + latest children (Gutsy-authored ts only — the
  // contract's anchor rule). Top-level channel messages are never read.
  const checkTs = new Set();
  for (const rec of Object.values(digestState.anchors || {})) {
    if (rec.anchor_ts && new Date(rec.posted_iso || 0).getTime() >= cutoffMs) checkTs.add(rec.anchor_ts);
  }
  for (const item of Object.values(digestState.items || {})) {
    if (item.child_message_ts && item.child_posted_iso && new Date(item.child_posted_iso).getTime() >= cutoffMs) {
      checkTs.add(item.child_message_ts);
    }
  }
  for (const gutsyTs of checkTs) {
    let replies;
    try {
      replies = await scout.repliesSince(cc, gutsyTs, null);
    } catch (err) {
      await log("warn", `phase2c replies check failed anchor=${gutsyTs}: ${err.message}`);
      continue;
    }
    for (const m of replies) {
      if (m.user !== kan) continue; // author filter: <your-name> only
      const dedupKey = `reply|${gutsyTs}|${m.ts}|`;
      if (processed.has(dedupKey)) continue; // exactly-once — enforced by state
      result.replies.push({ ts: m.ts, anchor_ts: gutsyTs, iso: tsIso(m.ts), text: String(m.text || "") });
      if (!dryRun) {
        await appendJsonl(ccIndexPath, { kind: "reply", anchor_ts: gutsyTs, ts: m.ts, processed_iso: nowIso });
        processed.add(dedupKey);
      }
    }
  }

  // ── "Logged" must be TRUE: replies land verbatim in the day's brief note ─────
  if (result.replies.length && !dryRun) {
    await appendRepliesToBrief(workTuple.client_dir, result.replies, nowIso);
  }

  // ── Working-set hygiene: registry holds the durable record, so old resolved
  // items leave the state file (Triple Threat: projection archived → state pruned).
  if (!dryRun) {
    const pruned = pruneResolvedItems(digestState, slackCfg, nowIso);
    if (pruned) await log("info", `phase2c pruned ${pruned} resolved item(s) from digest-state (registry holds the record)`);
  }
  // Always emit — even at zero — so a blind reaction-reader and a quiet channel stop
  // looking identical in the logs (PHANTOM; same argument as metric=reply_health).
  result.cleared_via_history = clearedViaHistory;
  await log(
    "info",
    `phase2c client=${workTuple.client_slug} cleared=${result.cleared.length} cleared_via_history=${clearedViaHistory} dismissed=${result.dismissed.length} replies=${result.replies.length}`,
  );
  return result;
}

function tsIso(ts) {
  return new Date(Math.round(parseFloat(ts) * 1000)).toISOString();
}

/** Trailing consecutive approved ISO weeks, newest backward (go-live gate ≥2, spec §2.4). */
export function consecutiveApprovals(led) {
  const weeks = Object.keys(led?.shadow_approved || {}).filter((w) => led.shadow_approved[w] === true).sort();
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (i === weeks.length - 1) {
      streak = 1;
      continue;
    }
    const [y1, w1] = weeks[i].split("-W").map(Number);
    const [y2, w2] = weeks[i + 1].split("-W").map(Number);
    const contiguous = (y1 === y2 && w2 - w1 === 1) || (y2 === y1 + 1 && w1 >= 52 && w2 === 1);
    if (contiguous) streak++;
    else break;
  }
  return streak;
}

/**
 * Resolution registry — append-only human-readable PROJECTION of triage decisions
 * (Triple Threat reflection 2026-07-02: the registry is a log, not a second source
 * of truth; digest-state.json remains the state machine). One line per explicit
 * reaction (✅/🚫/❤️), grouped under `## YYYY-MM` headings, at `<saved_dir>/_registry.md`.
 * mirror:false items register with ZERO subject text (every-render-surface rule).
 */
function registryLine(item, itemId, kind, nowIso, savedRel, clientVaultPath) {
  const stamp = nowIso.slice(0, 16).replace("T", " ");
  const label =
    item.mirror === false || item.summary == null
      ? `1:1 thread (${item.channel_name || "private"})`
      : String(item.summary).replace(/[[\]`|]/g, "").replace(/\s+/g, " ").slice(0, 90);
  const where = item.source === "email" ? "email" : `#${item.channel_name || "slack"}`;
  const marks = { cleared: "✅ done", dismissed: "🚫 dismissed", saved: "❤️ saved", in_progress: "👀 in progress", delivered: "📨 delivered" };
  let link = "";
  if (kind === "saved" && savedRel) {
    link = ` → [[${savedRel.replace(/\.md$/, "")}]]`;
  } else if (item.note_path && item.source === "slack" && clientVaultPath) {
    link = ` → [[${clientVaultPath}/${item.note_path.replace(/\.md$/, "")}]]`;
  }
  return `- ${stamp} · ${marks[kind]} · **${label}** _(${where})_${link}`;
}

export async function registryAppend(workTuple, item, itemId, kind, nowIso, savedRel = null) {
  const slackCfg = workTuple.slack;
  if (!slackCfg.saved_dir) return; // registry rides the saves config — off without it
  const regAbs = path.join(VAULT_ROOT, slackCfg.saved_dir, "_registry.md");
  const clientVaultPath = path.relative(VAULT_ROOT, workTuple.client_dir).replace(/\\/g, "/");
  const monthHeading = `## ${nowIso.slice(0, 7)}`;
  let existing;
  try {
    existing = await fs.readFile(regAbs, "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    existing = [
      "---",
      "type: resolution-registry",
      `client: ${workTuple.client_slug}`,
      "description: Append-only log of command-center triage decisions (✅/🚫/❤️). Projection of digest-state, not a source of truth.",
      'related: ["[[the-example-client]]"]',
      "---",
      "",
      "# Command-Center Resolution Registry",
      "",
    ].join("\n");
  }
  if (!existing.includes(monthHeading)) {
    existing = existing.trimEnd() + `\n\n${monthHeading}\n`;
  }
  await atomicWrite(regAbs, existing.trimEnd() + "\n" + registryLine(item, itemId, kind, nowIso, savedRel, clientVaultPath) + "\n");
}

/**
 * Prune resolved items from the working state once the registry holds the durable
 * record (Triple Threat: registry = archive, digest-state = small working set).
 * Only runs when the registry is enabled; open/cleared_inferred items never pruned
 * (inferred clears must stay resurrectable).
 */
export function pruneResolvedItems(digestState, slackCfg, nowIso, days = 30) {
  if (!slackCfg?.saved_dir) return 0;
  const cutoff = new Date(nowIso).getTime() - days * 86400_000;
  let pruned = 0;
  for (const [id, it] of Object.entries(digestState.items || {})) {
    if (it.status !== "cleared" && it.status !== "dismissed") continue;
    if (!it.resolved_iso || new Date(it.resolved_iso).getTime() > cutoff) continue;
    delete digestState.items[id];
    pruned++;
  }
  return pruned;
}

/**
 * ❤️-save: promote the item's captured thread note (whole thread — the note IS the
 * thread) into the projects umbrella (`slack.saved_dir`, vault-relative). The copy
 * gains `type: saved-thread`, save provenance, and a `related: [[the-example-client]]`
 * link (no floating artifacts). Source note is untouched; mirror flag preserved.
 * Returns the vault-relative path of the saved copy.
 */
async function saveThreadToBrain(workTuple, item, itemId, nowIso, dryRun) {
  const slackCfg = workTuple.slack;
  if (!item.note_path) throw new Error("item has no note_path to save");
  const srcAbs = item.note_path.startsWith("slack/")
    ? path.join(slackDir(workTuple.client_dir), path.basename(item.note_path))
    : path.join(workTuple.client_dir, item.note_path);
  const parsed = matter(await fs.readFile(srcAbs, "utf8"));
  const umbrella = "[[the-example-client]]";
  const related = Array.isArray(parsed.data.related) ? parsed.data.related : [];
  const newFm = {
    ...parsed.data,
    type: "saved-thread",
    saved_at: nowIso,
    saved_from: itemId,
    saved_by: "❤️ command-center reaction",
    related: related.includes(umbrella) ? related : [...related, umbrella],
  };
  // Month folders (YYYY-MM) — saved full-threads organized by save month.
  const month = nowIso.slice(0, 7);
  const destDirAbs = path.join(VAULT_ROOT, slackCfg.saved_dir, month);
  const destAbs = path.join(destDirAbs, path.basename(srcAbs));
  const destRel = `${slackCfg.saved_dir}/${month}/${path.basename(srcAbs)}`;
  if (!dryRun) {
    await atomicWrite(destAbs, matter.stringify(parsed.content, newFm));
    await log("info", `phase2c ❤️ saved item=${itemId} → ${destRel}`);
  }
  return destRel;
}

/**
 * Append <your-name>'s command-center replies VERBATIM (fence-sanitized, no LLM pass)
 * to today's brief. If no brief exists yet this sweep, create a stub — Phase 3 writes
 * a timestamped sibling on collision, so the log is never lost either way.
 */
async function appendRepliesToBrief(clientDir, replies, nowIso) {
  const briefDir = path.join(clientDir, "briefs");
  const briefPath = path.join(briefDir, `${todayIso()}_brief.md`);
  const lines = [
    "",
    `### 💬 Command-center replies (logged ${nowIso})`,
    "",
    ...replies.flatMap((r) => [
      `**${r.iso}** — your reply:`,
      "",
      "```text",
      sanitizeBody(r.text),
      "```",
      "",
    ]),
  ].join("\n");
  let existing = "";
  try {
    existing = await fs.readFile(briefPath, "utf8");
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    // mirror:false — the reply log never reaches any client-facing surface (spec §3 step 4).
    existing = `---\ntype: client-brief\nmirror: false\n---\n\n# Command-center reply log — ${todayIso()}\n`;
  }
  await atomicWrite(briefPath, existing + lines);
}
