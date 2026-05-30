#!/usr/bin/env node
// inbox-digest CLI orchestrator.
// Replaces `claude -p "/inbox-digest ..."` with a self-contained Node entry
// that Task Scheduler can launch directly.
//
// Usage:
//   node digest.js --client <slug>           # single client
//   node digest.js --all                     # sweep every client hub
//   node digest.js --client <slug> --dry-run
//   node digest.js --client <slug> --since 2026-05-01

import process from "node:process";
import crypto from "node:crypto";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import {
  loadEnv,
  log,
  atomicWrite,
  CLIENTS_DIR,
  nowIsoUtc,
} from "./util.js";
import { runPhase1 } from "./phase1.js";
import { runPhase2, updateLastScan } from "./phase2.js";
import { runPhase3 } from "./phase3.js";

const STALE_LOCK_MS = 30 * 60 * 1000; // 30 minutes

function parseArgs(argv) {
  const args = { client: null, all: false, since: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--client" || a === "-c") args.client = argv[++i];
    else if (a === "--all") args.all = true;
    else if (a === "--since" || a === "-s") args.since = argv[++i];
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--help" || a === "-h") {
      console.log(`inbox-digest CLI
Usage:
  node digest.js --client <slug>                  # scan one client
  node digest.js --all                            # sweep every client hub
  node digest.js --client <slug> --dry-run        # read-only
  node digest.js --client <slug> --since YYYY-MM-DD  # backfill override

Env:
  ANTHROPIC_API_KEY    (required for Phase 3) — set in ~/.claude/.env
  VAULT_ROOT           override vault path
  INBOX_DIGEST_MODEL   override Claude model (default: claude-sonnet-4-5)
`);
      process.exit(0);
    }
  }
  if (!args.client && !args.all) {
    console.error("error: --client <slug> or --all required");
    process.exit(2);
  }
  if (args.client && args.all) {
    console.error("error: --client and --all are mutually exclusive");
    process.exit(2);
  }
  return args;
}

/**
 * Per-client PID lock with PID-liveness check + 30min stale-lock reclaim.
 * Returns the lock path on success, throws if another live process holds it.
 */
async function acquireLock(slug, runId) {
  const lockPath = path.join(
    process.env.USERPROFILE || os.homedir(),
    ".claude",
    `.inbox-digest-${slug}.lock`,
  );
  const me = {
    pid: process.pid,
    started: nowIsoUtc(),
    run_id: runId,
    client: slug,
  };
  try {
    await fs.writeFile(lockPath, JSON.stringify(me), { flag: "wx" });
    return lockPath;
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }

  // Lock exists — check holder
  let holder = null;
  try {
    holder = JSON.parse(await fs.readFile(lockPath, "utf8"));
  } catch {
    // Corrupt lock — reclaim
    await fs.unlink(lockPath).catch(() => {});
    await fs.writeFile(lockPath, JSON.stringify(me));
    await log("warn", `digest reclaimed corrupt lock for ${slug}`);
    return lockPath;
  }

  const age = Date.now() - new Date(holder.started || 0).getTime();
  const aliveByPid = holder.pid ? isPidAlive(holder.pid) : false;

  if (aliveByPid && age < STALE_LOCK_MS) {
    await log(
      "info",
      `digest skipping — another run is active client=${slug} pid=${holder.pid} age=${(age / 1000).toFixed(0)}s`,
    );
    const e = new Error("LOCK_HELD");
    e.code = "LOCK_HELD";
    throw e;
  }

  // Stale (pid dead OR >30min old) — reclaim
  await fs.unlink(lockPath).catch(() => {});
  await fs.writeFile(lockPath, JSON.stringify(me));
  await log(
    "warn",
    `digest reclaimed stale lock client=${slug} pid=${holder.pid} alive=${aliveByPid} age=${(age / 1000).toFixed(0)}s`,
  );
  return lockPath;
}

/** Cross-platform liveness probe. Returns false if the PID is dead. */
function isPidAlive(pid) {
  if (!pid || typeof pid !== "number") return false;
  try {
    // Signal 0 doesn't actually send a signal — just checks if the process exists.
    // Throws ESRCH if dead, EPERM if alive but not permitted (still alive).
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
}

/**
 * Write a heartbeat file at ~/.claude/.inbox-digest-<slug>.last-run.json
 * with the run's outcome. Cron observers (or future Brief Viewer status pages)
 * can grep these to know which clients are stalled.
 */
async function writeHeartbeat(slug, payload) {
  const hbPath = path.join(
    process.env.USERPROFILE || os.homedir(),
    ".claude",
    `.inbox-digest-${slug}.last-run.json`,
  );
  await atomicWrite(hbPath, JSON.stringify(payload, null, 2));
}

/**
 * Discover all client hubs under <vault>/context/clients/.
 * Returns slugs in deterministic order.
 */
async function discoverAllClientSlugs() {
  const slugs = new Set();
  let entries;
  try {
    entries = await fs.readdir(CLIENTS_DIR, { withFileTypes: true });
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      // Folder layout: <slug>/index.md
      try {
        await fs.stat(path.join(CLIENTS_DIR, entry.name, "index.md"));
        slugs.add(entry.name);
        continue;
      } catch {
        // not a folder hub — fall through
      }
    } else if (entry.isFile() && entry.name.endsWith("-client.md")) {
      // Flat-client layout: <slug>-client.md
      slugs.add(entry.name.replace(/-client\.md$/, ""));
    }
  }
  return Array.from(slugs).sort();
}

/**
 * Run one client end-to-end. Always writes a heartbeat on exit, success or failure.
 */
async function runOne(slug, opts) {
  const runId = crypto.randomUUID();
  await log("info", `digest start client=${slug} dry_run=${opts.dryRun} run_id=${runId}`);

  let lockPath = null;
  let outcome = {
    client: slug,
    run_id: runId,
    started: nowIsoUtc(),
    finished: null,
    status: "unknown",
    new_threads: 0,
    merged_threads: 0,
    brief_path: null,
    error: null,
  };

  try {
    try {
      lockPath = await acquireLock(slug, runId);
    } catch (err) {
      if (err.code === "LOCK_HELD") {
        outcome.status = "skipped_locked";
        outcome.finished = nowIsoUtc();
        await writeHeartbeat(slug, outcome);
        return outcome;
      }
      throw err;
    }

    const workTuple = await runPhase1({ clientSlug: slug, sinceIso: opts.sinceIso });
    workTuple.run_id = runId;

    const phase2 = await runPhase2(workTuple, { dryRun: opts.dryRun });
    outcome.new_threads = phase2.new_thread_paths.length;
    outcome.merged_threads = phase2.merged_thread_paths.length;

    if (phase2.empty) {
      outcome.status = "no_new_mail";
      await log("info", `digest client=${slug} no new mail — silent exit`);
      console.log(`[${slug}] no new mail since last scan; no brief written.`);
      return outcome;
    }

    const phase3 = await runPhase3(workTuple, phase2, { dryRun: opts.dryRun });
    outcome.brief_path = phase3.brief_path || null;
    outcome.action_items_added = phase3.action_items_added;
    outcome.inferred_count = phase3.inferred_count;

    if (!opts.dryRun && !phase2.capped && phase2.errors.length === 0) {
      await updateLastScan(workTuple.hub_path, workTuple.window_end_iso);
    }

    outcome.status = phase2.capped
      ? "ok_capped"
      : phase2.errors.length
        ? "ok_with_errors"
        : "ok";
    await log(
      "info",
      `digest done client=${slug} new=${outcome.new_threads} merged=${outcome.merged_threads} brief=${phase3.brief_path ? path.basename(phase3.brief_path) : "(none)"} actions=${phase3.action_items_added}`,
    );
    if (phase3.brief_path) {
      console.log(`✓ [${slug}] Brief: ${phase3.brief_path}`);
      console.log(`  Action items added: ${phase3.action_items_added} (inferred: ${phase3.inferred_count})`);
    }
  } catch (err) {
    outcome.status = "failed";
    outcome.error = err.message || String(err);
    await log("error", `digest client=${slug} FAILED: ${err.message}\n${err.stack || ""}`);
    console.error(`[${slug}] FAILED:`, err.message);
  } finally {
    outcome.finished = nowIsoUtc();
    await writeHeartbeat(slug, outcome);
    if (lockPath) await fs.unlink(lockPath).catch(() => {});
  }
  return outcome;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await loadEnv();

  let slugs;
  if (args.all) {
    slugs = await discoverAllClientSlugs();
    await log("info", `digest --all discovered ${slugs.length} clients: ${slugs.join(", ")}`);
    if (slugs.length === 0) {
      console.error("error: --all sweep found no client hubs");
      process.exit(2);
    }
  } else {
    slugs = [args.client];
  }

  let anyFailed = false;
  for (const slug of slugs) {
    const outcome = await runOne(slug, {
      sinceIso: args.since,
      dryRun: args.dryRun,
    });
    if (outcome.status === "failed") anyFailed = true;
  }
  process.exit(anyFailed ? 1 : 0);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
