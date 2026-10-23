# Quality Gate — Stage 2 (Agent Mode + Counsel XP)

## When this module loads

`phases-1-7.md` hands off here immediately after P7 (`07-monetization.md`) is approved
and its completion anchor is printed. This module is the **Stage 2 Quality Gate**: it
takes the 7 raw Stage 1 artifacts, runs them through agent-mode counsel review, presents
the synthesized result for the user's read-through, and hands an APPROVED artifact set to
`assembly.md` (Stage 3).

Reprint the state anchor at the top of this module's first response, and again before
each dispatch round:

```
[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 8-quality-gate]
```

### Inputs consumed

| Variable | Source |
|---|---|
| `01-strategy.md` … `07-monetization.md` | `phases-1-7.md` (all 7, APPROVED, read fresh from disk) |
| `references/counsel-mapping.md` Table 3 + roster | dispatch order, slugs, branch-voice assignment |
| `references/hook-bank.md` | Brock Johnson's thumb-stop-test review pass on P6 |
| `references/soul-lens-rubric.md` | Vex King's soul-lens calibration review pass on P2/P6 |
| `references/compliance-detect.md`, `regulated_flag` | Security branch's compliance/claims-safety review |
| `architect_posting_capacity` | Architect branch's cadence-buildability review |

### Outputs produced

| Output | Path |
|---|---|
| `counsel-gate-notes.md` | `~/.claude/projects/{active_brand_slug}-social-engine/counsel-gate-notes.md` — INTERNAL, never exported (H3) |
| Revised `0N-*.md` artifacts (if any revision cycle ran) | same project folder, overwritten in place |
| 8 counsel XP log entries | via `log-counsel-xp.js` when installed, fire-and-forget (see Step 5) |

---

## Two layers of `BLOCKER?: yes` — do not conflate them

`BLOCKER?: yes` is used at **two distinct enforcement points** in this skill. They look
the same on the page but they are not the same gate:

1. **P6 pre-checkpoint thumb-stop fail** (inside `phases-1-7.md`) — a post fails the
   thumb-stop test *while still being drafted*, before the human ever sees it. It is
   caught and rewritten in-line, inside Stage 1, before the P6 checkpoint is even
   presented. By the time a human reads `06-posts.md`, this layer should already read
   `BLOCKER?: no` on every post — the brief is explicit that a FAIL never publishes
   forward.
2. **This module's post-agent-review gate** (Stage 2) — a *separate* enforcement point,
   downstream of Stage 1 entirely. Here, 8 independent agent-mode reviewers (5 #58 +
   3 Triple Threat branches) each read the **already-approved** 7 artifacts fresh and
   render their own verdict. A `BLOCKER?: yes` here can fire for reasons the Stage 1
   author never had visibility into — cross-artifact incoherence, a compliance gap that
   only shows up once all 7 artifacts are read together, an offer/positioning mismatch
   between P3 and P7, etc. This is the gate that actually blocks Stage 3 assembly.

Read `counsel-gate-notes.md`'s BLOCKER lines as **Stage 2 verdicts only**. If a P6 post
somehow still carries a Stage 1 `BLOCKER?: yes` when this module reads `06-posts.md`,
treat that as a Stage 1 contract violation — flag it to the user before dispatching
reviewers, don't silently fold it into the Stage 2 count.

---

## Step 1 — Content review (agent mode)

Dispatch the **5 Conscious Content Counsel #58 members** as independent parallel agents.
Each agent gets its own context window — no awareness of the other 4 until synthesis.
This is agent mode (not persona mode) because Stage 2 is a fidelity gate over shipped
artifacts, per `references/counsel-mapping.md` Table 3.

**Dispatch all 5 in a single message** (multiple `Agent` tool calls, one per member) so
they run concurrently:

| Agent | Slug | Stage 2 review specialty |
|---|---|---|
| Justin Welsh | `justin-welsh` | Strategy coherence, lean content system, authority angle |
| Jasmine Star | `jasmine-star` | Calendar density, batching plan, system repeatability |
| Brock Johnson | `brock-johnson` | Hook craft, format variety, **thumb-stop test (H7) — P6 veto** |
| Vex King | `vex-king` | Emotional resonance, soul-lens calibration, depth vs. surface |
| Marie Forleo | `marie-forleo` | Offer alignment, monetization ethics, Golden Rule check |

**Agent prompt template** (fill in `{member}`, `{specialty}`, `{artifact paths}` — pass
the actual file contents or paths to read with the `Read` tool):

> You are reviewing in the voice and specialty of **{member}** (stat sheet: `{stat_sheet_path}` — the orchestrator fills this with the first that exists of
> the user's vault `counsel/members/{slug}.md` or `~/.claude/references/counsel/members/{slug}.md`,
> else `none`. Read it directly as a normal filesystem path, NOT via MCP. If `none` or unreadable,
> review from the member's public body of work and say no stat sheet was loaded). This is an
> **agent-mode fidelity review** of 7 shipped social-media strategy artifacts for
> `{brand display name}` — read all 7 directly from
> `~/.claude/projects/{active_brand_slug}-social-engine/` (`01-strategy.md` through
> `07-monetization.md`) before reviewing.
>
> Your specialty lens for this review: **{specialty}**.
>
> For EACH of the 7 artifacts (or the subset your specialty actually touches — say which
> you skipped and why), provide:
> - **Score (1-10)**
> - **What lands** — a specific quote or technique that works
> - **What's weak** — a specific weakness
> - **Edit suggestion** — a concrete line-level change
>
> {If member == Brock Johnson, add:} Additionally, run the **thumb-stop test** from
> `references/hook-bank.md` against every post in `06-posts.md` independently of whatever
> `Thumb-stop check:` value is already written on the post. *"Would the first
> line/frame stop YOUR thumb? If not, rewrite."* This is a **veto, not advisory** — if
> any post fails under your independent read, your line-edit MUST supply the rewritten
> hook, and your final BLOCKER line below MUST be `yes`.
>
> **Hook = 50% of your score.** The hook is the single dominant dimension — weight it at
> half of your 1-10, matching the mechanical virality grader
> (soulcial-posts-v2's `references/virality-grader.md` when installed, hook=50%). A
> strong body never buys back a weak hook. This keeps the hook from being averaged away
> across the 8-voice panel.
>
> End your review with exactly one line, last, on its own:
> `BLOCKER?: yes` or `BLOCKER?: no` — `yes` means at least one artifact must not ship to
> Stage 3 assembly as currently written.

---

## Step 2 — Structural/compliance review (agent mode)

Dispatch **Triple Threat's 3 branch-voices** as a second wave of independent parallel
agents (can run concurrently with Step 1, or immediately after — either way, dispatch
all 3 branches together in one message). Per `references/counsel-mapping.md`, Triple
Threat speaks as 3 distinct branch-voices here, not as all 14 individuals seated under
counsel #30.

| Branch | Persona / slug | Stage 2 review focus |
|---|---|---|
| 🎯 PM | Marty Cagan — `marty-cagan` | System coherence: do the 7 artifacts actually point at the same business outcome end-to-end (P1 strategy → P7 monetization)? |
| 🏛️ Architect | Greg Hogg — `greg-hogg` | Cadence buildability: is `05-calendar.md`'s density genuinely sustainable at `architect_posting_capacity`, or does it quietly drift back to "post daily"? |
| 🛡️ Security | Troy Hunt — `troy-hunt` | Compliance/claims safety: re-run the regulated-claims check from `references/compliance-detect.md` against the actual drafted copy (not just the niche flag) — does any post/caption make a claim the compliance block doesn't cover? |

**Agent prompt template** (same shape as Step 1, specialty-scoped to the branch):

> You are reviewing as the **{branch}** voice of Triple Threat (persona: **{persona}**,
> slug `{slug}`). This is an agent-mode fidelity review of the same 7 artifacts at
> `~/.claude/projects/{active_brand_slug}-social-engine/` — read all 7 directly before
> reviewing. Your lens: **{focus}**.
>
> Provide a **Score (1-10)**, **what lands**, **what's weak**, and a **concrete
> line/structural edit** for system coherence (PM) / cadence buildability (Architect) /
> compliance safety (Security) across the artifact set.
>
> {If Security:} Cross-check against `regulated_flag` and
> `references/compliance-detect.md` directly — if `regulated_flag` is true and any
> drafted post/caption in `06-posts.md` or `05-calendar.md` makes a claim the
> compliance block doesn't cover, that is an automatic `BLOCKER?: yes`, not a scoring
> deduction.
>
> End with exactly one line, last, on its own:
> `BLOCKER?: yes` or `BLOCKER?: no`.

---

## Step 3 — Synthesize, present, read-through gate

1. **Collect all 8 reviews** (5 content + 3 structural/compliance). Every one of the 8
   must carry a `BLOCKER?: yes/no` line — if an agent's response is missing it, treat
   that as a malformed review and re-dispatch that single agent before proceeding. The
   gate cannot read a missing line as `no`.
2. **Synthesize** the strongest notes from all 8 into a single revision pass per
   artifact — integrate genuine convergent feedback, and where reviewers disagree,
   surface the disagreement rather than silently picking a side (per
   `dissent-integration-synthesis`).
3. **Apply revisions** to the affected `0N-*.md` artifact(s) on disk.
4. **Present the revised artifacts inline** (full text of anything that changed, not a
   summary) for the user's **read-through approval**. The read-through is the ship gate —
   not the average score, not "most reviewers liked it." A high average score with one
   live `BLOCKER?: yes` still fails the gate (see Step 5).
5. Use `AskUserQuestion`:
   - **Approve & continue (Recommended)** — artifacts lock as revised; proceed to
     `assembly.md`.
   - **Revise — give feedback** — free-text via "Other"; apply the user's specific
     feedback as a second pass on the named artifact(s) only, then re-present.
   - **Pause here for now** — stop; `counsel-gate-notes.md` and the artifacts as they
     stand remain on disk for resume.

---

## Step 4 — Pass-bar (H12) — non-vacuous

**A "pass" = read-through approval AND zero unresolved `BLOCKER?: yes` lines in
`counsel-gate-notes.md`.** Both conditions are required; neither alone is sufficient.

- The bar **cannot pass vacuously**. Every one of the 8 dispatched reviewers must emit
  an explicit `BLOCKER?: yes/no` line (per Step 3.1) — a gate that "passes" because a
  reviewer's verdict was silently dropped or never asked for is not a pass, it's a gap.
- **Any single `BLOCKER?: yes`** — from any of the 8, on any artifact — forces **one
  mandatory revision cycle** on that specific artifact before it can be re-presented.
  This includes Brock's thumb-stop veto on P6 and Security's compliance veto on
  P6/05-calendar — those are vetoes with teeth, not advisory notes folded into the
  average score.
- **Revision cycle:** revise the flagged artifact only (don't re-touch artifacts with no
  open BLOCKER), re-run the read-through with the fix highlighted, and resolve the
  BLOCKER line in `counsel-gate-notes.md` to `resolved` with a one-line note on what
  changed. Do not delete or overwrite the original `BLOCKER?: yes` line — append the
  resolution, so the gate notes stay an honest trail.
- Only after **all 8 BLOCKER lines read `no` or `resolved`** AND the user has approved
  the read-through does this module hand off to `assembly.md`.

---

## Step 5 — XP logging (fire-and-forget, never blocks)

**Guard:** run this step only if `~/.claude/scripts/log-counsel-xp.js` exists. If the helper is not installed, skip Step 5 entirely and silently (no failure notes, no confirmation line), per the command file FALLBACKS table.

XP logging happens **AFTER** all agents (Step 1 + Step 2) have finished and synthesis
(Step 3) is underway or complete — never mid-dispatch.

1. **Generate one synthetic session-UUID for the whole review round** (shared by all 8
   log entries — one round, one UUID):

   ```bash
   node -e "console.log(require('crypto').randomUUID())"
   ```

2. For each of the 8 credited members, call the helper with its **real CLI signature**
   — this is the ONLY emission path; never inline-append a JSONL line yourself:

   ```bash
   node ~/.claude/scripts/log-counsel-xp.js \
     --slug <member-slug> \
     --session <UUID> \
     --topic-tag soulcial-media-engine \
     --project "<one-line project/brand description>" \
     --synopsis "<one-line synopsis of this member's Stage 2 review>"
   ```

   The 8 slugs for this round: `justin-welsh`, `jasmine-star`, `brock-johnson`,
   `vex-king`, `marie-forleo`, `marty-cagan`, `greg-hogg`, `troy-hunt`.

3. **Fire-and-forget, never blocks:** run each call, but a logging failure (non-zero
   exit, malformed output, helper error) is surfaced as a quiet note and the review
   proceeds regardless — XP logging never corrupts or blocks the gate. Do not retry in a
   loop; one attempt per member per round is enough.
4. **Close with a confirmation line** naming the credited members, e.g.:

   > "Counsel XP logged for: Justin Welsh, Jasmine Star, Brock Johnson, Vex King, Marie
   > Forleo, Marty Cagan (PM), Greg Hogg (Architect), Troy Hunt (Security)."

   If any individual log call failed, name which member's entry didn't land instead of
   silently omitting them from the confirmation.

---

## Writing `counsel-gate-notes.md`

Write (or append, on a revision cycle) to
`~/.claude/projects/{active_brand_slug}-social-engine/counsel-gate-notes.md`. This file
is **INTERNAL — never exported** (H3); it carries real counsel names/slugs and is
stripped before any `/quickshare` bundle.

```markdown
# {Brand display name} — Stage 2 Quality Gate Notes

[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 8-quality-gate]

## Content Review (agent mode — Conscious Content Counsel #58)

### Justin Welsh — Strategy coherence / lean system / authority angle
Score: {N}/10
What lands: {...}
What's weak: {...}
Edit suggestion: {...}
BLOCKER?: {yes/no}

### Jasmine Star — Calendar density / batching / repeatability
{...same shape...}
BLOCKER?: {yes/no}

### Brock Johnson — Hook craft / format variety / thumb-stop veto (H7)
{...same shape, plus independent thumb-stop verdict per post in 06-posts.md...}
BLOCKER?: {yes/no}

### Vex King — Emotional resonance / soul-lens calibration
{...same shape...}
BLOCKER?: {yes/no}

### Marie Forleo — Offer alignment / monetization ethics / Golden Rule
{...same shape...}
BLOCKER?: {yes/no}

## Structural/Compliance Review (agent mode — Triple Threat branch-voices)

### PM (Marty Cagan) — System coherence
Score: {N}/10
What lands / what's weak / edit suggestion: {...}
BLOCKER?: {yes/no}

### Architect (Greg Hogg) — Cadence buildability
{...same shape...}
BLOCKER?: {yes/no}

### Security (Troy Hunt) — Compliance/claims safety
{...same shape...}
BLOCKER?: {yes/no}

## Synthesis

{Convergent feedback integrated; disagreements surfaced explicitly, not silently
resolved one way.}

## Revision Cycle Log

{One entry per BLOCKER?: yes that fired — artifact, original BLOCKER line (kept
verbatim), what was revised, and `resolved` once fixed. Empty/omitted if no BLOCKER
fired this round.}

## Pass-Bar Status

Read-through approval: {pending / approved — date/note}
Open BLOCKER?: yes count: {N} (must be 0 to pass)
Gate status: {PASS / IN REVISION / PENDING READ-THROUGH}

## Counsel XP Logged

Session-UUID: {uuid}
Credited: {list of 8 names/slugs, or note on any that failed to log}
```

---

## Closing this module

After the gate reads PASS (zero open BLOCKER + read-through approved) and XP logging
has run, print the closing anchor and a one-line confirmation, then proceed to
`assembly.md` (Stage 3):

```
[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 8-quality-gate]
```

> "Stage 2 quality gate PASSED for {brand display name}. 8/8 reviewers cleared (zero
> open BLOCKER), read-through approved. Counsel XP logged. Handing off to assembly."

Proceed to `assembly.md`.
