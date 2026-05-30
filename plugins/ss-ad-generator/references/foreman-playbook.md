# Foreman Playbook — SS Ad Generator

The Foreman agent runs between Phase 2 (Trigger Extraction) and Phase 3 (Ad Generation). Its job: create 7 Assignment Cards that prevent structural issues before writers begin.

---

## FUNNEL-CTA MAPPING

Lock the CTA at intake. Writers receive it as a non-negotiable constraint.

| Funnel Type | Default CTA | Notes |
|-------------|-------------|-------|
| VSL | "I break it all down in a short video. Go watch it." | Direct to VSL page |
| Webinar | "I walk through the full framework in a free training. Save your seat." | Registration language |
| Book-a-call | "If this resonated, click below to see if this is right for where you are." | Conversational, low-pressure |
| Mini-course | "I put the whole system inside a free [X]-day experience. Join us." | Community energy |
| Lead magnet | "I created a free [resource name] that shows you exactly how. Grab it below." | Value-first |
| Application | "I only work with [X] people at a time. Click below to apply." | Scarcity + selectivity |

**CTA VARIANTS:** If the client wants 2-3 CTA variants across 14 ads (e.g., a warmer CTA for social proof ads, a scarcity CTA for exclusivity ads), define them at intake and assign specific ad numbers to each variant. Document in the distribution plan.

---

## HOOK STRUCTURE TAXONOMY

No single structure may appear more than 2 out of 14 ads.

| Code | Structure | Example |
|------|-----------|---------|
| Q | Question | "What if self-awareness is actually keeping you stuck?" |
| S | Statement | "She had everything figured out — except how to feel alive." |
| C | Contrarian | "Most healing programs will take anyone with a credit card. This one won't." |
| M | Metaphor/Image | "You didn't lose yourself. A part of you just stopped feeling safe enough to stay." |
| SO | Story-open | "Kasia had the business, the freedom, the practice." |
| D | Data-lead | "She'd been doing the inner work for 4 years. She felt the first real shift in 2 weeks." |
| P | Paradox | "You're exhausted from healing. That's not burnout — that's a clue." |

**DISTRIBUTION:** Assign 7 structures across 14 ads. Each code appears exactly 2x. Each writer gets 2 different structures (one per ad).

**3-SECOND RULE:** Every spoken hook must create identification and grab attention within 3 seconds. No greetings ("hi", "hey", "welcome"). No warm-up. Direct pattern interrupt or emotional hook immediately. Examples:
- "Are you the woman everyone calls 'the strong one'?"
- "You keep pushing it off. After the launch... after the move..."
- "The supplements... the protocols... the routines everyone swears by..."

---

## OVERLAY HEADLINE FORMULAS

The overlay hook is TEXT ON SCREEN — it is NOT the spoken hook. Writers must treat them as two separate creative units. The Foreman assigns an overlay formula to each ad on the assignment card.

**Core Formulas (rotate across 14 ads):**

| Code | Formula | Example |
|------|---------|---------|
| HW | "How to [goal] without [biggest fear]" | "How to finally feel at home in your body without another protocol" |
| SS | "The Secret to Solving [problem] without [thing they fear]" | "The Secret to Solving chronic exhaustion without giving up your career" |
| WI | "When [thing they try] isn't fixing [problem], do this instead" | "When meditation isn't fixing the anxiety, do this instead" |
| DR | Direct statement (contrarian/provocative) | "Your nervous system isn't broken. It's doing exactly what it was trained to do." |
| QO | Question overlay | "What if the exhaustion isn't burnout?" |

**DISTRIBUTION RULE:** No formula code more than 3x across 14 ads. Each writer gets 2 different overlay formulas. The Foreman assigns the formula on the card — the writer fills in the specifics using the trigger's language.

**OVERLAY WORD LIMIT (HARD RULE):** Maximum 12 words per overlay. Overlays over 12 words fail the mute test — they read like blog headlines. The Foreman MUST check word count on every card and reject any over 12.

Gold standard overlays: "Being functional is not the same as being alive." (9 words). "Posting your Human Design type is not the same as living it." (12 words).
Failed overlays: "How to simplify your entire approach to life and business by aligning with your design" (15 words — TOO LONG).

**ANTI-COPY RULE:** If the overlay text is identical to the spoken hook on any card, the Foreman MUST rewrite one of them before launching. They serve different functions: overlay STOPS THE SCROLL (text on screen), spoken hook CREATES IDENTIFICATION (first audio the viewer hears).

---

## PROOF DISTRIBUTION RULES

| Rule | Formula | Example (14 ads) |
|------|---------|-------------------|
| Max named testimonials | floor(total_ads / 3) | 4 named, 10 anonymous |
| Max appearances per name | floor(total_ads / 3) | Any single name max 4x |
| Min anonymous archetypes | 5 distinct | No archetype more than 2x |

**Anonymous Archetype Examples:**
"protocol-rotator", "perfectionist-performer", "relationship-drifter", "achievement-collector", "wellness-fatigued", "corporate-escapee", "over-functioning-caregiver"

Each anonymous proof story must represent a different life situation, industry, or transformation timeline. No two anonymous stories may share the same before/after arc.

### FICTIONAL PROOF DISCLOSURE (MANDATORY)

**Real anonymous proof** = A real client story told without their name (changed details for privacy).
**Fictional proof** = An invented archetype that represents a type of client but is NOT a real person.

At intake (Phase 1C), the Foreman MUST ask:

> "For the anonymous proof stories — are these based on REAL clients (details changed for privacy), or are they fictional archetypes representing your ideal client?"

**If fictional:**
1. Flag to the user: "Fictional proof is a valid creative choice, but the audience may sense it lacks the specificity of real stories. Real proof converts better."
2. Offer alternatives: "(a) Use real client stories anonymized, (b) Use YOUR OWN transformation as proof, or (c) Proceed with fictional archetypes knowing this trade-off."
3. If user proceeds with fictional: Note on each card: "PROOF TYPE: Fictional archetype — keep details plausible and specific."

**Card labels:**
- Named (real): `Named: "Kasia" (real client)`
- Anonymous (real): `Anonymous archetype: "protocol-rotator" (real client, details changed)`
- Fictional: `Fictional archetype: "burned-out achiever" (invented — keep plausible)`

---

## FOREMAN DISTRIBUTION ALGORITHM

Run this BEFORE filling any assignment cards:

1. **Hook structures:** Distribute 7 codes across 14 ads (each code 2x max). Each writer gets 2 different codes.
2. **Named testimonials:** Count = floor(total_ads / 3). Assign names to specific ad numbers. Remaining ads get anonymous archetypes.
3. **Anonymous archetypes:** For each anonymous ad, assign a distinct descriptor. Min 5 distinct archetypes across the set.
4. **CTA assignment:** Copy CTA text from intake. All 14 get the same base CTA unless variants were defined. **CTA personalization note:** For ads with story-open (SO) hooks or named testimonial proof, note on the card: "CTA must bridge from story character → viewer (e.g., 'If her story sounds familiar...'). Do NOT use generic 'If this resonated' on story-based ads."
5. **Trigger phrase extraction:** Pull 2-3 of the most powerful phrases from each Phase 2 trigger. These become MUST-APPEAR constraints on the card. **Use the client's own words from intake whenever possible** — not paraphrased, not polished. The client should hear their own language in the ad.
6. **Overlay vs. spoken hook:** Assign an overlay formula code from the OVERLAY HEADLINE FORMULAS table to each ad. Each writer gets 2 different overlay formulas. If the overlay text ends up identical to the spoken hook, rewrite one before launching.
7. **Gender rotation:** Ask at intake: "Does this avatar include multiple genders?" If YES, alternate HIM/HER (or HIM/HER/THEM) across the 14 ads. Each writer gets one HIM ad and one HER ad (or the rotation that balances across 7 writers). Put the assigned gender pronoun on each card: "GENDER FOR THIS AD: HIM" or "GENDER FOR THIS AD: HER". This drives: (a) the anonymous archetype gender, (b) the story character gender in proof sections, (c) the CTA personalization pronouns. If the avatar is single-gender, note it once and skip rotation.

---

## ASSIGNMENT CARD TEMPLATE

The Foreman generates 7 cards (one per writer agent). Each card contains everything the writer needs — no ambiguity, no interpretation required.

```
### WRITER AGENT [#] — Assignment Card

**Ads to generate:** #[X] and #[Y]

**AD #[X] — [Trigger Name]:**
- Trigger: [Full trigger details from Phase 2]
- Hook structure: [Code] ([Name])
- Hook structures NOT to use: [Codes assigned to other writers]
- Overlay formula: [Code] — "[Formula template]"
- Overlay hook: "[Suggested overlay text using the assigned formula]" ([X] words — max 12)
- Spoken hook: "[Suggested spoken opener — ≤3 seconds, NO greetings, direct hook]"
- Gender for this ad: [HIM / HER / THEM — or N/A if single-gender avatar]
- Proof type: [Named: "[Name]" / Anonymous archetype: "[descriptor]"]
- Trigger phrases MUST appear verbatim: ["phrase 1", "phrase 2"]
- CTA (non-negotiable): "[Exact CTA text]"
- CTA personalization: [If story-based: "Bridge from [his/her/their] story → viewer." If direct-address: "Use generic 'your' CTA."]

**AD #[Y] — [Trigger Name]:**
[Same structure]

**VOICE:** [Client name] — [voice notes from intake]
**QUALITY BAR:** Match or exceed gold-standard-ads.md. Gold standard ads are the benchmark.
**3-SECOND RULE:** Spoken hook must create identification instantly. No greetings. Direct pattern interrupt.
**VOICE FIDELITY:** The client must be able to say every line out loud and have it sound like THEM, not like a copywriter. Use their language from intake.
```

---

## WORKED EXAMPLE: Sacral Uproar (Luna Lauren)

### Writer Agent 3 — Assignment Card

**Ads to generate:** #5 and #6

**AD #5 — Secret Knowledge:**
- Trigger: "Your Body Already Knows" — Fascination + permission. Discovering you're designed for something specific.
- Hook structure: S (Statement)
- Hook structures NOT to use: Q (Writer 1), C (Writer 2), D (Writer 5)
- Overlay formula: WI — "When [thing they try] isn't fixing [problem], do this instead"
- Overlay hook: "When every healing modality you've tried isn't fixing the exhaustion, do this instead."
- Spoken hook: "The supplements... the protocols... the routines everyone swears by... Some of it helped. None of it lasted."
- Gender for this ad: HER
- Proof type: Anonymous archetype: "protocol-rotator" (woman cycling through adaptogens, ice baths, meditation challenges for 3 years)
- Trigger phrases MUST appear: "YOUR specific design", "built in", "your own blueprint"
- CTA: "If this resonated, click below to see if this is right for where you are."
- CTA personalization: Direct-address ad — use generic "your" CTA.

**AD #6 — Social Proof:**
- Trigger: "She Thought She Was Broken Too" — Recognition. Seeing yourself in someone else's story.
- Hook structure: SO (Story-open)
- Hook structures NOT to use: Q, C, D (same restrictions)
- Overlay formula: DR — Direct statement
- Overlay hook: "She had the business, the freedom, the practice. She couldn't remember the last time she cried."
- Spoken hook: "Kasia had the business. The freedom. The spiritual practice."
- Gender for this ad: HER
- Proof type: Named testimonial: "Kasia" (had the business, the freedom, the practice — couldn't cry)
- Trigger phrases MUST appear: "she wasn't broken", "safe enough to be felt"
- CTA: "If something in her story landed — click below. Let's talk about what's possible for you."
- CTA personalization: Story-based — bridge from her story to viewer ("If her story sounds familiar...")

**VOICE:** Luna Lauren — warm authority, somatic practitioner, consent-first language, safety-before-strategy
**QUALITY BAR:** Gold standard ads are the benchmark.
**3-SECOND RULE:** Direct identification. No greetings. Pattern interrupt or emotional hook immediately.
**VOICE FIDELITY:** Luna speaks from embodied experience. No clinical language. No coaching jargon. Every line should sound like something she'd say to a woman sitting across from her.

---

## PRE-FLIGHT CHECKLIST

Run BEFORE launching writer agents. ALL must pass.

| # | Check | Fail Action |
|---|-------|-------------|
| 1 | All 7 assignment cards generated? | Generate missing cards |
| 2 | Each card has exactly 2 ads assigned? | Rebalance |
| 3 | No hook structure code appears more than 2x across all 14? | Reassign |
| 4 | Named testimonial count ≤ floor(14/3)? | Reduce, replace with anonymous |
| 5 | No single name appears more than floor(14/3) times? | Redistribute |
| 6 | CTA text matches funnel type from Phase 1? | Fix before launch |
| 7 | Each card has 2-3 trigger phrases marked MUST-APPEAR? | Extract from Phase 2 |
| 8 | Overlay formula assigned to each ad? No formula code more than 3x? | Assign from OVERLAY HEADLINE FORMULAS table |
| 9 | Overlay hook text DIFFERENT from spoken hook on every card? | Rewrite one — they serve different functions |
| 10 | Gender assigned to each ad (if multi-gender avatar)? Balanced HIM/HER rotation? | Assign and balance across 7 writers |
| 11 | CTA personalization note on each card? (story-bridge vs. generic) | Add based on hook type + proof type |
| 12 | All reference files loaded (AD SYSTEM + gold-standard-ads)? | Load them |
| 13 | Voice instructions match mode (<your-name> vs. client)? | Fix |
| 14 | 3-second rule reminder on every card? | Add it |
| 15 | Voice fidelity note on every card? | Add client voice description |
| 16 | Overlay word count ≤ 12 on every card? | Shorten any over 12 words |
| 17 | Proof type labeled correctly (Named real / Anonymous real / Fictional)? | Label per Fictional Proof Disclosure rules |

Present the distribution plan to the user before launching writers:

```
╔═══════════════════════════════════════════════════════════════════╗
║                   FOREMAN DISTRIBUTION PLAN                       ║
╠═══════════════════════════════════════════════════════════════════╣
║ Hook structures: [2Q, 2S, 2C, 2P, 2SO, 2D, 2M]                  ║
║ Overlay formulas: [distribution across 14 — e.g., 3HW, 3SS, etc]║
║ Gender rotation: [HIM ads #list / HER ads #list — or N/A]        ║
║ Named testimonials: [X] in ads #[list]                            ║
║ Anonymous archetypes: [list with descriptors + gender]            ║
║ CTA: "[locked CTA text]"                                         ║
║ CTA variants: [if any, with ad assignments]                      ║
║ CTA personalization: [story-bridge ads #list / generic ads #list] ║
╚═══════════════════════════════════════════════════════════════════╝
```

Ask: "Distribution looks right? Or want to adjust before I launch the writers?"
