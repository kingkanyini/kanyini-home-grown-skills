import json
from pathlib import Path
from scripts.synthesis import synthesize_playbook


def _write(p: Path, data):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data))


def test_synthesize_merges_workbooks_into_bank(tmp_path):
    agent_outputs = tmp_path / "agent_outputs"
    for mod in (1, 2):
        _write(agent_outputs / f"sections-{mod}.json", {
            "workbook_num": mod,
            "sections": [
                {"id": "sec1", "title": f"Section 1 of Mod {mod}",
                 "session": "1", "breakout": None, "start_page": 1, "end_page": 5}
            ]
        })
        _write(agent_outputs / f"extraction-{mod}.json", {
            "workbook_num": mod,
            "sections": {"sec1": {
                "questions": [f"Q1 for mod {mod}"],
                "concepts": [], "exercises": [], "teaching_slides": [],
                "example_moments": []
            }}
        })
        _write(agent_outputs / f"interpretation-{mod}.json", {
            "workbook_num": mod,
            "master": "TestMaster",
            "sections": {"sec1": {
                "lens": "test lens", "emphasis": ["be direct"],
                "common_traps": [], "voice_notes": ["speak plainly"],
                "score": 8
            }}
        })
    out_dir = tmp_path / "playbook"
    chapter_map = {1: "ch1_dream_customer", 2: "ch2_hook_origin"}
    master_map = {1: "Marisa Murgatroyd", 2: "Russell Brunson"}
    synthesize_playbook(
        agent_outputs, out_dir,
        workbook_nums=[1, 2],
        chapter_map=chapter_map,
        master_map=master_map,
    )
    assert (out_dir / "interview-bank.json").exists()
    assert (out_dir / "sections-map.json").exists()
    assert (out_dir / "playbook.md").exists()
    bank = json.loads((out_dir / "interview-bank.json").read_text())
    assert "ch1_dream_customer" in bank
    assert "ch2_hook_origin" in bank
    assert bank["ch1_dream_customer"]["sec1"]["questions"] == ["Q1 for mod 1"]
