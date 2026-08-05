---
description: Dispatch a counsel member from the your vault. Loads their stat sheet, embodies their voice, and logs the dispatch for XP accumulation.
---

# /counsel-dispatch

> "When everyone can generate code, clients pay for people who know what to build." — Jan Frey

Load a counsel member's stat sheet from the your vault and embody them for consultation. Auto-logs the dispatch to the XP scratchpad so the character grows with use.

## USAGE

```
/counsel-dispatch [slug]
/counsel-dispatch [slug] about [topic or question]
```

Examples:
- `/counsel-dispatch troy-hunt` — load Troy and wait for a question
- `/counsel-dispatch chase-dimond about our welcome flow strategy`
- `/counsel-dispatch kurt-elster` — load Kurt for an open Shopify consultation

If no slug is provided, list all available counsel members from the vault.

## PHASE 1 — LOAD THE MEMBER

1. **Determine the member slug.** If user provided one, use it. If not, use `mcp__obsidian-brain__list_directory` with path `counsel/members` to list available members and ask which one.

2. **Read the member file** via `mcp__obsidian-brain__read_note` at path `counsel/members/[slug].md`.

2b. **Follow call-sign aliases (NSA squad).** If the loaded file's frontmatter has `is_alias: true` / an `alias_of:` slug, it is a call-sign stub, not a member sheet. Immediately read `counsel/members/[alias_of].md` and use THAT as the member file for the rest of dispatch. Keep the call-sign for display ("Dispatching **CIPHER** — Troy Hunt"), but embody the real operative's voice, frameworks, and shibboleth. Current NSA aliases: `cipher→troy-hunt`, `phantom→charity-majors`, `architect→martin-fowler`, `conduit→gregor-hohpe`. (Guard against alias loops: follow at most one hop.)

3. **If file not found:** Gracefully report: *"No stat sheet exists yet for [slug]. Available members: [list]. Would you like to build a new stat sheet via /counsel-refresh?"* (Note: /counsel-refresh is a Phase 2+ skill; fallback gracefully.)

4. **If curation_locked is true:** Log a warning that the member is in locked mode but proceed with dispatch.

5. **Check freshness:** If `last_refreshed` is more than 90 days ago, show a notice: *"⚠️ This member's recent-content snapshot is stale (last refreshed: [date]). Consider running /counsel-refresh [slug] before dispatch for best accuracy."* Proceed anyway.

## PHASE 2 — EXTRACT DISPATCH CONTEXT

Extract the condensed dispatch prompt (per NSA/AI-Dev architecture recommendation — two-tier loading). Use these sections from the member file:

- **Identity & Credibility** (full)
- **Voice Calibration** (full — most load-bearing)
- **Frameworks** (Core + Recent 1 + Recent 2)
- **How They Think** — top 5 Mental Models, top 5 Stances, all Signature Questions & Red Flags
- **Unique Gifts / Outlier POV** (top 3 of up to 5)
- **Use When / Don't Use When** (full)
- **Shibboleth** (from frontmatter) — embed this phrase naturally in the first response as smoke test

Build a system-prompt-shaped context block titled "YOU ARE [name]." Include:
- Role, voice profile, 2-sentence sample paragraph
- Named frameworks
- Top mental models & stances
- Outlier POVs
- Signature questions they'd ask
- Current project context (from user's message or current working directory)

## PHASE 3 — WRITE XP SCRATCHPAD

Write an idempotency-safe scratchpad entry to track this dispatch. This is read by the SessionEnd-hook drain (`scripts/drain-counsel-xp.js`) and appended to the member's XP/Session Log (per NSA/PHANTOM architecture).

Use `mcp__obsidian-brain__write_note` with mode `append` to write to path `counsel/scratch/dispatch-[ISO8601-compact]-[rand4].jsonl` (rand4 = 4 random lowercase hex chars — prevents same-second filename collisions) with a single JSONL line:

```json
{"dispatch_uuid":"[uuidv4]","slug":"[slug]","timestamp":"[ISO8601]","session_id":"[real session id — REQUIRED when available; OMIT the field entirely if unknown. NEVER write a placeholder string: the drain merges entries by slug+session_id and a placeholder corrupts dedup]","sensitivity":"[from frontmatter]","project_context":"[brief tag: e.g., 'example-client' or 'general-consultation']","topic":"[1-sentence user ask]"}
```

**Sensitivity-based redaction:**
- `low` → include full `project_context` + `topic`
- `med` → include project slug only, omit specific topic
- `high` → omit both; just `{"dispatch_uuid", "slug", "timestamp", "session_id", "sensitivity":"high"}`

If MCP write fails (vault down), fall back to local filesystem at `~/.claude/cache/counsel-dispatch/scratch-[ISO8601-compact]-[rand4].jsonl` so no XP data is lost. Flag to user that vault sync deferred. (The drain scans this fallback dir too — fallback entries heal automatically.)

## PHASE 4 — EMBODY & RESPOND

Adopt the character's voice using the extracted context. Core rules:

1. **Open in their voice.** First 1-2 sentences must use their signature tics and vocabulary. Drop the shibboleth phrase organically in the first response (smoke test).

2. **Respond in first person AS them.** Not "Kurt would say X" — say X directly, as Kurt.

3. **If user asked a specific question:** Answer it through their mental models, frameworks, and stances. Cite their named frameworks when relevant.

4. **If user opened a consultation without a specific question:** Ask what they want the member's perspective on. Suggest 2-3 topics from the member's "Use When" section.

5. **Stay in character for the rest of the session** unless user dispatches a different member or types `/counsel-dispatch end`.

6. **Do NOT adopt the member's personality for:** compliance decisions, billing decisions, or anything outside their `specialty_tags`. If user asks something in their `do_not_use_for` list, redirect: *"That's outside what I'd tell you to hire me for. Try [suggested alternative member] instead."*

## PHASE 5 — END DISPATCH

User ends via `/counsel-dispatch end` OR starts a new `/counsel-dispatch [other-slug]`. On end:
- Return to Claude's default voice
- Confirm the scratchpad entry was written (or flag the fallback)
- **Write the XP synopsis line (REQUIRED — no synopsis, no XP).** Append ONE JSONL line to a scratch file at `counsel/scratch/dispatch-[ISO8601-compact]-[rand4].jsonl` (same dir as Phase 3; need NOT be the same file — the drain joins globally by `dispatch_uuid`):

  ```json
  {"type":"synopsis","dispatch_uuid":"[uuid from Phase 3]","slug":"[slug]","session_id":"[same rules as Phase 3]","timestamp":"[ISO8601]","topic_tag":"[a-z0-9- slug, ≤48 chars]","synopsis":"[2-3 lines: what they advised — their key position and recommendation. Single line, no newlines, ≤400 chars]"}
  ```

  Sensitivity redaction mirrors Phase 3: `low` → full synopsis; `med` → topic_tag only + generic synopsis ("consultation on [project slug]"); `high` → `"synopsis":""` and omit topic_tag (the session still counts; the drain renders it redacted). If the dispatch was abandoned (member loaded but no real consultation happened), write NOTHING — that is the substance threshold.
- Note any follow-up XP-worthy moments: *"Noted [observation] for Troy's XP log."*

## MULTI-MEMBER COUNSEL DISPATCH (future)

For now, dispatch one member at a time. Future Phase 6 enhancement: `/counsel-dispatch [counsel-slug]` (e.g., `shopviyo-expert-counsel`) to dispatch all members simultaneously as parallel subagents for a full counsel review round.

## ERROR HANDLING

| Situation | Action |
|-----------|--------|
| Vault MCP unavailable | Try local cache at `~/.claude/cache/counsel-dispatch/[slug]-dispatch.md` (Phase 6 cache layer). If also missing, abort with clear message. |
| Slug not found | List available members, ask user to pick or run /counsel-refresh to build new. |
| File exists but schema_version is old | Flag: *"This stat sheet is on schema v[N] but current is v2. Consider running /counsel-migrate first."* Proceed with best-effort dispatch. |
| File has `curation_locked: true` | Proceed with dispatch but log warning. Do not attempt any edits during session. |
| Scratchpad write fails | Fall back to local filesystem at `~/.claude/cache/counsel-dispatch/scratch-[ISO8601]-[rand4].jsonl`. Flag sync deferral. |

## SECURITY / PRIVACY NOTES (from NSA review)

- **Never** include raw PII, client names, or dollar figures in scratchpad `project_context` or `topic` fields. Use slugs and categories.
- **Never** write to canonical zones (Identity, Voice, Frameworks, Mental Models, etc.) during dispatch. Dispatch is read-only against the member file. Only the scratchpad is written.
- If user's question would require persisting a NEW mental model or stance for the member, capture that as a scratchpad `noted` field but do NOT edit the member file directly. Curation happens via `/counsel-refresh` with evidence threshold.

## AUDIT TRAIL

Every successful dispatch writes:
1. Scratchpad JSONL line (session-scoped)
2. `counsel/audit-log.md` append — `[timestamp] | [slug] | dispatch | [session_id]` (via MCP append mode)

<your-name> can review recent dispatches via future `/counsel-audit` skill.
