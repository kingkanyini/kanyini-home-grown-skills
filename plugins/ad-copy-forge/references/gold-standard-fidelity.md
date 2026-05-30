# Gold Standard Fidelity Rubric

**Purpose:** Measure generated ad copy fidelity against the 3 gold-standard style shots. Any ad that scores below 95% triggers auto-correction and re-run. After 3 failed retries, surfaces to <your-name> for manual review.

**Date locked:** 2026-04-23
**Approved by:** <your-name>
**Threshold:** ≥95/100 required to proceed to counsel review

**Gold Standards (compare against):**
- `reference/style-shots/style-shot-01-luxiana.md` — founder-voice template
- `reference/style-shots/style-shot-02-ltuvg.md` — gaming/low-ticket template
- `reference/style-shots/style-shot-03-soma.md` — high-ticket somatic template (primary default)

---

## WHEN TO APPLY

**Phase 3 — runs BEFORE both counsel reviews:**

```
Phase 2 (Translation) produces ad copy
    ↓
Phase 3A: Gold Standard Fidelity Gate ← THIS RUBRIC
    ├─ Score ≥95 → proceed to Phase 3B
    ├─ Score 85-94 → auto-correct (1-3 retries)
    └─ Score <85 OR 3 retries failed → surface to <your-name>
    ↓
Phase 3B: Copy Forensics Counsel sanity pass
    ↓
Phase 3C: Ad Avengers counsel quality review
    ↓
Phase 3D: User ad-by-ad approval
```

---

## STYLE SHOT SELECTION (match generated ad to closest gold standard)

Before scoring, pick the style shot that best matches the generated ad's category:

| Generated ad type | Primary gold standard | Secondary |
|-------------------|----------------------|-----------|
| Founder-voice (includes "I") | Style Shot 01 (Luxiana) | — |
| Gaming/metaphor-heavy / low-ticket | Style Shot 02 (LTUVG) | Style Shot 03 for somatic elements |
| High-ticket coaching/healing/somatic | Style Shot 03 (SOMA) | Style Shot 02 for metaphor rules |
| Service/session-based (shorter offer) | Style Shot 01 or 03 blend | — |
| Other | Style Shot 03 (most canonical default) | — |

---

## SCORING RUBRIC (100 points total)

### Dimension 1 — STRUCTURAL FIDELITY (30 points)

| Criterion | Points | Measurement |
|-----------|--------|-------------|
| All 5 required sections present | 10 | Hook · Pain Stacking · Program Intro · Offer Breakdown · CTA (-2 per missing) |
| Section order matches canonical | 5 | Hook→Pain→[mirror]→Reframe→Intro→Bullets→Proof→[Qual]→[Price]→CTA→[PS] (-1 per swap) |
| Proportions within ±5% | 5 | Hook+Pain 30-35% · Reframe+Intro 20-25% · Bullets 25-30% · Proof 8-12% · CTA+PS 8-12% (-1 per zone off) |
| Formatting compliance | 5 | Em dash connector · single-sentence paragraphs · ALL CAPS rules · `---` dividers · correct emoji set (-1 per violation) |
| Length 150-250 words | 5 | Word count in range (-3 if 100-149 or 251-300, -5 if outside 100-300) |

### Dimension 2 — WORD-LEVEL FIDELITY (30 points)

| Criterion | Points | Measurement |
|-----------|--------|-------------|
| Pronoun density 12-16 "you/your" per 100 words | 6 | Count and divide (-2 if 10-11 or 17-18, -4 if outside 8-20) |
| 73%+ statement opener (not question) | 4 | First sentence is a statement (full 4 if statement, 0 if question without strong justification) |
| Verb-first bullets for internal outcomes / noun-first for deliverables | 6 | Each bullet follows rule (-1 per violation) |
| Triple-parallel pain ladder ≥1x present | 6 | One instance of 2-4 sentence fragments in parallel (full 6 if present, 0 if absent) |
| ≥1 of: negation-reveal / contrast reframe / stop-start chiasmus | 5 | One of the signature power phrases used (full 5 if present) |
| Em dash `—` used as connector | 3 | At least 3-4 em dashes in copy (full 3 if ≥3, 0 if absent) |

### Dimension 3 — ENERGY FIDELITY (25 points)

| Criterion | Points | Measurement |
|-----------|--------|-------------|
| Entry→Exit belief shift identifiable | 6 | Entry belief at start, exit belief at end, traceable bridge (full 6 if clear, 3 if weak, 0 if absent) |
| Pivot line is short, isolated, unmissable | 4 | Mechanism reveal is a single short sentence in its own paragraph (full 4 if met) |
| Somatic trigger cascade in order | 4 | Contraction → Recognition → Release (and optionally Expansion/Activation) (full 4 if sequence preserved) |
| Honor-first open (never shames reader) | 4 | Opening honors what reader has built OR honors their calling/effort (-4 if opens with shame/blame) |
| Permission-to-stop present | 4 | Reader is given permission to put down an exhausting identity/strategy (full 4 if explicit, 2 if implicit) |
| Exit on identity-confirmation (for transformation offers) | 3 | CTA zone lands on identity, not urgency-first (full 3 if identity-primary; may flex to urgency for commodity offers) |

### Dimension 4 — GOVERNANCE FIDELITY (15 points)

| Criterion | Points | Measurement |
|-----------|--------|-------------|
| Zero credential language | 4 | No "As seen in...", "25 years experience", title-flexing (-4 if any violation) |
| Zero banned AI-isms from CLAUDE.md | 4 | No "dive deep", "unlock your potential", "let's be honest", "navigate", "leverage", "here's the thing", starting with "So/Now", ending with "Remember, X" (-1 per violation) |
| OO/Prop Machine grounding | 4 | Every claim traces to OO or Prop Machine (-1 per ungrounded claim, up to -4) |
| Ethics check passed | 3 | Language Rules from CLAUDE.md followed (no "steal", "copy", "rip off", "hack" in exploitative sense); Golden Rule passes (-1 per violation) |

---

## TOTAL SCORING & ACTION

```
100 points total
  ≥95 points → PASS → proceed to Phase 3B (Copy Forensics sanity)
  90-94 points → AUTO-CORRECT (1 retry) with specific correction notes
  85-89 points → AUTO-CORRECT (up to 3 retries) with specific correction notes
  <85 points → ESCALATE to <your-name> for manual review immediately
  3 retries exhausted → ESCALATE to <your-name> for manual review
```

---

## AUTO-CORRECTION PROTOCOL

When score is between 85-94:

1. **Identify weakest dimension** (lowest score of the 4)
2. **Generate correction notes** quoting:
   - Which specific criterion failed
   - The gold-standard example that shows the correct pattern
   - The specific line(s) in generated ad that violate
3. **Re-run Phase 2 translation** with correction notes injected into the prompt
4. **Re-score** the revised ad against this rubric
5. **Track retry count** — max 3 before escalation

### Correction note format (example)

```
FIDELITY FAIL — Ad #1 scored 88/100 (threshold 95)

Weakest dimension: WORD-LEVEL FIDELITY (18/30)

Specific failures:
- Pronoun density only 9/100 words (target: 12-16)
  → Rewrite to use more "you/your" — see Style Shot 03 line "You've built the business."
- Missing triple-parallel pain ladder
  → Add 2-4 short parallel fragments — see Style Shot 03 "Tight neck. Shallow breathing. Always activated."

Re-run with these corrections applied.
```

---

## ESCALATION PROTOCOL (3 retries failed OR score <85)

When auto-correction cannot reach 95%:

1. **STOP auto-correction.** Do not ship below threshold.
2. **Surface to <your-name>** with:
   - Final score and breakdown per dimension
   - The 3 generated versions and their scores
   - Specific criteria that could not be satisfied
   - Proposed options: manual edit · different style shot · regenerate from different video script angle · accept as-is with flagged fidelity score
3. **Wait for <your-name>'s decision.** Never ship below threshold without explicit approval.

---

## SCORING WORKFLOW (per ad)

```
# Pseudocode — the skill's internal workflow

for each generated_ad:
    closest_gold = match_to_style_shot(generated_ad)

    score = 0
    score += score_structure(generated_ad, closest_gold)  # 30 pts
    score += score_words(generated_ad, closest_gold)       # 30 pts
    score += score_energy(generated_ad, closest_gold)      # 25 pts
    score += score_governance(generated_ad, closest_gold)  # 15 pts

    if score >= 95:
        proceed_to_counsel_review()
    elif score >= 85 and retries < 3:
        correction_notes = generate_correction_notes(generated_ad, closest_gold)
        retries += 1
        regenerate_ad(correction_notes)
    else:
        escalate_to_kanyini(score, breakdown, versions)
```

---

## GOVERNANCE NOTES

- This rubric complements, does not replace, the counsel review process (Copy Forensics sanity + Ad Avengers quality).
- A 95% ad can still fail counsel review on quality/voice/offer-alignment grounds — counsel has final word.
- The rubric is a FILTER that ensures only structurally-sound copy reaches counsel review, saving counsel cycles for meaningful critique vs. structural correction.
- Gold standards may be updated over time as more RocketeerAds outputs are analyzed. Re-calibration requires re-running Phase 0 with new examples.

---

**Rubric locked 2026-04-23. Applied in Phase 3A of `/ad-copy-forge`.**
