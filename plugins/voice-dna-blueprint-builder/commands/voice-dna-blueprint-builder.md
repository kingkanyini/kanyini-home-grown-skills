---
description: Interview-based Voice DNA Blueprint generator. Walks a subject through a counsel-locked question bank (5q/10q/15q), then synthesizes a transcript + blueprint MD matching the Exemplar One gold-standard format. Lean (default) or --forensics mode. Sibling to /voice-profile-build (recon-based).
---

# /voice-dna-blueprint-builder

You are running <your-name>'s canonical Voice DNA interview pipeline. The skill walks a subject through a fixed counsel-locked question bank — Quick (5q, ~15min), Detailed (10q, ~30min), or In-Depth (15q, ~60min) — designed to surface the *edges of self*. It produces two artifacts:

1. **Raw interview transcript** at `~/.claude/projects/[slug]-recon/interview-answers.md` (drop-in compatible with `/voice-profile-build` recon corpus)
2. **Voice DNA Blueprint MD** at `~/.claude/references/voice-profiles/[slug]/[slug]-blueprint.md` (matches Exemplar One gold-standard structure)

**Modes:**
- **Lean (default):** Phase 3 synthesis runs as a single orchestrator pass. Phase 4 review runs in agent mode (Bartlett / Ferriss / Watkins).
- **Forensics (`--forensics` flag):** Phase 3 dispatches Counsel #39 in agent mode (Stefan Georgi / Kyle Milligan / Gary Bencivenga / Gary Halbert) — 4 parallel reports merged into the blueprint. Phase 4 still runs after. ~7× cost; use only for high-stakes ghostwriting / paid traffic / sales letter authorship.

**Voice UX (`--voice` flag):** Optional — uses `/voicemode` for spoken interview. Falls back to text if voicemode services are down.

**Cadence:** Text UX defaults to batches of 3 questions per `AskUserQuestion` call (faster than 1-at-a-time). Voice UX stays sequential. Forced batch breaks at In-Depth Q11 and Q14 so locked SPEC §14 anchors fire correctly. Subject can request 1-at-a-time at any time — drop batch size to 1 for the remainder. Do NOT offer 1-at-a-time proactively (<your-name>'s default is batch-3).

**Reference files (read on-demand during the run):**
- `reference/quick.md` — Quick bank (5q, locked at 9.12/10)
- `reference/detailed.md` — Detailed bank (10q, locked at 9.10/10)
- `reference/in-depth.md` — In-Depth bank (15q, locked at 9.03/10)
- `reference/blueprint-template.md` — 12-section output skeleton
- `reference/counsel-prompts.md` — Phase 3 Forensics + Phase 4 review agent prompts
- `reference/ai-ism-patterns.md` — Phase 2 probe trigger patterns

**Always read in Phase 3:** `~/.claude/references/voice-profiles/exemplar-one/exemplar-one-blueprint.md` — structural fidelity target.

---

## Phase 0: Dashboard

Glob `~/.claude/references/voice-profiles/*/*-blueprint.md` to enumerate existing blueprints.

Render an ASCII dashboard:

```
╔════════════════════════════════════════════════════════════════╗
║  VOICE DNA BLUEPRINT LIBRARY                                   ║
╠════════════════════════════════════════════════════════════════╣
║  [name-slug]  | [date created]  | [tier: Q/D/I]                ║
║  ...                                                           ║
╚════════════════════════════════════════════════════════════════╝
```

If no blueprints exist yet, skip the dashboard and proceed directly to Phase 1.

Then `AskUserQuestion`:

| Option | Description |
|---|---|
| New blueprint (Recommended) | Start a fresh interview + build |
| Update existing | Pick a slug, re-run synthesis with new interview data |
| View existing blueprint | Read one into context for review |

If "View" chosen: Read the selected file and render it inline. End the session there.

If "Update" chosen: Confirm the slug, then resume at Phase 1 with the existing slug pre-filled. The new transcript appends to `interview-answers.md` with a `## Second Pass — [date]` divider.

If "New blueprint" chosen: proceed to Phase 1.

---

## Phase 1: Subject Intake

Collect inputs via a single `AskUserQuestion` call (4 questions max per call — split if needed). All RPG framing goes in the message text ABOVE the AskUserQuestion call per <your-name>'s global rule.

**Question 1 — Subject name (free text via AskUserQuestion "Other"):**

Frame: "Who are we building a Voice DNA Blueprint for today?"
Capture the full name. Convert to kebab-case slug (lowercase, spaces → hyphens, strip punctuation). Example: "Exemplar One" → `exemplar-one`.

If the slug collides with an existing folder at `~/.claude/references/voice-profiles/[slug]/`: append `-2` (or `-3`, etc.) and confirm with the user.

**Question 2 — Domain (4 options):**

- Coach
- Founder
- Healer
- Artist

("Other" is auto-provided by AskUserQuestion — no need to list explicitly.)

Domain only informs counsel-mode framing — the question bank is domain-agnostic.

**Question 3 — Depth tier (3 options):**

- Quick — 5 questions, ~15 min (Recommended for first-pass intake)
- Detailed — 10 questions, ~30 min
- In-Depth — 15 questions, ~60 min (for ghostwriting / sales letter rigor)

**Question 4 — Mode (single combined question, 2 options):**

- Lean (Recommended, default) — single-orchestrator synthesis, agent-mode Phase 4 review
- Forensics (`--forensics`) — Counsel #39 4-agent synthesis + agent-mode Phase 4 review (~7× cost)

**Then a second AskUserQuestion call for UX:**

- Text (Recommended, default)
- Voice (uses `/voicemode`)

If user chose Voice: test `/voicemode` service status. If down: notify user, fall back to text. Do not block.

**Confirmation step:** Render a summary to the user:

```
╔════════════════════════════════════════════════════════════════╗
║  INTERVIEW SETUP                                               ║
╠════════════════════════════════════════════════════════════════╣
║  Subject:    [Full Name]                                       ║
║  Slug:       [slug]                                            ║
║  Domain:     [Coach/Founder/Healer/Artist/Other]               ║
║  Tier:       [Quick / Detailed / In-Depth] ([Nq, ~Nmin])       ║
║  Mode:       [Lean / Forensics]                                ║
║  UX:         [Text / Voice]                                    ║
╚════════════════════════════════════════════════════════════════╝
```

Then `AskUserQuestion`: Start interview / Edit setup / Cancel.

---

## Phase 1.5: Charisma Code Check

Test for `~/.claude/references/voice-profiles/[slug]/[slug]-charisma-code.md`.

**If present:** Read its contents. Store the Energetic + Trust + Authority composite for embedding in Section 1 of the blueprint during Phase 3. Continue silently to Phase 2.

**If missing:** `AskUserQuestion`:

- Run `/charisma-codes` first (Recommended) — exits this skill, runs Charisma Codes, then user re-invokes `/voice-dna-blueprint-builder`
- Continue with placeholder — Section 1 of blueprint will say *"Charisma Code not yet generated. Run /charisma-codes to complete this section."*
- Skip Charisma Code section entirely — Section 1 omitted from blueprint

Whichever path: proceed to Phase 2.

---

## Phase 2: Interview

**Step 2a — Load the canonical bank by tier:**

- Quick: Read `reference/quick.md`
- Detailed: Read `reference/detailed.md`
- In-Depth: Read `reference/in-depth.md`

**Step 2b — Create the transcript file:**

Create directory if needed: `~/.claude/projects/[slug]-recon/`
Initialize transcript file at `~/.claude/projects/[slug]-recon/interview-answers.md` with this header:

```markdown
# Interview Transcript — [Full Name]

**Date:** [YYYY-MM-DD]
**Tier:** [Quick / Detailed / In-Depth]
**Mode:** [Lean / Forensics]
**UX:** [Text / Voice]
**Operator:** [self / interviewer name — ask if <your-name> is interviewing someone else]
**Subject:** [Full Name]

---
```

**Step 2c — Read the Conversational Contract verbatim from the loaded bank file:**

Each bank file has a `### Conversational Contract (read verbatim before Q1)` block. Render its quote text to the user EXACTLY — do not paraphrase, do not summarize. This is a Deibel/Evanhoe locked element from SPEC §14.

**Step 2d — If In-Depth tier: read the Tier Scaffold Line verbatim:**

In-Depth bank includes a Tannen Tier Scaffold Line that frames the chronological arc. Render verbatim after the Conversational Contract.

**Step 2e — Wait for "ready" signal:**

`AskUserQuestion`:
- Ready to begin (Recommended)
- Need a minute
- Cancel interview

If "Need a minute": pause. User can resume by typing anything.

**Step 2f — Question loop (batched cadence, 3 per round default):**

**Step 2f.0 — Batch contract (read once before the loop fires):**

- **Default cadence:** up to 3 Qs per `AskUserQuestion` call. Voice UX: stays sequential (1 Q at a time).
- **Forced batch breaks at In-Depth Q11 and Q14.** The locked SPEC §14 anchors (`[INTERVIEWER MODE: capture, don't comfort]` for Q11; `[CAPTURE ONLY. No reflection phrases.]` for Q14/Q15) must render as system text in the message ABOVE the `AskUserQuestion` call — NEVER inside a user-facing question card. Batching Q11 with Q10 would neutralize the re-anchor (it must fire AFTER Q10's answer is captured, not alongside it). Q14+Q15 batch together under their shared CAPTURE ONLY anchor.
- **Empty/cancelled answer rule:** if a Q in the batch returns empty string or null (modal dismissed, no text typed in Other), re-prompt that single Q ONCE as a follow-up `AskUserQuestion` before advancing. If the re-prompt also returns empty, stub as `[Skipped — no response]` and continue.
- **Probe cap:** max 2 probes per batch. If all 3 Qs in a batch triggered, dispatch probes for the 2 shallowest only; the 3rd is recorded internally but not surfaced to the subject.
- **Mid-batch End-interview rule:** if "End interview here" is selected on any Q in the batch, append that Q's answer (if typed), DISCARD answers for any later Qs in the same batch, then skip to Step 2g.
- **Pause-after-batch:** every per-Q option set in a batched `AskUserQuestion` includes a `Pause after this batch` option (alongside `Skip this question` and `End interview here`). If Pause is selected on any Q, complete capture of the current batch fully, save session note + offer `/savepoint`, end session. Resume picks up at the next batch.
- **Transcript format:** UNCHANGED from 1-at-a-time runs. Append in batch order; probes nest under their originating Q heading; no batch-boundary markers in the transcript. Phase 3 sees identical structure.
- **Step 2c (Conversational Contract) and Step 2d (Tier Scaffold Line):** fire ONCE before Q1. Batching does not touch them.
- **Escape hatch:** if the subject explicitly asks "one at a time" or similar, drop batch size to 1 for the remainder. Do NOT offer this option proactively — <your-name>'s default is batch-3.

**Batch math by tier:**

- **Quick (5q):** 2 batches → `[Q1-Q3]`, `[Q4-Q5]`
- **Detailed (10q):** 4 batches → `[Q1-Q3]`, `[Q4-Q6]`, `[Q7-Q9]`, `[Q10]`
- **In-Depth (15q):** 6 batches → `[Q1-Q3]`, `[Q4-Q6]`, `[Q7-Q9]`, `[Q10]`, `[Q11-Q13]`, `[Q14-Q15]`

**For each batch:**

1. **Compose the batch prompt:**
   - Render the Runtime Wrapper ONCE in message text above the `AskUserQuestion` call: `> Take your time with each — there's no word limit. List as many as come up.`
   - **If this batch is `[Q11-Q13]` (In-Depth only):** render the locked re-anchor `[INTERVIEWER MODE: capture, don't comfort]` in the message text above the `AskUserQuestion` call (system-level instruction — never inside a question card).
   - **If this batch is `[Q14-Q15]` (In-Depth only):** render the locked anchor `[CAPTURE ONLY. No reflection phrases.]` in the message text above the `AskUserQuestion` call.
   - For each Q in the batch, use the question text VERBATIM from the bank file (do NOT rephrase).

2. **Capture the batch:**
   - **Text UX:** ONE `AskUserQuestion` call containing the Qs in this batch (1–3 questions). Each Q's option set: `Skip this question` / `End interview here` / `Pause after this batch`. User selects "Other" to type the answer.
   - **Voice UX:** invoke `/voicemode` for each Q in the batch sequentially (voice doesn't batch — speak, listen, next). If the user signals stop, drop batch size to 1 for the remainder.

3. **Append each captured answer to the transcript file** (use Edit tool, one block per Q in batch order):

```markdown
## Q[N]: [Question text verbatim from bank]

[Answer text verbatim]

---
```

   - Stub rules: `[Skipped]` if user explicitly selected `Skip this question`. `[Skipped — no response]` if empty after the re-prompt (per 2f.0 empty rule).
   - If `End interview here` selected on Q[N]: append Q[N]'s answer (if typed), DISCARD later-Q answers in same batch, skip to Step 2g.

4. **Shallow-answer probe check (loop per non-skipped Q in batch):**
   - Compute answer length per Q. Threshold: text mode < 30 chars, voice mode < 60 chars.
   - Scan each answer against patterns in `reference/ai-ism-patterns.md` (case-insensitive substring match).
   - Collect the set of Qs that triggered. Apply probe cap from 2f.0 (max 2 per batch — keep the 2 shallowest if 3 triggered).

5. **Probe phrasing & dispatch:**
   - 0 triggered → skip to step 6.
   - 1+ triggered → ONE batched `AskUserQuestion` call, one probe-question per triggered Q:
     - **Existential Qs (In-Depth Q3 "couldn't-keep-living" + In-Depth Q15 "worries-made-peace"):** `Anything else surface there on Q[N]?`
     - **Other Qs:** `Want to add a layer to Q[N]?`
   - Each probe non-blocking. Options: `Yes` (Recommended) / `No, move on`. User selects "Other" to type additional content. Append any addition under the same Q heading in the transcript.

6. **Move to the next batch.** If the user selected `Pause after this batch` on any Q during step 2 of the just-completed batch: save session note + offer `/savepoint`, end session here (resume picks up at the next batch on re-invocation).

**End of loop:** when the last batch is fully captured (and any probes processed), proceed to Step 2g.

**Step 2g — End-of-interview save confirmation:**

Once all questions are answered, render:

```
╔════════════════════════════════════════════════════════════════╗
║  INTERVIEW COMPLETE                                            ║
╠════════════════════════════════════════════════════════════════╣
║  Tier:      [Q/D/I]  ([N] questions answered)                  ║
║  Transcript: ~/.claude/projects/[slug]-recon/interview-answers.md ║
║  Probes triggered:  [N]                                        ║
║  Total time:  ~[N] min                                         ║
╚════════════════════════════════════════════════════════════════╝
```

Then `AskUserQuestion`: Proceed to synthesis (Recommended) / Pause here, resume later / View transcript first.

If "Pause": save session note + offer `/savepoint`. End session.
If "View transcript": render inline, then ask again.
If "Proceed": continue to Phase 3.

---

## Phase 3: Synthesis

**Always read first:**
- `~/.claude/references/voice-profiles/exemplar-one/exemplar-one-blueprint.md` (gold-standard reference)
- `reference/blueprint-template.md` (structural skeleton)
- The transcript at `~/.claude/projects/[slug]-recon/interview-answers.md`
- The Charisma Code MD if present (per Phase 1.5 outcome)

**Anti-Lost-in-Middle pre-step (locked per SPEC §14):**

Before generating the blueprint, render a two-column "Q + verbatim answer" table from the transcript to the orchestrator's context. This forces every question into recent attention. Format:

```
| Q# | Question | Verbatim Answer (key excerpt) |
|----|----------|-------------------------------|
| 1  | [text]   | [first 200 chars of answer]   |
| 2  | ...      | ...                           |
```

Then branch on mode.

---

### Mode: Lean (default)

Single orchestrator pass.

1. Read all inputs above.
2. Fill the blueprint template section by section.
3. Section-by-section rules:
   - **Section 1 (Charisma Code):** Insert verbatim if file exists; otherwise insert the placeholder block from the template.
   - **Section 2 (Character Intake Card):** Pull from ORIGIN + TENSION + PILLARS answers. Quote verbatim where possible.
   - **Section 3 (Pillars):** Pull from PILLARS category answers. 3-5 pillars only.
   - **Section 4 (Email Writing Style):** Use LANGUAGE + CONNECTION patterns. Recurring Phrases sub-section requires verbatim quotes from the transcript — never paraphrase.
   - **Sections 5-9 (email mechanics):** If subject is not an email-sender, insert the NA fallback from the template — do not fabricate.
   - **Section 10 (Key Takeaways for Replication):** 5-8 numbered directives. Each must be traceable to a specific transcript answer.

4. Save the draft (do NOT write to the final destination yet — that happens in Phase 6).
   Hold the draft in orchestrator context for Phase 4.

---

### Mode: Forensics (`--forensics`)

Dispatch Counsel #39 in AGENT MODE — 4 parallel `Task` subagents.

1. Read `reference/counsel-prompts.md` → Phase 3 section → 4 agent prompts.
2. For each of the 4 agents (Stefan Georgi / Kyle Milligan / Gary Bencivenga / Gary Halbert): dispatch a `Task` with the agent prompt, the subject slug, and the file paths to transcript / gold standard / template / Charisma Code.
3. **Run all 4 in parallel** (single message with 4 Task tool calls — <your-name>'s standard agent dispatch pattern).
4. Wait for all 4 reports to return.
5. **Merge per the orchestrator instructions** in `reference/counsel-prompts.md`:
   - Cross-reference agent agreement → load-bearing patterns.
   - Surface disagreements in a `## Disagreements` callout at the end of the blueprint.
   - Map agent → blueprint section per the merge table in counsel-prompts.md.
6. Build the draft blueprint by filling the template using merged agent outputs.
7. Hold the draft in orchestrator context for Phase 4.

---

**End of Phase 3 — draft blueprint exists in orchestrator context, not yet written to disk.**

---

## Phase 4: Counsel Review (voice authenticity gate)

> **Always runs** — in both Lean mode and Forensics mode. Per locked decision #2 (SPEC §13), Forensics does NOT skip Phase 4.

Dispatch 3 review agents in parallel via `Task` (single message, 3 tool calls):

- Agent E: Steven Bartlett (artifact + scene fidelity)
- Agent F: Tim Ferriss (specificity + magic-word preservation)
- Agent G: Brendon Watkins (chronological + spiritual depth)

Agent prompts live in `reference/counsel-prompts.md` → Phase 4 section.

**Pass the draft blueprint to each agent** by writing it to a temp file first:
- Write: `~/.claude/projects/[slug]-recon/draft-blueprint.md`
- Reference that path in each Task prompt.

**Each agent returns:**
- Score (1-10)
- What lands (one specific quote)
- What's weak (one specific weakness)
- Edit suggestion (concrete before/after)
- AI-ism scan results (zero tolerance per <your-name>'s global ban list)

**Orchestrator gate logic:**

1. Compute the average score across all 3 reviewers.
2. Compile any AI-isms flagged.
3. Decision tree:
   - **avg ≥ 9.0 AND no AI-isms flagged** → PASS. Render a brief summary to the user (scores + one-line per agent) and proceed to Phase 5.
   - **avg < 9.0 OR any AI-ism flagged** → Surface all 3 reviews inline AND the AI-ism list. `AskUserQuestion`:
     - **Regenerate blueprint** — re-run Phase 3 with the 3 reviews appended as additional context
     - **Edit section-by-section** — orchestrator applies each agent's edit suggestion sequentially, showing diff before each apply
     - **Ship as-is (override gate)** — log the override to the session note, proceed to Phase 5

**Important: never silently apply edits.** The user sees all 3 reviews before any change.

---

## Phase 5: User Approval — THE Final Ship Gate

> Per <your-name>'s vault principle `principles/read-through-as-final-ship-gate`: foreman/counsel score is NOT the ship gate. **User read-through IS the ship gate.** Counsel reviews audit their own rules; only <your-name> catches issues outside their scope (offer architecture, audience fit, strategic framing).

**Step 5a — Render the FULL blueprint inline.** Not a summary. Not an excerpt. The complete artifact, top to bottom, as it will be saved.

**Step 5b — `AskUserQuestion`:**

| Option | Description |
|---|---|
| Approve and save (Recommended) | Write to final destination, proceed to Phase 6 |
| Regenerate a section | Pick a section (1-10); orchestrator regenerates only that section |
| Edit a section inline | Pick a section; orchestrator opens an Edit cycle for that section's content |
| Cancel | Discard the draft. Transcript remains saved. Session ends. |

**Step 5c — Iterate until Approve or Cancel.**

If "Regenerate a section": ask which section (1-10), re-run that section's synthesis using the transcript + agent reviews, render the new section inline, return to 5b.

If "Edit a section inline": ask which section, then capture user's edits via free-text (`AskUserQuestion` with Other), apply edits, render the updated section, return to 5b.

If "Approve and save": proceed to Phase 6.

If "Cancel": delete the draft-blueprint.md temp file, save the transcript only, end session.

---

## Phase 6: Save + Handoff

**Step 6a — Create the per-person folder if missing:**

```bash
mkdir -p ~/.claude/references/voice-profiles/[slug]/
```

**Step 6b — Write the blueprint:**

Save the approved blueprint to `~/.claude/references/voice-profiles/[slug]/[slug]-blueprint.md`.

If a blueprint already exists at that path (Update flow from Phase 0):
- Rename the existing file to `[slug]-blueprint.v[N].md` where N is the next available integer.
- Write the new blueprint at the canonical path.
- Log the previous-version path in the session note.

**Step 6c — Delete the temp draft:**

Remove `~/.claude/projects/[slug]-recon/draft-blueprint.md` (it's now persisted at the canonical path).

**Step 6d — Confirm transcript saved:**

Confirm `~/.claude/projects/[slug]-recon/interview-answers.md` exists and is non-empty. Do NOT delete it — it's the corpus source for `/voice-profile-build` handoff.

**Step 6e — Render success summary:**

```
╔════════════════════════════════════════════════════════════════╗
║  VOICE DNA BLUEPRINT SAVED                                     ║
╠════════════════════════════════════════════════════════════════╣
║  Blueprint:  ~/.claude/references/voice-profiles/[slug]/       ║
║              [slug]-blueprint.md                               ║
║  Transcript: ~/.claude/projects/[slug]-recon/                  ║
║              interview-answers.md                              ║
║  Mode:       [Lean / Forensics]                                ║
║  Counsel:    [avg score]/10  ([N] AI-isms flagged: [Y/N])      ║
║  Time:       ~[N] min total                                    ║
╚════════════════════════════════════════════════════════════════╝
```

**Step 6f — Offer handoffs via AskUserQuestion (multi-select):**

| Option | Description |
|---|---|
| Run /voice-profile-build (recon enrichment) | Build the recon-based voice profile to pair with this blueprint |
| Run /charisma-codes (if skipped earlier) | Generate the Charisma Code now and embed in Section 1 |
| Register in CLAUDE.md voice-profiles index | Add this person to the voice-profiles tracking section (if such a section exists) |
| Done — end session | No further action |

Whichever handoffs the user picks, kick them off (or note them as next-step recommendations) and end the skill.

---

**End of /voice-dna-blueprint-builder.**
