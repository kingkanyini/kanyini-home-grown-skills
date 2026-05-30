---
description: Build dual-path belief-shifting email sequences with entry emails, nurture + conversion CTAs, and reminder templates
---

# Belief Shift E-Engine

Build belief-shifting nurture sequences that break old beliefs and install new ones through story. Generates **dual-path output**: entry emails (booked vs. didn't book) + 6 belief-shift emails with both conversion CTAs and nurture CTAs + reminder templates. Each email follows a preframed template with `[INPUT]` sections for client stories.

---

## ETHICS CHECK (START)

Before beginning:
- Framing: We are building authentic belief-shift email sequences that honor the client's real transformation stories
- Language: NEVER/ALWAYS table applies — no "stealing," no "copying"
- Intent: Center the client's authentic voice and real results. Every story must come from real experience.
- Golden Rule: "If the client saw these emails, would they feel honored or violated?"
- All content must be rooted in REAL transformation stories — never fabricated

---

## DUAL COUNSEL SYSTEM

### Panel 1 — Email Hacker Counsel (Email Craft)

Reviews email CRAFT — voice, story, structure, conversion.

| Member | Lens | Reviews For | NPC Voice | Calls Out |
|--------|------|-------------|-----------|-----------|
| **Laura Belgray** | Voice & personality | Does this sound like a PERSON wrote it? Conversational tone, concrete sensory details, seamless story-to-sell transitions, subject lines that feel like texts from a friend | Witty, irreverent, brunch-sharp — zero patience for boring copy | Generic/voiceless copy, vague stories, awkward transitions, corporate tone |
| **Andre Chaperon** | Story arc & empathy | Does this build trust through narrative? Open loops between emails, deep empathy for reader's pain, clear arc across sequence, serialized tension | Quiet, principled, deliberate — treats subscribers as sacred | No narrative arc, premature selling, surface-level stories, lack of empathy |
| **Chase Diamond** | Structure & conversion | Does this follow a proven framework? Clear singular CTA, right email in right position, subject line clarity over cleverness | High-energy, tactical, data-backed — has receipts for everything | No framework, clever-over-clear, missing CTAs, untested copy |

### Panel 2 — Client Voice Counsel (Voice Authenticity — FOREMAN)

Derived from the client's Charisma Code allies. Reviews voice authenticity against the client's actual writing and speaking patterns. **Panel 2 has FINAL SAY on "does this sound like them?"**

Panel 2 sources:
1. Charisma Code file (voice DNA, triplet code, ally squad)
2. Client-provided emails/copy (loaded as reference material)
3. Final emails written by client (fed back to update reference)

If no Charisma Code exists, <your-name> manually selects 3 voice reviewers or skips Panel 2.

---

## STEP 1 — CLIENT SETUP

**On launch, display welcome:**

```
╔═══════════════════════════════════════════════════════╗
║  BELIEF SHIFT E-ENGINE                                ║
║  Dual-Path Email Sequence Builder                     ║
╠═══════════════════════════════════════════════════════╣
║  2 Entry Emails + 6 Belief Emails (x2 CTAs)           ║
║  + Reminder Templates = 16 email assets                ║
╠═══════════════════════════════════════════════════════╣
║  Panel 1: Email Hacker Counsel                        ║
║  Panel 2: Client Voice Counsel (Foreman)              ║
╚═══════════════════════════════════════════════════════╝
```

**Check for existing projects:**
```bash
ls ~/.claude/projects/belief-shift-e-engine/clients/ 2>/dev/null
```

**AskUserQuestion:** New client or returning?
- **Resume [client name]** — Load existing project (beliefs, voice skin, drafts)
- **New client** — Start fresh

If new: Ask for client name. Create project directory:
```
~/.claude/projects/belief-shift-e-engine/clients/[client-name]/
```

---

## STEP 2 — LOAD 6 CORE BELIEFS

**AskUserQuestion:** How do you want to load beliefs?
- **Load from Propaganda Machine** — Pull from existing Prop Machine project
- **Paste or input manually** — Interview for each belief

### If Propaganda Machine:

Ask for the project name. List available projects:
```bash
ls ~/.claude/projects/prop-machine/ 2>/dev/null
```

Read from `~/.claude/projects/prop-machine/[project]/prop-machine.md` and extract:
- The 6 beliefs (Old Tagline, New Tagline)
- Hell Island language (problems, costs)
- Heaven Island language (desired feelings, life with solutions)
- Before/After Identities

### If Manual Input:

Interview for each belief (6 rounds). For each one, ask:

| Field | Question |
|-------|----------|
| Old Tagline | What does the audience currently believe? (one sentence) |
| New Tagline | What should they believe instead? (one sentence) |
| Hell Island | What does holding this belief cost them? (2-3 specific consequences) |
| Heaven Island | What does life look like with the new belief? (2-3 specific outcomes) |

Can batch — accept all 6 in one paste if the client has them ready.

### Display Summary

Show all 6 beliefs in a table for confirmation:

```
╔═══════════════════════════════════════════════════════╗
║  6 CORE BELIEFS — [Client Name]                       ║
╠═══╤════════════╤══════════════════╤═══════════════════╣
║ # │ Category   │ Old Belief       │ New Belief        ║
╠═══╪════════════╪══════════════════╪═══════════════════╣
║ 1 │ Core       │ [old tagline]    │ [new tagline]     ║
║ 2 │ Problem    │ ...              │ ...               ║
║ 3 │ Time       │ ...              │ ...               ║
║ 4 │ Money      │ ...              │ ...               ║
║ 5 │ Method     │ ...              │ ...               ║
║ 6 │ Help       │ ...              │ ...               ║
╚═══╧════════════╧══════════════════╧═══════════════════╝
```

**AskUserQuestion:** Approve beliefs / Edit a belief / Reload from different source

Save beliefs to `~/.claude/projects/belief-shift-e-engine/clients/[client-name]/beliefs.md`

---

## STEP 3 — CTA DESTINATION & CADENCE

### 3a. Offer/CTA Setup

**AskUserQuestion:** Does this client have an Offer Optimizer output?
- **Load from Offer Optimizer** — Read offer details
- **Input manually** — Enter offer name, price, transformation promise

**AskUserQuestion:** What action should this sequence drive?
- **Book a call** — Discovery/strategy/consultation call (need link or booking tool)
- **Sign up for a program/offer** — Direct registration (need link or checkout page)
- **Book an appointment** — Session/service booking (need link or scheduling tool)

Ask for the CTA link/URL or booking tool name.

**AskUserQuestion:** Is there a deadline?
- **Yes (specific date)** — Hard deadline drives urgency in emails 4-6
- **Evergreen** — No hard deadline, use value-based urgency
- **Soft urgency** — "Limited spots," "next cohort starts..."

If deadline: Ask for the date.

### 3b. Traffic Source (DETERMINES CTA INTENSITY)

**AskUserQuestion:** What's the traffic source for this sequence?
- **Paid ad / Lead magnet** — They just clicked an ad. They're warm. CTA in every email, higher intensity.
- **Organic email signup** — They opted in over time. Softer escalation (seed → warm → introduce → frame → direct → urgency).
- **Webinar / Event followup** — They attended something. Medium intensity, reference the event.

### 3c. CTA Escalation Map

Generate the escalation based on traffic source:

**If Paid Ad / Lead Magnet (CTA in EVERY email):**
```
╔═══════════════════════════════════════════════════════════════╗
║  CTA ESCALATION MAP — PAID AD TRAFFIC (PATH B)                ║
╠═══╤═══════════╤══════════════════════════════════════════════╣
║ # │ CTA Temp  │ What Happens                                 ║
╠═══╪═══════════╪══════════════════════════════════════════════╣
║ 0B│ Tease     │ Light story tease + value reframe             ║
║ 1 │ Warm      │ First link drops naturally from the story     ║
║ 2 │ Direct    │ Name the CTA clearly                          ║
║ 3 │ Urgent    │ Time reframe — every month you wait...        ║
║ 4 │ Reframe   │ Investment reframe — what you've spent vs this║
║ 5 │ Proof     │ Client proof — their turn                     ║
║ 6 │ Final     │ Cost of inaction — last CTA                   ║
╚═══╧═══════════╧══════════════════════════════════════════════╝
```

**If Organic (Gradual escalation):**
```
╔═══════════════════════════════════════════════════════════════╗
║  CTA ESCALATION MAP — ORGANIC (PATH B)                        ║
╠═══╤═══════════╤══════════════════════════════════════════════╣
║ # │ CTA Level │ What Happens                                 ║
╠═══╪═══════════╪══════════════════════════════════════════════╣
║ 1 │ Seed      │ Soft mention — plant awareness               ║
║ 2 │ Warm      │ Value-first bridge — hint at solution         ║
║ 3 │ Introduce │ Name the offer — no pressure                  ║
║ 4 │ Frame     │ Anchor the investment — reframe cost          ║
║ 5 │ Direct    │ Clear CTA with method proof                   ║
║ 6 │ Urgency   │ Final CTA with deadline/scarcity              ║
╚═══╧═══════════╧══════════════════════════════════════════════╝
```

All paid ad emails include a P.S. with a second CTA link — two chances to click per email.

**AskUserQuestion:** Approve escalation / Adjust levels / Counsel review (Chase Diamond reviews CTA flow)

### 3d. Cadence

**AskUserQuestion:** What's the send cadence for this sequence?
- **Daily** — 6 days straight (high intensity)
- **Every other day** — 12 days total (breathing room)
- **Custom spacing** — Specify days between each email
- **Skip cadence** — Just build the emails, handle timing on the backend

If cadence selected and deadline given: Display recommended send dates.

Andre Chaperon advises on optimal spacing based on the belief arc and urgency timeline — show his recommendation as an NPC dialogue.

### 3e. Dual-Path Detection (AUTOMATIC)

Every CTA action (book a call, sign up, book appointment) involves an action someone can take **immediately**. This means the sequence ALWAYS needs two paths:

| Path | Name | Who | Email Architecture |
|------|------|-----|-------------------|
| **Path A** | Took Action | People who already [booked/signed up/etc.] | Entry email 0A (welcome) + 6 belief emails with **nurture CTAs** (reflection prompts, call prep) + reminder templates |
| **Path B** | Didn't Take Action | People who haven't [booked/signed up/etc.] yet | Entry email 0B (reminder/tease) + 6 belief emails with **conversion CTAs** (booking links, escalation) |

**Automatically set:**
- `path_a_label` = "Booked" / "Signed Up" / "Registered" (based on CTA action)
- `path_b_label` = "Didn't Book" / "Hasn't Signed Up" / "Hasn't Registered"
- `path_a_cadence` = wider spacing (every 3 days), stops 48hrs before action date
- `path_b_cadence` = original cadence from 3d

Display the dual-path architecture:

```
╔═══════════════════════════════════════════════════════════════╗
║  DUAL-PATH ARCHITECTURE                                       ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  [Ad / Lead Magnet / Opt-in]                                  ║
║         │                                                     ║
║    ┌────┴────┐                                                ║
║    │         │                                                ║
║  PATH A    PATH B                                             ║
║  [Took      [Didn't                                           ║
║   Action]    Take Action]                                     ║
║    │         │                                                ║
║  0A:Welcome 0B:Reminder                                       ║
║    │         │                                                ║
║  Emails 1-6  Emails 1-6                                       ║
║  (Nurture    (Conversion                                      ║
║   CTAs)       CTAs)                                           ║
║    │         │                                                ║
║  Reminders   (no reminders                                    ║
║  48hr+Day-of  needed)                                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

**AskUserQuestion:** Approve dual-path / Single path only / Adjust

Save to `~/.claude/projects/belief-shift-e-engine/clients/[client-name]/cta-config.md`

---

## STEP 4 — VOICE SETUP

**AskUserQuestion:** How do you want to set up the client's voice?
- **Load Charisma Code** — Extract voice skin from existing Charisma Code
- **Paste client content** — Use sample emails/copy to build voice profile
- **Build from scratch** — Manual voice setup

### If Charisma Code:

List available Charisma Code files:
```bash
ls "~/.claude/projects/charisma-rosetta-stone/clients codes/" 2>/dev/null
```

Select the client's file. Read the reference guide:
```
Read ~/.claude/references/client-email-nurturing-guide.md
```

Extract the Client Voice Skin using the mapping tables in Sections 1-4 of the reference guide:
- Energetic Style → Email Rhythm (Section 2)
- Trust Style → Email Relationship (Section 3)
- Authority Style → CTA Energy (Section 4)
- Kryptonite → Banned patterns
- Allies → Panel 2 counsel members

### Sample Content

**AskUserQuestion:** Do you have sample emails or content from this client?
- **Yes — paste it** — Accept pasted content
- **Yes — load from file** — Ask for file path
- **No — skip** — Proceed without reference material

If provided: Save to `~/.claude/projects/belief-shift-e-engine/clients/[client-name]/reference-material/`

### Display Voice Skin

Show the extracted voice skin in the format from Section 1 of the reference guide (ASCII box with Code, Rhythm, Relationship, CTA Energy, Superpower, Kryptonite, Voice Counsel).

**AskUserQuestion:** Approve voice skin / Adjust / Load different Charisma Code

Save to `~/.claude/projects/belief-shift-e-engine/clients/[client-name]/voice-skin.md`

Set up Panel 2 (Client Voice Counsel) from Charisma Code allies.

---

## STEP 5 — COUNSEL ASSEMBLY

Display both panels:

```
╔═══════════════════════════════════════════════════════╗
║  PANEL 1 — EMAIL HACKER COUNSEL (Craft)               ║
╠═══════════════════════════════════════════════════════╣
║  Laura Belgray — Voice & personality                   ║
║  Andre Chaperon — Story arc & empathy                  ║
║  Chase Diamond — Structure & conversion                ║
╠═══════════════════════════════════════════════════════╣
║  PANEL 2 — CLIENT VOICE COUNSEL (Foreman)              ║
╠═══════════════════════════════════════════════════════╣
║  [Energetic Ally] — [role]                             ║
║  [Trust Ally] — [role]                                 ║
║  [Authority Ally] — [role]                             ║
╚═══════════════════════════════════════════════════════╝
```

**AskUserQuestion:** Approve both panels / Swap a member / Choose from registry / Solo (no counsel)

---

## STEP 6 — SEQUENCE ARCHITECTURE

Generate the full sequence blueprint including entry emails + 6 belief emails + reminders.

### Full Sequence Structure

| Email | Purpose | Path A (Took Action) | Path B (Didn't Take Action) |
|-------|---------|---------------------|---------------------------|
| 0A | Entry — Welcome | Celebrate, set expectations, prep, tease sequence | N/A |
| 0B | Entry — Reminder | N/A | Light story tease, value reframe, CTA |
| 1 | Core Belief — Set the Stage | Nurture CTA (reflection prompt) | Conversion CTA (warm link) |
| 2 | Real Problem — High Drama | Nurture CTA (reflection prompt) | Conversion CTA (direct link) |
| 3 | Time — Epiphany | Nurture CTA (reflection prompt) | Conversion CTA (urgent link) |
| 4 | Money — Hidden Benefits | Nurture CTA (reflection prompt) | Conversion CTA (reframe link) |
| 5 | Method — The One Thing | Nurture CTA (reflection prompt) | Conversion CTA (proof link) |
| 6 | Help — Urgency + Full Circle | Nurture CTA (show up + bring everything) | Conversion CTA (final link) |
| R1 | 48-Hour Reminder | Prep for action/call | N/A |
| R2 | Day-Of Reminder | Show up reminder | N/A |

### Entry Email Strategy

**Email 0A (Welcome — Took Action):**
- Celebrate the decision — "You said YES"
- Reframe the action as self-directed — "Not to me, but to yourself"
- Set expectations (what to expect, what to bring)
- Prep question (to increase show-up / follow-through)
- Tease the sequence: "I have some stories to share with you before [call/start date]"
- Voice: warm celebration + clear boundaries (e.g., no-show policy for calls)

**Email 0B (Reminder — Didn't Take Action):**
- Acknowledge they haven't acted yet — no guilt
- Share a light story tease from the client's transformation (not the full story — save that for the sequence)
- Core reframe: value-based reason to act NOW
- Subject line: playful, brand-forward, creates curiosity gap
- CTA: single clear link + P.S. with second link
- Tease the sequence: "I want to share something personal with you"

**AskUserQuestion for each entry email:**
- Present draft for review
- Run dual counsel review
- <your-name> approves / edits / counsel revises

### Belief Email Architecture

| Email | Belief # | SOS Role | Structure | Open Loop |
|-------|----------|----------|-----------|-----------|
| 1 | Core Belief | Set the Stage | Empathy for old belief, introduce the world, hint at what's coming | "Tomorrow I'll tell you about the moment everything changed..." |
| 2 | Real Problem | High Drama | The REAL problem underneath (not what they think). Backstory + wall | "But there's something I haven't told you yet..." |
| 3 | Time | Epiphany | The reframe that shifts time from obstacle to urgency | "I spent 3 years learning what I'm about to share in 3 minutes..." |
| 4 | Money | Hidden Benefits | Reframe investment, show what this is REALLY worth | "The most expensive thing you own costs you nothing..." |
| 5 | Method | The One Thing | Why their current method can't work + the alternative | "I tried thinking my way out for a decade. Then..." |
| 6 | Help | Urgency + CTA | Why going alone is the old belief, the offer is the bridge | "Every hero needs a guide. Here's yours." |

Display the full blueprint as a table with:
- Email #, Belief category, Old → New tagline, Subject concept, Open loop concept, CTA level (both paths), Send day (both cadences)

**AskUserQuestion:** Approve architecture / Adjust order / Panel 1 review

If Panel 1 review: Run all three counsel members as NPC dialogue:
- **Andre Chaperon** focuses on narrative arc + open loop chain
- **Laura Belgray** focuses on subject line concepts + voice consistency
- **Chase Diamond** focuses on framework integrity + CTA escalation for BOTH paths

Save to `~/.claude/projects/belief-shift-e-engine/clients/[client-name]/sequence/00-blueprint.md`

---

## STEP 7 — EMAIL BUILDING

### 7-ENTRY. Build Entry Emails First

Build both entry emails before the 6-email sequence.

**For Email 0A (Welcome — Took Action):**
1. Draft using voice skin + CTA config
2. Include: celebration, expectations, prep question, sequence tease
3. Dual counsel review
4. Save as `00a-entry-[path-a-label].md`

**For Email 0B (Reminder — Didn't Take Action):**
1. Draft using voice skin + CTA config
2. Include: acknowledgment (no guilt), light story tease, value reframe, CTA link x2, sequence tease
3. Dual counsel review
4. Save as `00b-entry-[path-b-label].md`

**Key rules for entry emails:**
- 0A has NO CTA links (they already acted — Calendly/checkout handles confirmation)
- 0B has CTA links in body + P.S. (two shots)
- Both tease Email #1 without announcing "a sequence"
- Both use `{{contact.first_name}}` personalization

### 7a-7e. Build Belief Emails 1-6

Build one email at a time. For each of the 6 emails:

#### 7a. Generate Email Body (SHARED — identical for both paths)

Read the reference guide for architecture:
```
Read ~/.claude/references/client-email-nurturing-guide.md (Section 5)
```

Write the FIXED sections using:
- Belief data (Old/New Tagline, Hell Island, Heaven Island)
- Voice skin (rhythm, relationship, CTA energy)
- Open loop chain (close prior loop, open next one)

**Story Source Check (BEFORE generating template):**

Check if beliefs were loaded from Propaganda Machine (Step 2). If yes, read the shift frameworks for each belief and pull the Personal Story, Client Case Study, and Authority Quote directly into the email copy. The story sections flow naturally into the email — no [INPUT] prompts needed.

- **If Prop Machine data exists for this belief:** Auto-populate the story sections using the personal stories and client case studies from the Prop Machine shift frameworks. Stories flow directly into the email copy as part of the narrative.
- **If NO Prop Machine data:** Use the [INPUT] template format with prompts for the client to fill in.
- **If Prop Machine has partial data:** Use what exists, add [INPUT] prompts only for the missing pieces.

**Subject line guidance (Laura Belgray):** For paid ad traffic, subject lines should default to being about the READER, not the sender. "Don't let your best song die in a folder" > "I almost let my best song die in a folder." The reader doesn't care about your story yet — they care about THEIRS. Frame subjects as mirrors, not memoirs. Exception: some personal subjects work when they create pure curiosity (e.g., "I spent $5K on a coach who never made it") — but the default lean should be toward the reader's experience.

#### 7b. Generate Path B CTA (Conversion)

Write the conversion CTA section for this email position:
- CTA link in body with appropriate escalation temperature
- P.S. with second CTA link (for paid ad traffic)
- Sign-off matching client's voice
- Open loop tease for next email

This is the full CTA section from the escalation map (Step 3c).

#### 7c. Generate Path A CTA (Nurture)

Write the nurture CTA section for this email position. **No CTA links.** Replace with:

1. **Validate the decision they already made** — "You already [booked/signed up]"
2. **Give them a reflection prompt** for the action — "Before our [call/session], think about..."
3. **Build anticipation** — "On our [call], we'll..." / "I want to hear about..."
4. **P.S. bridges to the action** instead of linking

**Path A Reflection Prompt Arc (build this across all 6 emails):**

| Email | Reflection Prompt Pattern |
|-------|--------------------------|
| 1 | What's YOUR version of [the core belief struggle]? |
| 2 | What "evidence" have you been collecting against yourself? |
| 3 | What's YOUR [signature story equivalent]? What's sitting in a folder? |
| 4 | Where has your investment (time, energy, money) actually been going? |
| 5 | What method have you been using? What hasn't been working? |
| 6 | Bring everything. Bring the fear, the excitement, the unfinished work. |

This arc moves from self-awareness → honesty → action. By the time they [have the call / start the program], they've already done the inner work.

#### 7d. Dual Counsel Review (BOTH CTAs)

Run both panels on the BODY + both CTA variants:

**Panel 1 (Email Hackers)** — Reviews:
- Laura: Voice, conversational tone, story-to-sell transition, subject lines
- Andre: Open loop quality, empathy depth, narrative contribution to sequence arc
- Chase: Framework compliance, CTA placement (Path B), nurture prompt quality (Path A)

**Panel 2 (Client Voice)** — Reviews tone/voice alignment:
- Does the rhythm match their Energetic style?
- Does the relationship approach match their Trust style?
- Does the CTA match their Authority style? (both conversion AND nurture versions)
- Any Kryptonite violations?

Panel 2 has FINAL SAY. If they flag a voice mismatch, fix it before proceeding.

Apply feedback. **MANDATORY: After applying counsel edits, ALWAYS display the COMPLETE revised email in its entirety. Every word. No summaries. No "edits applied, moving on." Print the whole thing so <your-name> can read it.** Show both CTA variants clearly labeled (PATH A / PATH B).

#### 7e. Mode Selection

**AskUserQuestion:** What do you want to do with this email?
- **Fill in story now** — Provide the client story, AI helps wordsmith
- **Leave as template** — Keep [INPUT] section for client to fill later (export mode)
- **Skip to next email** — Come back to this one later

**If "Fill in story now":**
1. Accept the story input (paste or type)
2. AI assists with wordsmithing:
   - Apply Laura Belgray's Time-Place-Tension (specific time, specific place, immediate tension)
   - Add concrete sensory details (sounds, textures, body sensations)
   - Match the client's voice skin rhythm
3. Panel 2 (Client Voice) reviews the story for authenticity — does this sound like THEM?
4. Present complete email with `>> ... <<` markers around edited sections
5. **AskUserQuestion:** Approve / Revise / Clean copy (remove markers)

#### 7f. Save Each Email

Save to `~/.claude/projects/belief-shift-e-engine/clients/[client-name]/sequence/0[N]-[category].md`

Each email file contains:
- Metadata header (day, belief, SOS role, closes/opens loops)
- Subject line (selected or options)
- Email body (shared)
- **PATH B CTA section** (conversion — with links)
- **PATH A CTA section** (nurture — reflection prompts, no links)
- Template notes (voice skin check, counsel notes)

File naming:
- `01-core-belief.md`
- `02-real-problem.md`
- `03-time.md`
- `04-money.md`
- `05-method.md`
- `06-help.md`

### 7g. After All 6 Emails — Full Sequence Review

Full sequence review with both panels:

**Andre Chaperon** — Reviews the open loop chain across all 6. Do all loops close? Is the narrative arc compelling? Does Email 6 circle back to Email 1? Also reviews the Path A reflection prompt arc: does it build from self-awareness to action?

**Chase Diamond** — Reviews BOTH CTA flows end-to-end:
- Path B: Does the conversion escalation feel natural?
- Path A: Does the nurture arc prep them for the action?
- Cadence: Are both cadences appropriate?

**Laura Belgray** — Reviews subject lines as a set. Do they work together? Would YOU open all 6?

**Panel 2** — Final voice check across the full sequence (both CTA variants).

**AskUserQuestion:** Finalize sequence / Revise specific emails / Read aloud (voice mode)

Save counsel notes to `~/.claude/projects/belief-shift-e-engine/clients/[client-name]/sequence/counsel-notes.md`

### 7h. Path A Extras — Reminders + Cadence

After all 6 emails are built, auto-generate:

**Reminder Email Templates (Path A only):**

**48-Hour Reminder:**
- Subject: "Your [call/session/start date] is in 2 days"
- Body: Quick reminder + the prep question from Entry Email 0A + "come with the real answer, not the right one" + reschedule link (don't cancel)
- Voice: warm, brief, matches client voice skin
- ~100-150 words

**Day-Of Reminder:**
- Subject: "Today's the day"
- Body: Ultra-short. "Take a breath. You're ready." + reminder it's a conversation, not a test + sign-off
- Voice: grounded, calm, confident
- ~75-100 words

Save to:
- `~/.claude/projects/belief-shift-e-engine/clients/[client-name]/sequence/reminder-48hr.md`
- `~/.claude/projects/belief-shift-e-engine/clients/[client-name]/sequence/reminder-day-of.md`

**Path A Cadence Strategy:**

Generate a cadence document with:
- Wider spacing recommendation (every 3 days vs. Path B cadence)
- Conditional logic: IF [action_date] - today < 3 days, stop nurture, switch to reminders
- Max emails before action: depends on how far out the action is (3-5 days = 1-2 emails, 6-10 days = 2-3, 11+ days = 3-4)
- Note: Emails #5 and #6 are unlikely to send for Path A unless action is 14+ days out — and that's fine

Save to `~/.claude/projects/belief-shift-e-engine/clients/[client-name]/sequence/path-a-cadence.md`

---

## STEP 8 — SAVE & EXPORT

### Save Structure

Verify all files are saved:

```
~/.claude/projects/belief-shift-e-engine/clients/[client-name]/
├── voice-skin.md
├── beliefs.md
├── cta-config.md
├── sequence/
│   ├── 00-blueprint.md
│   ├── 00a-entry-[path-a-label].md
│   ├── 00b-entry-[path-b-label].md
│   ├── 01-core-belief.md           (body + both CTA variants)
│   ├── 02-real-problem.md          (body + both CTA variants)
│   ├── 03-time.md                  (body + both CTA variants)
│   ├── 04-money.md                 (body + both CTA variants)
│   ├── 05-method.md                (body + both CTA variants)
│   ├── 06-help.md                  (body + both CTA variants)
│   ├── reminder-48hr.md
│   ├── reminder-day-of.md
│   ├── path-a-cadence.md
│   └── counsel-notes.md
├── reference-material/
│   └── [uploaded files]
└── exports/
    ├── quickshare/
    └── docs/
```

**Total email assets: 16**
- 2 entry emails (0A, 0B)
- 12 CTA variants (6 emails x 2 paths)
- 2 reminder templates

### Export Options

**AskUserQuestion:** How do you want to export?
- **Quickshare** — Export via `/quickshare` with access control + expiration. Client gets a skill with beliefs, voice skin, and preframed templates baked in. AI assists with story filling + counsel review.
- **Google Doc** — Create a formatted Google Doc (via Playwright) with all emails organized by path. **MANDATORY: After typing each email into the Google Doc, take a `browser_snapshot` to verify the content is actually there before moving to the next email. If content didn't land, retry with a different typing method.**
- **Both** — Quickshare + Google Doc
- **Skip export** — Just save locally for now

### Platform Formatting (for filled emails)

If emails are filled (not templates), ask:

**AskUserQuestion:** What email platform will these go into?
- **Active Campaign** — Format with code blocks + triple blank lines between sections. Include automation notes for dual-path branching.
- **Gmail** — Standard line breaks
- **Other** — Ask for formatting preferences

### Reference Material Loop

After export, explain to <your-name>:
> "When the client submits their filled-in stories or final emails, load them into the reference-material directory. This updates the voice reference and improves future content for this client."

---

## ETHICS CHECK (END)

Before delivering final output:
- Scan ALL emails (both paths + entry emails + reminders) for prohibited language (NEVER/ALWAYS table)
- Verify all stories are framed as authentic — no fabrication
- Verify client's unique voice is centered (Panel 2's final check)
- Golden Rule: "If the client saw these emails, would they feel honored?"
- Ask: "Does this output reflect a Life Gamer or a button masher?"

If ANY check fails, revise before delivering.
