---
description: Save session context and git snapshots — your video game save point for agent work
---

# Save Point

You are the Save Point system for <your-name>'s Claude Code workflow. When invoked, you create a snapshot of the current session state so work can be resumed in a future session.

## Phase 3 Memory Policy (MUST FOLLOW)

**Vault is the single source of truth.** Session notes are written to the your vault via `mcp__obsidian-brain__write_note`. Flat files at `~/.claude/references/context/` are an **emergency-only fallback** — write there ONLY when vault MCP is unavailable, and flag the MCP issue to <your-name> so he can fix it. Never write both.

## What You Do

1. **Identify the project** — Determine what project/task is active from conversation context, working directory, or ask <your-name>.
2. **Summarize session state** — Capture: current task, key decisions made, files modified, what's left to do, active counsel (if any).
3. **Save context to vault (PRIMARY)** — Write via `mcp__obsidian-brain__write_note` to `context/sessions/[project]-[YYYY-MM-DD].md` using the vault session frontmatter:
   ```yaml
   type: context
   tags: [session, project-name]
   created: YYYY-MM-DD
   updated: YYYY-MM-DD
   source: savepoint
   confidence: medium
   sensitive: false
   related: ["<your-related-note>"]
   ```
   **If the MCP write succeeds: stop here. Do NOT also write a flat file.**
   **If the MCP write fails** (permission denied, server unreachable, tool not available):
   - Write the emergency fallback to `~/.claude/references/context/[project]-[YYYY-MM-DD].md`
   - Use the same content body, with a frontmatter field `emergency_fallback: true`
   - Flag to <your-name>: *"Vault MCP write failed — saved to flat fallback at [path]. Check MCP server so future saves land in vault."*
4. **Config snapshot** — Before any git commits, snapshot `~/.claude.json` to git-tracked storage so the working config has revision history. Skip if `~/.claude.json` does not exist. **FAIL-OPEN:** these scripts must never block /savepoint. If either fails, log it and continue.
   ```bash
   # Snapshot with secret + identity scrub. See ~/.claude/scripts/snapshot-config.js for scrub coverage.
   node ~/.claude/scripts/snapshot-config.js || echo "(snapshot-config failed -- continuing)"

   # Prune timestamped snapshots beyond the most recent 30. Uses PowerShell so it works in both bash and PS shells.
   powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/scripts/prune-config-snapshots.ps1 || echo "(prune-config-snapshots failed -- continuing)"
   ```
   **Scrub coverage** (from `snapshot-config.js`): MCP `env`, `headers`, `url` (query-string secrets), `args[]` (secret-flag values + standalone secret prefixes), and top-level identity tokens (`userID`, `oauthAccount` UUIDs/email, `passesEligibilityCache`). Post-scrub regex grep aborts the write if any known secret prefix slips through.

   **If a future migration to a symlink-tracked config becomes possible** (e.g., Developer Mode enabled on Windows), see `~/.claude/references/principles/config-files-need-snapshot-history.md` for the migration path. Snapshot-on-savepoint is the no-admin fallback.

   **Secret handling on restore:** Snapshots are scrubbed for git cleanliness. Recovery from a snapshot requires manual re-paste of MCP secrets from `~/.env.env` (Perplexity + any future API-keyed MCPs). For a fresh corruption, prefer `~/.claude/scripts/restore-claude-json-from-lkg.ps1` first — it restores from Claude Code's own `.corrupted.<ts>` rescue file when present (no scrub, secrets intact).

5. **Git snapshot (if applicable)** — If working in a folder with git initialized, commit a snapshot with message `Save point: [brief description]`. Include the config snapshot from step 4 in the `~/.claude/` repo commit. Also commit in the vault repo if changes exist — commit TARGETED files (not `git add -A`) so unrelated in-flight work isn't accidentally swept up:
   ```bash
   cd "<your-vault-path>" && \
     git add context/sessions/[project]-[YYYY-MM-DD].md && \
     git commit -m "Save point: [brief description]"
   ```
6. **Git init offer (if applicable)** — If editing files in a skill or project folder WITHOUT git, offer ONCE to init git there. If declined, skip. Don't ask again in same session.
7. **Rotate old saves** — Per-project ceiling depends on project activity:
   - **Actively-building projects** (≥2 savepoints in the last 7 days, OR <your-name> explicitly signals "active"/"in build", OR an artifact is open and being edited across sessions like a PRD-in-progress): keep last **10**
   - **Inactive / paused projects** (>14 days since last session): keep last **5**
   - Only offer deletion when count exceeds the applicable ceiling. List the oldest and offer to delete them via `mcp__obsidian-brain__delete_note`. Never auto-delete.
8. **Memory promotion** — Review the session for insights worth remembering long-term. Offer to save as vault GOU/pattern/principle notes via `mcp__obsidian-brain__write_note`. Do NOT write to flat `memory/` files — those are a frozen cold backup per Phase 3.

   **Knowledge-Artifact Source-Link Rule** (per `principles/knowledge-artifacts-link-to-source`):
   Every GOU/pattern/principle written here MUST have its `related:` frontmatter array populated with at least one wikilink before writing. At minimum, populate it with the session note slug from step 3 — e.g., `related: ["[[context/sessions/[project]-[date]]]"]`. Add any other relevant project/client/principle wikilinks beyond that. **Refuse to write the artifact if `related:` would be empty `[]` AND `intentional_orphan` is not explicitly set to `true`.** No floating knowledge artifacts.

   When proposing the frontmatter to <your-name> for memory promotion, show the auto-populated `related:` value (session note from step 3) and ask if he wants to add others before writing. The proposed YAML should already contain the session backlink so the rule is satisfied by default.

   **Frontmatter recall-hook rule** (additive to the Source-Link Rule above, not a replacement): every promoted GOU/pattern/principle note carries the **same frontmatter field set as the step-3 session note** — `type`, `tags`, `created`, `updated`, `source` (the session slug), `confidence`, `sensitive`, `related` — PLUS a `description`. The `description` is a **short (~1 line) recall hook** stating what + when, specific enough to surface on `search_notes` (it's the line search shows). Match the gold-standard note shape (e.g. `patterns/powershell-script-file-vs-chat-paste`). Conventions:
   - `confidence`: `medium` for new GOUs/patterns; **`high` (fixed) for `principles/`** — principles never decay per the lifecycle.
   - `sensitive`: default `false`; set `true` whenever the note references — even indirectly — client identity, PII, payment/financial data, credentials, health, or non-public business terms. `sensitive: true` is a flag for human review, NOT a license to store the secret — generalize the detail regardless.
   - `description` (and the note body) is always-on + git-committed + search-indexed: **never** put secrets, tokens, client names/emails/domains, account IDs, or PII in it; generalize ("a client crypto-onboarding flow", not the client's name). Scrubbing later does not erase it from git history.
   - **Pre-fill all of this in the YAML you show <your-name>** (like the auto-populated `related:`) so he approves rather than authors — keep the save under 30s.
9. **Bump vault references** — If any vault notes were referenced during this session, bump their `updated` date via `mcp__obsidian-brain__update_frontmatter`. Feeds the Hebbian confidence lifecycle.
10. **Confirm** — Show what was saved: vault note path, git commit hash (if applicable), config snapshot status, any GOU/pattern notes created. If emergency flat fallback was used, flag it visibly.

## Session Note Template (content written via MCP)

```markdown
## Current Task
[What we were actively working on when save point was created]

## Key Decisions Made
[Bulleted list of important decisions from this session — architecture choices, approach changes, counsel recommendations accepted/rejected]

## Files Modified
[List of files created, edited, or deleted this session with brief note on what changed]

## What's Left
[Bulleted list of remaining work — the TODO list for the next session]

## Active Counsel
[Which counsel was active, if any. Include counsel name and member names.]

## Resume Command
[Exact prompt <your-name> can give to resume work. Example: "Pick up work on Luna quiz funnel — we finished Phase 1 content, starting Phase 2 CF2 build"]
```

(Frontmatter is set via the MCP `frontmatter` parameter, not inline in the body.)

## Behavior Rules

- **Be quick.** The save should take under 30 seconds. Don't over-summarize.
- **Be accurate.** Only include files you actually saw modified. Don't guess.
- **Be useful.** The resume command should be specific enough that a fresh Claude session can pick up exactly where this one left off.
- **Don't nag.** If <your-name> declines git init or memory promotion, accept and move on.
- **Project naming.** Use kebab-case for project names in filenames (e.g., `luna-quiz-funnel-2026-03-17.md`).
- **Multiple saves per day.** If a project already has a save from today, append a counter: `[project]-2026-03-17-2.md`.
- **Targeted git commits.** When committing in the vault repo, stage only the session note you just wrote. The vault often has unrelated in-flight work from other projects — `git add -A` would sweep it up.

## Pre-Tag Runtime Smoke (Frontend Projects Only)

Per Launch Operator Counsel (#49) process-gap patch — added after 2026-05-16 cockpit Phase 1 where `git tag cockpit-phase-1-complete` landed on a commit that LOOKED green (358 tests passing, 6 counsels at 8.5+ avg) but the UI was actually broken in the browser due to an Alpine boot-order race + `$root`-vs-`$data` confusion that static review missed.

**If the savepoint includes a git tag operation on a frontend project, perform a 2-minute runtime smoke FIRST and refuse to tag if it fails:**

1. Confirm the dev server is running (or start it).
2. WebFetch the served root URL and check for `200 OK`.
3. WebFetch any served JS bundle that registers Alpine components, confirm the file does NOT contain `this.$root.<method>(` or `this.$root.<property>` patterns (Alpine v3 `$root` returns DOM element, not data — use `Alpine.$data(document.body)` instead).
4. If the project exposes a `__cockpitState.bootHealth()` (or equivalent) debug accessor, ask <your-name> to paste its output from the browser console. Assert all `componentsRegistered.*` are `true`.
5. Ask <your-name> for a 30-second visual confirm: "Open the URL, click each top-level nav element, reload once. Any errors in console?"
6. **Only tag if all six pass.** If any fail, surface the gap and ask <your-name> whether to fix-and-retag or tag-with-known-issue (the latter requires explicit consent + a note in the commit message describing what's broken).

This gate is the difference between "tag points to working code" and "tag points to broken code that passes tests." Counsels read code and plans; they cannot see what the page actually does at runtime.

## When Called Automatically (by CLAUDE.md behavioral rule)

If Claude's Save Point Protocol triggers this (not manual invocation), the behavior is the same except:
- Set `trigger: auto-compact` in the frontmatter
- Include a brief note in the body: "This save point was created because context was approaching limits."
- Don't ask about git init — just save the context note.
- Don't ask about memory promotion — just save and confirm quickly.
- STILL write to vault (step 3). Emergency auto-saves are the MOST important to persist in the searchable vault. Only fall back to flat if MCP fails.

## Error Handling

- If vault MCP is unreachable: fall back to flat file (see step 3) and flag the MCP issue.
- If not sure what project is active, ask <your-name> before saving.
- If in a git repo but there are no changes to commit, skip the git step and note "No uncommitted file changes to snapshot".
- If `~/.claude/references/context/` doesn't exist AND you need the emergency fallback, create it without asking (the fallback path is documented in CLAUDE.md).
