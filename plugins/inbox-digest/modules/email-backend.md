# Email Backend Adapter (v1.5: gongrzhe Gmail MCP)

This module is the ONLY interface that Phases 1–3 use to talk to email.
Phases never name MCP tools directly — they call this adapter's stable operations.

**Backend:** `gongrzhe/server-gmail-autoauth-mcp` (typed direct Gmail-API wrapper, single MCP, OAuth-managed credentials at `~/.gmail-mcp/credentials.json`).

**Server name in `~/.claude.json`:** `gmail-gong-mcp`. Tools resolve as `mcp__gmail-gong-mcp__<name>`.

**v2 plan:** swap to Composio when multi-account scanning is justified (see §"v2 Migration Path"). v1.5 is single-account.

See `<your-related-note>` for the rationale behind the swap from the v1 hybrid Pipedream + claude_ai_Gmail architecture, and `<your-related-note>` for why the descriptor pattern is preserved even though gongrzhe doesn't need it internally.

## Exponential Backoff Wrapper (PATCH PHANTOM-F2)

ALL adapter operations wrap their MCP calls in this retry pattern:

```
function with_backoff(operation):
  delays = [1, 2, 4]   # seconds
  for attempt in 0..2:
    try:
      return operation()
    except RateLimitError as e:        # HTTP 429 from Gmail
      if attempt < 2:
        log "retry attempt=%d delay=%ds reason=429" % (attempt+1, delays[attempt])
        sleep(delays[attempt])
        continue
      raise  # third failure → halt THIS CLIENT (not the whole sweep)
    except TransientError as e:        # network blip, MCP timeout, 5xx
      if attempt < 2:
        log "retry attempt=%d delay=%ds reason=transient" % (attempt+1, delays[attempt])
        sleep(delays[attempt])
        continue
      raise
    except FatalError as e:            # auth, permission denied, missing tool
      raise  # no retry
```

### Exception Classification (for gongrzhe)

gongrzhe is a direct Gmail-API wrapper, so error surfaces map close to Google's HTTP layer (no LLM-mediation drift to defend against, unlike v1's Pipedream path).

| MCP error pattern (substring match on response) | Exception class | Behavior |
|---|---|---|
| `429` / `Quota exceeded` / `rateLimitExceeded` / `userRateLimitExceeded` | `RateLimitError` | Retry with delay |
| `5xx` / `Service unavailable` / `Internal error` / network timeout / connection reset | `TransientError` | Retry with delay |
| `401` / `403` / `Invalid Credentials` / `insufficientPermissions` / `Login Required` | `FatalError` | No retry — halt this client |
| `404` / `Not Found` (on specific message / attachment ID) | `FatalError` | No retry — per-attachment caller handles fallback |
| Tool not found (e.g., `mcp__gmail-gong-mcp__*` missing — MCP not loaded) | `FatalError` | No retry — caller decides fallback (URL-only) |
| Other error patterns | Default to `TransientError` | Retry then surface |

A debug hook is supported: if env var `INBOX_DIGEST_FORCE_429=1` is set, the first 2 calls to `search_threads` raise `RateLimitError` for testing the backoff path (see Task T14 in the plan).

## Adapter Interface

### `verify_auth(expected_account)`

gongrzhe exposes no `get-current-user` tool. Account identity is inferred from the `from:me` search result.

1. Call `mcp__gmail-gong-mcp__list_email_labels()` — reachability + auth probe (wrapped in `with_backoff`). Returns the full labels list on success. Any failure here is a hard auth/connection failure → return `{ok: false, actual: null, expected: expected_account, reason: "<err>"}`.
2. Call `mcp__gmail-gong-mcp__search_emails({query: "from:me", maxResults: 1})` (wrapped in `with_backoff`). Returns up to one message authored by the authed account.
3. Parse the `From` header from the returned message. Extract the email address (strip display name + angle brackets). Lowercase.
4. Compare against lowercased `expected_account`. Return `{ok: bool, actual: <found_email>, expected: <expected_account>}`.
5. **Degradation:** if Step 2 returns zero results (no `from:me` messages in the account's history — extremely rare for active accounts), return `{ok: true, actual: null, expected: expected_account, reason: "auth_reachable_but_account_identity_unverified"}`. This matches v1's "auth reachable but cannot verify" fallback behavior. Phase 1 logs a WARNING but proceeds.

### `search_threads(query, after_iso, page_size=50)`

The adapter handles message-level → thread-level reshaping internally so Phase 2's contract stays stable. **NOTE:** gongrzhe's `search_emails` does NOT return `threadId` in its message-stub output (only `id`, `Subject`, `From`, `Date`). To group by thread, the adapter must call `read_email` on each match to recover `threadId` from the full message. This makes `search_threads` an `O(1 + N)` MCP-call operation (1 search + N reads), but the eager-read pays for itself by memoizing the full message data into an adapter-level cache that `get_thread` then reads from with zero additional MCP calls.

1. Build the Gmail-flavored query: `<query> after:<YYYY/MM/DD>` (gongrzhe passes the string through to Gmail API verbatim, so any Gmail search operator works).
2. Call `mcp__gmail-gong-mcp__search_emails({query: <combined>, maxResults: 500})` (wrapped in `with_backoff`).
   - **Why 500:** gongrzhe's `search_emails` schema accepts only `query` + `maxResults`. There is **no `pageToken`/`nextPageToken` parameter** — pagination is not supported. Gmail's API list-page hard limit is 500, so request 500 in one shot.
   - **Response shape:** flat text formatted as `ID: <mid>\nSubject: <subj>\nFrom: <sender>\nDate: <rfc2822>\n\n` per result. Parse with regex; multiple results separated by blank lines.
3. For each parsed message stub, call `mcp__gmail-gong-mcp__read_email({messageId: <mid>})` (each wrapped in `with_backoff`). Parse the response (see `extract_thread_messages` below for the text-format rules) to recover `threadId`, full headers, body, and attachment metadata. **Cache the parsed result** in adapter memory under `_thread_message_cache[message_id]` for the duration of the run — `get_thread` reads from this cache.
4. Group the cached messages by `threadId`. For each group, collect: `thread_id`, `message_ids[]`, and derive thread-level fields from the most recent message in the group (`subject`, `snippet` — first 200 chars of body, `sender`, `date_latest_iso`, `to_recipients`).
5. **Cap detection:** if `len(messages) == 500`, set `capped: true` and surface up to the caller. The cap is on raw messages, not threads — a thread with N matching messages consumes N message slots. A `capped: true` does NOT mean exactly 500 threads; it means the message-window was saturated and there are likely more matches in older mail. Phase 2 §2.1 already treats `capped: true` as "do not advance `last_scan`; ask user to narrow `--since`."
6. The `page_size` parameter is kept in the signature for interface stability but is unused at the MCP layer (gongrzhe has no native pagination). Phase 2 callers can leave the default in place; future backends with pagination can honor it.

Returns: `{threads: [{thread_id, message_ids: [string], subject, snippet, sender, date_latest_iso, to_recipients: [string]}], capped: bool}`.

**Cache lifecycle:** `_thread_message_cache` lives for the duration of a single `/inbox-digest` run (per-process). It is NOT persisted to disk. Phase 2's `.message-ids.jsonl` index handles cross-run idempotency separately.

### `get_thread(thread_id, message_ids)`

**Signature change vs v1:** the v1 contract was `get_thread(thread_id)` (claude_ai_Gmail had a native `get_thread` tool that resolved the full thread by ID). gongrzhe has no such tool — Gmail search operators don't include a portable thread-id query — so the adapter requires the caller to pass the `message_ids` collected during `search_threads`. Phase 2 already has these from §2.2's index lookup, so the caller-site change is minimal.

1. **Read from the adapter cache first.** `search_threads` populated `_thread_message_cache[mid]` for every message it returned. For each `mid` in `message_ids`, look up the cached parsed message. **Cache hit = zero MCP calls.**
2. **Fallback for cache miss.** If a `mid` isn't in cache (e.g., MERGE flow where Phase 2 is re-reading a thread whose message_ids span past + present scans), call `mcp__gmail-gong-mcp__read_email({messageId: mid})` (wrapped in `with_backoff`) and parse it via the same rules as `extract_thread_messages`. Populate the cache.
3. Build a thread-shaped object containing at minimum these fields (Phase 2 only relies on these):
   - `id` — `thread_id` (string)
   - `messages` — list of normalized message objects (one per cached/fetched message), each with: `id`, `date`, `sender`, `toRecipients` (list), `subject`, `snippet`, `plaintext_body`, `attachment_ids` (list), and per-attachment metadata.

`extract_thread_messages` (below) consumes this shape and normalizes further into the canonical adapter-output shape.

### `download_attachment(descriptor, save_path)`

**Direct, typed, single MCP call.** gongrzhe's `download_attachment` accepts `messageId` + `attachmentId` + `savePath` (directory) + `filename` (basename), and writes the file directly to the specified location — no `/tmp` shuffle, no LLM-mediated parsing, no two-step find-email + download flow.

**Why the descriptor pattern is preserved even though gongrzhe doesn't need it:** the descriptor is the load-bearing contract from `<your-related-note>`. Keeping `download_attachment(descriptor, save_path)` as the adapter signature means:
- Phase 2's call-site does NOT change vs the v1 hybrid backend
- If a future backend needs Gmail-addressable metadata to re-resolve IDs (e.g., another MCP gets paired alongside gongrzhe, or we expand to Slack/Drive with similar cross-system ID issues), no contract refactor is needed
- The GOU lives on as architectural wisdom even though gongrzhe's intra-MCP IDs are portable within itself

**Descriptor shape (built by Phase 2 from `extract_thread_messages` output — unchanged from v1):**

```yaml
descriptor:
  message_id: "19d4f76421c3eb37"          # Gmail internal message ID — used by gongrzhe
  attachment_id: "ANGjdJ9fVvN..."         # Gmail internal attachment ID — used by gongrzhe
  sender: "<example-client>@example.com"
  recipient: "<your-email>"
  subject: "Re: <example-client> Info"
  date_iso: "2026-04-02T18:30:29Z"
  filename: "Strategic questions.pdf"
  mime_type: "application/pdf"
  size_bytes: 124573
```

PRE-FLIGHT PROBE (executed once at session start, result memoized for the run): probe `mcp__gmail-gong-mcp__list_email_labels` exists via `ToolSearch select:mcp__gmail-gong-mcp__list_email_labels`. If present → `attachment_backend = "gongrzhe"`. If absent → `attachment_backend = "url_only"`. Log the chosen backend in the op log: `<iso> run_id=<uuid> attachment_backend=<chosen>`.

#### Backend: gongrzhe (preferred — present whenever this MCP is loaded)

1. Derive `save_dir = dirname(save_path)` and `save_filename = basename(save_path)` from the caller's intended absolute path. (gongrzhe takes directory + filename separately.)
2. Call `mcp__gmail-gong-mcp__download_attachment({messageId: descriptor.message_id, attachmentId: descriptor.attachment_id, savePath: save_dir, filename: save_filename})` (wrapped in `with_backoff`).
3. Verify the file exists at `save_path` and `size > 0`. If missing or zero-byte → return `{ok: false, mode: "gongrzhe_empty_file"}`.
4. On success: `{ok: true, path: save_path, mode: "binary", backend: "gongrzhe"}`.

**Per-call failure modes:** if `download_attachment` raises FatalError (e.g., 404 on attachment ID — possible if the message was deleted between scan and download), return `{ok: false, mode: "gongrzhe_attachment_not_found", error: <err>}`. Phase 2 records the Gmail URL as fallback and continues.

#### Backend: url_only (gongrzhe absent)

This branch only fires if `mcp__gmail-gong-mcp__*` tools are missing entirely (MCP not loaded — config error, OAuth not completed, etc.). Return `{ok: false, mode: "url_only", url: <gmail_thread_url_for_message>}`. Phase 2 records the URL in note frontmatter `attachments[].note: "binary download deferred — gmail-gong-mcp not available; verify MCP install + OAuth"`. NEVER halt the scan.

#### Per-attachment failure behavior

When the adapter returns `{ok: false}` for a specific attachment, Phase 2 records the failure in note frontmatter (with the `mode` for diagnostics) and continues. Brief generation in Phase 3 still proceeds. Per-attachment failure NEVER halts a thread, a client, or a sweep.

**Reliability gate (new — calibrate from real op-log data):** the single-call architecture eliminates the v1 hybrid's compounded `1 - (1-p)²` failure probability. After 7 days of cron runs, if per-attachment failure rate from `gongrzhe_*` modes exceeds **0.2%** (4× tighter than v1's 0.5% gate because we no longer have the two-LLM-call multiplier), investigate before escalating. Composio swap remains the v2 escalation path if gongrzhe itself proves unreliable at the API layer.

### `apply_label(thread_id, label_name, message_ids)`

**Signature change vs v1:** the v1 contract was `apply_label(thread_id, label_name)` (claude_ai_Gmail had a `label_thread` tool that operated on the thread atomically). gongrzhe's `modify_email` / `batch_modify_emails` operate on individual messages — to label a "thread," apply the label to every message in the thread. The adapter requires `message_ids` for the same reason `get_thread` does. Phase 2 has these from `search_threads`.

**STEP 1 — VALIDATE `label_name` BEFORE any MCP call (CIPHER-F5):**
- Must match regex `^Clients/[A-Za-z0-9][A-Za-z0-9_-]*$`
- If validation fails: log `"label_validation_failed label=%s reason=allowlist_mismatch" % label_name`, return `{ok: false, reason: "label_validation_failed"}`. Do NOT call any MCP tool.

**STEP 2 — Resolve the label_id (atomic create-or-fetch):**

1. Call `mcp__gmail-gong-mcp__get_or_create_label({name: label_name})` (wrapped in `with_backoff`). gongrzhe handles the list → match → create-if-missing flow internally as a single atomic call. Returns the label object with `id`.
2. This removes the v1 "call `list_labels` → match by displayName → call `create_label` if missing" three-step ladder. Single call now.

**STEP 3 — Apply the label to every message in the thread:**

1. Call `mcp__gmail-gong-mcp__batch_modify_emails({messageIds: message_ids, addLabelIds: [label_id], batchSize: 50})` (wrapped in `with_backoff`). gongrzhe chunks internally if `len(message_ids) > batchSize`.
2. Threads with >50 messages are vanishingly rare in inbox-digest's client-email use case; the default `batchSize: 50` is fine.

On any error in STEPs 2/3: log error, return `{ok: false, reason: "<error>"}`. NEVER halt the scan — labelling is best-effort.

### `extract_thread_messages(thread)`

Pure-function normalizer. NO MCP call. Takes the thread object built by `get_thread` (which is a list of `read_email` results) and returns a stable list:

```
[{
  message_id: string,
  date_iso: string,                    # ISO 8601, UTC (normalize from gongrzhe's Date header)
  sender_name: string,                 # display name from "From: <Name> <email>" (may be empty)
  sender_email: string,                # email address only
  to: [string],                        # email addresses only
  cc: [string],
  plaintext_body: string,              # raw body, NOT yet sanitized — Phase 2 sanitizes on write
  attachments: [{                       # metadata only, NOT yet downloaded
    id: string,                        # gongrzhe's Gmail attachmentId — usable directly by download_attachment
    filename: string,
    mime_type: string,
    size_bytes: int
  }]
}]
```

**gongrzhe `read_email` response shape** (observed empirically 2026-05-11):

gongrzhe returns the message as **flat formatted text**, NOT structured JSON. Adapter must parse the text format:

```
Thread ID: <thread_id>
Subject: <subject>
From: <Display Name> <email@domain.com>
To: <Display Name> <email@domain.com>[, ...]
Cc: <...>[, ...]                              # optional, only if Cc header present
Date: <RFC 2822 date>

[Note: This email is HTML-formatted. Plain text version not available.]   <-- optional flag line, present when body is HTML-only
<body — either plain text OR raw HTML — may span many lines>

Attachments (<N>):                            <-- optional trailer, only when attachments exist
- <filename> (<mime_type>, <human_size>, ID: <attachmentId>)
- ...
```

**Parsing rules:**

1. **Split on first blank line** (`\n\n`) → header block + remainder.
2. **Parse headers:** for each line in the header block, match `^(Thread ID|Subject|From|To|Cc|Date):\s*(.+)$`. Headers in the From/To/Cc form `Display Name <email@domain.com>` — extract `<email@domain.com>` for `sender_email` / `to[]` / `cc[]`, and the leading portion (stripped of trailing space) for `sender_name`.
3. **Parse Date:** RFC 2822 format like `Thu, 2 Apr 2026 14:30:29 -0400`. Normalize to ISO 8601 UTC.
4. **Detect attachments trailer:** in the remainder, search for `^Attachments \((\d+)\):$` at the START of a line. If matched: everything BEFORE that line is the body; the trailer is parsed for attachment metadata.
5. **Parse attachment lines:** `^- (?P<filename>.+) \((?P<mime>[^,]+), (?P<size_human>[^,]+), ID: (?P<attachment_id>.+)\)$`. Convert `size_human` (e.g., `"87 KB"`, `"1.2 MB"`) to approximate bytes via standard SI parsing (`KB` → ×1024, `MB` → ×1024²); the descriptor field is named `size_bytes` for historical reasons but tolerates approximations since gongrzhe's `download_attachment` doesn't use it — only `messageId` + `attachmentId` matter at download time.
6. **Detect HTML-flag line:** if the body's first line is `[Note: This email is HTML-formatted. Plain text version not available.]`, strip it from the body and emit op-log `body_format=html_only message_id=<mid>` for later HTML→markdown conversion work. The remaining body is raw HTML. Phase 2's sanitizer wraps the body in a ` ```text ` fenced code block, which displays raw HTML as readable text — ugly but functional. **Known limitation:** until a future HTML→markdown step ships, HTML-bodied messages display as raw markup in vault notes. Phase 3 brief synthesis still works (Claude reads HTML fine for summary generation).

**No attachments visible in `read_email` body output → no Attachments trailer.** The trailer line `Attachments (N):` is absent when N=0.

Phase 2 calls this once per thread, then iterates the result.

Note: `match_reason` is NOT computed by this adapter. Phase 2 derives it from `to_recipients` and the client frontmatter, using one of: `from_email_match | domain_match | relay_with_alias | self_with_alias` (see `templates/email-note.md` for the canonical enum).

## Operational logging

Every adapter call writes a line to `~/.claude/logs/inbox-digest/<YYYY-MM-DD>.log`. The caller (Phase 1, 2, or 3) passes `run_id` through context — adapter operations include it in every log line so a single run can be reconstructed end-to-end.

```
<iso> run_id=<uuid> adapter=<op_name> client=<slug> result=<ok|err> attempts=<n> ms=<duration> [error=<short_msg>]
```

NO email content, NO PII beyond local-part-only sender (e.g., `<example-client>@…` → `<example-client>`).

## Architectural simplifications from v1 → v1.5

| Before (v1 hybrid) | After (v1.5 gongrzhe) |
|---|---|
| 3-backend probe at run start (Pipedream find-email + download, claude_ai_Gmail native, URL-only) | Single MCP probe (`mcp__gmail-gong-mcp__list_email_labels` reachable?) → gongrzhe or URL-only |
| Two-step Pipedream flow (find-email then download) for attachments | Single typed call to `download_attachment` |
| LLM-mediated `instruction` strings to Pipedream | Typed param objects |
| Defensive regex parsing of `/tmp/<path>` from natural-language responses | gongrzhe writes to `savePath/filename` directly |
| `with_backoff` wrapping 2 sequential LLM calls per attachment | `with_backoff` wrapping 1 typed call |
| 0.5% per-attachment reliability gate (combined failure of 2 LLM calls) | 0.2% reliability gate (single-call architecture) |
| URL-only fallback for any individual call failure | URL-only fallback only if gongrzhe MCP itself is absent at probe time |
| `list_labels` → match → `create_label` → `label_thread` (4-step ladder) | `get_or_create_label` → `batch_modify_emails` (2-step) |

## v2 Migration Path (deferred)

When evidence justifies multi-account scanning:
1. Replace each operation's body with a Composio call (Composio MCP if installed, else REST via `requests` + `COMPOSIO_API_KEY` from `~/.claude/.env`).
2. `verify_auth` becomes `verify_connection(connection_id)`.
3. Per-account routing: `gmail_accounts` in client frontmatter maps to `composio_connection_id` per `~/.claude/contacts/accounts.json`.
4. Phases 1–3 require zero changes — interfaces stay stable (descriptor pattern + adjusted signatures already absorbed the cross-MCP variability lesson).
