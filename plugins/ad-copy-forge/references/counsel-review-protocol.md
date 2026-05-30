# Ad Copy Forge — Counsel Review Protocol

## Ad Avengers Counsel (#12)

| Member | Focus | Voice |
|--------|-------|-------|
| **Charley Tichenor IV** | Algorithm-friendliness, engagement signals, comment-bait potential, pattern interrupt for scroll | Speaks in data patterns. References ad performance metrics. "The algorithm rewards..." |
| **Nicholas Kusmich** | Heart-centered positioning, give-first energy, authenticity, emotional truth | Warm, empathetic. "Does this land in the heart before the head?" |
| **Billy Gene Shaw** | Creative punch, entertainment value, scroll-stopping power, pattern-breaking hooks | High energy, bold. "Would YOU stop scrolling for this? Be honest." |
| **Russell Brunson** | Offer alignment, hook strength, CTA clarity, OO fidelity, funnel positioning | Strategic, story-driven. "The hook has to earn the next line..." |

## Pass 1: Counsel Quality Review

Each counsel member reviews EVERY ad copy and provides:

1. **Rating** (1-10) with one-line justification
2. **One specific improvement** (mandatory — anti-rubber-stamp rule)
3. **OO alignment check** — flag any claim not supported by the OO
4. **Skeleton fidelity check** — flag any section that deviates from the structural pattern

### Review Checklist (per ad)

- [ ] Hook matches skeleton pattern (opening type, length, tone)
- [ ] Section order follows skeleton flow
- [ ] Proportions roughly match skeleton percentages
- [ ] Every claim traces back to OO or Prop Machine
- [ ] Belief shifts are grounded in Prop Machine shift frameworks
- [ ] Identity language matches OO ICA section
- [ ] Proof/testimonials are real (no fictional proof)
- [ ] CTA is clear, specific, and matches the offer
- [ ] Formatting matches RocketeerAds style (emoji, spacing, caps)
- [ ] No spoken/video language remnants ("watch this," "in this video," etc.)
- [ ] Transformation rules applied (spoken to written conversion)
- [ ] Copy reads naturally for Meta scrolling (not listening cadence)

### Anti-Rubber-Stamp Mandate

Each counsel member MUST flag at least ONE improvement per ad. If the ad is genuinely excellent, flag a micro-improvement (word choice, spacing, emoji placement). Generic "looks good" is not acceptable.

## Pass 2: Voice Filter

1. Load client voice profile from `~/.claude/references/voice-profiles/` (if exists)
2. If no voice profile exists, use <your-name>'s default voice markers
3. Cross-check every ad for:
   - AI-isms (banned phrases from CLAUDE.md)
   - Banned structural patterns (starting with "So,", ending with "Remember,", etc.)
   - Em dash overuse (max 1 per ad)
   - Generic motivational noise ("unlock your potential", "dive deep", etc.)
4. Replace any violations
5. If more than 2 AI-isms found in a single ad, flag to user: "Caught [X] AI-isms in ad [N], cleaned them up."

## Pass 3: Ad-by-Ad User Review (MANDATORY)

**NEVER skip this pass. NEVER go from Pass 2 directly to output.**

1. Ask review mode via AskUserQuestion:
   - "One at a time" — present each ad sequentially
   - "All at once" — present all ads in a single view
   - "Flagged only" — present only ads with counsel flags

2. For each ad, present:
   - The full ad copy
   - Counsel notes (all 4 members)
   - AI-isms scan results
   - Source script reference

3. For each ad, AskUserQuestion:
   - "Approved — lock it"
   - "Edit — I'll make changes" (apply edits, run counsel digest)
   - "Rewrite — start this one over" (re-run Phase 2 for this ad only)
   - "Skip for now"

4. Only after ALL ads are locked or skipped -> proceed to Phase 4
