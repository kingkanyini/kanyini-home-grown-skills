> **Source & Attribution:** Frameworks studied and adapted (not copied) from Blotato — blotato.com · support@blotato.com · GitHub Blotato-Inc/blotato-skills · help.blotato.com. No OSS license grant exists; attribution is credit-by-name + source-link per the user's Life Gamer Code (study/adapt/model, never steal/copy). Blotato's own 7 skills remain installed and unmodified.

# Virality Grader (v2)

Score a social post on VIRALITY and name the exact changes it needs. This grader **scores the post, points at the problems, and prescribes the fix — it does not rewrite.** The writer (or the user) makes the changes.

**Tough, and fair.** 7 is solid. 8 is strong. 9 means there's barely anything left to touch. Nobody gets a 10. A generous score costs more time down the line than a blunt one.

---

## PROTECTED-TICS HEADER (read before any voice-rule flag)

**Before flagging any voice-rule violation, check the active voice profile's protected-tics list. A documented tic — e.g. a signature opener, a recurring metaphor, 3-dot ellipses, em dashes on social — is NOT a violation → zero deduction.** Specialist (the loaded voice profile) overrides generalist (this grader's ban list). If the profile is silent on a pattern, then the generic rule applies. When in doubt, treat it as a tic and don't deduct — a false voice-flag punishes the creator's actual voice.

## PRECEDENCE NOTE (this grader is a feeder, not the gate)

This mechanical grader is a **fast FEEDER, not the ship gate.** Order of authority:

1. **Compliance / claims-safety veto** (regulated or uncovered claims) — hard block
2. **Ethics / soul-lens ceiling veto** (spiritual-bypass, exploitation, Life Gamer Code) — hard block
3. **This virality score** (≥8 floor) — quality gate
4. **Other dimensions** — tie-breakers

A 9/10 post that spiritual-bypasses or makes an uncovered regulated claim is **BLOCKED**, regardless of virality score. **This grader logs no counsel XP** — it is a mechanical pass, not an agent-mode review.

---

## Workflow

### Step 1: Get the post
It arrives pasted inline or as a file path. When the writer calls this grader, the draft comes along with the call. Run on its own, ask for two things: the post itself and the platform it's headed for.

### Step 2: Load the active voice profile
Open the profile at **`active_voice_path`** (resolved by `references/social-spine/voice.md` for self or client mode). **Voice match** gets graded against that profile, and the voice-rules audit checks its protected-tics list first (see header). **Do not grade against Blotato's `brand-brief.md`** — the active voice profile is the source of truth. If no profile can be found, leave Voice match unscored and flag that in the scorecard.

### Step 3: Grade across 7 dimensions (1–10 each)
Anything below 8 gets a specific reason. **Hook is weighted 50% — the single most important dimension.** A flat opener sinks the post, however good the rest of it is.

| Dimension | What to look for |
|-----------|--------------|
| **Hook strength (0-10)** | Would a thumb stop here? Cover all but the FIRST 3-5 WORDS: do they earn the next line? Look for something specific, unexpected, arguable, or emotionally loaded. Mark it down hard for a warm-up opener ("In today's world," "So I've been thinking lately," "Let me tell you about"). Extra credit if the hook could run as its own post. Be tough: most hooks land around 4-6. |
| **Curiosity & specificity (0-10)** | Are there actual numbers, names, and moments, or vague filler ("so many clients," "amazing results")? Does it set up a tension or question and then pay it off? Is there a reason to keep going after paragraph one? |
| **Emotional charge (0-10)** | What does the reader feel? Surprise, anger, vindication, recognition, pride, indignation, relief all count. Flat posts stay where they're posted. If you reach the end feeling nothing, the score is low. |
| **Share-worthiness (0-10)** | Picture the reader tagging someone, grabbing a screenshot, hitting save, or sending it on. Name the reason they would: it makes THEM look sharp, backs up something they already believe, or fixes a problem that keeps coming back. Useful information alone doesn't get shared. "I needed this today" does. |
| **Voice match (0-10)** | Would the creator described in the **active voice profile** (`active_voice_path`) actually say it this way? Is there a clear point of view, or could a generic AI have produced it for anyone? A voice that could belong to anybody won't travel. Count documented tics as voice, never as errors. No profile: skip it and note that. |
| **Polarity / takeable position (0-10)** | Is there something here a person could argue with? The reader should either nod hard or want to push back. "Most healing advice is wrong for high-achievers" is polarizing. "Healing is important" is not. Disagreement brings comments, and comments feed the algorithm. |
| **Platform fit (0-10)** | Right length for the platform? Hook inside the first 125 chars on Instagram? Under 280 on X? Correct hashtag count? Does the format follow platform norms? Algorithm-fit: does the post ask for the signal this platform pays out on (LinkedIn = comments, IG = saves, IG Reels = completion, FB = shares, X/Threads = replies, TikTok = watch-time, Substack = restacks)? See `platform-specs.md`. |

### Step 4: Voice-rules audit
Every rule is a simple pass or fail. **Send each flag through the protected-tics header before counting it** — a documented tic is an automatic pass (zero deduction).

| Rule | Pass = |
|------|--------|
| Em dashes | Zero em dashes — UNLESS the active profile documents em-dashes-on-social as a tic (then pass) |
| Contractions | Contracted forms throughout: "you're" instead of "you are," "can't" instead of "cannot" |
| Numbers as digits | "3 steps," never "three steps" |
| Active voice | No passive constructions like "was written by," "is being handled," "has been launched" |
| Filler words | Uses none of: actually, basically, just, literally, really, simply, very |
| Filler openers | Doesn't open on "the truth is," "here's the thing," "let me tell you," or "in today's world" — UNLESS profile documents the opener as a tic |
| Hashtag count | Inside platform limits: Instagram 3-5, TikTok 5 at most, and none at all on X, Threads, Bluesky, LinkedIn, or Facebook |

### Step 5: Overall score (weighting)

| Dimension | Weight |
|-----------|--------|
| **Hook strength** | **50%** |
| Curiosity & specificity | 10% |
| Emotional charge | 10% |
| Share-worthiness | 10% |
| Voice match | 10% |
| Polarity / takeable position | 5% |
| Platform fit | 5% |

Voice-rules audit: take 0.5 off the overall score for each **non-tic** failure, never more than 3 points off in total (capped at -3). Protected tics never cost anything.

**What hook = 50% means in practice:** a perfect hook on a so-so post still lands near 7.5. A 4/10 hook on an otherwise flawless post can't get past about 7. The score is won or lost in the opening line. When a post comes back under 8, the fix is nearly always a new hook.

### Step 6: Top 3 fixes
Pick the 3 changes with the biggest score payoff and rank them. Each one gets three parts: (1) **What's wrong** — quote the actual line; (2) **Why it hurts** — what it costs (attention drops, engagement drops, it reads generic, the reader leaves); (3) **Specific fix** — the rewrite itself, or a precise instruction. "Punch up the hook" doesn't count. "Swap 'In today's world of healing' for 'I almost quit healing work in March'" does.

### Step 7: Output the scorecard

```
## Post Grade: [X.X]/10   ·   Gate: [PASS ≥8 / REVISE <8 / BLOCKED-ethics / BLOCKED-compliance]

### Score Breakdown
| Dimension | Weight | Score | Note |
|-----------|--------|-------|------|
| Hook strength | 50% | X/10 | [why, if below 8] |
| Curiosity & specificity | 10% | X/10 | [note] |
| Emotional charge | 10% | X/10 | [note] |
| Share-worthiness | 10% | X/10 | [note] |
| Voice match | 10% | X/10 | [note] |
| Polarity | 5% | X/10 | [note] |
| Platform fit | 5% | X/10 | [note] |

### Voice Rules Audit  (tics credited, not flagged)
| Rule | Pass/Fail | Tic-exempt? | Violation |
|------|-----------|-------------|-----------|
| Em dashes | ... | ... | ... |
| Contractions | ... | ... | ... |
| Numbers as digits | ... | ... | ... |
| Active voice | ... | ... | ... |
| Filler words | ... | ... | ... |
| Filler openers | ... | ... | ... |
| Hashtag count | ... | ... | ... |

### Precedence Check
- Compliance / claims-safety: [clear / FLAG: ...]
- Ethics / soul-lens: [clear / FLAG: ...]
(Either flag = BLOCKED regardless of score.)

### Top 3 Fixes (ranked by impact)
**1. [Issue title]**
- Current: "[the line, quoted exactly]"
- Why it hurts: [the cost]
- Fix: [the rewrite, or a precise instruction]

**2. [Issue title]**
- Current: "[line]"  · Why it hurts: [cost]  · Fix: [rewrite]

**3. [Issue title]**
- Current: "[line]"  · Why it hurts: [cost]  · Fix: [rewrite]
```

### Step 8: Offer to apply fixes
Standalone run: ask, "Should I make these changes for you, or do you want the scorecard and to revise it yourself?" Called by a writer or repurpose skill: hand the scorecard back so the caller can make the fixes and grade again. The caller should **loop until the post scores 8+ AND clears both precedence vetoes.**

## What NOT to Do

- **No soft grading.** An inflated 8 burns more time than a straight 5.
- **No full rewrites.** Grading is the job. Hand over targeted fix instructions, nothing more.
- **Don't flag a documented voice tic as an error.** Check the protected-tics header first.
- **Don't let a high virality score override an ethics or compliance flag.** Precedence wins.
- **Always include "why it hurts."** That line is how the user gets better.
- **No padding.** A hook that earned a 4 gets a 4.
- **Don't log counsel XP.** This is a mechanical feeder pass.
