---
status: active
version: 1
move_type: skin
affects: []
hero_capable: false
standards: [color, writing]
# NOTE: art-direction is a SKIN, not a move — it has no entrance of its own, so it carries
# no entrance_archetype / entrance_mechanism (CONTRACT §2 applies those to moves only).
---

# Art Direction — Global Default Skin (Earthy Premium liquid-glass)

This is the **single shared look** every generated art card in a video inherits, so the
illustration set reads as one hand. v1 ships one global default; per-video selectable skins
are a Non-Goal (deferred). Every Imaginator prompt for a card MUST append the **Prompt Suffix**
below.

## Look in one line
Warm, earthy, premium. Soft liquid-glass cards (frosted translucency, gentle inner glow)
floating over the footage. Hand-drawn-but-refined illustration, not clip-art, not flat-corporate.

## Palette

| Token | Hex | Use |
|-------|-----|-----|
| `ink` | `#241B14` | primary text, line work |
| `bark` | `#3E2C20` | secondary text, deep shadow |
| `clay` | `#B06A3B` | primary accent / highlight |
| `ochre` | `#D9A05B` | warm secondary accent |
| `sage` | `#7C8B6F` | cool balance accent |
| `sand` | `#EFE3D2` | card fill / light ground |
| `cream` | `#F7F0E4` | lightest ground, plate base |
| `glass-tint` | `rgba(247,240,228,0.16)` | frosted card body |
| `glass-stroke` | `rgba(255,255,255,0.35)` | card rim highlight |
| `plate` | `rgba(20,14,9,0.55)` | dark blur caption plate (legibility) |

## Line & form
- **Line weight:** medium, confident, slightly organic (hand-drawn feel, not vector-perfect).
- **Corners:** generous radius (18–28px on cards). Nothing hard-cornered.
- **Depth:** soft single-direction shadow (down-right), low spread, never harsh. Inner rim light on glass.
- **Texture:** very subtle grain on grounds; never noisy.

## Framing & safe margins
- Keep all art and text within a **7% safe margin** from every edge.
- Subject/illustration weighted to the side OPPOSITE the talking head (cam-clearance, principle 5).
- Wide/full-frame elements stay frame-centered (clip otherwise, principle 5).

## Legibility over bright footage
The light-glass moves (`liquid-glass-card`, `bottom-rise`, `top-pill`, `split-card`, `sandwich-stack`)
use a 16%-opacity frosted body — `backdrop-filter: blur` blurs but does **not** darken, so ink text
can wash out over bright/busy footage. When the footage behind a card is high-luminance, those moves
may drop the body to the darker `plate` tint or add a subtle scrim. The dark-plate moves
(`lower-third`, `image-card` caption, `full-frame-quote`, `center-hero` vignette) are already safe.

## Illustration style — Earthy Comic Realism (house style)
Generated art uses <your-name>'s saved **Earthy Comic Realism** imaginator style: a scene rendered like a
printed comic come to life — cel-shaded surfaces with visible hand-drawn ink outlines, hatching/
cross-hatching shadows, subtle Ben-Day halftone dots, gentle offset-print texture with slight
misregistration, editorial comic finish. Characters are warm, grounded, lightly heroic.

> **History:** v1 of this skin said "gouache/colored-pencil." That is WRONG for <example-brand> — it produced
> soft children's-book art that <your-name> rejected on an early production build. The
> house style is **Earthy Comic Realism** (saved in the `/imaginator` skill). The warm-glass palette
> below still governs the text CARDS; the comic palette governs the generated ILLUSTRATIONS + accents.

## Prompt Suffix (append to EVERY Imaginator art prompt for this video)

```
A scene rendered like a printed comic book come to life — cel-shaded surfaces with visible hand-drawn
ink outlines, hatching and cross-hatching for shadows, subtle Ben-Day halftone dots across the
mid-tones, gentle offset-print texture with slight print misregistration along edges, editorial
hand-illustrated comic finish. Palette stays STRICTLY in warm earthy tones: cream #F2EBDB,
ink-brown #1A1410, gold #C9A661, teal #5FA6A6, sage green #8FA289, terracotta #D9856E. Subject
weighted to one side with generous negative space. Keep within a 7% safe margin. NO neon, no
magenta/cyan/violet, no CMYK neon fringing, no onomatopoeia, no speed lines, no baked caption text.
Warm, refined, premium, Kinfolk-editorial. Aspect 16:9, cream background.
```

> "No text in image" is deliberate — copy is rendered by the overlay card (voice/ban-checked),
> never baked into generated art.
