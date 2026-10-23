"""Download a picked ad creative + extract audio and frames for Study.

Retry-once-then-skip per ad (a single CDN 403 / expired URL shouldn't kill the
run). Outputs go to state/creatives/<ad_id>/ and are AUTO-PURGED after
deconstruction (only the card + a thumbnail persist).

Needs ffmpeg on PATH (used elsewhere in this environment).
"""

from __future__ import annotations

import logging
import subprocess
from dataclasses import dataclass
from pathlib import Path
from urllib.request import Request, urlopen

logger = logging.getLogger("ad_recon")


@dataclass
class CreativeAssets:
    ad_id: str
    video_path: Path | None
    audio_path: Path | None
    first_frame: Path | None
    frames: list[Path]


def _download(url: str, dest: Path) -> bool:
    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urlopen(req, timeout=60) as resp, open(dest, "wb") as f:
            f.write(resp.read())
        return dest.stat().st_size > 0
    except Exception as e:
        logger.warning("download failed for %s: %s", url, e)
        return False


def _ffmpeg(args: list[str]) -> bool:
    try:
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", *args],
            check=True, capture_output=True, timeout=120,
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
        logger.warning("ffmpeg failed: %s", e)
        return False


def fetch_creative(
    ad_id: str,
    creative_url: str | None,
    creatives_dir: Path,
    n_frames: int = 6,
) -> CreativeAssets:
    """Download + extract. Retries the download once. Degrades gracefully:
    missing assets are None, not exceptions.
    """
    out = creatives_dir / ad_id
    out.mkdir(parents=True, exist_ok=True)
    empty = CreativeAssets(ad_id, None, None, None, [])
    if not creative_url:
        return empty

    video = out / "creative.mp4"
    ok = _download(creative_url, video)
    if not ok:
        ok = _download(creative_url, video)  # retry once
    if not ok:
        logger.warning("ad %s: creative download failed twice; skipping", ad_id)
        return empty

    audio = out / "audio.mp3"
    if not _ffmpeg(["-i", str(video), "-vn", "-ac", "1", "-ar", "16000", str(audio)]):
        audio = None  # silent / no audio stream is fine — OCR still runs

    first = out / "frame_000.jpg"
    _ffmpeg(["-i", str(video), "-vf", "select=eq(n\\,0)", "-frames:v", "1", str(first)])

    # Sample N evenly-spaced frames for Vision/OCR + pacing (cut frequency).
    frames_pat = str(out / "frame_%03d.jpg")
    _ffmpeg(["-i", str(video), "-vf", f"fps=1,scale=512:-1", "-frames:v", str(n_frames), frames_pat])
    frames = sorted(out.glob("frame_*.jpg"))

    return CreativeAssets(
        ad_id=ad_id,
        video_path=video,
        audio_path=audio if audio and audio.exists() else None,
        first_frame=first if first.exists() else (frames[0] if frames else None),
        frames=frames,
    )


def purge_creative(ad_id: str, creatives_dir: Path, keep_thumb: bool = True) -> None:
    """Auto-purge the heavy creative after deconstruction. Optionally keep the
    first frame as a thumbnail for the dashboard.
    """
    out = creatives_dir / ad_id
    if not out.exists():
        return
    for f in out.iterdir():
        if keep_thumb and f.name == "frame_000.jpg":
            continue
        try:
            f.unlink()
        except OSError:
            pass
