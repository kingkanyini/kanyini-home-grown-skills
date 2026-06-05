# Stat-Sheet Target — Single Source of Truth

> **This file points to the canonical schema. It does NOT duplicate it.** Read the canonical
> sources at build time so the format never drifts as the schema evolves.

## Why this file exists

The skill bundles its own canonical schema so it never drifts and never depends on files outside the
skill. Two bundled references define the target — read BOTH at build time:

| Reference | Bundled path (skill-relative) | Role |
|-----------|-------------------------------|------|
| **Blank template** (skeleton + field comments) | `references/starter-kit/counsel-member-template.md` | The schema definition — frontmatter fields + section order + how-this-file-works comment block. |
| ⭐ **THE GOLD STANDARD** (filled exemplar) | `references/starter-kit/members/aleyda-solis.md` | The canonical finished v2 sheet. **Every new member sheet is compared against this one — match its structure AND its depth.** |

> ⭐ **The gold standard is `references/starter-kit/members/aleyda-solis.md`.** It ships with the skill so
> the bar travels with it. Whenever you (or an agent) build a new member sheet, open this file and compare
> against it — same sections, same frontmatter, same source-discipline, comparable depth. It is the
> single reference the whole skill measures new sheets against.

**TARGET = the v2 format shown in the gold-standard exemplar.** At build time the orchestrator MUST read
both the blank template and the gold-standard exemplar, then produce sheets that match the exemplar's
structure and meet the quality bar below. (If the user already has their own counsel-member template in
their environment, prefer theirs; otherwise the bundled one is the source of truth.)

## Required frontmatter (schema_version: 2)

Read the live field list + inline guidance from `references/starter-kit/counsel-member-template.md`.
Every generated sheet carries all of these (do not invent new keys):

`name · slug · schema_version: 2 · role · primary_counsels · bench_counsels · specialty_tags ·
do_not_use_for · conflict_style · public_corpus (MASSIVE|STRONG|MEDIUM|LIGHT) · confidence: medium ·
last_refreshed (ISO) · next_refresh_due (ISO, +90d) · sessions_used: 0 · xp_archived_through: null ·
curation_locked: false · sensitivity: low · shibboleth · cites · pairs_well_with · clashes_with ·
related_dynamics`

## Required body sections (in this order — match the bundled filled example)

1. The **"HOW THIS FILE WORKS"** HTML comment block (copy verbatim from the canonical template).
2. `## Identity & Credibility (manual)` — who they are, title, company, track record, where they publish, one anchoring detail. Every credential carries a dated source URL or is flagged `[UNVERIFIED]`.
3. `## Voice Calibration (manual)` — Tone / Sentence style / Signature tics / Vocabulary used / Vocabulary avoided / one-paragraph recognizability + a **synthesized** sample paragraph (label it "synthesized — not a verbatim quote").
4. `## Frameworks (manual + curated)` — Core Framework + Recent Framework 1 + Recent Framework 2, each with a dated source URL.
5. `## How They Think (curated, evidence-gated)` — Mental Models (5–8) · Stances · Signature Questions & Red Flags. Quotes carry sources.
6. `## Unique Gifts / Outlier POV (curated)` — up to 5 "only they would say that" positions, each with date + source + why-it-matters.
7. `## Recent Content Snapshot (curated, decay-tracked)` — Snapshot-taken + Next-refresh dates, then the 5–15-row table (Date / Format / Title / Core thesis / Relevance / URL).
8. `## Use When... / Don't Use When... (manual)`.
9. `## XP / Session Log — [owner] (append, rolling 20)` — empty placeholder line.
10. `## Changelog (append — every AI edit with evidence)` — one initial-creation entry documenting live-research evidence + any flagged/unverified items + approver + date.

## The anti-impersonation header (MANDATORY — top of every sheet, right under frontmatter, above the comment block)

```
> ⚖️ **Study-model of a public figure, built from their public corpus. Not the person; not their
> endorsement. Synthesized statements are modeled, not real quotes — never present them as the
> person's actual words.**
```

## Source discipline (MANDATORY)

Every framework, credential, and work-history claim MUST carry a resolvable **dated primary URL**,
or be written `[UNVERIFIED — no source found]` and **never asserted as fact**. A member whose claims
are majority-`[UNVERIFIED]` after a re-research pass is **failed** — re-research or drop, never ship hollow.

## The gold-standard bar — compare every new sheet against ⭐ `aleyda-solis.md`

Before a new member sheet ships, hold it next to the gold standard and confirm it clears the same bar:

- [ ] **All 9 body sections present**, in order (Identity → Changelog), plus frontmatter + attribution header + the HOW-THIS-FILE-WORKS comment block.
- [ ] **Comparable depth** — Identity is 4–6 real sentences; 5–8 mental models; a Recent Content table with 5+ dated rows. Not a stub next to the exemplar.
- [ ] **Every claim sourced** — frameworks, credentials, work-history each carry a dated primary URL (or `[UNVERIFIED]`). The gold standard sources *everything*; match that.
- [ ] **Voice sample is labeled synthesized** — "(synthesized — not a verbatim quote)", never a fabricated real quote.
- [ ] **A real shibboleth** — a phrase only this person would say (the gold standard's is "become worthy of citations").
- [ ] **Use-When / Don't-Use-When are concrete** — specific scenarios, not generic ("when you need strategy").
- [ ] **Relationships use real in-system slugs** — cites / pairs_well_with / clashes_with point to actual members.

If the new sheet is visibly thinner or less sourced than the gold standard, it is not done. Match the bar.
