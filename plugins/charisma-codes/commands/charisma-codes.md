---
description: Discover your unique Charisma Code (Energetic + Trust + Authority) using McCall Jones' framework with breathwork, RPG-style discovery, and wrong-style diagnostics
---

# Charisma Codes

---

## Ethics & Framework Credit

This skill is an **interactive application** of McCall Jones' Charisma Styles framework. We study and adapt her system with deep respect — this is not a copy, it is a coaching tool built on her foundational work.

**Framework Creator:** McCall Jones (Charisma Styles)
**Design Principle:** PDF as Skeleton, <your-name> as Icing — the framework definitions, characteristics, consequences, and flow order stay tight to McCall's original system. <your-name>'s teaching style (breathwork, gaming metaphors, RPG framing, coaching voice) is layered on top. We never alter the underlying system; we enhance the delivery.

**The Golden Rule:** McCall Jones should feel honored by how we apply her work. If she saw this skill in action, she should see her framework treated with precision and credited clearly — enhanced by <your-name>'s unique coaching voice, not diluted or misrepresented.

**<your-name>'s coaching voice is centered throughout** — his breathwork, his gaming language, his authentic application. The goal is AUTHENTICITY, not persona manipulation. This tool helps people discover who they already ARE on camera, not construct a fake character.

**Ethics Check (start):** This skill studies and adapts McCall Jones' framework. Language is framed as application, not copying. The user's authentic expression is the goal. The Golden Rule is satisfied.

---

## Counsel: Charisma Hackers (Registry #4)

This skill uses the **Charisma Hackers** counsel. All three members speak as NPCs with distinct voices:

- **McCall Jones** — Framework creator. Validates ALL framework accuracy — style definitions, consequence matrices, diagnostic logic. Her word is final on anything framework-related. NPC voice: warm but precise, like a master class instructor. "Let me be clear about what this style actually means..."

- **Steve Jobs** — UX experience. Validates flow, simplicity, and user delight. Challenges anything that feels clunky or over-engineered. NPC voice: cuts to essence. "Here's the thing... if you need to explain it, you've already lost them."

- **Greg Hogg** — AI efficiency. Validates that the skill runs clean — no redundant steps, no wasted tokens, no circular logic. NPC voice: direct and technical. "Let's optimize this. You're running the same check twice."

**When the counsel appears:**
- **Pre-Camera Prep, Party Selection step (Menu 2, Step 4)** — Counsel delivers prep advice in their NPC voices
- **On request** — Any time the user asks for a counsel review or second opinion
- **NOT during Phase 4 reveal** — The Character Sheet and On-Camera Blueprint speak for themselves. Counsel is available if requested but does not auto-appear during the reveal.

---

## Storage & Resume Check

**Storage path:** `~/.claude/projects/[username]-charisma-codes/`

**Files:**
- `[username]-charisma-code.md` — The user's saved Charisma Code, named by their chosen username/handle. Contains styles, allies, diagnostic results, on-camera blueprint, and timestamp.
- `prep-sessions/[date]-prep.md` — Individual pre-camera prep session logs with breathwork completed, cheat sheet generated, and counsel advice given

**On launch (EVERY TIME):**
1. Use the Glob tool to scan `~/.claude/projects/*-charisma-codes/*-charisma-code.md` for any existing saved codes.
2. If saved code(s) are found, read the file(s) and note the user's existing Charisma Code(s).
3. Inform the user: "Welcome back! I found your saved Charisma Code: **[CODE]** for **[username]** (discovered [date])."
4. Offer to load it (which enables Menu 2 and Menu 3 immediately) or start fresh.
5. If NO saved code is found, proceed normally — Menu 2 and Menu 3 will note that a saved code is required.

---

## Breathwork

### Guard-Dropper Breathwork (ACTIVE)

**Technique:** Box breathing — 4-count inhale, 4-count hold, 4-count exhale, 4-count hold. 3 rounds.
**RPG Frame:** "Drop your armor at the gate."
**Purpose:** Drop the performative mask so the user's authentic style emerges during discovery. This is NOT optional for the discovery flow — it runs before every discovery path.

Present as guided instruction in a code block for clean formatting:

```
Close your eyes. We're going to drop the armor before we discover what's underneath.

Round 1:
  Breathe IN... 2... 3... 4...
  HOLD... 2... 3... 4...
  Breathe OUT... 2... 3... 4...
  HOLD... 2... 3... 4...

Round 2:
  Breathe IN... 2... 3... 4...
  HOLD... 2... 3... 4...
  Breathe OUT... 2... 3... 4...
  HOLD... 2... 3... 4...

Round 3:
  Breathe IN... 2... 3... 4...
  HOLD... 2... 3... 4...
  Breathe OUT... 2... 3... 4...
  HOLD... 2... 3... 4...

Open your eyes. The mask is off. Let's meet the real you.
```

After the breathwork, proceed directly into discovery. The breathwork IS the transition — no additional confirmation needed. Momentum matters.

### Style-Matched Activation Breathwork (PLACEHOLDER)

These will be custom breathwork techniques matched to each Energetic style, used during Pre-Camera Prep to activate the user's specific energy signature before going on camera.

| Energetic Style | Technique Name | Steps | Purpose / Energy | Duration |
|----------------|---------------|-------|-----------------|----------|
| AMAZE | TBD | TBD | TBD | TBD |
| EXCITE | TBD | TBD | TBD | TBD |
| CHARM | TBD | TBD | TBD | TBD |
| PERFORM | TBD | TBD | TBD | TBD |
| IMPRESS | TBD | TBD | TBD | TBD |
| ROAR | TBD | TBD | TBD | TBD |

**Note:** <your-name> will provide these custom techniques. The skill is fully functional on day one using the Guard-Dropper breathwork for all prep sessions. When style-matched breathwork is added, Pre-Camera Prep will use the user's specific activation breathwork instead of (or in addition to) the Guard-Dropper.

---

## Title Screen & Main Menu

**RPG Frame:** "Character Select / New Game"

After performing the resume check and reading the framework reference file, present the title screen:

```
╔══════════════════════════════════════════════════════════════╗
║  CHARISMA CODES                                      ║
║  Decode Your On-Camera Superpower                            ║
╠══════════════════════════════════════════════════════════════╣
║  Framework: McCall Jones' Charisma Styles                    ║
║  Coach: <your-name> (Breath Master + Life Gamer)                 ║
║  Counsel: Charisma Hackers (McCall, Jobs, Hogg)              ║
╚══════════════════════════════════════════════════════════════╝
```

If a saved code was found during resume check, display it beneath the title screen:
```
  Saved Code: [ENERGETIC] / [TRUST] / [AUTHORITY] (discovered [date])
```

Then use AskUserQuestion with these options:

1. **Discover My Charisma Code** — "Full intake: breathwork + discovery + diagnostics + code reveal"
2. **Pre-Camera Prep** — "Breathwork + cheat sheet + celeb counsel (requires saved code)"
3. **Script Charisma Map** — "Map your code against a script — section-by-section style analysis (requires saved code)"
4. **View My Charisma Code** — "Quick reference card with your full code breakdown (requires saved code)"

**Note:** "Help / About" is always available via the automatic "Other" option.

**Routing logic:**
- If the user selects **Menu 2**, **Menu 3**, or **Menu 4** and NO saved code exists, respond: "You don't have a saved Charisma Code yet. Let's discover yours first!" and route them to Menu 1.
- If the user selects **Help / About** via Other, present the help/about card (see Menu: Help / About section below).

---

## Menu 1: Discover My Charisma Code

### Player Registration (BEFORE Phase 0)

**RPG Frame:** "Enter Your Player Name"

Before any discovery begins, ask for the user's name or handle. This is used for:
- Personalizing the entire flow (address them by name)
- Naming their save file (`[username]-charisma-code.md`)
- The Character Sheet header

Use AskUserQuestion:
- Question: "What name or handle should we put on your Character Sheet? (This is how your Charisma Code will be saved.)"
- Options:
  - "Use my real first name" — "I'll type it in" (user enters via Other)
  - "Use a handle/gamertag" — "Something I go by online or creatively"
  - "Use my social media name" — "My public brand name"

Store the name for use throughout the flow. Convert to a filename-safe format for the save file (lowercase, hyphens for spaces, no special characters): e.g., "SolKingKhan" → `solkingkhan-charisma-code.md`

### Reference & Ally Style (AFTER Player Registration, BEFORE Phase 0)

**RPG Frame:** "Choose Your Lens"

After the player name is set, ask how the user wants to identify styles throughout the ENTIRE flow. This choice propagates through discovery confirmation steps, Loot Drop ally selection, and the Character Sheet display.

Use AskUserQuestion:
- Question: "How do you want to identify and connect with your styles throughout the journey?"
- Options:
  - "Celebrities / Characters" — "Use real celebrities and fictional characters from McCall Jones' framework as reference points throughout discovery and for your ally squad."
  - "Custom Avatars" — "Use description-based matching during discovery and get custom avatar allies themed to YOUR world. No celebrity names."

**Store as `reference_style`** (celebrity or avatar) — this affects:
- Discovery confirmation steps (Phase 2): celebrity mirrors vs description-based comparisons
- Loot Drop ally selection (Phase 3.5): celebrity roster vs custom avatar generation
- Character Sheet display (Phase 4): whether Celebrity Mirrors lists appear
- Pre-Camera Prep (Menu 2): party member framing

**Hobbies Intake (BOTH paths — ask immediately after reference style is chosen):**

Regardless of whether the user chose Celebrities or Custom Avatars, ask about their interests. This personalizes the experience:
- **Celebrity path:** Interests help prioritize WHICH celebrities from McCall's roster to suggest first, and inform expanded suggestions when "Ask McCall for more" is triggered.
- **Custom Avatar path:** Interests theme the avatar allies and style descriptions to the user's world.

Use AskUserQuestion:
- Question: "Quick intake: What are your hobbies, enjoyments, favorite video games, or movies you love? (This helps me personalize your ally suggestions and style descriptions.)"
- Options:
  - "Gaming focused" — "RPGs, shooters, adventure games, etc."
  - "Movies/TV focused" — "Marvel, anime, sci-fi, drama, etc."
  - "Outdoors/Sports focused" — "Nature, athletics, competition, physical activities."
  - "Creative/Music focused" — "Art, music, writing, building, creative expression."

**Store the theme** for use in ally selection (both paths), avatar generation (avatar path), and description-based framing throughout the flow.

### Phase 0 — Choose Your Quest Path

**RPG Frame:** "Choose Your Quest Path"

Present the following narrative before the choice:
"Every adventurer discovers their abilities differently. Some study the ancient texts. Some look inward. Some let the world tell them. And the wisest? They combine all three."

Use AskUserQuestion with these 4 path options:

1. **Quiz** — "Targeted questions, auto-matched to your style. Best if you like structure."
2. **Self-Select** — "Browse all styles and their celebrity mirrors, pick what resonates. Best if you're self-aware."
3. **AI-Assisted** — "Describe how you show up on camera in your own words. Claude maps it to the framework. Best for natural conversation."
4. **Hybrid** — "Quick self-assessment + AI confirmation + diagnostic. Best of all worlds. (Recommended)"

Store the selected path for use throughout all three discovery sub-phases. All 4 paths converge on a proposed Charisma Code that enters the diagnostic phase (Phase 3).

---

### Phase 1 — Guard-Dropper Breathwork

**RPG Frame:** "Drop your armor at the gate."

Before ANY discovery path begins, run the Guard-Dropper Breathwork from the Breathwork section above. Present the full guided instruction. This is mandatory — do not skip it, do not abbreviate it.

After the breathwork completes, proceed directly to Phase 2. The breathwork IS the transition — do not add an extra "Ready?" confirmation.

---

### Phase 2 — Discovery

Discovery runs through three sequential sub-phases, one per Charisma dimension. Always process in this order: **Energetic first, Trust second, Authority third.** Each sub-phase ends with a proposed style for that dimension.

Read the framework reference file's characteristics tables and celebrity mirrors to inform all matching logic. Do NOT hardcode style descriptions in your responses — pull from the reference file so updates propagate automatically.

---

#### Sub-Phase 2.1: Energetic Style (6 types: AMAZE, EXCITE, CHARM, PERFORM, IMPRESS, ROAR)

**RPG Frame:** "Ability Check: What energy do you bring to the battlefield?"

**QUIZ Path:**
Present 6 questions using AskUserQuestion, one at a time. After each answer, store the response for final mapping.

**Q1 — Pitch (voice range):**
Narrative: "When the bard speaks, the tone tells the tale. Let's hear your natural range."
Question: "When you're excited about something on camera, your voice tends to..."
Options:
- "Go high and bright — treble and mid range (T+M)"
- "Cover the full range — high to low naturally (All)"
- "Stay deep and resonant — mid and low range (M+L)"

**Q2 — Pacing (speed):**
Narrative: "Speed reveals intent. The rogue dashes, the mage deliberates."
Question: "Your natural speaking pace on camera is..."
Options:
- "Fast — I move through ideas quickly"
- "Medium — steady and deliberate"
- "Slow — I let words land with weight"

**Q3 — Emphasis (how you hit key points):**
Narrative: "Every warrior has a signature strike. How do you land your points?"
Question: "When making a key point, you naturally..."
Options:
- "Hit words hard, percussive — like a drumbeat"
- "Slow down and add weight — let gravity do the work"
- "Change my pitch dramatically — the melody shifts"
- "Mix pace changes and pitch changes — varied attack"

**Q4 — Arms (physicality):**
Narrative: "Your body tells a story even when your mouth stops. What does yours say?"
Question: "Your arm movements on camera tend to be..."
Options:
- "Big, expansive gestures — I take up space"
- "Fluid, flowing movements — smooth and continuous"
- "Small, controlled movements — precise and contained"
- "Sharp, precise gestures — punctuating my words"

**Q5 — Face (expressiveness):**
Narrative: "The face is the HUD display of the soul. How much data does yours broadcast?"
Question: "Your facial expressions on camera are..."
Options:
- "Large — very expressive, you can read me from the back row"
- "Medium — naturally animated but not over the top"
- "Subtle — understated, my eyes do most of the talking"

**Q6 — Energy (overall vibe):**
Narrative: "This is the big one. When you step onto the stage — or hit that record button — what energy fills the room?"

**Adaptive Q6:** Use the user's Q1-Q5 answers to narrow down the top 3 most likely Energetic styles from the Physical Characteristics table. Present those 3 as AskUserQuestion options plus "None of these — something different." If they select "None," present the remaining 3 styles. This is smarter than a fixed split — it adapts to what they've already told you.

Question: "Based on what you've shared, the energy you bring on camera is closest to..."
Options: [Top 3 styles with one-line descriptions] + "None of these — something different"

After all 6 answers, map responses to the closest Energetic style. Use Q6 as the primary signal and Q1-Q5 as confirmation/tiebreakers. Announce: "Based on your answers, your Energetic style is likely **[STYLE]**."

**SELF-SELECT Path:**
Present all 6 Energetic styles with their celebrity mirrors from the framework reference file. Format as a clear list:

For each style, show: Style name, a one-line energy description, and the celebrity mirrors.

Use AskUserQuestion with 6 options (one per style) — let the user pick the one that resonates most. If they are torn between two, note both and use the diagnostic phase to resolve.

**AI-ASSISTED Path:**
Present this prompt: "Forget the categories for a second. Just describe how you show up on camera — your energy, your movements, your voice, the vibe you bring. Talk naturally, like you're telling a friend."

After the user responds, map their description to the Physical Characteristics table from the framework reference file. Look for keyword matches: pitch indicators, pacing cues, emphasis style, arm/gesture descriptions, facial expressiveness, and overall energy. Announce your mapping with reasoning: "Based on what you described, I'm mapping you to **[STYLE]** because [specific reasons tied to their words]."

**HYBRID Path (Recommended):**
Ask only Q6 (the energy question) from the Quiz path.

**Energetic Style Display (6 styles, 4-option limit):** Since AskUserQuestion allows max 4 options, split the 6 Energetic styles across two batches:

- **Batch 1:** Present the first 3 styles (AMAZE, EXCITE, CHARM) + a 4th option: "More styles / Ask Claude" with description: "See PERFORM, IMPRESS, and ROAR — or have Claude interview you."
- **If "More styles / Ask Claude" is selected:** Present **Batch 2** with the remaining 3 styles (PERFORM, IMPRESS, ROAR) + "Ask Claude" with description: "Have Claude interview you to understand your energy more deeply." Also include a "Go back to first 3" option.
- **If "Ask Claude" is selected (from either batch):** Switch to AI-Assisted mode for this dimension only — ask the user to describe their energy in their own words, then map it.

**Outcome Hint (MANDATORY on all Hybrid questions):** Every AskUserQuestion in Hybrid mode must include an outcome-framing hint, either in the question text or as a parenthetical. Examples:
- Energetic: "(Choose the energy that makes the biggest impact when you walk into a room or hit record.)"
- Trust: "(Choose the one that actually makes people trust you — the outcome, not just what sounds nice.)"
- Authority: "(Choose the one that authentically gets people to take action.)"
This prevents users from picking aspirationally instead of authentically.

**Confirmation Step (adapts to `reference_style`):**

After their initial style selection, confirm with a comparison between the selected style and one adjacent style:

- **If `reference_style` = celebrities:** Present the celebrity mirrors for the top 2 matching styles using AskUserQuestion. Include an "Ask Claude" option. Let them confirm or pick between the two.
- **If `reference_style` = custom avatars:** Present description-based comparisons for the top 2 matching styles — use the decoded physical characteristics and energy descriptions (pitch, pace, emphasis, gestures, expression, overall vibe) instead of celebrity names. Include an "Ask Claude" option. Let them confirm or pick between the two.

After Sub-Phase 2.1 completes, announce the proposed Energetic style and proceed to Sub-Phase 2.2.

---

#### Sub-Phase 2.2: Trust Style (3 types: FIX, STEADY, MIRROR)

**RPG Frame:** "Ability Check: How do you earn trust on the battlefield?"

**QUIZ Path:**
Present 3 questions using AskUserQuestion, one at a time.

**Q1 — Focus (what you zero in on):**
Narrative: "A healer, a guardian, and a seer walk into a tavern. Someone is hurting. Who are you?"
Question: "When you help someone with a problem, what do people respond to most?"
Options:
- "Your clear action plan — they know what to DO next (FIX)"
- "Your safe presence — they can finally FEEL and exhale (STEADY)"
- "Your reflection — they feel truly seen and UNDERSTOOD (MIRROR)"

**Q2 — Delivery (communication texture):**
Narrative: "The message matters, but the delivery is the spell that makes it land."
Question: "Your natural communication style is..."
Options:
- "Matter of fact — direct and clear, no sugarcoating"
- "Soft — gentle and careful, creating safety"
- "Expressive and reactive — animated and responsive"

**Q3 — Trust building (why people trust you):**
Narrative: "Every NPC trusts you for a reason. What's yours?"
Question: "People trust you because..."
Options:
- "You give them a clear action plan — they know what to do next (FIX)"
- "You make them feel safe and held — they can exhale around you (STEADY)"
- "You truly see and reflect them — they feel understood (MIRROR)"

After all 3 answers, map to Trust style using the Physical Characteristics table. Q1 and Q3 are the primary signals; Q2 confirms. Announce: "Based on your answers, your Trust style is likely **[STYLE]**."

**SELF-SELECT Path:**
Present all 3 Trust styles with their celebrity mirrors and a brief description of each style's focus and delivery. Use AskUserQuestion with 3 options.

**AI-ASSISTED Path:**
Present this prompt: "Think about a time someone really needed your help — a friend, a client, anyone. How did you naturally communicate with them? What was your instinct? Describe your approach."

Map their response to the Trust characteristics table. Announce with reasoning.

**HYBRID Path:**
Ask only Q1 (the focus question). **ALWAYS include an "Ask Claude" option** with description: "Have Claude interview you to understand more." Add a contextual note: "If you don't feel appreciated or struggle when helping others, select Ask Claude — your Trust style might be the key." If selected, switch to AI-Assisted mode for this dimension only.

**Outcome Hint:** Include in the question: "(Choose the one that actually makes people trust you — the outcome, not just what sounds nice.)"

**Confirmation Step (adapts to `reference_style`):**
- **If `reference_style` = celebrities:** Present the celebrity mirrors for the matching style plus one adjacent style. Include an "Ask Claude" option. Let them confirm via AskUserQuestion.
- **If `reference_style` = custom avatars:** Present description-based comparisons for the matching style plus one adjacent style — use the decoded physical characteristics (focus, delivery, pitch, pace, emphasis, gestures, expression) instead of celebrity names. Include an "Ask Claude" option. Let them confirm via AskUserQuestion.

After Sub-Phase 2.2 completes, announce the proposed Trust style and proceed to Sub-Phase 2.3.

---

#### Sub-Phase 2.3: Authority Style (3 types: LIGHT, LEAD, LIFT)

**RPG Frame:** "Ability Check: How do you command the room?"

**QUIZ Path:**
Present 3 questions using AskUserQuestion, one at a time.

**Q1 — Message focus (motivational approach):**
Narrative: "The general rallies the troops. But every general has a different speech."
Question: "When you're leading or motivating others, your message is..."
Options:
- "Trust the path — you're the bus driver. Everyone hop on, the route is clear! (LIGHT)"
- "Trust me — you're driving the car. Follow me, I know the way. (LEAD)"
- "Trust yourself — you support them driving the car. You believe they can steer. (LIFT)"

**Q2 — Testimonial style (how you share proof):**
Narrative: "Every legend needs a lore book. How do you tell your success stories?"
Question: "When sharing success stories or results, you tend to say..."
Options:
- "This path works for everyone — the system is proven (LIGHT)"
- "I've helped people avoid these mistakes — trust my experience (LEAD)"
- "People just like you have done this — you can too (LIFT)"

**Q3 — Authority vibe (overall presence):**
Narrative: "When you hold the scepter, what does the kingdom feel?"
Question: "Your authority vibe is closest to..."
Options:
- "Mad scientist or party promoter — infectious enthusiasm about the path (LIGHT)"
- "Assertive and direct — clear command, no ambiguity (LEAD)"
- "Warm cheerleader — empowering support, lifting others up (LIFT)"

After all 3 answers, map to Authority style using the Physical Characteristics table. All three questions are primary signals — look for consistency. Announce: "Based on your answers, your Authority style is likely **[STYLE]**."

**SELF-SELECT Path:**
Present all 3 Authority styles with their celebrity mirrors, focus description, testimonial style, and vibe. Use AskUserQuestion with 3 options.

**AI-ASSISTED Path:**
Present this prompt: "How do you naturally lead, motivate, or establish authority? When people follow you or buy from you, what is it about your approach that makes them say yes? Describe it naturally."

Map their response to the Authority characteristics table. Announce with reasoning.

**HYBRID Path:**
Ask only Q1 (the message focus question). **ALWAYS include an "Ask Claude" option** with description: "Have Claude interview you to understand more." If selected, switch to AI-Assisted mode for this dimension only.

**Outcome Hint:** Include in the question: "(Choose the one that authentically gets people to take action — the approach that creates real authority, not just what sounds impressive.)"

**Confirmation Step (adapts to `reference_style`):**
- **If `reference_style` = celebrities:** Present the celebrity mirrors for the matching style plus one adjacent style. Include an "Ask Claude" option. Let them confirm via AskUserQuestion.
- **If `reference_style` = custom avatars:** Present description-based comparisons for the matching style plus one adjacent style — use the decoded physical characteristics (message focus, testimonial style, vibe, pitch, pace, emphasis, gestures, expression) instead of celebrity names. Include an "Ask Claude" option. Let them confirm via AskUserQuestion.

---

#### Phase 2 Complete — Proposed Code Announcement

After all three sub-phases are complete, present the proposed Charisma Code:

```
╔══════════════════════════════════════════════════════════════╗
║  PROPOSED CHARISMA CODE                                      ║
╠══════════════════════════════════════════════════════════════╣
║  Energetic: [STYLE]                                          ║
║  Trust:     [STYLE]                                          ║
║  Authority: [STYLE]                                          ║
║                                                              ║
║  [ENERGETIC] / [TRUST] / [AUTHORITY]                         ║
╚══════════════════════════════════════════════════════════════╝
```

Then announce: "But we're not done yet. A proposed code is just a hypothesis. Time for the Boss Battle — let's stress-test this code against McCall's consequence matrices and make sure it's really YOU."

Proceed to Phase 3.

---

## Phase 3 — Wrong-Style Diagnostic (The Confirmation Engine)

**RPG Frame: "Boss Battle — Stress Test Your Code"**

Present the following RPG narrative before beginning the diagnostic:

> "Your proposed Charisma Code has been forged in the fires of discovery. But every code must survive the Boss Battle before it's real. Three bosses stand between you and your true Character Sheet. Each one tests whether your proposed style truly FITS — not by showing you what happens when you deviate, but by checking if the style itself causes friction. If using your proposed energy MOSTLY creates negative perceptions... you might be wearing someone else's armor. Let's find out."

**Core Diagnostic Principle — COLUMN-FIRST, ROW-CONFIRM:** Instead of reading across the proposed style's ROW (what happens when they use other styles), read down the proposed style's COLUMN (what happens when people who AREN'T that style try to use it). If the proposed style fits, using it should NOT consistently cause negative reactions. If it does, the user may be a different style.

**Execute the diagnostic for each dimension in this order: Energetic, then Trust, then Authority.** Each dimension is one "Boss Battle round."

---

### Diagnostic Round Structure (repeat for each dimension)

#### Step 1: Column Check — "Does the proposed style fit?"

Read down the proposed style's **COLUMN** in the corresponding consequence matrix from the **loaded framework reference file**. This shows what happens when people of EACH OTHER style try to use the proposed style. Skip the diagonal (you) cell.

**For Energetic (6 styles):** 5 checks needed (the 5 non-diagonal cells in the column). Present in **batches of 4** via AskUserQuestion, with a final batch for any remaining.

**For Trust (3 styles):** 2 checks needed. Present in **one batch**.

**For Authority (3 styles):** 2 checks needed. Present in **one batch**.

**Contextualize each consequence** to the candidate style it represents. Even if the same consequence word appears multiple times in the column (e.g., INSECURE appears 3x in the AMAZE column), frame each one differently:
- Each option describes the consequence + a brief description of WHY that specific other style would cause it
- Example: "INSECURE — my wonder reads as uncertain, like I'm not confident in the magic" (→ actually EXCITE) vs "INSECURE — the delight feels forced, like I'm overcompensating" (→ actually CHARM)

**Framing (CRITICAL):** Ask "When you bring [PROPOSED STYLE] energy, does it MOSTLY backfire in any of these ways?" — NOT "does it ever backfire." The word "mostly" filters for genuine style mismatches vs. occasional bad days.

**Consequence Flexibility Note (MANDATORY on every diagnostic batch):** Include this guidance before or within each batch: "These words are indicators, not insults. 'MEAN' might just mean 'misunderstood.' 'ARROGANT' might mean 'overcompensating.' Don't take them personally — but if a word creates a gut-level chemical reaction, that's a signal worth paying attention to."

**More Options Hint (MANDATORY for Energetic batches):** When presenting batch 1 of 2 for Energetic, include a note: "If none of these resonate, there are more options coming — stay in flow." This prevents users from force-picking when their actual consequence is in the next batch.

Each batch of AskUserQuestion options should include:
- The contextualized consequences (up to 4 per batch)
- A "None of these — [proposed style] energy lands clean" option

**5 NOs required to confirm Energetic. 2 NOs required to confirm Trust and Authority.** All checks must pass for a style to be confirmed.

#### RPG Narrative Per Boss

**Round 1 (Energetic):** "BOSS 1: The Shape-Shifter. This boss holds up a mirror while you wear your proposed armor. Does it fit... or does it pinch?"

**Round 2 (Trust):** "BOSS 2: The False Prophet. This boss tests whether your trust-building energy lands clean — or mostly causes friction."

**Round 3 (Authority):** "BOSS 3: The Shadow Commander. This boss tests whether your leadership signal is received clearly — or mostly misfires."

#### Step 2: Evaluate the Column Check

**CASE A — All NOs (style confirmed):**
The proposed style for this dimension is CONFIRMED. Using that energy does not consistently cause negative reactions — it fits. Announce: "Boss defeated. Your [DIMENSION] style holds firm: **[PROPOSED STYLE]**." Move to the next dimension.

**CASE B — Hit detected (potential mismatch):**
The user recognizes a consequence that MOSTLY happens when they use the proposed style. This means someone of a DIFFERENT style is trying to use the proposed style and it's causing friction.

**Trace the hit:**
1. Identify the consequence word they selected
2. Identify which row(s) in the column contain that consequence — each row represents a candidate "actual style"
3. If the consequence appears in multiple rows, note all candidates
4. Cross-reference with the user's earlier discovery answers to narrow candidates

Walk through the logic **transparently** with the user:

"Interesting. You said [CONSEQUENCE] mostly happens when you use [PROPOSED STYLE] energy. Let me trace this through McCall Jones' framework...

[CONSEQUENCE] in the [PROPOSED STYLE] column means a [CANDIDATE STYLE] person trying to use [PROPOSED STYLE] energy. This could mean you're actually **[CANDIDATE STYLE]**, not [PROPOSED STYLE].

Let me describe [CANDIDATE STYLE] for you: [read one-line description and celebrity mirrors from the framework reference file]."

#### Step 3: Row Check — "Double-click to confirm the pivot"

Take the candidate style and read across their **ROW** in the consequence matrix. This shows what happens when a person of THAT style uses every other style.

Present the row's consequences (excluding the diagonal and the column already tested) via AskUserQuestion. Include an **"All of the above"** option for efficiency.

Ask: "If you're actually [CANDIDATE STYLE], these should also ring true. Do any of these match your experience?"

**If multiple consequences from the candidate's row match (or "All of the above"):** Pivot confirmed. Announce: "Code updated. Your [DIMENSION] is now **[CANDIDATE STYLE]**." Store the pivot AND all recognized consequences as known traps for the Kryptonite section in Phase 4. Move to the next dimension.

**If the candidate's row does NOT match:** Check the next candidate (if the consequence appeared in multiple rows). If no candidates match, the original proposed style may still be correct despite the initial hit — present both options and let the user choose.

#### Step 4: Ambiguity Resolution

**If multiple candidate rows have equal hits:**
1. Acknowledge: "You're recognizing multiple patterns, which can happen — especially if you've been code-switching a lot on camera."
2. Prioritize the row where the user recognizes the MOST consequences. Two strong hits from one row beats one hit each from two rows.
3. Present the top 2 candidates with their one-line descriptions and celebrity mirrors
4. Use AskUserQuestion: "Which of these feels MOST like your natural default — not who you try to be, but who you are when you're not thinking about it?"
5. Accept the user's choice. Never force a result.

**If the user recognizes a consequence from a row that is NOT the proposed style AND NOT the traced candidate:**
This is an unusual case. Ask a clarifying question about the specific scenario, then present the most likely 2 styles and let the user choose.

---

### After All 3 Rounds

When all three dimensions (Energetic, Trust, Authority) have been confirmed or corrected, present the following:

> "All three bosses defeated. Your Charisma Code has been stress-tested through fire, reflection, and shadow. The code that remains is REAL — not a guess, not a wish, but a truth confirmed by what you already know about yourself."

Proceed immediately to Phase 3.5 (Loot Drop).

---

## Phase 3.5 — Ally Selection (Loot Drop)

**RPG Frame: "Loot Drop — Choose Your Allies"**

> "Before we unveil your Character Sheet, you've earned a reward. Every great hero has allies — characters who share their power signature. Time to choose yours."

**Squad-Building Frame (MANDATORY):** Present this analogy before ally selection begins:

> "You're assembling a 3-person squad, and the balance is built in. Your first ally covers your Energetic energy. Your second covers your Trust energy. Your third covers your Authority energy. You're not picking 3 warriors — you're building a healer, a tank, and a DPS. Each ally strengthens a different dimension of your on-camera presence."

**The user selects ONE ally per confirmed dimension.** Three rounds total (Energetic, Trust, Authority).

The user's `reference_style` (celebrity or avatar) and hobby `theme` (if avatar) were already collected during Player Registration. Use those stored preferences here — do NOT re-ask.

**Example avatar generation for STEADY + Creative/Music theme:**
- "The Rhythm Anchor" — like the bass line holding the track together
- "The Sanctuary Keeper" — creates the safe room where real art happens
- "The Sound Engineer" — makes everyone else sound their best

### Ally Selection (3 Rounds)

**Celebrity/Character Path:**
For each confirmed dimension:
1. Pull the celebrity mirror list for that style from the framework reference file
2. Filter and prioritize using the user's **stored hobby/interest theme** — favor celebrities from genres that match their interests (e.g., Movies/TV → characters from shows/films; Gaming → game-adjacent personalities; etc.). Also prioritize diverse representation across the selections.
3. Present 3 interest-aligned celebrities as AskUserQuestion options + a 4th option: **"Ask McCall for more"** with description: "Have McCall Jones suggest more options from her roster and beyond, aligned with your interests."
4. Add a brief description of WHY each celebrity mirrors that style's energy
5. The "Other" option is always available via AskUserQuestion for custom suggestions

**When "Ask McCall for more" is selected (Expanded Ally Protocol):**

Claude expands beyond McCall's fixed roster to find the right ally match:

1. **Present remaining roster options** — Show any celebrities from the framework list not yet presented, filtered by the user's interests.
2. **Expand beyond the roster** — Use the style's physical characteristics (pitch, pacing, emphasis, arms, face, energy vibe) to independently identify iconic celebrities/characters who embody the style but aren't on McCall's list. Prioritize diverse, iconic, recognizable figures aligned with the user's interests.
3. **Interview option** — Include an "Interview me first" option that asks the user about their favorite characters/public figures, then matches those suggestions against the style's characteristics.
4. **Cross-reference for framework integrity** — Any Claude-suggested ally must match the style's physical characteristics and energy description. Frame as: "McCall's framework describes [STYLE] energy as [characteristics]. [SUGGESTED ALLY] matches because [specific reasons]."

**Reclassify token for expanded suggestions:**
- **Claude-suggested allies** (from expanded search) are pre-validated against characteristics — the reclassify token is NOT consumed. Claude vouches for the match.
- **User-suggested allies** (via "Other") that are NOT in any framework list still require the reclassify token per the standard validation logic below.

**Custom Avatar Path:**
For each confirmed dimension:
1. Generate 4 custom avatar options themed to the user's hobby intake
2. Each avatar embodies the physical characteristics and energy of that dimension's style
3. Present as AskUserQuestion with descriptive names and one-line descriptions
4. The "Other" option is available for the user to suggest their own avatar name

### Reclassify Token

The user gets **ONE reclassify token** for the entire Loot Drop (across all 3 dimensions). This creates a meaningful game mechanic.

**For Celebrity/Character path — if the user suggests a celebrity via "Other":**
1. Check the celebrity against ALL style mirror lists in the framework reference file
2. **Celebrity IS in the correct style's list** → Approve immediately. "Great pick! [CELEB] is a confirmed [STYLE] mirror."
3. **Celebrity is in a DIFFERENT style's list** → RPG gate: "This ally belongs to a different class ([OTHER STYLE]). You have 1 reclassify token — want to use it to recruit [CELEB] as an honorary [CORRECT STYLE] ally?" Use AskUserQuestion: "Use reclassify token" / "Pick someone else from my roster"
4. **Celebrity is NOT in any framework list** → "I can't cross-reference [CELEB] in the framework yet. Want to use your reclassify token to recruit them, or pick from your mapped roster?" Use AskUserQuestion: "Use reclassify token" / "Pick from my list"
5. **Reclassify token already used** → "Reclassify token already spent. Pick from your [STYLE] roster." Re-present the style's mirror list.

**For Custom Avatar path:** The reclassify token applies when a user suggests a character/celebrity via "Other" that isn't in the framework. Same logic as above.

### After All 3 Allies Chosen

Display the assembled ally team:

```
╔══════════════════════════════════════════════════════════════╗
║  LOOT DROP — YOUR ALLY SQUAD                                 ║
╠══════════════════════════════════════════════════════════════╣
║  [ENERGETIC] Ally:  [Name] — [Style] Mirror                 ║
║  [TRUST] Ally:      [Name] — [Style] Mirror                 ║
║  [AUTHORITY] Ally:  [Name] — [Style] Mirror                 ║
║                                                              ║
║  Reclassify Token: [UNUSED / SPENT on [Name]]                ║
╚══════════════════════════════════════════════════════════════╝
```

> "Your allies are locked in. They'll appear on your Character Sheet and serve as your default prep party in Pre-Camera Prep. Time to meet your character."

**Store the chosen allies AND the ally style (celebrity vs avatar)** — both are saved to the Charisma Code file and used as defaults in Menu 2's Party Selection.

Proceed immediately to Phase 4.

---

## Phase 4 — Charisma Code Reveal

**RPG Frame: "CHARACTER UNLOCKED"**

Present the full Charisma Code reveal using the confirmed/corrected styles from the diagnostic phase.

### Reveal Card

Display the following formatted card. Fill in all bracketed fields from the confirmed Charisma Code.

**IMPORTANT — Ally Style Determines Display:**
- **If Celebrity/Character path:** Show "Your Ally" AND "Celebrity Mirrors" for each dimension.
- **If Custom Avatar path:** Show ONLY "Your Ally" for each dimension. Do NOT display Celebrity Mirrors lists — the user chose avatars specifically to avoid celebrity framing.

```
╔══════════════════════════════════════════════════════════════╗
║  CHARACTER UNLOCKED                                          ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  YOUR CHARISMA CODE:                                         ║
║  [ENERGETIC] + [TRUST] + [AUTHORITY]                         ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  ENERGETIC: [STYLE] — [one-line description]                 ║
║  Your Ally: [Chosen ally from Loot Drop]                     ║
║  [Celebrity Mirrors: [list] — ONLY if celebrity path]        ║
║                                                              ║
║  TRUST: [STYLE] — [one-line description]                     ║
║  Your Ally: [Chosen ally from Loot Drop]                     ║
║  [Celebrity Mirrors: [list] — ONLY if celebrity path]        ║
║                                                              ║
║  AUTHORITY: [STYLE] — [one-line description]                 ║
║  Your Ally: [Chosen ally from Loot Drop]                     ║
║  [Celebrity Mirrors: [list] — ONLY if celebrity path]        ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  COMPOSITE MIRROR                                            ║
║  [Build from chosen allies, not framework celebs.            ║
║   For avatar path: "You have the [description] of [ALLY 1],  ║
║   the [description] of [ALLY 2], and the [description] of    ║
║   [ALLY 3]."                                                 ║
║   For celebrity path: Find the celebrity that appears across  ║
║   the most dimensions, or craft a composite.]                ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  SUPERPOWER                                                  ║
║  [Synthesize what this specific 3-style combination does     ║
║   well on camera — draw from the strengths of all three      ║
║   styles and how they interact]                              ║
║                                                              ║
║  KRYPTONITE                                                  ║
║  [Wrong-style traps to avoid — pull from the diagnostic      ║
║   results, especially any consequences the user recognized   ║
║   in Phase 3. List 2-3 specific traps.]                      ║
╚══════════════════════════════════════════════════════════════╝
```

**One-line descriptions to use for each style in the reveal card:**

| Style | Description |
|-------|-------------|
| AMAZE | "Wonder and delight — you make people feel like kids again" |
| EXCITE | "High-voltage enthusiasm — you make people want to act NOW" |
| CHARM | "Magnetic warmth — you make people feel seen and drawn in" |
| PERFORM | "Full showtime presence — you command every room you enter" |
| IMPRESS | "Gravitas and substance — you make people lean in and listen" |
| ROAR | "Bold, powerful force — you make people feel ALIVE" |
| FIX | "Clear action plans — you give people a path forward" |
| STEADY | "Safe harbor — you make people feel held and secure" |
| MIRROR | "True reflection — you make people feel deeply understood" |
| LIGHT | "Infectious vision — you make the path irresistible" |
| LEAD | "Direct command — you give people the confidence to follow" |
| LIFT | "Empowering belief — you make people believe in themselves" |

### Composite Mirror Construction

To build the Composite Mirror line:

1. Check if any single celebrity appears in the celebrity mirror lists for 2 or more of the user's confirmed styles. If so, lead with that celebrity: "Your energy is closest to [CELEB] — they share your [STYLE 1] + [STYLE 2] combination."

2. If no single celebrity spans multiple dimensions, construct a composite statement: "You have the [ENERGETIC description] of [ENERGETIC celeb], the [TRUST description] of [TRUST celeb], and the [AUTHORITY description] of [AUTHORITY celeb]."

3. Keep it to 1-2 sentences. Make it feel like a compliment, not a clinical assessment.

### Superpower Construction

Synthesize a 2-3 sentence description of what this specific combination excels at on camera. Consider:
- How does the Energetic style set the emotional tone?
- How does the Trust style make the audience feel safe?
- How does the Authority style move the audience to action?
- What is unique about THIS combination that other combos don't have?

### Kryptonite Construction

Pull from the Phase 3 diagnostic results:
- Any consequences the user RECOGNIZED go here as their primary traps
- If they recognized no consequences (all "None of these"), list the most common trap for each of their styles (the consequence that appears most often in their row)
- Format as 2-3 specific, actionable warnings: "When you try to [wrong style behavior], your audience perceives you as [consequence]. Stay in your [correct style] lane instead."

---

### Treasure Chest Unlock: On-Camera Blueprint

**RPG Frame: "TREASURE CHEST UNLOCKED"**

Immediately after the reveal card, present the On-Camera Blueprint as a treasure chest reward. This is the ACTION-ORIENTED companion to the Character Sheet — the Character Sheet tells you WHO you are, the Blueprint tells you HOW to show up.

> "Your Character Sheet shows who you are. Now here's the treasure that tells you HOW to show up. This is your On-Camera Blueprint — a mapping to guide you to be your most authentic self on camera, attract the people meant for your highest level of fulfillment and success."

**Display TWO formats — sticky note first, full breakdown second:**

**A) THE STICKY NOTE (the activation card — what they see before hitting record):**

```
╔══════════════════════════════════════════════════════════════╗
║  TREASURE CHEST — ON-CAMERA BLUEPRINT                        ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ACTIVATION PHRASE:                                          ║
║  "[3 words, one per dimension — e.g., Wonder. Ground.        ║
║   Believe. for AMAZE/STEADY/LIFT. Match verb energy to       ║
║   styles. Examples: EXCITE/FIX/LEAD = Ignite. Solve.         ║
║   Command. CHARM/STEADY/LIGHT = Warm. Ground. Spark.]"       ║
║                                                              ║
╠══════════════════════════════════════════════════════════════╣
║  BODY: [decoded Energetic — voice pitch/pace + arms + face   ║
║         in one line]                                         ║
║  TRUST: [Focus + delivery in one line]                       ║
║  AUTHORITY: [Vibe in one line]                               ║
║  TRAP: [Top consequence to avoid]                            ║
╚══════════════════════════════════════════════════════════════╝
```

**B) FULL BREAKDOWN (reference material below the sticky note):**

Present a detailed breakdown with all physical characteristics for each dimension, decoded from shorthand:
- **Energetic:** Pitch, Pacing, Emphasis, Arms, Face
- **Trust:** Focus, Delivery, Pitch, Pacing, Emphasis, Arms, Face
- **Authority:** Focus, Testimonials, Vibe, Pitch, Pacing, Emphasis, Arms, Face
- **Danger Zones:** Top 2-3 wrong-style consequences from the diagnostic (prioritize consequences they recognized)

Present as a clean list format (not a box) — the sticky note is what they memorize, the full breakdown is what they study.

---

## Phase 5 — Save the Charisma Code

### Save Protocol

After the Blueprint reveal, save the user's Charisma Code to a persistent file.

1. Use the player name collected during Player Registration (before Phase 0).
2. Convert the name to a filename-safe format: lowercase, hyphens for spaces, strip special characters (e.g., "SolKingKhan" → `solkingkhan`, "Dr. Sarah" → `dr-sarah`).
3. Create the directory if it doesn't exist: `~/.claude/projects/[system-username]-charisma-codes/` (use `whoami` for system username).
4. Write the Charisma Code file to: `~/.claude/projects/[system-username]-charisma-codes/[player-name]-charisma-code.md`

### Saved File Contents

The saved file should contain the following structure:

```markdown
# Charisma Code — [User's Name]

**Date Discovered:** [current date]
**Skill Version:** Charisma Codes v1.0

---

## Your Charisma Code

**[ENERGETIC] + [TRUST] + [AUTHORITY]**

---

## Energetic: [STYLE]

- **Description:** [one-line description from the table above]
- **Characteristics:** [key traits from the framework reference file]
- **Your Ally:** [Chosen ally from Loot Drop]
- **Celebrity Mirrors:** [list from framework — ONLY include if Celebrity path was chosen. OMIT entirely for Avatar path.]

## Trust: [STYLE]

- **Description:** [one-line description]
- **Characteristics:** [key traits from framework]
- **Your Ally:** [Chosen ally from Loot Drop]
- **Celebrity Mirrors:** [ONLY if Celebrity path. OMIT for Avatar path.]

## Authority: [STYLE]

- **Description:** [one-line description]
- **Characteristics:** [key traits from framework]
- **Your Ally:** [Chosen ally from Loot Drop]
- **Celebrity Mirrors:** [ONLY if Celebrity path. OMIT for Avatar path.]

---

## Composite Mirror

[The composite mirror statement from the reveal]

## Superpower

[The superpower synthesis from the reveal]

## Kryptonite

[The kryptonite warnings from the reveal]

---

## Diagnostic Notes

### Recognized Wrong-Style Consequences
- **Energetic:** [what they recognized, or "None — confirmed clean"]
- **Trust:** [what they recognized, or "None — confirmed clean"]
- **Authority:** [what they recognized, or "None — confirmed clean"]

### Style Pivots During Diagnostic
- [List any dimensions where the user changed their style during Phase 3, noting original proposed style and final confirmed style. If none, write "No pivots — all proposed styles confirmed."]

---

## On-Camera Blueprint

**Activation Phrase:** [3 words from the Blueprint]

### Body ([ENERGETIC STYLE] Energy)
[Full decoded physical characteristics for Energetic dimension]

### Trust ([TRUST STYLE] Connection)
[Full decoded physical characteristics for Trust dimension]

### Authority ([AUTHORITY STYLE] Leadership)
[Full decoded physical characteristics for Authority dimension]

### Danger Zones
[Top 2-3 wrong-style consequences to avoid]

---

## Ally Squad (Loot Drop)

- **Ally Style:** [Celebrity/Character or Custom Avatar]
- **Energetic Ally:** [Chosen ally] — [Style] Mirror
- **Trust Ally:** [Chosen ally] — [Style] Mirror
- **Authority Ally:** [Chosen ally] — [Style] Mirror
- **Reclassify Token:** [UNUSED / SPENT on [Name]]

---

*Generated by Charisma Codes skill — built on McCall Jones' Charisma Styles framework*
```

### Post-Save Confirmation

After saving, confirm to the user: "Your Charisma Code has been saved. You can view it anytime with Menu 3 (View My Code), or jump into Pre-Camera Prep with Menu 2."

**Google Doc & Sharing (ALWAYS OFFER):**

Before presenting the "What's next?" menu, ask about creating a shareable Google Doc:

Use AskUserQuestion:
- Question: "Want to create a Google Doc of your Charisma Code to share with someone?"
- Options:
  - "Yes — create and share" — "I'll create a formatted Google Doc and share it via email"
  - "Yes — create only" — "Create the doc but don't share it yet"
  - "No — skip" — "Just keep the local save"

**If creating a Google Doc:**
1. Use Playwright to open `https://docs.google.com/document/create`
2. Rename the doc to "Charisma Code — [Player Name]"
3. Type the full Charisma Code content with formatted headings (H1, H2, H3), bold labels, and all sections from the saved file
4. If sharing, ask for the recipient's email address, then ask for the permission level:

Use AskUserQuestion:
- Question: "What permission level should they have?"
- Options:
  - "Viewer" — "They can read but not edit"
  - "Commenter" — "They can read and leave comments"
  - "Editor" — "They can read and edit"

5. Share the doc via the Google Docs Share dialog with the selected permission level
6. Include a notification message with the recipient's code and activation phrase
7. Confirm: "Google Doc created and shared with [email] as [permission level]." and provide the doc URL.

**Then present the navigation menu:**

Use AskUserQuestion:
- Prompt: "What's next, Life Gamer?"
- Options:
  - "Pre-Camera Prep (Menu 2) — activate my code before a shoot"
  - "Script Charisma Map (Menu 3) — map my code against a script"
  - "View My Code (Menu 4) — see my full Charisma Code card"
  - "Back to Main Menu"

Route to the appropriate menu selection based on the user's choice.

---

## MENU 2: PRE-CAMERA PREP — "Pre-Raid Buff Station"

**Prerequisite check:** Before anything else, scan for a saved Charisma Code using Glob on `~/.claude/projects/*-charisma-codes/*-charisma-code.md`. If no file is found, display:

> "No saved Charisma Code found. You need to discover your code first (Menu 1) before you can prep for camera."

Use AskUserQuestion to offer: "Discover My Code (Menu 1)" or "Back to Main Menu". Do not proceed with any prep steps.

If a saved code IS found, proceed through the following steps in order.

### Step 1 — Load Saved Code

Read the saved `[player-name]-charisma-code.md` file. If multiple saved codes exist, ask which one to load. Display a quick reminder card:

```
  ╔══════════════════════════════════════════════╗
  ║  YOUR CHARISMA CODE                          ║
  ║  [ENERGETIC] / [TRUST] / [AUTHORITY]         ║
  ╚══════════════════════════════════════════════╝
```

Replace bracketed values with the user's actual saved styles (e.g., "AMAZE / MIRROR / LIFT").

### Step 2 — Style-Matched Breathwork Activation

Read the framework file (`~/.claude/plugins/local/charisma-codes/references/charisma-styles-framework.md`) and check if the user's Energetic style has a defined breathwork technique in the style-matched breathwork table.

**If the user's Energetic style has a defined technique (not TBD):**

Run that technique with guided instructions. Present 3 rounds of the breathing pattern with timing cues. Include a celebrity visualization component:

> "As you breathe, picture [MATCHED CELEBRITY from their Energetic mirrors]. Not to become them — but to feel the same frequency your authentic [STYLE] energy already carries. Breathe in that resonance through your own voice."

Frame it as: "Breathe in [CELEB]'s energy through your own authentic voice."

**If the technique is TBD (placeholder) or no breathwork table exists yet:**

Fall back to the guard-dropper breathwork — box breathing (4 counts in, 4 counts hold, 4 counts out, 4 counts hold), 3 full rounds. Present with timing cues.

Add a note:

> "Your style-matched activation breath is coming soon. For now, we'll use the guard-dropper to center you. This drops the performative mask so your authentic [STYLE] energy comes through on camera."

After breathwork completes, confirm readiness before proceeding:

> "Armor dropped. Buffs applied. Ready for your Equipment Loadout?"

### Step 3 — Cheat Sheet / "Equipment Loadout"

Read the framework file to pull the physical characteristics for the user's saved styles. Decode ALL shorthand using the Key/Legend from the framework reference file. Never display raw abbreviations (T+M, Perc, Fl, etc.) — always decode to plain language.

**Display TWO formats — sticky note first, full breakdown second:**

**A) THE STICKY NOTE (display this prominently — it's what they see before hitting record):**

```
╔══════════════════════════════════════════════════════════════╗
║  ACTIVATION PHRASE                                           ║
║  "[3 words, one per dimension — e.g., Wonder. Reflect.       ║
║   Believe. for AMAZE/MIRROR/LIFT. Match verb energy to       ║
║   styles. Examples: EXCITE/FIX/LEAD = Ignite. Solve.         ║
║   Command. CHARM/STEADY/LIGHT = Warm. Ground. Spark.]"       ║
╠══════════════════════════════════════════════════════════════╣
║  BODY: [decoded Energetic — voice pitch/pace + arms + face   ║
║         in one line, e.g., "Treble-to-mid, medium pace.      ║
║         Fluid arms. Medium expression."]                     ║
║  TRUST: [Focus + delivery in one line, e.g., "Focus on       ║
║          their THOUGHTS. Be expressive and reactive."]       ║
║  AUTHORITY: [Vibe in one line, e.g., "Empower them.          ║
║              Warm cheerleader energy."]                       ║
║  TRAP: [Top consequence to avoid, e.g., "Don't try to        ║
║         impress — you'll look BORING."]                      ║
╚══════════════════════════════════════════════════════════════╝
```

**B) FULL BREAKDOWN (display below the sticky note for reference):**

After the sticky note, present a detailed breakdown with all physical characteristics for each dimension:
- **Energetic:** Pitch, Pacing, Emphasis, Arms, Face (all decoded from shorthand)
- **Trust:** Focus, Delivery, Pitch, Pacing, Emphasis, Arms, Face
- **Authority:** Focus, Testimonials, Vibe, Pitch, Pacing, Emphasis, Arms, Face
- **Danger Zones:** Top 2-3 wrong-style consequences from their rows in each matrix (prioritize consequences they recognized during the diagnostic)

Present this as a clean list format (not a box) so it reads as reference material, not activation material. The sticky note is what they memorize. The full breakdown is what they study.

### Step 4 — Celeb Counsel / "Party Selection"

McCall Jones is ALWAYS locked in seat 1 of the counsel for prep sessions. The user's **saved celebrity allies** (from the Loot Drop in Phase 3.5) are offered as the default party.

**Default party behavior:**

If the user has saved celebrity allies in their `[player-name]-charisma-code.md` file, present the default party:

> "Your saved party is ready:"

```
  1. McCall Jones — Framework Master
  2. [Energetic Ally] — [Style] Mirror
  3. [Trust or Authority Ally] — [Style] Mirror
```

Use AskUserQuestion: "Roll with your saved party, or swap someone out?"
Options: "Roll with this party", "Swap a party member", "Build a new party from scratch"

- **Roll with this party:** Proceed directly to prep questions.
- **Swap a party member:** Present the full combined celebrity roster (below) and let them replace one member.
- **Build a new party from scratch:** Full selection flow below.

**Full selection flow (for new party or first-time without saved allies):**

Combine ALL celebrity mirrors from the user's three matched styles into one deduplicated list. Note which dimension(s) each celebrity mirrors.

Present using AskUserQuestion:

> "McCall Jones is locked in as your lead counsel. Pick 2 more party members from your celebrity mirrors:"

List the combined celebrities as selectable options (group by dimension if the list is long). Include a final option: "Suggest my own celebrity".

**Celebrity validation logic (CRITICAL):**

If the user suggests a celebrity not on their matched lists, Claude must check against ALL celebrity mirror lists in the framework file:

1. **Celebrity IS in one of the user's matched style lists** (just a different dimension than shown) — Approve immediately. They are a valid mirror.

2. **Celebrity is in a DIFFERENT style's list** (not one of the user's styles) — Warn the user:

   > "Careful — [CELEB] is a [DIFFERENT STYLE] mirror. Channeling them could pull you into [WRONG STYLE] energy, making you look [CONSEQUENCE from the relevant consequence matrix row/column intersection]. Want to keep them knowing that, or pick someone else?"

   Use AskUserQuestion with options: "Keep them (I understand the risk)", "Pick someone else".

3. **Celebrity is not in any framework list** — Inform the user:

   > "I don't have [CELEB] mapped in the framework yet. They might still be a great mirror for you — I just can't cross-reference their style. Want to keep them, or pick from your matched list?"

   Use AskUserQuestion with options: "Keep them anyway", "Pick from my list instead".

**Once the party is assembled (McCall + 2 celebs):**

Display the assembled party:

```
  ╔══════════════════════════════════════════════╗
  ║  YOUR PREP PARTY                             ║
  ║  1. McCall Jones — Framework Master          ║
  ║  2. [Celeb 1] — [Style] Mirror              ║
  ║  3. [Celeb 2] — [Style] Mirror              ║
  ╚══════════════════════════════════════════════╝
```

Then open the floor for prep questions. Use AskUserQuestion:

> "Your party is assembled. What do you want to prep for?"

Options: "How should I open my next video?", "How do I handle nerves on camera?", "What should I avoid doing?", "Ask my own question"

**Party member response behavior:**

When the user asks a prep question, ALL three party members respond in sequence, each in their distinct NPC voice:

- **McCall Jones:** Warm, precise, master-class instructor tone. Gives framework-grounded advice. References the user's specific style characteristics. Example: "As a [STYLE], your opening should lean into [characteristic]. Your audience responds to [Trust style delivery] — so lead with that energy."

- **Celebrity 1:** Speaks in a voice that captures their public persona. Gives perspective from their style. Stays in character but delivers genuinely useful advice. Example (Ted Lasso): "Hey, you know what? Just be curious. Walk up to that camera like it's a friend you haven't seen in a while..."

- **Celebrity 2:** Same approach — distinct persona voice, useful advice filtered through their style. Example (Alex Hormozi): "Cut the intro. First 3 seconds: the result they want. Then deliver."

After each round of counsel responses, use AskUserQuestion: "Want to ask another question, or are you ready to shoot?"
Options: "Ask another prep question", "Ready to shoot — save and go", "Back to Main Menu"

### Step 5 — Save Prep Session

When the user is done (selects "Ready to shoot" or "Back to Main Menu"), save the prep session log.

**Save location:** `~/.claude/projects/[username]-charisma-codes/prep-sessions/[YYYY-MM-DD]-prep.md`

If the `prep-sessions/` directory does not exist, create it.

If a file for today's date already exists, append a counter: `[YYYY-MM-DD]-prep-2.md`, `[YYYY-MM-DD]-prep-3.md`, etc.

**Save file contents include:**
- Date and timestamp
- Charisma Code loaded (e.g., AMAZE / MIRROR / LIFT)
- Breathwork type completed (style-matched or guard-dropper fallback)
- Full Equipment Loadout cheat sheet
- Party members selected
- Complete Q&A log (every question asked and all party member responses)

After saving, display:

> "Prep session saved. Your Equipment Loadout and party counsel are logged for reference."

Use AskUserQuestion: "What's next?"
Options: "Run another prep session", "View My Code (Menu 3)", "Back to Main Menu"

---

## MENU 3: VIEW MY CHARISMA CODE

Scan for a saved Charisma Code using Glob on `~/.claude/projects/*-charisma-codes/*-charisma-code.md`.

**If no file found:** Display the same redirect message as Menu 2:

> "No saved Charisma Code found. You need to discover your code first (Menu 1)."

Use AskUserQuestion with options: "Discover My Code (Menu 1)", "Back to Main Menu"

**If file(s) found:** If multiple saved codes exist, ask which one to view. Read the saved `[player-name]-charisma-code.md` file and display the full Charisma Code card in the same format used during the Phase 4 reveal (the "CHARACTER UNLOCKED" format from the discovery flow). Include all three dimensions with their style names, allies, key characteristics, and any synergy notes.

After displaying the full code card, use AskUserQuestion:

> "What's next?"

Options: "Pre-Camera Prep (Menu 2)", "Script Charisma Map (Menu 3)", "Re-Discover My Code (Menu 1)", "Back to Main Menu"

---

## MENU 4: HELP / ABOUT

Display the following info card:

```
╔══════════════════════════════════════════════════════════════╗
║  ABOUT THE CHARISMA CODES                            ║
╠══════════════════════════════════════════════════════════════╣
║  Framework: Charisma Styles by McCall Jones                  ║
║  Application: <your-name> (Breath Master, Life Gamer)            ║
║  Counsel: Charisma Hackers (McCall Jones, Steve Jobs,        ║
║           Greg Hogg)                                         ║
╠══════════════════════════════════════════════════════════════╣
║  WHAT IS A CHARISMA CODE?                                    ║
║  Your unique combination of 3 charisma dimensions:           ║
║  - Energetic (Yellow) — How you show up physically           ║
║  - Trust (Blue) — How you build connection                   ║
║  - Authority (Red) — How you lead and inspire                ║
║  6 x 3 x 3 = 54 unique combinations                         ║
╠══════════════════════════════════════════════════════════════╣
║  THE BREATHWORK LAYER                                        ║
║  <your-name>'s addition: grounding breathwork before discovery   ║
║  drops the performative mask so your AUTHENTIC style         ║
║  emerges — not who you think you should be on camera.        ║
╠══════════════════════════════════════════════════════════════╣
║  MENU GUIDE                                                  ║
║  1. Discover My Code — Full diagnostic to find your code     ║
║  2. Pre-Camera Prep — Breathwork + cheat sheet + counsel     ║
║  3. Script Charisma Map — Map your code against a script     ║
║  4. View My Code — Quick-reference your saved code           ║
║  5. Help / About — You are here                              ║
╠══════════════════════════════════════════════════════════════╣
║  ETHICS                                                      ║
║  This skill studies and adapts McCall Jones' framework        ║
║  with respect. The goal is authenticity — helping you find   ║
║  YOUR voice, not copying someone else's.                     ║
║  Golden Rule: McCall Jones should feel honored by how we     ║
║  apply her work.                                             ║
╚══════════════════════════════════════════════════════════════╝
```

After display, use AskUserQuestion: "Where to next?"
Options: "Discover My Code (Menu 1)", "Pre-Camera Prep (Menu 2)", "View My Code (Menu 3)", "Exit"

---

## MENU 5: SCRIPT CHARISMA MAP — "Dungeon Map"

**RPG Frame:** "Map the dungeon before you enter it."

**Prerequisite check:** Requires a saved Charisma Code. If none found, redirect to Menu 1.

### Purpose

Analyzes a script, video outline, presentation, or any multi-section content and maps the user's Charisma Code against each section. The output is a personalized cheat sheet showing:
- Where they're **IN their code** (natural, just be themselves)
- Where the content requires a **STRETCH** (conscious shift outside their code)
- Where **KRYPTONITE traps** lurk (danger zones that could trigger their wrong-style consequences)

### Step 1 — Load Saved Code

Read the saved Charisma Code file. Display the quick reminder card with their code and activation phrase.

### Step 2 — Script Input

Use AskUserQuestion:
- Question: "How do you want to provide the script/content to analyze?"
- Options:
  - "Read a file" — "Provide a file path to a script, outline, or presentation"
  - "Paste it in" — "I'll paste the content directly (via Other)"
  - "Use current session content" — "Analyze something we've already been working on in this session"

If "Read a file," ask for the file path and read it. If "Use current session content," confirm which content to analyze.

### Step 3 — Section Identification

Identify the natural sections/segments of the content. Present the section breakdown to the user for confirmation:

> "I've identified [N] sections in your content: [list]. Does this look right, or should I split/combine differently?"

Use AskUserQuestion: "Looks good" / "Adjust the sections"

### Step 4 — Analysis

For EACH section, analyze the script's charisma demands against the user's saved code across all three dimensions (Energetic, Trust, Authority). For each dimension in each section, determine:

1. **What the script demands** — What Energetic energy, Trust style, and Authority approach does this section's content, tone, and stage directions call for? Match against the Physical Characteristics tables in the framework reference file.

2. **Code match verdict** — Is the user IN their code, in a STRETCH zone, or at a KRYPTONITE risk?
   - **IN YOUR CODE** = The section's demands match the user's saved style for that dimension
   - **STRETCH** = The section demands a different style than the user's saved code. Name the style being demanded and WHY.
   - **KRYPTONITE ALERT** = The section's demands could trigger one of the user's recognized wrong-style consequences from their diagnostic notes

3. **Approach guidance** — For STRETCH and KRYPTONITE sections, provide a specific coaching note on HOW to deliver the content authentically through their actual code rather than forcing a wrong style. Reference their allies when helpful.

4. **Activation phrase** — Create a section-specific 3-word activation phrase (one per dimension, matching the style needed).

### Step 5 — Summary Table

After all sections are analyzed, present a summary table:

| Section | In Your Code | Stretch Required | Risk Level |
|---------|:------------:|:----------------:|:----------:|
| [Name] | Full / Partial / Minimal | Description | None / Low / Medium / High |

Identify the **home base sections** (lowest risk, most natural) and the **danger zone sections** (highest risk, most stretch required).

### Step 6 — Save

Save the charisma map to: `~/.claude/projects/[username]-charisma-codes/[player-name]-[content-name]-charisma-map.md`

Include: date, code used, script reference, full section-by-section analysis, summary table, and the oscillation rhythms for stretch sections.

### Step 7 — Google Doc Option

After saving, offer to create a Google Doc with the charisma map as a separate tab alongside the original script content:

Use AskUserQuestion:
- Question: "Want to create a Google Doc with your script and charisma map?"
- Options:
  - "Yes — script + charisma map in separate tabs" — "Tab 1: full script with beats, Tab 2: charisma codes cheat sheet"
  - "Yes — charisma map only" — "Just the cheat sheet as a Google Doc"
  - "No — skip" — "Keep the local save only"

---

## GLOBAL BEHAVIORS

The following rules apply throughout the ENTIRE skill, across all menus and phases.

### 1. Framework File Dependency

At the start of EVERY session where this skill is invoked, Claude MUST read the framework reference file:

`~/.claude/plugins/local/charisma-codes/references/charisma-styles-framework.md`

ALL style data, physical characteristics, consequence matrices, celebrity mirrors, and coaching notes come from that file. NEVER hardcode style data in responses — always pull from the framework file. This ensures that when the framework is updated, the skill automatically reflects the changes.

### 2. AskUserQuestion for ALL Choices

Every decision point in the skill uses AskUserQuestion with 2-4 selectable options. RPG narrative text goes in the message body ABOVE the AskUserQuestion call. The "Other" option is always available automatically through the tool — do not manually add it unless offering a specific custom path.

### 3. RPG Framing Consistency

Maintain the RPG framing map throughout the skill. Each section uses its designated RPG frame:

| Section | RPG Frame |
|---------|-----------|
| Title Screen / Main Menu | Character Select / New Game |
| Discovery Method Selection | "Choose Your Quest Path" |
| Guard-Dropper Breathwork | "Drop your armor at the gate" |
| Quiz Questions | "Ability Check" |
| Wrong-Style Diagnostic | "Boss Battle — Stress Test" |
| Celebrity Ally Selection | "Loot Drop — Choose Your Allies" |
| Code Reveal | "CHARACTER UNLOCKED" |
| On-Camera Blueprint | "TREASURE CHEST UNLOCKED" |
| Pre-Camera Prep | "Pre-Raid Buff Station" |
| Celeb Counsel | "Party Selection" |
| Cheat Sheet | "Equipment Loadout" |

RPG framing enhances the experience but never obscures the functional purpose. If a user seems confused by the framing, dial it back and speak plainly.

### 4. McCall Jones Credit

ALWAYS credit McCall Jones as the creator of the Charisma Styles framework. Never present the framework, its terminology, its matrices, or its celebrity mirrors as original work. Phrases like "McCall Jones' framework shows..." or "According to the Charisma Styles system..." should appear naturally when discussing framework concepts.

### 5. Shorthand Decoding

When displaying any physical characteristics to the user, ALWAYS decode the shorthand into plain language. Users should NEVER see raw abbreviations like "T+M", "Perc", "Fl", "PiC", "Wei", etc. Use the Key/Legend from the framework reference file to decode all values. Combinations are joined with "and" or "to" as contextually appropriate (e.g., "B+Fl" = "Big and Fluid movements", "L+M" for face = "Large to Medium expression").

### 6. Counsel Availability

The Charisma Hackers counsel can be summoned at ANY time during the skill if the user requests expert review or advice. They are not limited to scheduled moments. If the user says something like "What would McCall say about this?" or "Can I get the Charisma Hackers' take?" — summon them immediately. Use the NPC voices defined in the Counsel section at the top of this file.

### 7. Navigation — No Dead Ends

After ANY menu, phase, or action completes, ALWAYS offer a way back to the main menu or to another relevant menu. Never leave the user at a dead end. Use AskUserQuestion with contextually appropriate next-step options.

Minimum options at any endpoint: at least one forward action and "Back to Main Menu".

### 8. Error Handling

| Error Scenario | Behavior |
|---------------|----------|
| Framework file cannot be read | Inform user: "The framework reference file couldn't be loaded. Attempting to re-read..." Try once more. If still failing, inform user the skill cannot proceed without it and suggest restarting. |
| Save directory does not exist | Create it silently using Bash (mkdir -p). Do not prompt the user about directory creation. |
| Saved Charisma Code is corrupted or incomplete | Inform user: "Your saved Charisma Code appears incomplete or corrupted. Would you like to re-discover your code?" Use AskUserQuestion with options: "Re-Discover My Code (Menu 1)", "Back to Main Menu". |
| Saved Charisma Code file exists but is empty | Same as corrupted — offer re-discovery. |
| Glob finds multiple charisma-code files | Present all found codes by player name and let the user choose which to load. |
| User asks for a menu that requires a saved code but has none | Always redirect to Menu 1 (Discover) with explanation. Never silently fail. |
