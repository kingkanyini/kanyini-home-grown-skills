# Retention Module (PATCH PHANTOM-F3)

Manages disk-space hygiene: archives stale `inbox/` content per-client, rotates operational logs.

## Operations

### `apply_retention(vault_root, days=365)`

Called by orchestrator at end of `--all` runs ONLY if `--retention <days>` flag is set. Default `days=365` if flag passed without value.

Procedure:

1. For each `<vault_root>\context\clients\<slug>\inbox\<file>.md`:
   a. Read frontmatter `date_latest`. If MISSING, NULL, or unparseable as ISO 8601 → fall back to frontmatter `date_first`. If THAT is also missing/unparseable → SKIP this file with WARNING log `"retention skipped <file>: no parseable date in frontmatter"` (do NOT archive a file we can't reliably date — protects against accidentally archiving recent notes).
   b. If `date_latest < (now - days)`: move file + matching `inbox/attachments/<note-slug>/` to `inbox/archive/<year>/`.
      - `<year>` = year portion of `date_latest` (or `date_first` if fell back). If somehow still missing, use current year as last-resort.
      - Mkdir archive dir if not exists.
      - Atomic moves preferred (`Move-Item` on Windows; `os.rename` on POSIX).
2. Update `inbox/.message-ids.jsonl`: prepend a comment-formatted line like `# <iso> archived <count> message_ids; entries retained for idempotency`. Keep all existing entries — never delete from the index.
3. Per-client log line:
   ```
   <iso> phase=retention run_id=<uuid> client=<slug> archived_files=<n> archived_attachments=<n> retention_days=<n>
   ```

### `rotate_logs(retention_days=90)`

1. Glob `~/.claude/logs/inbox-digest/<YYYY-MM-DD>.log` files.
2. Files older than `retention_days` (90 default): move to `~/.claude/logs/inbox-digest/archive/<year>/`.
3. Mkdir archive dir if not exists.

Called by orchestrator at end of EVERY run (regardless of `--retention` flag) — log rotation is housekeeping, not user-facing. Rotates at most once per run.

## Failure modes

| Condition | Action |
|---|---|
| Vault file move fails (permission, lock) | Skip THIS file; log WARNING; continue |
| Archive dir creation fails | Halt retention for this client; user-facing warning |
| `.message-ids.jsonl` update fails | Log WARNING; archive succeeded but index annotation didn't — non-fatal |

## Disk math reference

For <your-name>'s planning purposes (5 active clients × ~4 emails/day × 1.5 attachments × 2MB ≈ 12MB/client/day):
- 1 year retention: ~22GB total
- 6 months retention: ~11GB
- Default (365 days) chosen as balance between vault searchability and disk pressure

Documented also in `reference/README.md`.
