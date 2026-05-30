import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = Path(__file__).parent / "extract-pdf.py"


def test_extract_pdf_emits_text_and_metadata(tmp_path):
    fixture_pdf = Path(__file__).parent / "fixtures" / "sample.pdf"
    assert fixture_pdf.exists(), (
        f"Required fixture missing: {fixture_pdf}. "
        "Regenerate via: python -c \"from reportlab.pdfgen import canvas; "
        "c = canvas.Canvas(r'<path>'); c.drawString(72, 720, 'Hello from sample PDF — Page 1'); c.save()\""
    )
    out_path = tmp_path / "sample.extracted.md"

    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(fixture_pdf), "--out", str(out_path)],
        capture_output=True, text=True, timeout=60,
    )

    assert result.returncode == 0, f"stderr: {result.stderr}"
    assert out_path.exists()
    content = out_path.read_text(encoding="utf-8")
    assert "# Extracted text" in content
    assert "Page 1" in content
    assert "## Metadata" in content


def test_extract_pdf_handles_missing_input(tmp_path):
    out_path = tmp_path / "out.md"
    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path / "nope.pdf"), "--out", str(out_path)],
        capture_output=True, text=True, timeout=10,
    )
    assert result.returncode == 1, f"expected exit 1 (missing input), got {result.returncode}; stderr: {result.stderr}"
    assert "EXTRACTION FAILED" in result.stderr


def test_extract_pdf_writes_failure_md_on_corrupt_pdf(tmp_path):
    bad_pdf = tmp_path / "corrupt.pdf"
    bad_pdf.write_bytes(b"not a real pdf")
    out_path = tmp_path / "corrupt.extracted.md"

    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(bad_pdf), "--out", str(out_path), "--write-failure"],
        capture_output=True, text=True, timeout=10,
    )
    assert out_path.exists()
    content = out_path.read_text(encoding="utf-8")
    assert "EXTRACTION FAILED" in content
    assert result.returncode == 2, f"expected exit 2 (extraction exception), got {result.returncode}; stderr: {result.stderr}"


def test_extract_pdf_writes_failure_md_on_missing_input(tmp_path):
    out_path = tmp_path / "missing.extracted.md"
    result = subprocess.run(
        [sys.executable, str(SCRIPT), str(tmp_path / "nope.pdf"), "--out", str(out_path), "--write-failure"],
        capture_output=True, text=True, timeout=10,
    )
    assert result.returncode == 1
    assert out_path.exists()
    content = out_path.read_text(encoding="utf-8")
    assert "EXTRACTION FAILED" in content
    assert "input file not found" in content
