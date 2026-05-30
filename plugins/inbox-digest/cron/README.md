# Inbox Digest — Silent Cron (<example-client>)

Daily auto-runs of `/inbox-digest <example-client>`. No window, no prompts. If there's no new mail since `last_scan`, Phase 3 skips brief generation (built-in behavior) — no report is produced and no notification fires.

## Triggers

| When | Trigger type |
|---|---|
| 5 min after Windows sign-on | `LogonTrigger Delay=PT5M` |
| 1:00 PM local, daily | `CalendarTrigger ScheduleByDay` |
| 6:00 PM local, daily | `CalendarTrigger ScheduleByDay` |

## Install (one-time, elevated PowerShell)

```powershell
cd $env:USERPROFILE\.claude\plugins\local\inbox-digest\cron
.\install.ps1
```

The script:
1. Verifies `claude` CLI is in PATH (warns if missing)
2. Unregisters any existing `InboxDigest` task
3. Registers fresh from `InboxDigest.xml`

## Files

| File | Purpose |
|---|---|
| `InboxDigest.xml` | Task Scheduler manifest with all 3 triggers |
| `inbox-digest-hidden.vbs` | VBS shim that calls `run-example.bat` with window flag 0 (SW_HIDE) |
| `run-example.bat` | Invokes `claude -p --dangerously-skip-permissions "/inbox-digest <example-client>"` and logs |
| `install.ps1` | Idempotent task registration |

## Logs

`%LOCALAPPDATA%\inbox-digest-cron\<example-client>-<YYYY-MM-DD_HH-MM>.log` — one per run. Rotated after 30 days.

Quick tail:
```powershell
Get-ChildItem $env:LOCALAPPDATA\inbox-digest-cron | Sort-Object LastWriteTime -Descending | Select-Object -First 5
```

## Manual test

```powershell
Start-ScheduledTask -TaskName InboxDigest
```

Wait ~10–30s, then check the latest log file for output. If `claude` CLI is properly authed and `gmail-gong-mcp` is connected, a new brief will appear at `<vault>/context/clients/<example-client>/briefs/<today>_brief.md` (only if there's new mail).

## Disable / uninstall

```powershell
Disable-ScheduledTask -TaskName InboxDigest   # pause without removing
Unregister-ScheduledTask -TaskName InboxDigest -Confirm:$false   # remove entirely
```

## Changing the times

Edit `InboxDigest.xml`:
- Each `<CalendarTrigger><StartBoundary>YYYY-MM-DDTHH:MM:SS</StartBoundary>` controls one daily fire.
- The DATE portion of `StartBoundary` is just the anchor; only the time matters for `ScheduleByDay`.
- After editing, re-run `install.ps1` to apply.

## How "no new mail = no report" works

Phase 1 still runs (resolves the client, validates frontmatter, builds the Gmail query, calls `verify_auth`). Phase 2 runs `search_threads` — if the result has zero new messages after dedup against `.message-ids.jsonl`, the per-client summary has empty `new_thread_paths[]` AND `merged_thread_paths[]`. Phase 3 sees the empty bundle and short-circuits per its failure-mode table:

> `new_thread_paths` AND `merged_thread_paths` both empty → Skip brief generation; log "no new mail" metric; tasks.md untouched

The cron run completes silently. Log line still appears in `%LOCALAPPDATA%\inbox-digest-cron\` but no UI fires.

## Pairing with Brief Viewer

When a brief IS written, open it at `http://localhost:7374/c/<example-client>/<date>` — that's the Brief Viewer (separate plugin at `plugins/local/brief-viewer/`).
