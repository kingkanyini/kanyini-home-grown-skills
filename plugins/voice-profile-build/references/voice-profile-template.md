# Voice Profile MD — Standard Output Template

The voice profile MD has **24 standard sections** + 2 meta sections (Source Forensics + Character Intake Card), in this exact order. The 6-field Character Intake Card is the final non-negotiable section.

Every voice profile saved at `~/.claude/references/voice-profiles/[slug]-voice.md` should mirror this structure. Reference exemplars: `exemplar-one-voice.md`, `exemplar-two-voice.md`.

---

## Section Order

| # | Section header | Driven by | Contents |
|---|----------------|-----------|----------|
| 1 | `# Voice Profile — [Full Name]` | — | Title |
| 2 | `## Source Materials` | Orchestrator | Bullet list of every recon file (file paths, char counts, source type), date created, synthesis method |
| 3 | `## Charisma Code Breakdown` | Halbert | 3-row table — Energetic / Trust / Authority — with mode + effect; Composite archetype line; "For (apex tier)" audience line; **Activation Phrase** (3 words) |
| 4 | `## ICA — 3-Tier Pyramid` | Halbert + Stefan | Tier 1 (top-of-funnel) / Tier 2 (mid-tier offer) / Tier 3 (apex) — each with audience size, demographics, filter criteria, funnel touchpoint, trigger to enter orbit. Plus "The KEY insight" — operational implication |
| 5 | `## Content Formula` | Stefan | 3-step formula (e.g., "Diagnose → Bridge → Activate," "Survive → Witness → Sovereign"). What each step does + how to close |
| 6 | `## Energy & Delivery` | Bencivenga + Halbert | Pacing (spoken / written), voice register, tone, trust mechanism, trigger for mode-switch |
| 7 | `## AVOID List (What [Name] Would Never Do)` | Halbert + Bencivenga | 15-25 bullet items — phrases / patterns / words to never use. Cross-check against `~/.claude/CLAUDE.md` AI-isms ban list |
| 8 | `## Content Mix (estimated from corpus)` | Stefan | Percentage breakdown — e.g., "60% diagnostic teaching, 25% confessional, 10% offers, 5% interludes" |
| 9 | `## Voice DNA` | Bencivenga | 15-row table — Dimension / Pattern. Sentence length (spoken + written), tone, rhythm, master verbs, capitalization, punctuation, pronoun behavior, numbering, style tics, specificity index, filler words, cultural register markers |
| 10 | `## Signature Phrases (verbatim, from corpus)` | Stefan | Sub-headings: The Bridge / Trinity-Stack / Diagnostic Hooks / Mechanism Statements / Inverse-as-Medicine / Scripted Affirmations / CTAs / Closes / Vocabulary Clusters (8-10 clusters) |
| 11 | `## What [Name] WOULD Say / WOULD NEVER Say` | Halbert | 15-25 row table — verbatim contrasts |
| 12 | `## Brand Values (Voice Anchors)` | Halbert | 5-7 named anchors, each one short paragraph |
| 13 | `## Main Argument` | Halbert | Single sentence (3 drafts attempted, strongest picked). Plus "or in their own verbatim words" version |
| 14 | `## Tonal Modes (with mode-switch triggers)` | Halbert | 5-8 row table — Mode / Trigger / Verbatim signature. Plus the "unmistakable fingerprint" mode-switch identified |
| 15 | `## The [Signature Mechanic]` | Stefan | Their THE move — Exemplar One's bedroom→boardroom bridge, Exemplar Two's Trinity-Stack. What it does (compliance armor / counter-positioning / fingerprint) + construction template |
| 16 | `## Counter-Positioning (the [domain] spectrum)` | Kyle | ASCII spectrum diagram with their lane named. Plus "The lane no one else owns" + "Who they are NOT" list |
| 17 | `## Compliance Move Inventory` | Kyle | If category is regulated (psychedelics, finance, health, sex, food/supplements). Numbered list of every linguistic shield with verbatim phrases. Skip section entirely if category is unregulated |
| 18 | `## Reusable Voice Templates` | Stefan | MACRO 6-beat (long-form) / MICRO 5-7-beat (single point) / IG Caption Template / Brand-Voice Template / Email Template (if observed) — all with verbatim slot examples |
| 19 | `## Channel Notes` | Kyle | Per-channel notes: YouTube / Instagram / LinkedIn / website / podcast guesting / email-and-sales-letter voice. Mark which are observed vs. inferred |
| 20 | `## Brand Voice vs. Personal Voice Gap` | Stefan + Bencivenga | The cleanest split in their corpus. Two registers operate. What's IN one but not the other. Implication for ghostwriting |
| 21 | `## IG-Native Register (short-form voice)` | Kyle | What's IN long-form that's NOT in IG, and vice versa. Asymmetry pattern |
| 22 | `## The Single Underused-By-Them Move` | Kyle | What they do once that's brilliant; if they did it more, it'd compound. Name it |
| 23 | `## The Vault (privacy-as-operational-discipline)` | Halbert | What they sand off / lock vault: family members, specific employers, charlatans by name, etc. Why. Important for ghostwriting ethics |
| 24 | `## 10-Point Voice Verification Checklist` | Orchestrator | 10 checkboxes ghostwriters must verify before delivering content. Plus 3-5 "Bonus checks for written brand-voice" if applicable |
| 25 | `## Source Forensics — Methodology Note` | Orchestrator | Lists each counsel member + their lens. Lists corpus strength by source. Lists open gaps to close before voice profile lock |
| 26 | `## Character Intake Card (CoS Format)` | Orchestrator (distilled from all 4 agents) | **NON-NEGOTIABLE FINAL SECTION.** 6 fields: Tagline / Character Type / Core Flaw / Polarity / Origin Story / Backstory. Each preceded by italic field-purpose comment. See `commands/voice-profile-build.md` Phase 5 for distillation rules |

---

## Section Notes

### Section ordering rationale

- **Sections 1-2** establish the artifact and provenance.
- **Sections 3-5** are the high-level identity (who they are, who they serve, how they teach).
- **Sections 6-9** are the granular voice mechanics.
- **Sections 10-14** are the ghostwriter's working library (phrases, contrasts, values, argument, modes).
- **Sections 15-22** are positioning and channel-specific guidance.
- **Section 23** is privacy ethics.
- **Section 24** is the QA gate.
- **Section 25** is methodology + open gaps.
- **Section 26** is the compact CoS-format card derived from everything above.

### Sections that MAY be omitted

- **Section 17 (Compliance Move Inventory)** — only include if their category is regulated. For most coaches/teachers, omit.
- **Section 21 (IG-Native Register)** — only include if IG corpus exists. Otherwise note as open gap in Section 25.

### Sections that are NEVER omitted

Sections 1, 2, 3, 4, 5, 7, 9, 10, 11, 12, 13, 14, 18, 24, 25, **26**.

The 6-field Character Intake Card (Section 26) is **always present**.

---

## Date format inside the MD

Use ISO `YYYY-MM-DD` everywhere. Example: `2026-05-06`.

The "Date Created" field in Section 2 is the synthesis date, not the corpus collection date.

---

## File naming

`~/.claude/references/voice-profiles/[slug]-voice.md`

Where `[slug]` = lowercase, hyphenated full name. Examples:
- "Exemplar One" → `exemplar-one-voice.md`
- "Exemplar Two" → `exemplar-two-voice.md`
- "example-contact example-surname" → `example-contact-example-surname-voice.md`

---

## Recon project folder

`~/.claude/projects/[slug]-recon/transcripts/`

Examples:
- `~/.claude/projects/exemplar-one-recon/`
- `~/.claude/projects/exemplar-two-recon/`

Inside:
- `transcripts/yt-N-[short-source-name].txt` — YouTube transcripts
- `corpus-index.md` — index of every source with paths and char counts
- `press-research.md` — Perplexity research output (if run)
- `ig-captions.md` — IG captions extracted (if any)
- `brand-copy.md` — website / homepage / about page copy

---

## Quality bar reminders

- Verbatim quotes everywhere. Paraphrase = fail.
- Counts and quotes only. "Vibes" = fail.
- Single-instance observations get flagged as such (don't pretend they're patterns).
- Open gaps section honestly lists what wasn't observable in the corpus.
- The 6-field Character Intake Card gets user-approved BEFORE writing to file.