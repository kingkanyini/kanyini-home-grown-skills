#!/usr/bin/env bash
# CI walkthrough of /webinar-tutorial (webinar-dev-bot).
# Runs every command the tutorial tells Claude to run, in a throwaway HOME, against
# the plugin as published, and asserts the outcome the tutorial promises.
# Works on Linux and macOS. Usage: scripts/ci/webinar-tutorial-ci.sh [plugin-dir]
# Optional: CI_PYTHON=<interpreter> picks the Python to test (default python3).
# Optional: WEBINAR_CI_GEMINI_KEY=<real key> also checks that both image models
# exist on Google (a free model listing, no image is made).
set -u
SRC="${1:-$(cd "$(dirname "$0")/../.." && pwd)/plugins/webinar-dev-bot}"
MARKET="$(cd "$SRC/../.." && pwd)/.claude-plugin/marketplace.json"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); printf '  PASS  %s\n' "$1"; }
bad()  { FAIL=$((FAIL+1)); printf '  FAIL  %s\n        %s\n' "$1" "${2:-}"; }
note() { printf '  NOTE  %s\n' "$1"; }
clean_out() { ! grep -qiE "Traceback|FutureWarning|end of life|NotOpenSSL" "$1"; }
perm() { stat -c %a "$1" 2>/dev/null || stat -f %Lp "$1"; }
pty() {  # run a command under a pseudo-terminal (getpass needs one); stdin feeds it
  if [ "$(uname)" = Darwin ]; then script -q /dev/null "$@"; else script -qec "$(printf '%q ' "$@")" /dev/null; fi
}

GEMINI_CI_KEY="${WEBINAR_CI_GEMINI_KEY:-}"
unset GEMINI_API_KEY WEBINAR_CI_GEMINI_KEY WEBINAR_KIT_DAILY_CAP
export HOME="$(mktemp -d)"; trap 'rm -rf "$HOME"' EXIT
ROOT="$HOME/.claude/plugins/cache/kanyini-home-grown-skills/webinar-dev-bot/x"   # = ${CLAUDE_PLUGIN_ROOT}
mkdir -p "$ROOT" && cp -R "$SRC"/. "$ROOT"/
L="$HOME/log"; mkdir -p "$L"
TUT="$ROOT/commands/webinar-tutorial.md"

echo "== Command files"
if grep -nE '\$[0-9]' "$ROOT"/commands/*.md >"$L/dollar"; then bad "no \$+digit in command files (Claude Code reads \$0 as an argument)" "$(head -3 "$L/dollar")"; else ok "no \$+digit in command files"; fi
for s in offer-optimizer propaganda-machine; do
  grep -q "/plugin install $s@kanyini-home-grown-skills" "$TUT" && ok "tutorial shows install line for $s" || bad "install line for $s"
  grep -q "\"$s\"" "$MARKET" && ok "/$s is in the marketplace" || bad "/$s missing from marketplace"
done

echo "== Setup: clean Python ($(uname))"
PY="${CI_PYTHON:-python3}"   # CI_PYTHON: test a specific interpreter (e.g. 3.9, the Mac's built-in)
if "$PY" -m venv "$HOME/py" >/dev/null 2>&1 && [ -x "$HOME/py/bin/pip" ]; then :; else
  rm -rf "$HOME/py"; "$PY" -m venv --without-pip "$HOME/py" && curl -fsSL https://bootstrap.pypa.io/get-pip.py | "$HOME/py/bin/python3" - -q >/dev/null 2>&1
fi
[ -x "$HOME/py/bin/python3" ] && ok "fresh python3 + pip ($("$HOME/py/bin/python3" --version))" || { bad "fresh python3 + pip"; exit 1; }
export PATH="$HOME/py/bin:$PATH"

echo "== Step 1.1 / 1.2: Python and packages"
[ "$(python3 -c 'import sys;print(sys.version_info>=(3,9))')" = True ] && ok "python3 >= 3.9" || bad "python3 >= 3.9"
python3 -m pip install -q -r "$ROOT/scripts/requirements.txt" >"$L/pip" 2>&1 && ok "pip install -r requirements.txt" || bad "pip install" "$(tail -2 "$L/pip")"

echo "== Rule 10: no-node hand checks"
python3 -W ignore -c "import pptx, PIL, google.genai" >"$L/imp" 2>&1 && clean_out "$L/imp" && ok "package import is clean" || bad "package import" "$(tail -2 "$L/imp")"
python3 "$ROOT/scripts/setup_key.py" --check >"$L/chk0" 2>&1; rc=$?
[ $rc -eq 1 ] && clean_out "$L/chk0" && ok "setup_key --check, no key: plain message" || bad "setup_key --check (no key)" "rc=$rc $(cat "$L/chk0")"

echo "== Step 1.3: Gemini key in the user's own Terminal"
echo "AIzaSyFAKEfakeFAKEfake" | python3 "$ROOT/scripts/setup_key.py" >"$L/nontty" 2>&1; rc=$?
[ $rc -eq 1 ] && grep -q "own Terminal" "$L/nontty" && ok "refuses non-terminal input (a key can't arrive through chat)" || bad "non-TTY refusal" "rc=$rc $(cat "$L/nontty")"
( sleep 2; printf '\004'; sleep 1 ) | pty python3 "$ROOT/scripts/setup_key.py" >"$L/eof" 2>&1
clean_out "$L/eof" && grep -q "Cancelled" "$L/eof" && ok "Ctrl+D at the prompt cancels cleanly" || bad "Ctrl+D at the prompt" "$(tr -d '\r' <"$L/eof" | tail -2)"
FAKE="AIzaSyD0nt-Use-This-Fake-Key-Only1234WXYZ"
( sleep 2; printf '%s\n' "$FAKE"; sleep 2 ) | pty python3 "$ROOT/scripts/setup_key.py" >"$L/setkey" 2>&1
grep -q "Saved" "$L/setkey" && ok "paste key -> Saved" || bad "save key" "$(tr -d '\r' <"$L/setkey" | tail -3)"
grep -q "$FAKE" "$L/setkey" && bad "key echoed to screen" || ok "key not echoed"
[ "$(perm "$HOME/.webinar-kit/gemini.env")" = 600 ] && ok "key file mode 600" || bad "key file mode" "$(perm "$HOME/.webinar-kit/gemini.env")"
[ "$(perm "$HOME/.webinar-kit")" = 700 ] && ok "kit folder mode 700" || bad "kit folder mode"
python3 "$ROOT/scripts/setup_key.py" --check >"$L/chk1" 2>&1; rc=$?
[ $rc -eq 0 ] && grep -q "WXYZ" "$L/chk1" && ! grep -q "$FAKE" "$L/chk1" && ok "--check shows last 4 only" || bad "--check after save" "rc=$rc $(cat "$L/chk1")"

echo "== Step 1.4 / 1.7: prices, cap, art test"
python3 "$ROOT/scripts/gen_image.py" --quote 1 >"$L/q1" 2>&1 && grep -qE '\$0\.03' "$L/q1" && ok "--quote 1 ~ 3 cents ($(head -1 "$L/q1"))" || bad "--quote 1" "$(cat "$L/q1")"
python3 "$ROOT/scripts/gen_image.py" --quote 25 >"$L/q25" 2>&1 && grep -qE '\$0\.[5-9]' "$L/q25" && ok "25 images under a dollar ($(head -1 "$L/q25"))" || bad "--quote 25" "$(cat "$L/q25")"
python3 "$ROOT/scripts/gen_image.py" --prompt "A sunrise over calm mountains, no text" --aspect 1:1 --output "$HOME/.webinar-kit/test.png" >"$L/art" 2>&1; rc=$?
[ $rc -eq 1 ] && clean_out "$L/art" && grep -q "rejected the key" "$L/art" && ok "fake key: plain 'Google rejected the key', no warnings" || bad "art test, fake key" "rc=$rc $(tail -3 "$L/art")"
python3 "$ROOT/scripts/gen_image.py" --costs >"$L/costs" 2>&1 && grep -q "Today: 0 of 60" "$L/costs" && ok "failed attempt not counted toward the daily cap" || bad "cap counts failures" "$(cat "$L/costs")"
WEBINAR_KIT_DAILY_CAP=0 python3 "$ROOT/scripts/gen_image.py" --prompt t --aspect 1:1 --output "$HOME/x.png" >"$L/cap" 2>&1; rc=$?
[ $rc -eq 3 ] && grep -q "Nothing was generated" "$L/cap" && ok "daily cap stops before any call (exit 3)" || bad "daily cap" "rc=$rc $(cat "$L/cap")"
if [ -n "$GEMINI_CI_KEY" ]; then
  GEMINI_CI_KEY="$GEMINI_CI_KEY" python3 - "$ROOT/scripts/gen_image.py" >"$L/models" 2>&1 <<'PY' && ok "both image models exist on Google ($(cat "$L/models"))" || bad "image model IDs" "$(cat "$L/models")"
import ast, json, os, sys, urllib.request
src = open(sys.argv[1], encoding="utf-8").read()
models = next(ast.literal_eval(n.value) for n in ast.walk(ast.parse(src))
              if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", "") == "MODELS")
req = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
                             headers={"x-goog-api-key": os.environ["GEMINI_CI_KEY"]})
live = {m["name"].split("/", 1)[1] for m in json.load(urllib.request.urlopen(req))["models"]}
missing = [m for m in models.values() if m not in live]
assert not missing, f"not offered by Google: {missing}"
print(", ".join(models.values()))
PY
else note "set WEBINAR_CI_GEMINI_KEY to also check the image model IDs against Google"; fi

echo "== Quest 2: practice deck"
P="$HOME/.claude/projects/webinar-dev-bot/practice"; mkdir -p "$P"
cp "$ROOT/scripts/sample-slides.json" "$P/" && cp -R "$ROOT/scripts/sample-images" "$P/" && ok "copy sample files" || bad "copy sample files"
( cd "$P" && python3 "$ROOT/scripts/build_pptx.py" sample-slides.json --strict ) >"$L/b1" 2>&1; rc=$?
nw=$(grep -c "^WARNING" "$L/b1")
[ $rc -eq 2 ] && [ "$nw" -eq 1 ] && grep -q "Built 7 slides" "$L/b1" && ok "7 slides, 1 warning, exit 2" || bad "practice build" "rc=$rc warnings=$nw $(tail -2 "$L/b1")"
python3 - "$P/deck.pptx" >"$L/v1" 2>&1 <<'PY' && ok "deck.pptx in the practice folder: $(cat "$L/v1")" || bad "deck validation" "$(cat "$L/v1")"
import sys; from pptx import Presentation
p = Presentation(sys.argv[1]); n = len(p.slides)
assert n == 7, n; assert (p.slide_width, p.slide_height) == (12192000, 6858000)
print(f"{n} slides, true 16:9")
PY
OUT=$(grep -oE 'sample-images/this-one-is-missing-on-purpose\.[a-z]+' "$TUT" | head -1)
grep -q "\"$OUT\"" "$P/sample-slides.json" && ok "Step 2.3 output name matches the manifest ($OUT)" || bad "Step 2.3 name vs manifest" "$OUT"
python3 -c "from PIL import Image; Image.new('RGB',(900,1200),(120,90,60)).save('$P/$OUT', 'PNG')"
( cd "$P" && python3 "$ROOT/scripts/build_pptx.py" sample-slides.json --strict ) >"$L/b2" 2>&1; rc=$?
[ $rc -eq 0 ] && ! grep -q "^WARNING" "$L/b2" && ok "rebuild with art: 0 warnings, exit 0" || bad "rebuild with art" "rc=$rc $(tail -2 "$L/b2")"

echo; echo "RESULT: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
