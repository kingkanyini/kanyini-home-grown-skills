# Refinement Commands — Headline Creator

## How This File Works

Each `##` header below (starting with `/`) defines one refinement command. The main skill reads all `## /` headers dynamically and presents them as available options via AskUserQuestion.

**To add a new command:** Append a new `## /command-name` block at the bottom using the template format below.

### Template

```
## /command-name
**Modifier:** [What this command does to the headlines]
**Applies to:** [All / Ceiling only / Floor only / Below Floor only]
**Transform rules:**
- [Rule 1]
- [Rule 2]
- [Rule 3]
**Example:** "[Before]" → "[After]"
```

---

## /tighten-b2b-metrics
**Modifier:** More specific outcomes, operational verbs, fewer feelings, clearer ROI without unverified numbers
**Applies to:** All
**Transform rules:**
- Replace emotional language with operational language (e.g., "feel confident" → "close deals")
- Add role specificity (e.g., "entrepreneurs" → "B2B SaaS founders")
- Strengthen verbs, strip adjectives
- Add outcome specificity without fabricating metrics (e.g., "grow faster" → "shorten your sales cycle")
- Keep plain language — operational does not mean corporate jargon
**Example:** "Feel confident in your next sales call" → "Close deals without second-guessing your pitch"

## /genz-tone
**Modifier:** Shorter, punchier, slightly playful, less formal
**Applies to:** All
**Transform rules:**
- Shorten to 10 words or fewer where possible
- Use casual contractions (you're, don't, won't, it's)
- Allow one playful/irreverent element per headline (not all — keep some grounded)
- Remove any formal phrasing ("in order to," "leverage," "implement")
- Keep the hook structure intact — don't sacrifice clarity for vibes
**Example:** "The fastest way to get your first 10 clients this month" → "Get your first 10 clients. No fluff. Just this."

## /premium-angle
**Modifier:** Elevate identity, exclusivity via standards not price
**Applies to:** Ceiling + Floor (not Below Floor repellents)
**Transform rules:**
- Frame the reader as already capable — they're choosing refinement, not rescue
- Use words that signal standards: "discerning," "intentional," "by design"
- Remove any hint of desperation or urgency
- Exclusivity comes from values and standards, never from scarcity or price gates
- Identity language: "the kind of person who..." framing
**Example:** "Stop wasting time on strategies that don't work" → "You've outgrown generic strategies. Here's what's next."

## /risk-reversal
**Modifier:** Soften perceived risk with process clarity, no guarantees
**Applies to:** All
**Transform rules:**
- Name the fear or hesitation the reader has (use ICA objections data)
- Address it with process transparency (what happens, what to expect, what's required)
- Never promise outcomes or use guarantee language
- Frame as "here's what the process looks like" not "here's what you'll get"
- Use conditional language: "when you," "as you," "once you"
**Example:** "Transform your business in 90 days" → "Here's what the first 90 days actually look like (no surprises)"
