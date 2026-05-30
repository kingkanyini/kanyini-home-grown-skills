# Voice Foreman

3-layer quality gate: it catches universal AI patterns (Layer 1), personal voice mismatches (Layer 2), and runs a 7-command Humanization Pass (Layer 3) on every email draft before it reaches counsel review. The Foreman fixes problems, not just flags them.

---

## When This Module Loads

The Voice Foreman runs at the draft-to-counsel transition in every path:

- **Path A Step 3** — After the fresh draft is generated, before counsel reviews it
- **Path B Step 3** — After the polish pass, before counsel reviews it
- **Path D Step 3a/3b** — After edit or reload produces an updated draft, before counsel reviews it
- **Path E Review Phase** — After the practice draft is written, before counsel reviews it

No path skips the Foreman. If a draft exists and counsel hasn't seen it yet, the Foreman runs.

---

## Execution Protocol

### Step 1: Load Ban Lists

1. Read `reference/ai-ism-ban-list.md` from this plugin directory. This is the **Layer 1** source — universal bans that apply to every user, every email, no exceptions.
2. Read the user's voice profile at `~/.claude/references/voice-profiles/[username]/[username]-email.md` (<your-name>'s path: `~/.claude/references/voice-profiles/<your-username>/<your-username>-email.md`). Load the `## 0.6 Guardrails MANIFEST` section (and, if present, the full `## 6.12 What [User] Never Does` list it points to — deep profiles keep the canonical ban list there). This is the **Layer 2** source — personal violations specific to that user's voice. Also load their `## 0.5 Signature Phrases` and `## 0.4 Voice DNA` sections for cross-reference. (Profiles follow the gold-standard email template — Part 0 holds these stable §0.x anchors.)

If the voice profile doesn't exist yet, run Layer 1 only and note that Layer 2 was skipped.

3. Layer 3 — the Humanization Pass — needs no file. Its 7 commands are defined in Step 2 below and canonically in the gold standard `gold-standards/voice-profile/voice-profile-email.md` (your vault). It runs on every draft regardless of whether a voice profile exists.

### Step 2: Scan the Draft

**Layer 1 — Universal AI-ism Check:**
- Check every sentence against the Banned Phrases table. Match partial phrases (e.g., "dive deep" inside a longer sentence still triggers).
- Check overall structure against Banned Structural Patterns. Count em dashes, count rhetorical questions, check paragraph openers for repetition, check endings for "Remember" wrap-ups.

**Layer 2 — Personal Voice Match:**
- Check against the user's "NEVER say" list from their Guardrails section.
- Check against any voice violations listed in their profile (words, tones, or patterns they specifically reject).
- Compare sentence rhythm to their Voice DNA. Flag if average sentence length drifts more than 40% from their documented range. Flag if the conversational-to-formal ratio doesn't match their profile.

**Layer 3 — Humanization Pass (rewrite, not just scan):**

After Layers 1-2, run all 7 commands in order on the draft. Unlike Layers 1-2 (catch + fix named patterns), this is a holistic rewrite pass that makes the draft read like a person wrote it, not a generator. Run it every time.

1. **HUMAN REWRITE** — Rewrite anything that reads as built, not spoken: rougher, more direct, the way someone who lived it would say it. Cut what's rehearsed or written to impress. Keep the length.
2. **THOUGHT FLOW** — Make the ideas move like a real mind: uneven, punchy in places, slower in others. Break any too-even, too-controlled rhythm. Real-thought cadence (fragments, the odd dash, an "And" opener) is allowed — UNLESS the user's profile caps it (Layer 2 wins).
3. **PATTERN DISRUPTOR** — Kill three-beat fragments, "not just X, but Y" constructions, corporate adjectives. Every word chosen in the moment.
4. **VOICE SHAPER** — A clear point of view, not a please-everyone observer. Let opinions, contradictions, and tone shifts show. The reader should know exactly what the writer thinks.
5. **CONCRETE DETAIL** — Put one real, specific detail where it belongs. AI can't invent the tuna sandwich on the bench. One concrete detail beats three smooth sentences.
6. **MAKE IT HIT** — The opening line must earn the second; same for the CTA. Cut or sharpen any line that doesn't pull the reader forward.
7. **CREDIBILITY TEST** (final, adversarial) — Read as a skeptic who distrusts anything too clean. Sentence by sentence, rewrite whatever feels constructed, overcorrected, or too precise. It should read like a real person said it out loud.

### Step 3: Fix and Report

Based on total matches found across all three layers (Layer 3 rewrites count as fixes):

**0 matches** — Pass silently. Do not mention the Foreman ran. Proceed directly to counsel.

**1-2 matches** — Fix them inline. Add a one-line note after the draft:
```
Voice Foreman: Cleaned 2 AI patterns.
```
Then proceed to counsel with the cleaned draft.

**3+ matches** — Fix all of them, then display the report before counsel:

```
╔══════════════════════════════════════════════════════════════╗
║  VOICE FOREMAN REPORT                                        ║
╠══════════════════════════════════════════════════════════════╣
║  [X] patterns caught and fixed                               ║
║                                                              ║
║  1. "Here's the thing about healing..."                      ║
║     → "Healing works differently than you'd expect..."       ║
║     [Layer 1: Banned phrase]                                 ║
║                                                              ║
║  2. "Navigate your transformation"                           ║
║     → "Work through your transformation"                     ║
║     [Layer 1: Banned phrase]                                 ║
║                                                              ║
║  3. "This isn't woo-woo nonsense"                            ║
║     → (removed — user Guardrail: never dismiss spirituality) ║
║     [Layer 2: Personal violation]                            ║
╚══════════════════════════════════════════════════════════════╝
```

Ask the user to confirm the fixes before passing the cleaned draft to counsel. If they reject a fix, restore the original and move on.

---

## Rules

1. **Never skip the Foreman.** It runs on every path, every draft, no exceptions. There is no flag to bypass it and no "quick mode" that omits the scan.

2. **Fix, don't just flag.** Every caught pattern must include the replacement text, not just a warning. The user should see what they're getting, not a list of problems to solve themselves.

3. **Layer 1 is non-negotiable.** Universal AI-isms get caught regardless of the user's profile, preferences, or voice style. "Dive deep" is banned whether you write healing emails or sales emails.

4. **Layer 2 adapts to the user.** If their voice profile says they use spiritual language, don't flag spiritual language. If they embrace em dashes as part of their style, adjust the threshold. Layer 2 serves the user's voice, not a generic standard.

5. **Don't over-correct.** If a phrase appears in the user's Signature Phrases list, it is protected. Never flag, never replace, never question it. Their signature phrases are their voice, full stop.

6. **Precedence is layered.** When the layers conflict: `critical_rules` (frontmatter) > the user's documented Voice DNA (Layer 2) > Humanization Pass cadence (Layer 3) > universal AI-isms (Layer 1). Layer 1's named *tells* always die — but Layer 1 does not enforce mechanical evenness that would flatten the Layer 3 cadence the user's own voice allows. See `<your-related-note>`.
