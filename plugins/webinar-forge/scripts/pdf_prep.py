"""PDF preparation: extract pages as images + manifest for agent consumption."""
from __future__ import annotations
import hashlib
import json
from pathlib import Path
from typing import Any

DPI = 150


def _pdf_hash(pdf_path: Path) -> str:
    """SHA256 of PDF bytes for idempotency checks."""
    h = hashlib.sha256()
    h.update(Path(pdf_path).read_bytes())
    return h.hexdigest()


def prepare_pdf(pdf_path: Path, out_dir: Path, workbook_num: int) -> Path:
    """Extract each page of pdf_path as PNG into out_dir; write manifest.json."""
    pdf_path = Path(pdf_path)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    pages: list[dict[str, Any]] = []
    import fitz
    doc = fitz.open(pdf_path)
    try:
        for i, page in enumerate(doc):
            pix = page.get_pixmap(dpi=DPI)
            img_path = out_dir / f"page-{i+1:03d}.png"
            pix.save(img_path)
            pages.append({
                "page": i + 1,
                "image_path": str(img_path),
                "width": pix.width,
                "height": pix.height,
                "size_bytes": img_path.stat().st_size,
            })
    finally:
        doc.close()

    manifest = {
        "workbook_num": workbook_num,
        "pdf_path": str(pdf_path),
        "pdf_hash": _pdf_hash(pdf_path),
        "page_count": len(pages),
        "dpi": DPI,
        "pages": pages,
    }
    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2))
    return manifest_path
