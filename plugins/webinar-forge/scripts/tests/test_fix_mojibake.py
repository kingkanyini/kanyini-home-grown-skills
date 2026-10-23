import json
from scripts.fix_mojibake import count_markers, fix_string, process_file

EM_DASH_MOJIBAKE = "â€”"
ARROW_MOJIBAKE = "â†’"
ELLIPSIS_MOJIBAKE = "â€¦"


def test_fix_string_repairs_known_sequences():
    s = f"offer {EM_DASH_MOJIBAKE} one {ARROW_MOJIBAKE} two{ELLIPSIS_MOJIBAKE}"
    fixed, n, errors = fix_string(s)
    assert fixed == "offer — one → two…"
    assert n == 3 and errors == []
    assert count_markers(fixed) == 0


def test_fix_string_leaves_real_text_alone():
    s = "café — naïve Â la carte"
    assert fix_string(s) == (s, 0, [])


def test_process_file_preserves_crlf_and_is_idempotent(tmp_path):
    data = {"ch1": {"sec1": {"questions": [f"Godfather Offer {EM_DASH_MOJIBAKE} irresistible"]}}}
    path = tmp_path / "bank.json"
    path.write_bytes(json.dumps(data, indent=2).replace("\n", "\r\n").encode("utf-8"))

    first = process_file(path, write=True)
    assert first["markers_before"] == 1 and first["markers_after"] == 0
    assert first["written"] is True
    raw = path.read_bytes()
    assert b"\r\n" in raw and rb"\u2014" in raw and rb"\u00e2" not in raw

    second = process_file(path, write=True)
    assert second["changed"] is False and second["written"] is False
    assert path.read_bytes() == raw


def test_process_file_refuses_to_reformat(tmp_path):
    path = tmp_path / "compact.json"
    path.write_text(json.dumps({"q": f"a {EM_DASH_MOJIBAKE} b"}), encoding="utf-8")
    before = path.read_bytes()
    report = process_file(path, write=True)
    assert report["written"] is False and "skipped" in report
    assert path.read_bytes() == before
