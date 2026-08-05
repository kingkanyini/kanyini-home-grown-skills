// Phase 2 — AI out-of-thread reply match (suggest, NEVER resolve).
//
// <your-name> often answers <example-client> in a SEPARATE email instead of replying in-thread, so the
// original thread stays 🔴 "awaiting you" even though it's handled. This layer takes the
// remaining red threads, asks the model whether a recent SENT email covered each thread's
// ask, and — for confident matches — DOWNGRADES the nudge to 🟡 "likely covered, verify"
// with the matched quote. It writes a `proposed_resolution` for audit but NEVER sets
// `resolved` (Triple Threat NSA gate: no autonomous write on client data; human confirms).
//
// This file is the PURE decision core (no I/O, no LLM) so it's fully unit-tested. The LLM
// call + sent-mail gathering live in the orchestrator shell (gated behind a per-client flag).

/**
 * Pick which red threads to send to the matcher. Only awaiting-you reds are eligible
 * (forwards/calendar already demoted to fyi; yellow/blue aren't overdue). Capped to bound
 * token cost (Thattai), oldest-first so the most-overdue get checked when the cap bites.
 */
// Single source of truth for the confidence floor — used as the default in both the pure
// applyMatchVerdicts and the runReplyMatch shell so the two can never drift.
export const DEFAULT_FLOOR = 0.7;

export function selectMatchCandidates(nudges, opts = {}) {
  const cap = Number.isInteger(opts.cap) ? opts.cap : 10;
  return (nudges || [])
    .filter((n) => n.tier === "red" && n.kind === "awaiting_you")
    .sort((a, b) => (b.age_hours || 0) - (a.age_hours || 0))
    .slice(0, cap);
}

/**
 * Apply the model's verdicts to the nudge list. A verdict is { thread_id, covered,
 * confidence (0-1), matched_quote }. For a red thread with covered && confidence >= floor:
 * re-tier to 🟡 likely_covered (carrying the quote) and emit a proposed_resolution. Below
 * floor or not-covered: unchanged (stays red). Returns:
 *   nudges     — new array (red→yellow for confident matches; never resolved)
 *   proposed   — [{thread_id, proposed_resolution:"ai_covered", confidence, quote}] for ledger
 *   belowFloor — covered-but-under-floor verdicts, logged so the floor is tunable from data
 */
export function applyMatchVerdicts(nudges, verdicts, floor = DEFAULT_FLOOR) {
  const byThread = new Map((verdicts || []).map((v) => [v.thread_id, v]));
  const proposed = [];
  const belowFloor = [];
  const out = (nudges || []).map((n) => {
    if (n.tier !== "red") return n;
    const v = byThread.get(n.thread_id);
    if (!v || !v.covered) return n;
    if (v.confidence < floor) {
      belowFloor.push({ thread_id: n.thread_id, confidence: v.confidence, quote: v.matched_quote || "" });
      return n;
    }
    proposed.push({
      thread_id: n.thread_id,
      proposed_resolution: "ai_covered",
      confidence: v.confidence,
      quote: v.matched_quote || "",
    });
    return {
      ...n,
      tier: "yellow",
      kind: "likely_covered",
      match: { quote: v.matched_quote || "", confidence: v.confidence },
    };
  });
  return { nudges: out, proposed, belowFloor };
}

// ----- AI shell (I/O — gated behind a per-client flag; validated by dry-run) ----------

import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import Anthropic from "@anthropic-ai/sdk";
import { log, readLedgerMap, writeLedger } from "./util.js";

const MATCH_MODEL = process.env.INBOX_DIGEST_MODEL || "claude-sonnet-4-5";
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parse the model's verdict array. PURE + defensive: extracts the first [...] block,
 * JSON-parses it, keeps only well-formed entries (thread_id present, covered boolean,
 * confidence coerced to a 0-1 number). Returns [] on ANY failure — never throws, never
 * fabricates a match (a parse failure must not silently clear a red).
 */
export function parseVerdicts(text) {
  const s = String(text || "");
  const start = s.indexOf("[");
  const end = s.lastIndexOf("]");
  if (start < 0 || end <= start) return [];
  let arr;
  try { arr = JSON.parse(s.slice(start, end + 1)); } catch { return []; }
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((e) => e && typeof e.thread_id === "string" && e.thread_id)
    .map((e) => ({
      thread_id: e.thread_id,
      covered: e.covered === true,
      confidence: Number.isFinite(+e.confidence) ? Math.max(0, Math.min(1, +e.confidence)) : 0,
      matched_quote: typeof e.matched_quote === "string" ? e.matched_quote.slice(0, 240) : "",
    }));
}

/** Build the structured matcher prompt. PURE. */
export function buildMatchPrompt(candidates, sentPool) {
  const reds = candidates.map((c) => `- thread_id: ${c.thread_id}\n  ask: "${(c.ask || c.subject || "").slice(0, 300)}"`).join("\n");
  const sent = sentPool.map((m, i) => `[S${i}] ${m.date_iso} — subj "${(m.subject || "").slice(0, 120)}": ${(m.snippet || "").slice(0, 400)}`).join("\n");
  return `You decide whether <your-name> already ANSWERED each open thread in a SEPARATE sent email (he often replies out-of-thread instead of in-thread).

OPEN THREADS (each is currently flagged "awaiting your reply"):
${reds}

KANYINI'S RECENT SENT EMAILS TO THIS CLIENT:
${sent || "(none found)"}

For EACH open thread, decide if any sent email above actually addresses that thread's ask. Be STRICT: only "covered" if a sent email clearly responds to THIS thread's specific request — vague topical overlap is NOT covered. When unsure, covered=false.

Return ONLY a JSON array, one entry per open thread:
[{"thread_id":"<id>","covered":true|false,"confidence":0.0-1.0,"matched_quote":"<≤240 chars from the sent email that answers it, or empty>"}]`;
}

/**
 * Gather <your-name>'s recent SENT messages to this client from filed thread notes (last_from
 * "me"), within lookbackDays. Reads the note body's latest message block as the snippet.
 * Source = the vault notes (already-filed sent mail), so no extra Gmail round-trip.
 */
export async function gatherSentPool(clientDir, nowIso, opts = {}) {
  const lookbackDays = opts.lookbackDays || 21;
  const inboxDir = path.join(clientDir, "inbox");
  const cutoff = new Date(nowIso).getTime() - lookbackDays * DAY_MS;
  const pool = [];
  let files;
  try { files = await fs.readdir(inboxDir); } catch { return pool; }
  for (const f of files) {
    if (!f.endsWith(".md")) continue;
    let parsed;
    try { parsed = matter(await fs.readFile(path.join(inboxDir, f), "utf8")); } catch { continue; }
    const fm = parsed.data || {};
    if (fm.type !== "email-thread" || fm.last_from !== "me") continue;
    if (fm.last_msg_iso && new Date(fm.last_msg_iso).getTime() < cutoff) continue;
    const blocks = String(parsed.content || "").split(/^## /m).filter((b) => b.trim());
    let snippet = "";
    if (blocks.length) {
      const last = blocks[blocks.length - 1];
      const nl = last.indexOf("\n");
      snippet = (nl >= 0 ? last.slice(nl + 1) : "").replace(/```text|```/g, "").trim().slice(0, 600);
    }
    pool.push({ subject: fm.subject || "", snippet, date_iso: fm.last_msg_iso || "" });
  }
  return pool;
}

/**
 * Orchestrate the out-of-thread match. Gated by the caller on the per-client flag. Returns
 * { nudges, proposed, belowFloor } — applyMatchVerdicts output. Fail-open: on any error
 * (no API key, API failure, empty pool) returns the nudges UNCHANGED (everything stays red
 * — a matcher failure must never clear a thread).
 */
export async function runReplyMatch(workTuple, nudges, opts = {}) {
  const floor = Number.isFinite(opts.floor) ? opts.floor : DEFAULT_FLOOR;
  const cap = Number.isInteger(opts.cap) ? opts.cap : 10;
  const candidates = selectMatchCandidates(nudges, { cap });
  if (candidates.length === 0) return { nudges, proposed: [], belowFloor: [] };
  if (!process.env.ANTHROPIC_API_KEY) {
    await log("warn", `reply-match client=${workTuple.client_slug} skipped: no ANTHROPIC_API_KEY (nudges unchanged)`);
    return { nudges, proposed: [], belowFloor: [] };
  }
  try {
    const pool = await gatherSentPool(workTuple.client_dir, opts.now || new Date().toISOString());
    const prompt = buildMatchPrompt(candidates, pool);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const res = await client.messages.create({
      model: MATCH_MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
    const text = (res.content || []).map((b) => b.text || "").join("");
    const verdicts = parseVerdicts(text);
    const result = applyMatchVerdicts(nudges, verdicts, floor);
    const eligibleReds = (nudges || []).filter((n) => n.tier === "red" && n.kind === "awaiting_you").length;
    const unchecked = Math.max(0, eligibleReds - candidates.length);
    // reds_total/unchecked make the cap-10 truncation EXPLICIT (Triple Threat PM/NSA/CONDUIT):
    // reds 11+ stay red and still render, but they were NOT AI-checked this run — surface it.
    await log(
      "info",
      `metric=reply_match client=${workTuple.client_slug} reds_total=${eligibleReds} candidates=${candidates.length} unchecked=${unchecked} pool=${pool.length} matched=${result.proposed.length} below_floor=${result.belowFloor.length}`,
    );
    return { ...result, unchecked };
  } catch (err) {
    await log("error", `reply-match client=${workTuple.client_slug} FAILED (nudges unchanged): ${err.message}`);
    return { nudges, proposed: [], belowFloor: [] };
  }
}

/**
 * Persist AI suggestions to the ledger as `proposed_resolution` (audit + cross-run survival).
 * NEVER sets `resolved` — suggestion only; the human confirms. Idempotent re-write.
 */
export async function persistProposed(clientDir, proposed) {
  if (!proposed || !proposed.length) return 0;
  const ledgerPath = path.join(clientDir, "inbox", ".thread-status.jsonl");
  const ledger = await readLedgerMap(ledgerPath);
  let n = 0;
  for (const p of proposed) {
    const row = ledger.get(p.thread_id);
    if (row) { row.proposed_resolution = p.proposed_resolution; n++; }
  }
  if (n) await writeLedger(ledgerPath, ledger);
  return n;
}
