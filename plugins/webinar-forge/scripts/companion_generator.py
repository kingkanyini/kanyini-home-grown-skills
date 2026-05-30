"""Generate static HTML companion site from playbook + slide-library."""
from __future__ import annotations
import json
import shutil
from pathlib import Path


def build_companion(
    template_dir: Path,
    out_dir: Path,
    interview_bank: dict,
    sections_map: dict,
    slide_library: Path,
) -> Path:
    template_dir = Path(template_dir)
    out_dir = Path(out_dir)
    slide_library = Path(slide_library)
    out_dir.mkdir(parents=True, exist_ok=True)

    for f in ("index.html", "app.js", "styles.css"):
        src = template_dir / f
        if not src.exists():
            continue
        content = src.read_text()
        if f == "index.html":
            content = content.replace("{{DATA_PATH}}", "./data.json")
        (out_dir / f).write_text(content)

    slides_out = out_dir / "slides"
    slides_out.mkdir(exist_ok=True)
    if slide_library.exists():
        for item in slide_library.rglob("*"):
            if item.is_file():
                rel = item.relative_to(slide_library)
                dest = slides_out / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(item, dest)

    data = {
        "interview_bank": interview_bank,
        "sections_map": sections_map,
        "slides_root": "./slides",
    }
    (out_dir / "data.json").write_text(json.dumps(data, indent=2))
    return out_dir
