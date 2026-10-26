# Changelog

## 1.1.1

- Image models: standard is now Gemini 3.1 Flash Lite Image (about 3 cents), premium is Gemini 3.1 Flash Image (about 7 cents). The old standard model was retired by Google on 2026-10-02.
- Billing is now stated as required for slide art (Google has no free tier for images); without it, decks build with labeled picture boxes.
- `/webinar-tutorial` reworked from a full dry run: map shown before any command, resume reads progress first, no "command not found" without Node, Python 3.9 notices explained, long commands go to the clipboard, AI Studio welcome screen covered, Canva import via Cmd+Shift+G, art steps skipped when billing is off, honest timings.
- `setup_key.py`: Ctrl+C or Ctrl+D at the key prompt now cancels cleanly.
- `gen_image.py`: hides Python 3.9 warnings, only successful images count toward the daily cap, plain message if Google retires a model.
- Second dry run: the key is copied only after Terminal asks for it (the setup command no longer overwrites it on the clipboard), crash-proof progress saves, one restart with "I'm back", precise Canva connector check, a defined retry for billing delay.
- `gen_image.py` saves in the format the file name asks for (Google sends JPEG data).
- Price text no longer uses a dollar sign before a digit in command files (Claude Code reads `$0` as an argument).

## 1.1.0

- Canva delivery (Phase 4): exact deck via a native PPTX import (all Canva plans), or a Canva AI design draft of up to 12 slides.
- `scripts/extract_slides.py`: locked HTML deck → `slides.json`, with a sync check.
- `scripts/build_pptx.py`: `slides.json` → editable 16:9 PPTX with text fitting, top-anchored image crops, cards, value tables and speaker notes.
- `scripts/gen_image.py` + `scripts/setup_key.py`: self-contained Gemini slide art with price quotes and a daily cap; key saved from your own Terminal.
- `/webinar-tutorial`: guided setup and a practice run into Canva.
- `preflight.mjs` toolkit check; macOS commands throughout.

## 1.0.0

- Initial release: interview, 3-agent outline, HTML deck build, export and skill handoffs.
