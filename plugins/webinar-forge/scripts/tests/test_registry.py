from pathlib import Path
from scripts.registry import (
    load_registry, save_registry, upsert_project,
    update_section_status, find_next_incomplete,
)


def test_load_returns_empty_when_file_missing(tmp_path):
    reg_path = tmp_path / "registry.json"
    reg = load_registry(reg_path)
    assert reg == {"projects": {}}


def test_save_then_load_roundtrip(tmp_path):
    reg_path = tmp_path / "registry.json"
    original = {"projects": {"p1": {"name": "Test"}}}
    save_registry(reg_path, original)
    assert load_registry(reg_path) == original


def test_upsert_project_creates_new(tmp_path):
    reg_path = tmp_path / "registry.json"
    upsert_project(reg_path, "zaira-breath", {
        "name": "Zai'Ra Breath", "client": "Zai'Ra",
        "created": "2026-04-22", "last_updated": "2026-04-22",
        "counsel": "Perfect Webinar Counsel",
    })
    reg = load_registry(reg_path)
    assert "zaira-breath" in reg["projects"]
    assert reg["projects"]["zaira-breath"]["name"] == "Zai'Ra Breath"


def test_update_section_status(tmp_path):
    reg_path = tmp_path / "registry.json"
    upsert_project(reg_path, "p1", {
        "name": "P1", "phases": {
            "chapters": {
                "ch1_dream_customer": {
                    "sections": {
                        "sec1_who": {"status": "pending", "answers": {}}
                    }
                }
            }
        }
    })
    update_section_status(reg_path, "p1", "ch1_dream_customer", "sec1_who",
                          status="complete", answers={"q1": "a1"})
    reg = load_registry(reg_path)
    sec = reg["projects"]["p1"]["phases"]["chapters"]["ch1_dream_customer"]["sections"]["sec1_who"]
    assert sec["status"] == "complete"
    assert sec["answers"] == {"q1": "a1"}


def test_find_next_incomplete_walks_phases_in_order(tmp_path):
    reg_path = tmp_path / "registry.json"
    upsert_project(reg_path, "p1", {
        "name": "P1", "phases": {
            "setup": {"status": "complete"},
            "chapters": {
                "ch1_dream_customer": {"status": "complete", "sections": {}},
                "ch2_hook_origin": {
                    "status": "in_progress",
                    "sections": {
                        "sec1": {"status": "complete", "answers": {}},
                        "sec2": {"status": "pending", "answers": {}},
                    }
                },
                "ch3_content": {"status": "pending", "sections": {}},
            },
            "outline": {"status": "pending"},
        }
    })
    result = find_next_incomplete(reg_path, "p1")
    assert result == ("chapter_section", "ch2_hook_origin", "sec2")
