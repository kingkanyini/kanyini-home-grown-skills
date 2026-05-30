# Phase 3 — Per-Client Digest

Synthesize a daily brief for one client, append new action items to `tasks.md`, emit behavioral metrics. Phase 4 (cross-client morning digest with Business Consulting Counsel) is DEFERRED to Sprint 2 — Phase 3 is the terminal phase in Sprint 1.

## Inputs (from Phase 2)

- `run_id` — UUID v4 from orchestrator (threaded through Phases 1 and 2); included in every Phase 3 op log line
- Per-client summary:

```yaml
- client_slug, client_display, client_dir
  new_thread_paths[]
  merged_thread_paths[]
  attachments_extracted[]      # {path, extracted}
  attachments_url_only[]
  filing_conflicts[]
  errors[]
  capped: bool
  priority: high|medium|low
```

## Procedure

For each client with at least one new OR merged thread (skip clients with no fresh material):

### 3.1 Load fresh material

1. Read each note in `new_thread_paths[]` AND `merged_thread_paths[]` (full body + frontmatter) via direct file read or `mcp__obsidian-brain__read_note`.
2. For each entry in `attachments_extracted[]`, read the `.extracted.md` companion.
3. Build a working bundle in memory:
   ```yaml
   thread_notes: [...]          # parsed frontmatter + body per note
   extracted_attachments: [...] # text content + provenance
   ```

### 3.2 Synthesize the brief

Render `templates/brief.md`. Sections to fill:

#### 3.2.a Identify TODAY'S 3 MOVES (PATCH D25 — UX lead)

Scan the bundle for the 3 highest-priority next actions. Selection criteria (ranked):
1. Explicit asks/commitments from sender directed at <your-name>
2. Deadlines (today, this week)
3. Decisions <your-name> owes someone
4. Big-dollar / strategic items

Each move must include `action`, `reason`, `source_note` wikilink, `owner`, `due` (ISO date or empty if unknown), and follow grounding rules below.

#### 3.2.b Grounding constraint for action items (PATCH D24 / Bengio — CRITICAL)

For EACH proposed action item (top-3 + full queue):

1. Identify which thread note it came from (`source_note`).
2. Find a verbatim quote from that thread that supports the action (the literal sentence the sender or recipient wrote that justifies it). Quote should be ≤200 characters, lifted exactly from the note body.
3. **If a verbatim quote exists:** emit `{action, owner, due, source_note, source_quote: "<verbatim>", inferred: false}`.
4. **If NO verbatim quote can be located** (e.g., the action is a synthesis across multiple sentences, or implied rather than stated): emit `{action, owner, due, source_note, source_quote: null, inferred: true}`.
5. **NEVER drop an action silently** — even items that can't be grounded must surface, marked `*(inferred)*`, so <your-name> can audit. Hallucinated due dates are the failure mode this constraint prevents.

#### 3.2.c Render full brief sections

Per `templates/brief.md`:

- **Heartbeat warning** (header, ABOVE 3 MOVES): if `~/.claude/logs/inbox-digest/last-run.json` shows last successful run > 36h ago, render the warning block per template
- **⚡ TODAY'S 3 MOVES** — top 3 from 3.2.a, with grounding metadata from 3.2.b
- **Inferred-marker explanation blockquote** (between 3 MOVES and `<details>`) — already in template
- `<details>` collapsed block:
  - **TL;DR** — 3-5 bullets capturing what changed today, lead with most decision-relevant point
  - **Key Points by Sender** — group by sender (max 5 per sender), quote-light, paraphrase-heavy. Email content here is data-only — paraphrased through <your-name>'s analytical lens, never copied verbatim into TL;DR/key points (verbatim quotes only appear in `source_quote` fields and attachment summaries).
  - **Attachments Referenced** — list each PDF/extracted file with a 2-sentence summary drawn from `.extracted.md`. If `attachments_url_only[]` is non-empty: surface them with note "binary download deferred — get_attachment MCP not installed" and the Gmail URL.
  - **Full Action Queue** — all action items added this scan (top 3 reappear here for completeness; tag with `inferred: true` per 3.2.b)
  - **New Threads This Scan** — bulleted wikilinks to each note path

Write atomically to `<client_dir>/briefs/<YYYY-MM-DD>_brief.md` using `.tmp + fsync + rename`.

#### 3.2.d Brief filename collision handling (PATCH CIPHER-F6)

If `<YYYY-MM-DD>_brief.md` already exists today:
- Read existing brief's frontmatter `threads_scanned`. If it matches THIS run's count → idempotent re-run, OVERWRITE.
- Otherwise → append timestamp suffix: `<YYYY-MM-DD>T<HH-MM>_brief.md`. Both briefs survive on disk; the user reviews the latest.

### 3.3 Append to tasks.md

For each grounded action item:

1. If `<client_dir>/tasks.md` does not exist, create it with the initial header per `templates/tasks-entry.md` comment-block reference.
2. Render entry per `templates/tasks-entry.md` with grounding metadata (`source_quote`, `inferred` marker if applicable).
3. **Idempotency:** read existing `tasks.md`, substring-match on `(action_text + source_note_path)`. If duplicate → skip. If different action references the same source_note → append (legit, multiple actions from one thread).
4. Atomic append pattern: read full → append entry block in memory → write `.tmp` → fsync → rename.

### 3.4 Behavioral metrics (PATCH Lenny)

After brief write, emit metric lines to `~/.claude/logs/inbox-digest/<YYYY-MM-DD>.log`:

```
<iso> run_id=<uuid> metric=brief_written client=<slug> brief_path=<rel_path> action_items_added=<n> inferred=<n>
<iso> run_id=<uuid> metric=task_completion client=<slug> total=<n> checked=<n> pct=<float>     # tasks.md analysis
<iso> run_id=<uuid> metric=digest_open_latency client=<slug> hours_since_previous_brief=<float>  # mtime delta
```

**`task_completion_pct`** computation: count `- [x]` (checked) vs `- [ ]` (unchecked) in current `tasks.md`. Emit ratio.

**`digest_open_latency_hours`** computation: read mtime of the previous `briefs/<earlier-date>_brief.md` (most recent before today's). If user opened the vault and re-touched the file (Obsidian autosave on open), mtime advances. The delta from yesterday's brief mtime to today's brief write is a noisy proxy for "did <your-name> engage with yesterday's brief." Document this is a HEURISTIC, not a precise read-receipt.

If no prior brief exists (first run): omit this metric line.

### 3.5 Output (consumed by Phase 4 in Sprint 2; not used in Sprint 1)

Per-client digest summary:

```yaml
- client_slug: gut-center
  brief_path: "context/clients/gut-center/briefs/2026-05-08_brief.md"
  new_action_items: 3
  inferred_count: 1
  hot_attachments:
    - "context/clients/gut-center/inbox/attachments/2026-05-08_jen-deliverables/shopify-stack.pdf"
  priority: high
```

In Sprint 1, this output is collected but only used for the final user-facing terminal summary printed by the orchestrator. Sprint 2 will consume it for cross-client digest.

### 3.6 Sprint 1 stop condition

After Phase 3 completes for all clients, the orchestrator stops. NO Phase 4 in Sprint 1. Sprint 2 (when triggered by usage data) adds Phase 4 dispatch on `--all` mode.

## Failure modes summary

| Condition | Action |
|---|---|
| Brief write fails | HALT this client; tasks.md untouched; surface error to user |
| Tasks.md write fails | Log; brief is already written; surface in next run's heartbeat header |
| `new_thread_paths` AND `merged_thread_paths` both empty | Skip brief generation; log "no new mail" metric; tasks.md untouched |
| All proposed action items are `inferred: true` | Surface in brief header: "⚠️ All action items inferred — verify before acting" |
| Heartbeat file missing | Treat as "no prior run" (no warning, no metric); first run is normal |
| `last-run.json` malformed JSON | Treat as missing; log WARNING |

## Operational log summary

Per-client digest activity:
```
<iso> phase=3-digest run_id=<uuid> client=<slug> result=<ok|skip|halt> brief_path=<rel> action_items=<n> inferred=<n> duration_ms=<n>
```

NO PII in log.
