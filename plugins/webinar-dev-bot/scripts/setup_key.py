"""
Webinar Dev Bot — save your Gemini API key safely.

Run this in your OWN Terminal window (not inside the Claude chat), so the key
never lands in a chat transcript:

    python3 setup_key.py           # paste the key when asked (it stays hidden)
    python3 setup_key.py --check   # confirm a key is saved (shows last 4 characters only)

The key is saved to ~/.webinar-kit/gemini.env, readable only by you.
If a key ever gets pasted into a chat, delete it in Google AI Studio and make a new one.
"""

import argparse
import getpass
import os
import stat
import sys
from pathlib import Path

KIT_DIR = Path.home() / ".webinar-kit"
KEY_FILE = KIT_DIR / "gemini.env"


def saved_key():
    if not KEY_FILE.exists():
        return None
    for line in KEY_FILE.read_text(encoding="utf-8").splitlines():
        k, _, v = line.partition("=")
        if k.strip() == "GEMINI_API_KEY" and v.strip():
            return v.strip()
    return None


def main():
    ap = argparse.ArgumentParser(description="Save your Gemini API key for the Webinar Kit")
    ap.add_argument("--check", action="store_true", help="Only check whether a key is saved")
    args = ap.parse_args()

    if args.check:
        key = os.environ.get("GEMINI_API_KEY") or saved_key()
        if key:
            where = "environment variable" if os.environ.get("GEMINI_API_KEY") else str(KEY_FILE)
            print(f"OK: key found ({where}), ending in ...{key[-4:]}")
            sys.exit(0)
        print("MISSING: no Gemini key saved yet.")
        sys.exit(1)

    if not sys.stdin.isatty():
        print("Please run this in your own Terminal window, not inside the Claude chat.")
        sys.exit(1)

    print("Paste your Gemini API key and press Enter. (It won't show on screen.)")
    try:
        key = getpass.getpass("Key: ").strip()
    except (EOFError, KeyboardInterrupt):
        print()
        print("Cancelled. No changes made.")
        sys.exit(1)
    if not key:
        print("Nothing entered. No changes made.")
        sys.exit(1)
    if not key.startswith("AIza") or len(key) < 35:
        print("That doesn't look like a Google AI Studio key (they start with 'AIza'). No changes made.")
        sys.exit(1)

    KIT_DIR.mkdir(mode=0o700, parents=True, exist_ok=True)
    try:
        os.chmod(KIT_DIR, 0o700)
    except OSError:
        pass
    if KEY_FILE.is_symlink():
        print(f"{KEY_FILE} is a link, not a file. Remove it and run this again. No changes made.")
        sys.exit(1)
    # Create the file already locked to 600 (only you can read it) so there's no open window.
    flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC | getattr(os, "O_NOFOLLOW", 0)
    fd = os.open(KEY_FILE, flags, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(f"GEMINI_API_KEY={key}\n")
    try:
        os.chmod(KEY_FILE, stat.S_IRUSR | stat.S_IWUSR)
    except OSError:
        pass
    print(f"Saved. Key ending in ...{key[-4:]} is stored in {KEY_FILE}")
    print("Go back to Claude and choose Done.")


if __name__ == "__main__":
    main()
