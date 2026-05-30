---
description: Scan Gmail for client emails, file into Obsidian vault per-client, generate per-client daily briefs (Sprint 1; Phase 4 cross-client digest deferred to Sprint 2)
---

# /inbox-digest

User-facing entry point for the inbox-digest skill. Orchestrates Phases 1–3 (Sprint 1). Phase 4 (counsel-prioritized cross-client morning digest) is deferred to Sprint 2 — gated on Sprint 1 usage data.

## Argument parsing

Accepts (in any order, after the slash):

| Flag | Meaning |
|---|---|
| `<client-slug>` | Positional. Required UNLESS `--all` is set. Names a single client to scan. |
| `--all` | Sweep every client hub under `<vault>/context/clients/` — both folder layout (`<slug>/index.md`) and flat-client layout (`<slug>-client.md`). See `modules/phase-1-discover.md` §1.1 for hub resolution. |
| `--since YYYY-MM-DD` | Backfill window override. Phase 1 uses this instead of frontmatter `last_scan`. |
| `--dry-run` | Read-only. Phases run but no vault writes, no Gmail labels, no `last_scan` update. |
| `--triage` | Write `<vault>/context/unfiled/<YYYY-MM-DD>_unmatched-senders.md` for senders that don't match any client. Off by default. |
| `--bootstrap` | Hand off to `modules/bootstrap.md` for interactive new-client onboarding. Requires `<client-slug>`. |
| `--reset-last-scan YYYY-MM-DD` | Admin recovery: rewrites the resolved hub note's frontmatter `last_scan` to the provided date (works against both folder layout `<slug>/index.md` and flat-client layout `<slug>-client.md`). Requires `<client-slug>`. |
| `--retention DAYS` | OPT-IN. If flag absent, no retention sweep runs. If flag passed without a value, defaults to 365 days. Calls `modules/retention.md` at end of run. |

Validation rules:
- Exactly one of `<client-slug>` or `--all` must be present (except with `--bootstrap` or `--reset-last-scan` which both require `<client-slug>`)
- `--bootstrap` is mutually exclusive with `--all`, `--since`, `--triage`, `--retention`
- `--reset-last-scan` is mutually exclusive with `--all`, `--since`, `--triage`, `--retention`, `--dry-run`
- On invalid combinations: print usage hint, exit 1, no side effects

## Concurrency Lock (PATCH PHANTOM-F1)

BEFORE any phase runs (or any vault write):

1. Lock path: `~/.claude/.inbox-digest.lock`
2. Try to create the lock file with create-exclusive semantics (`O_CREAT | O_EXCL` on POSIX; `[System.IO.File]::Open(..., CreateNew, ...)` on Windows / equivalent).
3. **If create succeeded:** write `{pid: <self_pid>, started_iso: <now>, mode: <flags_str>}` as JSON. Continue.
4. **If file already exists** — check whether the holder is alive:
   - Read the existing lock JSON. **If the file is empty, malformed JSON, or missing the `pid` field** (orchestrator crashed mid-write between create-exclusive and JSON write), treat as stale: delete the lock file and retry create-exclusive (one retry only). Log WARNING `"recovered from incomplete lock file"`.
   - Otherwise extract `pid`.
   - On Windows: `Get-Process -Id <pid> -ErrorAction SilentlyContinue`. If null → stale.
   - On POSIX: `os.kill(pid, 0)` raises `ProcessLookupError` if dead → stale.
   - **If alive:** print `"Already running: PID <pid> started <started_iso> in mode <mode>. Skipping this invocation."`, exit 0 cleanly. (Exit 0 because this is expected behavior, not a failure — concurrent invocations are protected by design.)
   - **If stale** (process gone): delete the lock file, retry create-exclusive (one retry only — if a third party races us to it, exit with the "already running" path).
5. **Lock cleanup:** ALWAYS delete the lock file on exit (success, failure, OR signal). Use `try / finally` semantics or equivalent registered cleanup.

## Bootstrap path

If `--bootstrap` is set:
0. Generate `run_id` (UUID v4) for this invocation.
1. Acquire concurrency lock (per above).
2. Hand off to `modules/bootstrap.md` with `slug = <client-slug-arg>`.
3. Bootstrap runs its own AskUserQuestion interview (including layout choice — folder or flat-client), validates, writes the chosen hub note (`<slug>/index.md` OR `<slug>-client.md`).
4. Release lock.
5. Print bootstrap module's `B.6` next-steps message.
6. EXIT — do NOT proceed to scanning phases.

## Reset path

If `--reset-last-scan YYYY-MM-DD` is set:
0. Generate `run_id` (UUID v4) for this invocation.
1. Acquire concurrency lock.
2. Validate the date string is parseable ISO 8601 (`YYYY-MM-DD`). On parse fail: print error, exit 1.
3. Validate `<client-slug>` per Phase 1 rules (slug regex + path containment + hub note resolves per `modules/phase-1-discover.md` §1.2.a). On fail: print error, exit 1. Capture the resolved `hub_path` for the next step.
4. Read `hub_path`, atomic-update frontmatter `last_scan = <iso-from-arg>` (`.tmp + fsync + rename`). Works identically for folder layout (`<slug>/index.md`) and flat-client layout (`<slug>-client.md`).
5. Print `"✓ Reset last_scan for <slug> to <iso>. Next run will scan from this point."`.
6. Release lock. EXIT.

## Standard scan path (single-client OR --all)

0. **Generate `run_id`**: create a UUID v4 for this invocation. Thread it through every phase call (Phase 1/2/3) and the heartbeat write. Phases include `run_id=<uuid>` in their per-phase log lines so a single run can be reconstructed from operational logs.
1. Acquire concurrency lock.
2. **Phase 1** per `modules/phase-1-discover.md` — read frontmatters, validate, build queries.
3. **Phase 2** per `modules/phase-2-fetch.md` — fetch, write notes, attachments, label.
   - If `--dry-run`: phase logs what it WOULD write/label/update; skips all side effects (no vault writes, no labels, no `last_scan` update, no `.message-ids.jsonl` append).
4. **Phase 3** per `modules/phase-3-digest.md` for each client with new mail.
   - If `--dry-run`: phase logs proposed brief content + tasks.md additions; skips writes.
5. **Triage** (only if `--triage` was set AND any threads were skipped due to "no client match" in Phase 2):
   - **If `--dry-run` is also set:** print the proposed unmatched-senders content to stdout (one block per skipped thread, format below), but SKIP the file write. Dry-run is read-only across the board.
   - **Otherwise:** atomic-write `<vault>/context/unfiled/<YYYY-MM-DD>_unmatched-senders.md` containing one block per skipped thread:
     - Sender (local-part-only, e.g., `<example-client>@…` → `<example-client>`)
     - Subject (HTML-escaped per CIPHER-F3 sanitization rules)
     - First 200 chars of body (sanitized via the same fence pattern as `email-note.md`)
     - Suggestion: "If `<sender>` should be a client, run `/inbox-digest <suggested-slug> --bootstrap`."
6. **Retention** (only if `--retention <days>` was set): call `modules/retention.md` `apply_retention(vault_root, days)`.
7. **Log rotation** (every run, regardless of flags): call `modules/retention.md` `rotate_logs()`.
8. **Heartbeat write** (every run): call `modules/heartbeat.md` `write_heartbeat(run_id, mode, exit_code, summary)`.
9. **Release lock**.

## Operational logging

Every run writes ONE summary line to `~/.claude/logs/inbox-digest/<YYYY-MM-DD>.log`:

```
<iso> run_id=<uuid> mode=<all|single|bootstrap|reset|dry-run> dry_run=<bool> triage=<bool> retention=<int|null> clients=<n> exit=<ok|partial|fail>
```

Phases append their own per-phase log lines (per-client `phase=1-discover`, `phase=2-fetch`, `phase=3-digest`). Adapter (`email-backend.md`) appends per-MCP-call lines. The summary is what <your-name> grep'd to see "did /inbox-digest run today and what happened."

NO PII anywhere in operational logs.

## Output to user (terminal)

Always print a concise summary at run end. Examples:

**Single-client live run:**
```
✓ /inbox-digest gut-center
  Scanned 12 threads, filed 4 new (1 inferred), skipped 8 dupes, 2 attachments extracted.
  Brief: context/clients/gut-center/briefs/2026-05-08_brief.md
  Tasks added: 3 (1 needs verification — see *(inferred)* markers in tasks.md)
```

**`--all` run (Sprint 1 — no Phase 4):**
```
✓ /inbox-digest --all
  4 clients scanned: gut-center (4 new), warrior-sanctuary (1 new), psychable (0), two-eagles-construction (2 new).
  Per-client briefs: context/clients/<slug>/briefs/2026-05-08_brief.md
  Sprint 2 deferred: cross-client morning digest will land here once the per-client briefs prove they're being read.
```

**Dry-run:**
```
✓ /inbox-digest gut-center --dry-run (NO WRITES, NO GMAIL LABELS, NO last_scan UPDATE)
  Would scan 12 threads, file 4 new, skip 8 dupes, extract 2 attachments.
  Would apply Gmail label "Clients/GutCenter" to 4 threads.
  Would write brief to context/clients/gut-center/briefs/2026-05-08_brief.md
  Would add 3 tasks to context/clients/gut-center/tasks.md
```

**Bootstrap (folder layout — default):**
```
✓ Bootstrapped gut-center: <example-client>
  Layout:      folder
  Frontmatter: <vault>/context/clients/gut-center/index.md
  Next steps:
    /inbox-digest gut-center --since 2026-04-01    # backfill 30+ days
    /inbox-digest gut-center                       # scan since now
```

**Bootstrap (flat-client layout):**
```
✓ Bootstrapped <example-client>: <example-client> — <example-client>
  Layout:      flat-client
  Frontmatter: <vault>/context/clients/<example-client>.md
  Next steps:
    /inbox-digest <example-client> --since 2026-04-01    # backfill 30+ days
    /inbox-digest <example-client>                       # scan since now
```

**Heartbeat warning surfaced (if applicable, e.g. last run was >36h ago AND/OR exit_code != 0):**
The warning ALSO appears at the top of each rendered brief per Phase 3 + heartbeat module. The terminal summary is just a summary; per-client briefs carry the surface for <your-name>'s morning read.

## Failure modes summary

| Condition | Action |
|---|---|
| Invalid argument combination | Print usage hint, exit 1, no side effects |
| Concurrency lock held by alive PID | Print "already running" message, exit 0 |
| Concurrency lock create fails (FS error) | Print error, exit 2, no side effects |
| Phase 1 returns no clients to scan | Print "no eligible clients", run heartbeat, exit 0 |
| Phase 2 errors on one client | Continue with remaining clients; that client's `last_scan` unchanged; summary shows partial |
| Phase 3 errors on one client | Continue; that client's brief NOT written; tasks.md NOT updated |
| Heartbeat write fails | Log; exit normally — heartbeat is best-effort observability, not load-bearing |
| Lock cleanup fails on exit | Log error; user may need to manually `rm ~/.claude/.inbox-digest.lock` next run |

## Sprint 2 hooks (NOT implemented in Sprint 1)

For when Sprint 2 ships:
- After step 4 (Phase 3) and before step 5 (Triage), insert:
  ```
  4.5. **Phase 4** (only if `--all`): per `modules/phase-4-rollup.md`, dispatch Business Consulting Counsel (#41) to prioritize cross-client actions, write `<vault>/context/morning-digest/<YYYY-MM-DD>_morning-digest.md`.
  ```
- Add `--deep-review` flag (Sprint 2): upgrades counsel dispatch from persona to agent mode.
- Auto-trigger rule (Sprint 2): if `--all` AND ≥3 clients had ≥3 new threads, escalate to agent-mode counsel automatically (`should_use_agent_mode()`).

These are intentionally absent in Sprint 1.
