---
id: writing
axis: writing
applies_to: [card, hero, quote, lower-third, pill, riser, image, split, stack, draw-board, headline, chart, pipeline, callout, lane, grid, timeline, caption-track, skin]
checks:
  - { id: caption-length, rule: "a card's copy word count <= cap = floor(WORDS_PER_SECOND_READ * MAX_HOLD_S) = 11 words; longer splits into sequential cards", machine: true, severity: hard }
  - { id: ai-isms-ban, rule: "no banned AI-ism phrases/structures (CLAUDE.md list) in any human-read copy", machine: false, severity: advisory }
  - { id: <your-username>-voice, rule: "copy matches the <your-name> voice profile (or the active client voice)", machine: false, severity: advisory }
  - { id: drawboard-allcaps, rule: "draw-board write-on text is ALL-CAPS", machine: false, severity: advisory }
  - { id: verbatim-vs-distilled, rule: "copy_provenance is honest: verbatim = exact quote, distilled = paraphrased label", machine: false, severity: advisory }
confidence: high
---

# Writing Standard — copy / voice / caption

## Caption length (machine)
Cap = `floor(WORDS_PER_SECOND_READ * MAX_HOLD_S)` = `floor(2.5 * 4.5)` = **11 words**. A card whose
`copy` exceeds the cap must split into sequential cards, not dwell (the reader can't hold more than the
`MAX_HOLD_S` ceiling allows at reading speed). The `caption-length` check derives the cap from
`constants.js` — never hardcode it here. (Draw-board write-on and `karaoke-caption` reveal word-by-word
synced to speech; the cap still governs a single on-screen unit.)

## <your-name> voice + AI-isms ban
All copy a human reads runs the **AI-isms ban + <your-name> voice profile** (CLAUDE.md). No "here's the
thing," no "dive deep," no "unlock your potential," no em dashes in email-style copy, no three-beat
fragments, no "not just X, but Y." Load `~/.claude/references/voice-profiles/<your-username>/<your-username>-email.md`
before writing outward copy; run the Humanization Pass on any draft a human reads.

## Verbatim vs distilled
- **verbatim** — an exact spoken quote (`full-frame-quote`, pull-quotes). Do not alter the words.
- **distilled** — a paraphrased label/insight (`liquid-glass-card`, pills). Tighten to the cap in
  <your-name>'s voice.
Set `copy_provenance` honestly per card; the two are checked differently downstream.

## Draw-board text
Write-on text is **ALL-CAPS**, handwritten-marker style, revealed word-by-word (~1 word / 0.45s,
`DRAWBOARD_WRITE_ON_WPS`), landing 50–150ms AFTER the spoken word (reaction, not prediction).
