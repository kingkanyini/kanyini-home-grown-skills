---
id: color
axis: color
applies_to: [card, hero, quote, lower-third, pill, riser, image, split, stack, spotlight, draw-board, headline, chart, pipeline, callout, lane, grid, timeline, skin]
checks:
  - { id: palette-member, rule: "every solid hex color used in an impl is a member of the allowed palette machine block below", machine: true, severity: hard }
  - { id: two-tone-one-accent, rule: "a two-tone headline carries exactly ONE accent-color keyword; the rest is ink/white", machine: false, severity: advisory }
  - { id: legibility-plate, rule: "any caption over generated art sits on a dark blurred plate (rgba + backdrop-filter)", machine: false, severity: advisory }
  - { id: semantic-accent-trio, rule: "status colors follow the semantic trio (active/warn + draw-board green=positive / red=negative)", machine: false, severity: advisory }
confidence: high
---

# Color Standard — the allowed palette

Two families live side by side: the warm "liquid glass" overlay tokens (the house look) and the
motion-upgrade accents from `constants.js` (broadcast card system + draw-board inks). The
`palette-member` check scans every referenced move's impl HTML for **solid hex colors** and flags any
hex NOT in the machine block below.

**Scope note (why hex only):** the check inspects solid `#rgb`/`#rrggbb` values — the accent/ink layer
the "two-tone one-accent" rule governs. `rgba()`/`hsl()` glass and plate tokens carry freeform alpha
over neutrals and are governed by the legibility-plate rule, not the accent palette, so they are not
scanned. 3-digit hexes are expanded to 6-digit before comparison.

## Warm liquid-glass tokens (house look)
| Token | Hex | Role |
|-------|-----|------|
| ink | `#241B14` | primary card text |
| deep ink | `#1A130D` | darkest text / edge |
| warm shadow | `#3A2A1C` | shadowed warm surface |
| clay | `#B06A3B` | eyebrow / small label accent |
| tan | `#D9A05B` | warm secondary |
| stone | `#A59A86` | muted label |
| sage | `#8FA876` | organic accent |
| sage-deep | `#7C8B6F` | organic accent (darker) |
| glass tint | `#F7F0E4` | frosted card fill (light) |
| white | `#FFFFFF` | over-dark text |

## Motion-upgrade accents (from `constants.js` — never hardcode, import)
| Constant | Hex | Role |
|----------|-----|------|
| `DRAWBOARD_INK` | `#3B9BE8` | primary sky-blue marker (base diagram) |
| `DRAWBOARD_HL_YELLOW` | `#F2D021` | fat translucent highlighter / lasso |
| `DRAWBOARD_GREEN` | `#3FBF52` | positive: boxes, underlines, checks |
| `DRAWBOARD_RED` | `#E24B3A` | negative: hatching / strike |
| `CARD_LIME` | `#C6F94E` | two-tone accent (operational/active) |
| `CARD_TEAL` | `#4FD6C8` | callout secondary |
| `CARD_AMBER` | `#F5A623` | warning |

## Broadcast / theme backgrounds
| Token | Hex | Role |
|-------|-----|------|
| bg-dark | `#0A0A0A` | dark broadcast background |
| bg-light | `#F4F3EF` | light broadcast background |
| black | `#000000` | true black |

## Grammar rules
- **Two-tone headline:** white/ink base + exactly ONE accent-color keyword. The color swap does ~80% of
  the "designed" feel — don't spread it.
- **Draw-board additive emphasis:** blue base diagram → yellow/green/red layered on LATER. Green =
  positive, red = negative, yellow = highlight/lasso. Old marks never fade to emphasize.
- **Legibility plate:** captions over generated art get a dark, blurred plate
  (`rgba(20,14,9,0.55)` + `backdrop-filter: blur`) so mobile stays legible.

<!-- palette:machine
#000000
#ffffff
#0a0a0a
#f4f3ef
#1a130d
#241b14
#3a2a1c
#7c8b6f
#8fa876
#a59a86
#b06a3b
#d9a05b
#f7f0e4
#3b9be8
#f2d021
#3fbf52
#e24b3a
#c6f94e
#4fd6c8
#f5a623
-->
