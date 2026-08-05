---
description: Take high-def screenshots from videos, websites, or extract photos from PDFs
---

# Snapshot

Extract high-definition PNG screenshots from video files, capture website screenshots, or extract embedded photos from PDFs with AI-powered analysis.

## On Launch

Present the mode selection:

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  SNAPSHOT                                                    ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  1. Video Frame Extract — Pull first frame from video(s)     ║
  ║  2. Website Screenshot — Capture a webpage as PNG            ║
  ║  3. PDF Photo Extract — Pull photos from PDFs + analyze them ║
  ╚══════════════════════════════════════════════════════════════╝
```

Use AskUserQuestion with options:
- "Video Frame Extract"
- "Website Screenshot"
- "PDF Photo Extract"

---

## Mode 1: Video Frame Extract

### Input
Ask for:
1. **File path(s)** — One or more video files. Accept any format ffmpeg supports (.mp4, .mov, .avi, .mkv, .webm, etc.)
2. **Output location** — Ask: "Save next to the originals, or a different folder?" Default is same folder as each video.
3. **Frame selection** — Ask: "First frame, or a specific timestamp?" Default is first frame (00:00:00).

### Processing
For each video file:

**First frame extraction:**
```bash
ffmpeg -i "[input_path]" -vframes 1 -q:v 1 -update 1 "[output_path]" -y
```

**Specific timestamp extraction:**
```bash
ffmpeg -ss [timestamp] -i "[input_path]" -vframes 1 -q:v 1 -update 1 "[output_path]" -y
```

**Output naming:** `[original filename] - Frame1.png` (or `- Frame_[timestamp].png` for specific timestamps). Save as PNG for maximum quality.

### Batch behavior
- Process ALL files in a single pass. Run ffmpeg commands in parallel where possible.
- Report results as a summary table:

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  SNAPSHOT COMPLETE                                           ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  [filename] → [output] ✓ [resolution]                       ║
  ║  [filename] → [output] ✓ [resolution]                       ║
  ║  [filename] → [output] ✗ [error reason]                     ║
  ╚══════════════════════════════════════════════════════════════╝
```

- Show each extracted image using the Read tool so the user can preview.

### Error handling
- If ffmpeg is not installed, tell the user and suggest: `winget install ffmpeg`
- If a file path doesn't exist, skip it and report in the summary
- If a file isn't a video format ffmpeg recognizes, skip and report

---

## Mode 2: Website Screenshot

### Input
Ask for:
1. **URL** — The webpage to capture
2. **Output location** — Where to save. Suggest Desktop or a folder they name.
3. **Viewport** — Ask: "Desktop (1920x1080), Mobile (390x844), or custom?" Default is Desktop.

### Processing
Use Playwright MCP to:
1. Navigate to the URL
2. Wait for page load
3. Take a full-page screenshot as PNG

```
browser_navigate → [url]
browser_take_screenshot → (full page)
```

Save the screenshot to the specified location. Show it using Read tool for preview.

**Output naming:** `[domain] - Screenshot [YYYY-MM-DD].png`

### Error handling
- If Playwright MCP isn't available, flag it and offer to help set it up
- If the URL fails to load, report the error clearly

---

## Mode 3: PDF Photo Extract

Extract embedded photos from mixed-media PDFs (text + images), filter out non-photo elements, save as HD PNGs, and analyze each photo with a description.

### Dependencies

Requires `pymupdf` Python package. If not installed:
```bash
pip install pymupdf
```

### Input

Ask for:
1. **Source** — A single PDF file path OR a folder path containing PDFs. If folder, process every `.pdf` inside.
2. **Minimum size override** — Default is 200x200px (filters out icons, logos, decorative elements). Ask: "Default 200x200 photo filter, or adjust?" Only ask once per session.

### Processing

Use the following Python script via Bash for each PDF. The script:
- Opens the PDF with PyMuPDF (fitz)
- Iterates every page, extracts all embedded images
- Filters by minimum dimensions (default 200x200)
- Saves each qualifying image as a max-quality PNG
- Creates a subfolder per PDF named `[pdf_name] - Photos/`

```python
import fitz
import sys
import os
import json
from pathlib import Path

pdf_path = sys.argv[1]
output_dir = sys.argv[2]
min_w = int(sys.argv[3]) if len(sys.argv) > 3 else 200
min_h = int(sys.argv[4]) if len(sys.argv) > 4 else 200

# Path validation — reject traversal attacks and unsafe locations
pdf_file = Path(pdf_path).resolve()
out_dir = Path(output_dir).resolve()
home = Path.home().resolve()

if not pdf_file.exists() or not pdf_file.is_file():
    print(json.dumps({"error": f"PDF not found: {pdf_path}"}))
    sys.exit(1)
if pdf_file.suffix.lower() != '.pdf':
    print(json.dumps({"error": f"Not a PDF: {pdf_path}"}))
    sys.exit(1)
if '..' in str(out_dir):
    print(json.dumps({"error": "Path traversal not allowed in output directory"}))
    sys.exit(1)

os.makedirs(output_dir, exist_ok=True)

doc = fitz.open(pdf_path)
results = []
photo_num = 0

for page_num in range(len(doc)):
    page = doc[page_num]
    images = page.get_images(full=True)
    for img_index, img in enumerate(images):
        xref = img[0]
        base_image = doc.extract_image(xref)
        if not base_image:
            continue
        width = base_image["width"]
        height = base_image["height"]
        if width < min_w or height < min_h:
            continue
        photo_num += 1
        ext = base_image["ext"]
        image_bytes = base_image["image"]
        out_name = f"Photo_{photo_num:03d}_p{page_num+1}.png"
        out_path = os.path.join(output_dir, out_name)
        # Save as PNG — write directly if already PNG, otherwise convert
        if ext == "png":
            with open(out_path, "wb") as f:
                f.write(image_bytes)
        else:
            pix = fitz.Pixmap(image_bytes)
            if pix.colorspace and pix.colorspace.n >= 4:  # CMYK
                pix = fitz.Pixmap(fitz.csRGB, pix)
            pix.save(out_path)
        results.append({
            "file": out_name,
            "page": page_num + 1,
            "width": width,
            "height": height,
            "original_format": ext,
            "path": out_path
        })

doc.close()
print(json.dumps(results))
```

**Write this script to a temp file, run it, parse the JSON output.**

### Output Structure

For a PDF at `C:\docs\family-history.pdf`:
```
C:\docs\family-history - Photos\
├── Photo_001_p1.png
├── Photo_002_p1.png
├── Photo_003_p3.png
└── photo_manifest.md
```

For batch mode (folder of PDFs), each PDF gets its own subfolder:
```
C:\docs\album1 - Photos\
C:\docs\album2 - Photos\
```

### Photo Analysis

After extraction, Claude MUST:

1. **Read each extracted photo** using the Read tool (Claude is multimodal and can view images)
2. **Describe what's in the photo** — people, setting, mood, era, notable details
   - Example descriptions: "Elderly woman with young boy, possibly grandmother and grandson, outdoor garden setting, appears 1960s"
   - "Group portrait, 8 people in formal attire, indoor studio, black and white"
   - "Landscape photo, mountain range with fog, no people"
3. **Build a manifest** combining file info + descriptions

### Manifest File

Save `photo_manifest.md` in the output subfolder:

```markdown
# Photo Manifest: [PDF filename]
Extracted: [date]
Source: [full PDF path]
Photos found: [count] (filtered from [total images] embedded images)
Min size filter: [width]x[height]

| # | File | Page | Size | Description |
|---|------|------|------|-------------|
| 1 | Photo_001_p1.png | 1 | 1200x800 | Elderly woman with young boy, garden setting, ~1960s |
| 2 | Photo_002_p1.png | 1 | 900x600 | Black and white group portrait, formal attire |
| 3 | Photo_003_p3.png | 3 | 1600x1200 | Mountain landscape with fog |
```

### Terminal Summary

Display results in terminal with the standard Snapshot format:

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  PDF PHOTO EXTRACT COMPLETE                                  ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  Source: [filename.pdf]                                      ║
  ║  Photos found: [X] / [Y total images] (filtered)            ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  1. Photo_001_p1.png (p.1) 1200x800                         ║
  ║     → Elderly woman with young boy, garden, ~1960s           ║
  ║  2. Photo_002_p1.png (p.1) 900x600                          ║
  ║     → B&W group portrait, formal attire                      ║
  ║  3. Photo_003_p3.png (p.3) 1600x1200                        ║
  ║     → Mountain landscape with fog                            ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  Manifest saved: [path to photo_manifest.md]                 ║
  ║  Photos saved to: [output folder path]                       ║
  ╚══════════════════════════════════════════════════════════════╝
```

For batch mode, show one summary block per PDF, then a grand total at the end.

### Batch Behavior

When given a folder:
1. Scan for all `.pdf` files (non-recursive — top level only)
2. Process each PDF sequentially (to avoid memory issues with large PDFs)
3. Each PDF gets its own output subfolder and manifest
4. Show a grand total at the end:

```
  ╔══════════════════════════════════════════════════════════════╗
  ║  BATCH COMPLETE                                              ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  PDFs processed: [X]                                         ║
  ║  Total photos extracted: [Y]                                 ║
  ║  Output folders: [list]                                      ║
  ╚══════════════════════════════════════════════════════════════╝
```

### Error Handling

- If `pymupdf` is not installed: tell user and run `pip install pymupdf`
- If PDF path doesn't exist: skip and report
- If a PDF has no qualifying photos: report "0 photos found (X images below size threshold)" — don't create empty folders
- If an image can't be extracted (corrupted xref): skip, log in summary as skipped
- If PDF is password-protected: report and skip

---

## After Completion

When any mode finishes capturing image(s), do NOT immediately ask "more snapshots?". First enter the **Hand-Off Phase** below for the captured image(s). The original wrap-up ("Need more snapshots, or we good?") becomes the "Done" exit inside that phase.

---

## Hand-Off Phase

Turn a fresh capture into a finished asset without leaving the skill. Routes: HTML Overlay (local), Canva (guided drag-in), Imaginator (Gemini).

### Phase 0 — Preflight

**Before the menu (Phase 1):**
1. **0 images** (e.g., PDF extract found none) → SKIP the entire Hand-Off Phase; go straight to the wrap-up ("Need more snapshots, or we good?").

**Just-in-time, after a route is chosen (Phase 1) and consent given (Phase 2):**
2. **>1 image** (PDF multi-photo) → first ask WHICH image using `AskUserQuestion`, labeling options with the manifest descriptions (e.g., "Photo_001 — elderly woman, garden"), not filenames.
3. **Dependency check** for the chosen route: HTML needs Playwright MCP; Canva needs Canva MCP auth; Imaginator needs `python` + `GEMINI_API_KEY`. If missing, say so plainly and offer a different route instead of failing mid-flow.
4. **Size guard (HTML route only):** if the source image's longest edge > 4096px, offer to downscale for the render.

### Phase 1 — Route menu

Use `AskUserQuestion` (one question, recommended-first):
- **HTML Overlay (Recommended)** — add a title/text over the image, fully local, finishes the asset.
- **Canva (manual drop-in)** — open/locate a Canva design, then drag the saved PNG in.
- **Imaginator** — send to Gemini for an edit/composite.
- **Done** — no hand-off; go to wrap-up.

### Phase 2 — External-send consent gate (MANDATORY for Canva + Imaginator)

Before any image leaves this machine (Canva or Imaginator routes ONLY), confirm via `AskUserQuestion`:
> "This image will be sent to **[Canva / Google's Gemini servers]**. Captured frames can contain faces or personal info. Send it?"
> Options: **Yes, send it** / **Pick a different route**

Require an explicit "Yes". The **HTML Overlay route is fully local and SKIPS this gate.** Never paste a person's name or PII into any prompt/intent line passed to an external service.

### Route 1 — HTML Overlay (local, recommended)

1. **Platform/aspect preset** — `AskUserQuestion`: **YouTube 1280×720 (Recommended)** / Instagram 1080×1080 / Story 1080×1920 / Native (match source) / Custom (ask W×H).
2. **Treatment** — `AskUserQuestion`: **Centered (shadow scrim) (Recommended)** / Top band / Lower third.
3. **Title text** — ask for the title text ONLY. Apply smart defaults for everything else (serif Cormorant Garamond, size ≥90px scaled to the canvas, scrim on). Render IMMEDIATELY — no more questions before the first pixel.
4. **Render sequence (deterministic):**
   a. Create a clean temp working dir. Copy the chosen source image into it as `bg.png` at native resolution. **Assert `bg.png` exists** before serving. Copy `assets/overlay-template.html` into the same working dir. The working dir must contain ONLY `bg.png` + `overlay-template.html`.
   b. Edit the working copy's CONFIG block: set the `.title` text (wrap any italic phrase in `<span class="accent">…</span>`); set `<body data-treatment="...">` to the chosen treatment; tune `--title-size`/`--box-width` to fit the preset.
   c. **Ephemeral port:** pick a free port (`python -c "import socket; s=socket.socket(); s.bind(('127.0.0.1',0)); print(s.getsockname()[1]); s.close()"`), then serve the working dir on it: `python -m http.server <port> --bind 127.0.0.1 --directory "<workdir>"` as a background run; capture the python PID. *Fallback:* if `browser_navigate` fails with connection-refused/in-use, pick another free port and retry. Never reuse a fixed 8765.
   d. Playwright: `browser_resize` to the preset dims → `browser_navigate` to `http://127.0.0.1:<port>/overlay-template.html` → `browser_evaluate: await document.fonts.ready` (kills the font-load race; confirm it returns before shooting) → `browser_take_screenshot`. **Note:** the Playwright MCP writes the PNG to its OWN working dir (the session root), NOT the path in `filename` — after capture, locate the actual written file and move it to the destination yourself.
   e. **Guaranteed teardown:** stop the captured python PID even on failure — scope the kill to that PID (PowerShell: filter `Win32_Process` by `CommandLine -like '*http.server*<port>*'`), never blanket-kill by port/name. **Then delete the working dir** (`bg.png` + HTML) once the screenshot is saved — the frame copy may contain bystander faces / on-screen credentials, and the screenshot is the single source of truth.
5. **Preview** — Read the screenshot PNG so the user sees it.
6. **Post-preview tweak loop** — `AskUserQuestion`: **Ship it** / Bigger text / Move (up·down·center) / Toggle scrim / Change text. Apply by editing the CONFIG block + re-running 4b–4e. Loop until "Ship it". (For "Move", nudge within the current treatment via `--box-width`/alignment overrides; if the user wants a different anchor, switch the treatment.)
7. **Save only after "Ship it"** — the screenshot is the single source of truth. Write the SAME composite bytes to TWO locations: **next-to-source** (skip if that dir is read-only/transient, e.g. a temp video-download path) + **`~/.claude/projects/snapshot/`** (create if missing). Offer the Desktop gallery (`~/OneDrive/Desktop/snapshot/`) as an opt-in third copy ONCE per session. On name collision, suffix a timestamp; never overwrite. Never save the original frame in place of the composite.
8. Go to **Phase 4 — Runtime review** (HTML route IS reviewed).

### Route 2 — Canva (guided drag-in)

The Canva MCP has NO local-file upload (`upload-asset-from-url` / `import-design-from-url` require a public HTTPS URL and reject `file://`, `/Users/`, `C:\`). So:
1. Run the **Phase 2 consent gate** first.
2. Create or locate the target Canva design via the Canva MCP; hand the user the design URL (or open it).
3. Instruct the user to **drag the saved local PNG into Canva**. The bytes leave only by the user's own action inside their authenticated Canva session.
4. **Fallback** (only if the image is ALREADY a public asset the user owns): `upload-asset-from-url` with that existing URL.
5. **Temporary-public-host is NOT used in v1** (would publish potential PII to the open internet).
6. **PDF multi-photo:** batch is fine here — drop N assets into one design.
7. Go to **Phase 4 — Runtime review** (Canva route IS reviewed).

### Route 3 — Imaginator (Gemini)

1. Run the **Phase 2 consent gate** first.
2. `AskUserQuestion`: **Quick composite (run it now)** / **Open full Imaginator studio**.
   - **Quick composite** — shell the script directly:
     ```bash
     source ~/.bashrc 2>/dev/null; python ~/.claude/scripts/imaginator.py --prompt '<edit intent>' --image "<snapshot abs path>" --model <free|premium> --aspect "16:9" --output "~/.claude/projects/snapshot/<name>_<timestamp>.png"
     ```
     Surface **free vs premium** first (default **free** unless text/likeness fidelity is the explicit goal — premium edit ≈ $0.05). Use `~/` path format, single-quote the prompt.
     - **Cost-log hygiene (binding):** `imaginator.py` appends every run to `~/.claude/projects/imaginator/generation_log.jsonl`, writing the first 80 chars of the intent (`prompt_preview`) in plaintext. Keep the `--prompt` intent describing the EDIT, never the PERSON — no names/PII. (Quick composite writes one line to Imaginator's cost log; v1 accepted.)
   - **Open full Imaginator studio** — invoke the `/imaginator` Skill, passing the snapshot absolute path as an explicit pre-answer ("Source image: `<abs path>` — use as `--image`"). The user walks Imaginator's own flow.
3. Imaginator's own output stays in Imaginator's archive; snapshot does not double-save it.
4. **PDF multi-photo:** one-at-a-time by default (prompt is per-image). Offer "apply same edit to all" ONLY as an explicit opt-in, with a cost warning (N × premium edit).
5. **SKIP Phase 4** — the Imaginator route runs its own quality flow; do not double-review.

### Done

Graceful exit → ask the original wrap-up: "Need more snapshots, or we good?" (more → mode selection; done → wrap up).

### Phase 4 — Runtime review (auto on HTML + Canva; SKIPPED on Imaginator)

After an HTML or Canva hand-off produces output, in ONE message, personify 3 Triple Threat lenses on the visual deliverable (persona mode — NO Task agents at runtime):
- **Product (Cagan):** does this serve the goal/audience? Score 1–10 + one note.
- **AI-Dev (Jobs):** craft, clarity, hierarchy. Score 1–10 + one note.
- **NSA (ARCHITECT):** technical red flags (resolution, legibility, artifacts) **AND always scan the frame for unintended PII** — bystander faces, visible documents, on-screen credentials. Score 1–10 + one note.

Close with a one-line synthesis. If ANY score < 7, give one concrete fix and offer to re-run the route (HTML) or redo (Canva). Full agent-mode Triple Threat only on explicit request.

### Loop-back

After a route completes (and its review, if any), `AskUserQuestion`: **Another hand-off** (same image) / **More snapshots** (back to mode selection) / **Done** (wrap up).
