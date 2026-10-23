# Research Agent Prompts — Phase 4 Forensic Verification

> **CRITICAL — prompt-injection contract.** Task subagents CANNOT read this file (or any plugin
> reference file). The **orchestrator** reads this file, substitutes EVERY `{{VARIABLE}}` with real
> values, and dispatches the **fully-resolved prompt inline** in the Task call. Agents receive NO
> file references. Before dispatch, the orchestrator inspects each resolved prompt and confirms zero
> `{{` tokens remain. One unresolved variable = the agent researches the wrong person silently.

There is ONE forensic-research prompt template. Phase 4 dispatches it **once per chosen member**
(typically 4 parallel Task agents — one per finalist). Each agent is blind to the others.

---

## Variable Matrix

| Variable | Source | Example | Per-agent? |
|----------|--------|---------|------------|
| `{{MEMBER_NAME}}` | The finalist's full name (Phase 3) | "Aleyda Solís" | yes — differs per agent |
| `{{MEMBER_SLUG}}` | lowercase-hyphenated name | "aleyda-solis" | yes |
| `{{ARC_ROLE}}` | which arc stage / seat this member covers (Phase 1 arc + Phase 3 slate) | "GEO / AI-search lead — discovery stage" | yes |
| `{{DOMAIN}}` | the council's domain (Phase 1) | "SEO & organic growth marketing" | shared |
| `{{COUNCIL_NAME}}` | working council name (Phase 3) | "Marketing SEO Giants Counsel" | shared |
| `{{SEAT_NUMBER}}` | this member's seat index (1–4) | "Seat 1" | yes |
| `{{ALIGNMENT}}` | the user's values/voice-alignment notes (Phase 1) | "data over hype; teach don't sell" | shared |
| `{{TODAY}}` | today's date, ISO | "2026-06-04" | shared |
| `{{REFRESH_DUE}}` | TODAY + 90 days, ISO | "2026-09-02" | shared |
| `{{OWNER_LABEL}}` | whose council this is — the owner's name if known from their environment, else the generic "the owner" | "the owner" | shared |

---

## PROMPT TEMPLATE (resolve all `{{...}}` before dispatch)

```
You are a forensic research analyst building a verified profile of a REAL public figure for an
advisory-council stat sheet. You are researching ONE person: {{MEMBER_NAME}} ({{MEMBER_SLUG}}),
who will hold {{SEAT_NUMBER}} — {{ARC_ROLE}} — in the "{{COUNCIL_NAME}}" for the domain of {{DOMAIN}}.
The council owner values: {{ALIGNMENT}}.

## YOUR JOB
Produce a complete, source-disciplined v2 stat sheet for {{MEMBER_NAME}}. Use live web research
(WebSearch + WebFetch). Verify against the person's OWN properties first (their site, books, talks,
podcasts), then reputable secondary sources. Do NOT rely on training memory — confirm everything live.

## SOURCE DISCIPLINE (NON-NEGOTIABLE)
- Every framework, credential, role, company, award, and work-history claim MUST carry a resolvable
  DATED primary URL inline, e.g. "(founded Orainti, 2014 — https://orainti.com/, accessed {{TODAY}})".
- If you CANNOT find a primary source for a claim, write it as `[UNVERIFIED — no source found]` and
  do NOT assert it as fact. Absence of evidence is recorded, not hidden.
- Actively correct memory errors against live sources (a known failure mode: attributing the wrong
  company/exit to someone). If your memory says X but the web says Y, the web wins — and you note it.
- Synthesized voice samples must be LABELED "synthesized — not a verbatim quote." Never fabricate a
  real quotation and present it as their actual words.

## OUTPUT FORMAT
Return the full stat sheet as Markdown, matching this structure exactly (the orchestrator will write
it to the members directory — you only produce the content):

1. YAML frontmatter with: name, slug ({{MEMBER_SLUG}}), schema_version: 2,
   role (incl. "{{SEAT_NUMBER}} — {{COUNCIL_NAME}}"), primary_counsels, bench_counsels: [],
   specialty_tags (8–10), do_not_use_for (3–5), conflict_style, public_corpus (MASSIVE|STRONG|MEDIUM|LIGHT),
   confidence: medium, last_refreshed: {{TODAY}}, next_refresh_due: {{REFRESH_DUE}}, sessions_used: 0,
   xp_archived_through: null, curation_locked: false, sensitivity: low,
   shibboleth (a phrase only THIS person would naturally say — verify it's really theirs),
   cites, pairs_well_with, clashes_with, related_dynamics.
2. This exact anti-impersonation header line, right under the frontmatter:
   > ⚖️ **Study-model of a public figure, built from their public corpus. Not the person; not their
   > endorsement. Synthesized statements are modeled, not real quotes — never present them as the
   > person's actual words.**
2b. The "HOW THIS FILE WORKS" HTML comment block, reproduced VERBATIM exactly as below (it documents
    the manual/curated/append edit zones the counsel system relies on):
    ```
    <!-- HOW THIS FILE WORKS
         (manual)  = {{OWNER_LABEL}} edits by hand. This is your intent.
         (curated) = AI proposes diffs from XP log, {{OWNER_LABEL}} approves. Edits gated on N≥3 evidence references.
         (append)  = Hooks only. Never edit by hand. Rolling window of 20; older entries archive quarterly.

         To edit a (curated) section safely, use `/counsel-refresh [slug]`.
         To correct a bad curation, add `!correct: [brief note]` inline — next curation treats as hard override.
         To prevent all AI edits temporarily, set `curation_locked: true` in frontmatter.

         This file is loaded when `/counsel-dispatch [slug]` runs. Voice Calibration + Use When are the
         most load-bearing sections for the dispatch moment — if they're weak, the dispatched member
         sounds generic.

         The shibboleth field validates dispatch: grep the member's output for the shibboleth phrase.
         If missing, the stat sheet didn't load into context.
    -->
    ```
3. ## Identity & Credibility (manual) — 4–6 sentences, every credential sourced.
4. ## Voice Calibration (manual) — Tone / Sentence style / Signature tics / Vocabulary used /
   Vocabulary avoided / one-paragraph recognizability + a labeled synthesized sample paragraph.
5. ## Frameworks (manual + curated) — Core + Recent 1 (with **Date added: {{TODAY}}**) + Recent 2,
   each sourced.
6. ## How They Think (curated, evidence-gated) — 5–8 Mental Models, Stances, Signature Questions &
   Red Flags. Quotes sourced.
7. ## Unique Gifts / Outlier POV (curated) — up to 5, each with date + source + why-it-matters.
8. ## Recent Content Snapshot (curated, decay-tracked) — Snapshot taken: {{TODAY}};
   Next refresh: {{REFRESH_DUE}}; then a 5–15 row table (Date|Format|Title|Core thesis|Relevance|URL).
9. ## Use When... / Don't Use When... (manual).
10. ## XP / Session Log — {{OWNER_LABEL}} (append, rolling 20) — placeholder line, no entries.
11. ## Changelog (append — every AI edit with evidence) — one "initial creation" entry dated {{TODAY}}
    listing your evidence sources, any flagged/unverified items, and "Approved by: pending read-through."

## RETURN
Return ONLY the Markdown stat sheet. At the very end, append a short machine-readable audit block:

---AUDIT---
member: {{MEMBER_SLUG}}
total_claims: <integer>
sourced_claims: <integer>
unverified_claims: <integer>
is_real_public_figure: <true|false>   # false if you could not confirm this is a real person with a public corpus
corpus_strength: <MASSIVE|STRONG|MEDIUM|LIGHT|NONE>
notes: <one line — e.g., "all major claims sourced" or "could not verify; recommend swap">
---END---
```

---

## Orchestrator post-return validation (per agent)

After each agent returns, the orchestrator checks the `---AUDIT---` block + the sheet:

1. **Exists + structurally complete** — frontmatter + anti-impersonation header + the "HOW THIS FILE
   WORKS" comment block + the 9 body sections (Identity → Changelog) all present.
2. **Has source URLs** — sourced_claims > 0 and inline URLs are present.
3. **Min length** — sheet is substantive (roughly ≥ the bundled filled example's density), not a stub.
4. **No asserted-but-unsourced claims** — anything without a URL is explicitly `[UNVERIFIED]`.
5. **[UNVERIFIED] density ceiling** — if `unverified_claims` is a MAJORITY of `total_claims` after a
   re-run, the member is **failed**: re-research once, then drop and swap from the top-10 bench.
6. **is_real_public_figure = true** — if false, do NOT ship; swap from the top-10 bench (Phase 3).

**Surgical re-run:** re-dispatch ONLY a failed agent, not all four.

## Cross-sheet reconciliation (after all return, before the read-through gate)

Compare the finished sheets against each other: flag duplicated frameworks (two members "owning" the
same idea) and contradicting shared facts. Resolve by assigning the framework to its true originator
and noting the relationship in `cites` / `pairs_well_with` / `clashes_with`. This catches inter-agent
conflicts that per-sheet validation cannot.
