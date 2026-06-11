# Webinar Section Review Pipeline

> **Purpose:** Review an already-drafted Perfect Webinar section (or any speaker-attributed long-form content) through a 4-layer agent pipeline that catches structural, voice, and AI-tell issues before delivery.
>
> **When to use:** A section has been drafted (via `/webinar-forge` or manually) and needs a quality pass before going live. Especially valuable for high-stakes paid client deliverables, multi-speaker co-presentations, and content where voice fidelity to a specific person matters.
>
> **Companion to `/webinar-forge`:** Webinar-forge *generates* scripts. This pipeline *reviews and refines* them. Run review after generation, before delivery.
>
> **Last calibrated:** 2026-05-21 (Authentic AI Systems Masterclass — Opening section template-pass)

---

## The Pipeline (4 layers)

```
DRAFTED SECTION
    ↓
Layer 1: Counsel (5 parallel agents — Perfect Webinar Counsel #36)
    ↓ [score gate: 8+/10 average to pass]
Layer 1 synthesis → revised draft v1
    ↓
Layer 2: Voice (N parallel agents — 1 per speaker)
    ↓ [score gate: 8+/10 per speaker to pass]
Layer 2 synthesis → revised draft v2
    ↓
Layer 3: AI-ism / Continuity Foreman (1 agent)
   • Category A: AI-ism hygiene (banned patterns)
   • Category B: Continuity (within-section + cross-deck + promise→delivery
                  + tease→reveal + setup→callback + bio/framework/voice)
    ↓ [score gate: 9+/10 final to ship]
FINAL CLEAN REVISION + Continuity Ledger update
```

Each layer outputs scores + line-level edits. If a layer fails the gate, revise before the next layer runs. Don't waste agent budget reviewing a draft that hasn't cleared the prior layer.

---

## Pre-Pipeline Setup (run once per project)

Before reviewing the FIRST section of a deck, lock these and capture them in a project-specific policies file (e.g., `[PROJECT]-review-pipeline-policies.md` in the project folder):

| Item | What to lock |
|---|---|
| **Counsel mode** | Agent mode (5 parallel + foreman synthesis) for high-stakes / paid client. Persona mode (1 agent voices all 5) for low-stakes drafts. |
| **Score gate** | 8+/10 per layer for paid client. 7+/10 for personal/experimental. "9+/10 = top 10% of webinars you've ever seen." |
| **Webinar posture** | Experiential-first (warmth, curiosity gaps, sales architecture in §10-11) vs Architecture-first (identity name + cap + price seeds in min 1-4). This shapes counsel disagreement resolutions. |
| **Voice profiles** | Path to each speaker's voice profile (e.g., `~/.claude/references/voice-profiles/[name]/[name]-voice.md`). |
| **Cross-deck locks** | Stat language, identity name, key callbacks, signature phrases, banned phrases. These travel across sections. |

---

## Layer 1 — Counsel (Perfect Webinar Counsel #36)

**Members** (per `~/.claude/references/counsel-registry.md` #36):
- **Marisa Murgatroyd** — Chapter 1: Dream Customer / experience design / engagement
- **Russell Brunson** — Chapter 2: Hook + Origin / Perfect Webinar architect
- **Jason Fladlien** — Chapter 3: Core Content / "King of Webinars" / teach-to-buy
- **Myron Golden** — Chapter 4: Stack + Value / transformation language
- **Daniel Priestley** — Chapter 5: Close + Urgency / Key Person of Influence

**Dispatch:** Agent mode. Spawn 5 parallel subagents via `Agent({subagent_type: "general-purpose"})`. Each gets:
- The drafted section (full text, inline in prompt)
- Their NPC role + chapter ownership
- Project context (hosts, audience, offer stack one-liner, arc mapping to outline)
- Score calibration: "9+/10 means top 10% of webinar openings you've ever seen, not just this one"
- Output format: score + opening voice (~150 words for chapter lead, 100 others) + 3 what-lands + 3 what's-weak + 3 line-level rewrites + pushback for the room

**Chapter lead:** For each section type, one counsel member is the natural lead (Russell for Hooks, Marisa for Engagement/Activation, Fladlien for Core Content, Myron for Stack, Priestley for Close). Lead's prompt gets the "you're the chapter lead, set the room" framing + ~180 words of opening voice instead of 100.

**Synthesis (orchestrator role):**
1. Aggregate scores → check 8+/10 gate
2. Identify CONSENSUS must-fixes (3+ counsel agree)
3. Surface REAL DISAGREEMENT zones (need user judgment call — often experiential vs sales-architecture tension)
4. Note what everyone LOVED (protect these in revision)
5. Present to user with structured AskUserQuestion before producing revised draft

**Sample synthesis output format:** See `~/.claude/plugins/local/webinar-forge/reference/agent-prompts.md` and the <example-brand> project's `<example-brand>-review-pipeline-policies.md` for templates.

---

## Layer 2 — Voice (per-speaker agents)

**Dispatch:** Spawn 1 subagent per distinct speaker. For a co-hosted webinar (e.g., Exemplar Two + <your-name>), that's 2 agents in parallel. Each agent:
- Loads the FULL voice profile from `~/.claude/references/voice-profiles/[speaker]/[speaker]-voice.md`
- Audits ONLY their speaker's dialogue
- Returns a voice fingerprint audit table (must-haves found vs missing, with counts)
- Returns 4-7 line-level rewrites that restore voice DNA while preserving structural intent

**Score calibration:** "9+/10 = if [their spouse / mother / closest collaborator] read this cold, they'd say 'yeah, that's [name].'" Be ruthless — the fingerprint audit catches what generic AI smoothing misses.

**Key fingerprints to verify per speaker** (each voice profile should specify):
- Signature verbal tics (e.g., Exemplar Two's "right?" ~140+ hits / "and so" ~70+ / "what I'll say is" ~15 / "really really" ~12)
- Master verbs (e.g., Exemplar Two's "embody / resource as transitive verb")
- Sentence rhythm targets (e.g., <your-name>'s 40% short / 35% medium / 25% long)
- Vocabulary cluster discipline
- Em-dash budget per profile (e.g., Exemplar Two max 1 per sentence, <your-name> max 2 inter-clause per section)
- Banned phrases specific to the speaker

---

## Layer 3 — AI-ism / Continuity Foreman

**Dispatch:** 1 agent. Comprehensive final pass on the v2 draft (post-voice layer). Foreman has TWO categories of responsibility:

- **Category A: AI-ism hygiene** (banned patterns / phrases / tells)
- **Category B: Continuity** (within-section flow + cross-deck consistency + promise→delivery + tease→reveal + setup→callback + bio/framework/voice cohesion)

**Foreman input requirements:**
- The current section draft (full text)
- The project policies file (cross-deck locks + Continuity Ledger)
- Voice profiles for each speaker (paths, not full load — foreman defers to voice agents' calls)
- <your-name>'s CLAUDE.md AI-ism ban list

---

### Category A — AI-ism audits (4)

1. **AI-ism phrase ban** — Apply <your-name>'s CLAUDE.md ban list ("here's the thing," "dive deep," "navigate" metaphorical, "leverage" verb, "unlock potential," "let's be honest," "you're not broken" cliché)
2. **Banned structural patterns** — "So,"/"Now," openers, "Remember, X" closers, "It's not just X, it's Y" formula, "Not X but Y" repeated >1x
3. **Em-dash discipline** — Per-speaker budget enforcement (parenthetical vs inter-clause classification; counts vs profile ceilings)
4. **Banned-word scan** — Hedging ("perhaps," "I think maybe"), generic motivational filler ("you've got this"), reassurance clichés

---

### Category B — Continuity audits (9)

**Within-section continuity:**
5. **Voice-handoff** — Energy, breath/pause moments, tonal whiplash between speaker transitions in this section
6. **Beat-to-beat coherence** — Does each beat hand off cleanly to the next? Any logical jumps or missing transitions?

**Cross-section continuity (against project policies file):**
7. **Number / stat consistency** — Every number in this section matches the canonical value in the policies file (e.g., "1 in 2,000," "5 Levels," "$1,997"). Flag every contradiction.
8. **Identity name + canonical language** — Single canonical identity term used (e.g., "Authentic AI Architect" — never "Builder" or "Operator"). Hermes language matches the locked phrasing where applicable.
9. **Story / bio / framework continuity** — Bio details (e.g., Princeton + shaman + 1,000 hours + Amaroo + Warrior Sanctuary) match across sections. Frameworks (V.I.S.A., 6Cs, 5 Levels) named consistently.
10. **Voice continuity per speaker across sections** — Does Exemplar Two still sound like Exemplar Two in this section as she did in the Opening? Does <your-name>'s AMAZE/STEADY/LIGHT register stay in profile? Cumulative tic budgets respected (e.g., Exemplar Two's "right?" cadence rate matches Opening).

**Promise → delivery continuity (the load-bearing arc):**
11. **Promise → delivery** — Every promise made in the Opening (or any prior section) is DELIVERED in its scheduled section. If this section IS the delivery section for a prior promise, verify it actually delivers (not just references). If this section makes NEW promises, log them in the Continuity Ledger for the next section's foreman to track.
12. **Tease → reveal** — Every "stay to the end for X" (Hermes, blind email test, secret weapon, etc.) pays off in its named section. The reveal MUST match or exceed the tease's specificity.
13. **Setup → callback** — Every callback assumes a setup was planted. Verify the setup exists in a prior section. If this section IS planting a setup for a future callback, log it in the Continuity Ledger.

**Output:** Score + scorecard table (Category A + Category B) + line-level fixes + Continuity Ledger updates (new promises/teases/setups planted by this section) + cross-deck flags for OTHER sections + FINAL CLEAN REVISION (foreman applies its own fixes inline).

---

### Continuity Ledger (lives in project policies file)

The Continuity Ledger is the foreman's working memory across sections. It's a structured list of every:
- **Promise** made → with its scheduled delivery section
- **Tease** planted → with its scheduled reveal section
- **Setup** planted → with its scheduled callback section
- **Bio / framework reference** → with its canonical definition source
- **Stat / number / identity name** → with its canonical value

After each section review, the foreman updates the Ledger with any new entries this section added. Before reviewing the next section, the foreman loads the Ledger to check what that section MUST deliver, payoff, or callback.

See <example-brand> policies file `<example-brand>-review-pipeline-policies.md` § "Continuity Ledger" for a worked example.

---

## Voice-DNA Precedence Rule (meta-rule)

**The AI-ism/Continuity Foreman does NOT load speaker-specific voice profiles.** It applies general AI-tell rules from CLAUDE.md.

**When the foreman flags a phrase that is a documented voice tic in the voice profile** (e.g., Exemplar Two's "and so" sentence-starter is one of her ~70+ corpus tics; the foreman may flag it as a "lazy opener" cousin of the banned "So," start), **the voice agent's call wins.** The voice agent has speaker-specific context the foreman lacks.

**Override protocol:**
1. Note the foreman's flag in the synthesis
2. Override with voice agent's preserved tic
3. Explain the override to the user (transparency)
4. Log the override pattern in project policies file for future foreman runs

---

## Mid-Pipeline Correction Protocol

The user may catch substantive content errors mid-pipeline (wrong framework, outdated stat, missed differentiator). When this happens:

1. **Apply the correction inline** to the current draft version
2. **Re-version the draft** (v1 → v1.1 → v1.2)
3. **Re-confirm with the user** before next layer runs (avoid wasted agent budget on wrong draft)
4. **Note the correction in the pipeline scorecard** so the audit trail is complete

---

## Cross-Deck Tracking (project policies file)

After the FIRST section review (template-pass), generate a project-specific policies file that captures:

- **Cross-deck locks** — stat language, identity name, callbacks, signature phrases
- **Section mapping** — each draft file → outline arc + review status
- **Voice fingerprint targets per speaker per section** — minimums for tics, budget for em-dashes, hard stops
- **Pipeline decisions** — counsel mode, score gate, posture, disagreement resolutions
- **Cross-cutting rules** — somatic anchor rotation, micro-commitment budget, callback discipline

Load this policies file at the START of every subsequent section review. It prevents drift and re-litigation.

**Template:** See `[PROJECT]-review-pipeline-policies.md` in any project that has run a template-pass.

---

## Anti-Patterns (don't do this)

- **Persona mode for FIRST-pass high-stakes deliverables** — counsel members converge toward consensus when they should disagree. Use agent mode for first pass of paid client work. (Persona mode IS appropriate for revision passes — see "Pass-Number Dispatch + Between-Layer Gate" section above.)
- **Skipping the score gate** — proceeding to voice layer on a counsel-failed draft wastes voice agent budget on structural issues.
- **Auto-applying foreman edits without voice-DNA precedence check** — strips speaker fingerprints.
- **Running the pipeline section-by-section without cross-deck tracking** — guarantees inconsistency across the final deck.
- **Letting the user not see the synthesis between layers** — they need to make policy calls (disagreement zones) that propagate.

---

## Generalization beyond webinars

This pipeline pattern applies to any speaker-attributed long-form content where voice fidelity + structural quality + AI-tell hygiene all matter:

- VSL scripts (`/vsl-activator`, `/vsl-post-production`)
- Email sequences (`/daily-email-digest`, `/belief-shift-e-engine`)
- Propaganda machine outputs (`/propaganda-machine`)
- Sales letters
- Podcast outlines
- Speaker notes (`/presentation-hacker`)

The counsel layer swaps (use Email Hacker Counsel #17 for emails, VSL Allstar Squad #16 for VSLs, etc.). The voice + foreman layers stay the same architecture.

See vault pattern note `patterns/multi-layer-content-review-pipeline.md` for the abstracted cross-project version.

---

---

## Pass-Number Dispatch + Between-Layer Gate (refined 2026-05-22)

Two refinements to the pipeline shipped during <example-brand> §4 review:

**Pass-number dispatch:** First-pass uses agent mode (5 parallel) for fidelity; revision passes use persona mode for cost-efficiency. See vault principle <your-related-note> "Pass-Number Dimension" section for the full matrix.

**Between-layer gate:** Read-through is required between EVERY layer, not just at the end. After each layer, print a recap inline (using <your-related-note>), get user review, THEN dispatch next layer. See vault principle <your-related-note> "Refinement — Between-Layer Gate" section.

The Anti-Patterns section below has been updated accordingly — "Persona mode for high-stakes deliverables" applies to FIRST-pass dispatch only.

---

*Built 2026-05-21 from the <example-brand> Opening template-pass. Updated 2026-05-22 (<example-brand> §4). Update as new sections / projects reveal additional rules.*
