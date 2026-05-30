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
  const { client_slug, client_display, client_dir } = workTuple;
  const allPaths = [...phase2Summary.new_thread_paths, ...phase2Summary.merged_thread_paths];
  if (allPaths.length === 0) {
    await log("info", `phase3 client=${client_slug} no new material; skipping brief`);
    return { brief_path: null, action_items_added: 0, inferred_count: 0 };
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
  const briefMarkdown = normalizeWikilinks(rawBriefMarkdown, clientVaultPath);

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
Just the markdown brief, starting with the YAML frontmatter and ending with the closing </details>. No commentary before or after.`;

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
   - Source: <your-related-note> — "<verbatim quote, max 200 chars>"
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

- **<filename>** (<your-related-note>) — <2-sentence summary>

## Full Action Queue (added this scan)

- [ ] **<action>** — owner: <name>, due: <YYYY-MM-DD>
  Source: <your-related-note> — "<verbatim quote>"

## New Threads This Scan

- <your-related-note> — <subject>

</details>
\`\`\`

CRITICAL GROUNDING RULES (PATCH D24 from the orchestrator spec):
- Every action item MUST cite a source thread note via <your-related-note>
- Include a verbatim source_quote (≤200 chars, copied EXACTLY from a thread body) whenever possible
- If no verbatim quote exists for an action, mark it *(inferred)* — never drop it silently
- The 3 MOVES are the TOP 3 highest priority. Selection criteria (ranked):
  1. Explicit asks/commitments from sender directed at <your-name>
  2. Deadlines (today, this week)
  3. Decisions <your-name> owes someone
  4. Big-dollar / strategic items
- Email content goes through <your-name>'s analytical lens — paraphrase, don't quote verbatim except in source_quote fields and attachment summaries
- Use wikilinks for source notes: \`<your-related-note>\` — strip the .md extension. A post-processor will rewrite these to full vault-root paths so Obsidian can resolve them; if your link starts with \`inbox/\`, \`attachments/\`, or a bare \`YYYY-MM-DD_\` basename, the post-processor handles it. You do NOT need to write the full client path.`;

// ----- Wikilink normalization --------------------------------------------

/**
 * Rewrite folder-prefixed brief wikilinks to vault-root paths that Obsidian
 * can resolve.
 *
 * The synthesis LLM tends to write any of these broken forms:
 *   - <your-related-note>                      — folder-relative
 *   - <your-related-note>          — folder-relative
 *   - <your-related-note> — parent-relative
 *
 * Obsidian wikilinks resolve only by (a) basename when unique or (b) full
 * vault-root path. The forms above don't match either, so they show up as
 * broken-link findings even though the target file exists.
 *
 * Rewrites applied when clientVaultPath is provided:
 *   <your-related-note>                → <your-related-note>
 *   <your-related-note>             → <your-related-note>
 *   <your-related-note>          → <your-related-note>
 *   <your-related-note> → <your-related-note>
 *
 * Pass-through cases (intentional):
 *   - Empty targets `[[]]` (separate known defect)
 *   - Wikilinks already starting with `context/`, `_views/`, etc. — assumed
 *     already vault-root-rooted
 *   - Any basename-only wikilink — could be a brief (`<your-related-note>`),
 *     a hub ref (`<your-related-note>`), a GOU/pattern slug, etc. Auto-
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
    return `<your-related-note>`;
  });
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

  // Parse each "- [ ] **action** — owner: X, due: Y\n  Source: <your-related-note> — \"quote\"" block
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
      `- [ ] **${a.action}** — owner: ${a.owner}, due: ${a.due}${inferredMark}\n  Source: <your-related-note>${quoteLine}\n`,
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
