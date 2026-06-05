---
description: The First-Council Forge — an interview-driven primer that takes anyone from a domain of expertise to a 4-person advisory council of real public experts, with live forensic research, v2 stat sheets, a registry row, and a first-dispatch test. Distributable, ethics-gated, source-disciplined.
---

# /council-primer — The First-Council Forge

> "A council isn't four people who agree with you. It's four people worth disagreeing with." 

You are guiding someone — maybe a first-timer — through building their **first advisory council**: a
party of 4 real public experts they can summon for advice, review, and debate in any domain they choose.

This skill **systematizes a gold-standard process** for building a council (the same process behind the
bundled Marketing SEO Giants starter council): gap audit → top-10 shortlist → final-4 (full arc +
productive clash) → live forensic research → v2 stat sheets + registry row → first-dispatch test.

**A note on spelling:** the user-facing word is "council." It plugs into the existing **counsel** system
(`/counsel-dispatch`, the counsel registry, the members directory). Same thing — friendlier name.

---

## OPERATING RULES (read first, apply throughout)

1. **Every interview question uses `AskUserQuestion`** — 2–4 clickable options, RPG framing in the text
   ABOVE the call. Never a wall of open-ended prompts. Question content lives in
   `references/interview-question-bank.md` — read it before Phase 0. (You, the orchestrator, read plugin
   reference files. Subagents cannot.)
2. **RPG framing enhances, never obscures.** Keep the actual question crisp.
3. **Show before save.** The user's read-through (Phase 5) is the ship gate, not your own confidence.
4. **Source discipline is non-negotiable.** This skill profiles real living people. Sourced-or-`[UNVERIFIED]`,
   never asserted. No fabricated quotes.
5. **Resume-safe.** Write state only on phase-advance (atomic). Offer resume if a prior run exists.
6. **Distributable.** Never hard-assume the host's identity. Never bleed the host's private context into
   another user's output. Detect what's installed; adapt.

---

## STATE & PATHS (resolve once, up front)

Run a quick environment detect and remember the answers for the whole session:

- **Vault connected?** Is the `obsidian-brain` MCP available (try a lightweight call, e.g.
  `mcp__obsidian-brain__list_directory` on `counsel/members`)?
  - **Yes → MEMBER_DIR = vault** `counsel/members/` (via MCP). This is canonical — it's where
    `/counsel-dispatch` reads. Registry at the vault if present, else `~/.claude/references/counsel-registry.md`.
  - **No → MEMBER_DIR = local** `~/.claude/references/counsel/members/`. Registry at
    `~/.claude/references/counsel-registry.md`.
  - **If both a vault and a local members dir are live, check BOTH for slug collisions** (below).
- **Host context present?** Is there a `CLAUDE.md` (project or `~/.claude/CLAUDE.md`)? If yes, you may
  read it to seed values/alignment — but treat its personal content as host-private (see Identity-Bleed rule).
- **Registry present?** If a counsel registry exists, read it to (a) show the existing bench, (b) avoid
  duplicate council names, (c) compute the next ID later.
- **Dispatch installed?** Is `/counsel-dispatch` available? Affects the Phase 6 handoff.
- **Web reachable?** This skill is live-research-dependent (Phases 2 & 4). Do a lightweight pre-flight
  probe (a single WebSearch) **before Phase 2**. If web is unavailable, halt early per the no-internet
  rule (Phase 4 #6) instead of after a 5-phase interview — state is saved, offer to resume later.
- **State file:** `~/.claude/plugins/local/council-primer/pipeline/[council-slug]/state.md`
  (create the dir on first write). For external installs without that path, fall back to
  `./council-primer-state/[council-slug]/state.md` in the working directory.

State file shape (atomic write on each phase-advance):
```
council_slug: <slug>
council_name: <working name>
lane: quick | full
phase: 0..6
domain: <text>
arc: [<stage>, ...]
job: <text>
alignment: <text>
clash_pref: <productive | aligned>
shortlist: [<name>, ...]        # top 10
finalists: [<name>, ...]        # the 4
member_dir: vault | local
updated: <ISO timestamp>
```

---

## PHASE 0 — Orientation, Starter Kit, Resume, Lane, Ethics-Check-1

1. **Read** `references/interview-question-bank.md` now (you'll quote/adapt its questions).
2. **Orientation (1 short paragraph)** — for a first-timer, explain in plain terms: *what a council is*
   (4 expert "study-models" you can summon), *the payoff* (advice/review/debate in their voice, on
   demand), and *what they'll have at the end* (4 stat sheets + a registry entry + a first conversation).
2b. **Offer the starter kit (first-run value)** — the skill bundles 3 ready-to-use councils at
   `references/starter-kit/` (Expert Counsel · Marketing SEO Giants · NSA Elite Squad — 10 member sheets +
   a seed registry + a blank template). AskUserQuestion: **Seed the starter kit** / **Skip — build my own**.
   If they seed: copy `references/starter-kit/members/*.md` into the resolved MEMBER_DIR (see STATE & PATHS)
   and merge the 3 rows from `references/starter-kit/counsel-registry.starter.md` into the user's registry
   (create it if absent; if councils already exist, append with fresh IDs and skip duplicate slugs — never
   silent-overwrite an existing member sheet; offer reuse/refresh/skip per the collision policy). Confirm
   what landed and that they can now `/counsel-dispatch [slug]`. This gives instant value before they build
   anything. (Seeding is independent of the build flow — they can seed and stop, or seed and continue.)
   **Vault caveat:** `/counsel-dispatch` reads members from the Obsidian vault. If you seeded to the
   **local** MEMBER_DIR (no obsidian-brain MCP), `/counsel-dispatch` won't find them — summon members with
   the self-contained manual-read instruction from Phase 6 instead, or connect the vault and re-seed.
3. **Resume check** — if any `pipeline/*/state.md` shows `phase < 6`, offer to resume that council
   before starting fresh (prevents colliding with half-written sheets). Use AskUserQuestion.
4. **[MANDATORY] Ethics Check — point 1 (framing).** State the one-line gate from the question bank:
   we study public figures' public corpus to *honor and learn*, not to impersonate or fabricate. Confirm
   via AskUserQuestion before spending any research. If the user picks "Tell me more," explain the
   study-model framing, the anti-impersonation header every sheet carries, and that synthesized voice
   samples are labeled, never passed off as real quotes. Then re-confirm.
5. **Lane** — AskUserQuestion: **Quick Forge (~10 min, Recommended)** vs **Full Forge (~25 min)**.
   Show the time/step expectation on each so the choice is informed. Quick Forge asks only the ★ starred
   questions; Full Forge asks the full bank. Both reach the same v2 output.

Write state (`phase: 1`).

---

## PHASE 1 — Domain & Person Discovery

Work through the question bank (Quick = ★ only; Full = all). Batch ≤4 related questions per
AskUserQuestion call with RPG framing above.

- **Q1.1 Domain.** If the answer is vague ("business", "self-help"), run the **domain-too-vague
  clarifier** (2 questions) and restate a sharpened domain for confirmation before continuing.
- **Q1.2 The council's JOB** (review / advise / debate / teach).
- **Q1.3 The ARC** *(Full)* — auto-derive the domain's full journey (discovery → outcome), present it,
  let the user confirm/adjust. **Then run the visible gap audit:** show the arc stages and that they
  currently have *nobody* in any seat — frame the build as filling an empty bench.
- **Q1.4 Values / alignment** *(Full)* — if `CLAUDE.md` is present, propose the host's values and ask to
  confirm; else ask directly. (Remember the Identity-Bleed rule for export time.)
- **Q1.5 Clash preference** *(Full)* — productive clash (recommended) vs mostly aligned.
- **Q1.6 Must-include / must-exclude** — optional, both lanes.

For Quick Forge, infer arc/values/clash from the domain + job and state your assumptions in one line
("I'll cover the full [domain] arc and include one productive clash — say the word to change that").

Write state (`phase: 2`).

---

## PHASE 2 — Top-10 Candidate Shortlist

Generate **10 real public experts** who: (a) have a strong, verifiable **public corpus**
(books / talks / podcasts / blog / courses — embeddable for voice), (b) together cover the domain's
**full arc**, (c) align with the user's stated values, (d) honor must-include/exclude. Do a **light web
pass** to ground currency (who's active and relevant *now*, not just famous historically).

Present scannably — no walls of text:
```
THE BENCH — top 10 for [domain]
1. [Name] — [one-line why they earn a seat] · corpus: [book/podcast/site]
...
10. ...
```
Note coverage in a line ("This bench spans [arc stages]; the natural clash is [A] vs [B]").

> **Real-people-only rule:** if you cannot confirm someone is a real public figure with a public body
> of work, do not list them. Better a bench of 7 real experts than 10 padded with invented names.

Write state (`phase: 3`, save `shortlist`).

---

## PHASE 3 — Draft the Final 4

1. **Recommend a balanced 4** from the bench: full arc coverage, no overlap, ≥1 productive clash
   (unless the user chose "mostly aligned"). Present it as the first option.
2. **Live scorecard** — as the user keeps or swaps members, show:
   `Arc coverage: _/4 · Clash: present/absent · Overlap: none/[who]`
   Use AskUserQuestion to confirm or swap (swaps come from the top-10 bench via "Other").
3. **Bad-slate handling** — if the final slate has overlap or no clash, build it anyway but **record the
   compromise** to carry into the registry design note.
4. **<4 viable** — if the domain genuinely can't field 4 real experts, offer **2–3 seat council** or
   **broaden the domain**. Never fabricate to hit 4.
5. **Micro-reward** — once the 4 are locked, drop a 2-line **persona-mode teaser** of ONE member,
   in their voice, so the user hears a council member *before* the research wait. (Keep it clearly a
   preview; the verified sheet comes in Phase 4.)

Assign seats + arc-roles to each finalist (needed as research variables). Write state (`phase: 4`,
save `finalists`).

---

## PHASE 4 — Live Forensic Research (agent mode)

Deep-verify the 4 finalists in parallel. **This is where source discipline is enforced.**

1. **Read** `references/research-agent-prompts.md`. There is ONE prompt template + a Variable Matrix.
2. **Resolve every `{{VARIABLE}}`** for each finalist (member name/slug, seat, arc-role, shared domain/
   council-name/alignment/today/refresh-due/owner-label). Build 4 fully-resolved prompts.
3. **[MANDATORY] Inject inline.** Dispatch 4 parallel Task agents, each receiving its **fully-resolved
   prompt as the instruction string**. Agents get **NO file references** — they cannot read plugin files.
   **Before dispatch, inspect each resolved prompt and confirm zero `{{` tokens remain.**
4. **Progress signal** — tell the user "Researching 1 of 4: [name]…" etc., so the wait isn't silent.
5. **Per-agent validation** (on return) using each sheet's `---AUDIT---` block:
   - structurally complete: frontmatter + anti-impersonation header + the "HOW THIS FILE WORKS" comment block + the 9 body sections (Identity → Changelog)
   - has source URLs (sourced_claims > 0)
   - substantive length (≈ the bundled filled example's density)
   - no asserted-but-unsourced claims (unsourced ⇒ `[UNVERIFIED]`)
   - **[UNVERIFIED] density ceiling:** majority-unverified after a re-run ⇒ FAIL the member
   - `is_real_public_figure: true` — if false ⇒ do not ship
   - **Surgical re-run:** re-dispatch ONLY a failed agent.
   - **Finalist-fails-verification fallback:** if a member fails after re-run (not real / no corpus /
     too unverified), **return to Phase 3 and swap from the top-10 bench**. Never ship a hollow sheet.
6. **[MANDATORY] No-internet halt** — if web access is unavailable, STOP with a clear message. Do NOT
   synthesize "research" from memory. Offer to resume later (state is saved).
7. **Cross-sheet reconciliation** — once all 4 pass, compare them against each other: dedupe frameworks
   (assign to the true originator), resolve contradicting shared facts, and wire `cites` /
   `pairs_well_with` / `clashes_with` so the council has real relationships.

Hold the 4 verified sheets in memory (don't write yet). Write state (`phase: 5`).

---

## PHASE 5 — Write v2 Stat Sheets + Registry Row

**Assemble, then gate, then write.**

1. **Format check against the ⭐ gold standard** — confirm each new sheet matches the target in
   `references/stat-sheet-target.md`. Read the **gold-standard exemplar**
   `references/starter-kit/members/aleyda-solis.md` (the canonical finished sheet every new member is
   measured against) and the blank template `references/starter-kit/counsel-member-template.md` for the
   exact field list, then run the **"gold-standard bar" checklist** at the bottom of `stat-sheet-target.md`
   (all 9 sections + comparable depth + every claim sourced + labeled voice sample + real shibboleth).
   (If the user has their own counsel-member template in their environment, prefer theirs.) Confirm on every
   sheet, in order: frontmatter → **anti-impersonation header** → the **"HOW THIS FILE WORKS" comment
   block** (agents are told to reproduce it; if any sheet is missing it, prepend it verbatim from the
   template, substituting `{{OWNER_LABEL}}`) → the 9 body sections (Identity → Changelog).
2. **[MANDATORY] Ethics Check — point 2 (output scan).** Before writing:
   - **Impersonation/forgeable-quote scan** — every synthesized passage is labeled; no real quotes invented.
   - **Identity-bleed scrub (default-deny).** Any `CLAUDE.md`-derived personal/proprietary content —
     values, private frameworks, client or project names, not just obvious tokens — is **host-private by
     default**. It does NOT enter a sheet destined for distribution unless the user **explicitly confirms
     include**. When in doubt, leave it out and ask.
3. **Compose the registry row.** Read the registry immediately before writing (defensive), compute
   **ID = max-existing-ID + 1** (tolerate blank rows / numbering gaps — parse all IDs, take the max).
   Row fields: `ID | **[Council Name]** | tags (8–12, backtick-wrapped) | members + one-line roles |
   design note`. The **design note** documents: the gap/arc the council fills, the productive clash,
   any bad-slate compromise from Phase 3, dispatch modes (persona default; agent mode for high-stakes),
   and the assembled date.
4. **[MANDATORY] Member-slug collision policy.** For each finalist slug, check MEMBER_DIR (and the other
   dir if both are live). If `[slug].md` already exists: AskUserQuestion **reuse existing / refresh
   (overwrite with the new verified sheet) / skip & rename**. **Never silently overwrite.**
5. **[MANDATORY] Read-through gate (show before save).** Present the full slate + all 4 stat sheets +
   the registry row **inline** for the user to actually read. AskUserQuestion: **Approve & write** /
   **Edit a sheet** / **Re-research a member**. **Write only on explicit approval.**
6. **Write** (only after approval):
   - Each sheet to MEMBER_DIR (`counsel/members/[slug].md` — vault via
     `mcp__obsidian-brain__write_note`, or local via the Write tool).
   - Append the registry row to the registry table.
   - Confirm each write succeeded (file exists / MCP returned ok).

Write state (`phase: 6`).

---

## PHASE 6 — First-Dispatch Test (success gate) + Adaptive Handoff

1. **Ask for a sample question** (Q6.1) — propose a domain-relevant starter or let the user type one.
2. **Run a persona-mode round** — all 4 members answer in their own voices (use each sheet's Voice
   Calibration + Shibboleth). **Success = 4 audibly distinct voices + ≥1 unscripted disagreement.**
   - If the voices converge into agreement, **flag it** and offer to re-tune: sharpen a seat, swap a
     member for more clash, or strengthen a Voice Calibration section. This is the real success gate —
     four sheets that all sound the same is a failed build, even if the files wrote fine.
3. **Adaptive handoff** — based on the environment detect:
   - **If `/counsel-dispatch` is installed:** show usage — `/counsel-dispatch [slug]` for one member,
     or dispatch the whole council for a review round. List the 4 slugs.
   - **If NOT installed (external user):** give a **self-contained** instruction — "To summon a member,
     tell your AI: *'Read [path to slug].md and answer me as this person, in their voice.'* To convene
     the council, ask it to do that for all four and compare." No dependency on the host's installed skills.
4. **Return trigger** — close with a real-world cue, not just instructions:
   *"Next time you review your work or face a real decision in [domain], call your council before you act."*
5. **Offer `/quickshare` export** (with the identity-scrub already applied) for distribution.

Mark state `phase: 6 / complete`. Offer to save a vault session note / GOU if a reusable insight emerged
(honor the host's memory conventions only in the host's own environment).

---

## FAILURE MODES (quick reference — all defined above)

| Mode | Behavior |
|------|----------|
| Domain too vague | 2-question clarifier → restate sharpened domain → confirm. |
| <4 viable experts | Offer 2–3 seat council or broaden domain. Never fabricate. |
| User insists on bad slate (overlap / no clash) | Build it, flag the gap in the registry design note. |
| Finalist fails verification | Re-run once; if still failing, swap from the top-10 bench. |
| Majority-`[UNVERIFIED]` sheet | Fail the member; re-research or drop. Never ship hollow. |
| No internet | Halt with a clear message. Never synthesize research from memory. State is saved. |
| Registry ID collision | Re-read registry right before write; ID = max-existing + 1 (tolerate gaps). |
| Member-slug collision | Offer reuse / refresh / skip-&-rename. Never silent overwrite. |
| Mid-phase abandonment | State saved on phase-advance; resume offered at Phase 0. |
| Vault down (host) | Fall back to local `references/counsel/members/`; note that `/counsel-dispatch` (vault-reader) won't see it until synced. |

## ETHICS (two-point protocol — MANDATORY)

- **Point 1 (Phase 0):** confirm framing — study public corpus to honor, not impersonate to deceive;
  members are public figures with a public body of work.
- **Point 2 (Phase 5):** scan output before write — no forgeable quotes (synthesized passages labeled),
  and default-deny on host identity bleed (confirm-to-include for any CLAUDE.md-derived private content).
This mirrors the global Ethics Check Protocol (start + end of every client-facing workflow).
