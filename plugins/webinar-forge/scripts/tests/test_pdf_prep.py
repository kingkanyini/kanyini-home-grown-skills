import json
from pathlib import Path
import pytest
from scripts.pdf_prep import prepare_pdf, _pdf_hash

FIXTURE_DIR = Path(__file__).parent / "fixtures"

def test_pdf_hash_is_deterministic(tmp_path):
    sample = tmp_path / "sample.pdf"
    sample.write_bytes(b"%PDF-1.4 test content")
    h1 = _pdf_hash(sample)
    h2 = _pdf_hash(sample)
    assert h1 == h2
    assert len(h1) == 64

def test_prepare_pdf_creates_manifest(tmp_path):
    fixture = FIXTURE_DIR / "tiny.pdf"
    if not fixture.exists():
        pytest.skip("fixture tiny.pdf missing")
    out_dir = tmp_path / "out"
    manifest_path = prepare_pdf(fixture, out_dir, workbook_num=1)
    assert manifest_path.exists()
    manifest = json.loads(manifest_path.read_text())
    assert manifest["workbook_num"] == 1
    assert manifest["pdf_hash"] == _pdf_hash(fixture)
    assert manifest["page_count"] >= 1
    assert len(manifest["pages"]) == manifest["page_count"]
    for page in manifest["pages"]:
        assert Path(page["image_path"]).exists()
        assert page["width"] > 0 and page["height"] > 0
