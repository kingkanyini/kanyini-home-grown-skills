"""
Webinar Dev Bot — Gemini slide-art generator (image only).

Makes one textless image per slide slot at the slot's real aspect ratio.
Adapted from the Imaginator portable edition, trimmed to images only.

Usage:
    python3 gen_image.py --prompt "..." --aspect 3:4 --output images/slide-01.png
    python3 gen_image.py --prompt "..." --aspect 16:9 --image ref.jpg --output images/slide-02.png
    python3 gen_image.py --quote 25          # price estimate for 25 images, no API call
    python3 gen_image.py --costs             # what you've spent so far

API key: the GEMINI_API_KEY environment variable, or the file
~/.webinar-kit/gemini.env written by setup_key.py. Never paste a key into chat.

Spend guard: refuses to run once today's image count hits the daily cap
(default 60, set WEBINAR_KIT_DAILY_CAP to change). No automatic retries.

Exit codes: 0 saved · 1 error · 2 model returned no image · 3 daily cap reached
"""

import argparse
import io
import json
import os
import sys
import warnings

# Python 3.9 (the Mac's built-in python3) makes google-genai and urllib3 print
# "end of life" / "LibreSSL" warnings on every run. Harmless, but they read as errors.
warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", message=".*OpenSSL.*")
from datetime import date, datetime
from pathlib import Path

KIT_DIR = Path.home() / ".webinar-kit"
KEY_FILE = KIT_DIR / "gemini.env"
COST_LOG = KIT_DIR / "generation_log.jsonl"

MODELS = {
    "standard": "gemini-3.1-flash-lite-image",     # Nano Banana 2 Lite
    "premium": "gemini-3.1-flash-image",           # Nano Banana 2, sharper
}
# USD per image at 1K, from ai.google.dev/gemini-api/docs/pricing (checked 2026-10-26).
# Image output has NO free tier: billing must be on in Google AI Studio.
PRICE = {"standard": 0.034, "premium": 0.067}
ASPECTS = {"1:1", "2:3", "3:2", "3:4", "4:3", "4:5", "5:4", "9:16", "16:9", "21:9"}
DEFAULT_DAILY_CAP = 60
TIMEOUT_MS = 120_000   # one request; no automatic retries


class Parser(argparse.ArgumentParser):
    def error(self, message):
        print(f"ERROR: {message}")
        sys.exit(1)


def load_key():
    if os.environ.get("GEMINI_API_KEY"):
        return os.environ["GEMINI_API_KEY"]
    if KEY_FILE.exists():
        for line in KEY_FILE.read_text(encoding="utf-8").splitlines():
            k, _, v = line.partition("=")
            if k.strip() == "GEMINI_API_KEY" and v.strip():
                return v.strip().strip('"').strip("'")
    return None


def read_log():
    if not COST_LOG.exists():
        return []
    out = []
    for line in COST_LOG.read_text(encoding="utf-8").splitlines():
        try:
            rec = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(rec, dict):
            out.append(rec)
    return out


def log(model, prompt, output, success):
    KIT_DIR.mkdir(parents=True, exist_ok=True)
    rec = {
        "timestamp": datetime.now().isoformat(timespec="seconds"),
        "model": model,
        "prompt_preview": prompt[:80],
        "output": str(output),
        "success": success,
        "cost_usd": PRICE[model] if success else 0.0,
    }
    with open(COST_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(rec) + "\n")


def today_count():
    today = date.today().isoformat()
    # Only images actually made count: a failed call is not charged.
    return sum(1 for r in read_log()
               if r.get("success") and str(r.get("timestamp", "")).startswith(today))


def show_costs():
    recs = read_log()
    ok = [r for r in recs if r.get("success")]
    total = sum(r.get("cost_usd", 0) for r in ok if isinstance(r.get("cost_usd", 0), (int, float)))
    print(f"Images made: {len(ok)} (failed attempts: {len(recs) - len(ok)})")
    print(f"Today: {today_count()} of {daily_cap()} allowed")
    print(f"Estimated spend: ${total:.2f}  (standard ${PRICE['standard']}/image, premium ${PRICE['premium']}/image)")
    print("Exact charges: https://aistudio.google.com/usage")


def daily_cap():
    try:
        return int(os.environ.get("WEBINAR_KIT_DAILY_CAP", DEFAULT_DAILY_CAP))
    except ValueError:
        return DEFAULT_DAILY_CAP


def generate(prompt, model, aspect, output, ref_image=None):
    try:
        from google import genai
        from google.genai import types
        from PIL import Image
    except ImportError:
        print("ERROR: missing packages. Run: pip3 install -r requirements.txt")
        sys.exit(1)

    key = load_key()
    if not key:
        print("ERROR: no Gemini key found. Run /webinar-tutorial (Gear Up, Step 1.3) or setup_key.py in your Terminal.")
        sys.exit(1)

    if today_count() >= daily_cap():
        print(f"STOP: today's image cap ({daily_cap()}) is reached. Nothing was generated or charged.")
        print("To raise it for this session: export WEBINAR_KIT_DAILY_CAP=<number>")
        sys.exit(3)

    try:   # exactly one attempt: a retry could double-charge
        http = types.HttpOptions(timeout=TIMEOUT_MS, retry_options=types.HttpRetryOptions(attempts=1))
    except (AttributeError, TypeError):   # older SDKs: no retry options (and no retries by default)
        http = types.HttpOptions(timeout=TIMEOUT_MS)
    client = genai.Client(api_key=key, http_options=http)
    config = types.GenerateContentConfig(
        response_modalities=["Text", "Image"],
        image_config=types.ImageConfig(aspect_ratio=aspect),
    )
    if ref_image:
        try:
            contents = [prompt, Image.open(ref_image)]
        except Exception:
            print(f"ERROR: couldn't open the reference image {ref_image}. Use a JPG or PNG photo.")
            sys.exit(1)
    else:
        contents = prompt
    print(f"Model: {MODELS[model]} | aspect {aspect} | est. ${PRICE[model]:.3f}")
    try:
        resp = client.models.generate_content(model=MODELS[model], contents=contents, config=config)
    except Exception as exc:
        log(model, prompt, output, False)
        msg = str(exc)
        if "401" in msg or "UNAUTHENTICATED" in msg or "API_KEY_INVALID" in msg:
            print("ERROR: Google rejected the key. Re-run setup_key.py with a fresh key.")
        elif "429" in msg or "RESOURCE_EXHAUSTED" in msg:
            print("ERROR: Google said no. Making images needs billing turned on in Google AI Studio "
                  "(there is no free tier for images; see /webinar-tutorial, Step 1.4). "
                  "If billing is already on, wait a few minutes and try again.")
        elif "404" in msg or "NOT_FOUND" in msg:
            print("ERROR: Google no longer offers this image model. Update the kit: run "
                  "/plugin marketplace update kanyini-home-grown-skills, then restart Claude Code.")
        elif "SAFETY" in msg or "blocked" in msg.lower():
            print("ERROR: the safety filter blocked this prompt. Rephrase it.")
        else:
            print(f"ERROR: {msg[:300]}")
        sys.exit(1)

    for part in resp.parts or []:
        img = part.as_image() if part.text is None else None
        if img:
            Path(output).parent.mkdir(parents=True, exist_ok=True)
            pic = Image.open(io.BytesIO(img.image_bytes))   # Google may send JPEG bytes
            if Path(output).suffix.lower() in (".jpg", ".jpeg"):
                pic = pic.convert("RGB")
            pic.save(output)                                # format follows the file name
            log(model, prompt, output, True)
            print(f"SAVED: {output}")
            return
        if part.text:
            print(f"Model note: {part.text[:200]}")
    log(model, prompt, output, False)
    print("NO IMAGE: the model replied with text only. Add more visual detail to the prompt.")
    sys.exit(2)


def main():
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except (AttributeError, ValueError):
            pass
    ap = Parser(description="Generate textless slide art with Gemini")
    ap.add_argument("--prompt")
    ap.add_argument("--aspect", default="16:9", help=f"One of: {', '.join(sorted(ASPECTS))}")
    ap.add_argument("--output", help="Where to save the image (.png)")
    ap.add_argument("--model", choices=list(MODELS), default="standard")
    ap.add_argument("--image", help="Reference photo (e.g. a real headshot to keep a person consistent)")
    ap.add_argument("--style", default="", help="Style words added before the prompt")
    ap.add_argument("--quote", type=int, metavar="N", help="Print the estimated cost of N images and exit")
    ap.add_argument("--costs", action="store_true", help="Show images made and estimated spend")
    args = ap.parse_args()

    if args.costs:
        show_costs()
        return
    if args.quote is not None:
        if args.quote < 1:
            ap.error("--quote needs a positive number of images")
        n = args.quote
        print(f"{n} images: about ${n * PRICE['standard']:.2f} on standard, ${n * PRICE['premium']:.2f} on premium.")
        print(f"Daily cap: {daily_cap()} images (used today: {today_count()}).")
        return
    if not args.prompt or not args.output:
        ap.error("--prompt and --output are required")
    if args.aspect not in ASPECTS:
        ap.error(f"--aspect must be one of: {', '.join(sorted(ASPECTS))}")
    if args.image and not Path(args.image).exists():
        ap.error(f"reference image not found: {args.image}")
    prompt = f"{args.style.strip()}. {args.prompt}" if args.style.strip() else args.prompt
    generate(prompt, args.model, args.aspect, args.output, args.image)


if __name__ == "__main__":
    main()
