# Ethics Protocol

The one home for this skill's ethics checks, language rules, AI-ism bans, and em-dash budget. Other files point here. Self-contained: no CLAUDE.md needed. If your own CLAUDE.md has stricter language or AI-ism rules, they add to these.

## Fire Point 1 - Phase 1.1 start

Confirm with the user before Phase 1:

1. Framing: we are studying Russell's framework and adapting it for the client. Nothing is copied.
2. Language: the Language Rules below apply to every output.
3. Golden Rule: would Russell feel honored or violated by how his framework is used here?
4. Client voice: the client's own expression, with no <your-name> overlay.

If any point fails, pause and clarify.

## Fire Point 2 - after the Phase 3 outline

Run the scanner on `outline.md` in `sections` mode. Fix every hit before counsel sees the outline. If more than 2 hits were fixed, tell the user: "Caught X AI-isms, cleaned them up."

Then check by reading:
- The Point A to Point B transformation belongs to the client
- No steal/copy language
- The client's voice is centered

## Fire Point 3 - Phase 4 script and Phase 5 variants

Section Drafters and Variant Drafters run the scanner on their own output (agent-prompts §5 and §8). The orchestrator runs it again on `scripts/full-90min.md` and each variant before review. Same rule: fix every hit before counsel; more than 2 hits, tell the user. Voice checks follow `voice-extraction.md`.

## Fire Point 4 - Phase 6 handoff

Run the scanner on the whole package, then ask the user:

    "Does this reflect a Life Gamer or a button masher? (ship / revise)"

Revise loops back to the step the user names.

## Language Rules

NEVER say steal / copy / rip off / spy on / take their approach / hack (in the exploitative sense) / "you're not broken". ALWAYS say study, adapt, model the framework, draw inspiration from, research, analyze the market, and "you may feel broken, but...". The scanner catches: steal, copy their/his/her/the, rip off, spy on, and "you're not broken". The rest (hack in the exploitative sense, take their approach) is a read-through check.

## AI-isms

The banned phrases and structural patterns below apply to every script, outline, and handoff. The scanner catches:

- here's the thing, dive deep / deep dive, unlock your potential, let's be honest / let me be real, navigate your journey/healing/path, leverage, we heard it / we hear you
- more than one "not X but Y" or "it's not just about" per piece

The rest ("So,"/"Now," openers, "Remember, X" closers, "the one where..." trailing qualifiers) is a read-through check, and the Foreman (agent-prompts §7) audits it in Phase 4.

Skill-specific addition: spoken scripts mark pauses with `[beat]`, never an em dash. The scanner ignores `[beat]`.

## Em-dash budget

- A "piece" is one `#`/`##`/`###` section of a script or outline: at most 1 em dash per section.
- Emails: 0.
- A loaded voice profile's em-dash budget wins over these defaults.
- Em dashes inside the workbook-derived bank data (`playbook/interview-bank.json`) are source material, not output; leave them.

## Scanner

```
python "${CLAUDE_PLUGIN_ROOT}/scripts/ethics_scanner.py" <file> --mode sections            # scripts and outlines
python "${CLAUDE_PLUGIN_ROOT}/scripts/ethics_scanner.py" <file> --mode email               # emails
python "${CLAUDE_PLUGIN_ROOT}/scripts/ethics_scanner.py" <file> --mode sections --em-dash-max 2   # voice profile budget
```

It prints a JSON report (count, recommendation, each violation with its section). From Python: `scan_text(text, mode="piece" | "sections" | "email", em_dash_max=None)`. Tests: `scripts/tests/test_ethics_scanner.py`.
