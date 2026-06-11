# Phase 2 — Fetch

For each work tuple from Phase 1, fetch threads, write per-thread notes (with body sanitization), download + extract attachments, apply Gmail label, atomically update `last_scan`.

## Inputs (from Phase 1)

- `run_id` — UUID v4 from orchestrator (threaded through Phase 1); included in every Phase 2 op log line
- A list of work tuples, each containing: `client_slug`, `client_display`, `query_string`, `window_start_iso`, `window_end_iso`, `priority`, `match_strategy`, `gmail_label`, `expected_account`, `client_dir`.

## Procedure

For each work tuple:

### 2.1 Fetch matching threads

1. Call `email-backend.search_threads(query_string, after_iso=window_start_iso, page_size=50)`. The adapter wraps the underlying MCP call in `with_backoff` and handles message-level → thread-level grouping internally.
2. **No pagination loop required** (v1.5 gongrzhe backend has no pagination — single MCP call returns up to 500 messages, the Gmail API hard limit, in one shot). The `page_size` argument is retained in the adapter signature for forward-compatibility with future paginating backends but is unused at the current MCP layer. Future backends with `nextPageToken` will absorb the loop inside the adapter.
3. If response includes `capped: true` (raw message count reached 500): log WARNING, treat threads list as the matched subset, and DO NOT advance `last_scan` at the end of phase 2 for THIS client (PATCH PHANTOM-F7 — pagination-cap idempotency). Surface to user: `"Message-window cap hit for <slug>: scanned 500 messages, likely more in older mail. Re-run with narrower --since to catch the rest."`

### 2.2 Idempotency via message-id index (PATCH Madhav / PHANTOM-F8)

For each client, an append-only message-id index lives at `<client_dir>/inbox/.message-ids.jsonl`. Each line is one JSON object:

```json
{"message_id": "19e04191975b2d00", "thread_id": "19e04191975b2d00", "note_path": "inbox/2026-05-08_subject-slug.md", "filed_iso": "2026-05-08T07:31:12Z"}
```

**Lookup:** Build an in-memory set from all `message_id` fields in the index file (one read per scan, O(N) once). Subsequent dedup checks are O(1).

**Decision:** For each candidate thread from 2.1:
- Read the thread's `message_ids[]` (from `search_threads` response or `get_thread` if needed).
- If EVERY `message_id` in this thread is in the in-memory set → SKIP (already filed; no work needed).
- Otherwise → process the thread (it has at least one new message; merge or create as appropriate).

**Index update:** New message_ids are appended to `.message-ids.jsonl` AFTER the note is successfully written (see 2.8). Append-only — never rewrite the file.

**Concurrency safety:** The orchestrator (`commands/inbox-digest.md`) acquires a global PID lock at `~/.claude/.inbox-digest.lock` BEFORE Phase 2 begins (PATCH PHANTOM-F1). A second concurrent `/inbox-digest` invocation exits immediately with "already running". Therefore Phase 2 can assume single-writer access to `.message-ids.jsonl` and treat appends as race-free. If the lock is somehow bypassed (e.g., by a future feature that lifts the global lock), revisit this assumption.

### 2.3 Process a thread

For each new thread:

1. Call `email-backend.get_thread(thread_id, message_ids)` → `email-backend.extract_thread_messages(thread)` to normalize. `message_ids` comes from the thread skeleton returned by §2.1 (gongrzhe has no get-thread-by-id; adapter does `read_email` per message internally — see `modules/email-backend.md`).

2. Determine note filename:
   - `inbox/<YYYY-MM-DD>_<subject-slug>.md`
   - `<YYYY-MM-DD>` is `date_first` of the thread (UTC, ISO date portion only).
   - `<subject-slug>` derivation: lowercase the subject, replace non-alphanumeric chars with hyphens, collapse repeated hyphens, strip leading/trailing hyphens, strip leading "Re:"/"Fwd:" markers, max 60 chars.
   - **Filename collision** (same date+subject but DIFFERENT thread_id): append `_<short-thread-id>` suffix (first 8 chars of thread_id).

3. **MERGE vs CREATE decision:**
   - `merge_thread_note(existing_path, new_messages)`: existing note has SAME `thread_id` in frontmatter → append new message blocks to body, append new `message_id`s to frontmatter `message_ids[]`, update `date_latest`, update `attachments[]`. Atomic write (`.tmp + rename`).
   - `create_thread_note(new_path, all_messages)`: no existing note for this thread_id → render `templates/email-note.md` with all data, atomic write.

**Finding the existing note for MERGE:** Phase 2 builds an in-memory `thread_id → note_path` map from `.message-ids.jsonl` (one read per scan). Look up by `thread_id`. If found and the file exists on disk, use MERGE. If the index says a note exists but the file is missing (manual deletion / vault desync), fall through to CREATE and log a WARNING `"index referenced missing note <path>; recreating"`.

4. **Capture `match_reason`** for note frontmatter. Determine which Phase 1 channel matched this thread by inspecting sender/subject against the client's frontmatter (re-evaluate the match channels — Phase 1 didn't pass per-thread which-channel-matched). Set to one of: `from_email_match | domain_match | relay_with_alias | self_with_alias`. (Canonical enum lives in `templates/email-note.md`.)

### 2.4 Multi-client conflict check (only when running --all)

If a thread matches multiple clients (e.g., a Zoom recap mentioning two clients in the same email):

1. File under highest-priority client (`high > medium > low`).
2. Tie-break on alphabetical `client_slug`.
3. Append a record to a session-scoped `filing_conflicts[]` array (in-memory, consumed by Phase 4 in Sprint 2 OR by morning digest).
4. Append a vault-side ledger entry to `<vault_root>\context\morning-digest\_conflicts.md` (Madhav patch). Format:
   ```markdown
   - [2026-05-08] Thread `<thread_id>` ("<subject>") matched: <client_a>, <client_b>. Filed under **<chosen_client>** (priority winner / tie-break).
   ```
   Pattern: atomic full-rewrite append (read full → append line in memory → write to `.tmp` → fsync → rename). Safe at the conflict-frequency we expect (rare events) — re-evaluate if this file grows large.

### 2.5 Body sanitization (PATCH CIPHER-F3 — CRITICAL)

Before writing each message body to a note via `templates/email-note.md`:

For each message's `plaintext_body`:
1. **Escape `---` lines:** Any line consisting ONLY of `---` (with optional leading/trailing whitespace) is replaced with `\---` to prevent YAML frontmatter injection if the note body is ever re-parsed as frontmatter.
2. **Neuter triple-backticks:** Any literal ` ``` ` (triple-backtick) inside the body is replaced with ` ​```​ ` (zero-width-space U+200B + backticks + ZWSP) so user-controlled content cannot close the fence.
3. **Wrap in fenced code block:** The sanitized body is wrapped in ` ```text\n<sanitized>\n``` ` per the template's existing structure (the template already shows this pattern; Phase 2 just supplies the sanitized value).
4. **Subject + sender HTML-escape:** `subject_safe` and `sender_safe` placeholders get HTML-escape on `<`, `>`, `"`, `&`, plus newline-collapse to space.

These rules are non-negotiable. A malicious sender CAN compose `---\nclient: malicious\n---` in the body trying to corrupt the note's YAML — the escape neutralizes this.

### 2.6 Attachments

For each message's attachments:

1. Mkdir `<client_dir>/inbox/attachments/<note-slug>/` if not exists.
2. Sanitize attachment filename: take `Path(filename).name` only (strip any path separators), restrict to alphanumerics + dot + hyphen + underscore, max 100 chars (CIPHER-F9 patch — Sprint 1.5 polish, but apply now since trivial).
3. **Idempotent download:** If the file already exists at `save_path` AND its size > 0, skip the download (already retrieved by an earlier scan). Log `attachment_skipped_exists` in the operational log.

4. Otherwise, build an attachment **descriptor** and call `email-backend.download_attachment(descriptor, save_path)`. The descriptor MUST be built from the data Phase 2 already has from `extract_thread_messages`:

   ```yaml
   descriptor:
     message_id: <message.id>                  # Gmail internal message ID
     attachment_id: <attachments[i].id>        # Native attachment ID (used by native backend only)
     sender: <message.sender_email>
     recipient: <message.to[0]>                # First to-recipient; safe even if cc/bcc exist
     subject: <message.subject>                # The thread subject as captured in the note's frontmatter
     date_iso: <message.date_iso>              # ISO 8601 UTC
     filename: <attachments[i].filename>       # Cross-backend metadata; gongrzhe uses message_id + attachment_id directly
     mime_type: <attachments[i].mime_type>
     size_bytes: <attachments[i].size_bytes>
   ```

   v1.5 backend is **gongrzhe** (single MCP, typed direct Gmail-API wrapper); URL-only fallback fires only if `mcp__gmail-gong-mcp__*` tools are missing entirely. See `modules/email-backend.md` for probe + per-backend semantics. Handle each return mode:
   - `{ok: true, mode: "binary", backend: "gongrzhe", path}`: file saved.
   - `{ok: false, mode: "url_only", url}`: gongrzhe MCP was absent at probe time (MCP not loaded — config error or OAuth not completed). Write the URL to note frontmatter `attachments[].note: "binary download deferred — gmail-gong-mcp not available; verify MCP install + OAuth"`. Continue (do NOT halt).
   - `{ok: false, mode: "gongrzhe_empty_file" | "gongrzhe_attachment_not_found", error}`: gongrzhe was probed-present but THIS individual call failed (zero-byte file, or 404 on attachment ID — possible if the message was deleted between scan and download). Per-attachment fallback: write the Gmail URL to note frontmatter `attachments[].note: "binary download failed via gongrzhe (<mode>) — Gmail URL recorded as fallback"`, include the `error` excerpt for diagnostics. Continue (do NOT halt, do NOT retry — `with_backoff` already retried inside the adapter).
5. If saved file ends in `.pdf`: call `pdf-extract.extract(save_path, save_path + ".extracted.md")` per `modules/pdf-extract.md`. On non-zero exit: `.extracted.md` will contain the failure stub (per `--write-failure`); brief in Phase 3 still generates.
6. Update note frontmatter `attachments[]` entry with: `filename`, relative `path`, `extracted` (path to `.extracted.md` or null), `note` (any failure context or empty).

### 2.7 Apply Gmail label

If frontmatter `gmail_label` is non-null: call `email-backend.apply_label(thread_id, gmail_label, message_ids)` — pass the same `message_ids` collected for this thread in §2.1/§2.3. gongrzhe applies labels per-message via `batch_modify_emails`; the adapter chunks if needed. Adapter validates `gmail_label` against `Clients/*` allowlist BEFORE any MCP call (CIPHER-F5). On any failure: log + continue. NEVER halt scan — labelling is best-effort.

### 2.8 Update message-id index + last_scan (atomic)

After ALL threads for THIS client have been processed (success or skipped):

1. **Append new entries to `.message-ids.jsonl`:** One line per newly-filed `message_id`. If a thread was MERGED (existing note got new messages), append entries for ONLY the new message_ids, not the entire thread.
2. **Atomic update of hub frontmatter `last_scan`:**
   - The hub path is `hub_path` from the Phase 1 work tuple — either `<client_dir>/index.md` (folder layout) or `<vault_root>/context/clients/<slug>-client.md` (flat-client layout). Phase 2 MUST use this value verbatim; do NOT recompute or assume `index.md`.
   - If pagination capped (PHANTOM-F7): leave `last_scan` UNCHANGED so next run resumes from same point.
   - If any thread errored before its note was written successfully: leave `last_scan` UNCHANGED (resume next run).
   - Otherwise: set `last_scan = window_end_iso`. Write pattern: read `hub_path`, modify frontmatter, write to `<hub_path>.tmp`, fsync, rename to `hub_path` (atomic).
3. If anything in this step fails: log the error with file paths, leave the hub note and `.message-ids.jsonl` in whatever state they were before the failure point. NEVER corrupt them.

### 2.9 Operational log

Per-client summary line, appended to `~/.claude/logs/inbox-digest/<YYYY-MM-DD>.log`:

```
<iso> phase=2-fetch run_id=<uuid> client=<slug> threads_scanned=<n> new=<n> skipped_dup=<n> merged=<n> attachments_pulled=<n> attachments_url_only=<n> errors=<n> capped=<bool> duration_ms=<n>
```

NO PII (no email bodies, no full sender names — local-part only if needed for diagnostics).

## Output (consumed by Phase 3)

Per-client summary:

```yaml
- client_slug: example-client
  client_display: "<example-client>"
  client_dir: "<vault_root>\\context\\clients\\example-client"
  new_thread_paths:
    - "inbox/2026-05-08_katie-followup.md"
    - "inbox/2026-05-08_example-deliverables.md"
  merged_thread_paths: []                  # threads where existing notes got new messages appended
  attachments_extracted:                   # successfully extracted PDFs
    - path: "inbox/attachments/2026-05-08_example-deliverables/shopify-stack.pdf"
      extracted: "inbox/attachments/2026-05-08_example-deliverables/shopify-stack.pdf.extracted.md"
  attachments_url_only: []                 # binary download deferred (get_attachment MCP missing)
  filing_conflicts: []
  errors: []
  capped: false
  priority: high
```

## Failure modes summary

| Condition | Action |
|---|---|
| Gmail MCP error mid-pagination (after 3 retries) | Halt THIS client; partial last_scan NOT advanced |
| Pagination capped (>500 threads) | Stop pagination; do NOT advance last_scan; surface "narrow --since" hint |
| `download_attachment` returns url_only | Record URL + note in frontmatter; brief still generates |
| `download_attachment` raises FatalError | Log + skip this attachment; brief still generates |
| PDF extraction fails | `.extracted.md` has failure stub; brief still generates |
| `apply_label` fails | Log + continue (best-effort) |
| Vault file write fails | HALT this client; atomic-write means no corruption |
| Multiple clients match same thread (--all) | File under highest-priority; log conflict to vault ledger |
| `.message-ids.jsonl` corrupt/unreadable | Treat as empty (re-fetch all) + log WARNING; NEVER halt |
