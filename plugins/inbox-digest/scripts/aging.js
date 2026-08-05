// Phase 2.5 — Reply-status aging + nudges.
//
// Owns the per-client status projection `<inbox>/.thread-status.jsonl` (single writer
// per run). Reads it, seeds missing rows from existing note frontmatter (silent migration),
// applies this run's status updates monotonically, ages every tracked thread against the
// client's business-hours SLA, and returns the nudges the brief should surface.
//
// Clock rule (CIPHER-F11): aging time is ALWAYS server-observed (`last_msg_iso`, which
// phase2 derives from Gmail's internalDate / filed time) — never the spoofable `Date:`
// header (`date_latest`).

import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  readLedgerMap,
  writeLedger,
  sanitizeLedgerSubject,
  log,
} from "./util.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const AUTO_ARCHIVE_DAYS = 14; // calendar days of silence on awaiting_them → resolved
const FYI_EXPIRE_DAYS = 3; // forward/calendar (Received-FYI) roll-up window before auto-clear

// Ledger schema version. v1 (implicit/absent) had no category/resolved_reason/proposed_resolution.
// v2 adds them as nullable fields; migrateLedgerRow backfills old rows at read time.
// (FYI expiry is computed from last_msg_iso + calendar days — no stamped expiry field.)
export const LEDGER_SCHEMA_V = 2;

/**
 * Read-time migration (CONDUIT/Hogg contract): coerce a ledger row to schema v2 by
 * adding schema_v + nullable v2 fields, WITHOUT touching last_msg_iso or clobbering any
 * already-set value. Pure + idempotent; never regresses state.
 */
export function migrateLedgerRow(row) {
  return {
    ...row,
    schema_v: LEDGER_SCHEMA_V,
    category: row.category ?? null,
    resolved_reason: row.resolved_reason ?? null,
    proposed_resolution: row.proposed_resolution ?? null,
  };
}

// ----- Time / business-hours --------------------------------------------

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Day-of-week (0=Sun..6=Sat) for an instant, evaluated in the given IANA timezone. */
function weekdayInTz(ms, timeZone) {
  try {
    const wd = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(new Date(ms));
    return WEEKDAY_INDEX[wd] ?? new Date(ms).getUTCDay();
  } catch {
    return new Date(ms).getUTCDay();
  }
}

/**
 * Elapsed BUSINESS hours between two ISO instants, excluding Saturdays/Sundays in
 * `timeZone`. Walks in 1-hour steps — ranges here are days, not years, so this is cheap.
 * Holidays are intentionally not handled in v1.
 */
export function businessHoursBetween(startIso, endIso, timeZone) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const STEP = 60 * 60 * 1000;
  let businessMs = 0;
  for (let t = start; t < end; t += STEP) {
    const slice = Math.min(STEP, end - t);
    const dow = weekdayInTz(t, timeZone);
    if (dow !== 0 && dow !== 6) businessMs += slice;
  }
  return businessMs / STEP;
}

/** Calendar days between two ISO instants (used only for the 14-day auto-archive). */
function calendarDaysBetween(startIso, endIso) {
  const a = new Date(startIso).getTime();
  const b = new Date(endIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return (b - a) / DAY_MS;
}

// ----- Self-commitment detection -----------------------------------------

// Cut quoted history so a commitment in a QUOTED prior message isn't mis-attributed
// to <your-name>. Handles plain `>` quotes AND HTML-collapsed quotes (Gmail/Outlook
// attribution lines survive htmlToText as flush text — split on them).
export function stripQuotedHistory(body) {
  const lines = String(body || "").split(/\r?\n/);
  const out = [];
  for (const line of lines) {
    if (/^\s*>/.test(line)) continue;
    if (/^\s*On\b.+\bwrote:\s*$/i.test(line)) break;
    if (/^\s*-{2,}\s*Original Message\s*-{2,}/i.test(line)) break;
    if (/^_{5,}\s*$/.test(line)) break;
    if (/^\s*From:.*\bSent:/i.test(line)) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

// ----- Ack (closing acknowledgment) detection -----------------------------
//
// Reply-classifier v2.1: a short affirmative close ("Yes!", "thanks", "sounds good")
// is an acknowledgment, not a request — category "ack", routed to the fyi tier like
// forward/calendar (never red). NSA-hardened rules (2026-07-06 four-agent review):
//   - test runs on stripQuotedHistory + stripSignature output, NEVER the raw body
//     (a Gmail "Yes!" ships with the full quoted thread + signature — 600+ chars);
//   - requires an affirmative token — shortness alone must NOT demote ("No, that
//     won't work for me" stays ask; recall bias: a missed ask is the costliest error);
//   - reuses REQUEST_RE-style negation: any question/request marker keeps it ask.

// Cut a trailing signature block: a line of 2+ dashes (also glued inline, "Yes!---")
// or a mobile sig marker. Everything from the delimiter on is dropped.
export function stripSignature(text) {
  const s = String(text || "");
  const m = s.search(/(^|\n)[^\n]{0,80}?-{2,}\s*(\n|$)|(^|\n)\s*(sent from my|get outlook for)\b/i);
  if (m < 0) return s.trim();
  // The match may start at the newline BEFORE the delimiter line — step past it so
  // `line` is the delimiter line itself, not the empty string.
  const lineStart = s[m] === "\n" ? m + 1 : m;
  const head = s.slice(0, lineStart);
  const line = s.slice(lineStart).split(/\n/)[0];
  // Keep any content on the delimiter line that precedes an inline dash run ("Yes!---").
  const inline = line.match(/^(.*?)-{2,}\s*$/);
  return (head + (inline ? inline[1] : "")).trim();
}

const ACK_TOKEN_RE =
  /\b(yes|yep|yeah|yup|sure|thanks|thank you|ty|sounds good|got it|will do|perfect|great|awesome|ok|okay|works|confirmed|done|noted)\b|👍|🙏|✅/i;
const ACK_REQUEST_RE =
  /\?|\b(please|can you|could you|would you|need (you|to|this)|let me know|thoughts|review|approve|confirm this|sign|asap|urgent)\b/i;

/** True when a stripped inbound body reads as a closing acknowledgment. PURE. */
export function isAckText(body) {
  const stripped = stripSignature(stripQuotedHistory(body));
  return (
    stripped.length > 0 &&
    stripped.length < 140 &&
    ACK_TOKEN_RE.test(stripped) &&
    !ACK_REQUEST_RE.test(stripped)
  );
}

const COMMIT_RE =
  /\b(i'?ll\b|i will\b|let me (send|get|grab|pull)|will (send|get|follow up|circle back|revert)|get (you|that|it)\b.*\b(by|over|to you)|send (you|it|that|over)\b|by (mon|tues?|wed(nes)?|thu(rs)?|fri|sat(ur)?|sun)(day)?\b|by (tomorrow|eod|eow|end of (the )?(day|week))|next week\b|by next\b)/i;
const NEG_RE = /\b(once you|if you|after you|unless|until you|don'?t|won'?t|can'?t|no need)\b/i;

/** Detect a forward self-commitment in the latest outbound body. Returns {matched, sentence}. */
export function detectCommitment(body) {
  const clean = stripQuotedHistory(body);
  const sentences = clean.split(/(?<=[.!?])\s+|\n+/);
  for (const s of sentences) {
    if (COMMIT_RE.test(s) && !NEG_RE.test(s)) {
      return { matched: true, sentence: s.trim().replace(/\s+/g, " ").slice(0, 200) };
    }
  }
  return { matched: false, sentence: null };
}

// ----- Deep link ----------------------------------------------------------

/** Email address from a note message-block header ("<iso> — Name <addr> → to"). */
function extractHeaderEmail(header) {
  const m = String(header || "").match(/<([^>]+)>/);
  return m ? m[1].toLowerCase().trim() : "";
}

export function gmailDeepLink(authedEmail, threadId) {
  const who = authedEmail ? `?authuser=${encodeURIComponent(authedEmail)}` : "";
  return `https://mail.google.com/mail/${who}#all/${threadId}`;
}

// ----- Core: pure nudge computation ---------------------------------------

/**
 * Pure function: given the (already seeded + updated) ledger map, the run clock,
 * the client's SLA, timezone, and the messages touched THIS run, compute the nudges.
 * Does NOT do file IO and does NOT mutate ledger rows' nudge bookkeeping (the caller
 * persists last_nudge_tier after deciding canWrite). Returns nudge objects with the
 * tier each thread currently sits at, plus `isNew` (tier changed since last emit).
 *
 * Tiers: red (hard, reply overdue) · yellow (heads-up / "you promised") · blue (chase
 * them / courtesy). last_from semantics: "them"=awaiting_you, "me"=awaiting_them.
 */
export function computeNudges({ ledger, now, replySla, timezone, msgsByThread, meSet, hardTier, authedEmail }) {
  const headsUp = replySla.heads_up_hours == null ? null : replySla.heads_up_hours;
  const replyDue = replySla.reply_due_hours;
  const followup = replySla.followup_hours;
  const nudges = [];

  for (const row of ledger.values()) {
    if (row.resolved || row.status === "muted" || row.seeded) continue;
    if (!row.last_msg_iso) continue;

    const bizAge = businessHoursBetween(row.last_msg_iso, now, timezone);
    const msgs = (msgsByThread && msgsByThread[row.thread_id]) || null;

    let tier = null; // red | yellow | blue
    let kind = null; // awaiting_you | heads_up | promised | chase | unknown
    let inferred = false;
    let commitmentSentence = null;

    if (row.last_from === "them" && (row.category === "forward" || row.category === "calendar" || row.category === "ack")) {
      // Reply-classifier v2: a bare forward / calendar item is received, not a request.
      // v2.1 adds "ack" (closing "Yes!"/"thanks") to the same lane. It demotes to the
      // 📮→📥 Received(FYI) tier (never red) and is auto-cleared after FYI_EXPIRE_DAYS
      // by expireFyiRows. "ask" never reaches this branch. Precedence note: an "ack"
      // row never becomes a red awaiting_you candidate, so it also naturally supersedes
      // any stale AI `proposed_resolution` (reply-match only selects reds).
      tier = "fyi";
      kind = "received";
    } else if (row.last_from === "them") {
      // Ball is in <your-name>'s court.
      // Trivial courtesy filter (v1): a lone, short, question-free inbound is likely an
      // FYI/"thanks" — demote to blue so it can't consume the hard-tier cap slots.
      let courtesy = false;
      if (msgs && msgs.length === 1) {
        const body = msgs[0].plaintext_body || "";
        if (body.length < 140 && !body.includes("?")) courtesy = true;
      }
      if (courtesy) {
        if (bizAge >= replyDue) { tier = "blue"; kind = "courtesy"; }
      } else if (bizAge >= replyDue) {
        tier = "red"; kind = "awaiting_you";
      } else if (headsUp != null && bizAge >= headsUp) {
        tier = "yellow"; kind = "heads_up";
      }
    } else if (row.last_from === "me") {
      // <your-name> spoke last. Check for a self-commitment in his latest outbound.
      let commit = { matched: false, sentence: null };
      if (msgs) {
        const myMsgs = msgs.filter((m) => meSet.has((m.sender_email || "").toLowerCase()));
        const lastMine = myMsgs[myMsgs.length - 1];
        if (lastMine) commit = detectCommitment(lastMine.plaintext_body || "");
      }
      const promiseThreshold = headsUp != null ? headsUp : replyDue;
      if (commit.matched && bizAge >= promiseThreshold) {
        tier = "yellow"; kind = "promised"; inferred = true; commitmentSentence = commit.sentence;
      } else if (bizAge >= followup) {
        tier = "blue"; kind = "chase";
      }
    } else {
      // unknown identity sent the latest message — surface, never guess (ARCH-F1).
      const threshold = headsUp != null ? headsUp : replyDue;
      if (bizAge >= threshold) { tier = "yellow"; kind = "unknown"; }
    }

    if (!tier) continue;

    const isNew = row.last_nudge_tier !== tier;
    nudges.push({
      thread_id: row.thread_id,
      subject: row.subject,
      note_path: row.note_path,
      tier,
      kind,
      inferred,
      commitment_sentence: commitmentSentence,
      age_hours: Math.round(bizAge),
      last_from: row.last_from,
      last_msg_iso: row.last_msg_iso,
      deep_link: gmailDeepLink(authedEmail, row.thread_id),
      hard_tier: !!hardTier,
      is_new: isNew,
    });
  }

  // Rank for display: red → yellow → blue, hard-tier first within a tier, then oldest.
  const tierRank = { red: 0, yellow: 1, blue: 2, fyi: 3 };
  nudges.sort((a, b) => {
    if (tierRank[a.tier] !== tierRank[b.tier]) return tierRank[a.tier] - tierRank[b.tier];
    if (a.hard_tier !== b.hard_tier) return a.hard_tier ? -1 : 1;
    return b.age_hours - a.age_hours;
  });
  return nudges;
}

// ----- Migration / reconciliation -----------------------------------------

/**
 * Seed ledger rows from existing inbox notes that have no ledger entry (first-run
 * migration AND crash-between-writes heal). Seeded rows are marked `seeded:true` so they
 * do NOT nudge based on pre-existing age — "silent seed forward" (<your-name>'s choice). A
 * later status update (new activity) clears the flag and the thread ages normally.
 * Reads server-time `last_msg_iso` from frontmatter (never the spoofable header date).
 */
async function seedFromNotes(ledger, inboxDir, now) {
  let files;
  try {
    files = await fs.readdir(inboxDir);
  } catch (err) {
    if (err.code === "ENOENT") return 0;
    throw err;
  }
  let seeded = 0;
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    const abs = path.join(inboxDir, f);
    let fm;
    try {
      const raw = await fs.readFile(abs, "utf8");
      fm = matter(raw).data || {};
    } catch {
      continue;
    }
    if (!fm.thread_id || fm.type !== "email-thread") continue;
    if (ledger.has(fm.thread_id)) continue;
    ledger.set(fm.thread_id, {
      thread_id: fm.thread_id,
      subject: sanitizeLedgerSubject(fm.subject),
      note_path: `inbox/${f}`,
      last_from: fm.last_from || "unknown",
      last_sender_email: fm.last_sender_email || "",
      last_msg_iso: fm.last_msg_iso || null,
      status: fm.reply_status === "muted" ? "muted" : "active",
      resolved: false,
      seeded: true,
      last_nudge_tier: null,
      last_nudge_iso: now,
      schema_v: LEDGER_SCHEMA_V,
      category: fm.category ?? null,
      resolved_reason: null,
      proposed_resolution: null,
    });
    seeded++;
  }
  return seeded;
}

/**
 * Apply phase2's per-thread status updates to the ledger with the monotonic invariant.
 * Returns the number of rows RE-ARMED this run (a resolved/expired thread brought back
 * to active by a strictly-newer inbound) — the reply-health "rearmed" signal.
 */
export function applyUpdates(ledger, statusUpdates) {
  let rearmed = 0;
  let falseSuggestions = 0;
  for (const u of statusUpdates || []) {
    if (!u || !u.thread_id) continue;
    const existing = ledger.get(u.thread_id);
    if (!existing) {
      ledger.set(u.thread_id, {
        thread_id: u.thread_id,
        subject: u.subject,
        note_path: u.note_path,
        last_from: u.last_from,
        last_sender_email: u.last_sender_email,
        last_msg_iso: u.last_msg_iso,
        status: "active",
        resolved: false,
        seeded: false,
        last_nudge_tier: null,
        last_nudge_iso: null,
        schema_v: LEDGER_SCHEMA_V,
        // Prior-state gate (CIPHER H1): a brand-new thread has no "<your-name> spoke last"
        // history, so a cold short inbound is NEVER demoted to ack — coerce to ask.
        category: u.category === "ack" ? "ask" : (u.category ?? null),
        resolved_reason: null,
        proposed_resolution: null,
      });
      continue;
    }
    // Activity arrived → no longer a silent-seeded row.
    existing.seeded = false;
    existing.subject = u.subject || existing.subject;
    existing.note_path = u.note_path || existing.note_path;
    // Monotonic: never regress last_msg_iso; flip last_from only on a strictly-newer msg.
    if (!existing.last_msg_iso || (u.last_msg_iso && u.last_msg_iso > existing.last_msg_iso)) {
      // Prior-state gate (CIPHER H1): "ack" only counts when the thread was <your-name>-driven
      // (he spoke last, or it was resolved) — a trailing "Yes!" closes HIS thread. A short
      // affirmative on a thread the client was already driving stays ask (never demoted).
      const was<your-name>Driven = existing.last_from === "me" || existing.resolved === true;
      const category = u.category === "ack" && !was<your-name>Driven ? "ask" : u.category;
      existing.last_msg_iso = u.last_msg_iso;
      existing.last_from = u.last_from;
      existing.last_sender_email = u.last_sender_email;
      existing.category = category ?? existing.category;
      // RE-ARM WINS OVER THE TIMER (Triple Threat AI Dev precedence rule): a strictly-newer
      // message refreshes last_msg_iso (so FYI expiry, computed from it, can't fire), clears
      // any prior resolution AND any stale AI "likely covered" suggestion, and un-resolves.
      existing.resolved_reason = null;
      // A new inbound on a thread the AI had suggested "likely covered" means the suggestion
      // was premature (it wasn't actually done) — count it as a false suggestion (precision).
      if (existing.proposed_resolution) falseSuggestions++;
      existing.proposed_resolution = null;
      if (existing.resolved) { existing.resolved = false; rearmed++; }
    }
  }
  return { rearmed, falseSuggestions };
}

/**
 * Per-run reply-health snapshot (PHANTOM observability). Pure: reads the ledger AS-IS,
 * before this run's last_nudge_tier overwrite, so `recovered` reflects the PREVIOUS tier.
 *   tracked   — active (non-resolved, non-muted, non-seeded) rows
 *   red / fyi — counts from this run's nudges
 *   expired_fyi / rearmed — passed in from aging
 *   recovered — rows that were 🔴 last run but are now handled (resolved OR you spoke last):
 *               the false-red / reply-recovered signal, tied to a real state change (not theater)
 */
export function summarizeReplyHealth(ledger, nudges, extra = {}) {
  const counts = {
    tracked: 0, red: 0, fyi: 0,
    expired_fyi: extra.expiredFyi || 0,
    rearmed: extra.rearmed || 0,
    false_suggestions: extra.falseSuggestions || 0,
    ack: extra.ackBackfilled || 0,
    recovered: 0,
  };
  for (const row of ledger.values()) {
    if (row.status === "muted" || row.seeded) continue;
    if (!row.resolved) counts.tracked++;
    if (row.last_nudge_tier === "red" && (row.resolved || row.last_from === "me")) counts.recovered++;
  }
  for (const n of nudges || []) {
    if (n.tier === "red") counts.red++;
    else if (n.tier === "fyi") counts.fyi++;
  }
  return counts;
}

/**
 * Auto-clear stale Received-FYI rows (forward/calendar awaiting-you) after FYI_EXPIRE_DAYS
 * calendar days. NOT silent: they surface in the brief's 📥 Received(FYI) section for the
 * window, then resolve with resolved_reason "expired_fyi" (counted per run). Re-arm wins —
 * applyUpdates runs FIRST and refreshes last_msg_iso on any newer inbound, so a re-armed
 * thread reads as recent here and is never expired. Mutates rows in place; returns count.
 * NEVER touches category "ask" — a real human request must never auto-expire.
 */
export function expireFyiRows(ledger, now) {
  let expired = 0;
  for (const row of ledger.values()) {
    if (row.resolved || row.status === "muted" || row.seeded) continue;
    if (row.last_from !== "them") continue;
    if (row.category !== "forward" && row.category !== "calendar" && row.category !== "ack") continue;
    if (row.last_msg_iso && calendarDaysBetween(row.last_msg_iso, now) >= FYI_EXPIRE_DAYS) {
      row.resolved = true;
      row.resolved_reason = "expired_fyi";
      expired++;
    }
  }
  return expired;
}

// ----- Orchestrator entry --------------------------------------------------

/**
 * Run aging for one client. `canWrite` gates the persistent side-effects (ledger write +
 * auto-archive) — compute always runs, but on a capped/errored scan we never mutate state.
 * Returns { nudges, archived, seeded }.
 */
export async function runAging(params) {
  const {
    client_dir,
    statusUpdates,
    msgsByThread,
    now,
    me_addresses,
    reply_sla,
    timezone,
    reply_hard_tier,
    authed_email,
    canWrite,
  } = params;

  const inboxDir = path.join(client_dir, "inbox");
  const ledgerPath = path.join(inboxDir, ".thread-status.jsonl");
  const meSet = new Set((me_addresses || []).map((a) => a.toLowerCase()));

  const ledger = await readLedgerMap(ledgerPath);
  // Read-time schema migration: backfill pre-v2 rows so downstream routing can rely on
  // category/resolved_reason/proposed_resolution existing (never regresses last_msg_iso).
  for (const [tid, row] of ledger) ledger.set(tid, migrateLedgerRow(row));
  const seeded = await seedFromNotes(ledger, inboxDir, now);
  const { rearmed, falseSuggestions } = applyUpdates(ledger, statusUpdates);

  // Auto-archive: awaiting_them quiet ≥14 calendar days → resolved (only when canWrite).
  // Plus Received-FYI expiry: forward/calendar awaiting-you ≥3 days → resolved (re-arm
  // already won in applyUpdates, which refreshed last_msg_iso on any newer inbound).
  let archived = 0;
  let expiredFyi = 0;
  if (canWrite) {
    for (const row of ledger.values()) {
      if (row.resolved || row.status === "muted" || row.seeded) continue;
      if (row.last_from === "me" && row.last_msg_iso && calendarDaysBetween(row.last_msg_iso, now) >= AUTO_ARCHIVE_DAYS) {
        row.resolved = true;
        row.resolved_reason = "auto_archived";
        archived++;
      }
    }
    expiredFyi = expireFyiRows(ledger, now);
  }

  let nudges = computeNudges({
    ledger,
    now,
    replySla: reply_sla,
    timezone,
    msgsByThread,
    meSet,
    hardTier: reply_hard_tier,
    authedEmail: authed_email,
  });

  // Respect manual mute set in a note's frontmatter AFTER seeding (bounded reads: only
  // threads that would actually nudge). reply_status is manual-only + enum-constrained.
  // Same bounded read doubles as the ACK BACKFILL (NSA review 2026-07-06): rows stuck
  // red from BEFORE the ack classifier existed have no newer inbound coming, so
  // applyUpdates can never re-classify them. For a would-be red awaiting-you nudge,
  // re-read the note's latest message block; if it's a client-authored closing ack
  // following a <your-name> message, persist category "ack" and drop the nudge (self-heals
  // stuck threads — no manual ledger poke). Read-only on the note; never touches
  // last_msg_iso.
  const kept = [];
  let ackBackfilled = 0;
  for (const n of nudges) {
    let muted = false;
    let ackDemoted = false;
    try {
      const abs = path.join(client_dir, n.note_path);
      const parsed = matter(await fs.readFile(abs, "utf8"));
      const fm = parsed.data || {};
      if (fm.reply_status === "muted") muted = true;
      if (!muted && n.tier === "red" && n.kind === "awaiting_you") {
        const blocks = String(parsed.content || "").split(/^## /m).filter((b) => b.trim());
        if (blocks.length >= 2) {
          const lastHeader = blocks[blocks.length - 1].split(/\n/)[0] || "";
          const prevHeader = blocks[blocks.length - 2].split(/\n/)[0] || "";
          const lastByThem = !meSet.has(extractHeaderEmail(lastHeader));
          const prevByMe = meSet.has(extractHeaderEmail(prevHeader));
          if (lastByThem && prevByMe) {
            // Body = the block minus its header line (same convention as gatherSentPool).
            const lastBlock = blocks[blocks.length - 1];
            const nl = lastBlock.indexOf("\n");
            const body = (nl >= 0 ? lastBlock.slice(nl + 1) : "").replace(/```text|```/g, "");
            if (isAckText(body)) {
              const row = ledger.get(n.thread_id);
              if (row) row.category = "ack";
              ackDemoted = true;
              ackBackfilled++;
              await log("info", `ack-backfill thread=${n.thread_id} demoted (would have been ${n.tier})`);
            }
          }
        }
      }
    } catch {
      /* note unreadable — keep the nudge */
    }
    if (muted) {
      const row = ledger.get(n.thread_id);
      if (row) row.status = "muted";
    } else if (!ackDemoted) {
      kept.push(n);
    }
  }
  nudges = kept;

  // Snapshot reply-health BEFORE overwriting last_nudge_tier — `recovered` must read the
  // PREVIOUS run's tier to detect a 🔴 that's now handled.
  const health = summarizeReplyHealth(ledger, nudges, { expiredFyi, rearmed, falseSuggestions, ackBackfilled });

  if (canWrite) {
    // Record the tier we surfaced so re-runs don't re-fire metrics on an unchanged tier.
    for (const n of nudges) {
      const row = ledger.get(n.thread_id);
      if (row) {
        row.last_nudge_tier = n.tier;
        row.last_nudge_iso = now;
      }
    }
    await writeLedger(ledgerPath, ledger);
  }

  await log(
    "info",
    `aging client_dir=${path.basename(client_dir)} seeded=${seeded} nudges=${nudges.length} archived=${archived} expired_fyi=${expiredFyi} canWrite=${canWrite}`,
  );
  return { nudges, archived, seeded, expiredFyi, health };
}
