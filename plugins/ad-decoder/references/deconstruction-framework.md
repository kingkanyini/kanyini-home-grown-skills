# Study Deconstruction — the 9-Dimension Framework (Copy Forensics-hardened, 9.1)

> Goal: extract the REGENERABLE pattern that makes a winner win — the engine,
> not just the skeleton — so a Ship skill can rebuild it for a new offer.

Every field is a **controlled-vocabulary enum** (see `lib/schemas.py`) so the
commonality table tallies by counting, not fuzzy re-reading. Where a field maps
to a Ship-skill slot it **reuses that skill's codes**, so the card IS the input
contract (no translation layer, Fidelity Principle).

## The card (per ad)

### 5 descriptive — the skeleton
| # | Field | Enum / shape | Source |
|---|---|---|---|
| 1 | `hook_type` | `{Q,S,C,M,SO,D,P}` (REUSED from ss-ad-generator) | Vision first frames + Whisper/OCR opening line |
| 2 | `pacing` | `{slow, medium, rapid}` | shot/cut frequency from frame deltas |
| 3 | `audio_choice` | `{music-only, voiceover, ugc-talking-head, mixed}` | Whisper + audio profile |
| 4 | `narrative_structure` | `{problem-agitate-solve, aida, story-led, demonstration, listicle, testimonial-led, before-after, founder-confession}` (→ ad-copy-forge skeleton) | transcript + OCR |
| 5 | `cta_placement` + `cta_variant` | placement `{end-card, mid-roll, persistent-overlay, text-only, verbal-only}`; variant `{proof-bridge, pattern-recognition, curiosity, direct-quiz, risk-reversal, direct}` (REUSED from ss-ad-generator) | end of creative |

### 4 mechanism-grade — the engine (the path to 9.0)
6. **`unique_mechanism`** — a required **two-part sentence**: *why-failed-before
   + why-this-works*. NOT a restated feature. **Gate B rejects feature-
   restatements** (Georgi). This is the spine — without it you clone the
   skeleton and lose the conversion.
7. **`awareness_level`** `{unaware, problem, solution, product, most-aware}` +
   **`awareness_evidence`** (the verbatim line proving it). Lets Ship match the
   clone to the new product's traffic temperature.
8. **`proof[]`** — each item: `proof_type` `{demonstration, testimonial,
   authority, social-count, before-after, specific-number, guarantee, none}` +
   `strength {strong, weak}` + `specific_number_present` + `verbatim_claim`;
   plus **`skepticism_neutralized`** (what "Yeah, sure" each proof defeats —
   Bencivenga). Strength tie-break = is a specific number present.
9. **`avatar`** (named crowd) + **`emotional_turning_point`** + **`wallet_line`**
   (the one line that pulls the wallet — Halbert); plus NESB tags
   `{nesb_new, nesb_easy, nesb_safe, nesb_big}` and **`subtext_belief_shift`**
   constrained to the belief-shift enum `{vehicle-works, i-can-do-it,
   worth-the-cost, not-my-fault, now-is-the-time, safe-to-trust}` (maps to Prop
   Machine / ad-copy-forge 6 core beliefs) + `subtext_evidence`. The belief-shift
   enum closes the last freeform field (Milligan) — prose is evidence only.

### On-screen text (mandatory — Milligan)
`onscreen_text` = **Vision-OCR of burned-in captions / overlays / price flashes,
merged with the Whisper timeline.** Whisper alone misses half a UGC ad's hook
(the hook is often on-screen, never spoken). This is non-negotiable for social.

## Gate B (Copy Forensics, persona-in-Python)
Reviews each card on its lens. A card is **rejected** when:
- `unique_mechanism` is a feature-restatement (Georgi),
- a required mechanism/proof/avatar field is empty,
- any enum field is off-vocabulary.

**Disposition (Halbert):** rejected → **retry once** (re-deconstruct) → if it
fails again, mark **`fidelity: low-fidelity`** and **exclude from the commonality
count** (kept in the report for the human, not allowed to skew %s). The run logs
the rejected count so effective sample size is visible.

## Commonality synthesis (the winning formula)
Across the pass-fidelity cards: for each dimension, `{modal_value, pct}`.
**Confidence floor (Georgi):** any dimension whose modal value is below
`study.confidence_floor_pct` (default 40%) of the post-Gate-B sample is marked
`low_confidence` and **suppressed from the winning-formula composite** — Ship
never inherits a "formula" built on a plurality of three ads.

## Ship handoff
The card already speaks Ship-native vocabulary (hook codes, cta variants,
narrative→skeleton, belief-shift→6 beliefs). The report's handoff block says:
*"Apply this proven STRUCTURE to YOUR offer via `/ss-ad-generator` (it fills the
14 triggers + hook/overlay codes) or `/ad-copy-forge` (it fills OO + Prop
Machine). Only the pattern transfers — never the competitor's offer data."*
