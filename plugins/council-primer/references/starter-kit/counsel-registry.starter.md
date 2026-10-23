# Counsel Registry — Starter Kit

*Your seed registry. Three ready-to-use councils so you have something to dispatch the moment you
install. Build your own with `/council-primer`; summon any member with `/counsel-dispatch [slug]`.*

> New to this? A **council** is a small panel of expert "study-models" you can summon for advice,
> review, and debate. Each member is a stat sheet (in `counsel/members/`) capturing how a real
> expert (or, for the NSA squad, a composite persona) thinks, what they flag, and how they sound.

## Registry

| ID | Counsel Name | Tags | Members | Notes |
|----|-------------|------|---------|-------|
| 1 | **Expert Counsel** | `marketing`, `ads`, `funnels`, `sales`, `copy`, `offers` | russell-brunson (funnels/hooks/story/offer), myron-golden (offers/pricing/sales psychology), marisa-murgatroyd (experience design / engagement) | Your marketing + sales brain trust. Speak as NPCs with distinct voices. Persona mode for quick gut-checks; agent mode for shipped sales assets. |
| 2 | **Marketing SEO Giants Counsel** | `seo`, `geo`, `ai-search`, `content`, `brand`, `positioning`, `cro`, `conversion`, `organic-growth`, `marketing` | aleyda-solis (GEO / AI-search / technical SEO), rand-fishkin (audience intelligence / zero-click), seth-godin (brand / positioning), peep-laja (CRO / messaging) | Discovery → meaning → conversion arc. **Built-in productive clash:** Godin (intuition, smallest viable audience) vs Laja (test everything, data over opinion). |
| 3 | **NSA Elite Squad** | `tech`, `code`, `infrastructure`, `security`, `architecture` | cipher (security / DNS / breach pathology), phantom (automation / ops / failure modes), architect (strategy / architecture / completeness) | Your coding + build-safety squad. Fictional composite personas grounded in public security/engineering frameworks. Deploy as 3 parallel agents for a review round. |

## How to use

- **Summon one member:** `/counsel-dispatch russell-brunson about my webinar hook`
- **Convene a council:** dispatch each member of a council and synthesize their notes (each gives Score / What lands / What's weak / Edit suggestion).
- **Build your own council:** `/council-primer` — it researches real experts in your domain and writes new member sheets + a new registry row here.

## Adding a council

When `/council-primer` builds a new council it appends a row to this table with the next available ID,
the council name, tags, the member list with one-line roles, and a design note. Members get written to
`counsel/members/[slug].md`.
