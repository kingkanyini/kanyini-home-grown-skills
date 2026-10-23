# Phase 0.5 — Counsel Interview

## When this module loads

`commands/soulcial-media-engine.md` loads this module immediately after `phase-0-intake.md`
has written `00-master-brief.md` Part A and printed its completion anchor. Phase 0.5 runs
**before** the 7-phase engine (P1–P7) — the 8 counsel voices interview the END USER directly
to deepen the brief before any strategy artifact is drafted.

Reprint the state anchor at the top of this phase's first response:

```
[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 0.5-counsel-interview]
```

> **Important:** Triple Threat speaks here as its 3 branch-voices — 🎯 PM (Marty Cagan),
> 🏛️ Architect (Jobs / Hogg), 🛡️ Security (CIPHER · Troy Hunt) — not as all 14 individuals.
> The other 5 voices are the Conscious Content Counsel #58 members in their normal personas.

### Inputs consumed

| Variable | Source |
|---|---|
| `active_mode`, `active_brand_slug` | `mode-gate.md` |
| `regulated_flag`, `regulated_flag_reason` | `phase-0-intake.md` Step 4 (PRELIMINARY value) |
| `intake_growth_goal` | `phase-0-intake.md` Step 1 (coarse directional read) |
| `00-master-brief.md` Part A | `phase-0-intake.md` Step 6 (file already exists on disk) |

### Outputs produced

| Output | Description |
|---|---|
| `pm_business_outcome`, `architect_posting_capacity`, `justin_content_angle`, `vexking_emotional_truth` | Round 1 answers |
| `security_regulated_claims`, `jasmine_batching_reality`, `brock_format_history`, `marie_sell_target` | Round 2 answers |
| `regulated_flag` | FINAL value — re-confirmed or escalated from `phase-0-intake.md`'s preliminary value (Step 3 below) |
| `00-master-brief.md` Part B | Overwritten from "Not yet populated" placeholder with all 8 answers + final `regulated_flag` |

**No duplication with Phase 0.** Platform and niche are already captured in Part A — this
module does not re-ask either.

---

## Step 1: Round 1 — The Forge Council Opens

Present the RPG framing below as message text, then call **one** `AskUserQuestion`
batching all four questions.

---

> The war council assembles in the Forge Chamber. Three strategic voices lean over the
> map table. Behind them, the Conscious Content Counsel waits in the wings. The Forge
> speaks first.

---

Use `AskUserQuestion` with these four questions (2–4 options each + auto "Other"):

1. **🎯 PM — Marty Cagan (Triple Threat · Product Forge)** — *"What's the #1 business
   outcome this content must drive?"*
   - **Grow audience + brand awareness** — Content exists to get found by more of the right people.
   - **Generate qualified leads for my offer** — Content feeds a funnel or DM conversation.
   - **Drive direct sales / conversions** — Content is built to convert, not just to be seen.
   - **Build community and long-term trust** — Content deepens relationship with an existing audience.

2. **🏛️ Architect — Jobs / Hogg (Triple Threat · AI Dev)** — *"What's a realistic weekly
   posting capacity you can sustain?"*
   - **1–2 posts/week** — Lean and deliberate.
   - **3–4 posts/week** — Steady rhythm.
   - **5–7 posts/week** — Daily or near-daily.
   - **8+ posts/week** — Multi-platform daily.

3. **✍️ Justin Welsh (Counsel #58)** — *"What's the lean content angle you can sustain
   solo?"*
   - **Personal story + lesson** — Narrative-led, your experience as the teaching tool.
   - **Tactical how-to / step-by-step** — Process-driven, practical takeaways.
   - **Contrarian opinion / hot take** — Position against the conventional wisdom in your space.
   - **Behind-the-scenes / day-in-the-life** — Process and personality over polish.

4. **💫 Vex King (Counsel #58)** — *"What's the emotional truth your audience is
   carrying?"*
   - **Feeling stuck and unseen, despite doing the work** — Effort without visible progress.
   - **Fear of not being enough / imposter syndrome** — Self-doubt underneath the surface.
   - **Exhausted by surface strategies that miss the root** — Tired of tactics that don't address the real issue.
   - **Longing for deeper purpose and identity** — Searching for meaning beyond the day-to-day.

Store the four answers as `pm_business_outcome`, `architect_posting_capacity`,
`justin_content_angle`, `vexking_emotional_truth`.

> **Precedence note:** `pm_business_outcome` is the forced single-choice precision
> version of Phase 0 Step 1's coarse `intake_growth_goal` read — both sit on the same
> axis but are not meant to duplicate. **If this answer conflicts with `intake_growth_goal`,
> `pm_business_outcome` wins** (it's the deeper, more deliberate question). Note the
> conflict and the resolution in the Part B write (Step 5) so it's visible, not silent.

---

## Step 2: Round 2 — The Shadow Council Speaks

Present the RPG framing below as message text, then call **one** `AskUserQuestion`
batching all four questions.

---

> A second set of advisors steps forward — the Compliance Sentinel, the Calendar Queen,
> the Reel Alchemist, and the Heart Commander. Each asks exactly one question. Answer
> honestly; what you share here locks in the engine's operating parameters.

---

Use `AskUserQuestion` with these four questions (2–4 options each + auto "Other"):

1. **🛡️ Security — CIPHER · Troy Hunt (Triple Threat · NSA)** — *"Are there any
   regulated or compliance-sensitive claims we need to guardrail?"*
   - **Health, wellness, or supplement claims** — Anything touching physical health, healing, or supplements.
   - **Finance, investing, or income/results claims** — Anything touching money, returns, or income promises.
   - **Mental health or therapeutic outcome claims** — Anything touching therapy, trauma, or mental health outcomes.
   - **None — my niche is not regulated** — No health, finance, or mental-health claims in this content.

2. **📅 Jasmine Star (Counsel #58)** — *"What's your batching reality and content
   system today?"*
   - **I batch once a week** — One session, all of that week's content.
   - **I create day-of / spontaneously** — No batching, content made in the moment.
   - **I batch monthly** — One big shoot/write day covers the month.
   - **I have no system yet** — Starting from scratch.

3. **🎬 Brock Johnson (Counsel #58)** — *"What format or hook has actually worked for
   you before?"*
   - **Reels / short-form video** — Video has been the strongest performer so far.
   - **Carousels / multi-slide posts** — Carousels have driven the best engagement.
   - **Static single images with strong captions** — Image + caption combos have landed.
   - **Stories / interactive polls and questions** — Interactive formats have worked best.

4. **❤️ Marie Forleo (Counsel #58)** — *"What do you actually want to sell, and to
   whom?"*
   - **1:1 coaching or services to individuals** — Personal, high-touch delivery.
   - **A course, program, or digital product** — Scalable, structured delivery.
   - **A membership or recurring community** — Ongoing, recurring-revenue delivery.
   - **Physical products / e-commerce** — Tangible goods.

Store the four answers as `security_regulated_claims`, `jasmine_batching_reality`,
`brock_format_history`, `marie_sell_target`.

---

## Step 3: Resolve `regulated_flag` — MONOTONIC-ESCALATION CONTRACT (non-bypassable)

`security_regulated_claims` is the answer this module owes back to `phase-0-intake.md`
Step 4, which set `regulated_flag` PRELIMINARILY from niche/audience/landscape text alone
because this question hadn't been asked yet. Resolve the FINAL value here using the
fail-closed rule from `references/compliance-detect.md` Section 4 — applied as a
**monotonic-escalation contract**:

```
IF security_regulated_claims selects any of options 1-3
   (Health/Wellness, Finance/Income, Mental Health)
   OR an "Other" free-text answer that is non-empty / unclear
                                              → regulated_flag = TRUE   (escalate)

IF security_regulated_claims selects option 4
   ("None — my niche is not regulated")
                                              → regulated_flag = <unchanged from Phase 0>
                                                 (re-confirm, do NOT relax)

NEVER: a Phase 0.5 answer of any kind may set regulated_flag from TRUE back to FALSE.
```

**Why monotonic, not a re-vote:** `regulated_flag` already reflects Phase 0's fail-closed
niche/audience/landscape read. This module's job is to let the Security answer
*independently escalate* TRUE if Phase 0 missed something — never to relax a TRUE that
Phase 0 already (correctly, fail-closed) set. The flag can only move FALSE→TRUE across
the two phases combined; it can never move TRUE→FALSE at either step. This is the
same `safety-gate-fail-closed-asymmetry` principle Phase 0 Step 4 cites — a false alarm
(extra disclaimer) is always cheaper than a false pass (shipped regulated claim).

Update `regulated_flag_reason` to reflect the FINAL source: if Phase 0.5 escalated it,
note `"escalated by Security-voice answer (Phase 0.5)"`; if Phase 0 already had it TRUE
and Phase 0.5 confirmed, note `"confirmed — already TRUE from Phase 0 niche detection"`;
if it stays FALSE, note `"confirmed FALSE — niche detection clear AND Security-voice
selected 'not regulated'"`.

---

## Step 4: Append `00-master-brief.md` Part B

Open `~/.claude/projects/{active_brand_slug}-social-engine/00-master-brief.md` and replace
the `## Part B — Counsel Interview (Phase 0.5)` placeholder section (currently reading
*"Appended by `phase-05-counsel-interview.md`. Not yet populated."*) with:

```markdown
## Part B — Counsel Interview (Phase 0.5)

### Round 1 — The Forge Council
- **🎯 PM business outcome:** {pm_business_outcome}
- **🏛️ Architect posting capacity:** {architect_posting_capacity}
- **✍️ Justin Welsh content angle:** {justin_content_angle}
- **💫 Vex King emotional truth:** {vexking_emotional_truth}

### Round 2 — The Shadow Council
- **🛡️ Security regulated claims:** {security_regulated_claims}
- **📅 Jasmine Star batching reality:** {jasmine_batching_reality}
- **🎬 Brock Johnson format history:** {brock_format_history}
- **❤️ Marie Forleo sell target:** {marie_sell_target}

### Resolved flags
- **Regulated-niche flag (FINAL):** {regulated_flag} — {regulated_flag_reason}
  *(monotonic-escalation: can only move FALSE→TRUE across Phase 0 + Phase 0.5, never
  TRUE→FALSE)*
- **Business outcome precedence:** {pm_business_outcome} takes precedence over Phase 0's
  coarse `intake_growth_goal` ({intake_growth_goal}) on any conflict.
  {one-line note: "no conflict" OR "conflict resolved in favor of Phase 0.5 answer"}
```

Do not touch Part A. This is the only disk write this module makes.

---

## Step 5: Confirm and re-anchor

Print the phase-0.5 completion anchor and a one-line confirmation:

```
[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 0.5-counsel-interview]
```

> "Counsel interview locked for {brand display name}. 8 voices heard across 2 rounds.
> Regulated check is **{regulated_flag}** (final) — {regulated_flag_reason}. Business
> outcome: {pm_business_outcome}."

Proceed to Stage 1 (P1–P7) per `references/counsel-mapping.md` Table 1.
