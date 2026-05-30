# First-Run Setup

This module runs once when no voice profile is detected at `~/.claude/references/voice-profiles/[username]/[username]-email.md`. It walks the user through a welcome tour, a 12-question voice training interview (3 rounds of 4), an optional OO/PM upsell, Voice DNA generation, cadence setup, and counsel introduction. After completion, the core engine proceeds to the welcome screen. The profile it creates follows the gold-standard email template's **Part 0 — Skill Core** (stable §0.x headers).

---

## Tour

Display this welcome banner:

```
============================================================
       WELCOME TO THE DAILY EMAIL DIGEST
============================================================

This skill helps you write emails that sound like YOU — not
like AI. You'll get a 3-person advisory counsel that reviews
every draft, a Voice Foreman that catches AI patterns, and
access to proven email frameworks at 3 levels.

Before we start, I need to learn your voice.
============================================================
```

---

## Voice Training Interview (12 Questions, 3 Rounds of 4)

Present each round using AskUserQuestion where indicated. Use RPG-style framing for each round header. Collect all answers for Voice DNA assembly in Section 5.

### Round 1 — Foundation (Q1-Q4)

Display: *"Round 1 of 3: Building your character sheet. Let's lay the foundation."*

**Q1:** "What's your name and how do you sign your emails?"
- Open text. Extracts: Identity > Name, Identity > Sign-off style.

**Q2:** "Who is your audience? Describe your ideal reader in 1-2 sentences."
- Open text. Extracts: Identity > Audience.

**Q3:** "What do you sell or offer? List your 1-3 main offerings with price ranges."
- Open text. Extracts: Offerings section.

**Q4:** "What's your niche/industry and what transformation do you deliver?"
- Open text. Extracts: Identity > Niche.

After Q4, display: *"Great, your foundation is set. Now let's get into the texture of your voice."*

### Round 2 — Voice DNA (Q5-Q8)

Display: *"Round 2 of 3: Extracting your Voice DNA. This is where it gets personal."*

**Q5:** "How would you describe your writing energy? Pick 3 adjectives."
- AskUserQuestion with multiSelect. Options:
  - Bold/Direct
  - Warm/Conversational
  - Playful/Witty
  - Vulnerable/Raw
  - Professional/Polished
  - Spiritual/Reverent
  - Dark/Edgy
  - Nurturing/Gentle
- Extracts: Voice DNA > Energy.

**Q6:** "How do you typically open an email?"
- AskUserQuestion with single-select. Options:
  - Story drop
  - Question/hook
  - Bold statement
  - Casual greeting
- Extracts: Voice DNA > Opening style.

**Q7:** "What's your relationship to selling in emails?"
- AskUserQuestion with single-select. Options:
  - Hard sell (direct CTA)
  - Soft sell (value first, gentle CTA)
  - Mostly value (rarely sell)
  - Mixed (depends on email)
- Extracts: Voice DNA > Selling philosophy.

**Q8:** "Paste 3-5 phrases you use ALL the time in your writing. Your signature moves."
- Open text. Extracts: Voice DNA > Signature phrases.

After Q8, display: *"Your voice is coming through. One more round — the guardrails that keep it real."*

### Round 3 — Guardrails (Q9-Q12)

Display: *"Round 3 of 3: Setting your guardrails. What sounds like you — and what never will."*

**Q9:** "What phrases or patterns feel FAKE to you? What would your audience cringe at?"
- Open text. Extracts: Guardrails > NEVER say.

**Q10:** "Which of these do you use in your writing?"
- AskUserQuestion with multiSelect. Options:
  - Humor
  - Profanity
  - Spiritual language
  - Pop culture references
  - Gaming metaphors
- For each selected item, follow up: "What style/level?" (e.g., humor: dry/sarcastic/playful; profanity: light/heavy/strategic).
- Extracts: Voice DNA flavor fields (Humor, Profanity, Spiritual language, Pop culture references, Gaming metaphors).

**Q11:** "How do you typically end emails? What's your sign-off ritual?"
- Open text. Extracts: Voice DNA > Closing ritual.

**Q12:** "Do you use PS sections? If so, what for?"
- AskUserQuestion with single-select. Options:
  - Tease next email (open loop)
  - Bonus CTA / second offer
  - Personal note / vulnerability
  - I don't use PS sections
- Extracts: Voice DNA > PS strategy.

---

## OO/PM Upsell

After Q12, present:

```
Your voice profile is taking shape. Want to go deeper?

If you've run an Offer Optimizer or Propaganda Machine
(or have similar offer positioning docs), uploading them
to your project knowledge gives me your belief architecture,
content angles, and offer language.

  [Upload now] — I'll extract what I need
  [Skip] — My voice profile is enough for now
```

Use AskUserQuestion with options: "Upload now", "Skip".

**If Upload now:**
- Accept the uploaded OO/PM file(s).
- Extract: core beliefs, transformation promise, content angles, offer language, audience pain points.
- Merge extracted data into the profile under `## 0.9 Source Context`.

**If Skip:**
- Acknowledge and proceed. The `## 0.9 Source Context` section will remain empty in the voice profile.

---

## Voice DNA Generation

Assemble all interview answers into the Part 0 §0.x structure from `reference/voice-dna-template.md`:

1. Map Q1 answers to §0.1 Identity & Pillars > Name and Sign-off style.
2. Map Q2 to §0.1 Identity & Pillars > Audience.
3. Map Q3 to §0.2 Offerings (each offering with price range).
4. Map Q4 to §0.1 Identity & Pillars > Niche.
5. Map Q5 to §0.4 Voice DNA > Energy (the 3 selected adjectives).
6. Map Q6 to §0.4 Voice DNA > Opening style.
7. Map Q7 to §0.4 Voice DNA > Selling philosophy.
8. Map Q8 to §0.5 Signature Phrases.
9. Map Q9 to §0.6 Guardrails MANIFEST (NEVER items).
10. Map Q10 follow-ups to §0.4 Voice DNA flavor fields (Humor, Profanity, Spiritual language, Pop culture references, Gaming metaphors — each yes/no with style/level).
11. Map Q11 to §0.4 Voice DNA > Closing ritual.
12. Map Q12 to §0.4 Voice DNA > PS strategy.
13. If OO/PM was uploaded, populate §0.9 Source Context with extracted beliefs, transformation promise, content angles, offer language, and audience pain points.

Present the assembled Voice DNA to the user:

"Here's your Voice DNA. Anything feel off or missing?"

Allow the user to request adjustments. Apply any changes they specify. When confirmed, save the final voice profile to:

`~/.claude/references/voice-profiles/[username]/[username]-email.md`

Create the directory if it does not exist. Replace `[username]` with the name extracted from Q1 (lowercase, hyphenated) — used for BOTH the folder and the filename. For <your-name>, this resolves to `~/.claude/references/voice-profiles/<your-username>/<your-username>-email.md`.

---

## Cadence Setup

After the voice profile is confirmed, present the default 4-day cadence:

```
Your default email schedule:

  Monday    — Motivational (fire up the week)
  Wednesday — Wisdom (deeper teaching)
  Friday    — Fearless (bold challenge)
  Sunday    — Reflections (integrate the week)
```

Ask via AskUserQuestion: "Want to keep this schedule, or remap to different days?"
- Options: "Keep this schedule", "Remap days"

**If Keep:** Store the default cadence under `## 0.3 Email Cadence` in the voice profile.

**If Remap:** Ask which days they want for each email type, then store the custom cadence under `## 0.3 Email Cadence` in the voice profile.

---

## Counsel Introduction

Display:

```
Your email counsel (3 advisors who review every draft):

  Laura Belgray  — Voice & personality
  Andre Chaperon — Story arc & empathy
  Chase Diamond  — Structure & conversion

You can swap any counselor anytime by saying "swap [name]".
Ready to write your first email?
```

Then display the welcome screen (Paths A-E) from the core engine to begin normal operation.
