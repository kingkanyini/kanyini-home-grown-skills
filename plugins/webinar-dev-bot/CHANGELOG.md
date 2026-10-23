# Changelog

## 1.1.0

- Canva delivery (Phase 4): exact deck via a native PPTX import (all Canva plans), or a Canva AI design draft of up to 12 slides.
- `scripts/extract_slides.py`: locked HTML deck → `slides.json`, with a sync check.
- `scripts/build_pptx.py`: `slides.json` → editable 16:9 PPTX with text fitting, top-anchored image crops, cards, value tables and speaker notes.
- `scripts/gen_image.py` + `scripts/setup_key.py`: self-contained Gemini slide art with price quotes and a daily cap; key saved from your own Terminal.
- `/webinar-tutorial`: guided setup and a practice run into Canva.
- `preflight.mjs` toolkit check; macOS commands throughout.

## 1.0.0

- Initial release: interview, 3-agent outline, HTML deck build, export and skill handoffs.
