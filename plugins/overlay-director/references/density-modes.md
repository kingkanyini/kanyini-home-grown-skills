# Density Modes + Precedence

## The three modes

| Mode | Density | Move palette | Counsel depth (Decision 14) |
|------|---------|--------------|------------------------------|
| **MVP** (default) | ~1 card / 25–40s, simple | workhorse cards + the occasional pill/lower-third | persona-mode gut-check (cheap) |
| **Standard** | moderate, mixed | full palette, some promoted tiers | full 5-agent counsel panel |
| **Cinematic** | dense, beat-synced, hero moments | full palette + heroes, tight timing | full 5-agent counsel panel |

- **Default is MVP.** Promote select moments to hero rather than starting dense (principle 8).
- **Client-facing flag** forces the full 5-agent panel regardless of mode.
- Each mode pulls **type-tagged density defaults** from `playbook/types/<type>.md`.
- Heuristic numbers (window, run-window, calcification, timing) live in `scripts/constants.js` — never duplicate them here.

## Opt-in modifiers
- **Per-section density curve** — raise/lower density for a stretch (e.g. dense intro, sparse middle).
- **Per-moment hero** — promote a single moment to a frame-owning beat.

## Precedence (Decision 15) — strict order, most-specific scope wins

```
per-moment hero override  >  per-section curve  >  video-type-tag principle  >  global principle
```

**Within equal scope, most-recently-approved wins.** The tiebreak reads the `approved_at`
ISO timestamp in each principle's vault frontmatter — **NOT** file mtime (mtime is fragile
across vault sync / git checkout). If two equal-scope principles lack timestamps, surface
the conflict to <your-name> rather than guessing.

### Constraint floors override the precedence ladder
The ladder governs **count / placement-emphasis** (how dense, where the weight goes). It does NOT
let a density modifier breach a **legibility/safety constraint** from a type or global principle.
Example: a per-section density curve says "denser intro," but the `ad` type principle
`ad-one-idea-per-beat` (`affects: legibility.concurrency`, value `max-1`) forbids ≥2 competing cards.
The constraint wins — the curve cannot push `max_concurrent` past the cap. Legibility/safety principles
(`legibility.*`, source-safety, fidelity) are **floors**, not ladder rungs. If a modifier would breach
one, surface it for resolution rather than silently clobbering the constraint.

### Worked collision (from spec §5)
Global principle **"shift cards off-center to clear the cam"** vs a future `ad.md` type principle
**"center hero cards for thumbnail punch"** vs a **per-moment hero** flag on one card.

Resolution, deterministically:
1. For the flagged card → **per-moment hero wins**: it centers.
2. Elsewhere in an `ad`-type video → **`ad` type principle beats global**: hero cards center.
3. In a `tutorial`/`talking-head` video with no type override → **global wins**: cards shift off-center.

Every resolution is logged in the plan so a reviewer can see which rule fired and why. Opposing
values on the same `affects:` axis (here `placement.horizontal`) are what the contradiction
detector keys on (see `workflow.md` §Learning loop).
