# Output Formats — SS Ad Generator

This file defines the available output formats for final deliverables. Load at Phase 5 when the user selects their preferred format.

---

## FORMAT A: FULL VIDEO AD SCRIPT

The complete word-for-word script. Use for reference, teleprompting, or when the performer wants exact language.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AD #[X] — [TRIGGER NAME]: "[Ad Title]"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[OVERLAY HOOK]
"[Text overlay that appears on screen — the scroll-stopper]"

[SCRIPT]

[Opening lines — the spoken hook. Must grab attention in ≤3 seconds. No greetings.]

[Opening Realization — "I thought X was the problem..." with stacking rhythm]

The REAL problem [deeper truth reveal — always a new layer, not a restatement]

The simple shift [mechanism introduced naturally as discovery, not pitch]

[Proof — specific story with details, named or anonymous per assignment card]

[Social Proof — "others like you" energy, woven conversationally]

[Soft CTA — exact text from funnel mapping]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## FORMAT B: OUTLINE / BEAT SCRIPT (Filming Guide)

For clients who film the ads themselves. Gives them the spoken hook word-for-word + bullet-point beats so they can deliver naturally on camera without memorizing a full script.

**KEY DISTINCTION:**
- **Overlay hook** = text graphic on screen (what viewers READ)
- **Spoken hook** = what the performer SAYS in the first 3-5 seconds (what viewers HEAR)
- These may be the same, or the spoken hook may expand on the overlay with a different rhythm

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AD #[X] — [TRIGGER NAME]: "[Ad Title]"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OVERLAY HOOK (text on screen):
"[The pattern-interrupt headline — appears as text graphic]"

HOOK (Spoken — deliver these lines word-for-word):
"[Opening lines the performer says on camera.
These are the first 3-5 seconds.
Written to create instant identification.
No greetings. Direct hook.]"

OUTLINE:
• TURNING POINT — [1-sentence description of the emotional realization beat]
• THE REAL PROBLEM — [Key insight to land. Include the exact phrase to say.]
• THE SIMPLE SHIFT — [What changed. Include trigger phrase.]
• PROOF — [Who + what happened + the specific detail that makes it real]
• SOCIAL PROOF — ["Others like you" framing note]
• CTA — "[Exact closing words]"

KEY LINES (must appear somewhere in delivery):
• "[trigger phrase 1]"
• "[most powerful line from full script]"

TONE: [One sentence on delivery energy — e.g., "Quiet intensity, like telling a friend something real."]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## FORMAT C: BOTH (Full Scripts + Outlines)

Deliver Format A first (all 14 full scripts), then Format B (all 14 outlines) as a companion section. This is ideal for clients who want reference copy AND a filming guide.

---

## FORMAT TRANSFORMER INSTRUCTIONS

If the user chose Format B or C, and full scripts were generated in Phase 3, run a Format Transformer to convert:

1. Launch **1 Opus agent** with all 14 final scripts + the outline template above
2. Agent extracts from each script:
   - The overlay hook (already labeled [OVERLAY HOOK])
   - The spoken hook (opening lines before "The REAL problem" — this is what the performer says first)
   - Bullet beats for each structural section (turning point, real problem, simple shift, proof, social proof, CTA)
   - 2-3 key lines that must appear (trigger phrases + most powerful lines)
   - A tone note based on the emotional angle of the trigger
3. Agent returns all 14 outlines in Format B structure
4. Present to user for review

**IMPORTANT:** The spoken hook is NOT always identical to the overlay hook. The overlay is visual bait (text on screen). The spoken hook is verbal momentum (first words out of the performer's mouth). They serve different functions and may differ in phrasing, length, or rhythm.

---

## GOOGLE DOC DELIVERY

After all formats are generated, offer delivery:

> "Want me to create a Google Doc with everything? I can use the Google Doc Builder to format it and put it right in your Drive."

If yes:
1. Invoke `/google-doc-builder` skill
2. Use "From this conversation" mode
3. Account: ask user which Google account
4. Document structure:
   - Title (H1, centered): "[Offer Name] — Ad Scripts & Triggers"
   - Subtitle: "Prepared for [Client Name] | [Month Year]" + "Created by <your-name> (<your-name>)"
   - How to Use This Document (H2)
   - Part 1: 14 Psychological Triggers (with belief shifts and ad angles)
   - Part 2: 14 Full Ad Scripts (if Format A or C)
   - Part 3: 14 Outline Scripts (if Format B or C)
   - Part 4: Video Reference Links (placeholder section for <your-name> to add)
5. Post-creation: per user preference (leave in Drive, move to folder, download)

---

## SAVE LOCATIONS

**Campaign Folder:** `~/.claude/projects/[offer-name]-ads-[date]/`

| File | Content |
|------|---------|
| `business-profile.md` | Business Profile Card + funnel lock + proof inventory |
| `triggers.md` | All 14 psychological triggers with rationale |
| `ads.md` | All 14 full-length video ad scripts |
| `outlines.md` | All 14 outline/beat scripts (if Format B or C) |
| `counsel-notes.md` | All counsel reviews + boss review passes |
| `full-report.md` | Combined master document |

### full-report.md Structure

```markdown
# Subconscious Seduction Ad Report
**Offer:** [Offer Name]
**Created:** [Date]
**Built For:** [<your-name> / Client Name]

---

## Business Profile
[Full Business Profile Card]

---

## 14 Psychological Triggers (Summary)
[Table: #, Trigger, Hook Preview]
*(Full trigger details in `triggers.md`)*

---

## Top 3 Ads to Test First (Counsel's Pick)
[Top 3 with hooks and reasoning]
[Second wave picks]
[Strategic testing logic / diagnostic triangle]

---

## 14 Video Ad Scripts
*(Full scripts in `ads.md`)*

---

## 3-Hat Counsel Notes
*(Full counsel feedback in `counsel-notes.md`)*

---

## Revision Log
[All passes documented with changes]

---

## Delivery
[Google Doc link if created, format notes]

---

## Next Steps
1. Film the Top 3 ads first (counsel-recommended)
2. Test different overlay hooks as A/B variants
3. Track which TRIGGER performs best (not just which ad)
4. Double down on winning triggers with new angles
5. Second wave after first-wave data
6. Consider Reels versions (15-30 sec) of top performers

---

*Remember: The ad is just the vehicle. The BELIEF SHIFT is what makes the sale.*
```
