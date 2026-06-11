# Prerequisite Setup

This guide walks through every external dependency the Phase 1 bundle uses. Not every skill needs every dependency — see each skill's `README.md` for its specific list, or run `node preflight.mjs` from the skill's folder.

## MCP Servers

### `mcp__claude_ai_Canva__*`

Built into claude.ai — link your Canva account in the integrations panel.

### `mcp__ffmpeg-mcp__*`

See https://github.com/ffmpeg/mcp — requires `ffmpeg` CLI on PATH.

### `mcp__gmail-gong-mcp__*`

See https://github.com/gongrzhe/gmail-mcp — requires Gmail OAuth credentials.

### `mcp__perplexity__*`

See https://github.com/perplexity/mcp — requires `PERPLEXITY_API_KEY` env var.

### `mcp__playwright__*`

_(install docs TBD — see skill README)_

### `mcp__yt-dlp-mcp__*`

See https://github.com/yt-dlp/mcp — requires `yt-dlp` CLI on PATH.

## CLI Tools

### `ffmpeg`

Mac: `brew install ffmpeg`. Windows: `winget install ffmpeg`. Linux: `apt install ffmpeg`.

### `git`

Pre-installed on most systems. Mac: `brew install git`. Windows: https://git-scm.com.

### `node`

Install Node.js 20+ from https://nodejs.org or via your package manager.

### `npx`

Bundled with Node.js.

### `pwsh`

PowerShell 7+. Windows: comes pre-installed. Mac: `brew install powershell`.

### `python`

Install Python 3.10+ from https://python.org or your package manager.

### `yt-dlp`

Install: `pip install yt-dlp` or `brew install yt-dlp`.

## Environment Variables

Set these in your `.env` file or your shell environment. Never commit `.env` to git.

| Variable | Used by | Where to get |
|----------|---------|--------------|
| `ANTHROPIC_API_KEY` | `skill-to-site` | _(set per service docs)_ |
| `PERPLEXITY_API_KEY` | `perplexity-research` | _(set per service docs)_ |
| `VERCEL_TOKEN` | `funnel-translate`, `skill-to-site` | _(set per service docs)_ |

## External Services

Some skills call out to managed services. You'll need accounts + auth for each.

- **Anthropic** — used by `skill-to-site`
- **Canva** — used by `offer-optimizer`
- **Gmail** — used by `inbox-digest`
- **Instagram** — used by `voice-dna-extractor`
- **Move-gate tooling: run npm install inside references/moves-library/_impl/gate/ before registering new moves** — used by `overlay-director`
- **Optional: Imaginator art generation (Gemini) — without it, art cards become labeled placeholders** — used by `overlay-director`
- **Optional: mcp__obsidian-brain__* vault MCP powers the effects registry — without it the feature no-ops** — used by `web-dev-bot`
- **Perplexity** — used by `perplexity-research`
- **Vault MCP (mcp__obsidian-brain__*) is OPTIONAL — without a vault, the skill cold-starts from its shipped playbook digest (Phase 0.5d)** — used by `overlay-director`
- **Vercel** — used by `funnel-translate`, `skill-to-site`
- **YouTube** — used by `voice-dna-extractor`
- **hyperframes v0.6.x via npx — install: claude plugin marketplace add bradautomates/claude-video, then claude plugin install hyperframes, hyperframes-cli, hyperframes-media** — used by `overlay-director`