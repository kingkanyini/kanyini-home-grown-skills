# AI-ism Detection Patterns

> **Used by Phase 2 shallow-answer probe** in `/voice-dna-blueprint-builder`. When a subject's answer contains any pattern below (case-insensitive), the orchestrator offers a recorder-style probe: "Anything else surface there?" (existential Qs) or "Want to add a layer?" (other Qs). Probe is non-blocking — subject can decline.

## Detection method

Regex / substring match (case-insensitive). Fast, deterministic, no model call. Per <your-name>'s `principles/avoid-premature-complexity`, this is the v1 approach. Tune in v1.1 after real run data.

## Trigger threshold (combined)

A probe fires if EITHER condition is true:

- **Text mode:** answer length < 30 characters
- **Voice mode:** answer length < 60 characters (voice transcripts run ~2x longer than typed answers)
- **OR:** answer contains any pattern below

## Patterns (case-insensitive)

### Banned phrases (verbatim match)

- `here's the thing`
- `dive deep`
- `deep dive`
- `unlock your potential`
- `let's be honest`
- `let me be real`
- `navigate your`
- `leverage` (as a verb — flag for review; not all uses are AI-ish)
- `it's not just about`
- `at the end of the day`
- `journey of self-discovery`
- `journey of healing`
- `cookie-cutter`
- `game-changer`

### Banned structural patterns

- `^so,` (line starts with "So,") — but only if entire answer is under 80 chars (a one-word "So," opener on a long answer may be authentic)
- `^now,` (line starts with "Now,") — same length condition
- `remember,` followed by a restatement at end of answer
- repeated em-dashes — flag if 3+ em-dashes in a single answer

### Banned hedge patterns

- `i think maybe`
- `it could be that`
- `i guess`
- entire answer is `i don't know` (without elaboration)

---

**Implementation note for executor:** Phase 2 in the main command file invokes these patterns inline. The patterns above are the source of truth — do NOT duplicate them in the command file; reference this file.
