"""Groq Whisper transcription of ad audio (matches youtube-scout's choice).

Returns the spoken transcript. The on-screen-text capture (OCR) is separate
(deconstruct.py, via Claude Vision) and merged against this timeline — Whisper
alone misses burned-in captions.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path

logger = logging.getLogger("ad_recon")


def transcribe_audio(audio_path: Path | None, cfg: dict) -> str:
    """Transcribe with Groq Whisper. Returns "" if no audio or on failure
    (a music-only ad has no speech — that's a valid, non-fatal outcome).
    """
    if not audio_path or not Path(audio_path).exists():
        return ""
    key = os.environ.get("GROQ_API_KEY")
    if not key:
        logger.warning("GROQ_API_KEY not set — skipping transcription")
        return ""
    try:
        from groq import Groq
    except ImportError:
        logger.warning("groq SDK not installed — skipping transcription")
        return ""

    model = cfg.get("model", "whisper-large-v3")
    try:
        client = Groq(api_key=key)
        with open(audio_path, "rb") as f:
            resp = client.audio.transcriptions.create(
                file=(Path(audio_path).name, f.read()),
                model=model,
            )
        return (getattr(resp, "text", "") or "").strip()
    except Exception as e:
        logger.warning("transcription failed: %s", e)
        return ""
