"""Run-state + seen-ledger persistence with atomic writes and locking.

Two record types (vs youtube-scout's single per-channel ledger):
  - ReconRun     at state/runs/<run-id>.json   — the resumable run machine
  - SeenLedger   at state/seen/<advertiser>.json — dedup across re-runs

All writes are atomic (.tmp → os.replace). Lock files guard concurrent runs
on the same advertiser; stale locks (>2h) are stolen.
"""

from __future__ import annotations

import os
import re
import time
from datetime import datetime
from pathlib import Path

from pydantic import ValidationError

from .schemas import ReconRun, SeenLedger


STALE_LOCK_SECONDS = 2 * 60 * 60  # 2 hours


class StateStoreError(Exception):
    pass


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (value or "").lower()).strip("-") or "x"


class StateStore:
    """File-backed store for runs + seen-ledgers."""

    def __init__(self, state_dir: Path):
        self.state_dir = Path(state_dir)
        self.runs_dir = self.state_dir / "runs"
        self.seen_dir = self.state_dir / "seen"
        for d in (self.runs_dir, self.seen_dir):
            d.mkdir(parents=True, exist_ok=True)

    # -----------------------------------------------------------------
    # Generic atomic write
    # -----------------------------------------------------------------

    @staticmethod
    def _atomic_write(path: Path, text: str) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        tmp = path.with_suffix(path.suffix + ".tmp")
        tmp.write_text(text, encoding="utf-8")
        os.replace(tmp, path)

    # -----------------------------------------------------------------
    # Locking (per advertiser slug)
    # -----------------------------------------------------------------

    def _lock_path(self, slug: str) -> Path:
        return self.seen_dir / f"{slug}.lock"

    def acquire_lock(self, slug: str) -> bool:
        lock_path = self._lock_path(slug)
        if lock_path.exists():
            try:
                age = time.time() - lock_path.stat().st_mtime
            except FileNotFoundError:
                age = None
            if age is not None and age > STALE_LOCK_SECONDS:
                try:
                    lock_path.unlink()
                except FileNotFoundError:
                    pass
            else:
                return False
        try:
            fd = os.open(str(lock_path), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        except FileExistsError:
            return False
        try:
            os.write(fd, f"{os.getpid()}\n{datetime.now().isoformat()}\n".encode())
        finally:
            os.close(fd)
        return True

    def release_lock(self, slug: str) -> None:
        try:
            self._lock_path(slug).unlink()
        except FileNotFoundError:
            pass

    # -----------------------------------------------------------------
    # ReconRun
    # -----------------------------------------------------------------

    def _run_path(self, run_id: str) -> Path:
        return self.runs_dir / f"{run_id}.json"

    def read_run(self, run_id: str) -> ReconRun:
        path = self._run_path(run_id)
        if not path.exists():
            raise StateStoreError(f"No such run: {run_id}")
        try:
            return ReconRun.model_validate_json(path.read_text(encoding="utf-8"))
        except (ValidationError, OSError) as e:
            raise StateStoreError(f"Malformed run {path}: {e}") from e

    def write_run(self, run: ReconRun) -> None:
        run.updated_at = datetime.now()
        self._atomic_write(self._run_path(run.run_id), run.model_dump_json(indent=2))

    def list_runs(self) -> list[str]:
        return sorted(p.stem for p in self.runs_dir.glob("*.json"))

    # -----------------------------------------------------------------
    # SeenLedger
    # -----------------------------------------------------------------

    def _seen_path(self, slug: str) -> Path:
        return self.seen_dir / f"{slug}.json"

    def read_seen(self, advertiser: str) -> SeenLedger:
        slug = slugify(advertiser)
        path = self._seen_path(slug)
        if not path.exists():
            return SeenLedger(advertiser_slug=slug)
        try:
            return SeenLedger.model_validate_json(path.read_text(encoding="utf-8"))
        except (ValidationError, OSError) as e:
            raise StateStoreError(f"Malformed seen-ledger {path}: {e}") from e

    def write_seen(self, ledger: SeenLedger) -> None:
        ledger.last_run_at = datetime.now()
        self._atomic_write(
            self._seen_path(ledger.advertiser_slug),
            ledger.model_dump_json(indent=2),
        )

    def mark_seen(self, advertiser: str, ad_ids: list[str]) -> SeenLedger:
        ledger = self.read_seen(advertiser)
        existing = set(ledger.seen_ad_ids)
        for aid in ad_ids:
            if aid not in existing:
                ledger.seen_ad_ids.append(aid)
                existing.add(aid)
        self.write_seen(ledger)
        return ledger
