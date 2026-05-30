# Template Training Module (Path E Controller)

> Frameworks by 2HB (Joshua Sprague). Full credit to Joshua Sprague for
> the original frameworks and example emails. Adapt these to YOUR voice.

## Path E Welcome Screen

```
============================================================
       TEMPLATE TRAINING
       Proven Email Frameworks by 2HB (Joshua Sprague)
============================================================

  Choose your level:

  [L1] Cultivate Buyer Desire        <- Recommended start
       7 frameworks for writing single emails that sell

  [L2] Launching is Easy
       2 complete launch sequences (8-9 emails each)

  [L3] High Ticket Words Masterclass
       8-email high-ticket selling sequence

============================================================
  All levels available. L1 recommended to build foundations.
```

Present level options via AskUserQuestion. On selection, jump to the matching controller below.

---

## Study -> Practice -> Review Flow (Universal)

Every framework and every campaign email uses this same 3-phase loop.

### Study Phase
1. Read the framework/email description from the loaded template file.
2. Display framework name, concept description, and purpose.
3. Show Joshua Sprague's full example email including subject line.
4. Mark as: **Example by Joshua Sprague (2HB):**
5. Ask via AskUserQuestion: "Ready to write your own version?"

### Practice Phase
1. Load guided interview questions specific to this framework (defined in the template file under each framework's `Interview Questions` section).
2. Ask questions using AskUserQuestion where applicable.
3. Load user voice profile from `~/.claude/references/voice-profiles/[username]/[username]-email.md` (<your-name>'s path: `~/.claude/references/voice-profiles/<your-username>/<your-username>-email.md`).
4. Draft email using framework structure as skeleton, user's voice as flesh.
5. Present the draft with options via AskUserQuestion:
   - **Tweaks** - request specific changes
   - **Send to Review** - move to Review Phase
   - **Read it to me** - read the draft aloud (VoiceMode if available)

### Review Phase
1. Load `modules/voice-foreman.md` and run Voice Foreman authenticity check on the draft.
2. Present cleaned draft if Voice Foreman made changes (show what changed).
3. Run Email Hacker Counsel review in standard 3-hat format:
   - **Laura Belgray** (personality + punch)
   - **Andre Chaperon** (narrative architecture + open loops)
   - **Chase Diamond** (deliverability + conversion mechanics)
4. Ask via AskUserQuestion: "Which feedback resonates? What do you want me to apply?"
5. Apply chosen revisions with edit visibility markers (`>> revised text <<`).
6. Run Counsel Review #2 (shorter pass, focused on applied changes only).
7. Final output + save to the appropriate directory (see controller below).

---

## L1 Controller: Cultivate Buyer Desire

When L1 is selected, show the 7-framework menu:

```
  [1] The "What Not How" Framework
  [2] "I'm thinking of this..." Email
  [3] Story, Takeaway, CTA (STC)
  [4] Story, Results, Question/CTA
  [5] Story About Your Passion + CTA
  [6] Story About Your Worldview + CTA
  [7] "Stack The Deck" (3-Email Sequence)
```

Present via AskUserQuestion. When picked:
1. Read `templates/L1-cultivate-buyer-desire.md`.
2. Find the selected framework's section by heading match.
3. Run **Study -> Practice -> Review** for that framework.
4. Save completed email to: `~/.claude/projects/[username]-emails/training/L1/[framework-name].md`

After completion, offer to return to the L1 menu or back to the level menu.

---

## L2 Controller: Launching is Easy

When L2 is selected, show sequence choice:

```
  [A] High-Ticket Launch (8 emails)
  [B] Low-Ticket Launch (7 emails)
```

Present via AskUserQuestion. After selection, show **Campaign View** with status for each email:

```
  Campaign: [name]
  ──────────────────────────────
  [check] Complete   Email 1: [title]
  [->]  In Progress  Email 2: [title]
  [ ]   Pending      Email 3: [title]
  ...
```

**Status tracking:** Check which files exist in the campaign save directory to determine status:
- File exists and is complete = `[check] Complete`
- File exists but is a draft = `[->] In Progress`
- No file = `[ ] Pending`

**Per-email flow:**
1. Show campaign context: where this email fits in the sequence, what it sets up for the next email.
2. Run **Study -> Practice -> Review** with that context in mind.
3. Save to: `~/.claude/projects/[username]-emails/campaigns/[campaign-name]/email-[N]-[name].md`

**Navigation options** (via AskUserQuestion after each email):
- Pick any email by number
- "Next" for next pending email
- "View" to see campaign status
- "Back" to return to level menu

---

## L3 Controller: High Ticket Words Masterclass

Single 8-email sequence:

```
  Email 1: The High Ticket Opener
  Email 2: Delayed Gratification
  Email 3: Day in the Life
  Email 4: High Level Overview
  Email 5: Social Proof
  Email 6: Principles + Soft Sell
  Email 7: Inspire & Motivate
  Email 8: Social Proof for Next Round
```

Same Campaign View and navigation as L2 (status tracking, pick-any-email flow).

**Extra for L3:** Before each Study phase, display Joshua Sprague's strategy notes for that email position. These notes explain the psychological purpose and sequencing logic from the template file.

**Per-email flow:**
1. Display strategy notes from Joshua Sprague for this email's position.
2. Show campaign context: where it fits, what it sets up.
3. Run **Study -> Practice -> Review**.
4. Save to: `~/.claude/projects/[username]-emails/campaigns/high-ticket-words/email-[N]-[name].md`

**Navigation:** Same as L2 (pick by number, "Next", "View", "Back").

---

## 2HB Attribution

Display this attribution block at the top of every template display during Study phase:

```
────────────────────────────────────────────────────────────
  Frameworks by 2HB (Joshua Sprague). Full credit to Joshua
  Sprague for the original frameworks and example emails.
  Adapt these to YOUR voice.
────────────────────────────────────────────────────────────
```

This attribution is non-negotiable. Every Study phase starts with it. Every saved output includes it as a header comment.
