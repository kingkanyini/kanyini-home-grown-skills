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

---

# Per-Person Teammate Scans (<example-client>)

Each team member at <example-client> is its own inbox-digest client (`<person>-the-example-client`) scanned by the same `digest.js` engine against the same `<your-email>` inbox (From-header match, no separate OAuth). One Task Scheduler entry per person.

## Active roster

| Person | Slug | Task name | Cadence | Priority |
|---|---|---|---|---|
| <example-client> (founder) | `<example-client>` | `InboxDigest` | logon + 1 PM + 6 PM | high |
| Sam (VA) | `example-client` | `JenScan` | 9 AM + logon catch-up | medium |
| Alex (VA, Outsourced Doers) | `Alex-the-example-client` | `ExampleScanTwo` | 9 AM + logon catch-up | medium |
| Robin | `Robin-the-example-client` | `ExampleScan` | 9 AM + logon catch-up | medium |

Logs: `%LOCALAPPDATA%\inbox-digest-cron\<slug>-<stamp>.log`. Brief: `<vault>/context/clients/<slug>/briefs/`. Heartbeat: `~/.claude/.inbox-digest-<slug>.last-run.json`.

## Add a teammate (checklist)

> **Tripwire:** if this is the **5th+** teammate, build `new-teammate.ps1 <name> <email> [slug]` FIRST (template the 4 cron files + hub stub + <example-client>-roster line from one source), then use it. Below the 5th, the hand-clone below is cheaper than the generator (Task Scheduler XML needs absolute paths, so a generator saves only ~5 min/clone). Per `principles/avoid-premature-complexity`.

1. **Vault hub note** — `context/clients/<slug>.md`. Clone Sam's. Set `slug`, `client`, `email_addresses` (exact From-match), `priority: medium`, `last_scan: null`, `gmail_label: null`. **`aliases`:** use full names only (e.g. `["Sam Shelby","Sam Eldred"]`) — NEVER a bare common first name alone (a bare `"Robin"` searches the body of everything you've sent → false positives). If the surname is unknown, leave `aliases: []` and rely on `email_addresses`.
2. **4 cron files** (clone the `jen-*` set, swap `example-client` → `<slug>` and `Sam` → `<Name>` everywhere):
   - `run-<slug>.bat` — check the `--client <slug>`, the log filename, AND the `forfiles` rotation glob all use the new slug.
   - `<slug>-hidden.vbs` — points at `run-<slug>.bat`.
   - `<Name>Scan.xml` — `<URI>\<Name>Scan`, `<Arguments>` → the new `.vbs`, triggers (LogonTrigger `PT5M` + daily 09:00 CalendarTrigger).
   - `install-<name>.ps1` — `$taskName` + `$xmlPath` point at the new task/XML.
3. **<example-client> roster** — append the person's email to `<example-client>.md` `email_addresses` so <example-client>'s high-priority scan also catches it (see overlap note below).
4. **Install** (elevated PowerShell): `.\install-<name>.ps1`. Smoke-test: `Start-ScheduledTask -TaskName <Name>Scan`.
5. **Validate before committing**: `node ..\scripts\digest.js --client <slug> --dry-run` (read-only — confirms Phase 1 resolves the hub and the From-match is live). Then commit all 5 files.

## Remove a teammate

```powershell
Unregister-ScheduledTask -TaskName <Name>Scan -Confirm:$false
```
Then delete the 4 cron files, archive the hub note (`status: archived`), and drop the person's email from <example-client>'s `email_addresses`.

## Overlap note (how dual-surfacing actually works)

There is **no cross-client dedup engine**. Each teammate scans independently against its own `.message-ids.jsonl` ledger. Because each person's email is also in <example-client>'s roster, a thread sent to (say) Alex can surface in **both** Alex's brief and <example-client>'s brief. That's intended — <example-client> (high priority) is the catch-all; the per-person brief surfaces direct-to-them activity. If you want a teammate's mail to appear **only** in their own brief, remove their address from <example-client>'s `email_addresses`.

---

# Inbox Digest — Silent Cron (TWS Newsletter)

Daily auto-runs of the Node CLI for `tws-newsletter` (<your-org-email> newsletter replies + reply drafts). Note: all cron tasks invoke `digest.js` directly — the `claude -p` path described above for <example-client> is the legacy description; `run-example.bat` and `run-tws.bat` both run the self-contained Node CLI.

## Triggers

| When | Trigger type |
|---|---|
| At Windows sign-on | `LogonTrigger` |
| 1:00 PM local, daily | `CalendarTrigger ScheduleByDay` |
| 6:00 PM local, daily | `CalendarTrigger ScheduleByDay` |

## Install (one-time, elevated PowerShell)

```powershell
Register-ScheduledTask -TaskName InboxDigestTws -Xml (Get-Content "$env:USERPROFILE\.claude\plugins\local\inbox-digest\cron\InboxDigestTws.xml" -Raw)
```

## Files

| File | Purpose |
|---|---|
| `InboxDigestTws.xml` | Task Scheduler manifest (logon + 13:00 + 18:00) |
| `tws-newsletter-hidden.vbs` | VBS shim that calls `run-tws.bat` hidden |
| `run-tws.bat` | Invokes `node digest.js --client tws-newsletter` and logs |

## Prerequisites

- OAuth ceremony completed: `node scripts/auth-tws.js` signed in as <your-org-email> (tokens at `~/.gmail-mcp-tws/credentials.json`)
- GCP OAuth consent screen in **Production** status (Testing tokens die in 7 days)
- `ANTHROPIC_API_KEY` in `~/.claude/.env` (drafting + brief synthesis)

## Logs

`%LOCALAPPDATA%\inbox-digest-cron\tws-<stamp>.log` — rotated after 30 days.

## Manual test

```powershell
Start-ScheduledTask -TaskName InboxDigestTws
```

## Disable / uninstall

```powershell
Disable-ScheduledTask -TaskName InboxDigestTws
Unregister-ScheduledTask -TaskName InboxDigestTws -Confirm:$false
```

## What the drafter does (and never does)

Auto-DRAFTS replies to genuine human newsletter responders into the info@ Drafts folder. **Never sends** — the no-send invariant is enforced in code by a static scan test (`scripts/test_drafter.mjs`). <your-name> reviews drafts in Gmail and sends manually. The daily brief lists drafts awaiting review with deep links, plus next-day disposition (sent / edited / discarded / pending aging).
