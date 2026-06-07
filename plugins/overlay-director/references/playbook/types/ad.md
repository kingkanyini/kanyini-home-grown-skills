---
type: playbook-type
scope: ad
principles:
  - id: ad-center-hero
    affects: placement.horizontal
    value: center
  - id: ad-hook-first-2s
    affects: timing.anchor
    value: minimal-lead-in
  - id: ad-one-idea-per-beat
    affects: legibility.concurrency
    value: max-1
---

# Playbook — Ad

For short, punchy paid/organic ad creative.

## Density default
**Cinematic** lean — ads are dense and beat-synced; every second earns a beat. ~1 card / 8–15s.

## Preferred move palette
- `center-hero` and `full-frame-quote` for the hook and the payoff.
- `bottom-rise` for value-props that punch in.
- `split-card` for before/after or problem/solution.
- `liquid-glass-card` for supporting points.

## Type principles
- **Center hero cards for thumbnail punch** — in ads, the hero beat sits frame-center for stop-the-scroll
  weight and a clean thumbnail. `affects: [placement.horizontal]`
  > ⚠️ This **collides with global #5** ("shift off-center to clear the cam"). Resolution by precedence:
  > in an `ad`-type video this type principle beats the global one, so hero cards center. A per-moment
  > hero flag still wins over both. The contradiction detector keys on the shared `placement.horizontal`
  > axis — this is the canonical worked collision in `density-modes.md`.
- **Hook in the first 2 seconds** — first card lands almost immediately; lead-in trimmed.
- **One idea per beat** — never ≥2 competing cards; ads punish clutter harder than tutorials.
