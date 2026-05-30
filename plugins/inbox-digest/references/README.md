# /inbox-digest Skill — Reference

Scans your Gmail for client emails, files them into the Obsidian vault under `context/clients/<slug>/`, generates a daily per-client brief with TODAY'S 3 MOVES + grounded action items, and (Sprint 2) will roll up a counsel-prioritized cross-client morning digest.

---

## Sprint Status

- **Sprint 1 (current):** Phases 1–3. Per-client briefs ship with the "TODAY'S 3 MOVES" lead and tasks.md ledger. NO cross-client digest yet.
- **Sprint 2 (deferred):** Phase 4 — Business Consulting Counsel (#41) prioritizes actions across all clients. Gated on usage data: ships only after 5–7 days of Sprint 1 shows briefs are read and tasks are acted on.

---

## Quick Start

### Onboard a new client

```
/inbox-digest <example-client> --bootstrap
```

Walks you through filling in the new client's hub frontmatter (email addresses, domains, aliases, relay senders, gmail account, priority). Bootstrap asks which **hub layout** to use:

- **Folder layout** (default for new clients): writes `<vault>/context/clients/<example-client>/index.md` + sibling thread notes inside the same folder.
- **Flat-client layout** (legacy-compatible): writes `<vault>/context/clients/<example-client>-client.md` as the hub, with thread notes in sibling sub-folder `<example-client>/`. Use this when the vault already has a flat client hub for this person (e.g., `<example-client>-client.md`).

Phase 1 transparently resolves either layout at scan time, so all other commands work the same regardless of the chosen layout.

### Daily use

```
/inbox-digest gut-center                  # one client, scan since last_scan
/inbox-digest --all                       # sweep every active client
/inbox-digest gut-center --dry-run        # preview without any writes
/inbox-digest gut-center --since 2026-04-01   # backfill window override
/inbox-digest gut-center --triage         # also surface unmatched senders
/inbox-digest gut-center --retention 365  # archive emails > 365 days old
/inbox-digest gut-center --reset-last-scan 2026-05-01  # admin recovery
```

---

## Prerequisites

- **`gmail-gong-mcp` MCP** (`gongrzhe/server-gmail-autoauth-mcp`) installed and authenticated. Typed direct Gmail-API wrapper, OAuth-managed credentials at `~/.gmail-mcp/credentials.json`. Most often authed to `<your-email>` for <your-name>'s primary client work. Config lives at `~/.claude.json` (user + project scope), pinned to `@1.1.11` per the standard Windows `cmd /c npx -y` pattern.
- **Python 3.9+** with `pdfplumber` installed: `pip install pdfplumber`
- **Vault** at `<your-vault-path>\` reachable via `mcp__obsidian-brain__*`.
- **Attachment downloads:** handled by `mcp__gmail-gong-mcp__download_attachment` — single typed call, writes directly to `savePath/filename`. **Fallback:** URL-only (note records the Gmail thread URL) if `mcp__gmail-gong-mcp__*` tools are missing at probe time (MCP config error or OAuth not completed).
- **Single-MCP reliability:** v1.5 collapses the v1 hybrid (Pipedream find-email + download, claude_ai_Gmail native, URL-only triple-backend) into one typed call per attachment. **Reliability gate:** if per-attachment failure rate exceeds **0.2%** after 7 days of cron runs (4× tighter than the v1 0.5% gate because there's no two-LLM-call multiplier), investigate before escalating. The v2 Composio swap remains the escalation path if gongrzhe itself proves unreliable at the API layer.

---

## Switching Gmail accounts (v1.5 limitation)

`gmail-gong-mcp` authenticates to ONE account at a time per Claude Code session (OAuth credentials at `~/.gmail-mcp/credentials.json`). To scan a different account:

1. Revoke current creds: `Remove-Item ~/.gmail-mcp/credentials.json`
2. Re-run the gongrzhe auth flow: `& "C:\Program Files\nodejs\npx.cmd" -y "@gongrzhe/server-gmail-autoauth-mcp@1.1.11" auth` (admin PowerShell — `.cmd` invocation bypasses `.ps1` execution-policy restrictions in elevated shells)
3. In Google's account picker, choose the desired account
4. Restart Claude Code so the new credentials load
5. Run `/inbox-digest <slug>`. The skill's T0 sanity check (`verify_auth`) compares the active account to the client's frontmatter `gmail_accounts[0]` and halts cleanly if mismatched.

When you commit to scanning ≥2 accounts daily, swap to **Composio** (v2 backend — see spec Section 7).

---

## Recommended cron (after Sprint 1 stable)

Once you've used `/inbox-digest --all` manually for ~5–7 days and trust the output:

```
/schedule "0 7 * * *" "/inbox-digest --all"
```

Runs every day at 7am. The concurrency lock prevents collision with manual runs at the same time.

---

## Layout per client

The skill supports two hub layouts. Both produce the same scan behavior.

**Folder layout (default for new clients):**
```
<vault>/context/clients/<slug>/
├── index.md              # the frontmatter contract — edit to tune match rules
├── inbox/                # raw email log (auto-written)
│   ├── <YYYY-MM-DD>_<subject-slug>.md   # per-thread notes
│   ├── attachments/      # downloaded attachments + .extracted.md siblings
│   └── .message-ids.jsonl  # append-only idempotency index
├── briefs/               # daily synthesized briefs (auto-written)
│   └── <YYYY-MM-DD>_brief.md
├── tasks.md              # action item ledger (auto-appended; check off manually)
├── recaps/               # YOUR manually polished meeting recaps — UNTOUCHED
└── synthesis/            # YOUR cross-interview matrices — UNTOUCHED
```

**Flat-client layout (legacy-compatible — used when the vault already has a flat hub):**
```
<vault>/context/clients/
├── <slug>-client.md      # the frontmatter contract — flat hub at clients root
└── <slug>/               # sibling sub-folder for thread notes (created lazily)
    ├── inbox/                # same as folder layout
    │   ├── <YYYY-MM-DD>_<subject-slug>.md
    │   ├── attachments/
    │   └── .message-ids.jsonl
    ├── briefs/
    │   └── <YYYY-MM-DD>_brief.md
    ├── tasks.md
    ├── recaps/               # YOUR notes — UNTOUCHED
    └── synthesis/            # YOUR notes — UNTOUCHED
```

Both layouts use identical frontmatter. Phase 1 picks whichever exists; if both exist for the same slug, folder layout wins and a WARNING is logged (resolve manually by deleting one).

---

## Frontmatter contract (hub note: `index.md` OR `<slug>-client.md`)

The skill reads this at the start of every scan. See `templates/client-frontmatter.yml` for the full schema. Key fields you'll tune over time:

- **`aliases`** — add nicknames, project names, anything that appears in subject/body of relevant emails. The skill uses these to file Zoom recaps, calendar invites, and self-notes that don't come directly FROM the client.
- **`relay_senders`** — extend with more services that forward client meetings (Calendly, Loom, etc.). Default trusts Zoom + Google Calendar.
- **`priority`** — `high` / `medium` / `low`. Drives counsel weighting in the morning digest (Sprint 2).
- **`gmail_label`** — what Gmail label gets auto-applied to filed threads. Must start with `Clients/` (security allowlist).
- **`backfill_confirm_threshold`** — number of threads above which the skill prompts before scanning. Default 100.

---

## Disk space projections

Rough math (5 active clients × ~4 emails/day × 1.5 attachments × 2MB ≈ 12MB/client/day):

- 1-year retention (default): ~22GB total
- 6-month retention: ~11GB
- 90-day retention: ~5.5GB

Default 365 days balances vault searchability against disk pressure. Run `/inbox-digest --all --retention 90` to compress.

---

## Behavioral metrics (Lenny patch)

Operational log at `~/.claude/logs/inbox-digest/<YYYY-MM-DD>.log` tracks:

- `digest_open_latency_hours` — time between brief write and your next interaction with the brief file. Heuristic proxy for "did I actually read yesterday's brief."
- `task_completion_pct` — checked / total in `tasks.md` per client. Updated on each scan.
- `email_response_latency_hours` — for emails you replied to (Phase 3 derives this from Gmail sent items + tasks ledger). Sprint 1.5+ feature; v1 just emits brief_written + task_completion.

**Sprint 2 ship gate**: after 7 days, if `digest_open_latency_hours` median > 8h, the digest UX still isn't sticking — fix the brief format before adding Phase 4 counsel rollup.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `"Already running: PID X"` on every invocation | Manual + cron collision, OR a stale lock from a crashed run | Wait if X is alive; `Stop-Process -Id X` if hung; or `Remove-Item ~/.claude/.inbox-digest.lock` if process is gone (skill auto-recovers next run) |
| `"MCP is auth'd to <X>, expected <Y>"` | Wrong Gmail account active in Claude Code | Reconnect MCP per "Switching Gmail accounts" above |
| `"slug fails validation regex"` | Frontmatter slug has uppercase, underscores, special chars, or > 41 chars | Rename folder + update `slug:` to lowercase a-z 0-9 hyphens, max 41 chars, must start with letter/digit |
| `"gmail_label must match Clients/* prefix"` | Frontmatter label like `Inbox` or `Important` would mass-relabel | Set `gmail_label: Clients/<Name>` |
| `"slug resolves outside vault clients dir"` | Path traversal attempt (`../etc/passwd`) — security guard fired | Fix the slug; this is a CIPHER protection |
| Brief shows `(inferred)` items | Synthesis couldn't find verbatim source quote in thread notes | Audit those entries in source notes; tighten ground-truth or edit manually |
| Heartbeat warning at top of brief | Last cron run > 36h ago AND/OR exit_code != 0 | Check `~/.claude/logs/inbox-digest/last-run.json` and the latest `<YYYY-MM-DD>.log`; fix cron or address scan errors |
| Repeated `429` errors | Gmail rate limit | Backoff retries 3 times then halts THIS client only — others still scan; Gmail recovers in minutes |
| Message-window capped (500 raw messages, narrow `--since`) | Backfill window too wide | `last_scan` was NOT advanced — narrow with `--since`, re-run |
| `"binary download deferred — gmail-gong-mcp not available"` | `mcp__gmail-gong-mcp__*` tools missing at probe time (MCP not loaded — config error or OAuth not completed) | Verify `~/.claude.json` has the `gmail-gong-mcp` entry, `~/.gmail-mcp/credentials.json` exists, and Claude Code was restarted after install. Re-run gongrzhe `auth` if creds missing. Until then, Gmail URL is recorded in the note |
| `"binary download failed via gongrzhe (gongrzhe_empty_file)"` | gongrzhe returned without error but the file at `savePath` is zero-byte | Open the Gmail URL recorded in the note. If failure rate > 0.2% across runs, investigate gongrzhe's underlying Gmail-API responses; escalate to Composio swap per design-spec §7 if systemic |
| `"binary download failed via gongrzhe (gongrzhe_attachment_not_found)"` | 404 on attachment ID — the message was likely deleted between scan-time and download-time | Open the Gmail URL recorded in the note. Rare edge case; expected when scans race with manual archive/delete |
| Tasks duplicated in tasks.md | Substring-match idempotency false-negative | Manually edit tasks.md to dedupe; tighten action wording in source thread |

---

## Limitations (v1)

- **Single Gmail account per session** — Composio swap deferred to v2.
- **DOCX not extracted** — only PDFs (via `pdfplumber`). DOCX support deferred.
- **Binary attachments** flow through `mcp__gmail-gong-mcp__download_attachment` (single typed call). Falls back to URL-only only if the MCP itself is absent at probe time (see `modules/email-backend.md`).
- **No Phase 4 cross-client digest** — Sprint 2.
- **No Slack / LINE / Messenger ingestion** — email only.

---

## File reference (when troubleshooting)

| File | Purpose |
|---|---|
| `~/.claude/plugins/local/inbox-digest/commands/inbox-digest.md` | Entry point + argument parsing + concurrency lock |
| `~/.claude/plugins/local/inbox-digest/modules/phase-1-discover.md` | Frontmatter validation + Gmail query construction |
| `~/.claude/plugins/local/inbox-digest/modules/phase-2-fetch.md` | Thread fetch + body sanitization + attachment + msg-id index |
| `~/.claude/plugins/local/inbox-digest/modules/phase-3-digest.md` | Brief synthesis + tasks.md append + behavioral metrics |
| `~/.claude/plugins/local/inbox-digest/modules/email-backend.md` | Gmail MCP adapter (v1.5 — gongrzhe single-MCP backend; swappable to Composio in v2) |
| `~/.claude/plugins/local/inbox-digest/modules/bootstrap.md` | New-client onboarding interview |
| `~/.claude/plugins/local/inbox-digest/modules/retention.md` | Disk hygiene — archive stale inbox + rotate logs |
| `~/.claude/plugins/local/inbox-digest/modules/heartbeat.md` | Cron health + brief-header warnings |
| `~/.claude/plugins/local/inbox-digest/modules/pdf-extract.md` | Wrapper around pdfplumber Python helper |
| `~/.claude/plugins/local/inbox-digest/scripts/extract-pdf.py` | PDF → markdown text extraction (real Python with pytest) |
| `~/.claude/logs/inbox-digest/<YYYY-MM-DD>.log` | Operational log (per-day, no PII) |
| `~/.claude/logs/inbox-digest/last-run.json` | Heartbeat file (cron observability) |
| `~/.claude/.inbox-digest.lock` | PID lock for concurrency protection |
| `<vault>/context/clients/<slug>/` | Per-client folder (auto-managed by skill) |
| `<vault>/context/morning-digest/` | Sprint 2 — cross-client digest output (Sprint 1: empty) |
| `<vault>/context/morning-digest/_conflicts.md` | Multi-client filing conflicts ledger |
| `<vault>/context/unfiled/` | --triage output for senders that don't match any client |
| `<vault>/context/projects/inbox-digest/` | Skill design spec + implementation plan |
