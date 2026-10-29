# imaginator

> Generate images and videos - Gemini image presets, video B-roll on two engines (Gemini Veo 3.1 or 17 OpenArt models with sound, voices, and clips up to 30s), Canva integration

**Tier:** T9
**Version:** 1.0.0
**Command:** `/imaginator`

## Usage

```
/imaginator
/imaginator "a misty cloud-forest sunrise, 16:9"
```

Pick a mode (image, photo composite, scene stitch, video, diagram), choose a style preset or describe your own, and Imaginator writes the prompt, runs the generation and saves the file.

## What it does

- **Images** through Google Gemini: a free tier (about 500 a day) and a premium tier (up to 4K), with named style presets.
- **Photo composites:** keep a person exactly as they are and change the scene around them.
- **Video B-roll** on two engines: Gemini Veo 3.1 (billed in dollars to your Google account) or the OpenArt MCP (17 models with sound and voices, clips up to 30s, billed in OpenArt credits).
- **Diagram mode** for text-heavy graphics, built as HTML/SVG so labels never come out garbled.
- **Canva upload** when the Canva connector is available.

Every file is saved twice: an archive in `~/.claude/projects/imaginator/` and a gallery folder on your Desktop. Every generation is logged so `/imaginator` can report what you've spent.

## Prerequisites

**Python 3.9+** with two packages:

```
pip install google-genai pillow
```

**Gemini API key** (free from Google AI Studio). The first run walks you through it. You type the key into your own terminal, never into the chat, and it's saved in a private file (`~/.imaginator.env`).

**Optional:**
- OpenArt MCP (`mcp__openart__*`) for the second video engine. It uses your own OpenArt login and needs no Gemini key.
- Canva connector for Canva uploads.
- `ffprobe` to verify downloaded video clips.

Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## Used by

`overlay-director`, `snapshot` and `soulcial-media-engine` use Imaginator for art when it's installed. Each works without it.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
