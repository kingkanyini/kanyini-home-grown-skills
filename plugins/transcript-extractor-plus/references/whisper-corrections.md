# Whisper Transcription Corrections

Common Whisper transcription artifacts. Apply these corrections during translation when the context matches.

## Known Corrections

| Whisper Output | Correct Form | Context | Added |
|---------------|-------------|---------|-------|
| Sommer (when referring to program) | example-collective | example-contact example-surname' somatic coaching program brand name | 2026-03-17 |
| Sommeremission | example-collective program | Same brand — Whisper hears "Sommer" instead of "example-collective" | 2026-03-17 |
| Besselwander Kolk / Bessel Wander Kolk | Bessel van der Kolk | Dutch author/researcher — "The Body Keeps the Score" | 2026-03-17 |
| Hills / Hill (surname) | example-surname | example-contact example-surname — correct spelling of surname | 2026-03-17 |
| Traumatars | Traumata (small traumas) | German plural of Trauma — Whisper garbles it | 2026-03-17 |

## How to Use

- Match by context, not exact string — Whisper may produce slight variations
- Apply corrections silently during translation
- Report all corrections in the translation notes section
- If a new correction is discovered during translation, flag it so it can be added to this table

## Adding New Corrections

After each project, if the translation agent discovers new Whisper artifacts, append them to the table above with the date. This file grows over time as more content is processed.
