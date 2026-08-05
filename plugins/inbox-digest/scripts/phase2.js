// Phase 2 — Fetch.
// search → eager read → group by threadId → dedup → write notes → download attachments.

import { promises as fs } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import matter from "gray-matter";
import os from "node:os";
import {
  log,
  slugifySubject,
  sanitizeAttachmentName,
  sanitizeBody,
  htmlEscape,
  atomicWrite,
  appendJsonl,
  readJsonl,
  nowIsoUtc,
  sanitizeLedgerSubject,
} from "./util.js";
import { listMessages, getMessage, downloadAttachment } from "./gmail.js";
import { stripQuotedHistory, isAckText } from "./aging.js";

const PDF_EXTRACT_SCRIPT = path.join(
  os.homedir(),
  ".claude",
  "plugins",
  "local",
  "inbox-digest",
  "scripts",
  "extract-pdf.py",
);

// ----- Reply-status classification helpers -------------------------------

/** Does this sender address belong to the client (exact email or domain match)? */
function senderMatchesClient(email, ctx) {
  if (!email) return false;
  const e = email.toLowerCase();
  if (ctx.clientEmails.includes(e)) return true;
  const at = e.lastIndexOf("@");
  const domain = at >= 0 ? e.slice(at + 1) : "";
  return domain && ctx.clientDomains.includes(domain);
}

/** Classify who sent a message: "me" | "them" | "unknown" (ARCH-F1). */
function classifyFrom(email, ctx) {
  if (!email) return "unknown";
  if (ctx.meSet.has(email.toLowerCase())) return "me";
  if (senderMatchesClient(email, ctx)) return "them";
  return "unknown";
}

/** Best-effort match_reason for note frontmatter (informational). */
function computeMatchReason(msgs, ctx) {
  const clientMsg = msgs.find((m) => senderMatchesClient(m.sender_email, ctx));
  if (clientMsg) {
    return ctx.clientEmails.includes((clientMsg.sender_email || "").toLowerCase())
      ? "from_email_match"
      : "domain_match";
  }
  if (msgs.some((m) => ctx.meSet.has((m.sender_email || "").toLowerCase()))) return "sent_reply";
  return "to_email_match";
}

/** Server-observed time for a message (CIPHER-F11) — never the spoofable header Date. */
function serverIso(msg, fallbackIso) {
  return msg.received_iso || fallbackIso;
}

// ----- Meeting / calendar detection --------------------------------------

const MEETING_SUBJECT_RE = /^\s*(invitation|updated invitation|canceled event|cancelled event|accepted|declined|tentatively accepted):/i;

function isMeetingMsg(m) {
  if (m.meeting && (m.meeting.method || (m.meeting.start && m.meeting.start.walltime))) return true;
  return MEETING_SUBJECT_RE.test(m.subject || "");
}

function meetingKind(m) {
  const subj = m.subject || "";
  const method = (m.meeting && m.meeting.method) || "";
  const status = (m.meeting && m.meeting.status) || "";
  if (/^\s*cancel(l)?ed event:/i.test(subj) || method === "CANCEL" || status === "CANCELLED") return "cancel";
  if (/^\s*updated invitation:/i.test(subj)) return "update";
  if (/^\s*(accepted|declined|tentatively accepted):/i.test(subj) || method === "REPLY") return "rsvp";
  return "invite";
}

/** Strip Google Calendar's "Invitation: … @ <when> (<email>)" decorations for display. */
function cleanMeetingTitle(m) {
  if (m.meeting && m.meeting.summary) return m.meeting.summary;
  let s = m.subject || "(meeting)";
  s = s.replace(MEETING_SUBJECT_RE, "").trim();
  s = s.replace(/\s+@\s+.*$/, "").trim(); // drop everything from " @ <when> (email)" onward
  return s || "(meeting)";
}

/**
 * When there's no inline ICS (some invites carry the .ics as an attachment only),
 * recover a human-readable time from Google Calendar's subject tail:
 *   "… @ Mon Jun 15, 2026 8am - 8:45am (PDT) (someone@x.com)"  →  "Mon Jun 15, 2026 8am - 8:45am (PDT)"
 */
function displayWhenFromSubject(subject) {
  const m = String(subject || "").match(/@\s*(.+?)\s*\([^)]*@[^)]*\)\s*$/);
  return m ? m[1].trim() : null;
}

// ----- Reply-classifier v2: category classification ----------------------

const FWD_SUBJECT_RE = /^\s*fwd?:/i;
const FORWARD_MARKER_RE = /-{3,}\s*forwarded message\s*-{3,}|^\s*begin forwarded message:/im;
// A question or request above the forward = a real ask → keep it red. Absence = "here you
// go" delivery note → forward/FYI. This is the safety valve on the relaxed forward rule.
const REQUEST_RE = /\?|\b(please|can you|could you|would you|need (you|to|this)|let me know|thoughts|review|approve|confirm|sign|by (mon|tues?|wed(nes)?|thu(rs)?|fri|sat|sun|tomorrow|eod|eow|today|end of)|asap|urgent)\b/i;

/**
 * Classify an inbound message's reply-expectation category (reply-classifier v2).
 * This is a Phase-1 DETERMINISTIC primitive (no LLM); it lives in phase2.js because
 * category is per-message truth, but routing/expiry POLICY belongs in aging.js.
 *
 * CONSERVATIVE BIAS (Triple Threat NSA/Bengio gate): anything ambiguous returns
 * "ask" so a real human request is never auto-bucketed into a droppable tier.
 *   calendar — meeting invite / update / cancel (reuses isMeetingMsg)
 *   forward  — a bare Fwd: whose only content is the forwarded message (no note of
 *              the sender's own above the forward boundary)
 *   ack      — v2.1: a short affirmative close ("Yes!", "thanks", "sounds good") —
 *              detected by isAckText (aging.js) on the quote+signature-stripped body;
 *              requires an affirmative token, so short dissent stays ask. NOTE: aging's
 *              applyUpdates additionally gates ack on prior state (only demotes when
 *              <your-name> spoke last) — classifier emits per-message truth, aging applies
 *              the thread-level policy.
 *   ask      — everything else (default; the safe direction)
 *
 * Documented boundaries (intentional, not defects — per fidelity audit):
 *  - Outlook-style "From:/Sent:" forwards aren't matched as a marker here, so an
 *    Outlook bare-forward falls to "ask" (conservative). Widen FORWARD_MARKER_RE
 *    only with a test if real Outlook forwards show up.
 *  - A bare Fwd: whose forwarded BODY is itself a request being relayed to the user
 *    still classifies "forward" — correct for this system (the ask was not authored
 *    TO the user by the client). Do not widen "forward" past this without review.
 */
export function classifyCategory(msg) {
  if (isMeetingMsg(msg)) return "calendar";
  const subject = msg.subject || "";
  if (!FWD_SUBJECT_RE.test(subject)) {
    return isAckText(msg.plaintext_body || "") ? "ack" : "ask";
  }
  const body = msg.plaintext_body || "";
  const markerIdx = body.search(FORWARD_MARKER_RE);
  if (markerIdx < 0) return "ask"; // no forwarded content found → treat as a real message
  // Forwarded content IS present. What did the sender write above it (sans quoted history)?
  // A delivery note / signature with no question or request → "here you go" → forward/FYI.
  // A question or request keyword → a real ask → stays red (the safety valve). Per <your-name>
  // 2026-06-25: a forward needn't be bare; the forwarded headers reveal it.
  const ownNote = stripQuotedHistory(body.slice(0, markerIdx)).trim();
  return REQUEST_RE.test(ownNote) ? "ask" : "forward";
}

function collectMeetings(msgs, notePath, threadId, ctx, out) {
  for (const m of msgs) {
    if (!isMeetingMsg(m)) continue;
    out.push({
      title: cleanMeetingTitle(m),
      kind: meetingKind(m),
      start: m.meeting ? m.meeting.start : null,
      end: m.meeting ? m.meeting.end : null,
      display_when: (m.meeting && m.meeting.start) ? null : displayWhenFromSubject(m.subject),
      location: m.meeting ? m.meeting.location : null,
      sender: (m.sender_email || "").toLowerCase(),
      from_me: ctx.meSet.has((m.sender_email || "").toLowerCase()),
      received_iso: serverIso(m, ctx.nowIso),
      thread_id: threadId,
      note_path: notePath,
    });
  }
}

/**
 * Phase 2 entry. Pass the work tuple from phase1.
 * Returns a per-client summary suitable for Phase 3 input.
 */
export async function runPhase2(workTuple, options = {}) {
  const { client_slug, client_dir, query_string, expected_account, run_id, account } = workTuple;
  const dryRun = !!options.dryRun;
  const inboxDir = path.join(client_dir, "inbox");
  const attachmentsRoot = path.join(inboxDir, "attachments");
  const indexFile = path.join(inboxDir, ".message-ids.jsonl");

  // Reply-status context (ARCH-F1 / CIPHER-F12). meSet is the authority for "<your-name> replied".
  const nowIso = options.now || nowIsoUtc();
  const ctx = {
    meSet: new Set((workTuple.me_addresses || []).map((a) => a.toLowerCase())),
    clientEmails: workTuple.client_emails || [],
    clientDomains: workTuple.client_domains || [],
    nowIso,
  };
  // Per-touched-thread status updates handed to the aging step (which owns the ledger write).
  const statusUpdates = [];
  // Calendar invites/updates/cancellations seen this run → 📅 SCHEDULE section in the brief.
  const meetings = [];

  // T0 — account preflight: identity + scope + ACL (hard-abort on mismatch)
  const { assertAccountPreflight } = await import("./gmail.js");
  const { authedEmail } = await assertAccountPreflight(expected_account || account);
  await log("info", `phase2 client=${client_slug} authed=${authedEmail} preflight=ok`);

  // 2.1 — list messages
  const { messages: stubs, capped } = await listMessages(query_string, { maxTotal: 500 }, account);
  await log("info", `phase2 client=${client_slug} search_results=${stubs.length} capped=${capped}`);

  if (stubs.length === 0) {
    return {
      client_slug,
      client_dir,
      new_thread_paths: [],
      merged_thread_paths: [],
      attachments_extracted: [],
      attachments_failed: [],
      errors: [],
      capped: false,
      empty: true,
      authed_email: authedEmail,
      status_updates: [],
      msgs_by_thread: {},
      meetings: [],
    };
  }

  // 2.2 — dedup against .message-ids.jsonl
  const indexEntries = await readJsonl(indexFile);
  const indexedMids = new Set(indexEntries.map((e) => e.message_id));
  const threadIdToNotePath = new Map(
    indexEntries
      .filter((e) => e.thread_id && e.note_path)
      .map((e) => [e.thread_id, e.note_path]),
  );

  // Eager read_email per matched message (need threadId for grouping; gmail's stub omits it
  // half the time — being safe by always reading + caching)
  await log("info", `phase2 client=${client_slug} reading ${stubs.length} messages...`);
  const fullMessages = [];
  for (const stub of stubs) {
    if (indexedMids.has(stub.id)) {
      // Already filed — skip read entirely
      continue;
    }
    try {
      const m = await getMessage(stub.id, account);
      fullMessages.push(m);
    } catch (err) {
      await log("error", `phase2 read_email mid=${stub.id} err=${err.message}`);
    }
  }
  await log(
    "info",
    `phase2 client=${client_slug} new_messages=${fullMessages.length} dupes=${stubs.length - fullMessages.length}`,
  );

  if (fullMessages.length === 0) {
    return {
      client_slug,
      client_dir,
      new_thread_paths: [],
      merged_thread_paths: [],
      attachments_extracted: [],
      attachments_failed: [],
      errors: [],
      capped,
      empty: true,
      authed_email: authedEmail,
      status_updates: [],
      msgs_by_thread: {},
      meetings: [],
    };
  }

  // 2.2 — group by threadId
  const byThread = new Map();
  for (const m of fullMessages) {
    if (!byThread.has(m.threadId)) byThread.set(m.threadId, []);
    byThread.get(m.threadId).push(m);
  }
  // Sort each thread's messages chronologically
  for (const arr of byThread.values()) {
    arr.sort((a, b) => (a.internalDate || 0) - (b.internalDate || 0));
  }

  // 2.3 — process each thread
  const newPaths = [];
  const mergedPaths = [];
  const attachmentsExtracted = [];
  const attachmentsFailed = [];
  const errors = [];
  const indexAppends = [];

  for (const [threadId, msgs] of byThread.entries()) {
    try {
      const existing = threadIdToNotePath.get(threadId);
      if (existing) {
        const existingFull = path.join(client_dir, existing);
        try {
          await fs.stat(existingFull);
          // MERGE
          const result = await mergeThreadNote(existingFull, msgs, client_slug, run_id, attachmentsRoot, dryRun, ctx, existing, account);
          mergedPaths.push(existing);
          attachmentsExtracted.push(...result.attachmentsExtracted);
          attachmentsFailed.push(...result.attachmentsFailed);
          if (result.statusUpdate) statusUpdates.push(result.statusUpdate);
          collectMeetings(msgs, existing, threadId, ctx, meetings);
          for (const m of msgs) {
            indexAppends.push({
              message_id: m.id,
              thread_id: threadId,
              note_path: existing,
              filed_iso: nowIso,
            });
          }
          continue;
        } catch {
          await log(
            "warn",
            `phase2 index referenced missing note ${existing}; recreating`,
          );
        }
      }

      // CIPHER-F12 — only auto-file a NEW thread if <your-name> or the client actually
      // authored a message in it. A bare inbound that merely names a client in
      // To:/Cc: (spoofable) is skipped, not filed under the client.
      const hasParticipant = msgs.some(
        (m) => ctx.meSet.has((m.sender_email || "").toLowerCase()) || senderMatchesClient(m.sender_email, ctx),
      );
      if (!hasParticipant) {
        await log(
          "warn",
          `phase2 client=${client_slug} thread=${threadId} skipped (CIPHER-F12: no me/client-authored message; matched only via To:/Cc:)`,
        );
        continue;
      }

      // CREATE
      const first = msgs[0];
      const date = (first.date_iso || nowIsoUtc()).slice(0, 10);
      const slug = slugifySubject(first.subject);
      let notePath = path.join(inboxDir, `${date}_${slug}.md`);
      // Filename collision: same date+subject but different threadId → suffix
      try {
        await fs.stat(notePath);
        // collision; check if it's actually our thread (shouldn't be, since not in index)
        notePath = path.join(inboxDir, `${date}_${slug}_${threadId.slice(0, 8)}.md`);
      } catch {
        // good, doesn't exist
      }
      const relNote = path.relative(client_dir, notePath).replace(/\\/g, "/");
      const result = await createThreadNote(notePath, msgs, client_slug, run_id, attachmentsRoot, dryRun, threadId, ctx, relNote, account);
      newPaths.push(relNote);
      attachmentsExtracted.push(...result.attachmentsExtracted);
      attachmentsFailed.push(...result.attachmentsFailed);
      if (result.statusUpdate) statusUpdates.push(result.statusUpdate);
      collectMeetings(msgs, relNote, threadId, ctx, meetings);
      for (const m of msgs) {
        indexAppends.push({
          message_id: m.id,
          thread_id: threadId,
          note_path: relNote,
          filed_iso: nowIso,
        });
      }
    } catch (err) {
      errors.push({ thread_id: threadId, error: err.message });
      await log("error", `phase2 thread=${threadId} err=${err.message}`);
    }
  }

  // 2.8 — append to message-id index
  if (!dryRun) {
    for (const entry of indexAppends) {
      await appendJsonl(indexFile, entry);
    }
  }

  return {
    client_slug,
    client_dir,
    new_thread_paths: newPaths,
    merged_thread_paths: mergedPaths,
    attachments_extracted: attachmentsExtracted,
    attachments_failed: attachmentsFailed,
    errors,
    capped,
    empty: newPaths.length + mergedPaths.length === 0,
    authed_email: authedEmail,
    status_updates: statusUpdates,
    msgs_by_thread: Object.fromEntries(byThread),
    meetings,
  };
}

// ----- Note rendering ----------------------------------------------------

function renderMessageBlock(msg) {
  const date = msg.date_iso || "unknown";
  const fromLabel = msg.sender_name
    ? `${msg.sender_name} <${msg.sender_email}>`
    : msg.sender_email || "(unknown sender)";
  const toLabel = (msg.to || []).join(", ") || "(no recipients)";
  const safeBody = sanitizeBody(msg.plaintext_body || "");
  const htmlFlag = msg.body_html_fallback ? "\n*[Body was HTML-only — stripped to plain text]*\n" : "";
  return [
    `## ${date} — ${fromLabel} → ${toLabel}`,
    "",
    htmlFlag,
    "```text",
    safeBody,
    "```",
    "",
  ].join("\n");
}

async function createThreadNote(notePath, msgs, clientSlug, runId, attachmentsRoot, dryRun, threadId, ctx, relNote, account) {
  const first = msgs[0];
  const last = msgs[msgs.length - 1];
  const subjectSafe = htmlEscape(first.subject);

  // Reply-status fields (server-time clock; me_addresses classification).
  const lastFrom = classifyFrom(last.sender_email, ctx);
  const lastSender = (last.sender_email || "").toLowerCase();
  const lastMsgIso = serverIso(last, ctx.nowIso);
  const matchReason = computeMatchReason(msgs, ctx);
  const noteSlug = path.basename(notePath, ".md");
  const attachmentDir = path.join(attachmentsRoot, noteSlug);

  // Collect attachments across all messages, dedupe by (mid, attId)
  const attachments = [];
  const attachmentsExtracted = [];
  const attachmentsFailed = [];
  for (const m of msgs) {
    for (const att of m.attachments || []) {
      const safeName = sanitizeAttachmentName(att.filename);
      const relPath = `attachments/${noteSlug}/${safeName}`;
      const absPath = path.join(attachmentDir, safeName);
      let extracted = null;
      let downloadNote = null;
      if (dryRun) {
        downloadNote = "dry-run — not downloaded";
      } else {
        try {
          await downloadAttachment(m.id, att.id, absPath, account);
          if (safeName.toLowerCase().endsWith(".pdf")) {
            const extPath = `${absPath}.extracted.md`;
            try {
              await runPdfExtract(absPath, extPath);
              extracted = `${relPath}.extracted.md`;
              attachmentsExtracted.push({ path: relPath, extracted });
            } catch (e) {
              downloadNote = `pdf-extract failed: ${e.message}`;
              attachmentsFailed.push({ filename: safeName, error: e.message });
            }
          } else {
            attachmentsExtracted.push({ path: relPath, extracted: null });
          }
        } catch (err) {
          downloadNote = `download failed: ${err.message}`;
          attachmentsFailed.push({ filename: safeName, error: err.message });
        }
      }
      attachments.push({
        filename: safeName,
        attachment_id: att.id,
        message_id: m.id,
        path: relPath,
        extracted,
        note: downloadNote,
        mime_type: att.mime_type,
        size_bytes: att.size_bytes,
      });
    }
  }

  const frontmatter = {
    type: "email-thread",
    client: clientSlug,
    thread_id: threadId,
    message_ids: msgs.map((m) => m.id),
    subject: first.subject,
    from: Array.from(new Set(msgs.map((m) => m.sender_email).filter(Boolean))),
    to: Array.from(new Set(msgs.flatMap((m) => m.to || []).filter(Boolean))),
    date_first: first.date_iso,
    date_latest: last.date_iso,
    // Reply-status (server-time; the aging clock reads last_msg_iso, never date_latest).
    last_from: lastFrom,
    last_sender_email: lastSender,
    last_msg_iso: lastMsgIso,
    // Reply-classifier v2 category — only meaningful for an inbound (last_from "them").
    category: lastFrom === "them" ? classifyCategory(last) : null,
    attachments,
    match_reason: matchReason,
    filed_at: ctx.nowIso,
    run_id: runId,
  };

  const body = [
    `# ${subjectSafe}`,
    "",
    ...msgs.map(renderMessageBlock),
  ].join("\n");

  const fileText = matter.stringify(body, frontmatter);

  if (!dryRun) {
    await atomicWrite(notePath, fileText);
  }

  return {
    attachmentsExtracted,
    attachmentsFailed,
    statusUpdate: {
      thread_id: threadId,
      subject: sanitizeLedgerSubject(first.subject),
      note_path: relNote,
      last_from: lastFrom,
      last_sender_email: lastSender,
      last_msg_iso: lastMsgIso,
      category: lastFrom === "them" ? classifyCategory(last) : null,
    },
  };
}

async function mergeThreadNote(notePath, newMsgs, clientSlug, runId, attachmentsRoot, dryRun, ctx, relNote, account) {
  const raw = await fs.readFile(notePath, "utf8");
  const parsed = matter(raw);
  const fm = parsed.data || {};
  const noteSlug = path.basename(notePath, ".md");
  const attachmentDir = path.join(attachmentsRoot, noteSlug);

  const existingMids = new Set(fm.message_ids || []);
  const trulyNew = newMsgs.filter((m) => !existingMids.has(m.id));
  if (trulyNew.length === 0) {
    return { attachmentsExtracted: [], attachmentsFailed: [], statusUpdate: null };
  }

  // Append message_ids to frontmatter
  fm.message_ids = [...(fm.message_ids || []), ...trulyNew.map((m) => m.id)];
  fm.date_latest = trulyNew[trulyNew.length - 1].date_iso;
  fm.from = Array.from(new Set([...(fm.from || []), ...trulyNew.map((m) => m.sender_email).filter(Boolean)]));
  fm.to = Array.from(new Set([...(fm.to || []), ...trulyNew.flatMap((m) => m.to || []).filter(Boolean)]));

  // MONOTONIC MERGE INVARIANT — trulyNew is only THIS scan's un-indexed messages,
  // not the whole thread, so naively taking "the last one" could walk last_msg_iso
  // backward (a backfilled older reply) and wrongly flip last_from → silently clearing
  // a real 🔴. Rule: last_msg_iso never regresses; last_from/last_sender update ONLY
  // when a strictly-newer message arrives. (CIPHER-F11 server-time clock throughout.)
  const candidate = trulyNew[trulyNew.length - 1];
  const candIso = serverIso(candidate, ctx.nowIso);
  const persistedIso = fm.last_msg_iso || null;
  if (!persistedIso || candIso > persistedIso) {
    fm.last_from = classifyFrom(candidate.sender_email, ctx);
    fm.last_sender_email = (candidate.sender_email || "").toLowerCase();
    fm.last_msg_iso = candIso;
    // Reply-classifier v2: category tracks the latest INBOUND only. When I reply last
    // (last_from "me"), null it so a prior "forward" can't keep a re-armed thread out of red.
    fm.category = fm.last_from === "them" ? classifyCategory(candidate) : null;
  } else {
    // keep persisted last_from/last_sender_email/category; do not regress last_msg_iso
    fm.last_msg_iso = persistedIso;
    if (fm.last_from == null) fm.last_from = classifyFrom(candidate.sender_email, ctx);
  }

  // Process attachments from new messages
  const attachmentsExtracted = [];
  const attachmentsFailed = [];
  for (const m of trulyNew) {
    for (const att of m.attachments || []) {
      const safeName = sanitizeAttachmentName(att.filename);
      const relPath = `attachments/${noteSlug}/${safeName}`;
      const absPath = path.join(attachmentDir, safeName);
      let extracted = null;
      let downloadNote = null;
      if (dryRun) {
        downloadNote = "dry-run — not downloaded";
      } else {
        try {
          await downloadAttachment(m.id, att.id, absPath, account);
          if (safeName.toLowerCase().endsWith(".pdf")) {
            try {
              await runPdfExtract(absPath, `${absPath}.extracted.md`);
              extracted = `${relPath}.extracted.md`;
              attachmentsExtracted.push({ path: relPath, extracted });
            } catch (e) {
              downloadNote = `pdf-extract failed: ${e.message}`;
              attachmentsFailed.push({ filename: safeName, error: e.message });
            }
          } else {
            attachmentsExtracted.push({ path: relPath, extracted: null });
          }
        } catch (err) {
          downloadNote = `download failed: ${err.message}`;
          attachmentsFailed.push({ filename: safeName, error: err.message });
        }
      }
      fm.attachments = fm.attachments || [];
      fm.attachments.push({
        filename: safeName,
        attachment_id: att.id,
        message_id: m.id,
        path: relPath,
        extracted,
        note: downloadNote,
        mime_type: att.mime_type,
        size_bytes: att.size_bytes,
      });
    }
  }

  // Append new message blocks to the body
  const appendedBody = trulyNew.map(renderMessageBlock).join("\n");
  const newBody = parsed.content.trimEnd() + "\n\n" + appendedBody;
  const out = matter.stringify(newBody, fm);

  if (!dryRun) {
    await atomicWrite(notePath, out);
  }
  return {
    attachmentsExtracted,
    attachmentsFailed,
    statusUpdate: {
      thread_id: fm.thread_id,
      subject: sanitizeLedgerSubject(fm.subject),
      note_path: relNote,
      last_from: fm.last_from,
      last_sender_email: fm.last_sender_email,
      last_msg_iso: fm.last_msg_iso,
      category: fm.category ?? null,
    },
  };
}

// ----- PDF extraction (chains to existing Python helper) -----------------

function runPdfExtract(inPath, outPath) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "python",
      [PDF_EXTRACT_SCRIPT, inPath, "--out", outPath, "--write-failure"],
      { stdio: "ignore" },
    );
    let settled = false;
    child.on("exit", (code) => {
      if (settled) return;
      settled = true;
      if (code === 0) resolve();
      else reject(new Error(`pdf-extract exit ${code}`));
    });
    child.on("error", (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
  });
}

/**
 * After a successful phase 2 + phase 3, update the hub frontmatter's `last_scan`.
 */
export async function updateLastScan(hubPath, windowEndIso) {
  const raw = await fs.readFile(hubPath, "utf8");
  const parsed = matter(raw);
  parsed.data.last_scan = windowEndIso;
  const out = matter.stringify(parsed.content, parsed.data);
  await atomicWrite(hubPath, out);
}
