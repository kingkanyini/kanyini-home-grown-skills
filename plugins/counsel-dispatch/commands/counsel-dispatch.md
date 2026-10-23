---
description: Dispatch a counsel member from your vault. Loads their stat sheet, embodies their voice, and logs the dispatch for XP accumulation.
---

> **Paths:** every `references/`, `scripts/`, `assets/`, `templates/` (etc.) path in this file is relative to this plugin's folder, `${CLAUDE_PLUGIN_ROOT}`. Read them as `${CLAUDE_PLUGIN_ROOT}/references/...`, never relative to your current working folder. When you spawn subagents, pass them the absolute path.

# /counsel-dispatch

> "When everyone can generate code, clients pay for people who know what to build." — Jan Frey

Load a counsel member's stat sheet from your vault and embody them for consultation. Auto-logs the dispatch to the XP scratchpad so the character grows with use.

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

> **No vault?** If the `obsidian-brain` MCP isn't available, read members from the local seed directory `~/.claude/references/counsel/members/` instead — that's where `/council-primer` seeds them on a no-vault install. List the directory and load `[slug].md` with the file tools (read the whole file; the section-scoped vault reads below don't apply). The rest of this flow is identical; only the member-file source changes. XP logging is optional: skip it if `~/.claude/scripts/log-counsel-xp.js` isn't installed.

1. **Determine the member slug.** If user provided one, use it. If not, use `mcp__obsidian-brain__list_directory` with path `counsel/members` to list available members and ask which one.

2. **Read the member file SECTION-SCOPED** — do NOT read it whole. A heavy member's XP log
   is the majority of the file (troy-hunt was 70% XP before rotation), and Phase 2 uses none
   of it directly. Three calls, no judgment required:

   a. `mcp__obsidian-brain__get_note_outline` on `counsel/members/[slug].md`. It returns
      `{level, text, line}` per heading, on the **same 1-indexed basis as the raw file**
      (frontmatter included). Find the `XP / Session Log` line (`xpLine`) and the
      `Changelog` line (`chLine`). Every real member sheet has Changelog immediately after
      XP — verified across all 77.

   b. **No `XP / Session Log` heading → this is an alias stub** (see 2b) or a malformed
      sheet. Stubs are ≤1 KB: `read_note` it whole and follow `alias_of`.

   c. `mcp__obsidian-brain__read_note_lines(path, 1, xpLine - 1)` → frontmatter plus every
      section Phase 2 enumerates. **This is the dispatch body.**

   d. `mcp__obsidian-brain__read_note_lines(path, max(xpLine + 1, chLine - 9), chLine - 1)`
      → **the dispatch memory** (Phase 2, item 8).

   **The `max(...)` clamp is mandatory, not defensive styling.** For any member with few
   entries, `chLine - 9` lands *above* the XP heading and drags in the tail of the previous
   section — measured at 31 of 77 sheets. Clamping to `xpLine + 1` keeps the window inside
   the XP log. Ranges are 1-indexed and inclusive.

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
- **Dispatch Memory** — up to **5** most recent XP entries, from the Phase 1(d) tail read.
  Take them in the order they appear (append order = the order engagements were recorded;
  the section is NOT date-sorted, and that is fine — dates are a label, position is the log).
  **Skip any entry whose synopsis is a redaction placeholder** (`[client-specific review —
  synopsis withheld for privacy]` or `_[high-sensitivity session — content redacted]_`) —
  they carry no information. The 9-line window exists to give room to skip several and still
  land 5. Render each as `YYYY-MM-DD · topic — synopsis`.

  Frame it in the embodiment block as: *"Your recent engagements for this operator — you
  have prior context, you are not arriving cold."* If the tail read failed, omit the block
  entirely and say memory is unavailable. Never invent engagements.

  **Squad note (persona mode):** when personifying several members in ONE message, emit the
  shared round context **once**, then per-member deltas. 75% of XP synopses are the round's
  summary replicated across the whole panel, so four members' memory blocks are largely the
  same text four times. Say what each member specifically argued, not what the round concluded.

Build a system-prompt-shaped context block titled "YOU ARE [name]." Include:
- Role, voice profile, 2-sentence sample paragraph
- Named frameworks
- Top mental models & stances
- Outlier POVs
- Signature questions they'd ask
- **Recent engagements (dispatch memory)** — the ≤5 entries from Phase 2, or an explicit
  "no prior engagements on record" for a member with none. Omit silently only if the member
  genuinely has zero XP; say so if the read failed.
- Current project context (from user's message or current working directory)

## PHASE 3 — NOTE THE DISPATCH (no write yet)

**Do not write a scratchpad line here.** Keep the dispatch details in working memory —
member slug (the RESOLVED slug, never an alias call-sign), a short `project_context` tag,
and the user's ask — and emit everything in ONE call at Phase 5.

Two reasons this changed (2026-08-26):

1. **`~/.claude/scripts/log-counsel-xp.js`, when installed, is the ONLY emission path** — never
   inline-append scratchpad JSONL. The helper enforces session_id, client-PII redaction,
   producer-side dedup, and validates with the same validator the drain uses. Hand-written
   JSONL bypasses all of it.
2. **The split write bought nothing.** The helper emits the open line AND the synopsis
   together. An open line with no synopsis drains as *abandoned*, earns no XP, and leaves a
   file to clean up — which is exactly what a dispatch that ends without a consultation
   should produce anyway. Deferring costs no XP and removes a hand-written write path.

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

- Return to Claude's default voice.

- **SUBSTANCE THRESHOLD — check this first.** If the member was loaded but no real
  consultation happened (they were dispatched and the user moved on, or it was a smoke
  test), **log NOTHING and say so.** No synopsis, no XP, no scratchpad file. A dispatch that
  advised nothing did not earn anything.

- **Otherwise log ONCE via the helper** — the only emission path. Never hand-write JSONL. **If `~/.claude/scripts/log-counsel-xp.js` is not installed (it does not ship with this marketplace), skip XP logging, say "XP logging skipped: helper not installed", and end the dispatch normally.** When it is installed:

  ```
  node ~/.claude/scripts/log-counsel-xp.js     --slug <RESOLVED-slug>     --session <this session's real UUID>     --topic-tag <a-z0-9-, max 48 chars>     --synopsis "<this member's POSITION, ~120 chars>"     --project <short context tag>     --sensitivity <from the member sheet's frontmatter>
  ```

  It writes the open line and the synopsis together, enforces the session_id UUID, redacts
  client PII, dedups producer-side, and validates against the same validator the drain uses.
  Fire-and-forget: a logging failure is surfaced but never blocks or corrupts the dispatch.
  If it fails, say so — do not fall back to writing JSONL by hand.

  **`--slug` must be the RESOLVED member**, never an alias call-sign. `cipher`, `phantom`,
  `architect`, `conduit` are stubs with no XP section; the drain now resolves them, but
  logging the canonical slug keeps the ledger honest at the source.

- **What goes in `--synopsis`: THIS MEMBER'S POSITION, not the round's conclusion.** Their
  score, their specific catch, their dissent. The XP log is a ledger (one entry per member);
  a lesson is a knowledge artifact (one, full stop). If the consultation produced something
  durable, write it ONCE as a vault note (`gous/`/`patterns/`/`principles/`) and reference it
  here as an Obsidian wikilink to that note's slug — wikilinks survive the helper's PII redaction. Test: if this synopsis could be
  swapped with another member's unnoticed, you wrote the round, not the member. This is what
  makes Phase 2's dispatch memory worth reading back.

- **Sensitivity** comes from the member sheet's frontmatter and the helper applies it:
  `low` → full synopsis; `med` → generic synopsis + topic tag only; `high` → redacted (the
  session still counts).

- Confirm what was logged, naming the member. Note any follow-up XP-worthy moments:
  *"Noted [observation] for Troy's XP log."*

## MULTI-MEMBER COUNSEL DISPATCH (future)

For now, dispatch one member at a time. Future Phase 6 enhancement: `/counsel-dispatch [counsel-slug]` (e.g., `shopviyo-expert-counsel`) to dispatch all members simultaneously as parallel subagents for a full counsel review round.

## ERROR HANDLING

| Situation | Action |
|-----------|--------|
| Vault MCP unavailable | Read `~/.claude/references/counsel/members/[slug].md` (Phase 1 "No vault?"). If that is missing too, try local cache at `~/.claude/cache/counsel-dispatch/[slug]-dispatch.md` (Phase 6 cache layer). If also missing, abort with clear message. |
| `get_note_outline` fails | Fall back to `read_note` on the whole file and proceed with full context. Slower and more expensive, never wrong. |
| Body read (Phase 1c) fails | Same ladder as "Vault MCP unavailable" — local cache, else abort. Dispatch cannot proceed without the embodiment sections. |
| **Tail read (Phase 1d) fails, body OK** | **Dispatch anyway, without memory, and say so:** *"no dispatch memory — XP tail unreadable."* Memory is an enhancement; it must never block a dispatch. |
| Member has zero XP entries | Normal for a new member. State *"no prior engagements on record"* and dispatch. Not an error. |
| Any of the above during a counsel gate | Dispatch and log **"cold reviewers"** in the round log. **Never block a gate on vault availability.** |
| Slug not found | List available members, ask user to pick or run /counsel-refresh to build new. |
| File exists but schema_version is old | Flag: *"This stat sheet is on schema v[N] but current is v2. Consider running /counsel-migrate first."* Proceed with best-effort dispatch. |
| File has `curation_locked: true` | Proceed with dispatch but log warning. Do not attempt any edits during session. |
| XP logging fails (Phase 5 helper) | Surface the failure and move on — logging is fire-and-forget and must never block or corrupt a dispatch. Do NOT hand-write JSONL as a fallback; the helper already writes to the local cache dir when the vault is unreachable, and the drain scans it. |

## SECURITY / PRIVACY NOTES (from NSA review)

- **Never** include raw PII, client names, or dollar figures in scratchpad `project_context` or `topic` fields. Use slugs and categories.
- **Never** write to canonical zones (Identity, Voice, Frameworks, Mental Models, etc.) during dispatch. Dispatch is read-only against the member file. Only the scratchpad is written.
- If user's question would require persisting a NEW mental model or stance for the member, capture that as a scratchpad `noted` field but do NOT edit the member file directly. Curation happens via `/counsel-refresh` with evidence threshold.

## AUDIT TRAIL

Every successful dispatch writes:
1. XP line via `scripts/log-counsel-xp.js` — open + synopsis together, only when the substance threshold was met
2. `counsel/audit-log.md` append — `[timestamp] | [slug] | dispatch | [session_id]` (via MCP append mode)

<your-name> can review recent dispatches via future `/counsel-audit` skill.
