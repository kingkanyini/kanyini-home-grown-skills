"""Shared logger with redaction filter.

Policy: API keys, OAuth tokens, full Gmail body, full transcripts, and full
vault note contents MUST NOT reach the log. The redaction filter is a
best-effort net for accidental leaks (patterns from config.yaml). Callers
should ALSO truncate sensitive payloads before logging (belt + suspenders).
"""

from __future__ import annotations

import logging
import re
import sys
import time
from datetime import datetime
from pathlib import Path


DEFAULT_FMT = "%(asctime)s %(levelname)-7s %(name)s: %(message)s"


class RedactionFilter(logging.Filter):
    """Regex-replaces matches with [REDACTED] in msg and args.

    Applied BEFORE format emission so every handler benefits.
    """

    def __init__(self, patterns: list[str]):
        super().__init__()
        self.patterns = [re.compile(p) for p in patterns]

    def _scrub(self, value: object) -> object:
        if not isinstance(value, str):
            return value
        out = value
        for p in self.patterns:
            out = p.sub("[REDACTED]", out)
        return out

    def filter(self, record: logging.LogRecord) -> bool:
        record.msg = self._scrub(record.msg)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: self._scrub(v) for k, v in record.args.items()}
            else:
                try:
                    record.args = tuple(self._scrub(a) for a in record.args)
                except TypeError:
                    pass
        return True


def _prune_old_logs(log_dir: Path, retention_days: int) -> None:
    if retention_days <= 0:
        return
    cutoff = time.time() - (retention_days * 86400)
    for f in log_dir.glob("recon-*.log"):
        try:
            if f.stat().st_mtime < cutoff:
                f.unlink()
        except OSError:
            continue


def setup_logging(
    log_dir: Path,
    redaction_patterns: list[str],
    log_retention_days: int = 30,
    level: int = logging.INFO,
    name: str = "ad_recon",
) -> logging.Logger:
    """Configure and return the project logger. Idempotent."""
    log_dir = Path(log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)
    (log_dir / "errors").mkdir(parents=True, exist_ok=True)

    _prune_old_logs(log_dir, log_retention_days)

    logger = logging.getLogger(name)
    logger.setLevel(level)
    logger.propagate = False

    if getattr(logger, "_ad_recon_configured", False):
        return logger

    redact = RedactionFilter(redaction_patterns)
    fmt = logging.Formatter(DEFAULT_FMT)

    date_str = datetime.now().strftime("%Y-%m-%d")
    file_path = log_dir / f"recon-{date_str}.log"
    file_handler = logging.FileHandler(file_path, encoding="utf-8")
    file_handler.setFormatter(fmt)
    file_handler.addFilter(redact)
    logger.addHandler(file_handler)

    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setFormatter(fmt)
    stderr_handler.addFilter(redact)
    logger.addHandler(stderr_handler)

    logger._ad_recon_configured = True  # type: ignore[attr-defined]
    return logger
