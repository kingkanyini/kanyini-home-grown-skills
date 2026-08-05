#!/usr/bin/env node
// One-time category backfill for reply-classifier v2.
//
// Existing ledger rows + thread notes predate classifyCategory, so their `category` is
// null and the aging router can't demote forwards/invites out of 🔴. This re-derives
// category from each thread note's LATEST message block (the stored source) and writes it
// to the ledger. Conservative: anything ambiguous stays "ask"/red. Idempotent — only fills
// null-category awaiting-you rows, never overwrites a set value.
//
// Usage:
//   node backfill-categories.js --client <slug>            # write
//   node backfill-categories.js --client <slug> --dry-run  # preview only

import process from "node:process";
import path from "node:path";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { readLedgerMap, writeLedger, log, loadEnv } from "./util.js";
import { classifyCategory } from "./phase2.js";
import { resolveClientHub } from "./phase1.js";

/**
 * Re-derive a thread's category from its stored note body. Splits the rendered note into
 * "## <ts> — sender → rcpt" message blocks, takes the LATEST block (for an awaiting-you
 * thread that's the latest inbound), drops the header line, and runs the SAME
 * classifyCategory used live. Calendar relies on subject only (no ICS stored in the note).
 */
export function categoryFromNote(noteBody, subject) {
  const blocks = String(noteBody || "").split(/^## /m).filter((b) => b.trim());
  let body = "";
  if (blocks.length) {
    const last = blocks[blocks.length - 1];
    const nl = last.indexOf("\n");
    body = nl >= 0 ? last.slice(nl + 1).trim() : "";
  }
  return classifyCategory({ subject: subject || "", plaintext_body: body });
}

/**
 * Fill category on stale ledger rows in place. Only touches rows that are null-category,
 * awaiting-you (last_from "them"), and active (not resolved/muted/seeded). getNoteBody is
 * injected ({subject, body} | null) for testability. Returns the count changed.
 */
export function backfillLedger(ledger, getNoteBody, opts = {}) {
  const force = !!opts.force;
  let changed = 0;
  for (const row of ledger.values()) {
    if (!force && row.category) continue; // --force re-derives set rows (e.g. after a rule change)
    if (row.last_from !== "them") continue;
    if (row.resolved || row.status === "muted" || row.seeded) continue;
    const note = getNoteBody(row.note_path);
    if (!note) continue;
    const next = categoryFromNote(note.body, note.subject || row.subject);
    if (row.category !== next) changed++;
    row.category = next;
  }
  return changed;
}

// ----- CLI -----
async function main() {
  const argv = process.argv.slice(2);
  const get = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : undefined; };
  const slug = get("--client");
  const dryRun = argv.includes("--dry-run");
  const force = argv.includes("--force");
  if (!slug) {
    console.error("usage: node backfill-categories.js --client <slug> [--dry-run] [--force]");
    process.exit(2);
  }
  await loadEnv();
  const hub = await resolveClientHub(slug);
  const clientDir = hub.client_dir;
  const ledgerPath = path.join(clientDir, "inbox", ".thread-status.jsonl");
  const ledger = await readLedgerMap(ledgerPath);

  // Pre-read candidate notes (async), then backfill via a sync accessor.
  const cache = new Map();
  for (const row of ledger.values()) {
    if ((!force && row.category) || row.last_from !== "them" || row.resolved || row.status === "muted" || row.seeded) continue;
    try {
      const parsed = matter(await fs.readFile(path.join(clientDir, row.note_path), "utf8"));
      cache.set(row.note_path, { subject: parsed.data?.subject, body: parsed.content });
    } catch { /* missing note — skip */ }
  }
  const changed = backfillLedger(ledger, (p) => cache.get(p) || null, { force });

  const tally = {};
  for (const row of ledger.values()) {
    const key = row.last_from === "them" && !row.resolved ? (row.category || "null") : "(other)";
    tally[key] = (tally[key] || 0) + 1;
  }
  await log("info", `backfill client=${slug} changed=${changed} dry_run=${dryRun} tally=${JSON.stringify(tally)}`);
  console.log(`backfill ${slug}: ${changed} row(s) categorized. awaiting-you tally=${JSON.stringify(tally)}`);

  if (dryRun) {
    console.log("(dry-run — ledger NOT written)");
  } else if (changed > 0) {
    await writeLedger(ledgerPath, ledger);
    console.log(`✓ ledger written: ${ledgerPath}`);
  } else {
    console.log("nothing to backfill.");
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => { console.error("fatal:", e); process.exit(1); });
}
