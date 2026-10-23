# Claude Design Build Rules (web-dev-bot skill-local)

> Loaded by `commands/web-dev-bot.md` when BUILD → Phase 0 → "From Claude Design" is selected.

---

## The Generic Rule

When intaking a Claude Design file, web-dev-bot:
1. **Auto-loads** `~/.claude/CLAUDE.md` for voice and brand context (the SKILL loads this — the GENERATED PROJECT does not)
2. **Defaults to Next.js + GSAP** as the output stack
3. Adds **trending, voice-aligned animations** — stunning but not cheesy, current but not overloaded
4. **Builds the full site in one pass** — end-to-end after intake approvals, with mid-pass narration + ONE first-page render gate, not phase-by-phase pauses. EDIT mode handles tweaks after <your-name> sees the finished build.

---

## Entry-Point Auto-Detect

When BUILD → "From Claude Design" is selected, scan for the newest export (in order):

1. `~/Downloads/` for files matching `claude-design-*.zip`, `claude-design-*.html`, or any `*.zip` containing `manifest.json` with `"source": "claude-design"`
2. `~/Desktop/`
3. `~/Documents/Claude Exports/` (if it exists)

Sort by modification time (newest first). If a candidate is found AND modified within the last **2 hours** (configurable here), offer it:

> "Found `claude-design-export-2026-04-21-1432.zip` in Downloads (modified 8 minutes ago) — use this?"

If accepted: skip to Phase 1D step 2 (extract). If rejected or none found: ask user to drag/drop or paste a path via AskUserQuestion.

**Tunable config:**
- `CLAUDE_DESIGN_AUTODETECT_HOURS` = 2
- `CLAUDE_DESIGN_AUTODETECT_PATHS` = ["~/Downloads", "~/Desktop", "~/Documents/Claude Exports"]

---

## Security Non-Negotiables

Hard requirements before the build runs (enforced in Phase 1D step 2 + Phase 3 install):

1. **Zip-slip guard** on archive extraction — validate every `member.filename` resolves inside target dir; reject `..`, absolute paths, symlinks
2. **Script + event-handler strip** on extracted/pasted HTML — remove `<script>`, inline `on*=`, `javascript:` URLs via BeautifulSoup
3. **MIME whitelist** on extracted assets — images (jpg/png/svg/webp/gif), fonts (woff/woff2/ttf), styles (css). Reject `.exe`, `.bat`, `.lnk`, `.html`-as-image
4. **Sandboxed Playwright preview** — confined to project root, per-session temp profile torched on exit
5. **Filesize caps** — 25MB total bundle, 5MB per asset, reject >100 files
6. **No automatic auth** — manual sign-in only if v2 ever adds URL ingest. No stored credentials, no Chrome profile reuse
7. **Supply-chain hygiene** — Phase 3 install MUST use `pnpm install --ignore-scripts` (or npm equivalent), generate a lockfile, run `pnpm audit --audit-level=high` post-install, surface high/critical CVEs to user BEFORE running `next dev`. Pin Node via `.nvmrc` AND `engines` in `package.json`.

---

## Install Strategy

| Concern | Decision |
|---------|----------|
| Package manager | `pnpm` preferred (3-5× faster than npm). Fallback to `npm` if not installed |
| Node version | Pin `>=20.9 <23` via `engines` AND `.nvmrc` |
| Expected install duration | 3-5 min (pnpm broadband), 5-8 min (npm). Surfaced in Phase 3 narration beat #2 |
| Lockfile policy | `pnpm-lock.yaml` (or `package-lock.json`) committed at scaffold; never `--no-package-lock` |
| Script hygiene | First install with `--ignore-scripts`. Audit gate runs before `next dev`. User confirms audit results before resume |

---

## Phase 3 Lifecycle Signals

Build emits structured progress signals (consumed by narration beats; surface to user if anything stalls):

```
[lifecycle] scaffold:start    → "Scaffolding Next.js 16..."
[lifecycle] scaffold:complete →
[lifecycle] install:start     → "Installing deps (pnpm, est. 3-5 min)..."
[lifecycle] install:complete  →
[lifecycle] audit:start       → "Running supply-chain audit..."
[lifecycle] audit:complete    → (pause if CVE found, else continue)
[lifecycle] translate:start   → "Translating design to React..."
[lifecycle] translate:complete→
[lifecycle] firstpage:render  → MID-PASS GATE — screenshot + ratify
[lifecycle] motion:complete   →
[lifecycle] responsive:complete →
[lifecycle] build:complete    → "Build complete. Opening preview."
```

If any lifecycle stage exceeds 2× expected duration, surface to user proactively rather than silently hanging.

---

## Skill-Level Dependencies

- `beautifulsoup4`, `lxml` (with `html.parser` fallback), `Pillow`, `playwright` (already installed), `pixelmatch` (Node, for Phase 4 diff)

Per-project (in generated Next.js scaffold):
- `next@16`, `gsap@3.13`, `@gsap/react`, `tailwindcss@4`, `@gsap/scrolltrigger`
