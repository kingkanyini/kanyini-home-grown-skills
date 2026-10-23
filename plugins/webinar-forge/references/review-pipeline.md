# Webinar Section Review Pipeline

> **Purpose:** Review a drafted Perfect Webinar script (or any speaker-attributed long-form content) through layered agents that catch structural, voice, and AI-tell issues before delivery.
>
> **Where it runs:** Phase 4 of `/webinar-forge` on the stitched 90-minute script. Optional on the Phase 3 outline. It also works standalone on a manually drafted section.
>
> **Prompts:** the agent templates live in `agent-prompts.md` (§4 Counsel Reviewer, §6 Voice Auditor, §7 Foreman). Every dispatch passes `model: "opus"`.

---

## The Pipeline

```
DRAFTED SCRIPT (or section)
    |
Layer 1: Counsel. 5 reviewers in one message (§4, scope "script")
    |
Orchestrator synthesis -> USER GATE (disagreements as AskUserQuestion) -> revised draft v1
    |
Layer 2: Voice. 1 auditor per speaker, in one message (§6)
    |  (back-to-back, no user gate unless Layers 2 and 3 conflict)
Layer 3: Foreman. AI-ism + Continuity (§7)
    |
Orchestrator applies voice-DNA precedence -> FINAL READ-THROUGH (user) -> Continuity Ledger update
```

Scores are advisory. They tell the user where the draft is strong or weak; they do not block a layer. The two user gates are the counsel synthesis and the final read-through. The user's read-through is the ship gate.

Review files: `reviews/script-<member-slug>.json` (Layer 1), `reviews/script-voice-<speaker-slug>.json` (Layer 2), `reviews/script-foreman.json` plus `scripts/full-90min.foreman.md` (Layer 3).

---

## Pre-Pipeline Setup (once per project)

Before reviewing the first section of a deck, lock these in the project policies file (`<project>-review-pipeline-policies.md` in the project folder):

| Item | What to lock |
|---|---|
| **Counsel mode** | Agent mode (5 parallel reviewers) for the first pass of paid client work. Persona mode (one agent voices all 5) for low-stakes drafts and revision passes. |
| **Webinar posture** | Experiential-first (warmth and curiosity early, sales architecture late) or architecture-first (identity name, cap, and price seeded in the first minutes). This shapes how counsel disagreements resolve. |
| **Voice profiles** | Path to each speaker's voice profile. |
| **Cross-deck locks** | Stat language, identity name, key callbacks, signature phrases, banned phrases. These travel across sections. |

---

## Layer 1: Counsel

Members, chapter ownership, and slugs are in the main file's Phase 2 table. For a section review, the member who owns that kind of section (hook, content, stack, close) is the lead; give the lead's prompt one extra line: "You are the lead for this section; open the room."

**Synthesis (orchestrator):**
1. Show each member's score, what lands, what's weak, and edit.
2. Consensus fixes: 3 or more members point at the same issue.
3. Real disagreement: present as AskUserQuestion options (often experiential vs sales-architecture tension). Never average two positions into one.
4. Lines everyone praised: protect them in the revision.
5. Produce draft v1 after the user's calls.

## Layer 2: Voice

One §6 auditor per distinct speaker. A co-hosted webinar gets two auditors in parallel. Each auditor sees only its own speaker's profile and lines and returns a fingerprint table, 4-7 rewrites, and a list of documented tics that might look like AI tells.

## Layer 3: Foreman

One §7 agent on the post-voice draft. It runs the AI-ism audits (Category A) and the continuity audits (Category B) against the project policies file and Continuity Ledger, then writes its fixes inline to a revision file.

If the foreman's fixes and the voice auditors' rewrites conflict, show both to the user before the read-through.

---

## Voice-DNA Precedence Rule

The foreman does not load voice profiles; it applies general AI-tell rules. When the foreman flags a phrase that the voice profile documents as a tic (for example, a speaker's habitual "and so" sentence opener, which looks like a cousin of the banned "So," opener), the voice auditor's call wins.

1. Note the foreman's flag in the synthesis.
2. Keep the speaker's tic.
3. Tell the user about the override.
4. Log the override pattern in the project policies file for future foreman runs.

---

## Continuity Ledger (lives in the project policies file)

The foreman's working memory across sections. A structured list of every:
- **Promise** made, with its scheduled delivery section
- **Tease** planted, with its scheduled reveal section
- **Setup** planted, with its scheduled callback section
- **Bio / framework reference**, with its canonical definition source
- **Stat / number / identity name**, with its canonical value

After each review, the orchestrator writes the foreman's `ledger_updates` into the ledger. The next section's foreman loads it to check what that section has to deliver, pay off, or call back.

---

## Mid-Pipeline Correction

When the user catches a content error mid-pipeline (wrong framework, outdated stat, missed differentiator):

1. Apply the correction to the current draft.
2. Re-version it (v1 to v1.1).
3. Confirm with the user before the next layer runs.
4. Note the correction in the review record.

---

## Cross-Deck Tracking

After the first section review, extend the project policies file with:

- **Cross-deck locks:** stat language, identity name, callbacks, signature phrases
- **Section mapping:** each draft file, its outline arc, and its review status
- **Voice targets per speaker:** tic minimums, em-dash budget, hard stops
- **Pipeline decisions:** counsel mode, posture, disagreement resolutions
- **Cross-cutting rules:** anchor rotation, micro-commitment budget, callback discipline

Load the policies file at the start of every later review. It prevents drift and re-litigation.

---

## Pass Number

First pass: agent mode (5 independent reviewers) for fidelity. Revision passes: persona mode is fine.

## Anti-Patterns

- Persona mode on the first pass of a paid deliverable: voices converge toward consensus when they should disagree.
- Applying foreman edits without the voice-DNA precedence check: strips speaker fingerprints.
- Reviewing section by section without the policies file: guarantees inconsistency across the deck.
- Hiding the counsel synthesis from the user: their disagreement calls propagate to every later section.

---

## Beyond Webinars

The same pattern fits any speaker-attributed long-form content: VSL scripts (`/vsl-activator`), email sequences (`/daily-email-digest`, `/belief-shift-e-engine`), `/propaganda-machine` outputs, sales letters, podcast outlines, speaker notes (`/presentation-hacker`). Swap the counsel (Email Hacker Counsel #17 for emails, VSL Allstar Squad #16 for VSLs); the voice and foreman layers stay the same.

---

*Built 2026-05-21 from a client template-pass; refined 2026-05-22. Genericized and wired into Phase 4 in v2.0.0 (2026-10-16).*
