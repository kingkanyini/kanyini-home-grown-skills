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
3b. **Back-fill pending learned-skill `source_session`** — After the session note exists, resolve any learned skills left at `source_session: "pending"` by `/learn-eval`. This is the implementation of the traceability promise in learn-eval's docs. **FAIL-OPEN:** never block /savepoint.
   ```bash
   # Back-fill pending source_session — but ONLY when exactly ONE session ran today,
   # so a date-matched skill can be grounded unambiguously. Learned skills carry only
   # `extracted_date` (no project field), so the skill-side join is DATE-BUCKETED: if
   # 2+ DISTINCT sessions exist for today's date (any project), any date-matched
   # pending skill is ambiguous and we REFUSE — leave pending + print an actionable
   # list. A wrong source_session is worse than pending. FAIL-OPEN: never block.
   #
   # Ordering: RECOMMENDED order is /savepoint FIRST, then /learn-eval — in that order
   # learn-eval grounds source_session directly and this block is a no-op. The
   # pending + back-fill path is the reverse-order fallback only.
   sess_date="YYYY-MM-DD"          # same date used in the step-3 session-note filename
   project="PROJECT-SLUG"          # same project slug used in the step-3 session-note filename
   note="<your-related-note>"
   vault_sessions="<your-vault-path>/context/sessions"
   flat_sessions="$HOME/.claude/references/context"

   # distinct sessions today = distinct project-STEMS among today's notes (vault + flat).
   # Stripping the date+counter suffix collapses a same-session multi-save
   # (project-DATE.md + project-DATE-2.md) into ONE stem, so a 2nd save of the SAME
   # session does not false-refuse. Quoted for-loop over the glob handles the space in
   # the vault path safely.
   stems=$(
     for d in "$vault_sessions" "$flat_sessions"; do
       for fpath in "$d"/*-"$sess_date"*.md; do
         [ -e "$fpath" ] || continue
         bn=$(basename "$fpath"); printf '%s\n' "${bn%%-${sess_date}*}"
       done
     done | sort -u
   )
   nstems=$(printf '%s\n' "$stems" | grep -c .)

   if cd ~/.claude/skills/learned 2>/dev/null; then
     pending=$(grep -lE '^source_session:<your-related-note>*"?pending' *.md 2>/dev/null | while read f; do
       ed=$(grep -m1 -E '^extracted_date:' "$f" | grep -oE '[0-9]{4}-[0-9]{2}-[0-9]{2}')
       [ "$ed" = "$sess_date" ] && printf '%s\n' "$f"
     done)
     if [ -z "$pending" ]; then
       echo "(no date-matched pending skills -- nothing to back-fill)"
     elif [ "${nstems:-0}" -gt 1 ]; then
       echo "REFUSED: ${nstems} distinct sessions ran on ${sess_date}; date-match ambiguous, leaving pending."
       echo "  candidate session notes:"; printf '%s\n' "$stems" | sed "s/^/    - /; s/\$/-${sess_date}/"
       echo "  pending skills to ground manually:"; printf '%s\n' "$pending" | sed 's/^/    - /'
     elif [ "${nstems:-0}" -eq 1 ]; then
       printf '%s\n' "$pending" | while read f; do
         sed -i -E "s#^source_session:<your-related-note>*\"?pending\"?#source_session: \"${note}\"#" "$f"
         echo "back-filled source_session -> $f"
       done
     else
       echo "(could not confirm today's session note -- leaving pending)"
     fi
   else
     echo "(learned-skills dir missing -- back-fill skipped)"
   fi
   ```
   **Scope guard (cardinality, not just date):** the skill-side match is still `extracted_date == session date`, but auto-stamping now fires ONLY when exactly one session ran today (one distinct project-stem among today's session notes). If 2+ distinct sessions exist for the date, the back-fill refuses and leaves `pending` with an actionable list — because a date-matched skill could belong to any of those sessions, and a wrong `source_session` is worse than `pending`. **Burn history — do NOT loosen this again:** (1) the first `-mmin`/mtime version mis-grounded `script-first-then-cut-then-verify`, a 05-30 skill merely edited during the audit (learned 2026-06-01); (2) the date-ONLY version then mis-grounded two skills cross-session on 2026-06-03 (two sessions same day — committed in `5ed354b` before catch); (3) this date-bucket-cardinality version is the current fix. If same-day multi-session ever makes refusal too frequent, the correct next step is a **harness-minted** session id (not skill-minted) — evidence-gated, not speculative. Reviewed by Triple Threat (Product/Dev/Security), 2026-06-03: B (token join) and C (timestamp window) rejected as more-confident versions of the same bug.
3c. **Learned-skills index drift check (advisory, FAIL-OPEN)** — Report whether every skill in `skills/learned/` is actually referenced by `_index.md`. The index declares itself the hub that guarantees no learned skill floats unreferenced; that promise was memory-enforced and drifted to ~47% coverage before anything noticed. This is the mechanical check. **FAIL-OPEN: never block /savepoint** — the fail-open lives HERE, in the caller, and is deliberately not baked into the script (a hook that swallows its own failures cannot be trusted by anything else that calls it).
   ```bash
   # exit 0 = clean · 1 = drift/gaps · 2 = the check itself failed. All advisory here.
   # The PRIOR gap count comes from git, not from a ledger: git already stores every
   # past state of skills/learned/, so no baseline file and no new write path exist.
   # `git archive` (not `git worktree`) is deliberate — a worktree checkout of this
   # repo FAILS on Windows with "Filename too long" on ~19 article-scraper cache paths.
   prev_dir=$(mktemp -d); mkdir -p "$prev_dir/.claude"
   if git -C ~/.claude archive HEAD skills/learned 2>/dev/null | tar -x -C "$prev_dir/.claude" 2>/dev/null; then
     prev=$(USERPROFILE="$prev_dir" HOME="$prev_dir" node ~/.claude/scripts/build-learned-index.js --gaps 2>/dev/null | wc -l | tr -d ' ')
   else prev="?"; fi
   now=$(node ~/.claude/scripts/build-learned-index.js --gaps 2>/dev/null | wc -l | tr -d ' ')
   node ~/.claude/scripts/build-learned-index.js --check || true
   echo "learned-index: gaps ${prev} (HEAD) -> ${now} (working tree)"
   rm -rf "$prev_dir"
   ```
   **The decision rule is ONE number: did `gaps` go UP?**
   - **`gaps` ↑ since HEAD** — a skill was added with no row. Step 7b was missed. **This is the catch — say so in the reply.**
   - **`gaps` ↓ or flat** — fine. Report the headline and move on.

   Do not read `curated` as the signal. Measured against real history (7 commits replayed 2026-08-04), `curated ↑ with gaps flat` is the *most common* shape on a normal skill-adding commit, and `curated` counts **mentions**, not rows — `harvestTokens` credits a slug appearing anywhere in the curated text. `gaps` is the number that rises only when something actually floated.

   State lines the script can emit (five, not four):
   - `N skills not in index` — named skills on disk with no row. Capped at 10 names; `--gaps` lists all.
   - `N skill file(s) failed the structural gate` — malformed skill files. `--json` lists all (NOT `--gaps`, which only ever lists gaps).
   - `N index row(s) carry 2+ wikilinks with no " — " separator` — a malformed row whose cross-refs get credited as rows.
   - `PRUNE — block lists N entries…` — the generated block carries entries that are no longer gaps.
   - `DRIFT — do not hand-edit the GENERATED block` — the generated region was edited by hand.
   - `check failed (...)` — the check itself broke. Investigate; do not ignore.

   Non-`missing` states put their state word in the headline (`DRIFT — curated …`), so a scan of the first line is enough to tell routine from exceptional. **Invariant:** `curated + gaps = valid skills`, and skipped files are reported separately rather than folded into the percentage — if the pair stops adding up, look for the skipped-files line. In `--json`, `state` names the *primary* defect only; `skipped[]` is authoritative for the structural gate.

   Surface the headline and the gaps delta in the reply. Do **not** fix gaps inside /savepoint — reporting is the job here; curation is a separate deliberate pass.

   **Why here and not a SessionStart hook:** the plan (`plans/sharded-scribbling-tome.md` Step 0) originally specified a third `SessionStart` hook for "unbounded → one session" detection latency. Measured 2026-08-04: **266 savepoints in the preceding 30 days (~9/day)**, versus one SessionStart per session — so this site detects *sooner*, not later. It also fires at the commit moment, when the drift is still cheap to fix, and its output lands in the reply rather than in context where surfacing it is discretionary. If savepoint cadence ever drops, the hook is the fallback.
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

4b. **Social build gates (conditional, FAIL-CLOSED) — run BEFORE the git snapshot** — If this session touched `references/social-spine/` OR `plugins/local/soulcial-posts-v2/`, run `node ~/.claude/plugins/local/soulcial-posts-v2/scripts/verify-gates.js`. This asserts the ethics-gate wiring, the scan-logging wiring, and (safety-critical) the compliance auto-arm are all intact. **If it exits non-zero, do NOT commit the spine/plugin changes** — surface the failure and fix the drift first. (Unlike the config-snapshot step, this gate is fail-CLOSED: a silently-disarmed compliance gate is exactly the regression it exists to catch.)
5. **Git snapshot (if applicable)** — If working in a folder with git initialized, commit a snapshot with message `Save point: [brief description]`. Include the config snapshot from step 4 in the `~/.claude/` repo commit. Also commit in the vault repo if changes exist — commit TARGETED files (not `git add -A`) so unrelated in-flight work isn't accidentally swept up:
   ```bash
   cd "<your-vault-path>" && \
     git add context/sessions/[project]-[YYYY-MM-DD].md && \
     git commit -m "Save point: [brief description]"
   ```
5b. **PUSH — the save is not durable until this runs (MANDATORY)** — A local commit on a single disk is not a save point. Every repo committed to in step 5 gets pushed immediately after. **FAIL-LOUD:** unlike the config snapshot, a failed push must be surfaced in the turn, in your visible reply — never written to a file, never swallowed. A durability warning written to the disk whose durability is in question is not a warning.

   ```bash
   # Per repo committed to in step 5. Report ahead-count BEFORE and result AFTER.
   for repo in "$HOME/.claude" "<your-vault-path>"; do
     cd "$repo" || continue
     br=$(git rev-parse --abbrev-ref HEAD)
     ahead=$(git rev-list --count "origin/$br..HEAD" 2>/dev/null || echo "?")
     echo "== $repo [$br] ahead=$ahead"
     git push origin "$br" 2>&1 | tail -3 || echo "PUSH FAILED — SURFACE THIS TO KANYINI IN THE REPLY"
   done
   ```

   **Rules:**
   - Push the **current branch**, not a hardcoded `main`. (A savepoint has already landed on a feature branch by accident — 2026-07-30, `feat/scribe-ingest`.)
   - If a push fails (offline, auth, non-fast-forward), say so plainly in the reply with the repo and the ahead-count. Do NOT retry in a loop and do NOT continue silently.
   - If `ahead` is large (>10), call it out — it means pushes have been silently skipped and the backlog is the finding, not the commit.
   - **Never `--force`.** A non-fast-forward is a real divergence and needs <your-name>.

   **Why this step exists (NSA Elite review, 2026-07-31 — PHANTOM):** `/savepoint` committed and stopped. No `git push` existed anywhere in the skill, hooks, scripts, or settings. **50 commits titled "Save point:" had accumulated on one disk**, plus 26 in the vault, telling their author they were safe. The ritual's name promised durability the mechanism never delivered.

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
9. **Bump vault references + register the session under its hubs (bidirectional)**
   - **Bump `updated`** — If any vault notes were referenced during this session, bump their `updated` date via `mcp__obsidian-brain__update_frontmatter`. Feeds the Hebbian confidence lifecycle.
   - **Bidirectional hub registration (MANDATORY).** Operationalizes the <your-related-note> Usage rule + <your-related-note> Discipline #6 for the session-note→hub case. The step-3 session note links UP to its project/client hub via `related:`. You MUST also link DOWN: append `[[context/sessions/[project]-[YYYY-MM-DD]]]` to the `related:` array of the **project hub** (`context/projects/[slug].md`) the session note references, via `update_frontmatter`. **Client-work sessions register under the PROJECT hub, NOT the client hub.** The client hub (`context/clients/[slug].md`) is an identity card — contacts, engagement terms, relationship/close architecture — and holds client INFO only; work-sessions filed there break discoverability and clutter the card. So a client-project session's `related:` (step 3) links to the MOST-SPECIFIC project hub / sub-hub that owns the workstream (e.g. `context/projects/the-example-client`, or its `context/projects/the-example-client-website` sub-hub), and this step registers it there — NOT under the client hub. When a session references BOTH a sub-hub and its parent umbrella hub, register it under the sub-hub ONLY; the parent need not re-register what its sub-hub already surfaces (via the parent's Dataview/curated index). Register a session under the client hub ONLY if it is genuinely about the client RELATIONSHIP itself (intake, close, contract), not a work deliverable — OR (the dual-registration carve-out) when the session is the PROVENANCE for a client-asset that the card BODY documents (e.g. the client's AI-team roster / Joule agent design) AND that same session is ALSO registered under a project hub. In that carve-out case the client-hub link is provenance, not accretion, so it is compliant and MUST NOT be "re-cleaned." (Established 2026-07-11: the <example-client> card keeps its 3 Joule sessions under exactly this carve-out — body-cited AI-team roster + registered under the-example-client's "AI Systems / Delivery" line.) **(Vault Forensics Counsel #47, 2026-07-11 — the <example-client> client card had accreted 6 work-sessions via this step; cleaned + this rule added so it stops recurring.)** `related` is an ARRAY — pass the FULL existing array **plus** the new backlink (a bare `{related: ["<your-related-note>"]}` can clobber the existing list). Without this the session is reachable from itself but NOT from the hub — the one-directional orphan the no-floating-artifacts rule forbids. **Skipping this was the 2026-07-06 gap <your-name> caught** (savepoint wrote session→hub but never hub→session). Include these hub notes in the step-5 vault git commit.
10. **Confirm** — Show what was saved: vault note path, git commit hash (if applicable), **push result and remaining ahead-count per repo**, config snapshot status, any GOU/pattern notes created. If emergency flat fallback was used, flag it visibly. **A savepoint that committed but did not push is reported as NOT DURABLE, in those words** — do not let a green-looking summary imply otherwise.

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
