# Phases 1–7 — Strategy Through Monetization (Stage 1)

## When this module loads

`commands/soulcial-media-engine.md` loads this module immediately after
`phase-05-counsel-interview.md` has written `00-master-brief.md` Part B and printed its
completion anchor (or after a disk-resume scan lands here directly — see "Fidelity &
disk-resume contract" below). This module generates the 7 raw strategy artifacts that
the Stage 2 quality gate (`quality-gate.md`) and Stage 3 assembly (`assembly.md`) consume.

Reprint the state anchor at the top of this module's first response, and again at the
top of every individual phase block (the anchor's `Phase:` segment changes per phase):

```
[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: {N}-{phase-slug}]
```

### Inputs consumed

| Variable | Source |
|---|---|
| `00-master-brief.md` Parts A + B | `phase-0-intake.md` + `phase-05-counsel-interview.md` (already on disk) |
| `references/counsel-mapping.md` Table 1 | phase → counsel lead/support + OO/Prop feed |
| `references/soul-lens-rubric.md` | P2, P6 — soul-lens intensity application (H5) |
| `references/hook-bank.md` | P6 — hook types + format first-beats + thumb-stop test (H7) |
| `oo_prop_sources`, `oo_prop_status` | `phase-0-intake.md` Step 5 |
| `active_platforms` | `phase-0-intake.md` Step 2 |
| `soul_intensity` (alias `soul_lens_intensity`) | `phase-0-intake.md` Step 3 |
| `regulated_flag` | final value, resolved by `phase-05-counsel-interview.md` Step 3 |
| `architect_posting_capacity` | `00-master-brief.md` Part B — drives P5 density (H4) |

### Outputs produced

| Output | Path |
|---|---|
| `01-strategy.md` … `07-monetization.md` | `~/.claude/projects/{active_brand_slug}-social-engine/0N-{name}.md` |
| 4 checkpoint approvals (P4, P5, P6, P7) | held in conversation context; each gates the next write |

---

## Fidelity & disk-resume contract (non-bypassable ordering)

**Every phase block below re-derives from the APPROVED prior artifact — read from disk,
never from conversation memory of an earlier draft.** This is the Fidelity Principle
applied to a multi-stage generation pipeline: if P3 changes during a checkpoint revision,
P4 must reflect the *revised* P3, not whatever P3 looked like when Claude first drafted
it earlier in the same conversation.

Before drafting phase **N**, execute this exact sequence:

1. **Read** `0(N-1)-{name}.md` directly from disk with the `Read` tool (skip for P1 — it
   has no numbered predecessor; P1 reads `00-master-brief.md` instead).
2. For any phase with an OO/Prop feed, **read the OO/Prop source file/note directly**
   (not a paraphrase carried in context) — this is what makes the P3 (H8) and P7 (H6)
   "DIRECTLY" requirements real rather than aspirational.
3. Draft phase N from those freshly-read sources.
4. Write `0N-{name}.md` to disk.
5. If phase N is a checkpoint phase (P4/P5/P6/P7), do not proceed to phase N+1 until the
   checkpoint is approved (see "Checkpoint mechanic" below).

**Why this matters at this exact granularity:** Stage 1 has 7 sequential writes and 4
approval pauses — the highest compaction-risk stretch in the whole skill (per spec
§4 H12). Re-reading from disk on every phase, not just on resume, means a mid-pipeline
compaction event never silently regenerates from a stale or hallucinated memory of an
earlier phase. The orchestration brain's disk-resume scan (Task 11) handles *session*
resume; this contract handles *intra-session* fidelity on every single phase transition.

---

## Checkpoint mechanic (shared by P4, P5, P6, P7)

At each of the four checkpoints, present the freshly-written artifact inline (full text,
not a summary), then call `AskUserQuestion` with:

- **Approve & continue (Recommended)** — Artifact locks as-is; proceed to the next phase.
- **Revise — give feedback** — Free-text via "Other"; redraft this phase only, re-reading
  the same upstream sources, then re-present for another checkpoint pass.
- **Pause here for now** — Stop the pipeline; resume later via the disk-resume scan
  (this artifact stays on disk as the last APPROVED one).

A revision cycle never skips back further than the current phase — downstream phases
haven't been drafted yet, so there's nothing to invalidate forward.

---

## P1 — Full Strategy → `01-strategy.md`

**Counsel framing (persona mode):** Lead **Justin Welsh** (lean, systemized, "what's the
smallest sustainable system that compounds") · Support **Marie Forleo** ("everything is
figureoutable," strategy in service of an authentic brand, not a content mill). No
`AskUserQuestion` here — per spec §6.2 flow control, P1 flows straight through to P2.

**Reads from:** `00-master-brief.md` Parts A + B in full — this is the first phase, so
there is no prior numbered artifact to re-derive from.

**OO/Prop feed:** if `oo_prop_sources` is non-empty, open the recorded OO artifact and
pull the **positioning statement + ideal avatar description** to seed the strategy frame
(per `counsel-mapping.md` OO feed notes — "P1: pull OO positioning statement + ideal
avatar description"). If `oo_prop_status: skipped`, generate the frame from Part A/B
alone and add a one-line flag: *"No OO seed — strategy frame is generic until refreshed."*

**Adapted source prompt** (studied and adapted, not copied, from create_daniel2's
"Full Social Media Strategy" prompt): generate a full strategy covering brand
positioning, content direction, a directional audience-targeting sketch (full depth
lands in P2), and a directional monetization overview (full depth lands in P7). Justin's
lens keeps the system buildable at `architect_posting_capacity`; Marie's lens keeps it
values-led, not extractive.

Write `01-strategy.md`:

```markdown
# {Brand display name} — Phase 1: Full Strategy

[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 1-strategy]

## Brand Positioning
{1-2 paragraphs — who this brand is to its audience}

## Content Direction
{the lane this content lives in — angle, tone, recurring themes}

## Audience Targeting (sketch — full build in 02-audience.md)
{directional, 3-5 lines}

## Monetization Overview (sketch — full build in 07-monetization.md)
{directional, 3-5 lines}

## OO Seed Used
{positioning statement + avatar description pulled, OR "skipped — see Phase 0 oo_prop_status"}
```

**Soul-lens scope (H5):** N/A for this phase — `soul_intensity` application is scoped to
P2 and P6 only (per `references/soul-lens-rubric.md`); P1 stays at directional/sketch
depth and carries no soul-lens calibration of its own.

No checkpoint. Proceed straight to P2.

---

## P2 — Audience Psychology → `02-audience.md`

**Counsel framing (persona mode):** Lead **Vex King** (depth over surface, names the
emotional truth underneath the strategy) · Support **Marie Forleo** (translates the
emotional truth into messaging angles a real business can use). No `AskUserQuestion`
here — flows straight through to P3.

**Reads from:** `01-strategy.md` (auto-passed — re-read from disk; no checkpoint at
P1–P3) + `00-master-brief.md` Part B's `vexking_emotional_truth` answer.

**Adapted source prompt** (studied and adapted, not copied, from create_daniel2's
"Audience Psychology Breakdown" prompt): use the laddering technique below (per H9) to
map surface complaints to underlying wounds, then build the full audience-psychology
profile — frustrations, desires, fears, daily content habits, and messaging angles.

**(H9) Surface-complaint → underlying-wound laddering step (non-optional):** before
writing frustrations/desires/fears, run an explicit **laddering** pass for each named
surface complaint — climb from the stated complaint to the underlying wound it's
standing in for. Do not stop at the funnel-psych triad (frustrations/desires/fears) as
a flat list; show the ladder.

```
Surface complaint → Underlying wound
"I want more followers" → "I'm afraid I don't matter"
"I want better engagement" → "I'm afraid I'm invisible even when I show up"
"I want my posts to convert" → "I'm afraid my work isn't actually worth paying for"
```

Ladder at least 3 surface complaints relevant to this brand's audience — pull the
specific complaints from `vexking_emotional_truth` and the strategy frame, don't reuse
the generic examples above verbatim.

**Soul-lens application (H5):** read `references/soul-lens-rubric.md` directly before
writing audience-psychology copy. Apply `soul_intensity` across all 4 axes (spiritual
vocabulary, framework naming, story-vs-statement ratio, CTA tone) to how the wounds and
desires are *described* in this artifact — not just to P6 post copy. Honor the
non-bypassable ceiling guardrail at any intensity: validate the feeling before
reframing it, never imply the audience should already be past what they're feeling.

Write `02-audience.md`:

```markdown
# {Brand display name} — Phase 2: Audience Psychology

[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 2-audience]

## Surface Complaints → Underlying Wounds (laddering)
{3+ laddered pairs, per H9}

## Frustrations / Desires / Fears
{full breakdown, informed by the laddering above}

## Daily Content Habits
{where/how this audience actually consumes content}

## Messaging Angles + Scroll-Stopping Topics
{derived from the wounds, not the surface complaints}

## Soul-Lens Setting Applied
{soul_intensity} — {one-line note on how it shaped tone in this artifact}
```

No checkpoint. Proceed to P3.

---

## P3 — Authority Positioning → `03-positioning.md`

**Counsel framing (persona mode):** Lead **Justin Welsh** (the "go-to name" angle,
differentiation through specificity) · Support **Jasmine Star** (positioning that's
visually and narratively consistent, not just a tagline). No `AskUserQuestion` here —
flows straight through to the P4 checkpoint.

**Reads from:** `02-audience.md` (auto-passed — re-read from disk; no checkpoint at
P1–P3) + `01-strategy.md`.

**Adapted source prompt** (studied and adapted, not copied, from create_daniel2's
"Authority Positioning Plan" prompt): build authority positioning anchored to a real
differentiator and avatar-pain language pulled DIRECTLY from OO (per H8) — not a
confident-sounding placeholder.

**(H8) OO differentiator + avatar-pain feed, read DIRECTLY:** open the `oo_prop_sources`
artifact itself (not a summary carried from P1) and pull the **OO differentiator** and
**avatar-pain language** verbatim where possible. This is what keeps Authority
Positioning specific instead of generic — the "go-to name" claim must trace to a real
differentiator and real pain language, not a confident-sounding placeholder. If
`oo_prop_status: skipped`, state that explicitly in the artifact and flag positioning as
provisional until an OO/Prop run feeds it.

Write `03-positioning.md`:

```markdown
# {Brand display name} — Phase 3: Authority Positioning

[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 3-positioning]

## The Differentiator (pulled DIRECTLY from OO)
{verbatim or near-verbatim OO differentiator, OR "skipped" flag}

## Avatar-Pain Language (pulled DIRECTLY from OO)
{verbatim or near-verbatim avatar-pain phrases}

## Positioning Statement
{the "go-to name for X" claim, built from the differentiator + pain language above}

## What Makes This Defensible
{why a competitor can't just copy this positioning — ties back to the differentiator}
```

**Soul-lens scope (H5):** N/A for this phase — `soul_intensity` application is scoped to
P2 and P6 only (per `references/soul-lens-rubric.md`).

No checkpoint. Proceed to the P4 checkpoint.

---

## P4 — Content Pillars → `04-pillars.md` — **CHECKPOINT**

**Counsel framing (persona mode):** Lead **Jasmine Star** (visual + narrative system —
pillars that repeat without going stale) · Support **Brock Johnson** (pillars that
actually generate scroll-stopping topics, not just clean labels).

**Reads from:** `03-positioning.md` (auto-passed — re-read from disk; no checkpoint at
P1–P3) + `02-audience.md`.

**OO/Prop feed:** pull the **OO/Prop belief architecture** (the belief-shift sequence,
if a Propaganda Machine artifact exists in `oo_prop_sources`) to shape pillar sequencing
— pillars should move the audience through the belief arc, not sit as 5 unrelated topic
buckets.

**Adapted source prompt** (studied and adapted, not copied, from create_daniel2's
"Content Pillars That Convert" prompt): build 5 content pillars sequenced through the
audience's belief arc, not 5 unrelated topic buckets.

Write `04-pillars.md`:

```markdown
# {Brand display name} — Phase 4: Content Pillars

[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 4-pillars]

## The 5 Pillars
{for each: name, 1-line description, 3 example topics, why it connects to the audience}

## Belief-Architecture Sequencing
{how the 5 pillars move the audience through the belief arc — OR "no Prop belief
architecture available; pillars sequenced by audience priority from 02-audience.md"}
```

**Soul-lens scope (H5):** N/A for this phase — `soul_intensity` application is scoped to
P2 and P6 only (per `references/soul-lens-rubric.md`).

**CHECKPOINT.** Present `04-pillars.md` in full, then run the Checkpoint mechanic
above. Do not draft P5 until this checkpoint is approved.

---

## P5 — 30-Day Calendar → `05-calendar.md` — **CHECKPOINT**

**Counsel framing (persona mode):** Lead **Jasmine Star** (batching, repeatability,
visual rhythm) · Support **Brock Johnson** (format variety, hook timing across the
month).

**Reads from:** `04-pillars.md` (APPROVED — re-read from disk, post-checkpoint).

**(H4) Density is capacity-driven, NOT a daily fill.** Density = the Phase 0.5
posting-capacity answer (`architect_posting_capacity`), translated to an active-post
count over the 30-day span — for example, **3×/week → ~13 active posts over 30 days**.
Every other day is an **OFF-DAY** card marked engage/repost, not a forced content slot.
Never default to "one post per day" regardless of stated capacity.

**Per-day goal (required on every active-post card):** each active-post day names a
**per-day goal** — `reach`, `trust`, or `buy` — so the calendar reads as a deliberate
sequence toward P7's monetization arc, not a flat content dump.

**Cluster same-format cards + append a Batch Plan:** group active-post days that share a
format (e.g. all carousel days) so they can be produced in one sitting. After the daily
grid, append a **Batch Plan** section: what gets filmed/written together, on which days,
matching the brand's batching reality (`jasmine_batching_reality` from Part B).

**Public-facing copy note:** any hook lines or caption openers drafted in this artifact
are public-facing — run the **AI-isms ban list + 7-step Humanization Pass** (per
references/social-spine/voice.md) on every line of copy before it goes in the card, not just on P6.

**Adapted source prompt** (studied and adapted, not copied, from create_daniel2's
"30-Day Content Plan" prompt): build a 30-day content calendar sized to actual posting
capacity (per H4), not a forced daily-post default.

Write `05-calendar.md`:

```markdown
# {Brand display name} — Phase 5: 30-Day Content Calendar

[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 5-calendar]

## Density Note
Posting capacity: {architect_posting_capacity} → {N} active posts over 30 days.
Off-days: engage/repost (not forced content slots).

## Daily Grid
{day-by-day: ACTIVE POST (pillar, format, angle, hook line, per-day goal: reach/trust/buy)
 OR OFF-DAY (engage/repost note) — same-format days flagged for clustering}

## Batch Plan
{what gets filmed/written together, on which days, sized to jasmine_batching_reality}

## Humanization Pass Confirmation
All hook lines/caption openers in this calendar passed the AI-isms ban + 7-step
Humanization Pass before being written above.
```

**Soul-lens scope (H5):** N/A for this phase — `soul_intensity` application is scoped to
P2 and P6 only (per `references/soul-lens-rubric.md`).

**CHECKPOINT.** Present `05-calendar.md` in full, then run the Checkpoint mechanic
above. Do not draft P6 until this checkpoint is approved.

---

## P6 — Scroll-Stopping Posts → `06-posts.md` — **CHECKPOINT**

**Counsel framing (persona mode):** Lead **Brock Johnson** (hook craft, format variety,
the thumb-stop test) · Support **Vex King** (emotional resonance, soul-lens calibration
so the hook doesn't outrun the depth).

**Reads from:** `05-calendar.md` (APPROVED — re-read from disk, post-checkpoint).

**OO/Prop feed:** pull **Prop proof blocks** (social proof / result snippets, if a
Propaganda Machine artifact exists) and **OO hooks** for post CTAs — proof and hook
language should trace to real material, not invented results.

**5 hero posts, one per pillar, + offer to expand.** Write exactly 5 posts — one drawn
from each of the 5 pillars in `04-pillars.md` — then close the artifact with an offer to
expand to more posts on request.

**(H7) Hook bank + format tagging (read `references/hook-bank.md` directly before
drafting):**

- Each post names a **hook type** from the 6-type menu in `hook-bank.md` (Contrarian
  Take, Open Loop, Callout, Result-Reveal, Mistake/Confession, or the First-3-Words rule
  applied inside one of the other 5).
- Each post is tagged to a **format** (Reel / carousel / static / story) and follows
  that format's **format-specific first-beat rule** from `hook-bank.md` (Reel = hook
  lands in frame 1; carousel = cover-slide single promise ≤10 words; static = hook in
  the caption's first ~125 characters; story = open with a poll/question).
- Each post passes the **thumb-stop test** — *"would the first line/frame stop YOUR
  thumb? If not, rewrite."* Record the result as `Thumb-stop check: PASS / FAIL`. A
  **FAIL is a blocker, not advisory** — mark it `BLOCKER?: yes` and rewrite the post
  before it ships in this artifact; never publish a FAIL forward to the checkpoint.
- **Format Variety Rule:** the 5 hero posts must span **at least 3 distinct formats** —
  no all-Reels collapse, no all-carousels default.
- If `active_platforms` has more than one entry, each post names its **target platform**
  in addition to its format (per `hook-bank.md`'s Format Variety Rule — Platform + Format
  + Hook type, all three named on every post).

**(H5) Soul-lens application:** read `references/soul-lens-rubric.md` directly and apply
`soul_intensity` to every post's copy across all 4 axes. Run the non-bypassable ceiling
guardrail check on any post at `overt`: does it validate the feeling before reframing it?
If it fixes before it sees, revise before it ships in this artifact.

**Public-facing copy:** all 5 hero posts are public-facing copy. Run the **AI-isms ban
list + 7-step Humanization Pass** (per references/social-spine/voice.md) on every post before it's written into
the artifact — this is the heaviest public-copy surface in the whole pipeline.

**Adapted source prompt** (studied and adapted, not copied, from create_daniel2's "Posts
That Stop the Scroll" prompt): build hook-bank-tagged (H7) hero posts that pass the
thumb-stop test, one per content pillar.

Write `06-posts.md` (use the `Platform / Format / Hook type / Thumb-stop check` tag
block from `hook-bank.md` on every post):

```markdown
# {Brand display name} — Phase 6: Scroll-Stopping Posts

[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 6-posts]

## Hero Post 1 — Pillar: {pillar name}
Platform: {platform}
Format: {Reel / carousel / static / story}
Hook type: {named hook type from hook-bank.md}
Thumb-stop check: PASS / FAIL (BLOCKER?: yes/no)
Soul-lens setting applied: {soul_intensity}

{hook line / cover frame description} → {useful insight / body} → {CTA}

## Hero Post 2 — Pillar: {pillar name}
{...same structure...}

## Hero Post 3 — Pillar: {pillar name}
{...}

## Hero Post 4 — Pillar: {pillar name}
{...}

## Hero Post 5 — Pillar: {pillar name}
{...}

## Format Variety Check
Formats used: {list} — spans {N} distinct formats (must be ≥3).

## Humanization Pass Confirmation
All 5 posts passed the AI-isms ban + 7-step Humanization Pass before being written above.

## Expand Offer
This artifact ships 5 hero posts (one per pillar) per the design decision. Ask if you
want this expanded to more posts per pillar.
```

**CHECKPOINT.** Present `06-posts.md` in full, then run the Checkpoint mechanic above
— including a clear callout if any post still carries `BLOCKER?: yes` (it should not,
per the FAIL-handling rule above, but the checkpoint is the last human eyeball before
Stage 2). Do not draft P7 until this checkpoint is approved.

---

## P7 — Monetization → `07-monetization.md` — **CHECKPOINT (money phase)**

**Counsel framing (persona mode):** Lead **Marie Forleo** (offer alignment, "sell with
integrity," monetization that serves the audience) · Support **Justin Welsh** (pricing
clarity, a content-to-offer path a solo operator can actually run).

**Reads from:** `06-posts.md` (APPROVED — re-read from disk, post-checkpoint) +
`02-audience.md` (for the laddered wounds — what people are actually buying relief from).

**(H6) DIRECTLY read the OO offer stack / pricing / avatar pain — not transitively via
P1.** Open the `oo_prop_sources` artifact itself and pull the offer stack, pricing
tiers, and avatar-pain language **DIRECTLY** from that source file — do not reuse the
"Monetization Overview" sketch written into `01-strategy.md`, which was a directional
placeholder, not the source of truth. Reading DIRECTLY here is what keeps prices and
offers from drifting across the pipeline. If `oo_prop_status: skipped`, state that
explicitly and mark every offer idea in this artifact as a clearly-labeled **option**,
not a priced commitment.

**Anchor to the existing offer; label new ideas as options.** The artifact must open by
restating the user's real, existing offer and price (from the DIRECT OO pull) before any
new monetization idea is introduced. Any new offer angle this phase generates gets an
explicit `OPTION:` label — it is never presented as if it were already validated.

**Golden Rule gate (apply before this checkpoint is shown):** for every CTA and offer
framing drafted in this artifact, run the Golden Rule check — *"If the audience saw this
funnel/ask, would they feel honored or violated?"* Revise any line that fails the check
before presenting the checkpoint.

**Adapted source prompt** (studied and adapted, not copied, from create_daniel2's
"Audience Monetization Strategy" prompt): build a monetization strategy anchored to the
existing offer (pulled DIRECTLY from OO per H6), with new ideas clearly labeled as
options.

Write `07-monetization.md`:

```markdown
# {Brand display name} — Phase 7: Audience Monetization Strategy

[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 7-monetization]

## Existing Offer (anchor — pulled DIRECTLY from OO)
{offer stack + pricing, pulled DIRECTLY from oo_prop_sources, OR "skipped" flag}

## Avatar Pain → Buying Trigger (pulled DIRECTLY from OO)
{avatar-pain language pulled DIRECTLY, mapped to the laddered wounds in 02-audience.md}

## Content Angles That Move People to Buy
{follower → buyer path, tied to the existing offer above}

## New Offer Ideas (OPTIONS — not yet validated)
- OPTION: {idea} — {why it could fit, what would need validating}
{repeat as needed; omit section entirely if no new ideas were generated}

## Golden Rule Gate
Every CTA/offer line above was checked: "honored or violated?" — {one-line confirmation
or note on what was revised}
```

**Soul-lens scope (H5):** N/A for this phase — `soul_intensity` application is scoped to
P2 and P6 only (per `references/soul-lens-rubric.md`).

**CHECKPOINT (money phase).** Present `07-monetization.md` in full, then run the
Checkpoint mechanic above. This is the last checkpoint in Stage 1 — approval here hands
off to `quality-gate.md` (Stage 2), not to another generation phase.

---

## Closing this module

After P7 is approved, print the phase-7 completion anchor and a one-line confirmation:

```
[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 7-monetization]
```

> "Stage 1 complete for {brand display name}. All 7 artifacts written and approved
> (01-strategy.md … 07-monetization.md). Handing off to the agent-mode quality gate."

Proceed to `quality-gate.md`.
