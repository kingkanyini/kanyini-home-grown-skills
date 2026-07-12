---
description: Read-only Memory Forensics maintenance pass for the savepoint skill — a lite Vault Forensics council (persona mode) that audits the brain's context/memory/ store and reports fixes without ever deleting.
---

# Lite Vault Forensics — Memory Forensics maintenance pass

A **read-only** health check for the AI-brain's episodic memory store (`context/memory/`). Run it on demand (`/savepoint forensics`, or when asked to "check memory health / audit the saves"). It **reports and offers fixes — it never deletes or moves anything on its own.**

Portable by design: **no MCP, no vault, no network.** It works on any client's flat-file brain using only the filesystem + git.

> ⚖️ The three reviewers below are **study-models of public engineers**, used as review lenses — not the people, not their endorsement. Voices are synthesized.

## The council (persona mode — one round, each scores 1–10 + concrete fixes)

- **ARCHITECT** *(structure & completeness)* — is the memory store where it should be, and will it stay discoverable? Catches misplaced stores and layout drift.
- **HAMEDANI** *(file org, naming, frontmatter)* — do the saved notes follow the naming + frontmatter conventions? Catches drift and duplicates.
- **HOGG** *(reference & data integrity, never-fail-silent)* — do cross-references still resolve, and is anything orphaned? Catches danglers loudly.

## The audit

Resolve the **workspace root** and **brain confirmation** exactly as the savepoint skill's *Where saves go* section does. Then check:

1. **Placement (ARCHITECT).** Confirm the memory store lives at `<workspace-root>/context/memory/` inside a confirmed brain. Scan for **stray** `context/memory/` folders created outside a brain (a mis-write). From the workspace root:
   `find . -type d -name memory -path '*/context/memory' 2>/dev/null` — flag any not at the confirmed brain root.
2. **Git-contamination (HOGG safety gate — highest priority).** A session note must never be tracked or committed inside a client's own repo. Check:
   `git ls-files --error-unmatch context/memory/ 2>/dev/null` (tracked = breach) and whether `context/memory/` is in `.gitignore`. **Flag loudly** if memory notes are tracked/committed — they can carry private decisions and context. Offer to `git rm --cached` + add the `.gitignore` entry (never auto-run).
3. **Home-fallback saves (HOGG) — migrate, don't delete.** `~/.claude/references/context/` is the **active home fallback** (used whenever a session runs outside a confirmed brain), NOT a legacy path — so **never** flag its notes for deletion. When a confirmed brain exists, list any home-fallback notes for the same projects and offer to **migrate** them into `context/memory/` (migrate only; never auto-move, never delete).
4. **Referential integrity (HOGG).** If learned skills exist (`~/.claude/skills/learned/*.md` or `.claude/skills/learned/*.md`), check each `source_session:` value still resolves to a note that exists in the resolved memory store. Report danglers. Note: on a flat (LOCKED) build `source_session` should reference a `context/memory/` note; a value pointing at a vault `context/sessions/...` shape is expected divergence in a vault build, not a dangler.
5. **Convention drift (HAMEDANI).** Every note should be `[project]-[YYYY-MM-DD].md` — or the same-day counter variant `[project]-[YYYY-MM-DD]-N.md` — with a kebab-case project, carrying `type`, `created`, `source` frontmatter. Flag filename-pattern misses (the `-N` counter is valid, not drift), missing frontmatter, and duplicate/near-duplicate project stems.
6. **Rotation health.** Per project stem, count notes vs the ceiling (10 active / 5 paused). List over-ceiling projects and offer rotation — **never auto-delete** (matches the savepoint rotation rule).
7. **Split store (HOGG).** The same project stem living in BOTH the brain `context/memory/` and the home fallback `~/.claude/references/context/` = fragmented memory + rotation ceilings under-counted (each store rotates independently while the true count is higher). List cross-store duplicate stems and offer to consolidate into the brain (migrate only; never delete).

## Output (make problems loud — HOGG)

Lead with a one-line verdict a human reads in 10 seconds:

```
MEMORY FORENSICS: 🟢 GREEN — store healthy (N notes, M projects)
```
or
```
MEMORY FORENSICS: 🟡 ISSUES (K) — see below
```

Then a table grouped by issue class (Placement / Contamination / Orphans / Integrity / Convention / Rotation), each row = the exact path + the offered fix. End with: *"Want me to apply any of these? I won't touch anything until you say which."*

## Safety rules (non-negotiable)

- **Read-only by default.** Detect and report. Apply a fix ONLY after the user picks it.
- **Never delete client data.** Rotation and orphan cleanup are *offers*, never automatic.
- **Never write outside a confirmed brain** — same gate as the savepoint save path.
- **Contamination is the top gate:** if memory notes are committed inside a client's repo, surface that first and loudest.
