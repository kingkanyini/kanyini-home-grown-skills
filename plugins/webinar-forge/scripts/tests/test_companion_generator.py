import json
from pathlib import Path
from scripts.companion_generator import build_companion


def test_build_companion_produces_index_and_data(tmp_path):
    template_dir = tmp_path / "template"
    template_dir.mkdir()
    (template_dir / "index.html").write_text("<html>{{DATA_PATH}}</html>")
    (template_dir / "app.js").write_text("// app")
    (template_dir / "styles.css").write_text("/* styles */")

    bank = {"ch1_dream_customer": {"sec1": {"questions": ["Q?"], "example_moments": []}}}
    sections_map = {"ch1_dream_customer": [
        {"id": "sec1", "title": "Who", "companion_slide_id": "ch1-sec1"}
    ]}
    slide_library = tmp_path / "slides"
    slide_library.mkdir()
    (slide_library / "ch1-sec1-teaching.png").write_bytes(b"x")

    out = tmp_path / "companion"
    build_companion(
        template_dir=template_dir,
        out_dir=out,
        interview_bank=bank,
        sections_map=sections_map,
        slide_library=slide_library,
    )
    assert (out / "index.html").exists()
    assert (out / "data.json").exists()
    assert (out / "slides" / "ch1-sec1-teaching.png").exists()
    data = json.loads((out / "data.json").read_text())
    assert "ch1_dream_customer" in data["sections_map"]
