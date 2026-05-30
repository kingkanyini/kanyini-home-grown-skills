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
} from "./util.js";
import { listMessages, getMessage, downloadAttachment, getAuthedEmail } from "./gmail.js";

const PDF_EXTRACT_SCRIPT = path.join(
  os.homedir(),
  ".claude",
  "plugins",
  "local",
  "inbox-digest",
  "scripts",
  "extract-pdf.py",
);

/**
 * Phase 2 entry. Pass the work tuple from phase1.
 * Returns a per-client summary suitable for Phase 3 input.
 */
export async function runPhase2(workTuple, options = {}) {
  const { client_slug, client_dir, query_string, expected_account, run_id } = workTuple;
  const dryRun = !!options.dryRun;
  const inboxDir = path.join(client_dir, "inbox");
  const attachmentsRoot = path.join(inboxDir, "attachments");
  const indexFile = path.join(inboxDir, ".message-ids.jsonl");

  // T0 — auth sanity check (1.2.f)
  const authedEmail = await getAuthedEmail();
  if (expected_account && authedEmail !== expected_account.toLowerCase()) {
    throw new Error(
      `Gmail account mismatch: authed as '${authedEmail}', frontmatter expects '${expected_account}'`,
    );
  }
  await log("info", `phase2 client=${client_slug} authed=${authedEmail}`);

  // 2.1 — list messages
  const { messages: stubs, capped } = await listMessages(query_string, { maxTotal: 500 });
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
      const m = await getMessage(stub.id);
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
          const result = await mergeThreadNote(existingFull, msgs, client_slug, run_id, attachmentsRoot, dryRun);
          mergedPaths.push(existing);
          attachmentsExtracted.push(...result.attachmentsExtracted);
          attachmentsFailed.push(...result.attachmentsFailed);
          for (const m of msgs) {
            indexAppends.push({
              message_id: m.id,
              thread_id: threadId,
              note_path: existing,
              filed_iso: nowIsoUtc(),
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
      const result = await createThreadNote(notePath, msgs, client_slug, run_id, attachmentsRoot, dryRun, threadId);
      newPaths.push(path.relative(client_dir, notePath).replace(/\\/g, "/"));
      attachmentsExtracted.push(...result.attachmentsExtracted);
      attachmentsFailed.push(...result.attachmentsFailed);
      for (const m of msgs) {
        indexAppends.push({
          message_id: m.id,
          thread_id: threadId,
          note_path: path.relative(client_dir, notePath).replace(/\\/g, "/"),
          filed_iso: nowIsoUtc(),
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

async function createThreadNote(notePath, msgs, clientSlug, runId, attachmentsRoot, dryRun, threadId) {
  const first = msgs[0];
  const last = msgs[msgs.length - 1];
  const subjectSafe = htmlEscape(first.subject);
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
          await downloadAttachment(m.id, att.id, absPath);
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
    attachments,
    match_reason: "from_email_match",
    filed_at: nowIsoUtc(),
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

  return { attachmentsExtracted, attachmentsFailed };
}

async function mergeThreadNote(notePath, newMsgs, clientSlug, runId, attachmentsRoot, dryRun) {
  const raw = await fs.readFile(notePath, "utf8");
  const parsed = matter(raw);
  const fm = parsed.data || {};
  const noteSlug = path.basename(notePath, ".md");
  const attachmentDir = path.join(attachmentsRoot, noteSlug);

  const existingMids = new Set(fm.message_ids || []);
  const trulyNew = newMsgs.filter((m) => !existingMids.has(m.id));
  if (trulyNew.length === 0) {
    return { attachmentsExtracted: [], attachmentsFailed: [] };
  }

  // Append message_ids to frontmatter
  fm.message_ids = [...(fm.message_ids || []), ...trulyNew.map((m) => m.id)];
  fm.date_latest = trulyNew[trulyNew.length - 1].date_iso;
  fm.from = Array.from(new Set([...(fm.from || []), ...trulyNew.map((m) => m.sender_email).filter(Boolean)]));
  fm.to = Array.from(new Set([...(fm.to || []), ...trulyNew.flatMap((m) => m.to || []).filter(Boolean)]));

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
          await downloadAttachment(m.id, att.id, absPath);
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
  return { attachmentsExtracted, attachmentsFailed };
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
