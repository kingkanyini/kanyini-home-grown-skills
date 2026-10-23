r"""Repair mojibake (UTF-8 bytes decoded as cp1252) inside JSON strings.

Example: the three characters U+00E2 U+20AC U+201D (shown as a-circumflex,
euro sign, right quote) are repaired back to one em dash (U+2014).

Usage (from the skill root):
    python scripts/fix_mojibake.py --check [FILE ...]
    python scripts/fix_mojibake.py --write [FILE ...]

Default files: playbook/interview-bank.json and companion/data.json.
Output keeps the existing format: json.dumps(indent=2) with ASCII escapes,
original line endings preserved. A file whose current text is not in that
format is reported and left alone, so --write never reformats a file.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

SKILL_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_FILES = [
    SKILL_ROOT / "playbook" / "interview-bank.json",
    SKILL_ROOT / "companion" / "data.json",
]


def _cp1252_continuation_chars() -> str:
    """Characters that cp1252 maps to the UTF-8 continuation bytes 0x80-0xBF."""
    chars = []
    for b in range(0x80, 0xC0):
        try:
            chars.append(bytes([b]).decode("cp1252"))
        except UnicodeDecodeError:
            continue
    return "".join(chars)


# A UTF-8 lead byte (0xC2-0xF4) read as Latin-1/cp1252, then 1-3 continuation bytes.
MOJIBAKE_RE = re.compile(
    "[" + chr(0xC2) + "-" + chr(0xF4) + "][" + re.escape(_cp1252_continuation_chars()) + "]{1,3}"
)


def _repair(seq: str) -> str | None:
    try:
        return seq.encode("cp1252").decode("utf-8")
    except UnicodeError:
        return None


def count_markers(s: str) -> int:
    """Count mojibake sequences that would decode to valid UTF-8."""
    return sum(1 for m in MOJIBAKE_RE.finditer(s) if _repair(m.group(0)) is not None)


def fix_string(s: str) -> tuple[str, int, list]:
    """Return (fixed_string, sequences_fixed, sequences_left_alone)."""
    fixed = 0
    errors: list = []

    def sub(m: re.Match) -> str:
        nonlocal fixed
        repaired = _repair(m.group(0))
        if repaired is None:
            errors.append(m.group(0))
            return m.group(0)
        fixed += 1
        return repaired

    return MOJIBAKE_RE.sub(sub, s), fixed, errors


def _walk(obj, stats: dict):
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            stats["keys"] += 1
            out[_fix(k, stats)] = _walk(v, stats)
        return out
    if isinstance(obj, list):
        return [_walk(v, stats) for v in obj]
    if isinstance(obj, str):
        stats["strings"] += 1
        return _fix(obj, stats)
    return obj


def _fix(s: str, stats: dict) -> str:
    stats["markers_before"] += count_markers(s)
    new, n, errors = fix_string(s)
    stats["fixed"] += n
    stats["errors"].extend(errors)
    return new


def _dump(data, newline: str, trailing_newline: bool) -> str:
    text = json.dumps(data, indent=2)
    if trailing_newline:
        text += "\n"
    return text.replace("\n", newline) if newline != "\n" else text


def process_file(path: Path, write: bool) -> dict:
    path = Path(path)
    original = path.read_bytes().decode("utf-8")
    newline = "\r\n" if "\r\n" in original else "\n"
    trailing = original.endswith(("\n", "\r\n"))
    data = json.loads(original)

    stats = {"file": str(path), "keys": 0, "strings": 0, "markers_before": 0,
             "fixed": 0, "errors": [], "markers_after": 0, "written": False,
             "format_ok": _dump(data, newline, trailing) == original}
    repaired = _walk(data, stats)

    after = {"keys": 0, "strings": 0, "markers_before": 0, "fixed": 0, "errors": []}
    _walk(repaired, after)
    stats["markers_after"] = after["markers_before"]
    if (after["keys"], after["strings"]) != (stats["keys"], stats["strings"]):
        raise RuntimeError(f"{path}: key/string counts changed during repair")

    new_text = _dump(repaired, newline, trailing)
    stats["changed"] = new_text != original
    if write and stats["changed"]:
        if not stats["format_ok"]:
            stats["skipped"] = "existing file is not json.dumps(indent=2) output; not rewriting"
        else:
            path.write_bytes(new_text.encode("utf-8"))
            stats["written"] = True
    return stats


def main(argv: list | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check", action="store_true", help="report only")
    group.add_argument("--write", action="store_true", help="repair files in place")
    parser.add_argument("files", nargs="*", type=Path)
    args = parser.parse_args(argv)

    reports = [process_file(f, write=args.write) for f in (args.files or DEFAULT_FILES)]
    print(json.dumps(reports, indent=2))
    remaining = sum(r["markers_after"] if r["written"] else r["markers_before"] for r in reports)
    return 1 if args.check and remaining else 0


if __name__ == "__main__":
    sys.exit(main())
