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

**Section standard (forward-only):** `When NOT to Use`, `Empirical Validation`, and `Related` are the corpus standard — present in the gold-standard learned skills (`tool-backed-skill-portable-handoff`, `process-friction-as-user-signal`). `## Empirical Validation` is the canonical heading; older notes using `## Evidence` are grandfathered — don't rewrite them. Forward-only: new extractions follow this template; existing skills are not retro-fixed unless touched for another reason.

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

8. **Commit the new file (if in a git repo)** — After saving, if the target folder is under git version control (e.g., `~/.claude/` or a project repo with `.git/`), stage and commit the specific file with message format `Save point: learned skill — [skill-name]`. Use targeted `git add <path>` not `git add -A` so unrelated in-flight work isn't swept up. This closes the workflow loop so chained `/savepoint` → `/learn-eval` doesn't leave orphan uncommitted files. If not in a git repo, skip silently.

## Chained Invocation Notes

When `/savepoint` and `/learn-eval` are chained (typical end-of-session pattern):

- **Recommended order:** `/savepoint` FIRST, then `/learn-eval`. Savepoint creates the vault session note; learn-eval can then point `source_session` at it directly (no "pending" needed).
- **Reverse order is supported:** if `/learn-eval` runs first, set `source_session: "pending"` and the next `/savepoint` should back-fill the link when it creates the session note.
- **Either order, no orphans:** Step 8 (commit) ensures the new skill file lands in git regardless of which order ran.

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
