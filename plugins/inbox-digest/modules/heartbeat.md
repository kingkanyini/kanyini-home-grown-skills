# Heartbeat Module (PATCH PHANTOM-F4)

Cron failure observability. Writes per-run heartbeat file; Phase 3 reads it to surface "no recent run" warnings in briefs.

## Operations

### `write_heartbeat(run_id, mode, exit_code, summary)`

Called by orchestrator at the END of every run (success or failure).

Atomic write to `~/.claude/logs/inbox-digest/last-run.json`:

```json
{
  "timestamp": "2026-05-08T07:32:30Z",
  "run_id": "<uuid-from-orchestrator>",
  "mode": "all",
  "exit_code": 0,
  "clients_scanned": 4,
  "summary": "<one-line summary string>"
}
```

`mode` is one of: `single | all | bootstrap | reset | dry-run`.
`exit_code` is `0` on full success, `1` on partial (some clients halted), `2` on full failure.

Pattern: write to `last-run.json.tmp` → fsync → rename. Never leave a partially-written heartbeat.

### `read_heartbeat()`

Returns `{exists: bool, hours_since_last: float|null, last_exit_code: int|null, summary: string|null}`.

Procedure:
1. If `last-run.json` does NOT exist: return `{exists: false}`. (First run is normal.)
2. Read + JSON-parse. If parse fails: return `{exists: false}` and log WARNING.
3. Compute `hours_since_last = (now_utc() - parsed.timestamp).total_hours()`.
4. Return populated dict.

### `should_warn_in_brief()` — convenience for Phase 3

Returns one of three states:
- `"none"` — no warning needed (recent successful run)
- `"stale"` — `hours_since_last > 36` regardless of exit code (cron health: scans haven't run lately, possibly silently broken)
- `"failure"` — `last_exit_code != 0` regardless of how recent (last run had errors)
- `"both"` — both conditions true (cron stalled AND last attempt failed)

Phase 3 surfaces a warning in the brief header for ANY non-`"none"` state, with text varying by case:
- `"stale"`: "⚠️ No /inbox-digest run in the last X hours. Verify cron health."
- `"failure"`: "⚠️ Last /inbox-digest run completed with errors (exit code Y). Review the operational log."
- `"both"`: "⚠️ No /inbox-digest run in the last X hours AND last attempt failed (exit code Y). Investigate cron + recent errors."

The 36h threshold accounts for: cron skipped a day, manual run done late, etc. Daily cron at 7am should put `hours_since_last` between 23-25h normally; > 36h means at least one full day was missed.

## Phase 3 integration

`phase-3-digest.md` 3.2.c calls `should_warn_in_brief()` before rendering each per-client brief. If true, emit the heartbeat warning header per `templates/brief.md`. The warning should include `hours_since_last` and `last_exit_code` (template already has placeholders for both).

## Failure modes

| Condition | Action |
|---|---|
| `last-run.json` missing | Treat as no prior run (no warning, no metric) |
| `last-run.json` malformed | Treat as missing; log WARNING |
| Atomic write fails | Halt heartbeat write; log error; orchestrator continues to exit |
| `last-run.json` permission denied | Log WARNING; downgrade to no-heartbeat mode for the rest of session |
