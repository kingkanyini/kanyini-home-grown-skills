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
import { runAging } from "./aging.js";
import { runPhase3 } from "./phase3.js";

// PID-liveness is the PRIMARY check: a LIVE holder is never reclaimed inside the
// hard ceiling, no matter how long it's been running (a spec-sanctioned 429 storm can
// legitimately stretch a Slack sweep past an hour — counsel blocker: age-based reclaim
// was stealing live locks). HARD_STALE is the pid-reuse/hung-process backstop only.
// (Dead-pid and unreadable holders reclaim immediately — no age threshold needed.)
const HARD_STALE_MS = 4 * 60 * 60 * 1000;  // even a live pid is presumed hung/pid-reuse past this

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
 * Per-client PID lock with PID-liveness check + stale-lock reclaim (STALE_LOCK_MS).
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

  if (aliveByPid && age < HARD_STALE_MS) {
    await log(
      "info",
      `digest skipping — another run is active client=${slug} pid=${holder.pid} age=${(age / 1000).toFixed(0)}s`,
    );
    const e = new Error("LOCK_HELD");
    e.code = "LOCK_HELD";
    throw e;
  }

  // Stale (pid dead, OR live-but-past-the-4h hard ceiling = hung/pid-reuse) — reclaim
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
/** True when the client has pending rows in its drafts ledger (disposition needed even with draft_replies off). */
async function hasPendingDrafts(clientDir) {
  try {
    const raw = await fs.readFile(path.join(clientDir, "inbox", ".drafts.jsonl"), "utf8");
    return /"status":"pending"/.test(raw);
  } catch {
    return false;
  }
}

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
  const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,40}$/;
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
      // Flat-client layout (legacy): <slug>-client.md
      slugs.add(entry.name.replace(/-client\.md$/, ""));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      // Flat layout (new canonical): <slug>.md — resolveClientHub supports this, so --all
      // must too (otherwise <example-client>.md / example-client.md get skipped).
      const slug = entry.name.replace(/\.md$/, "");
      if (SLUG_RE.test(slug)) slugs.add(slug);
    }
  }
  return Array.from(slugs).sort();
}

/**
 * Team weekly digests (Sentinel Phase 2 Quest 1, spec §2) — runs AFTER postDigest
 * on every sweep path, own try/catch: generation failure NEVER blocks the sweep.
 */
async function runTeamDigestHook(workTuple, slackCtx, opts, now, outcome) {
  try {
    const { runTeamDigests } = await import("./team-digest.js");
    const { registryAppend } = await import("./phase2c.js");
    const { saveDigestState } = await import("./slack-state.js");
    workTuple.team_url = slackCtx.teamUrl || null;
    const nowIso = new Date(now).toISOString();
    const team = await runTeamDigests(workTuple, slackCtx.digestState, {
      scout: slackCtx.scout,
      gutsy: slackCtx.gutsy,
      now,
      dryRun: opts.dryRun,
      // The generator owns its own bounded LLM call on EVERY sweep path (quiet
      // included) — independent of the needs-you classifier wiring (spec §2.3).
      callFn:
        !opts.dryRun && process.env.ANTHROPIC_API_KEY
          ? async (system, user) => {
              const Anthropic = (await import("@anthropic-ai/sdk")).default;
              const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
              const res = await client.messages.create({
                model: process.env.INBOX_DIGEST_MODEL || "claude-sonnet-4-5",
                max_tokens: 1200,
                system: [{ type: "text", text: system }],
                messages: [{ role: "user", content: user }],
              });
              return res.content?.[0]?.text || "";
            }
          : async () => {
              throw new Error("no LLM available — deterministic fallback");
            },
      registry: async (rec, mode) =>
        registryAppend(
          workTuple,
          { summary: `weekly digest → ${rec.name} (${mode})`, mirror: true, channel_name: "command-center", source: "slack" },
          `digest:${rec.user_id}`,
          "delivered",
          nowIso,
        ).catch(() => {}),
      // §2.5 at-most-once: the pending marker must reach DISK before any DM send,
      // and each recipient's outcome persists before the next runs.
      persist: async () => {
        if (!opts.dryRun) await saveDigestState(workTuple.client_dir, slackCtx.digestState);
      },
    });
    outcome.team_digests = team.generated.length;
    if (!opts.dryRun && (team.generated.length || team.diverted.length)) {
      await saveDigestState(workTuple.client_dir, slackCtx.digestState);
    }
  } catch (teamErr) {
    await log("warn", `team-digest generation failed (${teamErr.message}) — sweep unaffected, retries next due sweep`);
  }
}

/**
 * Run one client end-to-end. Always writes a heartbeat on exit, success or failure.
 */
async function runOne(slug, opts) {
  const runId = crypto.randomUUID();
  // Single run clock — every phase + aging ages against ONE instant (CIPHER-F11).
  const now = nowIsoUtc();
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

    const workTuple = await runPhase1({ clientSlug: slug, sinceIso: opts.sinceIso, now });
    workTuple.run_id = runId;

    const phase2 = await runPhase2(workTuple, { dryRun: opts.dryRun, now });
    outcome.new_threads = phase2.new_thread_paths.length;
    outcome.merged_threads = phase2.merged_thread_paths.length;

    // Phase 2b — Slack lane (Sentinel spec §3). Fail-isolated: a dead Slack token
    // never blocks the Gmail lane; Slack cursors are simply held (§6.1 row 1).
    let phase2b = null;
    let slackCtx = null; // { scout, gutsy, gutsyBotId, teamUrl, digestState, cc } for Phase 3.5
    if (workTuple.slack) {
      try {
        const { scoutClient, gutsyClient, assertApp, SCOUT_SCOPES, GUTSY_SCOPES } = await import("./slack.js");
        const { runPhase2b } = await import("./phase2b.js");
        // Gutsy FIRST, so the error voice can still speak if the Scout's auth fails
        // (§6.1 row 1: "error-voice post if Gutsy still can"). Token absent pre-M0
        // Step 2 is fine — the sweep still files; the digest just can't post.
        slackCtx = { scout: null, gutsy: null, gutsyBotId: null, teamUrl: null };
        const selfBotIds = new Set();
        if (process.env.SLACK_GUTSY_TOKEN) {
          try {
            const gutsy = gutsyClient();
            const gIdent = await assertApp(gutsy, GUTSY_SCOPES, "gutsy");
            if (gIdent.bot_id) selfBotIds.add(gIdent.bot_id);
            slackCtx.gutsy = gutsy;
            slackCtx.gutsyBotId = gIdent.bot_id || null;
          } catch (gErr) {
            await log("warn", `digest client=${slug} gutsy auth check failed (${gErr.message}) — sweep continues, digest post disabled this run`);
          }
        }
        // Budget 120 ≈ spec §5 worst case (7 history + ≤20 replies + Phase 2c ~15-30 +
        // posts + retries billed) with headroom; the PT60M task limit is the ceiling.
        const scout = scoutClient({ budget: 120 });
        const scoutIdent = await assertApp(scout, SCOUT_SCOPES, "scout");
        if (scoutIdent.bot_id) selfBotIds.add(scoutIdent.bot_id);
        slackCtx.scout = scout;
        slackCtx.teamUrl = scoutIdent.url || null;
        phase2b = await runPhase2b(workTuple, { dryRun: opts.dryRun, now, scout, selfBotIds });
        outcome.slack_new = phase2b.new_thread_paths.length;
        outcome.slack_merged = phase2b.merged_thread_paths.length;
        outcome.slack_held = phase2b.held_channels.length;
        outcome.slack_status = phase2b.errors.length ? "partial" : "ok";
        outcome.slack_channels = phase2b.channel_counts; // per-channel counts (spec §6 heartbeat)
        outcome.conflicted_copies = phase2b.conflicted.length;

        // Phase 2c — command-center read (reactions ✅/🚫 + <your-name> replies), the
        // only read of #command-center, under the spec §3-step-4 contract.
        const { loadDigestState, saveDigestState } = await import("./slack-state.js");
        const { runPhase2c } = await import("./phase2c.js");
        const { state: digestState } = await loadDigestState(workTuple.client_dir);
        const cc = await runPhase2c(workTuple, digestState, { dryRun: opts.dryRun, now, scout });
        if (!opts.dryRun) await saveDigestState(workTuple.client_dir, digestState);
        slackCtx.digestState = digestState;
        slackCtx.cc = cc;
        outcome.cc_cleared = cc.cleared.length;
        outcome.cc_dismissed = cc.dismissed.length;
        outcome.cc_replies = cc.replies.length;
      } catch (slackErr) {
        outcome.slack_status = "failed";
        outcome.slack_error = slackErr.message;
        await log(
          "error",
          `digest client=${slug} Slack lane FAILED (${slackErr.code || ""}): ${slackErr.message} — Gmail lane unaffected, Slack cursors held`,
        );
        // Error voice (spec §6): the bot accounts for its turn if Gutsy is reachable.
        if (slackCtx?.gutsy) {
          const { errorVoicePost, slotFor } = await import("./digest-post.js");
          await errorVoicePost(workTuple, slackCtx.gutsy, { slot: slotFor(new Date(now)), source: "Slack", detail: slackErr.code || null });
        }
        slackCtx = null; // fetch failed — no digest post this sweep
      }
    }

    // Phase 2.5 — reply-status aging. Compute ALWAYS (even on an empty scan, so quiet
    // threads still get nudged); only persist/archive on a clean scan (PHANTOM-F7 gate).
    const canWrite = !opts.dryRun && !phase2.capped && phase2.errors.length === 0;
    if (!canWrite && !opts.dryRun) {
      await log("warn", `digest client=${slug} aging_skipped_reason=${phase2.capped ? "capped" : "errors"} (compute only, no ledger write)`);
    }
    const aging = await runAging({
      client_dir: workTuple.client_dir,
      statusUpdates: phase2.status_updates,
      msgsByThread: phase2.msgs_by_thread,
      now,
      me_addresses: workTuple.me_addresses,
      reply_sla: workTuple.reply_sla,
      timezone: workTuple.timezone,
      reply_hard_tier: workTuple.reply_hard_tier,
      authed_email: phase2.authed_email,
      canWrite,
    });
    let nudges = aging.nudges;
    outcome.nudges = nudges.length;
    // nudge_emitted metric (Lenny) — count NEW tier transitions this run.
    const newNudges = nudges.filter((n) => n.is_new).length;
    const inferredCommit = nudges.filter((n) => n.kind === "promised").length;
    await log("info", `metric=nudge_emitted client=${slug} total=${nudges.length} new=${newNudges} red=${nudges.filter((n) => n.tier === "red").length} commitment_inferred=${inferredCommit} archived=${aging.archived}`);
    // Reply-health snapshot — emitted on EVERY run (incl. quiet days, below) so a blind
    // detector and a calm inbox stop looking identical (PHANTOM). recovered = false-red signal.
    const h = aging.health || {};
    await log("info", `metric=reply_health client=${slug} tracked=${h.tracked || 0} red=${h.red || 0} fyi=${h.fyi || 0} expired_fyi=${h.expired_fyi || 0} rearmed=${h.rearmed || 0} false_suggestions=${h.false_suggestions || 0} ack=${h.ack || 0} recovered=${h.recovered || 0}`);

    // Phase 2 — AI out-of-thread reply match (opt-in per client). Downgrades a red to
    // 🟡 "likely covered, verify" when a recent SENT email covered its ask. SUGGEST only —
    // never resolves; fail-open (a matcher failure leaves every thread red).
    if (workTuple.ai_reply_match && nudges.some((n) => n.tier === "red")) {
      const { runReplyMatch, persistProposed } = await import("./reply-match.js");
      const match = await runReplyMatch(workTuple, nudges, { now });
      nudges = match.nudges;
      if (canWrite && match.proposed.length) {
        await persistProposed(workTuple.client_dir, match.proposed);
      }
    }

    // Phase 2.7 — reply drafter (opt-in per client via draft_replies frontmatter).
    let drafterResult = { drafts: [], skipped: [], dispositions: [], ceiling_hit: false };
    if (workTuple.draft_replies || (await hasPendingDrafts(workTuple.client_dir))) {
      const { runDrafter } = await import("./drafter.js");
      drafterResult = await runDrafter(workTuple, phase2, { now, dryRun: opts.dryRun });
      outcome.drafts_created = drafterResult.drafts.length;
      await log(
        "info",
        `metric=drafts client=${slug} created=${drafterResult.drafts.filter((d) => !d.adopted).length} adopted=${drafterResult.drafts.filter((d) => d.adopted).length} skipped=${drafterResult.skipped.length} ceiling_hit=${drafterResult.ceiling_hit}`,
      );
    }

    // Proceed to a brief if there's new mail, new Slack activity, OR active nudges.
    // Slack-enabled clients NEVER silently exit — every scheduled turn is accounted
    // for in #command-center (anchor, footer, or stall notice; spec §4).
    const slackEmpty = !phase2b || phase2b.empty;
    if (phase2.empty && slackEmpty && nudges.length === 0 && drafterResult.drafts.length === 0 && drafterResult.dispositions.length === 0) {
      outcome.status = "no_new_mail";
      if (slackCtx?.digestState) {
        const { postDigest } = await import("./digest-post.js");
        const { saveDigestState } = await import("./slack-state.js");
        const post = await postDigest(workTuple, {
          ...slackCtx,
          phase2b,
          nudges,
          filedCount: 0,
          briefPath: null,
          dryRun: opts.dryRun,
          now,
          persistState: () => saveDigestState(workTuple.client_dir, slackCtx.digestState),
        });
        if (!opts.dryRun) await saveDigestState(workTuple.client_dir, slackCtx.digestState);
        outcome.digest_posted = post.posted;
        outcome.digest_reason = post.reason;
        await runTeamDigestHook(workTuple, slackCtx, opts, now, outcome);
      }
      await log("info", `digest client=${slug} no new mail, no nudges — quiet turn (slack=${!!slackCtx})`);
      console.log(`[${slug}] no new mail since last scan; no brief written.`);
      return outcome;
    }

    // Sentinel: touched-Slack-notes summary feeds the brief's 💬 SLACK ACTIVITY section.
    let slackNotesSummary = [];
    if (phase2b && !phase2b.empty) {
      const { summarizeSlackNotes } = await import("./phase2b.js");
      slackNotesSummary = await summarizeSlackNotes(workTuple.client_dir, phase2b);
    }

    const phase3 = await runPhase3(workTuple, phase2, { dryRun: opts.dryRun, nudges, archived: aging.archived, meetings: phase2.meetings, drafter: drafterResult, slack: slackNotesSummary });
    outcome.brief_path = phase3.brief_path || null;
    outcome.action_items_added = phase3.action_items_added;
    outcome.inferred_count = phase3.inferred_count;

    if (!opts.dryRun && !phase2.capped && phase2.errors.length === 0) {
      await updateLastScan(workTuple.hub_path, workTuple.window_end_iso);
    }

    // Phase 3.5 — digest post to #command-center, strictly AFTER cursor commit
    // (crash before this = missed digest, watchdog-caught — never a duplicate).
    if (slackCtx?.digestState) {
      const { postDigest } = await import("./digest-post.js");
      const { saveDigestState } = await import("./slack-state.js");
      const filedCount =
        outcome.new_threads + outcome.merged_threads + (outcome.slack_new || 0) + (outcome.slack_merged || 0);
      const post = await postDigest(workTuple, {
        ...slackCtx,
        phase2b,
        nudges,
        classify: !opts.dryRun && process.env.ANTHROPIC_API_KEY
          ? (await import("./classify.js")).makeClassifier()
          : null,
        filedCount,
        briefPath: phase3.brief_path || null,
        dryRun: opts.dryRun,
        now,
        persistState: () => saveDigestState(workTuple.client_dir, slackCtx.digestState),
      });
      if (!opts.dryRun) await saveDigestState(workTuple.client_dir, slackCtx.digestState);
      outcome.digest_posted = post.posted;
      outcome.digest_reason = post.reason;
      await runTeamDigestHook(workTuple, slackCtx, opts, now, outcome);
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
    // Loud failure banner: a silent zero is indistinguishable from "no responders".
    if (/PREFLIGHT|account mismatch|ENOENT.*credentials\.json/i.test(outcome.error || "")) {
      try {
        const bannerDir = path.join(CLIENTS_DIR, slug, "briefs");
        const bannerPath = path.join(bannerDir, `${new Date().toISOString().slice(0, 10)}_brief.md`);
        const banner = [
          `# ⚠️ ${slug} — ACCOUNT UNREACHABLE`,
          "",
          `> **The Gmail account for this client could not be scanned since ${nowIsoUtc()}.**`,
          `> Error: ${outcome.error}`,
          "> New mail and reply drafts are NOT being tracked until this is fixed.",
          "",
        ].join("\n");
        await atomicWrite(bannerPath, banner);
        await log("warn", `digest wrote failure banner client=${slug} path=${bannerPath}`);
      } catch (bannerErr) {
        await log("error", `digest failed to write failure banner: ${bannerErr.message}`);
      }
    }
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
