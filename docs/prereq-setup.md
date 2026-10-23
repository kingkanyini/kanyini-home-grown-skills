# Prerequisite Setup

This guide walks through every external dependency the Phase 1 bundle uses. Not every skill needs every dependency — see each skill's `README.md` for its specific list, or run `node preflight.mjs` from the skill's folder.

## MCP Servers

### `mcp__blotato__*`

_(install docs TBD — see skill README)_

### `mcp__claude_ai_Canva__*`

Built into claude.ai — link your Canva account in the integrations panel.

### `mcp__ffmpeg-mcp__*`

See https://github.com/ffmpeg/mcp — requires `ffmpeg` CLI on PATH.

### `mcp__n8n-mcp__*`

_(install docs TBD — see skill README)_

### `mcp__perplexity__*`

See https://github.com/perplexity/mcp — requires `PERPLEXITY_API_KEY` env var.

### `mcp__playwright__*`

_(install docs TBD — see skill README)_

### `mcp__yt-dlp-mcp__*`

See https://github.com/yt-dlp/mcp — requires `yt-dlp` CLI on PATH.

## CLI Tools

### `ffmpeg`

Mac: `brew install ffmpeg`. Windows: `winget install ffmpeg`. Linux: `apt install ffmpeg`.

### `ffprobe`

_(install docs TBD)_

### `git`

Pre-installed on most systems. Mac: `brew install git`. Windows: https://git-scm.com.

### `node`

Install Node.js 20+ from https://nodejs.org or via your package manager.

### `npx`

Bundled with Node.js.

### `python`

Install Python 3.10+ from https://python.org or your package manager.

### `python3`

_(install docs TBD)_

### `sixth-sense`

_(install docs TBD)_

### `uv`

_(install docs TBD)_

### `yt-dlp`

Install: `pip install yt-dlp` or `brew install yt-dlp`.

## Environment Variables

Set these in your `.env` file or your shell environment. Never commit `.env` to git.

| Variable | Used by | Where to get |
|----------|---------|--------------|
| `PERPLEXITY_API_KEY` | `perplexity-research` | _(set per service docs)_ |

## External Services

Some skills call out to managed services. You'll need accounts + auth for each.

- **Airtable** — used by `five-min-texter`
- **Anthropic** — used by `five-min-texter`, `skill-to-site`
- **Anthropic API key + Groq API key, set in the skill folder's .env (copy .env.example). No Meta token needed.** — used by `ad-decoder`
- **Canva** — used by `offer-optimizer`, `webinar-dev-bot`
- **Do NOT run `pip install sixth-sense` — that name belongs to an unrelated PyPI package.** — used by `sixth-sense`
- **First run: pip install -r requirements.txt && playwright install chromium** — used by `ad-decoder`
- **Google AI Studio (Gemini API key)** — used by `webinar-dev-bot`
- **Instagram** — used by `voice-dna-extractor`
- **Move-gate tooling: run npm install inside references/moves-library/_impl/gate/ before registering new moves** — used by `overlay-director`
- **Obsidian desktop app — OPTIONAL, for the visual graph view. The memory layer is plain Markdown and works with or without Obsidian open.** — used by `obsidian-brain-install`
- **Optional: Blotato account + mcp__blotato__* MCP, only for /post-scheduler-v2 publishing. Writing, grading, and repurposing work without it (help.blotato.com/claude-skills)** — used by `soulcial-posts-v2`
- **Optional: Canva MCP for Canva export routes** — used by `snapshot`
- **Optional: Imaginator art generation (Gemini) — without it, art cards become labeled placeholders** — used by `overlay-director`
- **Optional: Imaginator edit route needs the separate Imaginator skill (not in this marketplace) plus python + GEMINI_API_KEY; without it the route is hidden** — used by `snapshot`
- **Optional: Playwright MCP for website capture — without it, offer a different route** — used by `snapshot`
- **Optional: Vercel CLI to publish the playbook; local save is always offered** — used by `sixth-sense-xray`
- **Optional: Vercel CLI to publish the playbook; local save is offered** — used by `sixth-sense-sage`
- **Optional: a local faster-whisper install accelerates the Phase 6 fidelity loop; an API transcription fallback is documented** — used by `sixth-sense-scissors`
- **Optional: hyperframes-handoff powers Phase 7 — without it that phase reports unavailable and ends cleanly** — used by `sixth-sense-sage`
- **Optional: mcp__obsidian-brain__* vault MCP powers the effects registry — without it the feature no-ops** — used by `web-dev-bot`
- **Optional: yt-dlp for URL sources — a WebFetch fallback exists** — used by `sixth-sense-xray`
- **Perplexity** — used by `perplexity-research`
- **Python 3.13+. GPU optional: NVIDIA/CUDA accelerates transcription; CPU and Apple Silicon both work.** — used by `sixth-sense`
- **Telegram** — used by `five-min-texter`
- **The sixth-sense preprocessing engine is a separate package and REQUIRED — this skill orchestrates, the engine does the ffmpeg/Whisper/scene work. Install: uv tool install git+https://github.com/kingkanyini/sixth-sense-engine** — used by `sixth-sense`
- **Twilio** — used by `five-min-texter`
- **Vault MCP (mcp__obsidian-brain__*) is OPTIONAL — without a vault, the skill cold-starts from its shipped playbook digest (Phase 0.5d)** — used by `overlay-director`
- **Vercel** — used by `funnel-translate`, `skill-to-site`
- **Whisper model ggml-medium.bin — download via models/download-ggml-model.sh medium** — used by `transcript-extractor-plus`
- **YouTube** — used by `voice-dna-extractor`
- **git — OPTIONAL. If the target workspace is a git repo with a remote, the installer runs a safety HALT when confidential client files are tracked. Without git, the installer still scaffolds normally.** — used by `obsidian-brain-install`
- **hyperframes v0.6.x via npx — install: claude plugin marketplace add bradautomates/claude-video, then claude plugin install hyperframes, hyperframes-cli, hyperframes-media** — used by `overlay-director`
- **n8n Cloud** — used by `five-min-texter`
- **whisper.cpp — Windows: built inside WSL at ~/whisper.cpp. macOS: brew install whisper-cpp. Linux: build from source.** — used by `transcript-extractor-plus`