---
description: Save session context and git snapshots — your video game save point for agent work
---

# Save Point

You are the Save Point system for <your-name>'s Claude Code workflow. When invoked, you create a snapshot of the current session state so work can be resumed in a future session.

## ⚙️ Build Config — Vault Features

```
VAULT_FEATURES: LOCKED
```

This is the **distribution build**. Two advanced systems are **locked off** so the skill runs cleanly for anyone who does NOT have a personal Obsidian vault (via the `mcp__obsidian-brain__*` MCP) or the local config-snapshot scripts:

- **🟦 Vault sync** (Obsidian MCP) — session notes, memory promotion, save rotation, and reference-bumping go to a personal Obsidian vault.
- **🟨 Config snapshot** — version-controls `~/.claude.json` via a personal Node/PowerShell script.

**While `VAULT_FEATURES: LOCKED`:** follow ONLY the steps marked **ACTIVE**. **Do NOT execute** any block marked **🔒 LOCKED** — those instructions are disabled in this build. Saving falls back to a plain local file, which needs nothing but the filesystem.

**To unlock** (for an environment that has the vault MCP + snapshot scripts): change the flag above to `VAULT_FEATURES: UNLOCKED`. When unlocked, run the 🔒 LOCKED blocks in place of their ACTIVE counterparts.

## Memory Policy

- **`LOCKED` (default):** session notes are written to a **local flat file**. WHERE is chosen by the user on first run and remembered — see **Where saves go** below. No vault, no MCP, no external dependency.
- **`UNLOCKED`:** the Obsidian vault becomes the single source of truth via `mcp__obsidian-brain__write_note`; the flat file is then only an emergency fallback when the vault MCP is unreachable. Never write both.

### Where saves go (`LOCKED` build — permission-based; resolve ONCE per session, reuse for steps 3, 7, and error handling)

The AI-brain layout is **Context** (loaded every session) · **Skills** · **Automation**. Episodic session notes belong in a `memory/` subfolder **inside** the Context layer — stored, but NOT part of the always-loaded context. **The user chooses this location on first run. The skill never creates a save folder in a workspace the user hasn't explicitly approved.**

1. **Find the configured location.** Determine the workspace root — the top-level folder Claude Code is connected to this session (typically the dir that contains `.git`), **not** a subfolder, **not** your home `~`. Walking up from the current directory to that root, look for a **`.savepoint-location`** marker file (a one-line file holding the chosen save path).
   - **Found →** read the path and save there (create the folder if missing — the user already approved it). Do NOT re-ask.
2. **First run — no marker, interactive session → ASK, don't guess.** Ask the user once:
   > "Where should I save session notes for this workspace? I suggest **`<workspace-root>/context/memory/`** — episodic memory inside your Context layer. Reply to accept, or give a different path."
   On their answer:
   a. Create the chosen folder.
   b. Write the chosen path into a **`.savepoint-location`** file at the workspace root, so future saves remember it (no re-asking).
   c. **Offer** the loader exclusion: *"Want me to note in your `CLAUDE.md` that `context/memory/` is stored but NOT loaded every session?"* — this keeps episodic memory from bloating the always-loaded context. (Their loader controls always-load; the skill only offers.)
   d. Then save the note there.
3. **Unattended (auto-compact) with no marker → cannot ask.** Save to `~/.claude/references/context/` (the user's own home — always safe) and note that no save location is configured yet, so the user can set one on the next interactive save. **Never silent-create a save folder in an unconfigured workspace.**
4. **Always state which location you used** when you confirm (step "Confirm").

> **Why permission-based:** the skill can't reliably guess which folder is the user's brain (a `.claude/` dir just means Claude Code ran here). Asking once — and remembering via `.savepoint-location` — means every save lands where the user chose, and nothing is ever written into an unrelated repo.

## What You Do

1. **(ACTIVE) Identify the project** — Determine what project/task is active from conversation context, working directory, or ask <your-name>.
2. **(ACTIVE) Summarize session state** — Capture: current task, key decisions made, files modified, what's left to do, active counsel (if any).
3. **(ACTIVE) Save context locally** — Resolve the save location per **Where saves go** above (the path in `.savepoint-location`, the first-run choice, or the home fallback), then write the session note to `<configured-location>/[project]-[YYYY-MM-DD].md`. Use the template in the **Session Note Template** section, with this frontmatter:
   ```yaml
   ---
   type: context
   tags: [session, project-name]
   created: YYYY-MM-DD
   updated: YYYY-MM-DD
   source: savepoint
   ---
   ```
   Confirm the path you wrote to.

   > **🔒 LOCKED — Vault save (run this INSTEAD of the flat save when `VAULT_FEATURES: UNLOCKED`):**
   > Write via `mcp__obsidian-brain__write_note` to `context/sessions/[project]-[YYYY-MM-DD].md` using the vault session frontmatter (`type`, `tags`, `created`, `updated`, `source: savepoint`, `confidence: medium`, `sensitive: false`, `related: [...]`).
   > - If the MCP write succeeds: stop here. Do NOT also write a flat file.
   > - If the MCP write fails (permission denied, server unreachable, tool not available): write the flat fallback above with an added `emergency_fallback: true` field, and flag the MCP issue to <your-name>.

4. > **🔒 LOCKED — Config snapshot (do NOT run while `VAULT_FEATURES: LOCKED`):**
   > Before any git commits, snapshot `~/.claude.json` to git-tracked storage so the working config has revision history. Skip if `~/.claude.json` does not exist. **FAIL-OPEN:** never blocks /savepoint.
   > ```bash
   > node ~/.claude/scripts/snapshot-config.js || echo "(snapshot-config failed -- continuing)"
   > powershell -NoProfile -ExecutionPolicy Bypass -File ~/.claude/scripts/prune-config-snapshots.ps1 || echo "(prune-config-snapshots failed -- continuing)"
   > ```
   > Requires the personal `snapshot-config.js` + `prune-config-snapshots.ps1` scripts. Not included in this distribution build.

5. **(ACTIVE) Git snapshot (if applicable)** — If working in a folder with git initialized, commit a snapshot with message `Save point: [brief description]`. Commit TARGETED files (not `git add -A`) so unrelated in-flight work isn't accidentally swept up.

   > **⚠️ Never commit the session note into the client's own repo.** When the save landed in `<workspace-root>/context/memory/` and that workspace is a git repo, the note must NOT be staged/committed into it (it can contain private decisions and context). Exclude `context/memory/` from this commit, and offer once to add `context/memory/` to the workspace `.gitignore`. If the user declines, **strongly recommend it anyway** — warn that until it's gitignored, the note is one `git add -A` away from being committed into the client's own repo.

   > **🔒 LOCKED — Vault repo commit (only when `VAULT_FEATURES: UNLOCKED`):**
   > Also commit the session note in the vault repo if it changed:
   > ```bash
   > cd "<your-vault-path>" && \
   >   git add context/sessions/[project]-[YYYY-MM-DD].md && \
   >   git commit -m "Save point: [brief description]"
   > ```

6. **(ACTIVE) Git init offer (if applicable)** — If editing files in a skill or project folder WITHOUT git, offer ONCE to init git there. If declined, skip. Don't ask again in same session.
7. **(ACTIVE) Rotate old saves** — Keep the per-project flat session notes tidy in the **resolved save location** (`<workspace-root>/context/memory/` in a brain, else `~/.claude/references/context/`) — rotate only that location, never both:
   - **Actively-building projects** (≥2 savepoints in the last 7 days, or <your-name> signals "active"/"in build"): keep last **10**.
   - **Inactive / paused projects** (>14 days since last session): keep last **5**.
   - Only offer deletion when the count exceeds the ceiling. List the oldest files and offer to delete them. **Never auto-delete.**

   > **🔒 LOCKED — Vault rotation (only when `VAULT_FEATURES: UNLOCKED`):** rotate the vault session notes via `mcp__obsidian-brain__delete_note` using the same ceilings.

8. > **🔒 LOCKED — Memory promotion (only when `VAULT_FEATURES: UNLOCKED`):**
   > Review the session for insights worth remembering long-term and offer to save them as vault GOU/pattern/principle notes via `mcp__obsidian-brain__write_note`, honoring the Knowledge-Artifact Source-Link Rule (every note's `related:` array carries at least the step-3 session-note backlink; refuse to write a floating note with empty `related: []`). Each promoted note carries the same frontmatter field set as the session note plus a one-line `description` recall hook. (Disabled in this build — vault-only feature.)

9. > **🔒 LOCKED — Bump vault references (only when `VAULT_FEATURES: UNLOCKED`):**
   > If any vault notes were referenced during this session, bump their `updated` date via `mcp__obsidian-brain__update_frontmatter` to feed the confidence lifecycle. (Disabled in this build.)

10. **(ACTIVE) Confirm** — Show what was saved: the local session-note path **and which location it resolved to** (the configured `.savepoint-location` path vs `~/.claude/references/context/` fallback), git commit hash (if applicable), and any rotation offered. When `VAULT_FEATURES: UNLOCKED`, also report the vault note path, config-snapshot status, and any GOU/pattern notes created.

## Session Note Template

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
[Exact prompt <your-name> can give to resume work. Example: "Pick up work on Luna quiz funnel — we finished Phase 1 content, starting Phase 2 build"]
```

(When `VAULT_FEATURES: UNLOCKED`, frontmatter is set via the MCP `frontmatter` parameter, not inline in the body.)

## Behavior Rules

- **Be quick.** The save should take under 30 seconds. Don't over-summarize.
- **Be accurate.** Only include files you actually saw modified. Don't guess.
- **Be useful.** The resume command should be specific enough that a fresh Claude session can pick up exactly where this one left off.
- **Don't nag.** If <your-name> declines git init or rotation, accept and move on.
- **Project naming + path safety.** Use kebab-case for project names in filenames (e.g., `luna-quiz-funnel-2026-03-17.md`). Before composing the filename, reduce `[project]` to `[a-z0-9-]` — strip/replace path separators, `..`, and leading dots. Reject any stem still containing `/` or `\`. The filename must resolve INSIDE the resolved save location, never above it.
- **Multiple saves per day.** If a project already has a save from today, append a counter: `[project]-2026-03-17-2.md`.
- **Targeted git commits.** Stage only the files you intend to snapshot — `git add -A` can sweep up unrelated in-flight work.

## Pre-Tag Runtime Smoke (Frontend Projects Only)

If the savepoint includes a git tag operation on a frontend project, perform a 2-minute runtime smoke FIRST and refuse to tag if it fails:

1. Confirm the dev server is running (or start it).
2. WebFetch the served root URL and check for `200 OK`.
3. WebFetch any served JS bundle that registers Alpine components; confirm the file does NOT contain `this.$root.<method>(` or `this.$root.<property>` patterns (Alpine v3 `$root` returns a DOM element, not data — use `Alpine.$data(document.body)` instead).
4. If the project exposes a `bootHealth()` (or equivalent) debug accessor, ask <your-name> to paste its output from the browser console. Assert all components registered `true`.
5. Ask <your-name> for a 30-second visual confirm: "Open the URL, click each top-level nav element, reload once. Any errors in console?"
6. **Only tag if all checks pass.** If any fail, surface the gap and ask <your-name> whether to fix-and-retag or tag-with-known-issue (the latter requires explicit consent + a note in the commit message describing what's broken).

This gate is the difference between "tag points to working code" and "tag points to broken code that passes tests." Static review can't see what the page actually does at runtime.

## When Called Automatically (by a CLAUDE.md behavioral rule)

If a Save Point Protocol triggers this (not manual invocation), the behavior is the same except:
- Set `trigger: auto-compact` in the frontmatter.
- Include a brief note in the body: "This save point was created because context was approaching limits."
- Don't ask about git init — just save the context note.
- Don't ask about rotation — just save and confirm quickly.
- Always write the context note (step 3). Emergency auto-saves are the MOST important to persist.
- **This path is unattended, so it must be the MOST guarded, not the least:** use the `.savepoint-location` marker if one exists; if there is NO marker, save to `~/.claude/references/context/` — you cannot ask, and you must NOT silent-create a save folder in an unconfigured workspace.

## Memory Forensics (maintenance mode)

When invoked as `/savepoint forensics` — or whenever the user asks to "check memory health," "audit the saves," or clean up the memory store — do NOT run the save flow. Instead run the bundled **read-only** maintenance pass in `counsel/lite-vault-forensics.md`: a lite Vault Forensics council (persona mode) that audits `context/memory/` for placement, git-contamination, orphans, referential integrity, convention drift, and rotation health. It **reports and offers fixes; it never deletes or moves anything unless the user picks a fix.**

## Error Handling

- If not sure what project is active, ask <your-name> before saving.
- If in a git repo but there are no changes to commit, skip the git step and note "No uncommitted file changes to snapshot".
- If the **configured** location (from `.savepoint-location`) or the **home fallback** doesn't exist, create it without asking — the user already approved it, or it's your own home dir. **Never** create a save folder in a workspace that has no `.savepoint-location` marker without running the first-run ASK flow first (interactive) — or falling back to home (unattended).
- When `VAULT_FEATURES: UNLOCKED` and the vault MCP is unreachable: fall back to the flat file (step 3) and flag the MCP issue.
