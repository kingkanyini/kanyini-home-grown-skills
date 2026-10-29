# Moves Library — Catalog

The auto-draft (Phase 3) and Variety Engine draw **only from `status: active` moves** here.
Each move file carries frontmatter: `status`, `version`, `move_type`, `affects`, `hero_capable`.
`move_type` is the family the Variety Engine alternates on; `move_id` is the file's basename.

> **Hygiene:** reuse-check before adding a move (does an existing move + params cover it?).
> Deprecate in place (`status: deprecated` / `superseded-by:<id>`) — never silently break old re-renders.
> When this table exceeds ~20 moves, split it into a faceted multi-table by `move_type`.

## When-to-use (faceted)

| Move (`move_id`) | `move_type` | Best for | Density tiers | Placement default | Hero-capable |
|------------------|-------------|----------|---------------|-------------------|:---:|
| `liquid-glass-card` | card | the workhorse: a labeled point/insight anchored to a line | base · promoted · hero | content-area (off-center) | yes |
| `center-hero` | hero | a promoted signature beat that owns the frame for a moment | hero | frame-center | yes |
| `lower-third` | lower-third | name / role / source label, low and unobtrusive | base | inline (lower) | no |
| `top-pill` | pill | a short tag / chapter / status token at the top | base | content-area (top) | no |
| `bottom-rise` | riser | a callout that rises from the lower edge for emphasis | base · promoted | content-area (bottom) | no |
| `full-frame-quote` | quote | a verbatim quote that deserves the whole frame | promoted · hero | frame-center | yes |
| `image-card` | image | an illustration/concept card (incl. `doctor` variant) | base · promoted · hero | content-area | yes |
| `split-card` | split | a two-up compare / before-after / this-vs-that | promoted | content-area | no |
| `sandwich-stack` | stack | a sequential reveal of stacked items (list/steps) | promoted | content-area | no |
| `bouncing-arrows` | accent | a brief attention accent pointing at on-screen action | base | inline | no |
| `reading-spotlight` | spotlight | held illumination box lighting one doc region while surround dims; walks block-by-block (screen-share) | base · promoted | screen-region | no |
| `karaoke-caption` | caption-track | persistent word-by-word subtitle for Wispr-Flow dictation segments (opt-in, calm) | n/a (baseline track) | reserved bottom lane | no |
| `comic-zoom-pan` | hero | **signature "wow" beat**: a 4-panel comic that scales + pans quadrant-to-quadrant over a 20-30s recap lull | hero | content-panel (frame-center, PIP-clear) | yes |
| `two-tone-headline` | headline | a left-anchored statement: white headline with exactly one accent-color keyword (broadcast card skeleton) | promoted · hero | content-area (left third/half) | yes |
| `callout-box` | callout | one figure, term or short phrase in a 1px teal box: "the thing to notice" | base · promoted | inline / content-area | no |
| `bar-fill` | chart | a few values compared as bars growing left→right, counter snapping at each tip | promoted | content-area (left) | no |
| `segmented-grid` | grid | cells lighting up in sequence to imply coverage/completion, paired with a hero number | promoted · hero | content-area (left) | no |
| `slider-lane` | lane | one track per dimension with a knob gliding to a reading (a "scan" / eval beat) | promoted | content-area (left) | no |
| `date-timeline` | timeline | dated nodes fading down a self-drawing vertical connector ("Preview → GA") | promoted | content-area (left, narrow) | no |
| `pipeline-build` | pipeline | stage boxes revealing left→right for a sequence or fan-out, sealed by a status pill | promoted | content-area (left/lower) | no |
| `draw-board` | draw-board | **marquee signature**: hand-drawn marker ink floating over live footage, as if drawn on glass | promoted · hero | full-frame overlay | yes |
| `pip-reframe` | pip | the presenter picture-in-picture gliding between named presets between scenes (connective tissue, not a card) | n/a (persistent element) | the destination preset | no |

> **Param-folds (VV#26 2026-06-01, "fold don't file"):** three Abdaal patterns ride existing moves as params, not new files —
> **chapter-divider** → `full-frame-quote` (`kicker` + `icon`), **speech-bubble callout** → `top-pill` (`tether`),
> **app-icon tool-tag** → `image-card` (`size: sticker` + `asset_ref`). See each move's Params table.

## Proposed (from X-Ray imports)
Draft moves learned from other creators' videos via `/overlay-director import`. Files live in
`_proposed/` with `status: proposed`. **Not draftable**: the auto-draft and Variety Engine ignore
them. Promote one only when a build needs it (`workflow.md` § Promoting a proposed move).

| Proposed move (`move_id`) | `move_type` | New family? | Evidence (videos) | Needs rework? |
|---------------------------|-------------|:-----------:|-------------------|---------------|
| *(none yet)* | | | | |

## v1.1 backlog — coverage gaps (Visual Visionary #26, Milestone-2 review)
Not blocking v1, but the 10 skew talking-head/insight; a full tutorial/ad set will want:
- ~~**`callout` (accent family)** — labeled callout box tethered to an on-screen spot~~ ✅ **FILLED 2026-06-01** → `top-pill` `tether` param (Abdaal reference scan).
- ~~**`chapter-progress` (pill family)**~~ partially **FILLED 2026-06-01** → `full-frame-quote` `kicker` param covers the section-divider case (persistent "Step N of M" progress affordance still open).
- **`end-card` (cta family)** — closing CTA card for ads (full-frame-quote is locked to verbatim, can't double).
- ~~animated highlight/underline sweep on a spoken term~~ ✅ **FILLED 2026-06-01** → `reading-spotlight` (region spotlight, richer than a word-sweep).
- Lower priority: animated stat counter.

## Deferred (avoid-premature-complexity, VV#26 2026-06-01)
- **`cycle-diagram` (diagram family)** — multi-node ring that builds one node+arrow at a time then holds.
  Genuinely distinct from `sandwich-stack` (rings vs stacks), but most complex move + serves only "a cycle" +
  zero evidence the next video needs a ring. Build it the day a video actually has one. Needs `nodes[]`/`edges[]`
  authored input (not transcript-derivable) + per-node hard-kills with the complete diagram as the resting seek state.

## Variety note
`bouncing-arrows` (accent) must never be the only move in a 90s window — it's seasoning, not a meal.
Heroes (`center-hero`, and the hero tier of `liquid-glass-card` / `image-card` / `full-frame-quote`)
are exempt from run-discipline penalties but should still be spaced (avoid ≥3 consecutive heroes).
