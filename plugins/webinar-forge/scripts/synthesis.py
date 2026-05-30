"""Synthesis: merge bootstrap agent outputs into canonical playbook artifacts."""
from __future__ import annotations
import json
from pathlib import Path
from typing import Any


def synthesize_playbook(
    agent_outputs_dir: Path,
    out_dir: Path,
    workbook_nums: list,
    chapter_map: dict,
    master_map: dict,
) -> dict:
    agent_outputs_dir = Path(agent_outputs_dir)
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    interview_bank: dict = {}
    sections_map: dict = {}
    playbook_blocks = ["# Perfect Webinar Playbook", ""]

    for mod in workbook_nums:
        sections = json.loads((agent_outputs_dir / f"sections-{mod}.json").read_text())
        extraction = json.loads((agent_outputs_dir / f"extraction-{mod}.json").read_text())
        interpretation = json.loads((agent_outputs_dir / f"interpretation-{mod}.json").read_text())
        chapter_key = chapter_map[mod]
        master = master_map[mod]

        interview_bank[chapter_key] = {}
        sections_map[chapter_key] = []
        short_key = chapter_key.split("_")[0]

        for sec in sections["sections"]:
            sec_id = sec["id"]
            ex = extraction["sections"].get(sec_id, {})
            it = interpretation["sections"].get(sec_id, {})
            interview_bank[chapter_key][sec_id] = {
                "title": sec.get("title", ""),
                "session": sec.get("session"),
                "breakout": sec.get("breakout"),
                "questions": ex.get("questions", []),
                "concepts": ex.get("concepts", []),
                "exercises": ex.get("exercises", []),
                "teaching_slides": ex.get("teaching_slides", []),
                "example_moments": ex.get("example_moments", []),
                "master_lens": it.get("lens", ""),
                "master_emphasis": it.get("emphasis", []),
                "master_voice_notes": it.get("voice_notes", []),
                "master_score": it.get("score"),
            }
            sections_map[chapter_key].append({
                "id": sec_id,
                "title": sec.get("title", ""),
                "companion_slide_id": f"{short_key}-{sec_id}",
            })

        playbook_blocks.append(f"## {chapter_key.replace('_', ' ').title()}")
        playbook_blocks.append(f"**Master:** {master}")
        playbook_blocks.append("")
        for sec in sections["sections"]:
            playbook_blocks.append(f"### {sec.get('title', sec['id'])}")
            it = interpretation["sections"].get(sec["id"], {})
            if it.get("lens"):
                playbook_blocks.append(f"**Lens:** {it['lens']}")
            if it.get("emphasis"):
                playbook_blocks.append(f"**Emphasis:** {', '.join(it['emphasis'])}")
            playbook_blocks.append("")

    (out_dir / "interview-bank.json").write_text(json.dumps(interview_bank, indent=2))
    (out_dir / "sections-map.json").write_text(json.dumps(sections_map, indent=2))
    (out_dir / "playbook.md").write_text("\n".join(playbook_blocks))
    return {"interview_bank": interview_bank, "sections_map": sections_map}
