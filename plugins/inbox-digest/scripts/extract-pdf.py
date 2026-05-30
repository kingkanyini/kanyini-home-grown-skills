#!/usr/bin/env python3
"""Extract text + metadata from a PDF into a markdown file.

Usage:
  python extract-pdf.py <input.pdf> --out <output.md> [--write-failure]
"""

import argparse
import sys
import traceback
from pathlib import Path


def extract(pdf_path: Path, out_path: Path) -> None:
    import pdfplumber

    with pdfplumber.open(str(pdf_path)) as pdf:
        meta = pdf.metadata or {}
        page_count = len(pdf.pages)
        lines = ["# Extracted text", ""]
        for idx, page in enumerate(pdf.pages, start=1):
            lines.append(f"## Page {idx}")
            lines.append("")
            text = page.extract_text() or ""
            lines.append(text.strip())
            lines.append("")
        lines.append("## Metadata")
        lines.append("")
        lines.append(f"- Source: {pdf_path.name}")
        lines.append(f"- Page count: {page_count}")
        for k, v in meta.items():
            lines.append(f"- {k}: {v}")

    out_path.write_text("\n".join(lines), encoding="utf-8")


def write_failure(out_path: Path, reason: str) -> None:
    out_path.write_text(
        f"# Extracted text\n\n**EXTRACTION FAILED:** {reason}\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument(
        "--write-failure",
        action="store_true",
        help="Write a stub markdown file on failure instead of erroring out",
    )
    args = parser.parse_args()

    if not args.input.exists():
        msg = f"input file not found: {args.input}"
        if args.write_failure:
            write_failure(args.out, msg)
        print(f"EXTRACTION FAILED: {msg}", file=sys.stderr)
        return 1

    try:
        extract(args.input, args.out)
        return 0
    except Exception as exc:
        msg = f"{type(exc).__name__}: {exc}"
        if args.write_failure:
            write_failure(args.out, msg)
        else:
            traceback.print_exc(file=sys.stderr)
        print(f"EXTRACTION FAILED: {msg}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
