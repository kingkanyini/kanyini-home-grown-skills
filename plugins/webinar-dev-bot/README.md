# Webinar Dev Bot

Build a high-converting webinar from your Offer Optimizer + Propaganda Machine: a counsel-guided interview, a slide-by-slide outline, an HTML deck with Gemini slide art, and an editable copy of the deck in Canva.

## Commands

| Command | What it does |
|---------|--------------|
| `/webinar-tutorial` | Start here. Sets up Python, your Gemini key and Canva, then builds a practice deck into your Canva (~45 min total). |
| `/webinar-dev-bot` | The full build: Interview → Outline → HTML deck + art → Canva → Export. Resumable any time. |

## Example

```
/webinar-tutorial
/webinar-dev-bot
```

## What you need

- Claude Code
- Python 3.9+ with `python-pptx`, `Pillow`, `google-genai` (`scripts/requirements.txt`; the tutorial installs them)
- A Google AI Studio API key for slide art (the tutorial saves it safely; never paste it into chat)
- A Canva account (free works). The Canva connector is optional: only the "Canva design draft" route uses it.
- Recommended first: `/offer-optimizer` and `/propaganda-machine`

## How the Canva step works

Canva's API can't lay out slides element by element, so this skill builds a native PowerPoint file with real, editable text and your images in place, and you drag it into Canva (works on every plan, nothing goes public). An optional route asks Canva's AI to restyle up to 12 slides as a design draft.

## Costs

Slide art: about $0.034 per image (standard) or $0.067 (premium). Google has no free tier for images, so art needs billing turned on in Google AI Studio; without it the kit builds the deck with labeled picture boxes. The kit shows the price before every batch and stops at 60 images a day.

## Check your setup

Run `node preflight.mjs` from this skill's folder.
