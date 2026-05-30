"""Registry read/write + resume-logic helpers for per-project state."""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any


def load_registry(path: Path) -> dict[str, Any]:
    path = Path(path)
    if not path.exists():
        return {"projects": {}}
    return json.loads(path.read_text())


def save_registry(path: Path, registry: dict[str, Any]) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(registry, indent=2))
    tmp.replace(path)


def upsert_project(path: Path, code: str, data: dict[str, Any]) -> None:
    reg = load_registry(path)
    existing = reg["projects"].get(code, {})
    existing.update(data)
    reg["projects"][code] = existing
    save_registry(path, reg)


def update_section_status(
    path: Path, code: str, chapter_key: str, section_key: str,
    status: str, answers: dict[str, Any] | None = None,
) -> None:
    reg = load_registry(path)
    proj = reg["projects"][code]
    sec = proj["phases"]["chapters"][chapter_key]["sections"][section_key]
    sec["status"] = status
    if answers is not None:
        sec.setdefault("answers", {}).update(answers)
    save_registry(path, reg)


def find_next_incomplete(path: Path, code: str) -> tuple[str, ...] | None:
    reg = load_registry(path)
    proj = reg["projects"].get(code)
    if not proj:
        return None
    phases = proj["phases"]
    phase_order = ["setup", "chapters", "outline", "script_full", "variants", "handoff"]
    for p_key in phase_order:
        phase = phases.get(p_key)
        if not phase:
            continue
        if p_key == "chapters":
            for ch_key in sorted(phase.keys()):
                chapter = phase[ch_key]
                if chapter.get("status") == "complete":
                    continue
                for sec_key in sorted(chapter.get("sections", {}).keys()):
                    sec = chapter["sections"][sec_key]
                    if sec.get("status") != "complete":
                        return ("chapter_section", ch_key, sec_key)
                if chapter.get("chapter_review", {}).get("status") != "complete":
                    return ("chapter_review", ch_key)
        elif p_key == "variants":
            for v_key in ["medium_60", "short_30", "vsl_12"]:
                v = phase.get(v_key, {})
                if v.get("status") != "complete":
                    return ("variant", v_key)
        else:
            if phase.get("status") != "complete":
                return ("phase", p_key)
    return None
