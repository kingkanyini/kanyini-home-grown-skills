#!/usr/bin/env node
// Phase 3.5 — digest render + Gutsy post (Sentinel spec §4, §3 step 7).
// Runs strictly AFTER cursor commit: a crash before this step yields a MISSED
// digest (watchdog-caught), never a duplicate.
//
// Message structure: ANCHOR (header · Cleared · Movement · Filed · closing line)
// + one threaded CHILD message per Needs-You item (one message = one item_id —
// reactions bind to messages, not lines; spec §4). Overflow child carries no items.
//
// Cadence: morning anchor ALWAYS posts (dead-man's switch); midday/evening post
// only on signal; silent turns chat.update a footer onto the day's anchor so every
// scheduled turn is accounted for in the surface <your-name> reads.
//
// The closing line is generated from STRUCTURAL METADATA ONLY (counts/lanes/ages —
// never raw message text; spec §5 injection posture). Deterministic templates —
// zero LLM surface in the digest post path.
//
// CLI: node digest-post.js --post-capability-card   (one-shot; <your-name> pins manually)

import process from "node:process";
import path from "node:path";
import { promises as fs } from "node:fs";
import matter from "gray-matter";
import { loadEnv, log, todayIso } from "./util.js";
import { slackDir } from "./slack-state.js";
import { itemIdFor } from "./phase2c.js";

// ── sweep slots ───────────────────────────────────────────────────────────────
export function slotFor(date = new Date()) {
  const h = date.getHours(); // local time — cron fires local 08/12/18
  if (h < 6) return "Early"; // pre-dawn logon catch-up: own window, NEVER claims Morning
  if (h < 11) return "Morning";
  if (h < 16) return "Midday";
  return "Evening";
}

export function windowIdFor(date = new Date()) {
  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return `${iso}-${slotFor(date).toLowerCase()}`;
}

const AGE_MARKS = ["🆕", "⏳", "🔴"]; // sweeps_shown 1 / 2 / 3+
export function ageMark(sweepsShown) {
  return AGE_MARKS[Math.min(Math.max(sweepsShown, 1), 3) - 1];
}

const LANE_EMOJI = { finance: "🟡", people: "🟢", ai: "🔵", funnel: "🟣", cx: "⚪" };

export function permalink(teamUrl, channelId, ts) {
  if (!teamUrl) return null;
  return `${teamUrl.replace(/\/$/, "")}/archives/${channelId}/p${String(ts).replace(".", "")}`;
}

export function gmailLink(threadId) {
  return `https://mail.google.com/mail/u/0/#all/${threadId}`;
}

// ── Needs-You detection: deterministic rules (spec §3.2), M4 tier ────────────
// (M6 adds the LLM remainder with needs_you_source: "llm".)
export function slackNeedsYouRule(noteFm, slackCfg) {
  if (noteFm.last_from !== "them") return false;
  // 1:1 back-channel keyed off mirror:false (ID-derived config) — channel NAMES are
  // display-only and never used for matching (counsel blocker: name-match voided the rule).
  if (noteFm.mirror === false) return true;
  if (noteFm.mentions_kanyini === true) return true; // @mention anywhere in the thread (incl. replies)
  const subj = String(noteFm.subject || "");
  if (subj.includes(`<@${slackCfg.user_id}>`)) return true; // parent-text mention (belt)
  if (noteFm.lane === "finance" && /\?|approve|please|need/i.test(subj)) return true;
  return false;
}

/** Priority tier (spec §4): <example-client>-owned, 🟡finance, or the 1:1 back-channel — bold-top ⚠️. */
export function isPriority(item) {
  return item.lane === "finance" || item.mirror === false || item.mara_owned === true;
}

/**
 * Ledger upkeep for this sweep. Reads the frontmatter of every slack note touched
 * this sweep, applies the Needs-You rules, upserts ledger items; maps red/yellow
 * email nudges to email items. Returns { needsYou, movement } model lists.
 * Mutates digestState (caller saves).
 */
export async function updateLedger(workTuple, digestState, { phase2b, nudges = [], teamUrl, now, classify = null }) {
  const slackCfg = workTuple.slack;
  const sweepNo = ++digestState.sweep_counter;
  const nowRef = now || new Date().toISOString();
  const movement = [];
  const dir = slackDir(workTuple.client_dir);
  // Word-exact match ("<example-client>" yes, "Tamara" no) — pin her exact ID in roster.
  const rosterMara = Object.entries(slackCfg.roster || {}).find(([, n]) => String(n).toLowerCase().split(/\s+/).includes("<example-client>"))?.[0] || null;

  const touched = [...new Set([...(phase2b?.new_thread_paths || []), ...(phase2b?.merged_thread_paths || [])])];
  const pending = []; // pass 1: rules + resurrection; pass 2 (post-LLM): upsert/movement
  for (const rel of touched) {
    let fm;
    try {
      fm = matter(await fs.readFile(path.join(dir, path.basename(rel)), "utf8")).data || {};
    } catch {
      continue;
    }
    const id = itemIdFor("slack", fm.thread_key);
    const link = permalink(teamUrl, fm.channel_id, fm.thread_key ? fm.thread_key.split(":")[1] : "");
    const needs = slackNeedsYouRule(fm, slackCfg);
    const existingItem = digestState.items[id];
    // Resurrection (spec §4.1): a cleared_INFERRED item re-opens as 🆕-with-history on
    // ANY subsequent non-<your-name> reply — the inference was wrong. Explicit ✅/🚫 is final.
    if (existingItem && existingItem.status === "cleared_inferred" && fm.last_from === "them") {
      existingItem.status = "open";
      existingItem.sweeps_shown = 0; // renders 🆕 again
      existingItem.resurrected = true;
      existingItem.last_activity_iso = fm.last_msg_iso || existingItem.last_activity_iso;
    }
    pending.push({ id, rel, fm, link, ruleNeeds: needs });
  }

  // LLM remainder (spec §3.1/§3.2): only items the rules did NOT decide, and NEVER
  // mirror:false content (zero-quote posture — the 1:1 back-channel's text stays out
  // of every extra LLM surface; its needs-you rule is deterministic anyway).
  let llmMap = new Map();
  if (classify) {
    const candidates = pending
      .filter((p) => !p.ruleNeeds && p.fm.last_from === "them" && p.fm.mirror !== false)
      .map((p) => ({ id: p.id, source: "slack", channel: p.fm.channel_name, summary: p.fm.subject }));
    if (candidates.length) {
      const verdicts = await classify(candidates); // null = classifier failed
      if (verdicts) llmMap = verdicts;
      // RECALL BIAS on the failure path (spec §3.2 — counsel blocker B5): a candidate
      // the classifier failed on or omitted defaults to INCLUDED. A missed client ask
      // is the costliest error; the human demotes with 🚫 in one tap.
      for (const c of candidates) {
        if (!llmMap.has(c.id)) llmMap.set(c.id, { lane: null, needs_you: true, defaulted: true });
      }
      if (!verdicts) await log("warn", "updateLedger: classifier failed — recall-bias defaults applied (undecided items INCLUDED)");
    }
  }

  for (const p of pending) {
    const { id, rel, fm, link } = p;
    const llm = llmMap.get(id);
    const needs = p.ruleNeeds || llm?.needs_you === true;
    if (needs) {
      const existing = digestState.items[id];
      // Explicitly-resolved items (✅ cleared / 🚫 dismissed) stay resolved; only
      // cleared_inferred resurrects on new client activity (spec §4.1).
      if (!existing || existing.status === "open" || existing.status === "cleared_inferred") {
        digestState.items[id] = {
          ...(existing || { first_seen_sweep: sweepNo, first_seen_iso: nowRef, sweeps_shown: 0, status: "open" }),
          source: "slack",
          note_path: rel,
          summary: fm.mirror === false ? null : String(fm.subject || "").slice(0, 120),
          lane: fm.lane || llm?.lane || null,
          lane_source: fm.lane ? fm.lane_source || "channel" : llm?.lane ? "llm" : null,
          channel_name: fm.channel_name,
          mirror: fm.mirror !== false,
          mara_owned: rosterMara ? fm.owner === rosterMara : false,
          link,
          needs_you_source: p.ruleNeeds ? "rule" : llm?.defaulted ? "llm_default" : "llm",
          last_activity_iso: fm.last_msg_iso || null,
        };
        if (digestState.items[id].status === "cleared_inferred") {
          digestState.items[id].status = "open";
          digestState.items[id].sweeps_shown = 0; // resurrected — renders 🆕 again
          digestState.items[id].resurrected = true;
        }
      }
    } else {
      movement.push({
        label: fm.mirror === false ? `1:1 thread activity (${fm.channel_name})` : `#${fm.channel_name}: ${String(fm.subject || "").slice(0, 80)}`,
        link,
        source: "slack",
      });
    }
  }

  // Email lane: red nudges are Needs-You; yellow/blue surface as Movement.
  for (const n of nudges) {
    const id = itemIdFor("email", n.thread_id);
    if (n.tier === "red") {
      const existing = digestState.items[id];
      digestState.items[id] = {
        ...(existing || { first_seen_sweep: sweepNo, sweeps_shown: 0, status: "open" }),
        source: "email",
        note_path: n.note_path || null,
        summary: String(n.subject || "").slice(0, 120),
        lane: null,
        channel_name: null,
        mirror: true,
        mara_owned: false,
        link: gmailLink(n.thread_id),
        needs_you_source: "rule",
        last_activity_iso: n.last_msg_iso || null,
      };
      if (digestState.items[id].status === "cleared_inferred") {
        digestState.items[id].status = "open";
        digestState.items[id].sweeps_shown = 0; // resurrected — renders 🆕 again
        digestState.items[id].resurrected = true;
      }
    } else {
      movement.push({ label: `email: ${String(n.subject || "").slice(0, 80)} (${n.tier})`, link: gmailLink(n.thread_id), source: "email" });
    }
  }

  // Inferred done (spec §4.1): auto-clear ONLY when <your-name>'s reply is the LATEST
  // message at sweep time — "what's this about?" followed by a client reply is NOT
  // done, and resurrection above corrects any inference the client later disproves.
  // Reaction beats inference: phase2c ran first, so explicit ✅/🚫 already left "open".
  const redEmailIds = new Set(nudges.filter((n) => n.tier === "red").map((n) => itemIdFor("email", n.thread_id)));
  for (const [id, it] of Object.entries(digestState.items)) {
    if (it.status !== "open") continue;
    if (it.source === "slack" && it.note_path) {
      try {
        const fm = matter(await fs.readFile(path.join(dir, path.basename(it.note_path)), "utf8")).data || {};
        if (fm.last_from === "me") {
          it.status = "cleared_inferred";
          it.resolved_sweep = sweepNo;
          it.resolved_iso = nowRef;
        }
      } catch { /* note unreadable — leave open (recall bias) */ }
    } else if (it.source === "email" && !redEmailIds.has(id)) {
      // The aging engine no longer flags this thread red → <your-name>'s reply (or the
      // reply-match downgrade) covered it. Inferred, so resurrection applies if the
      // red comes back.
      it.status = "cleared_inferred";
      it.resolved_sweep = sweepNo;
      it.resolved_iso = nowRef;
    }
  }

  const needsYou = Object.entries(digestState.items)
    .filter(([, it]) => it.status === "open")
    .map(([id, it]) => ({ id, ...it }));
  // Sort precedence (spec §4): priority tier first, then age within tier, then recency.
  needsYou.sort((a, b) => {
    const p = (isPriority(b) ? 1 : 0) - (isPriority(a) ? 1 : 0);
    if (p) return p;
    const age = (b.sweeps_shown || 0) - (a.sweeps_shown || 0);
    if (age) return age;
    return String(b.last_activity_iso || "").localeCompare(String(a.last_activity_iso || ""));
  });
  return { needsYou, movement, sweepNo };
}

// ── render ────────────────────────────────────────────────────────────────────
export function renderChildLine(item) {
  const pri = isPriority(item) ? "⚠️ " : "";
  const lane = item.lane ? `${LANE_EMOJI[item.lane] || ""} ` : "";
  // 👀 in-progress replaces the age escalation — <your-name>'s on it, no nagging.
  const age = item.in_progress ? "👀" : ageMark((item.sweeps_shown || 0) + 1);
  // mirror:false (#<your-username>-<example-client>) → count + lane + permalink ONLY, zero quoted text (spec §4).
  const text = item.mirror === false || item.summary == null
    ? `1:1 thread needs you (${item.channel_name})`
    : String(item.summary).replace(/</g, "&lt;"); // neuter mrkdwn specials (<!channel> etc.)
  const bolded = isPriority(item) ? `*${text}*` : text;
  const link = item.link ? ` — <${item.link}|open>` : "";
  return `${pri}${lane}${age} ${bolded}${link}`;
}

export function closingLine(model) {
  const n = model.needsYou.length;
  const laneCounts = {};
  for (const it of model.needsYou) if (it.lane) laneCounts[it.lane] = (laneCounts[it.lane] || 0) + 1;
  const topLane = Object.entries(laneCounts).sort((a, b) => b[1] - a[1])[0];
  const aged = model.needsYou.filter((it) => (it.sweeps_shown || 0) >= 2).length;
  if (n === 0 && model.movement.length === 0) return "All quiet. Nothing needs you.";
  if (n === 0) return `Nothing needs you — ${model.movement.length} thing${model.movement.length === 1 ? "" : "s"} moved on their own.`;
  if (aged >= 2) return `${aged} of these have been waiting on you a while.`;
  if (topLane && topLane[1] === n) return `${n === 1 ? "One thing needs" : `${n} things need`} you — all ${topLane[0]}.`;
  return `${n === 1 ? "One thing needs" : `${n} things need`} you today.`;
}

const CAP_ITEMS = 10; // per section (Block Kit budget, spec §4)

export function renderAnchor(model, { slot, dateLabel, gapNote, cleared, inferredCleared, filedCount, briefPath }) {
  const lines = [];
  lines.push(`*${slot} Sweep · ${dateLabel}*${gapNote ? ` _(${gapNote})_` : ""}`);
  // "N handled — k inferred": N is the TOTAL incl. inferred (spec §4).
  const clearedTotal = cleared + (inferredCleared || 0);
  if (clearedTotal > 0) lines.push(`Cleared: ${clearedTotal} handled since last sweep${inferredCleared ? ` — ${inferredCleared} inferred` : ""}`);
  if (model.needsYou.length) {
    lines.push(`*Needs You (${model.needsYou.length})* — items follow in this thread; ✅ done · 🚫 dismiss on each`);
  }
  if (model.movement.length) {
    const shown = model.movement.slice(0, CAP_ITEMS);
    lines.push("*Movement*");
    for (const m of shown) lines.push(`• ${m.link ? `<${m.link}|${m.label}>` : m.label}`);
    if (model.movement.length > shown.length) lines.push(`• +${model.movement.length - shown.length} more → brief`);
  }
  lines.push(`Filed: ${filedCount} note${filedCount === 1 ? "" : "s"}${briefPath ? ` · brief: ${path.basename(briefPath)}` : ""}`);
  lines.push(`_${closingLine(model)}_`);
  return lines.join("\n");
}

// ── digest post (with digest-pending idempotency, spec §3 step 7) ─────────────
/**
 * ctx: { gutsy, scout, gutsyBotId, teamUrl, phase2b, nudges, cc, digestState,
 *        filedCount, briefPath, dryRun, now }
 * Returns { posted, window_id, anchor_ts, reason }.
 * Caller saves digestState AFTER this returns (both on post and on footer/skip).
 */
export async function postDigest(workTuple, ctx) {
  const slackCfg = workTuple.slack;
  const st = ctx.digestState;
  const nowDate = ctx.now ? new Date(ctx.now) : new Date();
  const slot = slotFor(nowDate);
  const windowId = windowIdFor(nowDate);
  const dateLabel = nowDate.toDateString().slice(0, 10); // "Wed Jul 02"
  const cc = slackCfg.command_center;

  // Model
  const model = await updateLedger(workTuple, st, {
    phase2b: ctx.phase2b,
    nudges: ctx.nudges || [],
    teamUrl: ctx.teamUrl,
    now: ctx.now,
    classify: ctx.classify || null,
  });
  const clearedNow = (ctx.cc?.cleared || []).length + (ctx.cc?.dismissed || []).length;
  const inferredCleared = Object.values(st.items).filter((i) => i.status === "cleared_inferred" && i.resolved_sweep === model.sweepNo).length;

  // ── Acknowledgment floor (spec §4.2) — fires EVERY sweep, independent of the
  // cadence gate: one batched, timestamp-anchored reply. "Logged" is already true
  // (phase2c appended the text to the day's brief before this runs).
  const ccReplies = ctx.cc?.replies || [];
  if (ccReplies.length && !ctx.dryRun && ctx.gutsy) {
    try {
      const times = ccReplies.map((r) => {
        const d = new Date(r.iso);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
      });
      const ackText =
        ccReplies.length === 1
          ? `Caught your ${times[0]} reply on this sweep — logged to the vault. I can't act on it yet; that's coming.`
          : `Caught ${ccReplies.length} replies since last sweep (${times.join(", ")}) — all logged to the vault. I can't act on them yet; that's coming.`;
      await ctx.gutsy.postMessage(cc, { text: ackText, thread_ts: ccReplies[0].anchor_ts });
    } catch (err) {
      await log("warn", `acknowledgment post failed: ${err.message}`);
    }
  }

  // ❤️-save confirmations: one threaded reply under each hearted child (also
  // cadence-independent — a save deserves its receipt even on a quiet turn).
  if (!ctx.dryRun && ctx.gutsy) {
    for (const s of ctx.cc?.saved || []) {
      try {
        await ctx.gutsy.postMessage(cc, { text: `🧠 Saved to the brain → \`${s.path}\``, thread_ts: s.child_message_ts });
      } catch (err) {
        await log("warn", `save confirmation post failed: ${err.message}`);
      }
    }
  }

  // ── Friday-evening weekly tally (spec §4.1) — once per Friday, cadence-independent ──
  if (isFridayEvening(nowDate) && st.last_tally_date !== windowId.slice(0, 10) && !ctx.dryRun && ctx.gutsy) {
    const t = computeWeeklyTally(st, nowDate.toISOString());
    const warn = t.zombieWarning
      ? " ⚠️ Under 30% of items changed state in 2 weeks — this digest may not be working for you; flag it and we redesign before the reply sprint."
      : "";
    try {
      await ctx.gutsy.postMessage(cc, {
        text:
          `📊 This week: ${t.cleared7} cleared, ${t.dismissed7} dismissed, ${t.open} open${t.stale ? ` (${t.stale} stale)` : ""}.${warn}` +
          (t.valueChecks.length ? "\n" + t.valueChecks.map((l) => `📋 ${l}`).join("\n") : ""),
      });
      st.last_tally_date = windowId.slice(0, 10);
    } catch (err) {
      await log("warn", `weekly tally post failed: ${err.message}`);
    }
  }

  // ── digest-pending recovery: a marker with no recorded anchor — INCLUDING the
  // same-window case (logon catch-up / manual re-run after a crash between
  // post-success and marker-clear). Counsel blocker B2: match the ANCHOR SIGNATURE,
  // not just "any top-level Gutsy message" (the weekly tally and error-voice stall
  // notices are also top-level), and clear the marker after adoption.
  const ANCHOR_SIG = /^\*(Early|Morning|Midday|Evening) Sweep · /;
  if (st.digest_pending) {
    const pend = st.digest_pending;
    if (st.anchors[pend.window_id]?.anchor_ts) {
      st.digest_pending = null; // anchor already recorded — stale marker
    } else {
      try {
        const pendingTs = String(new Date(pend.created_iso).getTime() / 1000);
        const msgs = ctx.scout ? await ctx.scout.historySince(cc, pendingTs) : [];
        const gutsyAnchor = msgs.find(
          (m) => m.bot_id === ctx.gutsyBotId && !m.thread_ts && ANCHOR_SIG.test(m.text || ""),
        );
        if (gutsyAnchor) {
          st.anchors[pend.window_id] = { anchor_ts: gutsyAnchor.ts, posted_iso: new Date().toISOString(), adopted: true };
          st.digest_pending = null;
          await log("info", `digest-post adopted orphan anchor for ${pend.window_id} (crash between post and marker-clear)`);
        }
      } catch (err) {
        await log("warn", `digest-post pending-recovery check failed: ${err.message}`);
      }
    }
  }
  const missedTurn = st.digest_pending && st.digest_pending.window_id !== windowId
    ? st.digest_pending.window_id
    : null;

  // ── cadence gate (spec §4): morning always; other slots on signal ────────────
  // Pre-06:00 runs live in their own "Early" window (slotFor) — even a SIGNAL-bearing
  // 00:30 logon catch-up posts as Early and leaves the Morning window for the real
  // 08:00 sweep (counsel note: claim-gating, not just quiet-skip-gating).
  const signal = model.needsYou.length > 0 || model.movement.length >= slackCfg.movement_threshold;
  if (slot !== "Morning" && !signal && !missedTurn) {
    // Silent turn → footer on today's anchor (turn accounting).
    const todayMorning = st.anchors[`${windowId.slice(0, 10)}-morning`];
    if (todayMorning?.anchor_ts && !ctx.dryRun && ctx.gutsy) {
      try {
        const foot = `${slot}: quiet · ${ctx.filedCount || 0} filed${clearedNow ? ` · ${clearedNow} cleared` : ""}`;
        todayMorning.footers = [...(todayMorning.footers || []), foot];
        await ctx.gutsy.updateMessage(cc, todayMorning.anchor_ts, {
          text: `${todayMorning.base_text || ""}\n_${todayMorning.footers.join(" · ")}_`,
        });
      } catch (err) {
        await log("warn", `digest-post footer update failed: ${err.message}`);
      }
    }
    return { posted: false, window_id: windowId, anchor_ts: null, reason: "quiet_conditional_turn" };
  }
  if (st.anchors[windowId]?.anchor_ts) {
    return { posted: false, window_id: windowId, anchor_ts: st.anchors[windowId].anchor_ts, reason: "already_posted" };
  }

  const gapNote = missedTurn ? `covers ${missedTurn.split("-").pop()} + ${slot.toLowerCase()} — earlier post failed` : null;
  const anchorText = renderAnchor(model, {
    slot,
    dateLabel,
    gapNote,
    cleared: clearedNow,
    inferredCleared,
    filedCount: ctx.filedCount || 0,
    briefPath: ctx.briefPath,
  });

  if (ctx.dryRun) {
    await log("info", `digest-post DRY-RUN window=${windowId} would post anchor + ${Math.min(model.needsYou.length, CAP_ITEMS)} children`);
    return { posted: false, window_id: windowId, anchor_ts: null, reason: "dry_run", preview: anchorText, model };
  }
  if (!ctx.gutsy) {
    return { posted: false, window_id: windowId, anchor_ts: null, reason: "no_gutsy_client" };
  }

  // Marker BEFORE posting (spec §3 step 7). Caller persists state promptly after return;
  // we also persist via the caller on both success and failure paths.
  st.digest_pending = { window_id: windowId, created_iso: new Date().toISOString() };
  if (ctx.persistState) await ctx.persistState();

  let anchor;
  try {
    anchor = await ctx.gutsy.postMessage(cc, { text: anchorText });
  } catch (err) {
    // Post failure never blocks/rolls back the sweep — marker stays, retried next sweep
    // with a gap-honest header; the miss surfaces in the heartbeat (spec §3 step 7).
    await log("error", `digest-post FAILED window=${windowId}: ${err.message} — digest-pending marker held`);
    return { posted: false, window_id: windowId, anchor_ts: null, reason: "post_failed", error: err.message };
  }

  // sweep_gap metric (PHANTOM): the real-world cause of missed reactions is multi-day
  // cadence gaps (observed 68h Fri→Mon). Surface the gap from the previous anchor.
  const prevPosted = Object.values(st.anchors || {})
    .map((a) => a.posted_iso)
    .filter(Boolean)
    .sort()
    .slice(-2, -1)[0];
  if (prevPosted) {
    const gapH = Math.round((Date.now() - new Date(prevPosted).getTime()) / 3600_000);
    await log("info", `metric=sweep_gap client=${workTuple.client_slug} hours=${gapH}`);
  }

  st.anchors[windowId] = { anchor_ts: anchor.ts, posted_iso: new Date().toISOString(), base_text: anchorText, footers: [] };
  if (missedTurn) delete st.digest_pending; // covered by the gap-honest header
  st.digest_pending = null;

  // Per-item children (reaction anchors). Overflow child carries no reactions.
  const shown = model.needsYou.slice(0, CAP_ITEMS);
  for (const item of shown) {
    try {
      const child = await ctx.gutsy.postMessage(cc, { text: renderChildLine(item), thread_ts: anchor.ts });
      const it = st.items[item.id];
      // Reaction-history (NSA 2026-07-06): a ✅ often lands on a PRIOR sweep's child
      // (sweeps can gap 68h+). Keep the last 3 superseded children — by COUNT, no time
      // gate (a 48h cutoff would re-lose weekend reactions) — so phase2c can honor
      // reactions on any of them. Pruned with the item by pruneResolvedItems.
      if (it.child_message_ts) {
        it.child_ts_history = [
          ...(it.child_ts_history || []),
          { ts: it.child_message_ts, posted_iso: it.child_posted_iso || null },
        ].slice(-3);
      }
      it.child_message_ts = child.ts;
      it.child_posted_iso = new Date().toISOString();
      it.sweeps_shown = (it.sweeps_shown || 0) + 1;
    } catch (err) {
      await log("warn", `digest-post child failed item=${item.id}: ${err.message}`);
    }
  }
  if (model.needsYou.length > shown.length) {
    await ctx.gutsy
      .postMessage(cc, { text: `+${model.needsYou.length - shown.length} more → full brief${ctx.briefPath ? `: ${path.basename(ctx.briefPath)}` : ""}`, thread_ts: anchor.ts })
      .catch(() => {});
  }

  await log("info", `digest-post posted window=${windowId} anchor=${anchor.ts} children=${shown.length} needs_you=${model.needsYou.length}`);
  return { posted: true, window_id: windowId, anchor_ts: anchor.ts, reason: "posted", model };
}

/**
 * Weekly zombie-check tally (spec §4.1): computed from the ledger, posted Friday
 * evenings. If after ≥2 weeks of history <30% of Needs-You items show state change,
 * the digest format/cadence is presumed wrong — redesign before Sprint 2 ships.
 */
export function computeWeeklyTally(digestState, nowIso) {
  const now = new Date(nowIso).getTime();
  const week = 7 * 86400_000;
  const twoWeeks = 14 * 86400_000;
  let cleared7 = 0, dismissed7 = 0, open = 0, stale = 0;
  let active14 = 0, changed14 = 0;
  for (const it of Object.values(digestState.items || {})) {
    const resolvedAt = it.resolved_iso ? new Date(it.resolved_iso).getTime() : null;
    const firstSeen = it.first_seen_iso ? new Date(it.first_seen_iso).getTime() : null;
    if (it.status === "open") {
      open++;
      if ((it.sweeps_shown || 0) >= 9) stale++; // ~3 days of renders
    }
    if (resolvedAt && now - resolvedAt <= week) {
      if (it.status === "dismissed") dismissed7++;
      else cleared7++;
    }
    // Zombie metric window: items alive at any point in the last 2 weeks.
    const aliveRecently = (firstSeen && now - firstSeen <= twoWeeks) || (resolvedAt && now - resolvedAt <= twoWeeks) || it.status === "open";
    if (aliveRecently) {
      active14++;
      if ((resolvedAt && now - resolvedAt <= twoWeeks) || it.resurrected) changed14++;
    }
  }
  const enoughHistory = (digestState.sweep_counter || 0) >= 28;
  const zombieWarning = enoughHistory && active14 >= 5 && changed14 / active14 < 0.3;
  // Week-4 keep/change/kill value checks for live team-digest recipients (spec §2.6).
  const valueChecks = [];
  for (const led of Object.values(digestState.team_digests || {})) {
    if ((led.live_windows || 0) >= 4 && !led.value_checked) {
      valueChecks.push(`Ask ${led.name || "the recipient"}: keep, change, or kill the weekly? (week-4 check)`);
    }
  }
  return { cleared7, dismissed7, open, stale, active14, changed14, zombieWarning, valueChecks };
}

function isFridayEvening(nowDate) {
  return nowDate.getDay() === 5 && slotFor(nowDate) === "Evening";
}

/** Error voice (spec §6): the bot accounts for a failed turn when Slack itself is reachable. */
export async function errorVoicePost(workTuple, gutsy, { slot, source, detail }) {
  if (!gutsy || !workTuple.slack) return false;
  try {
    await gutsy.postMessage(workTuple.slack.command_center, {
      text: `⚠️ ${slot} Sweep stalled — ${source} fetch failed. Nothing lost; cursors held. Retrying next sweep.${detail ? `\n_${detail}_` : ""}`,
    });
    return true;
  } catch (err) {
    await log("warn", `error-voice post failed: ${err.message}`);
    return false;
  }
}

// ── capability card (spec §2) — one-shot CLI; <your-name> pins manually ───────────
export const CAPABILITY_CARD = [
  "*Hi — I'm Gutsy.* 🧭 Your example-client sentinel.",
  "",
  "• I sweep Gmail + the team's Slack 3×/day, file everything to the vault, and flag what needs you.",
  "• On each *Needs You* item (they arrive as replies under my digest): ✅ = complete/retire (anyone's checkmark counts) · 👀 = I'm on it · ❤️ = save the thread to the brain.",
  "• I read this channel at sweep time, so replies get answered on the next sweep — not instantly.",
  "• My quiet partner, *example-client Capture*, reads this channel so I can catch your ✅/🚫.",
  "• I can't act on replies yet — reply drafting is coming.",
  "",
  "_Legend: lanes 🟡finance 🟢people 🔵ai 🟣funnel ⚪cx · age 🆕 new ⏳ 2 sweeps 🔴 3+ · 👀 in progress · ⚠️ priority_",
].join("\n");

async function capabilityCardCli() {
  await loadEnv();
  const { gutsyClient, assertApp, GUTSY_SCOPES } = await import("./slack.js");
  const { runPhase1 } = await import("./phase1.js");
  const slug = process.argv[process.argv.indexOf("--client") + 1] || "<example-client>";
  const wt = await runPhase1({ clientSlug: slug, sinceIso: null, now: new Date().toISOString() });
  if (!wt.slack) {
    console.error(`client ${slug} has no slack: block — nothing to post to`);
    process.exit(2);
  }
  const gutsy = gutsyClient();
  await assertApp(gutsy, GUTSY_SCOPES, "gutsy");
  const res = await gutsy.postMessage(wt.slack.command_center, { text: CAPABILITY_CARD });
  console.log(`✓ Capability card posted (ts ${res.ts}). Pin it manually: hover → ⋮ → Pin to channel.`);
}

if (process.argv[1] && process.argv[1].endsWith("digest-post.js")) {
  if (process.argv.includes("--post-capability-card")) {
    capabilityCardCli().catch((err) => {
      console.error("fatal:", err.message);
      process.exit(1);
    });
  } else {
    console.log("usage: node digest-post.js --post-capability-card [--client <slug>]");
    process.exit(2);
  }
}
