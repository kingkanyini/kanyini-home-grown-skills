---
description: "Extract reusable patterns from the session, self-evaluate quality before saving, and determine the right save location (Global vs Project)."
---

# /learn-eval - Extract, Evaluate, then Save

Extends `/learn` with a quality gate, save-location decision, and knowledge-placement awareness before writing any skill file.

## What to Extract

Look for:

1. **Error Resolution Patterns** — root cause + fix + reusability
2. **Debugging Techniques** — non-obvious steps, tool combinations
3. **Workarounds** — library quirks, API limitations, version-specific fixes
4. **Project-Specific Patterns** — conventions, architecture decisions, integration patterns

## Process

1. Review the session for extractable patterns
2. Identify the most valuable/reusable insight

3. **Determine save location:**
   - Ask: "Would this pattern be useful in a different project?"
   - **Global** (`~/.claude/skills/learned/`): Generic patterns usable across 2+ projects (bash compatibility, LLM API behavior, debugging techniques, etc.)
   - **Project** (`.claude/skills/learned/` in current project): Project-specific knowledge (quirks of a particular config file, project-specific architecture decisions, etc.)
   - When in doubt, choose Global (moving Global → Project is easier than the reverse)

4. Draft the skill file using this format:

```markdown
---
name: pattern-name
description: "A rich recall hook — what it is + when it fires, specific enough that a future semantic search matches on it. ~1–3 sentences, under ~350 chars. These skills are user-invocable:false, so favor searchable specificity over brevity. NEVER put secrets, tokens, client names/emails/domains, account IDs, or PII here — this field is always-on and search-indexed."
user-invocable: false
origin: auto-extracted
source_session: "[[context/sessions/[project]-[YYYY-MM-DD]]]"  # vault session slug if it exists, else 'pending'
extracted_date: "YYYY-MM-DD"
---

# [Descriptive Pattern Name]

**Extracted:** [Date]
**Context:** [Brief description of when this applies]
**Spawning session:** [Same as source_session above — wikilink for navigability]

## Problem
[What problem this solves - be specific]

## Solution
[The pattern/technique/workaround - with code examples]

## When to Use
[Trigger conditions]

## When NOT to Use
[At least one real exclusion/boundary so the pattern isn't over-triggered. If you genuinely can't name one, the pattern is too broad — narrow the scope instead of writing "N/A".]

## Empirical Validation
<!-- SECURITY: describe the MECHANISM and OUTCOME, not raw artifacts. NO secrets/keys/tokens,
     NO client PII (names, emails, domains, account IDs), NO internal pricing/payment data.
     This file is git-committed + full-text searchable forever — scrubbing later does NOT
     remove it from git history. Generalize: "a client GHL sub-account", not the real name/ID. -->
[The dated session that produced this — what happened, what it proved. One data point is fine; this is the traceability anchor, never leave it empty.]

## Related
[Wikilinks to sibling skills / vault patterns / principles. Link by slug only; don't restate a sensitive target's contents. Omit this section ONLY if the Step 5a vault/skills search returned zero genuine siblings — cite that result.]
```

**Section standard (forward-only):** `When NOT to Use`, `Empirical Validation`, and `Related` are the corpus standard — present in the gold-standard learned skills (`tool-backed-skill-portable-handoff`, `process-friction-as-user-signal` for the discipline/process class; `windows-scheduled-task-edit-reinstall-rule` for the reference/technique class). `## Empirical Validation` is the canonical heading; older notes using `## Evidence` are grandfathered — don't rewrite them. Forward-only: new extractions follow this template; existing skills are not retro-fixed unless touched for another reason.

**Traceability rule:** `source_session` should point to the vault session note for the conversation that produced this skill. If `/savepoint` hasn't run yet (no session note exists), set `source_session: "pending"` and `/savepoint` will back-fill it on the next save. This is the skill-side analogue of the vault Knowledge-Artifact Source-Link Rule (which targets `gous/`, `patterns/`, `principles/` instead).

5. **Quality gate — Checklist + Holistic verdict**

   ### 5a. Required checklist (verify by actually reading files)

   Execute **all** of the following before evaluating the draft:

   - [ ] Grep `~/.claude/skills/` and relevant project `.claude/skills/` files by keyword to check for content overlap
   - [ ] Search vault via `mcp__obsidian-brain__search_notes` for overlap (primary check). MEMORY.md is a vault-pointer index per Phase 3, not the source of truth — do NOT treat flat memory files as authoritative. **If the Obsidian MCP is unavailable, fall back to grepping MEMORY.md + flat `memory/` files for this overlap check** (the emergency-fallback path, per Phase 3).
   - [ ] Consider whether appending to an existing skill would suffice
   - [ ] Confirm this is a reusable pattern, not a one-off fix

   ### 5b. Holistic verdict

   Synthesize the checklist results and draft quality, then choose **one** of the following:

   | Verdict | Meaning | Next Action |
   |---------|---------|-------------|
   | **Save** | Unique, specific, well-scoped | Proceed to Step 6 |
   | **Improve then Save** | Valuable but needs refinement | List improvements → revise → re-evaluate (once) |
   | **Absorb into [X]** | Should be appended to an existing skill | Show target skill and additions → Step 6 |
   | **Drop** | Trivial, redundant, or too abstract | Explain reasoning and stop |

**Guideline dimensions** (informing the verdict, not scored):

- **Specificity & Actionability**: Contains code examples or commands that are immediately usable
- **Scope Fit**: Name, trigger conditions, and content are aligned and focused on a single pattern
- **Uniqueness**: Provides value not covered by existing skills (informed by checklist results)
- **Reusability**: Realistic trigger scenarios exist in future sessions

6. **Verdict-specific confirmation flow**

- **Improve then Save**: Present the required improvements + revised draft + updated checklist/verdict after one re-evaluation; if the revised verdict is **Save**, save after user confirmation, otherwise follow the new verdict
- **Save**: Present save path + checklist results + 1-line verdict rationale + full draft → save after user confirmation
- **Absorb into [X]**: Present target path + additions (diff format) + checklist results + verdict rationale → append after user confirmation
- **Drop**: Show checklist results + reasoning only (no confirmation needed)

7. Save / Absorb to the determined location

7b. **Index the new skill in `_index.md` (Global saves only)** — If the skill was saved to `~/.claude/skills/learned/`, add a one-liner for it to the matching domain section of `skills/learned/_index.md`, in the same `- <your-related-note> — one-liner.` shape as its neighbours. The one-liner is a *curated* line written here, not the frontmatter `description` pasted in: one sentence, the rule not the story. If no existing domain section fits, say so rather than forcing it into the nearest one — an honest gap beats a wrong home.

   Then confirm it took — **per skill, by slug.** A bare `--check` prints ~185 gap names; confirming one slug against that list by eye is not a confirmation:
   ```bash
   # Run once per skill saved this session. Substitute the real slug.
   # READ THE EXIT CODE — do not infer success from empty stdout. On a hard abort
   # (exit 2: malformed markers, unreadable _index.md) --gaps prints NOTHING, and a
   # bare `| grep -qx` pipe would report "OK" one line after the checker announced its
   # own failure. Those abort states are exactly what a botched hand-edit of
   # _index.md produces — i.e. the edit this step just made.
   gaps=$(node ~/.claude/scripts/build-learned-index.js --gaps); rc=$?
   if [ "$rc" -ge 2 ]; then
     echo "learned-index: check FAILED (exit $rc) — <slug> NOT confirmed. Run --check."
   elif printf '%s\n' "$gaps" | grep -qx "<slug>"; then
     echo "learned-index: <slug> is NOT referenced — the 7b edit did not take"
   else
     echo "learned-index: <slug> referenced. OK"
   fi
   ```
   This confirms the slug is now referenced *somewhere* in `_index.md`. It does not verify you filed it under the right domain section — that part is on you.

   Include the `_index.md` edit in the Step 8 commit (`git add` both paths).

   **Why this step exists:** `_index.md` calls itself the hub that guarantees no learned skill floats unreferenced, but the maintenance instruction lived *inside the index* — where the tool that creates entries never reads it. 28 of 203 skill-adding commits updated the index: a memory-dependent control at **14% efficacy**, and coverage fell to ~47%. This step and the `--check` in `/savepoint` step 3c are companions, not substitutes: this one is the same class of memory-dependent control that already failed, so the mechanical check is what actually catches a miss.

8. **Commit the new file (if in a git repo)** — After saving, if the target folder is under git version control (e.g., `~/.claude/` or a project repo with `.git/`), stage and commit the specific file with message format `Save point: learned skill — [skill-name]`. Use targeted `git add <path>` not `git add -A` so unrelated in-flight work isn't swept up. This closes the workflow loop so chained `/savepoint` → `/learn-eval` doesn't leave orphan uncommitted files. If not in a git repo, skip silently.

## Chained Invocation Notes

When `/savepoint` and `/learn-eval` are chained (typical end-of-session pattern):

- **Recommended order:** `/savepoint` FIRST, then `/learn-eval`. Savepoint creates the vault session note; learn-eval can then point `source_session` at it directly (no "pending" needed).
- **Reverse order is supported:** if `/learn-eval` runs first, set `source_session: "pending"` and the next `/savepoint` should back-fill the link when it creates the session note.
- **Either order, no orphans:** Step 8 (commit) ensures the new skill file lands in git regardless of which order ran.
- **Ordering consequence for the index check:** under the recommended order (`/savepoint` FIRST), savepoint's step 3c runs **before** this session's skill exists — it cannot see it. Step 7b is therefore the *only* same-session catch for a skill created after the savepoint; 3c catches it at the **next** savepoint. That is why 7b's confirmation reads the exit code instead of inferring success from empty output: under this order it is the whole net.

## Output Format for Step 5

```
### Checklist
- [x] skills/ grep: no overlap (or: overlap found → details)
- [x] Overlap check — vault via mcp__obsidian-brain__search_notes (primary); MEMORY.md + flat memory/ as fallback if the Obsidian MCP is unavailable: no overlap (or: overlap found → details)
- [x] Existing skill append: new file appropriate (or: should append to [X])
- [x] Reusability: confirmed (or: one-off → Drop)

### Verdict: Save / Improve then Save / Absorb into [X] / Drop

**Rationale:** (1-2 sentences explaining the verdict)
```

## Design Rationale

This version replaces the previous 5-dimension numeric scoring rubric (Specificity, Actionability, Scope Fit, Non-redundancy, Coverage scored 1-5) with a checklist-based holistic verdict system. Modern frontier models (Opus 4.6+) have strong contextual judgment — forcing rich qualitative signals into numeric scores loses nuance and can produce misleading totals. The holistic approach lets the model weigh all factors naturally, producing more accurate save/drop decisions while the explicit checklist ensures no critical check is skipped.

## Notes

- Don't extract trivial fixes (typos, simple syntax errors)
- Don't extract one-time issues (specific API outages, etc.)
- Focus on patterns that will save time in future sessions
- Keep skills focused — one pattern per skill
- When the verdict is Absorb, append to the existing skill rather than creating a new file
