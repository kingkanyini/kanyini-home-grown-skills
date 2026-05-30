"""Ethics + AI-isms scanner per CLAUDE.md Language Rules + Ban List."""
from __future__ import annotations
import re
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


@dataclass
class Summary:
    count: int
    recommendation: str


@dataclass
class ScanResult:
    violations: list = field(default_factory=list)
    summary: Summary = field(default_factory=lambda: Summary(0, "clean"))


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
]

BROKEN_CLICHE_PATTERN = r"you'?re not broken"


def _count_em_dashes(text: str) -> int:
    return text.count("—")


def _detect_not_x_but_y(text: str) -> list:
    pattern = re.compile(r"(it'?s not just about|not\s+\w+,?\s+but)\s+.+?[,.]", re.IGNORECASE)
    return [(m.group(0), m.start()) for m in pattern.finditer(text)]


def scan_text(text: str) -> ScanResult:
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
    if _count_em_dashes(text) > 1:
        first = text.find("—")
        result.violations.append(Violation(
            ViolationType.EM_DASH_OVERUSE,
            f"{_count_em_dashes(text)} em dashes",
            first,
            "Use commas. Max one em dash per piece.",
        ))
    nxb = _detect_not_x_but_y(text)
    if len(nxb) > 1:
        for match, pos in nxb[1:]:
            result.violations.append(Violation(
                ViolationType.AI_ISM_STRUCTURE, match, pos,
                "Max one 'not X but Y' per piece. Rewrite as direct statement.",
            ))
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
