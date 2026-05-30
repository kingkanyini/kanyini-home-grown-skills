# Bootstrap Module

Interactive new-client onboarding. Called by orchestrator (`commands/inbox-digest.md`) when `--bootstrap` flag is present. Extracted from orchestrator per single-responsibility (PATCH Hamedani) — orchestrator dispatches, this module interviews + writes.

## Inputs (from orchestrator)

- `slug` — proposed slug for the new client (from `<slug-arg>`)
- `vault_root` — vault path
- `accounts_file_path` — `~/.claude/contacts/accounts.json` (optional; if missing, prompt is free-text)

## Procedure

### B.1 Pre-flight slug validation

Before any user prompts:
1. Validate `slug` against `^[a-z0-9][a-z0-9-]{0,40}$` (CIPHER-F2). If fail → halt with: `"Proposed slug '<value>' fails validation regex. Use lowercase alphanumerics and hyphens, 1-41 chars, must start with letter/digit."`
2. Path containment: `Path(vault_root, "context/clients", slug).resolve()` must stay inside `Path(vault_root, "context/clients").resolve()`. If fail → halt.

### B.2 Layout choice + presence check

1. **Layout question** — `AskUserQuestion`: "Hub layout for `<slug>`?"
   - **Folder layout** (Recommended for new clients): hub at `<slug>/index.md`, thread notes inside the same folder.
   - **Flat-client layout**: hub at `<slug>-client.md` (clients root), thread notes inside sibling sub-folder `<slug>/`. Use this when the vault already has a flat hub for this client (e.g., legacy `<slug>-client.md` already exists).
   - In non-interactive context (cron / no TTY), default to **Folder layout**.

2. **Conflict check** — probe both candidate hub paths:
   - `folder_hub = <vault_root>\context\clients\<slug>\index.md`
   - `flat_hub   = <vault_root>\context\clients\<slug>-client.md`
   If BOTH already exist → halt with: `"Both <slug>/index.md and <slug>-client.md exist. Resolve conflict before bootstrap (delete or rename the wrong one)."` Bootstrap MUST NOT pick a winner silently.

3. **Branch by chosen layout:**
   - **Folder layout:**
     - If `<vault_root>\context\clients\<slug>\` does NOT exist: `AskUserQuestion` "Folder context/clients/<slug>/ doesn't exist. Create it?" → Yes / No. On No → exit cleanly. On Yes → `mkdir`.
     - If `folder_hub` exists with valid frontmatter: `AskUserQuestion` "index.md already exists for <slug>. Overwrite frontmatter? (existing body content will be preserved)" → Overwrite / Cancel. On Cancel → exit cleanly.
   - **Flat-client layout:**
     - No folder creation required at bootstrap time. Phase 2 creates the sibling sub-folder lazily on first thread write.
     - If `flat_hub` exists with valid frontmatter: `AskUserQuestion` "<slug>-client.md already exists. Overwrite frontmatter? (existing body content will be preserved)" → Overwrite / Cancel. On Cancel → exit cleanly.

Set `hub_path` to the chosen target (used by §B.5).

### B.3 Interview (AskUserQuestion — multiple questions split across 2 calls due to 4-question max)

Ask these questions together in one `AskUserQuestion` invocation (max 4 per call; split into 2 calls if needed):

**Call 1:**
- Display name (text — e.g., "<example-client>")
- Primary email address (text — e.g., `<example-client>@example.com`)
- Domain (text — e.g., `example.com`; auto-suggest from email if user gives one)
- Aliases (text, comma-separated — e.g., `"<example-client>, <example-client>, <example-client>"`)

**Call 2:**
- Relay senders to trust (multiselect: Zoom recaps / Calendar invites / Drive / Other)
  - Defaults checked: Zoom + Calendar
  - Maps to: `no-reply@zoom.us`, `calendar-notification@google.com`, `drive-shares-noreply@google.com`
- Gmail account (multiselect from `accounts.json` if present, else single text input)
- Priority (high / medium / low)

### B.4 Derive computed fields

- `label_slug` = PascalCase of `slug` (e.g., `gut-center` → `GutCenter`). Implementation: split on `-`, capitalize each token, concat. NO spaces, NO underscores in result.
- `gmail_label` = `Clients/<label_slug>` — verify matches allowlist `^Clients/[A-Za-z0-9][A-Za-z0-9_-]*$` (CIPHER-F5). If fail (e.g., user gave a slug that PascalCases to something with disallowed chars), halt with explicit error.

### B.5 Render + write

1. Read `templates/client-frontmatter.yml`.
2. Substitute placeholders:
   - `{{display_name}}` → from interview
   - `{{slug}}` → input slug
   - `{{primary_account}}` → from interview
   - `{{primary_email}}` → from interview
   - `{{primary_domain}}` → from interview (or derived from email)
   - `{{label_slug}}` → from B.4
3. Add additional aliases beyond `display_name` (the template defaults to one alias = display_name; append the user's comma-separated list).
4. Set `priority` from interview.
5. Set `relay_senders` to the multiselect-resolved list.
6. Atomic write to `hub_path` (chosen in §B.2; `.tmp + fsync + rename`).
   - **Frontmatter/body parsing rules:** an Obsidian/markdown file with frontmatter follows this shape:
     ```
     ---
     <yaml frontmatter>
     ---
     <body — may itself contain --- as horizontal rules>
     ```
     The frontmatter delimiters are the FIRST `---` on line 1 (or first non-blank line) and the SECOND `---` on its own line. Everything after the second `---` is the body.
   - **Preservation procedure** (if overwriting): split on the FIRST two `---` lines only (using a proper line-by-line scanner, NOT regex on the whole document). Replace the YAML frontmatter block, keep everything from line N+1 onward (where N is the line number of the second `---`). Do NOT use a naive `string.split("---")` approach — that breaks on body content with horizontal rules.
   - If the existing hub note is malformed (no frontmatter, only one `---`, etc.): log WARNING, treat as "no body to preserve," and write a fresh file with just frontmatter + the template's default `# {{display_name}}` heading.

### B.6 Output

Print to user:
```
✓ Bootstrapped <slug>: <display_name>
  Layout:      <hub_layout>            # "folder" or "flat-client"
  Frontmatter: <hub_path>              # actual chosen path (e.g., <vault_root>/context/clients/<slug>/index.md OR <vault_root>/context/clients/<slug>-client.md)
  Next steps:
    /inbox-digest <slug> --since 2026-04-01    # backfill 30+ days
    /inbox-digest <slug>                       # scan since now
```

## Failure modes

| Condition | Action |
|---|---|
| Slug regex / path traversal fail | Halt with explicit error |
| User declines folder creation | Exit cleanly |
| User cancels overwrite | Exit cleanly |
| Computed `gmail_label` fails allowlist | Halt with explicit error |
| `templates/client-frontmatter.yml` missing | Halt with internal error (skill broken) |
| Both layouts already exist for slug | Halt; require manual conflict resolution |
| Atomic write fails | Halt; folder may exist but hub note not written — user reruns |

## Operational log

```
<iso> phase=bootstrap run_id=<uuid> slug=<slug> result=<ok|cancel|halt> reason=<short> ms=<duration>
```

NO PII (no display name, no email addresses) in operational log. Bootstrap traffic is low-volume, but the rule stands.
