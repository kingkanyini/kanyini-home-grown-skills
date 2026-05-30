# Handoff Schema - Package for /webinar-dev-bot

Phase 6 output: handoff/webinar-dev-bot-package.md in per-project folder.

## File structure

    ---
    project_code: zaira-breath
    voice_profile_path: ./voice-profile.md
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

## Pare-down variant reduction strategies

### Medium - 60 min
- Trim origin 60% (inciting moment + discovery only)
- Compress belief-shifts to 2 sentences each (was 3-5)
- Keep full stack reveal
- Keep full close

### Short - 30 min (workshop/masterclass)
- Cut origin to 1 sentence
- Keep 1 belief-shift only (strongest per counsel review)
- Skip minor stack items (main + 2 core bonuses)
- Tight close with urgency

### VSL - 12 min
- Hook (30s): tension + promise
- Transformation (2min): Point A -> Point B with vivid example
- Belief shift (4min): single most-load-bearing belief
- Stack (3min): main + top 3 bonuses
- Close (2min): urgency + CTA

Each variant MUST preserve the transformation promise. If 12-min VSL drops it, fail transformation-preservation check.

## Handoff validation

Orchestrator verifies before complete:

1. Frontmatter present with all 5 fields
2. All 4 script versions present
3. Slide cues table minimum 15 rows for 90-min
4. Example references match actual paths in slide-library
5. Voice profile file exists
6. Ethics scanner clean on entire file
