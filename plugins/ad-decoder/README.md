# ad-decoder

> Scout + Study the Meta Ad Library: find long-running outlier ads, pick winners, and break down why they work on 9 dimensions for /ss-ad-generator and /ad-copy-forge

**Tier:** T9
**Version:** 1.0.0
**Command:** `/ad-decoder`

## Usage

```
/ad-decoder
```

## Prerequisites

**Recommended skills** (warning if missing, not blocking):
- `ss-ad-generator`
- `ad-copy-forge`

**CLI tools:**
- `python`
- `ffmpeg`

**External services:**
- Anthropic API key + Groq API key, set in the skill folder's .env (copy .env.example). No Meta token needed.
- First run: pip install -r requirements.txt && playwright install chromium


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## Notes

- The Ad Library is collected through a real browser session at human pace and low volume (research, not harvest). Automated collection may conflict with Meta's terms of service; use it at your own discretion.
- It studies the structure of winning ads. The handoff tells you to fill that structure with your own offer, never a competitor's.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
