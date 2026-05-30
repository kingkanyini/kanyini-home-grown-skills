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
