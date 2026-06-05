# Interview Question Bank — `/council-primer`

> The developed questions the orchestrator asks. **Every question uses `AskUserQuestion`** with 2–4
> clickable options (+ the auto "Other" escape hatch). RPG framing goes in the message text ABOVE the
> call, never inside an option. Option descriptions stay 1–2 sentences, ~25 words. Batch ≤4 related
> questions per call. "Other" carries every free-text answer (names, domains, custom values).

There are two lanes (chosen at Phase 0). **Quick Forge** asks only the ★ starred questions (~10 min).
**Full Forge** asks everything (~25 min). Both produce the same v2 output.

---

## PHASE 0 — Orientation, Resume, Lane

**Q0.1 — Lane** ★ *(RPG: "Two doors. Same forge at the end.")*
- **Quick Forge (~10 min) — Recommended** — You tell me the domain; I propose the experts and steer. Fastest path to a working council.
- **Full Forge (~25 min)** — Deep interview on job, arc, values, and clash. Most tailored.
- *(If a saved run exists)* **Resume my last forge** — Pick up where you left off.

**Ethics confirm (Phase 0, point 1)** — not a quiz, a one-line gate stated in text:
> "Quick check: a council is a *study-model* of real public figures, built from their public work —
> to learn from and honor, never to impersonate or put fake words in their mouths. Good to proceed?"
AskUserQuestion: **Yes, that's the spirit** / **Tell me more first**.

---

## PHASE 1 — Domain & Person Discovery

**Q1.1 — Domain** ★ *(RPG: "What realm is this council master of?")*
- **Marketing & growth** — ads, funnels, SEO, content, email, brand.
- **Product & tech** — engineering, design, AI, product management.
- **Health & healing** — coaching, nutrition, somatics, integrative medicine.
- *(Other = type your exact domain — "options trading", "nonprofit fundraising", "screenwriting", etc.)*

> **Domain-too-vague guard:** if the answer is broad/unclear ("business", "self-improvement"), run a
> 2-question clarifier before continuing: *(a)* "What's the ONE outcome someone hires this expertise
> for?" *(b)* "Beginner-friendly or advanced practitioner?" Then restate a sharpened domain and confirm.

**Q1.2 — The council's JOB** ★ *(RPG: "What do you want this party to DO for you?")*
- **Review my work** — critique drafts, plans, builds; score and edit.
- **Advise strategy** — big-picture direction and trade-offs.
- **Debate decisions** — argue both sides so I see the angles.
- **Teach me** — explain the domain like mentors.

**Q1.3 — The ARC** *(Full Forge)* *(RPG: "Every domain is a journey from A to Z.")*
Orchestrator auto-derives the domain's full arc (e.g., SEO: get found → get found by AI → mean
something → convert) and asks the user to confirm or adjust.
- **Looks right** — use this arc.
- **Add a stage** — (Other: name it).
- **Reframe it** — (Other: describe the journey in your words).

> **Visible gap audit:** after the arc is set, SHOW which stages have no expert yet —
> "A strong council here covers [stage A][stage B][stage C][stage D]. Right now you have nobody for
> any of them. Let's fill the gaps." This frames the build as filling an empty bench (productive urgency).

**Q1.4 — Values / voice alignment** *(Full Forge; auto-seeded from CLAUDE.md if present, then confirmed)*
*(RPG: "Who do you actually want in the room?")*
- **Data-driven & rigorous** — show me the evidence.
- **Bold & contrarian** — challenge the consensus.
- **Warm & teacherly** — patient, encouraging mentors.
- *(Other = your own words. If CLAUDE.md was read, the orchestrator proposes the host's values here and asks to confirm — see identity-bleed rule before any distributable export.)*

**Q1.5 — Clash preference** *(Full Forge)* *(RPG: "Harmony or productive friction?")*
- **Productive clash — Recommended** — include ≥1 pair who genuinely disagree (sharper advice).
- **Mostly aligned** — a unified philosophy, less debate.

**Q1.6 — Must-include / must-exclude** *(both lanes, optional)* *(RPG: "Any heroes you already know you want — or want to keep out?")*
- **No preferences — surprise me** — let the forge propose freely.
- **I have names** — (Other: list must-include and/or must-exclude names).

---

## PHASE 2 — Top-10 Candidate Shortlist (presented, not asked)

Not a question — the orchestrator presents 10 real experts (public corpus, cover the arc, match the
values) as a scannable list: **name · one-line why · corpus pointer**. Then proceeds to Phase 3.

> Generation rule: real public figures only, each with a verifiable public body of work
> (books / talks / podcasts / blog / courses). Span the arc; respect must-include/exclude.

---

## PHASE 3 — Draft the Final 4

**Q3.1 — Draft your party** ★ *(RPG: "Pick your starting four. Watch the scorecard fill.")*
Present a **recommended balanced 4** (full arc coverage + ≥1 clash) as the first option, plus the
ability to swap. As picks change, show the live scorecard:
`Arc coverage: 3/4 ✓ · Clash: present ✓ · Overlap: none ✓`
- **Go with the recommended 4 — Recommended** — balanced slate, ready to research.
- **Swap one or more** — (Other: name who's out and who's in from the top-10).

> **Bad-slate handling:** if the user's slate has overlap or no clash, build it anyway but record the
> compromise in the registry design note ("user chose 4 discovery-stage experts; conversion stage uncovered").
> **<4 viable:** if the domain yields fewer than 4 real public figures, offer **"build a 2–3 seat council"**
> or **"broaden the domain"** — never pad with fabricated or obscure names.

**Micro-reward** (after the 4 are locked, before the research wait): the orchestrator drops a 2-line
persona-mode teaser of ONE member in their voice so the user *hears* a council member before Phase 4.

---

## PHASE 5 — Read-through gate (presented for approval)

Not a question bank item, but the mandatory gate: show the full slate + all 4 stat sheets inline,
then AskUserQuestion: **Approve & write** / **Edit a sheet** / **Re-research a member**. Write only on approve.

> Before showing: run Ethics Check point 2 — scan for forgeable-quote risk + host-identity bleed.
> Default-deny on CLAUDE.md-derived personal/proprietary content (values, frameworks, client/project
> names): host-private unless the user explicitly confirms include-in-distributable.

---

## PHASE 6 — First-Dispatch Test (success gate)

**Q6.1 — Sample question for the council** *(RPG: "Let's hear them. Ask your new council something.")*
- **Use a starter prompt** — orchestrator proposes a domain-relevant question.
- **I'll ask my own** — (Other: type the question).

Then run a persona-mode round (all 4 voices). **Success = 4 distinct voices + ≥1 unscripted
disagreement.** If voices converge, flag it and offer to re-tune the clash (swap a member or sharpen seats).
