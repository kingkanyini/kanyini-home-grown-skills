// Phase 3 — Brief synthesis.
// Gathers new/merged thread notes + extracted attachment text + cumulative context,
// asks Claude (via Anthropic SDK) to produce a brief in the canonical template,
// writes the brief to vault, appends action items to tasks.md.

import { promises as fs } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import {
  atomicWrite,
  todayIso,
  nowIsoUtc,
  log,
  VAULT_ROOT,
} from "./util.js";

const DEFAULT_MODEL = process.env.INBOX_DIGEST_MODEL || "claude-sonnet-4-5";
const MAX_INPUT_CHARS = 200_000; // ~50K tokens budget for the bundle

/**
 * Phase 3 entry. Returns {brief_path, action_items_added}.
 * If there's no new material, returns {brief_path: null, ...}.
 */
export async function runPhase3(workTuple, phase2Summary, options = {}) {
  const dryRun = !!options.dryRun;
  const nudges = options.nudges || [];
  const archived = options.archived || 0;
  const meetings = options.meetings || [];
  const drafter = options.drafter || null;
  const slackNotes = options.slack || []; // Sentinel: touched Slack notes summary (phase2b)
  const timezone = workTuple.timezone || "UTC";
  const { client_slug, client_display, client_dir } = workTuple;
  const allPaths = [...phase2Summary.new_thread_paths, ...phase2Summary.merged_thread_paths];

  if (allPaths.length === 0) {
    // No new mail. If there are active nudges, drafter activity, OR new Slack
    // activity, render a deterministic brief with NO LLM call (and no API key
    // required). Otherwise skip entirely.
    const drafterHasContent = !!(drafter && (drafter.drafts.length || drafter.dispositions.length || drafter.skipped.length || drafter.ceiling_hit));
    if (nudges.length === 0 && !drafterHasContent && slackNotes.length === 0) {
      await log("info", `phase3 client=${client_slug} no new material, no nudges; skipping brief`);
      return { brief_path: null, action_items_added: 0, inferred_count: 0 };
    }
    return await writeNudgeOnlyBrief({ client_slug, client_display, client_dir, nudges, archived, drafter, slackNotes, dryRun });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY not set — add to ~/.claude/.env (e.g., ANTHROPIC_API_KEY=sk-ant-...)",
    );
  }

  // 3.1 — load the bundle
  const bundle = await loadBundle(client_dir, allPaths);
  await log(
    "info",
    `phase3 client=${client_slug} bundle threads=${bundle.threads.length} extracted=${bundle.extracted.length} chars=${bundle.totalChars}`,
  );

  // 3.2 — call Claude
  const rawBriefMarkdown = await synthesize(bundle, {
    clientSlug: client_slug,
    clientDisplay: client_display,
    date: todayIso(),
  });

  // 3.2.5 — normalize wikilinks to vault-root paths so Obsidian can resolve
  // them. Inbox captures aren't unique by basename across clients (the same
  // email may be captured in multiple inboxes), so basename-only links collide
  // — full vault-root paths are the only safe form.
  const clientVaultPath = path
    .relative(VAULT_ROOT, client_dir)
    .replace(/\\/g, "/");
  // Inject the deterministic 📅 SCHEDULE + 📮 REPLY STATUS blocks BEFORE wikilink
  // normalization so their [[inbox/...]] links get rewritten like the rest of the brief.
  const topBlock = renderSchedule(meetings, timezone) + renderReplyStatus(nudges, archived) + renderReceivedFyi(nudges) + renderDraftsSection(drafter) + renderSlackSection(slackNotes, clientVaultPath);
  const withTop = injectReplyStatus(rawBriefMarkdown, topBlock);
  const briefMarkdown = normalizeWikilinks(withTop, clientVaultPath);

  // 3.3 — write the brief
  const briefDir = path.join(client_dir, "briefs");
  const briefName = `${todayIso()}_brief.md`;
  let briefPath = path.join(briefDir, briefName);

  // Collision handling: if today's brief already exists with a different scan, suffix with HH-MM
  try {
    await fs.stat(briefPath);
    const now = new Date();
    const stamp = `${now.toISOString().slice(11, 16).replace(":", "-")}`;
    briefPath = path.join(briefDir, `${todayIso()}T${stamp}_brief.md`);
  } catch {
    // doesn't exist — good
  }

  if (!dryRun) {
    await atomicWrite(briefPath, briefMarkdown);
  }

  // 3.4 — append action items to tasks.md
  const actionItems = extractActionItems(briefMarkdown);
  const inferredCount = actionItems.filter((a) => a.inferred).length;
  if (!dryRun && actionItems.length > 0) {
    await appendTasks(client_dir, actionItems, client_slug);
  }

  await log(
    "info",
    `phase3 client=${client_slug} brief=${path.basename(briefPath)} action_items=${actionItems.length} inferred=${inferredCount}`,
  );

  return {
    brief_path: briefPath,
    action_items_added: actionItems.length,
    inferred_count: inferredCount,
  };
}

// ----- Bundle loading ----------------------------------------------------

async function loadBundle(clientDir, relPaths) {
  const threads = [];
  const extracted = [];
  let totalChars = 0;

  for (const rel of relPaths) {
    const abs = path.join(clientDir, rel);
    try {
      const text = await fs.readFile(abs, "utf8");
      threads.push({ path: rel, content: text });
      totalChars += text.length;
    } catch (err) {
      await log("warn", `phase3 could not read thread note ${rel}: ${err.message}`);
    }
  }

  // Also pull in any newly-extracted attachment .extracted.md files referenced in those threads
  for (const t of threads) {
    const extMatches = t.content.matchAll(/extracted:\s*["']([^"'\n]+\.extracted\.md)["']/g);
    for (const m of extMatches) {
      const extRel = m[1];
      const extAbs = path.join(clientDir, "inbox", extRel);
      try {
        const text = await fs.readFile(extAbs, "utf8");
        extracted.push({ path: extRel, content: text });
        totalChars += text.length;
      } catch {
        // Sibling extracted file may not exist (non-PDF). Fine.
      }
    }
  }

  // Truncate aggressively if over budget
  if (totalChars > MAX_INPUT_CHARS) {
    const ratio = MAX_INPUT_CHARS / totalChars;
    for (const t of threads) {
      const cap = Math.floor(t.content.length * ratio);
      if (t.content.length > cap) t.content = t.content.slice(0, cap) + "\n\n[truncated]";
    }
    for (const e of extracted) {
      const cap = Math.floor(e.content.length * ratio);
      if (e.content.length > cap) e.content = e.content.slice(0, cap) + "\n\n[truncated]";
    }
  }

  return { threads, extracted, totalChars };
}

// ----- LLM synthesis -----------------------------------------------------

async function synthesize(bundle, meta) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const bundleText = [
    ...bundle.threads.map(
      (t) => `=== THREAD NOTE: ${t.path} ===\n${t.content}\n`,
    ),
    ...bundle.extracted.map(
      (e) => `=== EXTRACTED ATTACHMENT: ${e.path} ===\n${e.content}\n`,
    ),
  ].join("\n");

  const userPrompt = `Generate the daily brief for client \`${meta.clientSlug}\` (${meta.clientDisplay}) for date ${meta.date}.

BUNDLE (new/merged threads + extracted attachments since last scan):

${bundleText}

OUTPUT:
Just the markdown brief, starting with the YAML frontmatter and ending with the closing </details>. No commentary before or after. Do NOT add a "REPLY STATUS" or "SCHEDULE" section — deterministic 📮 REPLY STATUS and 📅 SCHEDULE blocks are inserted automatically above TODAY'S 3 MOVES.`;

  // Prompt caching on the system prompt — ~500 tokens of identical instructions
  // every run. At 3 runs/day x 31 days that's ~46K tokens cached/month.
  const res = await withRetry(() =>
    client.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 8000,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userPrompt }],
    }),
  );

  // Log token usage for cost tracking
  if (res.usage) {
    await log(
      "info",
      `phase3 anthropic input=${res.usage.input_tokens} output=${res.usage.output_tokens} cache_read=${res.usage.cache_read_input_tokens || 0} cache_creation=${res.usage.cache_creation_input_tokens || 0}`,
    );
  }

  let text = (res.content || []).map((c) => c.text || "").join("");

  // Strip surrounding code fences if the model wrapped the output (Sonnet does
  // this ~5% of the time). Frontmatter validation below requires the response
  // to start with `---\n`.
  text = stripCodeFences(text).trim();

  if (!text || !text.startsWith("---")) {
    throw new Error(
      `Phase 3 model response did not start with YAML frontmatter (first 60 chars: ${text.slice(0, 60)})`,
    );
  }
  return text + "\n";
}

/**
 * Strip a single layer of triple-backtick code fences if the model wrapped
 * the entire response in them. Handles ```markdown, ```yaml, or unlabeled.
 */
function stripCodeFences(text) {
  const trimmed = text.trim();
  const m = trimmed.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```\s*$/);
  return m ? m[1] : trimmed;
}

/**
 * Exponential backoff for transient Anthropic API errors (429, 5xx, network).
 * Permanent errors (400, 401, 403) fail fast.
 */
async function withRetry(fn, { maxAttempts = 3, baseMs = 1000 } = {}) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = err && err.status;
      const transient = !status || status >= 500 || status === 429 || status === 408;
      if (!transient || attempt === maxAttempts) throw err;
      const delay = baseMs * Math.pow(2, attempt - 1);
      await log(
        "warn",
        `phase3 anthropic transient err status=${status || "?"} attempt=${attempt}/${maxAttempts}; retrying in ${delay}ms`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

const SYSTEM_PROMPT = `You are inbox-digest's brief generator. Produce a per-client daily brief in this exact markdown structure:

\`\`\`
---
type: client-brief
client: <client_slug>
date: "<YYYY-MM-DD>"
threads_scanned: <N>
new_threads: <N>
new_messages: <N>
attachments_pulled: <N>
action_items_added: <N>
inferred_action_items: <N>
---

# <Client Display> — <YYYY-MM-DD> Brief

## ⚡ TODAY'S 3 MOVES

> The 3 highest-priority next actions. Open the full brief below if you need context.

1. **<action>**
   - Why: <reason>
   - Source: [[<note-slug>]] — "<verbatim quote, max 200 chars>"
   - Owner: <your-name> | Due: <YYYY-MM-DD or "asap">

2. **<action>**
   ...

3. **<action>**
   ...

---

> Items marked *(inferred)* lacked a verifiable source quote — verify before acting.

<details>
<summary>Full brief (click to expand)</summary>

## TL;DR

- <3-5 bullets capturing what changed this scan>

## Key Points by Sender

### <Sender Name>
- <max 5 paraphrased bullets per sender>

## Attachments Referenced

- **<filename>** ([[<path>]]) — <2-sentence summary>

## Full Action Queue (added this scan)

- [ ] **<action>** — owner: <name>, due: <YYYY-MM-DD>
  Source: [[<note-slug>]] — "<verbatim quote>"

## New Threads This Scan

- [[<path>]] — <subject>

</details>
\`\`\`

CRITICAL GROUNDING RULES (PATCH D24 from the orchestrator spec):
- Every action item MUST cite a source thread note via [[wikilink]]
- Include a verbatim source_quote (≤200 chars, copied EXACTLY from a thread body) whenever possible
- If no verbatim quote exists for an action, mark it *(inferred)* — never drop it silently
- The 3 MOVES are the TOP 3 highest priority. Selection criteria (ranked):
  1. Explicit asks/commitments from sender directed at <your-name>
  2. Deadlines (today, this week)
  3. Decisions <your-name> owes someone
  4. Big-dollar / strategic items
- Email content goes through <your-name>'s analytical lens — paraphrase, don't quote verbatim except in source_quote fields and attachment summaries
- Use wikilinks for source notes: \`[[2026-05-12_subject-slug]]\` — strip the .md extension. A post-processor will rewrite these to full vault-root paths so Obsidian can resolve them; if your link starts with \`inbox/\`, \`attachments/\`, or a bare \`YYYY-MM-DD_\` basename, the post-processor handles it. You do NOT need to write the full client path.`;

// ----- Wikilink normalization --------------------------------------------

/**
 * Rewrite folder-prefixed brief wikilinks to vault-root paths that Obsidian
 * can resolve.
 *
 * The synthesis LLM tends to write any of these broken forms:
 *   - [[inbox/2026-05-14_slug]]                      — folder-relative
 *   - [[attachments/2026-04-13_offer/file]]          — folder-relative
 *   - [[../inbox/attachments/2026-04-13_offer/file]] — parent-relative
 *
 * Obsidian wikilinks resolve only by (a) basename when unique or (b) full
 * vault-root path. The forms above don't match either, so they show up as
 * broken-link findings even though the target file exists.
 *
 * Rewrites applied when clientVaultPath is provided:
 *   [[inbox/<...>]]                → [[<clientVaultPath>/inbox/<...>]]
 *   [[../inbox/<...>]]             → [[<clientVaultPath>/inbox/<...>]]
 *   [[attachments/<...>]]          → [[<clientVaultPath>/inbox/attachments/<...>]]
 *   [[../inbox/attachments/<...>]] → [[<clientVaultPath>/inbox/attachments/<...>]]
 *
 * Pass-through cases (intentional):
 *   - Empty targets `[[]]` (separate known defect)
 *   - Wikilinks already starting with `context/`, `_views/`, etc. — assumed
 *     already vault-root-rooted
 *   - Any basename-only wikilink — could be a brief (`[[2026-05-11_brief]]`),
 *     a hub ref (`[[<example-client>]]`), a GOU/pattern slug, etc. Auto-
 *     prepending a folder guesses wrong about half the time. Obsidian's
 *     basename resolution handles unique cases; ambiguous ones become broken-
 *     link findings, which is correct behavior.
 *   - Anchor (#section, ^block) and alias (|Display) suffixes preserved
 *
 * Pure function. Exported for testability.
 */
export function normalizeWikilinks(markdown, clientVaultPath) {
  if (typeof markdown !== "string" || markdown.length === 0) return markdown;
  if (!clientVaultPath) return markdown;
  const prefix = clientVaultPath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
  if (!prefix) return markdown;

  return markdown.replace(/\[\[([^\]\n]+)\]\]/g, (full, body) => {
    const aliasIdx = body.indexOf("|");
    const target = aliasIdx === -1 ? body : body.slice(0, aliasIdx);
    const aliasSuffix = aliasIdx === -1 ? "" : body.slice(aliasIdx);
    const anchorMatch = target.match(/[#^]/);
    const anchorIdx = anchorMatch ? target.indexOf(anchorMatch[0]) : -1;
    const rawPath = anchorIdx === -1 ? target : target.slice(0, anchorIdx);
    const anchor = anchorIdx === -1 ? "" : target.slice(anchorIdx);

    if (!rawPath) return full;

    // Strip leading `../` chunks — broken either way; the rest tells intent.
    const p = rawPath.replace(/^(\.\.\/)+/, "");

    let rewritten = null;
    if (p.startsWith("attachments/")) {
      rewritten = `${prefix}/inbox/${p}`;
    } else if (p.startsWith("inbox/")) {
      rewritten = `${prefix}/${p}`;
    } else {
      return full; // basename-only or already vault-root-rooted — leave alone
    }
    return `[[${rewritten}${anchor}${aliasSuffix}]]`;
  });
}

// ----- Meeting / schedule rendering (deterministic — never LLM) ----------

/** Format an ICS start object for display in the client's timezone (best-effort, honest). */
function formatWhen(start, timeZone) {
  if (!start) return "time TBD";
  try {
    if (start.dateOnly) {
      const d = new Date((start.iso || start.walltime + "Z"));
      return new Intl.DateTimeFormat("en-US", { timeZone: start.iso ? timeZone : "UTC", weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(d) + " (all day)";
    }
    if (start.iso) {
      // True UTC instant — safe to convert to the client's tz.
      return new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(new Date(start.iso));
    }
    // TZID/floating — show the wall-clock time as stated + its tz label (no reconversion).
    const d = new Date(start.walltime + "Z");
    const base = new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
    return start.tzid ? `${base} (${start.tzid})` : base;
  } catch {
    return start.walltime || "time TBD";
  }
}

function locationText(loc) {
  if (!loc) return null;
  if (/zoom\.us/i.test(loc)) return `[Zoom](${loc.split(/\s/)[0]})`;
  if (/meet\.google/i.test(loc)) return `[Google Meet](${loc.split(/\s/)[0]})`;
  if (/^https?:\/\//i.test(loc)) return `[link](${loc.split(/\s/)[0]})`;
  return loc.slice(0, 80);
}

const MEETING_EMOJI = { invite: "📅", update: "🔄", cancel: "❌", rsvp: "✅" };
const MEETING_VERB = { invite: "New meeting", update: "Updated", cancel: "CANCELLED", rsvp: "RSVP" };

/**
 * Render the 📅 SCHEDULE section from meeting mail seen this scan. Dedupes by
 * title+start (latest message wins, so a later cancellation supersedes its invite),
 * sorts by start time, and surfaces date/time/location so <your-name> sees his schedule.
 */
export function renderSchedule(meetings, timeZone) {
  if (!meetings || meetings.length === 0) return "";
  const byKey = new Map();
  for (const m of meetings) {
    const key = `${(m.title || "").toLowerCase()}|${(m.start && m.start.walltime) || ""}`;
    const prev = byKey.get(key);
    if (!prev || (m.received_iso || "") > (prev.received_iso || "")) byKey.set(key, m);
  }
  const items = [...byKey.values()].sort((a, b) => {
    const sa = (a.start && (a.start.iso || a.start.walltime)) || "";
    const sb = (b.start && (b.start.iso || b.start.walltime)) || "";
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });

  const lines = ["## 📅 SCHEDULE", "", "> Meeting mail from this scan. Add to your calendar / RSVP as needed.", ""];
  for (const m of items) {
    const emoji = MEETING_EMOJI[m.kind] || "📅";
    const verb = MEETING_VERB[m.kind] || "Meeting";
    let when = formatWhen(m.start, timeZone);
    if (when === "time TBD" && m.display_when) when = m.display_when;
    const who = m.from_me ? "you" : (m.sender || "?");
    let line = `- ${emoji} **${verb}: ${m.title}** — ${when}`;
    const loc = locationText(m.location);
    if (loc) line += ` · ${loc}`;
    line += `\n  from ${who}`;
    if (m.note_path) line += ` · [[${m.note_path.replace(/\.md$/, "")}]]`;
    lines.push(line);
  }
  lines.push("");
  return lines.join("\n");
}

// ----- Reply-status rendering (deterministic — never LLM) ----------------

const TIER_EMOJI = { red: "🔴", yellow: "🟡", blue: "🔵" };
const KIND_LABEL = {
  awaiting_you: "Reply overdue",
  heads_up: "Heads-up — reply soon",
  promised: "You promised",
  chase: "Waiting on them",
  courtesy: "Likely no reply needed",
  unknown: "Reply from unknown sender",
};
const REPLY_STATUS_CAP = 7;

/** Build a markdown link to the Gmail thread, escaping the subject for link text. */
function nudgeLine(n) {
  const subj = (n.subject || "(no subject)").replace(/[[\]]/g, "");
  const note = n.note_path ? n.note_path.replace(/\.md$/, "") : null;
  const ageWord =
    n.kind === "chase" || n.kind === "promised" ? `${n.age_hours}h since you wrote` : `${n.age_hours}h since their message`;
  let line = `- ${TIER_EMOJI[n.tier]} **${KIND_LABEL[n.kind] || n.kind}** — [${subj}](${n.deep_link}) · ${ageWord}`;
  if (n.kind === "promised" && n.commitment_sentence) {
    line += `\n  📌 *(inferred)* you wrote: "${n.commitment_sentence}"`;
  }
  if (note) line += `\n  [[${note}]]`;
  return line;
}

/**
 * Render the 📮 REPLY STATUS section. Hard cap ~7 items, BUT red (overdue) is never
 * truncated — only yellow/blue roll up into "…N more". This is the eviction guarantee:
 * a hard-tier principal 🔴 can never be pushed out of view by courtesy/unknown noise.
 */
// Matches at/above the AI floor (0.7) but below this get a plain-words "loose match" hint.
const LIKELY_HANDLED_LOOSE = 0.8;

/** Trim a quote to ≤maxWords with a mid-sentence ellipsis so it never reads as finished. */
function clampQuote(q, maxWords = 12) {
  const words = String(q || "").trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(" ");
  return words.slice(0, maxWords).join(" ") + "…";
}

/**
 * ✅ Likely handled block — Phase 2 AI suggestions you likely answered out-of-thread.
 * SUGGEST-ONLY: shown for a one-glance verify, never auto-resolved. Rendered as a
 * sub-section UNDER the REPLY STATUS H2 (CONDUIT passthrough-safe — no new top-level ##),
 * BELOW the reds (triage: overdue work first), and NEVER truncated. Status is carried in
 * TEXT ("Likely handled"); the ✅ is decorative (a11y — Watson). Sisters+NSA gate 2026-06-29.
 */
function renderLikelyHandled(covered) {
  if (!covered || covered.length === 0) return [];
  const out = [
    "",
    `### ✅ Likely handled — verify (${covered.length})`,
    "",
    "> You likely answered these in a separate email — confirm and close.",
    "",
  ];
  for (const n of covered) {
    const subj = (n.subject || "(no subject)").replace(/[[\]]/g, "");
    const note = n.note_path ? n.note_path.replace(/\.md$/, "") : null;
    const quote = clampQuote(n.match && n.match.quote);
    const loose = n.match && n.match.confidence < LIKELY_HANDLED_LOOSE ? " *(loose match — worth a glance)*" : "";
    let line = `- Likely handled — [${subj}](${n.deep_link}) — you replied: "${quote}"${loose}`;
    if (note) line += `\n  [[${note}]]`;
    out.push(line);
  }
  return out;
}

export function renderReplyStatus(nudges, archived = 0) {
  // fyi-tier items render in their own 📥 Received(FYI) section, never here.
  const all = (nudges || []).filter((n) => n.tier !== "fyi");
  // likely_covered render in a dedicated never-truncated block (renderLikelyHandled) BELOW
  // the reds — partitioned OUT here so they never compete for the cap budget and never
  // inflate the "…N more" rollup (Sisters+NSA gate 2026-06-29; was the production bug).
  const covered = all.filter((n) => n.kind === "likely_covered");
  const items = all.filter((n) => n.kind !== "likely_covered");
  if (items.length === 0 && covered.length === 0 && !archived) return "";
  const red = items.filter((n) => n.tier === "red");
  const rest = items.filter((n) => n.tier !== "red");
  const restBudget = Math.max(0, REPLY_STATUS_CAP - red.length);
  const restShown = rest.slice(0, restBudget);
  const shown = [...red, ...restShown];
  const more = rest.length - restShown.length; // rest excludes red AND covered — no double-count

  const lines = ["## 📮 REPLY STATUS", ""];
  if (red.length > 3) {
    lines.push(`> ${red.length} threads are overdue for your reply — all shown (this is intentional).`, "");
  }
  for (const n of shown) lines.push(nudgeLine(n));
  if (more > 0) lines.push(`- …and ${more} more lower-priority item(s) — see thread notes.`);
  lines.push(...renderLikelyHandled(covered));
  if (archived > 0) lines.push("", `> Auto-muted ${archived} stale thread(s) — no reply in 14 days.`);
  lines.push("");
  return lines.join("\n");
}

/**
 * Render the 📥 Received (FYI) section — forwards / calendar invites that demoted out of
 * the red list (reply-classifier v2). Collapsed by default (Eyal: count chip, not 20
 * inline line-items) so it informs without rebuilding the noise it replaced. These
 * auto-clear after 3 days via expireFyiRows; a new inbound re-arms them to 🔴.
 */
export function renderReceivedFyi(nudges) {
  const fyi = (nudges || []).filter((n) => n.tier === "fyi");
  if (fyi.length === 0) return "";
  const lines = [
    "<details>",
    `<summary>📥 Received (FYI): ${fyi.length} — forwards/invites, no reply needed (auto-clears in 3 days)</summary>`,
    "",
  ];
  for (const n of fyi) {
    const subj = (n.subject || "(no subject)").replace(/[[\]]/g, "");
    const note = n.note_path ? n.note_path.replace(/\.md$/, "") : null;
    let line = `- [${subj}](${n.deep_link})`;
    if (note) line += ` [[${note}]]`;
    lines.push(line);
  }
  lines.push("", "</details>", "");
  return lines.join("\n");
}

// ----- Drafts rendering (deterministic — never LLM) -----------------------

/** Deterministic 📝 DRAFTS block — no LLM involvement. */
export function renderDraftsSection(drafter) {
  if (!drafter) return "";
  const { drafts = [], dispositions = [], skipped = [], ceiling_hit = false } = drafter;
  const pendingDispo = dispositions.filter((d) => d.status === "pending");
  const resolvedDispo = dispositions.filter((d) => d.status !== "pending");
  if (drafts.length === 0 && dispositions.length === 0 && skipped.length === 0 && !ceiling_hit) return "";

  const lines = ["## 📝 DRAFTS", ""];
  if (ceiling_hit) {
    lines.push("> ⚠️ **Draft ceiling hit this run** — some eligible replies were NOT drafted. They will be retried next run.", "");
  }
  if (drafts.length > 0) {
    lines.push(`**Awaiting review (${drafts.length})** — open, edit if needed, hit send:`);
    for (const d of drafts) {
      const subj = (d.subject || "(no subject)").replace(/[[\]]/g, "");
      const flag = d.adopted ? " _(recovered from a previous run)_" : "";
      lines.push(`- **${d.recipient}** — ${subj}${flag} → [open draft](${d.deep_link})`);
    }
    lines.push("");
  }
  if (pendingDispo.length > 0) {
    lines.push("**Still pending from earlier runs:**");
    for (const d of pendingDispo) {
      const subj = (d.subject || "(no subject)").replace(/[[\]]/g, "");
      lines.push(`- ⏳ pending ${d.age_days}d — **${d.recipient}** — ${subj}`);
    }
    lines.push("");
  }
  if (resolvedDispo.length > 0) {
    lines.push("**Resolved since last brief:**");
    for (const d of resolvedDispo) {
      const subj = (d.subject || "(no subject)").replace(/[[\]]/g, "");
      const icon = d.status === "sent" ? "✅ sent" : d.status === "edited" ? "✏️ edited & sent" : "🗑 discarded";
      lines.push(`- ${icon} — **${d.recipient}** — ${subj}`);
    }
    lines.push("");
  }
  if (skipped.length > 0) {
    // Newsletter audiences produce hundreds of skips per scan — aggregate by
    // reason and show a small sample, or the brief drowns in suppressed mail.
    const SKIP_SAMPLE_MAX = 10;
    const byReason = {};
    for (const s of skipped) byReason[s.reason] = (byReason[s.reason] || 0) + 1;
    const histogram = Object.entries(byReason)
      .sort((a, b) => b[1] - a[1])
      .map(([reason, n]) => `${reason}: ${n}`)
      .join(" · ");
    lines.push(`<details><summary>Tracked, no draft (${skipped.length} — ${histogram})</summary>`, "");
    for (const s of skipped.slice(0, SKIP_SAMPLE_MAX)) {
      const subj = (s.subject || "(no subject)").replace(/[[\]]/g, "");
      lines.push(`- ${s.sender} — ${subj} — tracked, no draft (${s.reason})`);
    }
    if (skipped.length > SKIP_SAMPLE_MAX) {
      lines.push(`- _…and ${skipped.length - SKIP_SAMPLE_MAX} more (see op log for the full list)_`);
    }
    lines.push("", "</details>", "");
  }
  return lines.join("\n") + "\n";
}

/** Insert the REPLY STATUS block just above TODAY'S 3 MOVES (or after the H1 title). */
export function injectReplyStatus(markdown, block) {
  if (!block) return markdown;
  const marker = "## ⚡ TODAY'S 3 MOVES";
  const idx = markdown.indexOf(marker);
  if (idx >= 0) return markdown.slice(0, idx) + block + "\n" + markdown.slice(idx);
  // Fallback: after the first H1 line.
  const h1 = markdown.match(/^# .+$/m);
  if (h1) {
    const at = markdown.indexOf(h1[0]) + h1[0].length;
    return markdown.slice(0, at) + "\n\n" + block + markdown.slice(at);
  }
  return markdown + "\n\n" + block;
}

/**
 * Deterministic 💬 SLACK ACTIVITY block for the brief (Sentinel spec §3 step 5 —
 * the interleave surface for Slack items). mirror:false threads render with ZERO
 * quoted text (spec §4 <your-username>-<example-client> rule, enforced at every render surface).
 */
const SLACK_LANE_EMOJI = { finance: "🟡", people: "🟢", ai: "🔵", funnel: "🟣", cx: "⚪" };
export function renderSlackSection(slackNotes, clientVaultPath) {
  if (!slackNotes || slackNotes.length === 0) return "";
  const lines = ["## 💬 SLACK ACTIVITY", ""];
  for (const n of slackNotes) {
    const lane = n.lane ? `${SLACK_LANE_EMOJI[n.lane] || ""} ` : "";
    const noteSlug = String(n.rel || "").replace(/^slack\//, "").replace(/\.md$/, "");
    const link = noteSlug ? ` → [[${clientVaultPath}/slack/${noteSlug}]]` : "";
    const label =
      n.mirror === false
        ? "1:1 thread activity (details in channel)"
        : String(n.subject || "(no text)").replace(/[[\]`]/g, "").slice(0, 100);
    const who = n.last_from === "them" ? "" : n.last_from === "me" ? " _(you replied last)_" : "";
    lines.push(`- ${lane}**#${n.channel_name}** — ${label}${who}${link}`);
  }
  lines.push("");
  return lines.join("\n") + "\n";
}

/** Render + write a deterministic nudge-only brief (no new mail, but active nudges or Slack activity). No LLM. */
async function writeNudgeOnlyBrief({ client_slug, client_display, client_dir, nudges, archived, drafter = null, slackNotes = [], dryRun }) {
  const date = todayIso();
  const red = nudges.filter((n) => n.tier === "red");
  const yellow = nudges.filter((n) => n.tier === "yellow");
  const moves = [...red, ...yellow].slice(0, 3);

  const fm = [
    "---",
    "type: client-brief",
    `client: ${client_slug}`,
    `date: "${date}"`,
    "threads_scanned: 0",
    "new_threads: 0",
    "new_messages: 0",
    "attachments_pulled: 0",
    "action_items_added: 0",
    "inferred_action_items: 0",
    `reply_status_nudges: ${nudges.length}`,
    "nudge_only: true",
    "---",
    "",
  ].join("\n");

  const moveLines =
    moves.length > 0
      ? moves
          .map((n, i) => {
            const subj = (n.subject || "(no subject)").replace(/[[\]]/g, "");
            return `${i + 1}. **Reply: ${subj}** ([open thread](${n.deep_link})) — ${n.age_hours}h, ${n.tier === "red" ? "overdue" : "due soon"}`;
          })
          .join("\n")
      : "_No overdue replies — follow-ups only. See REPLY STATUS below._";

  const clientVaultPath = path.relative(VAULT_ROOT, client_dir).replace(/\\/g, "/");

  const body = [
    `# ${client_display} — ${date} Brief`,
    "",
    slackNotes.length
      ? "> No new mail since last scan — reply status + Slack activity below."
      : "> No new mail since last scan. This brief is reply-status only.",
    "",
    "## ⚡ TODAY'S 3 MOVES",
    "",
    moveLines,
    "",
    renderReplyStatus(nudges, archived) + renderReceivedFyi(nudges) + renderDraftsSection(drafter) + renderSlackSection(slackNotes, clientVaultPath),
  ].join("\n");
  const briefMarkdown = normalizeWikilinks(fm + body, clientVaultPath);

  const briefDir = path.join(client_dir, "briefs");
  let briefPath = path.join(briefDir, `${date}_brief.md`);
  try {
    await fs.stat(briefPath);
    const stamp = new Date().toISOString().slice(11, 16).replace(":", "-");
    briefPath = path.join(briefDir, `${date}T${stamp}_brief.md`);
  } catch {
    /* doesn't exist — good */
  }

  if (!dryRun) await atomicWrite(briefPath, briefMarkdown);
  await log("info", `phase3 client=${client_slug} nudge-only brief=${path.basename(briefPath)} nudges=${nudges.length}`);
  return { brief_path: briefPath, action_items_added: 0, inferred_count: 0, nudge_only: true };
}

// ----- Action item extraction --------------------------------------------

function extractActionItems(briefMd) {
  const items = [];
  // Look for the Full Action Queue section
  const sectionMatch = briefMd.match(
    /## Full Action Queue[^\n]*\n([\s\S]*?)(?=\n## |\n<\/details>|$)/,
  );
  if (!sectionMatch) return items;
  const section = sectionMatch[1];

  // Parse each "- [ ] **action** — owner: X, due: Y\n  Source: [[path]] — \"quote\"" block
  const itemRe = /-\s*\[\s*\]\s*\*\*([^*]+)\*\*\s*—\s*owner:\s*([^,\n]+),\s*due:\s*([^\n]+)(?:\s*\n\s*Source:\s*\[\[([^\]]+)\]\](?:\s*—\s*"([^"]+)")?)?/g;
  let m;
  while ((m = itemRe.exec(section))) {
    const inferred = m[1].includes("(inferred)") || (m[0].includes("*(inferred)*"));
    items.push({
      action: m[1].trim(),
      owner: m[2].trim(),
      due: m[3].trim(),
      source_note: (m[4] || "").trim(),
      source_quote: (m[5] || "").trim(),
      inferred,
    });
  }
  return items;
}

async function appendTasks(clientDir, actionItems, clientSlug) {
  const tasksPath = path.join(clientDir, "tasks.md");
  let existing = "";
  try {
    existing = await fs.readFile(tasksPath, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") {
      existing = `# Tasks — ${clientSlug}\n\n> Action items extracted from emails by /inbox-digest. Append-only ledger.\n\n## Open Action Items\n\n`;
    } else {
      throw err;
    }
  }

  // Dedup: if an action with the same source_note already exists, skip
  const newBlocks = [];
  const stamp = todayIso();
  newBlocks.push(`\n### From ${stamp} digest\n`);
  for (const a of actionItems) {
    const dupKey = `${a.action}|${a.source_note}`;
    if (existing.includes(a.action) && existing.includes(a.source_note)) {
      continue;
    }
    const inferredMark = a.inferred ? " *(inferred)*" : "";
    const quoteLine = a.source_quote ? ` — "${a.source_quote}"` : "";
    newBlocks.push(
      `- [ ] **${a.action}** — owner: ${a.owner}, due: ${a.due}${inferredMark}\n  Source: [[${a.source_note}]]${quoteLine}\n`,
    );
  }
  if (newBlocks.length === 1) {
    // No new items after dedup
    return;
  }

  // Insert before "## Completed" if present, else append
  const completedIdx = existing.indexOf("\n## Completed");
  let updated;
  if (completedIdx >= 0) {
    updated = existing.slice(0, completedIdx) + newBlocks.join("") + existing.slice(completedIdx);
  } else {
    updated = existing.trimEnd() + "\n" + newBlocks.join("");
  }
  await atomicWrite(tasksPath, updated);
}
