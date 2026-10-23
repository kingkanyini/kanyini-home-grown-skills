from scripts.ethics_scanner import scan_text, ViolationType


def test_detects_language_rule_violations():
    result = scan_text("Let's steal their funnel and copy their approach.")
    kinds = [v.kind for v in result.violations]
    assert ViolationType.LANGUAGE_RULE in kinds
    assert len(result.violations) >= 2


def test_detects_ai_isms():
    text = "Here's the thing, let's dive deep and unlock your potential."
    result = scan_text(text)
    kinds = [v.kind for v in result.violations]
    assert ViolationType.AI_ISM_PHRASE in kinds
    assert any("dive deep" in v.match.lower() for v in result.violations)
    assert any("unlock your potential" in v.match.lower() for v in result.violations)


def test_detects_em_dash_overuse():
    text = "This — is — a — test — of — em — dashes."
    result = scan_text(text)
    assert any(v.kind == ViolationType.EM_DASH_OVERUSE for v in result.violations)


def test_detects_youre_not_broken():
    text = "You're not broken, you just need healing."
    result = scan_text(text)
    assert any("broken" in v.match.lower() for v in result.violations)


def test_clean_text_returns_no_violations():
    text = "Study the approach and adapt the structure to your context."
    result = scan_text(text)
    assert result.violations == []


def test_summary_reports_count():
    text = "Steal their idea and dive deep. This — is — too — dashy — here."
    result = scan_text(text)
    assert result.summary.count > 0
    assert "clean" in result.summary.recommendation.lower() or \
           "flag" in result.summary.recommendation.lower()


SECTIONED = (
    "# Opening\n"
    "One pause here — and that is the budget.\n"
    "## Origin\n"
    "Another single dash — in its own section.\n"
)


def test_sections_mode_allows_one_em_dash_per_section():
    result = scan_text(SECTIONED, mode="sections")
    assert not any(v.kind == ViolationType.EM_DASH_OVERUSE for v in result.violations)
    # The same text as one piece has two dashes and is flagged.
    assert any(v.kind == ViolationType.EM_DASH_OVERUSE for v in scan_text(SECTIONED).violations)


def test_sections_mode_flags_second_em_dash_in_a_section():
    text = SECTIONED + "### Content\nFirst — then second — too many.\n"
    result = scan_text(text, mode="sections")
    flagged = [v for v in result.violations if v.kind == ViolationType.EM_DASH_OVERUSE]
    assert len(flagged) == 1
    assert flagged[0].section == "### Content"


def test_email_mode_allows_zero_em_dashes():
    result = scan_text("Quick note — see you Friday.", mode="email")
    assert any(v.kind == ViolationType.EM_DASH_OVERUSE for v in result.violations)


def test_em_dash_max_override():
    text = "One — two — three."
    assert any(v.kind == ViolationType.EM_DASH_OVERUSE for v in scan_text(text).violations)
    assert scan_text(text, em_dash_max=2).violations == []


def test_not_x_but_y_counted_per_section():
    text = (
        "# One\nIt is not luck, but practice.\n"
        "# Two\nIt is not talent, but reps.\n"
    )
    assert scan_text(text, mode="sections").violations == []
    piece = scan_text(text)
    assert any(v.kind == ViolationType.AI_ISM_STRUCTURE for v in piece.violations)


def test_detects_we_hear_you():
    result = scan_text("We hear you. And we heard it loud and clear.")
    matches = [v.match.lower() for v in result.violations if v.kind == ViolationType.AI_ISM_PHRASE]
    assert "we hear you" in matches
    assert "we heard it" in matches


def test_beat_markers_are_ignored():
    text = "Sit with that. [beat] [beat] Now breathe. [BEAT]"
    assert scan_text(text, mode="email").violations == []


def test_unknown_mode_rejected():
    import pytest
    with pytest.raises(ValueError):
        scan_text("text", mode="tweet")
