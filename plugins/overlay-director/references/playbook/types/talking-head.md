---
type: playbook-type
scope: talking-head
principles:
  - id: th-protect-the-face
    affects: placement.horizontal
    value: off-center
  - id: th-sparse-default
    affects: density
    value: mvp
  - id: th-quotes-verbatim
    affects: copy.provenance
    value: verbatim
---

# Playbook — Talking Head

For a person speaking to camera (podcasts, solo lessons, vlogs).

## Density default
**MVP** — the face carries the video; overlays accent, never crowd. ~1 card / 30–45s.

## Preferred move palette
- `lower-third` to identify the speaker / cite sources.
- `liquid-glass-card` for the occasional key insight worth captioning.
- `full-frame-quote` for a line worth quoting verbatim.
- `image-card` for a concept that lands better shown.

## Type principles
- **Protect the face** — cards shift hard off-center; nothing covers the eyes/mouth. Global #5 holds
  strongly here. `affects: [placement.horizontal]`
- **Sparse by default** — silence on screen is fine; only caption lines that genuinely earn it.
- **Quotes are verbatim** — when the speaker says something quotable, `full-frame-quote` with
  `copy_provenance: verbatim`, not a distilled paraphrase.
