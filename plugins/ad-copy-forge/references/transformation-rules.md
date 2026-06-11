# Ad Copy Forge — Transformation Rules

## Purpose

These rules govern how spoken/video ad script language converts to written Meta ad copy. This file contains starter rules based on general best practices. During Phase 0 (Pattern Calibration), these rules will be refined and expanded based on actual RocketeerAds example pairs.

## Core Transformation Principles

### 1. Remove Video-Specific Language
| Script Language | Meta Copy Equivalent |
|----------------|---------------------|
| "Watch this video" | (remove entirely) |
| "In this video I'm going to show you" | (start directly with the content) |
| "If you're watching this" | "If you're reading this" or (remove) |
| "Click the link below" | "Click Learn More" or "Tap the link" |
| "Subscribe / like / share" | (remove — not relevant to Meta ads) |
| "Let me show you" | (just show it — write the content directly) |
| Visual cues: "as you can see here" | Convert to descriptive text or remove |
| "I'm [name] and..." | Integrate bio naturally or move to end |

### 2. Tighten for Reading vs. Listening
- **Listening:** Repetition helps retention. Restatements are welcome.
- **Reading:** Repetition feels redundant. Cut restatements.
- **Listening:** Longer sentences feel natural.
- **Reading:** Shorter sentences stop the scroll. Break long sentences.
- **Listening:** Filler phrases ("you know," "the thing is") feel conversational.
- **Reading:** Filler phrases waste space. Remove all filler.

### 3. Adapt Pacing for Scroll
- **First 2 lines** must hook — this is above the "See More" fold on Meta
- Use line breaks liberally — a wall of text gets scrolled past
- Single-sentence paragraphs for emphasis
- Emoji can serve as visual anchors (but match the skeleton's emoji pattern)

### 4. Preserve Emotional Arc
The script's emotional journey must survive the translation:
- If the script builds tension then releases it, the copy must too
- If the script uses vulnerability, the copy must feel equally vulnerable
- The copy should FEEL like the same ad in a different medium

### 5. Grounding Rules
- Every claim in the copy must trace back to the OO or Prop Machine
- Identity language must match the OO's ICA section exactly
- Belief shifts must reference the Prop Machine's shift frameworks
- Proof and testimonials must be real (from the Prop Machine's proof blocks)
- If the script contains a claim not in the OO/Prop Machine, flag it — don't include it

## Phase 0 Refinement

During Pattern Calibration, the skill will analyze actual RocketeerAds examples and may:
- Add new transformation rules specific to the RocketeerAds style
- Override generic rules with more specific patterns
- Add formatting-specific rules (emoji patterns, line break cadence, capitalization)
- Document what RocketeerAds keeps verbatim vs. rewrites

When Phase 0 refines these rules, it appends a "## Learned Patterns" section below with the specific patterns extracted from examples.

---

## Learned Patterns (from Phase 0 — 2026-04-23)

**Source:** 11 RocketeerAds ads across 4 clients (example-artist, LTUVG, example-collective, Sacral Uproar)
**Forensic passes:** 3 (Structure → Words → Energy)
**Extracted by:** Copy Forensics Counsel #39 (Georgi, Milligan, Bencivenga, Halbert)
**Primary reference:** `reference/skeleton.md` (full 4-layer skeleton)

### 1. The "Sales Page as Source" Pattern

RocketeerAds ads are not transformed from video scripts — they are transformed from **sales pages**. Phase 0 calibration confirmed that 10 of 10 RocketeerAds outputs map directly to the client's live sales page content.

**Transformation behavior:**
- Sales page = database of claims, testimonials, frameworks, pricing
- RocketeerAds = compression query over that database
- 2000-word sales page → 150-250 word ad

### 2. Refined Compression Ratios

| Source content type | Compression ratio | Rule |
|---------------------|-------------------|------|
| Power phrases (≤12 words, active voice, sensory image) | **1.00** | Preserve verbatim |
| Explanatory prose | **0.30-0.50** | Keep verb + object, cut modifiers |
| Feature lists | **0.10-0.20** | Name + one-noun essence only |
| Founder origin stories | **0.30-0.50** | Keep fragment triple + "now" pivot |
| Tier tables | **0.10-0.20** | Name + single noun-phrase essence + price |
| Testimonial grids | **0.05-0.15** | 1-2 quotes OR one abstracted proof line |

### 3. First-To-Cut List (refined)

Beyond generic filler ("you know," "the thing is"), cut these specific RocketeerAds targets:
- Adverbs (`really`, `actually`, `truly`, `definitely`)
- Throat-clearers (`step-by-step`, `the definition of`, `I want you to know that`)
- Narrative linkers (`and then`, `so what happened was`)
- Intensifiers (`absolutely`, `completely`, `entirely`) when non-load-bearing
- Sales-page hedging (`could help`, `may assist`, `designed to potentially`)

### 4. Sentence Opener Transformation

Video scripts often open with introductions. RocketeerAds ads NEVER do. Transform:

| Script opener (cut) | Ad opener (use instead) |
|--------------------|------------------------|
| "Hi, I'm [name]..." | Cut entirely. Move to bio at end if used at all. |
| "Today I want to talk about..." | Cut. Start with pain statement. |
| "Let me tell you about..." | Cut. Just tell it. |
| "Imagine if..." | Cut. RocketeerAds never uses this. |
| "Have you ever wondered..." | Cut. Use "You've [verb]..." pattern instead. |
| "In this video..." | Cut entirely. |

### 5. Verb-First vs Noun-First Bullet Rule (refined)

Source pages often use noun-led descriptions. Transform based on bullet TYPE:

**Internal outcome bullets → verb-first**
- Source: "Nervous system regulation included"
- Ad: "Regulate your nervous system"

**Tangible deliverable bullets → noun-first**
- Source: "You'll get a digital book that..."
- Ad: "A digital book that teaches you how to stop surviving..."

The 75/25 split observed in corpus: 75% verb-first (internal), 25% noun-first (tangible).

### 6. Signature Power Phrase Requirement

At least ONE of these must appear in every generated ad (per skeleton Layer 2E):

1. **Triple-parallel pain ladder** — "[Symptom]. [Symptom]. [Symptom]."
2. **Negation-reveal** — "Not because [expected]. Because [real reason]."
3. **Contrast reframe** — "This isn't [X]. It's [Y]."
4. **Transformation couplet** — "From [bad state] to [good state]."
5. **Stop/Start chiasmus** — "Stop [failing strategy]. Start [new identity]."

If none appear, flag for revision in Phase 3A (fidelity gate).

### 7. Emoji Transformation by Brand Category

| Brand type | Bullet emoji | Bonus emoji | Notes |
|-----------|-------------|------------|-------|
| Universal / default | ✅ | 🎁 | Most common in corpus |
| Feminine / spiritual | ✨ | 💎 | Sacral Uproar style |
| Gaming / LTUVG | 🎮 | 💎 | Consistent with product ETHOS |
| Somatic / high-ticket | ✓ (plain) | — | example-collective style — softer, more clinical |
| Process steps | → | — | For journey/sequence bullets (vs. outcome bullets) |

### 8. Pronoun Transformation Rule (refined)

Source pages often over-use "I" and "we." RocketeerAds redistributes pronoun weight:
- **"you/your":** Amplify to 12-16 per 100 words (from source's typical 5-8 per 100)
- **"I/my":** Compress or delete entirely; only preserve for founder-voice ads (example-artist style)
- **"we/us":** Rare — only for the program delivering transformation ("we translate your chart")

### 9. Section Reorganization Pattern

Sales pages follow top-down waterfall: headline → story → offer → bullets → proof → FAQ → CTA.

RocketeerAds collapses into a **fractal**: Hook+Pain+Reframe+Offer+Proof+CTA cycle compresses 2000+ words into 150-250 ad words.

Query the sales page as a database:
- **1 pain** (strongest symptom cluster)
- **1 reframe** (the mechanism pivot)
- **1 program intro** (naming sentence)
- **1 bullet stack** (4-6 compressed benefits)
- **1 proof** (numeric claim preferred; pull-quote as backup)
- **1 CTA** (identity-embedded)
- **1 P.S.** (stakes amplifier — add even if source doesn't have one)

### 10. Energy Layer Transformation

Sales pages often state transformations intellectually. RocketeerAds ads land them somatically. Transform:

| Source pattern | Ad pattern |
|---------------|-----------|
| "You'll feel better" | "Move from tight shoulders to grounded presence" |
| Abstract benefits | Bodily/somatic symptoms first, mechanism second |
| Credential-led ("As a certified coach...") | Symptom-specificity-led ("Tight neck. Shallow breathing.") |
| Shame-adjacent ("You're doing it wrong") | Honor-first ("You've built the business. But...") |
| Urgency-led CTA ("Limited spots!") | Identity-led CTA ("This is for entrepreneurs ready to feel their success") |

### 11. What to ADD (not in source)

These elements are ad-only — always generate fresh:
- Scarcity lines ("Only 4 spots per tier")
- Numeric proof beats (specific dollar/time/person numbers)
- P.S. line (stakes amplifier)
- "Sound familiar?" mirror-check (if ad needs recognition-bridge)
- Triple-stacked CTA menu (for high-ticket/tier-based offers)
- The "here's what nobody tells you" pivot line (if source is implicit about it)

### 12. What to REMOVE (always from source)

These elements appear on sales pages but NEVER in ads:
- FAQ blocks
- Guarantee language (money-back, satisfaction, etc.)
- Tier comparison tables
- Full testimonial grids (compress to 1-2 quotes max)
- Price stack tables ($7,085 → $1,111 breakdowns)
- Long origin stories (compress to fragment triple + pivot)
- Multi-stage frameworks (Stage 1, 2, 3, 4...)
- "About the founder" extended bios

---

**Learned patterns locked 2026-04-23. Used by Phase 2 translation. Validated by Phase 3A fidelity gate.**
