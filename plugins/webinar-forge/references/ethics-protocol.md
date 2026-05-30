# Ethics Protocol

Per CLAUDE.md Ethics section. 4 fire points.

## Fire Point 1 - Phase 1.1 START

Confirm checklist:

1. Framing: studying Russell framework, adapting for CLIENT
2. Language: NEVER/ALWAYS table applies to all output
3. Golden Rule: Would Russell feel honored or violated?
4. Client voice: CLIENT authentic expression, not <your-name> overlay

If any fail, pause and clarify.

## Fire Point 2 - After Phase 3 Outline

Run scripts/ethics_scanner.py scan_text on outline.md.

Thresholds:
- 0 violations: proceed
- 1-2: clean up inline, notify "caught X AI-isms"
- 3+: halt, revise, re-scan before counsel

Visually verify:
- Transformation Point A to Point B authentic to CLIENT
- No steal/copy/rip-off language
- Client voice centered

## Fire Point 3 - Phase 4 Script + Phase 5 Variants

### Language Rule violations

- steal -> study / adapt
- copy -> model / learn from
- rip off -> draw inspiration from
- hack (exploitative) -> research (educational)
- take their approach -> apply similar principles
- spy on -> study the landscape
- youre not broken -> there is nothing wrong with you / you may feel broken but

### AI-isms Ban List

- Heres the thing -> just say the thing
- dive deep / deep dive -> break down, get into
- unlock your potential -> be specific
- lets be honest / let me be real -> just be honest
- navigate your journey/healing -> work through, move through
- leverage (verb) -> use, build on, apply

### Structural patterns

- Em dash > 1 per section: reduce to one
- Not-X-but-Y > 1 per section: rewrite extras as direct
- Heres the thing opener: cut
- Remember-restatement closer: cut

### Voice Verification

Cross-reference client-voice-profile.md:
- Signature phrases present (at least 2 per 1000 words)
- Forbidden phrases absent (zero tolerance)
- Rhythm matches
- Reference Tone embodied

If more than 2 failures, flag user.

## Fire Point 4 - Phase 6 Handoff

Final scanner on entire package. Ask user:

    "Does this reflect a Life Gamer or a button masher? (ship / revise)"

If revise, loop back.

## Implementation

Call scripts/ethics_scanner.py scan_text(text). See tests/test_ethics_scanner.py.
