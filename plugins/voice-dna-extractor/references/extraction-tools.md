# Extraction Tools — Routing per Source

## Decision Tree

```
Source URL or path?
├── instagram.com/* → yt-dlp-mcp (try first)
│       └── fail → Instaloader (Python CLI fallback)
│       └── fail → ask client for original file
├── youtube.com/* or youtu.be/* → yt-dlp-mcp (most reliable)
├── *.mp4 / *.mov / *.mkv (local) → ffmpeg-mcp extract_audio
├── podcast RSS or direct *.mp3 URL → curl + ffmpeg (or yt-dlp)
└── other social (TikTok/Twitter/LinkedIn) → ask client direct
```

## Tool Notes

### yt-dlp-mcp (PRIMARY for URL sources)

Already installed via MCP. Works for YouTube, partial Instagram, partial TikTok.

**Tool:** `mcp__yt-dlp-mcp__ytdlp_download_audio`

**Reliability tier:**
- YouTube: 9/10 — very reliable
- Instagram public Reels/Posts: 6/10 — works often, fails on private/auth-required content
- Instagram Stories: 3/10 — usually fails (anti-scraping is aggressive)
- TikTok: 4/10 — community extractors break frequently
- Twitter/X: 5/10 — auth changes break things often

**Fail signal:** auth error, "video unavailable", or empty download. When it fails, do NOT retry the same URL — pivot to fallback or ask client direct.

### ffmpeg-mcp (PRIMARY for local files)

Already installed via MCP.

**Tool:** `mcp__ffmpeg-mcp__extract_audio`

Pulls audio track from any video file. Output format auto-detected, default to MP3 unless WAV requested.

### Instaloader (FALLBACK for Instagram)

NOT installed by default. Install with:

```
pip install instaloader
```

**Usage pattern:**
```
instaloader --no-videos --no-pictures --no-metadata-json --no-captions -- -[shortcode]
```

Then run ffmpeg on the resulting MP4 to extract audio.

**Gotchas:**
- Requires Instagram login (use a dedicated account, not <your-name>'s main)
- Aggressive use triggers IG bans — limit to 5-10 extractions per session
- Stories expire in 24h; download fast or get the original from client

### ffmpeg CLI (RAW FALLBACK)

If MCP tool fails, drop to direct CLI:

```
ffmpeg -i [input-file] -vn -acodec libmp3lame -b:a 192k [output.mp3]
```

`-vn` strips video, `-acodec libmp3lame` forces MP3, `-b:a 192k` sets quality.

## Platform-Specific Gotchas

### Instagram

- **Reels** are the cleanest source — usually have clear audio, no other speakers
- **Carousels with video** — yt-dlp may only grab the first slide; verify the right one
- **Stories** are ephemeral — if it's a Story, ask client for the original file
- **IGTV** is being phased out but old videos still extractable

### YouTube

- **Shorts** work fine — but often too short for voice DNA (15-60s)
- **Live archives** — strip the chat overlay, only grab the audio track
- **Members-only / Premium** — yt-dlp will fail without auth cookies. Don't bother — ask client.

### Local Video Files

- **MP4/MOV (h.264 + AAC):** cleanest, fastest extraction
- **MKV with multiple audio tracks:** specify track index with `-map 0:a:0`
- **Phone recordings:** often have weird sample rates (44100 vs 48000) — Phase 4 will normalize

## Honor Check (Life Gamer Code)

Before extracting any URL, ask: **"Does the voice owner know I'm doing this?"**

- Self → yes, you know.
- Client → consent must be captured in Phase 2 BEFORE extraction.
- Random public figure → STOP. This skill is not for that. Do not bypass.
