"""Ethics + AI-isms scanner per CLAUDE.md Language Rules + Ban List.

Modes:
    piece     whole text is one piece (default): max 1 em dash, max 1 "not X but Y"
    sections  each #/##/### section of a script or outline is a piece, same limits per section
    email     whole text is one piece, 0 em dashes allowed

`em_dash_max` overrides the mode's em-dash budget (use it when a loaded voice
profile sets its own budget). Spoken pauses written as `[beat]` are ignored.

CLI: python scripts/ethics_scanner.py FILE|- [--mode piece|sections|email] [--em-dash-max N]
prints a JSON report.
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from enum import Enum


class ViolationType(Enum):
    LANGUAGE_RULE = "language_rule"
    AI_ISM_PHRASE = "ai_ism_phrase"
    AI_ISM_STRUCTURE = "ai_ism_structure"
    EM_DASH_OVERUSE = "em_dash_overuse"
    BROKEN_CLICHE = "broken_cliche"


@dataclass
class Violation:
    kind: ViolationType
    match: str
    position: int
    suggestion: str
    section: str | None = None


@dataclass
class Summary:
    count: int
    recommendation: str


@dataclass
class ScanResult:
    violations: list = field(default_factory=list)
    summary: Summary = field(default_factory=lambda: Summary(0, "clean"))


MODES = ("piece", "sections", "email")
EM_DASH_DEFAULTS = {"piece": 1, "sections": 1, "email": 0}

LANGUAGE_RULE_KEYWORDS = [
    (r"\bsteal\b", "Use 'study their approach' or 'adapt their structure'"),
    (r"\bcopy\b\s+(?:their|his|her|the)", "Use 'model the framework' or 'learn from their positioning'"),
    (r"\brip off\b", "Use 'draw inspiration from' or 'build on the principles of'"),
    (r"\bspy on\b", "Use 'study the landscape' or 'analyze the market'"),
]

AI_ISM_PHRASES = [
    (r"here'?s the thing\b", "Just say the thing"),
    (r"\bdive deep\b|\bdeep dive\b", "Use 'break down', 'get into', 'look at'"),
    (r"unlock your potential", "Be specific about what they'll gain"),
    (r"let'?s be honest|let me be real", "Just be honest. Don't announce it"),
    (r"\bnavigate\b\s+(your|the)\s+(journey|healing|path)", "Use 'work through', 'move through'"),
    (r"\bleverage\b", "Use 'use', 'build on', 'apply'"),
    (r"\bwe hear(?:d it| you)\b", "Cut it. Show you listened by what you do next"),
]

BROKEN_CLICHE_PATTERN = r"you'?re not broken"
BEAT_PATTERN = re.compile(r"\[beat\]", re.IGNORECASE)
HEADING_PATTERN = re.compile(r"^#{1,3}\s", re.MULTILINE)


def _count_em_dashes(text: str) -> int:
    return text.count("—")


def _detect_not_x_but_y(text: str) -> list:
    pattern = re.compile(r"(it'?s not just about|not\s+\w+,?\s+but)\s+.+?[,.]", re.IGNORECASE)
    return [(m.group(0), m.start()) for m in pattern.finditer(text)]


def _mask_beats(text: str) -> str:
    """Blank out [beat] markers, keeping positions stable."""
    return BEAT_PATTERN.sub(lambda m: " " * len(m.group(0)), text)


def _split_sections(text: str) -> list:
    """Return (heading, start_offset, body) for each #/##/### section.

    Text before the first heading is its own section with heading None.
    """
    starts = [m.start() for m in HEADING_PATTERN.finditer(text)]
    if not starts or starts[0] != 0:
        starts = [0] + starts
    pieces = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else len(text)
        body = text[start:end]
        first_line = body.split("\n", 1)[0].strip()
        heading = first_line if HEADING_PATTERN.match(first_line + " ") else None
        pieces.append((heading, start, body))
    return pieces


def _scan_piece(body: str, offset: int, em_dash_max: int, section: str | None) -> list:
    """Per-piece budget checks: em dashes and 'not X but Y'."""
    found = []
    dashes = _count_em_dashes(body)
    if dashes > em_dash_max:
        found.append(Violation(
            ViolationType.EM_DASH_OVERUSE,
            f"{dashes} em dashes",
            offset + body.find("—"),
            f"Use commas. Max {em_dash_max} em dash{'es' if em_dash_max != 1 else ''} per piece.",
            section,
        ))
    nxb = _detect_not_x_but_y(body)
    for match, pos in nxb[1:]:
        found.append(Violation(
            ViolationType.AI_ISM_STRUCTURE, match, offset + pos,
            "Max one 'not X but Y' per piece. Rewrite as direct statement.",
            section,
        ))
    return found


def scan_text(text: str, mode: str = "piece", em_dash_max: int | None = None) -> ScanResult:
    if mode not in MODES:
        raise ValueError(f"mode must be one of {MODES}, got {mode!r}")
    budget = EM_DASH_DEFAULTS[mode] if em_dash_max is None else em_dash_max
    text = _mask_beats(text)
    result = ScanResult()
    for pattern, suggestion in LANGUAGE_RULE_KEYWORDS:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            result.violations.append(Violation(
                ViolationType.LANGUAGE_RULE, m.group(0), m.start(), suggestion
            ))
    for pattern, suggestion in AI_ISM_PHRASES:
        for m in re.finditer(pattern, text, re.IGNORECASE):
            result.violations.append(Violation(
                ViolationType.AI_ISM_PHRASE, m.group(0), m.start(), suggestion
            ))
    if mode == "sections":
        for heading, start, body in _split_sections(text):
            result.violations.extend(_scan_piece(body, start, budget, heading))
    else:
        result.violations.extend(_scan_piece(text, 0, budget, None))
    for m in re.finditer(BROKEN_CLICHE_PATTERN, text, re.IGNORECASE):
        result.violations.append(Violation(
            ViolationType.BROKEN_CLICHE, m.group(0), m.start(),
            "Use 'there is nothing wrong with you' or 'you may feel broken, but...'",
        ))
    count = len(result.violations)
    if count == 0:
        rec = "clean"
    elif count <= 2:
        rec = "flag-for-review: minor clean-up"
    else:
        rec = f"flag-for-review: {count} violations - full revision pass needed"
    result.summary = Summary(count, rec)
    return result


def _report(result: ScanResult, mode: str) -> dict:
    return {
        "mode": mode,
        "count": result.summary.count,
        "recommendation": result.summary.recommendation,
        "violations": [
            {
                "kind": v.kind.value,
                "match": v.match,
                "position": v.position,
                "suggestion": v.suggestion,
                "section": v.section,
            }
            for v in result.violations
        ],
    }


def main(argv: list | None = None) -> int:
    parser = argparse.ArgumentParser(description="Scan text for Language Rule + AI-ism violations.")
    parser.add_argument("path", help="file to scan, or - for stdin")
    parser.add_argument("--mode", choices=MODES, default="piece")
    parser.add_argument("--em-dash-max", type=int, default=None)
    args = parser.parse_args(argv)
    if args.path == "-":
        text = sys.stdin.buffer.read().decode("utf-8")
    else:
        with open(args.path, encoding="utf-8") as fh:
            text = fh.read()
    result = scan_text(text, mode=args.mode, em_dash_max=args.em_dash_max)
    print(json.dumps(_report(result, args.mode), indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
