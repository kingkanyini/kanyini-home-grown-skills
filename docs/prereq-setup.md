# Prerequisite Setup

This guide walks through every external dependency the Phase 1 bundle uses. Not every skill needs every dependency — see each skill's `README.md` for its specific list, or run `node preflight.mjs` from the skill's folder.

## MCP Servers

### `mcp__claude_ai_Canva__*`

Built into claude.ai — link your Canva account in the integrations panel.

### `mcp__composio__*`

See https://docs.composio.dev/mcp — requires `COMPOSIO_API_KEY`. Bridges 100+ services (Calendar, Stripe, Calendly, ClickFunnels, etc.).

### `mcp__ffmpeg-mcp__*`

See https://github.com/ffmpeg/mcp — requires `ffmpeg` CLI on PATH.

### `mcp__gmail-gong-mcp__*`

See https://github.com/gongrzhe/gmail-mcp — requires Gmail OAuth credentials.

### `mcp__obsidian-brain__*`

See https://github.com/obsidian-brain/mcp — install into your Claude Code MCP config pointing at your Obsidian vault.

### `mcp__perplexity__*`

See https://github.com/perplexity/mcp — requires `PERPLEXITY_API_KEY` env var.

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
| `COMPOSIO_API_KEY` | `morning-compass` | _(set per service docs)_ |
| `PERPLEXITY_API_KEY` | `perplexity-research` | _(set per service docs)_ |
| `VERCEL_TOKEN` | `funnel-translate`, `skill-to-site` | _(set per service docs)_ |

## External Services

Some skills call out to managed services. You'll need accounts + auth for each.

- **Anthropic** — used by `skill-to-site`
- **Basecamp** — used by `morning-compass`
- **Calendly** — used by `morning-compass`
- **Canva** — used by `offer-optimizer`
- **ClickFunnels** — used by `morning-compass`
- **Composio** — used by `morning-compass`
- **Gmail** — used by `inbox-digest`
- **Google Calendar** — used by `morning-compass`
- **Instagram** — used by `morning-compass`, `voice-dna-extractor`
- **Perplexity** — used by `perplexity-research`
- **Stripe** — used by `morning-compass`
- **Vercel** — used by `funnel-translate`, `skill-to-site`
- **YouTube** — used by `morning-compass`, `voice-dna-extractor`