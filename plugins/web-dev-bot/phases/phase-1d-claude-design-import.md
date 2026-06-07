# Phase 1D — Claude Design Import (web-dev-bot)

> Runtime operational doc. Loaded when BUILD → Phase 0 → "From Claude Design" is selected.
> Companion: `~/.claude/plugins/local/web-dev-bot/references/claude-design-build-rules.md`

---

## Pre-Phase: Surface the Generic Rule

At the top of Phase 1D, print to user:

```
==========================================================
CLAUDE DESIGN INTAKE — Active Rules
==========================================================
1. Auto-loading ~/.claude/CLAUDE.md for voice context
2. Default stack: Next.js 16 + GSAP 3.13 + Tailwind 4
3. Animations: trending, voice-aligned, motion budget enforced
4. Build mode: SINGLE PASS with mid-pass first-page gate
==========================================================
```

---

## Phase 0a — Client or Personal?

Use AskUserQuestion:
- **Client work** → brand kit (P1) + platform notes (P3) REQUIRED in gap-fill
- **Personal experiment** → both OPTIONAL

Store choice as `mode: "client" | "personal"` in `.design-source/build-brief.md` later.

---

## Step 1 — Detect & Ingest

### 1a. Auto-detect newest export

Per `references/claude-design-build-rules.md` Entry-Point Auto-Detect section. Scan `~/Downloads`, `~/Desktop`, `~/Documents/Claude Exports`. If a candidate modified within last 2 hours, offer it.

### 1b. Format detection

| Format | Detection | Parser |
|--------|-----------|--------|
| Claude Code handoff bundle (PRIMARY) | `.zip` containing `manifest.json` or `claude-design-bundle.json` | `zipfile` → read manifest → load structured payload |
| Standalone HTML (SECONDARY) | Single `.html` file or pasted HTML | BeautifulSoup with `lxml` (fallback `html.parser`) |
| Design Decoder MD (TERTIARY) | `.md` file matching `DESIGN-*.md` in `~/.claude/references/design-library/` OR explicit path via `--design-source [path]` | Direct Markdown read — parse frontmatter + 9 sections into `build-brief.md` seed |

If none match: error with: *"Expected a Claude Design handoff bundle (.zip), standalone .html, or DESIGN-MD from /design-decoder codex. Got [filetype]. Try `/design-decoder [url]` first to generate a DESIGN-MD."*

---

## Step 2 — Sandboxed Extract

Target dir: `[project]/intake/claude-design/[YYYY-MM-DD-HHMMSS]/`

ALL of these MUST execute (CIPHER non-negotiables):

```python
import zipfile, os
from pathlib import Path

def safe_extract(zip_path: str, target_dir: Path):
    target_dir = target_dir.resolve()
    target_dir.mkdir(parents=True, exist_ok=True)
    total_size = 0
    file_count = 0
    with zipfile.ZipFile(zip_path) as zf:
        for member in zf.infolist():
            if member.file_size > 5 * 1024 * 1024:
                raise ValueError(f"Asset {member.filename} exceeds 5MB cap")
            total_size += member.file_size
            if total_size > 25 * 1024 * 1024:
                raise ValueError("Bundle exceeds 25MB total cap")
            file_count += 1
            if file_count > 100:
                raise ValueError("Bundle exceeds 100 file cap")
            dest = (target_dir / member.filename).resolve()
            if not str(dest).startswith(str(target_dir) + os.sep):
                raise ValueError(f"Zip-slip detected: {member.filename}")
            if member.is_dir():
                continue
            if (member.external_attr >> 16) & 0o170000 == 0o120000:
                raise ValueError(f"Symlink rejected: {member.filename}")
            ext = Path(member.filename).suffix.lower()
            if ext not in {".html", ".css", ".jpg", ".jpeg", ".png", ".svg", ".webp", ".gif",
                           ".woff", ".woff2", ".ttf", ".json", ".md"}:
                raise ValueError(f"MIME whitelist reject: {member.filename}")
            zf.extract(member, target_dir)
```

After extract, sanitize HTML:

```python
from bs4 import BeautifulSoup

def sanitize_html(html: str) -> str:
    try:
        soup = BeautifulSoup(html, "lxml")
    except Exception:
        soup = BeautifulSoup(html, "html.parser")
    for tag in soup.find_all("script"):
        tag.decompose()
    for tag in soup.find_all(True):
        for attr in list(tag.attrs):
            if attr.lower().startswith("on"):
                del tag[attr]
            elif attr.lower() in ("href", "src") and str(tag[attr]).lower().startswith("javascript:"):
                del tag[attr]
    return str(soup)
```

---

## Step 2b — DESIGN-MD Parsing (Tertiary Path Only)

If the detected format in Step 1b was a DESIGN-MD (from `/design-decoder` codex):

Skip the sandboxed zip extract + HTML sanitization. Instead:

1. Read the DESIGN-MD directly from its path
2. Parse the YAML frontmatter for:
   - `source_url` → note as reference URL
   - `fidelity_score` → log for user awareness
   - `pages_analyzed` → populate component plan
3. Parse the 9 sections into structured data:
   - Section 1 → voice brief
   - Section 2 → color palette (map to brand overlay)
   - Section 3 → typography tokens
   - Section 4 → component inventory
   - Sections 5-8 → layout / elevation / rules / responsive
4. Skip Playwright snapshot (Step 3) — the DESIGN-MD is the design-source
5. Copy the DESIGN-MD verbatim into `[project]/.design-source/design-grammar.md`
6. Proceed to Step 4 (Drop Project Templates) with `source_type: "design-decoder-md"`

The DESIGN-MD replaces the need for HTML snapshots — it IS the visual grammar contract.

---

## Step 3 — Snapshot

Write to `[project]/.design-source/`:
- `structure.json` — page tree, sections, component hierarchy
- `sanitized.html` — output of `sanitize_html()`
- `snapshot.png` — Playwright screenshot (default 1440)
- `snapshot-375.png`, `snapshot-768.png`, `snapshot-1440.png` — viewport-specific
- `manifest.json` — copy from bundle, or generate `{"source": "standalone-html", "imported_at": "[ISO]"}`

```python
from playwright.sync_api import sync_playwright
import shutil

def snapshot_design(html_path, out_dir):
    with sync_playwright() as p:
        ctx = p.chromium.launch_persistent_context(
            user_data_dir=str(out_dir / ".playwright-tmp"),
            args=["--disable-extensions"],
        )
        page = ctx.new_page()
        page.goto(f"file://{html_path.resolve()}")
        for w in (375, 768, 1440):
            page.set_viewport_size({"width": w, "height": int(w * 0.75)})
            page.screenshot(path=str(out_dir / f"snapshot-{w}.png"), full_page=True)
        # Canonical default snapshot at 1440x900 (explicit reset so default matches Phase 4 QA baseline)
        page.set_viewport_size({"width": 1440, "height": 900})
        page.screenshot(path=str(out_dir / "snapshot.png"), full_page=True)
        ctx.close()
    shutil.rmtree(out_dir / ".playwright-tmp", ignore_errors=True)
```

---

## Step 4 — Drop Project Templates

Copy `~/.claude/plugins/local/web-dev-bot/templates/claude-design-project/` contents into the new project root:
- `[project]/CLAUDE.md` ← from template
- `[project]/project_specs.md` ← from template

Replace `[project-name]` and `[ISO date]` placeholders in `project_specs.md` with actual values.

---

## Step 5 — Gap-Fill Interview (Max 6 Questions via AskUserQuestion)

Bot loads:
- Bundle/HTML structure
- Phase 1B context if previously gathered
- `~/.claude/CLAUDE.md`

Ask ONLY missing items, max 6 total:

1. **Domain** — have one / need to buy / use free subdomain
2. **Hosting** — Vercel default / Netlify / other
3. **Real copy** — drop in now / use placeholder / will edit later
4. **Client brand kit override** (REQUIRED if `mode == "client"`)
5. **Platform/stack override** — keep Next.js + GSAP / static HTML / other
6. **Integrations** (multi-select) — analytics / forms / payments / email / none

---

## Step 6 — Auto-Fill project_specs.md (Gate #1)

Bot fills the skeleton at `[project]/project_specs.md`. Print full contents. Use AskUserQuestion:

> "project_specs.md drafted. Approve to proceed (per Rule 2 — no code before approval)?"

If approved: mark `**Status:** approved`. If not: capture edits, redraft, re-ask.

---

## Step 7 — Pre-Build Briefing (Gate #2)

Print combined briefing:

```
PRE-BUILD BRIEFING
==================
Parsed your Claude Design export:
  Pages:        [N] ([list])
  Components:   [N]
  Stack hint:   [marketing | app | dashboard]
  Brand colors: [#hex list]
  Body copy:    [N] words (placeholder ratio: [N]%)
  Snapshot:     .design-source/snapshot.png

Context layers reshape the design:
  HERO:    Original headline "[orig]" → "[new copy]"
  COLORS:  Design palette → [overrides if any]
  MOTION:  [pattern selections from animation-library.md]
  STACK:   Next.js 16 (App Router) + GSAP 3.13 + Tailwind 4

Counsel notes (from Steve / Greg / Anurag):
  • [3 lines max]

Build brief written to: .design-source/build-brief.md

Approve to start the one-pass build? (Mid-pass visual gate after first-page render.)
```

Use AskUserQuestion. Hard stop until user approves.

---

## Step 8 — Write build-brief.md

Before exiting Phase 1D, write `[project]/.design-source/build-brief.md`:

~~~markdown
# Build Brief — [project-name]
Generated: [ISO timestamp]
Source: [bundle filename or "standalone-html"]
Mode: [client | personal]

## Stack
Next.js 16 (App Router), GSAP 3.13, Tailwind 4, @gsap/react, ScrollTrigger
Package manager: pnpm (fallback npm)
Node: >=20.9 <23

## Component Plan
[Page-by-page from structure.json. Example:]
- `app/page.tsx` — Hero (E1) + 3 sections (E2 each)
- `app/about/page.tsx` — single section, image-led (E3)
- `components/Nav.tsx` — H2 CSS underline links
- `components/Cta.tsx` — H1 magnetic primary

## Animation Plan
[Per section, budget compliance]

## Brand Overlay
- Colors: [hex from brand kit OR design defaults]
- Typography: [font tokens]
- Copy substitutions: [list of original → new]

## Counsel Notes (≤3 lines each)
- Steve Jobs (UX): [one-line takeaway]
- Greg Hogg (architecture): [one-line takeaway]
- Anurag (implementation): [one-line takeaway]

## Voice Anchors
[2-3 lines from voice-aligned-motion.md + <your-name>'s CLAUDE.md voice section]
~~~

Phase 3 prompt MUST cite this file as authoritative context.

---

## Hand-Off to Phase 2

After Step 8, exit Phase 1D and rejoin standard BUILD flow at Phase 2 (Stack Recommendation).

Phase 2 default for Claude Design path: **Next.js + GSAP**. Opt-in fallbacks: Static HTML passthrough (visual drift warning), other stack on explicit override.
