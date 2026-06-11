---
description: Build a belief-shifting content system from your Offer Optimizer using Bulletproof John's Propaganda Machine framework
---

# Propaganda Machine

When the user invokes `/propaganda-machine`, follow this exact process:

---

## THE CORE CONCEPT

**You're not selling a product or service. You're selling a belief system and an identity system.**

"Good marketers find their ideal customers. Great marketers CREATE their ideal customers." - Dan Henry

The Propaganda Machine is a systematic content and retargeting system that shifts beliefs so prospects close themselves. It's a framework for getting people to believe what they need to believe to make the right decision.

---

## PHASE 0: MAIN MENU (ALWAYS FIRST)

### Load Registry

Read `~/.claude/projects/prop-machine/registry.json`. If it doesn't exist, create it with an empty `"projects": {}` object.

### Display Menu

**If projects exist**, show the project dashboard:

```
╔══════════════════════════════════════════════════════════════╗
║  PROPAGANDA MACHINE — COMMAND CENTER                         ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  [PROJECT NAME]                                              ║
║  Identities:       ████████████ COMPLETE                     ║
║  Core 6 Beliefs:   ████████████ COMPLETE                     ║
║  Shift Frameworks: ████████████ 6/6                          ║
║  Testimonials:     ████████████ MAPPED                       ║
║  YouTube Scripts:  ██░░░░░░░░░░ 1/6                          ║
║  Reels/Shorts:     ░░░░░░░░░░░░ PENDING                     ║
║  Carousels:        ░░░░░░░░░░░░ PENDING                     ║
║  Content Bank:     ░░░░░░░░░░░░ PENDING                     ║
║  Branded Doc:      ░░░░░░░░░░░░ PENDING                     ║
║  Last worked: [date]                                         ║
║                                                              ║
║  [Repeat for each project]                                   ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
```

**Progress bar logic:**
- `░` = pending (0%), `█` = complete
- For beliefs/scripts with counts: calculate fill proportionally (e.g., 1/6 = 2 filled blocks out of 12)
- Show "COMPLETE" or "PENDING" or "X/Y" as appropriate
- Testimonials: "PENDING" (not started), "SCANNED" (files read, clients ID'd), "MAPPED" (clients assigned to beliefs), "N/A" (no transcripts). If the field is missing from the registry (older projects), treat as "N/A" and hide the bar or show N/A.

Then use **AskUserQuestion** with options:
- One option per existing project: "Resume [Project Name]" with description showing next recommended action
- "Start New Project" with description "Build a new Propaganda Machine from an Offer Optimizer"

### If Resume Project

1. Read the project's working files from `~/.claude/projects/prop-machine/[short_code]/`
2. Read the registry entry for full status
3. Determine the **next recommended action** based on status:
   - If shift frameworks incomplete → "Continue Belief #X Shift Framework"
   - If core_6_beliefs complete AND testimonial_import is "scanned" (not yet mapped) → "Map testimonials to beliefs"
   - If core_6_beliefs complete AND testimonial_import is "pending" → mention: "Testimonial transcripts can be imported anytime before Block 5"
   - If YouTube scripts incomplete → "Build YouTube Script for Belief #X" (next pending)
   - If YouTube done but reels pending → "Generate Reels/Shorts"
   - If reels done but carousels pending → "Generate Carousels"
   - If final_output complete but google_doc_export pending/missing → "Export to Branded Google Doc"
   - etc.
4. Show detailed status and use **AskUserQuestion**:
   - "Continue where we left off" (description: the next recommended action)
   - "Pick a specific belief to work on" (description: choose which belief's YouTube script to build)
   - "Jump to a specific phase" (description: Reels, Carousels, Content Bank, etc.)
   - If `testimonial_import` is "mapped" and all 6 Block 5s are written: "Copy Block 5s for paste" (description: "Clean copy of all 6 Client Case Studies for Google Doc or export")
   - If `testimonial_import` is "pending" or missing, and shift_frameworks are in progress: "Import testimonial transcripts" (description: "Scan video testimonial transcripts to populate Block 5s")

### If Copy Block 5s for Paste

When selected: Read `prop-machine.md`, extract all 6 Block 5 sections (title + full content), and present them as clean copy with belief headers — no blockquotes, no markdown formatting artifacts. Ready for direct paste into a Google Doc or other document.

### If Start New Project

Ask via **AskUserQuestion** for:
1. Project name (short, descriptive)
2. Then ask for the Offer Optimizer file path

Create the project structure:
```
~/.claude/projects/prop-machine/[short-code]/
├── prop-machine.md
├── proof-block-mapping.md
└── masterclass-drafts/
```

Ask for the **output directory** (where final .txt/.pdf/.docx files go):
> "Where should final output files be saved? (e.g., a Dropbox folder, Desktop, etc.)"

Add the project to `registry.json` with all statuses set to "pending".

Then proceed to Phase 1.

---

## PHASE 1: INTRODUCTION & PREREQUISITE CHECK

### Welcome Message (New Projects Only)

Say:
> "Welcome to the **Propaganda Machine** - your system for creating belief-shifting content that makes prospects close themselves.
>
> Here's how this works:
> - We'll extract the gold from your completed Offer Optimizer
> - Build your **2 Identities** (Before/After)
> - Map your **Core 6 Beliefs** (what they must believe to buy)
> - Create **Shift Frameworks** for each belief (with proof stacks)
> - Generate **ready-to-film YouTube scripts** for each belief (S1-S7 structure)
> - Generate **Reels, Carousels, and a Content Bank**
>
> **PREREQUISITE:** You need a completed Offer Optimizer file (.md or .txt).
>
> Please provide the path to your Offer Optimizer file, or paste the contents directly."

### After Receiving the Offer Optimizer

Read and parse the file to extract:
- Best client profile (name, details, transformation)
- Point A (Before state) - goals, obstacles, frustrations, worries
- Point B (After state) - results, feelings, operating basis
- What You Did For Them (process, timeline, deliverables)
- Top 3 Key Drivers
- Offer Dashboard (avatar, promise, timeline, structure)
- Solution Matrix (obstacles, fixes, mechanisms)
- About You & Your Company (mission, vision, values, credibility)
- Avatar Motivations (wants, frustrations, aspirations, fears)
- Old vs New Method
- Anti-Avatar

Say:
> "I've extracted your Offer Optimizer data. I can see your best client is **[CLIENT NAME]** and your core transformation is taking them from **[POINT A SUMMARY]** to **[POINT B SUMMARY]**.
>
> Now let's build your Propaganda Machine. Ready to define your 2 Identities?"

### Voice Reference Checkpoint

Before moving to Phase 2, ask:
> "Before we build your belief-shifting content, do you have any other documents I should reference for your voice and style?
> - Emails you've written
> - Training transcripts
> - Video sales letter scripts
> - Charisma Code results
> - Any content that sounds like YOU
>
> This helps me match your cadence and tone when writing your Shift Frameworks. (You can skip this if the Offer Optimizer captures your voice well enough.)"

If provided, read and note key voice patterns: sentence length, word choices, rhythm, favorite phrases, level of directness.

**Voice Profile Creation (MANDATORY for new projects):**

After gathering voice reference materials, check if a voice profile exists at `~/.claude/references/voice-profiles/[client-name]-voice.md`. If not, create one containing:
- Charisma Code breakdown (if available)
- Content Formula (Hook → Message → Close pattern)
- Energy & Delivery guidelines
- AVOID list (what this person would never say/do)
- Voice DNA (sentence length, tone, rhythm, word choices)
- Signature Phrases (from Offer Optimizer + voice docs)
- What They Would / Would Never Say
- Brand Values (voice anchors)
- 10-Point Voice Verification Checklist

Save the path to the registry under `notes.voice_profile`. This profile is used in Pass 2 of the Two-Pass Content Process (see Global Behaviors).

### Testimonial Transcript Import (Optional)

After the voice reference checkpoint, offer the testimonial import option:

> "Do you have **video testimonial transcripts** from clients? If so, I can scan them and pre-map the best client stories to each of your 6 beliefs for Block 5 (Client Case Study) in the Proof Stack.
>
> This saves significant time during the Shift Framework phase — instead of writing Block 5 from scratch for each belief, I'll present 2-3 transcript-sourced options per belief and you pick the best fit.
>
> **What I need:** A folder path containing transcript files (.txt, .srt, .vtt, or .md). I'll handle the rest."

Use **AskUserQuestion** with options:
- "Yes, I have transcripts" (description: "Point me to the folder")
- "Not yet — I'll add them later" (description: "We can import during the Shift Framework phase")
- "No transcripts available" (description: "We'll write Block 5s from the Offer Optimizer")

**If "Yes":**

1. **Ethics gate (MANDATORY):** Ask via AskUserQuestion: "Do you have permission to use these client testimonials in marketing content?" Only proceed on confirmation.

2. Ask for the transcript directory path. Store it in the registry at `testimonial_transcripts.dir`.

3. **Scan Phase:** Read all transcript files in the directory. Auto-detect file patterns:
   - Look for language suffixes (`_en`, `_de`, `_es`), common formats (`.txt`, `.srt`, `.vtt`, `.md`)
   - Propose a filter and confirm with user: "I found [X] files. [Y] appear to be English. Filter for English only?"
   - For `.srt`/`.vtt` files: strip timecodes and join text lines before processing
   - For each valid file, check for **montage/trailer indicators**: very short speaker segments (under 2 sentences per speaker), 3+ distinct voices in a short file, no single narrative arc, or filename containing "trailer", "montage", "reel", "highlight", or "sizzle"
   - If flagged as montage: move to `files_skipped` with reason. Ask user to confirm.

4. **Speaker Identification** (3-tier process):
   - **Tier 1 — File-level clues (high confidence):** File name contains a name, self-introduction in first 20 lines ("My name is..."), single-speaker file with consistent first-person voice
   - **Tier 2 — Content-level clues (medium confidence):** Interviewer addresses speaker by name, contextual identity ("As a photographer..."), occupation/location details
   - **Tier 3 — Cross-file correlation:** Same name/story across files = same person, different context = different person
   - **MANDATORY human checkpoint:** Present all identified speakers with confidence levels. NEVER auto-assign a name at medium/low confidence. Ask user to confirm, correct, or add names.

5. **For large transcript libraries (10+ files):** Process in batches of 5 to maintain accuracy. Scan batch, extract stories, cache results, then continue.

6. **Present scan results:**
   > "I found **[X] testimonial files** with **[Y] distinct clients**:
   >
   > | # | Client | Source File | Key Themes |
   > |---|--------|-------------|------------|
   > | 1 | [Name] | [file.txt] | [theme1, theme2, theme3] |
   > | 2 | [Name] | [file.txt] | [theme1, theme2, theme3] |
   >
   > **Skipped:** [filename] (montage/compilation)
   >
   > Does this look right? Any clients I missed or misidentified?"

7. Update registry: set `testimonial_import` status to `"scanned"`, save `files_scanned`, `files_skipped`, and `clients_identified` under `testimonial_transcripts`.

8. **Do NOT map to beliefs yet.** Mapping happens after Phase 3 (Core 6 Beliefs) when the beliefs are defined. Say: "Transcripts indexed. I'll map the best-fit stories to each belief after we define your Core 6."

**If "Not yet":** Set `testimonial_import: "pending"` in status. The option will resurface at Proof Stack Round 3 (Block 5 moment) for each belief.

**If "No transcripts":** Set `testimonial_import: "n/a"` in status. Block 5 follows existing flow.

---

## PHASE 2: BUILD THE 2 IDENTITIES

### Explanation

Say:
> "**THE 2 IDENTITIES**
>
> Every prospect has two identities battling inside them:
> - The **BEFORE Identity** - who they are now (embarrassed to have, don't want)
> - The **AFTER Identity** - who they want to become (proud to have, aspire to)
>
> Your job is to NAME these identities and make them vivid. When prospects see the Before identity, they should think: *'Shit, that's me. I don't want that.'* When they see the After identity, they should think: *'Yes! That's exactly who I want to be!'*
>
> Based on your Offer Optimizer, here's what I'm seeing..."

### Generate Draft Identities

Using the Point A and Point B data, generate:

**BEFORE IDENTITY:**
- Suggested Identity Name (e.g., "The Hustler", "The Grind & Suppress Guy")
- Statistical undesired current results
- Complaints
- Problems
- Old methods they've tried
- Undesired feelings
- Undesired attributes
- False beliefs

**AFTER IDENTITY:**
- Suggested Identity Name (e.g., "The Wealthy Coach", "The Liberated Warrior")
- Statistical desired results
- Things to be proud of
- What life is like with solutions
- New method
- Desired feelings
- Desired attributes
- True beliefs

Present both identities in a table format and ask:
> "How do these identities feel? Would you like to adjust the names or any attributes?"

**After approval:** Update registry status `identities: "complete"`. Save to project's `prop-machine.md`.

---

## PHASE 3: MAP THE CORE 6 BELIEFS

### Explanation

Say:
> "**THE CORE 6 BELIEFS**
>
> Every prospect needs to shift 6 specific beliefs before they'll buy:
>
> | # | Category | The Shift |
> |---|----------|-----------|
> | 1 | **Core Belief** | Old method -> New method for achieving the goal |
> | 2 | **Real Problem** | What they think is the problem -> What the real problem is |
> | 3 | **Time** | Current priority -> Your method is the priority NOW |
> | 4 | **Money** | Money best spent elsewhere -> Money best spent on this |
> | 5 | **Method** | Old methods work -> Only your method permanently works |
> | 6 | **Help** | Trial & error alone -> Getting expert help is the path |
>
> Let me map these based on your Offer Optimizer..."

### Generate Core 6 Beliefs

Using the Old vs New Method, Solution Matrix, and Avatar Motivations, generate:

| # | Category | Old Belief | New Belief |
|---|----------|------------|------------|
| 1 | Core Belief | The fastest way to [BIG GOAL] is by [OLD METHOD] | The fastest way to [BIG GOAL] is to [NEW METHOD] |
| 2 | Real Problem | The problem is [WHAT THEY THINK] | The real problem is [ACTUAL PROBLEM] |
| 3 | Time | My priority is [CURRENT FOCUS] | [NEW METHOD] is the most important thing right now |
| 4 | Money | My money is best spent on [OTHER THINGS] | My money is best spent on [YOUR SOLUTION] |
| 5 | Method | [OLD METHODS] are the best way | [NEW METHOD] is the best and only permanent way |
| 6 | Help | Doing this on my own through trial & error is best | Getting help and following a proven strategy is best |

Present and ask:
> "Review these 6 belief shifts. Are they accurate to what your prospects need to believe? Any adjustments?"

**After approval:** Update registry `core_6_beliefs: "complete"` and `beliefs` object with taglines. Save to `prop-machine.md`.

### Testimonial-to-Belief Mapping (After Core 6 Defined)

**If `testimonial_import` status is `"scanned"`**, run the mapping step immediately after Core 6 Beliefs are approved:

1. **Read the scan data** from the registry (`clients_identified` with their themes).

2. **Auto-generate a best-fit mapping matrix.** For each of the 6 beliefs, identify the 2-3 best client matches based on thematic alignment between the client's story and the belief's shift:

   > "Here's how your testimonial clients map to each belief:
   >
   > | Belief | Best Fit | Source | Angle | Alt Option |
   > |--------|----------|--------|-------|------------|
   > | #1 Core Belief | [Client] | [file, timestamp] | [angle] | [Alt client] |
   > | #2 Real Problem | [Client] | [file] | [angle] | [Alt client] |
   > | ... | ... | ... | ... | ... |
   >
   > Pick your preferred mapping, or swap any assignments."

3. **Differentiation rules:**
   - Same client CAN appear in up to 2 beliefs, but MUST use a different quote, timestamp, and transformation angle
   - If a client would appear 3+ times, flag it and suggest alternatives
   - Each Block 5 must feel like a distinct story, even if the same person is the subject
   - Include the source file and timestamp range in the mapping for traceability

4. **After user approves the mapping:** Save to registry under `testimonial_transcripts.belief_mapping`. Update `testimonial_import` status to `"mapped"`.

5. Say: "Testimonials mapped. When we hit Block 5 in each Shift Framework, I'll draft from the assigned transcript and you'll review."

---

## PHASE 4: BUILD SHIFT FRAMEWORKS

### Shift Framework Writing Mode

**Two-Pass Content Process (MANDATORY):**

All Shift Framework content follows a two-pass process:

**Pass 1 — Counsel Creates & Reviews:**
The 4-voice counsel (Kennedy, Halbert, Golden, Watts) drafts the content. After drafting each section (Part A, Part B, each Proof Block round), the counsel formally reviews with scores and specific revision notes. Revisions are applied before moving to Pass 2.

**Pass 2 — Client Voice Filter:**
After Pass 1 approval, load the client's voice profile from `~/.claude/references/voice-profiles/[client]-voice.md`. Run the content through the voice profile's verification checklist. Adjust tone, energy, word choices, and sentence structure to match the client's authentic voice. The counsel's arguments stay intact — only the delivery shifts to match how the client actually speaks.

**When writing each Shift Framework, assume the role of a master copywriter channeling:**
- **Dan Kennedy** - No BS, direct response, hard-hitting, logical arguments that cut through resistance
- **Gary Halbert** - Emotional hooks, storytelling, conversational flow that pulls readers in
- **Myron Golden** - Value-based, transformation-focused, speaks to the soul and who they're becoming
- **Alan Watts flavor** - Philosophical wisdom, playful paradox, acceptance of "the way things are"

**Your writing must:**
- Appeal to pathos (emotion), ethos (credibility), and logos (logic) in every argument
- Use **logic traps** that are irrefutable - the reader would feel dumb for disagreeing
- Create arguments that live in their mind "like an itch they can't scratch" if they don't act
- Match the user's voice, style, cadence and tone (pull from their Offer Optimizer language + any voice docs provided)
- Write at **FK6 reading level** (Flesch-Kincaid grade 6) - simplest, most concise, clearest form
- Validate the reader first, support them, keep them safe, give them novelty
- Protect, inspire & motivate them toward action
- Be super direct, No BS, logical, conversational, casual and "matter of fact"
- Weave in moments of philosophical depth that make readers pause and think
- State truths as if they're obvious - because they are
- **25-word hard line cap** — Every sentence under 25 words. Break longer sentences into two. Short fragments hit harder than compound sentences.

**The "Logic Trap" Standard:**
Every argument should pass this test: "If someone disagreed with this out loud, they'd sound foolish." Example:
- WEAK: "You should invest in yourself"
- STRONG: "You already spend money on things that don't change your life. This changes your life. It's not a cost - it's the only investment that pays you back forever."

### Explanation

Say:
> "**THE SHIFT FRAMEWORK**
>
> Now we build irrefutable arguments for shifting each belief. For EACH of your 6 beliefs, we'll create persuasive content that:
> - Makes disagreeing feel illogical
> - Lives in their mind like an itch they can't scratch
> - Speaks to who they're BECOMING, not what they're buying
>
> **Part A - The Problem with Old Belief:**
> - The Old Belief (what they believe NOW that PREVENTS them from buying)
> - Problems this belief causes (specific complaints, problems & unwanted feelings)
> - Cost of keeping this belief (painful costs across ALL areas of life + what they WON'T be able to do)
>
> **Part B - The New Belief Solution:**
> - The Truth (the ONLY way to get [goal] is to [new method] so you can [result])
> - Life with new belief (VIVID description across all life areas + what they'll be ABLE to do)
>
> **Part C - The Proof Stack (8 Content Blocks):**
> 1. Authority Quote - Someone THEY TRUST backs up the belief
> 2. Universal Analogy - A comparison EVERYONE understands
> 3. Universal Story - A parable that makes the belief undeniable
> 4. Personal Story - Your hell island -> discovery -> heaven island
> 5. Client Case Study - Their hell island -> you showed them -> heaven island
> 6. External Case Study - A controlled study with specific stats
> 7. Internal Case Study - YOUR data from your clients
> 8. Other Area - 'You ALREADY do this in [other area], so you KNOW it works'
>
> This is where the magic happens. We're going ONE BELIEF AT A TIME so each one is airtight.
>
> **Before we start:** Do you have any other documents I should pull your voice/style from? (emails, trainings, video sales letters, etc.)"

### Modular Belief Flow (One at a Time)

Process each belief completely before moving to the next. Max 3 questions per section - pull existing data first, only ask for what's missing.

**For Each Belief (1-6):**

Say:
> "**SHIFT FRAMEWORK: BELIEF #[X] of 6 - [CATEGORY]**
>
> Old Belief: *[OLD BELIEF]*
> New Belief: *[NEW BELIEF]*"

---

**Step 4A - The Old Belief & Its Damage:**

Write compelling content for:

| Component | What to Write |
|-----------|---------------|
| **Old Belief** | "What they believe NOW that will PREVENT them from buying" - State it as they would say it in their own head |
| **Problems It Causes** | "This belief causes complaints, problems & unwanted feelings because of THESE reasons" - Be specific and visceral. Use their language. Make them feel seen. |
| **Cost of Keeping It** | "If you keep this belief, it will cost you these PAINFUL things: mentally, spiritually, physically, financially, relationally, and in quality of life PLUS all the things you WON'T be able to do that you WANT to do" - Paint hell island vividly |

Generate draft based on Offer Optimizer data. Write it in Kennedy/Halbert/Golden voice with Watts-style moments of philosophical depth.

Ask: "Does this capture the pain? Anything to add or adjust?" (Question 1 of 3 for this section)

---

**Step 4B - The New Belief & Heaven Island:**

Write compelling content for:

| Component | What to Write |
|-----------|---------------|
| **New Belief (The Truth)** | "The Truth is: The ONLY way to get [goal] is to [new method] so you can [result]" - State it as an obvious fact, not an opinion |
| **Life With New Belief** | "VIVID description of what life looks like mentally, spiritually, physically, financially, relationally and quality of life PLUS all the things you'll be ABLE to do" - Paint heaven island so clearly they can taste it |

Generate draft. Make it irrefutable - disagreeing should feel illogical.

Ask: "Does this paint the picture? Adjustments?" (Question 2 of 3 for this section)

---

**Step 4C - The Proof Stack:**

**IMPORTANT: Present proof blocks 2 AT A TIME to avoid overwhelming the user.**

The 8 blocks are:
1. Authority Quote
2. Universal Analogy
3. Universal Story
4. Personal Story
5. Client Case Study
6. External Case Study
7. Internal Case Study
8. Other Area

**Proof Stack Round 1 (Blocks 1-2):**

Present these two blocks with full copy:

| Block | What to Write |
|-------|---------------|
| **Authority Quote** | "This person YOU TRUST said this quote that backs up the new belief" - Find or suggest a quote that makes the belief feel validated by someone they respect |
| **Universal Analogy** | "Here's a simple comparison EVERYONE understands that reinforces the belief" - Generate 2-3 options. Make disagreeing feel foolish. |

Say: "Proof Stack: Blocks 1-2 of 8. Do these land? Pick your favorite quote option, or share one you love. Any adjustments to the analogy?"

---

**Proof Stack Round 2 (Blocks 3-4):**

| Block | What to Write |
|-------|---------------|
| **Universal Story** | "Here's a story, parable or anecdote, real or fictional that reinforces the belief" - Tell it like Gary Halbert would - conversational, engaging, lands the point |
| **Personal Story** | "I struggled and was on HELL ISLAND. I discovered [new method]. Now I'm on HEAVEN ISLAND." - Pull from About You section or ask for specifics |

Say: "Proof Stack: Blocks 3-4 of 8. Does the universal story land? Does your personal story feel accurate, or do you want to adjust the framing?"

---

**Proof Stack Round 3 (Blocks 5-6):**

| Block | What to Write |
|-------|---------------|
| **Client Case Study** | "[Client] struggled and was on HELL ISLAND. I showed them [new method]. Now they're on HEAVEN ISLAND." — Source depends on testimonial import status (see below) |
| **External Case Study** | "This EXTERNAL AUTHORITY did a controlled study. The results showed that if you do [new method], you'll go from hell island to heaven island. The specific stats are THESE." - Ask if they have one or suggest searching |

**Block 5 Source Logic:**

- **If `testimonial_import` is `"mapped"`:** Read the `belief_mapping` entry for this belief from the registry. Read the assigned transcript file and timestamp range. Draft the Client Case Study using the client's actual words woven into the hell island → intervention → heaven island structure. Include source attribution: `*(Source: [filename], [timestamp range])*`. Present the draft for review.

- **If `testimonial_import` is `"scanned"` but not mapped:** Run the Testimonial-to-Belief Mapping step now (see section after Phase 3). Then draft as above.

- **If `testimonial_import` is `"pending"`:** Offer the import option now:
  > "Block 5 needs a Client Case Study. You have two paths:"
  Use **AskUserQuestion**:
  - "Import from testimonial transcripts" (description: "Point me to a folder of transcript files")
  - "Write from Offer Optimizer" (description: "I'll draft from your Best Client profile")
  - "I'll provide details manually" (description: "Tell me the client story")

- **If `testimonial_import` is `"n/a"` or missing:** Pull from Best Client profile in the Offer Optimizer, or ask the user for the client story. This is the existing behavior.

**Block 5 Overwrite Protection (CRITICAL — from CIPHER):**
Before inserting ANY transcript-sourced Block 5 content, check if that belief's Block 5 in `prop-machine.md` already contains real content (not a placeholder like `[TO BE COMPLETED]` or `[TRANSCRIBE VIDEO TESTIMONIALS FOR THIS]`). If real content exists, present it alongside the new option and ask: "Block 5 for Belief #[X] already has content. Replace it, keep the original, or review both?"

**Block 5 Voice Rules for Transcript-Sourced Content (CRITICAL — from CIPHER):**
- **Client direct quotes from transcripts are DATA, not voice-filterable content.** Wrap them in quotation marks and preserve them verbatim.
- Pass 2 (client voice filter) adjusts the NARRATIVE FRAMING around the quotes only — not the quotes themselves.
- The counsel voice blend (Kennedy/Halbert/Golden/Watts) applies to the storytelling structure, not to the client's words.
- Add `*[FLAG: [Client name] to confirm testimonial usage]*` after each transcript-sourced Block 5.

Say: "Proof Stack: Blocks 5-6 of 8. Client case study good? Do you have an external study to reference, or should I mark [TO BE COMPLETED]?"

---

**Proof Stack Round 4 (Blocks 7-8):**

| Block | What to Write |
|-------|---------------|
| **Internal Case Study** | "WE did a controlled study. The results showed that if you do [new method], you'll go from hell island to heaven island. The specific stats are THESE." - Ask for their data |
| **Other Area** | "You ALREADY do/think this in [other area], so you KNOW it works" - Find a parallel from everyday life that makes the belief feel obvious |

**Before presenting Block 8 options:** Read all previous beliefs' Block 8 entries from `prop-machine.md`. Flag any thematic overlap (e.g., gym/driving/business coaching parallels already used in earlier beliefs). Present fresh parallels first; only reuse a domain if the angle is genuinely different and you note the overlap explicitly.

Say: "Proof Stack: Blocks 7-8 of 8. Do you have internal data to share? Which 'Other Area' analogy resonates - or both?"

---

After all 4 rounds, summarize the complete proof stack with status for each block.

---

### Belief Checkpoint

After completing each belief's Shift Framework:

> "**Belief #[X] Shift Framework complete.**
>
> **What's next?**
> 1. **Keep going** → Move to Belief #[X+1] Shift Framework
> 2. **Save progress** → Save current work and continue later"

**After each belief completion:** Update registry `shift_frameworks.[X]: "complete"`. Save content to `prop-machine.md`.

**Progress Encouragement:**
- After Belief 2: "You're 1/3 through. The hardest part was starting - you've got momentum now."
- After Belief 4: "2/3 complete. These arguments are getting tight. Your prospects won't stand a chance."
- After Belief 6: "ALL 6 SHIFT FRAMEWORKS COMPLETE. You now have an airtight belief architecture. Every objection has an answer. Every doubt has proof."

### Per-Belief Foreman Review (MANDATORY)

**After each belief's Shift Framework (Parts A + B + C) is approved, BEFORE moving to the next belief:**

1. **AI-isms scan** — Check banned phrases + structural patterns from CLAUDE.md. Max 10 em dashes per belief, max 2 "Not X... But Y" contrasts.
2. **Language rules check** — Scan for CLAUDE.md Language Rules table violations.
3. **Voice verification** — If client voice profile exists, run 10-point checklist.
4. **Counsel final pass** — Each voice scores the belief, flags weak arguments or tone drift.
5. **Report + fix** — Present violations, apply fixes, save cleaned version. THEN move to next belief.

The final Quality Audit Gate (after all 6) still runs but becomes a polish pass, not a rescue.

### Quality Audit Gate (After All 6 Shift Frameworks)

**MANDATORY before proceeding to Phase 5.** After all 6 Shift Frameworks are complete, run a full quality audit across ALL content:

**Step 1 — AI-isms Scan:**
Scan all 6 frameworks for banned phrases and structural patterns from the AI-isms Ban List (see CLAUDE.md). Count violations. Fix all matches. Apply long-form limits: max 10 em dashes per belief (not the email rule of 1), max 2 "Not X... But Y" contrasts per belief (rewrite the rest as direct statements).

**Step 2 — Language Rules Check:**
Scan for Language Rules table violations (Ethics section of CLAUDE.md). Fix all matches.

**Step 3 — Client Voice Verification:**
Load the client's voice profile. Run the 10-point Voice Verification Checklist across all 6 frameworks. Flag any sections that don't match the client's energy.

**Step 4 — Counsel Final Review:**
The 4-voice counsel does a final pass. Each voice scores the complete body of work and flags any weak arguments, missed opportunities, or tone inconsistencies.

**Step 5 — Report & Fix:**
Present a summary: total violations found, fixes applied, counsel scores. Apply all fixes. Save the cleaned versions to `prop-machine.md`.

Ask: "Quality audit complete. [X] fixes applied. Ready to move to YouTube scripts, or want to review the changes?"

---

## PHASE 5: YOUTUBE MASTERCLASS SCRIPTS (Per Belief)

### Overview

Each of the 6 beliefs gets its own full YouTube masterclass script following the **S1-S7 structure**. This is the same proven structure used for Belief #1's "Release First. Ask Questions Later." masterclass.

### S1-S7 YouTube Script Structure

Each belief's YouTube script follows these 7 sections:

| Section | Name | Duration | Purpose |
|---------|------|----------|---------|
| S1 | **The Hook** | 30-60s | Pattern interrupt + promise. "In this video..." |
| S2 | **The Setup / Credibility** | 2-3 min | Who you are, why you're qualified, subscribe CTA |
| S3 | **The Old Belief & Its Cost** | 5-8 min | Paint hell island. Make them feel the weight of the old belief. |
| S4 | **The Bridge / Personal Story** | 5-8 min | Your hell island → discovery → transformation. The turning point. |
| S5 | **The New Belief + Initial Proof** | 8-12 min | Introduce the new belief. Deploy proof blocks: authority quotes, universal stories, client case studies. |
| S6 | **Proof Stack Deep Dive** | 15-25 min | The case. External research, internal data, analogies. Make it irrefutable. |
| S7 | **The Invitation** | 3-5 min | Breathwork demo + tiered CTA (subscribe / free resource / 1:1 booking) |

### Proof Block Mapping (MANDATORY)

Each belief's YouTube script gets its own **proof block mapping**. Before writing ANY section of a YouTube script, Claude MUST:

1. Read the belief's Shift Framework from `prop-machine.md` to see all 8 proof blocks
2. Read/create the proof block mapping in `proof-block-mapping.md` (organized by belief)
3. Decide which blocks go in which sections (S5 vs S6 vs S7)
4. Track deployment after each section is merged

**File:** `~/.claude/projects/prop-machine/[project]/proof-block-mapping.md`
**Format:** One section per belief, with deployed vs. available tables.

### Script Writing Process (Per Belief)

When building a YouTube script for Belief #[X]:

**Step 1:** Read the Shift Framework for that belief from `prop-machine.md`

**Step 2:** Present the section plan:
> "**YOUTUBE MASTERCLASS: BELIEF #[X] — "[NEW TAGLINE]"**
>
> Here's the S1-S7 plan for this script. I'll map your proof blocks across sections before we start writing."

Show the proof block placement plan (which blocks go in S5, S6, S7).

**Step 3:** Write sections using the **4+1 counsel process:**
- 4 counsel voices (Dan Kennedy, Gary Halbert, Myron Golden, Alan Watts) draft the section
- Present to <your-name> for review in ~10 line chunks
- Counsel auto-reviews <your-name>'s suggestions inline
- Merge approved sections into `prop-machine.md`

**Step 4:** After each section is approved and merged:
- Update the proof block mapping
- Save progress to registry

**Step 5:** After all 7 sections complete:
- Update registry `youtube_scripts.[X]: "complete"`
- Show updated progress dashboard

### Script Checkpoint (After Each Belief's YouTube Script)

> "**Belief #[X] YouTube Script complete.**
>
> YouTube Progress: [X]/6 scripts done
>
> **What's next?**
> 1. **Next YouTube script** → Belief #[next pending]
> 2. **Move to Reels/Shorts** → Generate short-form from completed scripts
> 3. **Save and come back later**"

### Writing Rules for YouTube Scripts

These rules apply to ALL YouTube script writing:

- **Raw script only** — no formatting instructions unless they're stage directions in brackets
- **~10 line chunks** for review — don't dump walls of text
- **Counsel auto-reviews** <your-name>'s edits inline (the 4 voices comment on changes)
- **Gender rules:** spouse not wife, they/them, people not men, masculine energy archetype (not gendered)
- **Stage directions** in square brackets: `[Beat.]`, `[Lean in.]`, `[Pause. Let it land.]`
- **Read the proof block mapping** before writing each section
- **Update the mapping** after merging each section

---

## PHASE 5B: REELS/SHORTS SCRIPTS

Say:
> "**REELS & SHORTS (30-90 seconds each)**
>
> Each proof block from your completed YouTube scripts becomes its own short-form video. The hook is the NEW BELIEF statement.
>
> Here are your scripts..."

For each proof block, generate:
- **Hook** (the new belief statement)
- **Body** (the proof block content, condensed to 60-90 seconds)
- **CTA** ("Follow for more" or "Comment [KEYWORD] for my free [RESOURCE]")

**After completion:** Update registry `reels: "complete"`.

### PHASE 5C: CAROUSEL OUTLINES

Say:
> "**CAROUSEL CONTENT**
>
> Carousels sell them on the big idea, give value, then CTA to comment for a lead magnet.
>
> Here are 3 carousel outlines based on your beliefs..."

Generate 3 carousel outlines:
- Slide 1: Hook (pattern interrupt + promise)
- Slides 2-7: The belief shift content (problem -> proof -> solution)
- Slide 8: CTA (Comment "[KEYWORD]" to get [LEAD MAGNET])

**After completion:** Update registry `carousels: "complete"`.

---

## PHASE 6: MASTER BELIEF LIST (CONTENT BANK)

Say:
> "**YOUR MASTER CONTENT BANK**
>
> Based on your 6 beliefs and Offer Optimizer, here are 20+ content topics you can create. Each one shifts a belief and feeds your Propaganda Machine."

Generate a customized list organized by:

**Identity & Mindset** (5-7 topics)
**The Real Problem** (5-7 topics)
**The Solution** (5-7 topics)
**Why You** (5-7 topics)
**Why Now** (3-5 topics)
**Money** (3-5 topics)
**Help & Support** (3-5 topics)

**After completion:** Update registry `content_bank: "complete"`.

---

## PHASE 7: OUTPUT & COMPLETION

### Generate Final Output

Save the complete Propaganda Machine document to the project's **output directory** (from registry).

Use **AskUserQuestion** to offer output format:

1. **Markdown Document** — Clean, structured text you can copy, edit, or convert to PDF
2. **COPY_FIELDS** — Each field on its own line for easy copy-paste into Canva templates
3. **Branded Google Doc** — A professionally styled Google Doc using the client's brand colors

### If they choose Markdown:
Save to `[output_dir]/[project]-prop-machine-final.md` with all collected data organized by section with clear headers.

### If they choose COPY_FIELDS:
Save to `[output_dir]/[project]-COPY_FIELDS.txt` with each field on its own line for Canva.

### If they choose Branded Google Doc:

This creates a polished, brand-colored Google Doc that feels like a finished deliverable. Reference the example-collective Offer Optimizer Google Doc as the gold standard: `https://docs.google.com/document/d/1Bp9JdrvmzvwGuz5yVyHJfjPz54V8JrzzQbD67pKIb-o/edit`

Follow these steps:

**Step 1 — Create the Google Doc via Playwright:**
- Open Google Docs and create a new blank document
- Title it: "[PROJECT NAME] Propaganda Machine — [CLIENT NAME]"
- Type all content using proper heading hierarchy:
  - H1: Document title + major section headers (e.g., "IDENTITIES", "CORE 6 BELIEFS", "SHIFT FRAMEWORKS")
  - H2: Belief headers, YouTube script headers (e.g., "BELIEF #1 — Core Belief: 'Align First'")
  - H3: Sub-sections (e.g., "Part A — The Old Belief & Its Damage", "Block 1: Authority Quote")
  - Bold labels for field names and belief categories
  - Italic for taglines, belief statements, and identity descriptions
  - Normal text for framework content, proof blocks, and script body
- Include all completed phases: Identities, Core 6 Beliefs, Shift Frameworks (Parts A/B/C with all proof blocks), YouTube Scripts (S1-S7), Reels, Carousels, Content Bank
- Mark any incomplete sections with `[TO BE COMPLETED]` placeholder text
- Add horizontal rules (insert → horizontal line) between each major section for visual separation
- The Propaganda Machine doc is significantly longer than an Offer Optimizer — type content section by section to avoid browser timeouts

**Step 2 — Load or extract brand colors:**
- **First:** Check the project registry for `brand_colors`. If colors exist, confirm with user and skip extraction.
- **If no brand colors in registry:** Ask via AskUserQuestion:
  - "I have your client's website URL — let me extract brand colors" (provide URL)
  - "I'll provide hex codes manually"
  - "Use a neutral default palette"
- **If extracting from website:** Navigate via Playwright, use `page.evaluate()` with `getComputedStyle()`:
  - Check `:root` for CSS custom properties matching common patterns (`--primary`, `--brand`, `--accent`, `--color-heading`, etc.)
  - If fewer than 3 colors found, sample computed styles from: `h1` (text color), `nav/header` (background), `a` (link color), `body` (background)
  - Map extracted colors to semantic roles:
    - Header/nav background color → **Dark Primary** (used for H2 banners)
    - Button/CTA color → **Accent** (used for H3 text)
    - Any gold/highlight accent → **Highlight** (used for H2 banner text)
    - Main background color → **Light Primary** (used for H1 background)
    - Secondary/alt section background → **Light Secondary** (used for H3 background)
- **Validate all colors** match `/^#[0-9A-Fa-f]{3,8}$/` before saving (prevents injection into Apps Script)
- Present the extracted palette to the user: "These are the brand colors I found. Want to adjust any before I apply them?"
- **Save approved colors** to the project's registry entry under `brand_colors` so they persist for future exports
- If the client's website doesn't have enough distinct colors, suggest a complementary palette based on what's available

**Step 3 — Apply brand styling via Apps Script:**
- **Before running any script:** Note the current doc URL + timestamp as a version recovery point. Tell user: "Saved a version checkpoint before applying colors."
- Open the bound Apps Script editor (Extensions → Apps Script) in the Google Doc
- Use clipboard paste (not keyboard typing) to enter the script — Monaco editor auto-completes brackets when typing, which causes syntax errors
- The Apps Script must be **style-only** — it must NEVER call `replaceText()`, `removeFromParent()`, or any content-modifying method. Only formatting: `setBackgroundColor()`, `setForegroundColor()`, `setSpacingBefore()`, `setSpacingAfter()`, `setAlignment()`
- Run a styling function that:
  - H1 paragraphs: Light Primary background, Dark Primary text, centered, 12pt before/after
  - H2 paragraphs: Dark Primary background, Highlight text (banner effect), 20pt before / 8pt after
  - H3 paragraphs: Light Secondary background, Accent text, 14pt before / 6pt after
  - All `[TO BE COMPLETED]` text: colored in bright red (#FF0000) — NEVER use brand color for gaps
- Handle the Google OAuth authorization flow if prompted — the OAuth popup opens in a separate window that Playwright cannot control (cross-origin policy). Prompt user to click through manually. **Note:** OAuth only appears on FIRST RUN of a new script. Re-runs on the same doc skip it.
- After script completes, navigate back to the doc and take a screenshot. Present to user: "Here's how the branded doc looks. Approve or adjust?"

**Color mapping template for the Apps Script:**
```
Dark Primary    → H2 background, H1 text
Highlight       → H2 text
Accent          → H3 text
Light Primary   → H1 background
Light Secondary → H3 background
#FF0000 (red)   → [TO BE COMPLETED] gap text (NEVER use brand color for gaps)
```

**Step 4 — Save and share:**
- Save the Google Doc URL to the registry under `branded_doc_url`
- Ask via AskUserQuestion: "Want to share this doc with anyone?" — if yes, get email and share permissions

**Tips:**
- Always use clipboard paste to enter code into Apps Script editor (`page.evaluate` to write to clipboard, then Ctrl+V) — never use `keyboard.type()` as Monaco's auto-completion will break the code
- Wait for Monaco editor to fully initialize before pasting (use `waitForSelector` on the editor container + `waitForTimeout(1000)`)
- After clicking Run in Apps Script, wait for the execution log to show "Execution completed" (with a 30-second timeout)
- The horizontal rules should be added during Step 1 (content creation), not during the styling script

Update registry `final_output: "complete"`, `google_doc_export: "complete"` (in status), and `last_updated`.

### Final Message

> "Your Propaganda Machine for **[PROJECT NAME]** is COMPLETE.
>
> You now have:
> - 2 Named Identities (Before/After)
> - 6 Core Beliefs mapped
> - 6 Complete Shift Frameworks with Proof Stacks
> - 6 YouTube Masterclass Scripts (S1-S7 each)
> - Reel/Short scripts per proof block
> - Carousel outlines
> - 20+ content topics in your Master Bank
> - Branded Google Doc (if exported)
>
> Files saved to: `[output_dir]`
>
> **NEXT STEPS:**
> 1. Film your YouTube videos (use Descript to edit)
> 2. Clip each proof block into 30-90 second shorts
> 3. Post 1-2 Reels/Shorts per day
> 4. Post 1-2 YouTube videos per week
> 5. Every time you get an objection or client issue, make content about it and add to the machine"

---

## GLOBAL BEHAVIORS

### Registry Management (CRITICAL)

The registry at `~/.claude/projects/prop-machine/registry.json` is the **single source of truth** for all project state. Claude MUST:

- **Read it** at the start of every `/propaganda-machine` session (Phase 0)
- **Update it** after every phase completion, belief completion, or YouTube script completion
- **Never lose data** — always read before writing, merge changes, don't overwrite

#### Registry Fields Reference

Each project entry supports these optional fields (added dynamically during workflows):

| Field | Added When | Purpose |
|-------|-----------|---------|
| `brand_colors` | Branded Google Doc export (Phase 7, Step 2) | Persists extracted brand colors so future exports skip re-extraction |
| `branded_doc_url` | Branded Google Doc export (Phase 7, Step 4) | URL of the exported Google Doc for easy retrieval |
| `testimonial_transcripts` | Phase 1 testimonial import or Phase 4 Block 5 moment | Stores transcript directory, scan results, client IDs, and belief-to-client mapping |
| `testimonial_import` (in `status`) | Phase 1 or Phase 4 | Tracks testimonial workflow: `"pending"`, `"scanned"`, `"mapped"`, or `"n/a"` |

**`testimonial_transcripts` format:**
```json
"testimonial_transcripts": {
  "dir": "C:\\path\\to\\transcripts",
  "files_scanned": ["client-feedback_en.txt", "interview_en.txt"],
  "files_skipped": [{"file": "trailer_en.txt", "reason": "montage/compilation"}],
  "clients_identified": [
    {"name": "Client Name", "source": "client-feedback_en.txt", "themes": ["focus", "revenue", "alignment"]},
    {"name": "Unnamed Client", "source": "interview_en.txt", "themes": ["confusion", "clarity"]}
  ],
  "belief_mapping": {
    "1": {"client": "Client Name", "source": "client-feedback_en.txt", "timestamp": "0:00-3:22", "angle": "scattered → focused"},
    "2": {"client": "Unnamed Client", "source": "interview_en.txt", "angle": "confusion → clarity"}
  },
  "status": "mapped"
}
```

**`brand_colors` format:**
```json
"brand_colors": {
  "dark_primary": "#1C1C1C",
  "highlight": "#C8A45B",
  "accent": "#5B202F",
  "light_primary": "#D7CFC6",
  "light_secondary": "#E7D7C5"
}
```

### File Structure Per Project

```
~/.claude/projects/prop-machine/[short-code]/
├── prop-machine.md              # Main working document (identities, beliefs, frameworks, scripts)
├── proof-block-mapping.md       # Per-belief proof block deployment tracking
├── testimonial-index.md         # Client profiles extracted from transcripts (if imported)
└── masterclass-drafts/          # Section drafts during writing (temporary)
```

**Final outputs** go to the project's `output_dir` (set during project creation, stored in registry).

### Copywriting Standards (Kennedy / Halbert / Golden + Watts Mode)

**The Voice Blend:**
- **Dan Kennedy** - No BS, direct, hard-hitting logical arguments that leave no room for objection
- **Gary Halbert** - Emotional hooks, storytelling, conversational flow that draws readers in
- **Myron Golden** - Value-based, transformation-focused, speaks to the soul and who they're becoming
- **Alan Watts flavor** - Philosophical depth, playful paradox, acceptance of "what is"

**The Standards:**
- **FK6 reading level** - If a 6th grader can't understand it, simplify it
- **Logic traps > emotional manipulation** - Make disagreeing feel illogical, not guilt-trippy
- **"Matter of fact" tone** - State truths as if they're obvious (because they are)
- **Validate THEN challenge** - Never make the reader feel attacked or stupid
- **Hell island / Heaven island** - Always paint the contrast vividly and specifically
- **Philosophical moments** - Occasional Alan Watts-style wisdom that makes readers stop and reflect
- **Transformation over transaction** - Speak to who they're becoming, not what they're buying

**Logic Trap Examples:**
| WEAK (Easy to dismiss) | STRONG (Irrefutable) |
|------------------------|----------------------|
| "You need to invest in yourself" | "You already spend money on things that don't change your life. This changes your life." |
| "Time is running out" | "Every day you wait is a day you're choosing the old results over the new ones." |
| "This will help you" | "You've tried [old method] and it didn't work permanently. This is the only thing you haven't tried." |
| "Trust the process" | "You trusted the process when you learned to drive. It felt weird at first. Now you don't think about it." |

### Two-Pass Content Process (GLOBAL)

All public-facing content (Shift Frameworks, YouTube scripts, Reels, Carousels) follows this two-pass process:

| Pass | Who | What |
|------|-----|------|
| **Pass 1** | 4-Voice Counsel (Kennedy, Halbert, Golden, Watts) | Draft content, review with scores, apply revisions. The counsel owns the arguments, logic traps, and persuasive structure. |
| **Pass 2** | Client Voice Profile Filter | Load `~/.claude/references/voice-profiles/[client]-voice.md`. Run content through the voice verification checklist. Adjust delivery (tone, energy, word choices, sentence structure) to match how the client actually speaks. Counsel's arguments stay intact. |

**When to run Pass 2:**
- After each Part A + Part B approval (before Proof Stack)
- After each Proof Stack round approval
- After each YouTube script section approval
- During the Quality Audit Gate (all 6 beliefs at once)

**If no voice profile exists:** Skip Pass 2 and note in registry that content needs voice filtering when a profile is created.

### Quality Audit Standards

The Quality Audit runs at two points:
1. **After all 6 Shift Frameworks complete** (mandatory gate before Phase 5)
2. **After all 6 YouTube scripts complete** (mandatory gate before Phase 5B)

Each audit includes: AI-isms scan, Language Rules check, Voice Verification, Counsel final review, and a fix report.

### Proof Block Options

When writing proof blocks, present **2-3 full options** per block using AskUserQuestion. Let the user choose their favorite or combine multiple. This applies to: Authority Quotes, Universal Analogies, Universal Stories, External Case Studies, and Other Area blocks. Personal Stories get 1 draft (since they're based on real events) with the option to adjust. Client Case Studies: if transcript-sourced, present 2-3 options per belief from the mapped transcripts; if manual, present 1 draft from Best Client profile with the option to adjust.

### Collaborative Assistance
If the user gets stuck at any point, offer to generate suggestions based on what they've already provided. Never leave them hanging.

### Progress Tracking
Always show progress: "Belief X of 6" and "Phase X of 7". When resuming, show the full dashboard from Phase 0.

### Voice & Tone
- Direct, no BS, logical
- Conversational and casual
- Use the user's language from their Offer Optimizer
- Match their voice docs if provided
- Gaming references where appropriate (for <your-name>'s content)

### Question Pacing
- Max 3 questions per section (fewer if info already exists from Offer Optimizer)
- Show progress: "Question X of 3 for this section"
- Pull existing data first, only ask for what's missing

### Proof Stack Help
For proof blocks the user can't fill:
- Suggest they Google for relevant research/quotes
- Offer to generate fictional examples they can later verify
- Mark as "[TO BE COMPLETED]" if needed

### Output Formats
When complete, offer:
1. **Markdown Document** - Full formatted version
2. **COPY_FIELDS Version** - Each field on its own line for easy copy-paste into Canva templates
3. **Branded Google Doc** - Professionally styled Google Doc using the client's brand colors (see Phase 7)
