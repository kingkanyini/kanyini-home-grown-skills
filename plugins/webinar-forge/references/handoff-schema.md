# Handoff Schema - Package for /webinar-dev-bot

Phase 6 output: handoff/webinar-dev-bot-package.md in per-project folder. This file is also the home for the Phase 5 variant reduction strategies.

## File structure

    ---
    project_code: example-breath
    voice_profile_path: ./client-voice-profile.md
    oo_path: /path/to/offer-optimizer.md
    pm_path: /path/to/prop-machine.md
    created: 2026-04-22
    ---

    # [Webinar Title]

    ## Outline (from Phase 3)
    [full markdown outline with timestamps, beats, belief-shifts]

    ## Full Script - 90 min
    [full 90-min script with timestamps]

    ## Variants

    ### Medium - 60 min
    [60-min version]

    ### Short - 30 min
    [30-min masterclass]

    ### VSL - 12 min
    [12-min version]

    ## Slide Cues
    | Slide # | Script Anchor | Visual Direction |
    |---------|---------------|------------------|
    | 1 | Welcome to... | Title card, client logo |
    | 2 | The big domino is... | Domino visual |

    ## Example References
    | example_id | use_at_slide | what_illustrates |
    | ch4-example-03 | 42 | Offer stack example |
    | ch2-example-01 | 8 | Hook structure |

The frontmatter keys are read by `/webinar-dev-bot`; keep them exactly as shown.

## Pare-down variant reduction strategies

Phase 5 passes the matching block to each Variant Drafter (agent-prompts §8) as `{REDUCTION_STRATEGY}`.

### Medium - 60 min (`medium_60` -> `scripts/medium-60min.md`)
- Trim origin 60% (inciting moment + discovery only)
- Compress belief-shifts to 2 sentences each (was 3-5)
- Keep full stack reveal
- Keep full close

### Short - 30 min, workshop/masterclass (`short_30` -> `scripts/short-30min.md`)
- Cut origin to 1 sentence
- Keep 1 belief-shift only (strongest per counsel review)
- Skip minor stack items (main + 2 core bonuses)
- Tight close with urgency

### VSL - 12 min (`vsl_12` -> `scripts/vsl-12min.md`)
- Hook (30s): tension + promise
- Transformation (2min): Point A -> Point B with vivid example
- Belief shift (4min): single most-load-bearing belief
- Stack (3min): main + top 3 bonuses
- Close (2min): urgency + CTA

Every variant keeps the transformation promise. A variant that loses it fails the transformation check (agent-prompts §4, scope `transformation`).

## Handoff validation

Before marking the handoff complete, the orchestrator checks:

1. Frontmatter present with all 5 fields
2. All 4 script versions present
3. Slide cues table has at least 15 rows for the 90-min script
4. Example references match actual paths in slide-library
5. Voice profile file exists
6. Ethics scanner clean on the entire file (`--mode sections`)
