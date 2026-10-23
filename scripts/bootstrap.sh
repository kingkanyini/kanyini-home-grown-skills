#!/usr/bin/env bash
# scripts/bootstrap.sh
# Kanyini Home-Grown Skills Marketplace — Contributor bootstrap.
# Run once after cloning. Sets up pre-commit hooks + installs dev tooling.
#
# Per PLAN-v3.1 §4.6.1 (PHANTOM hook bootstrap mandate).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "Kanyini Home-Grown Skills — Bootstrap"
echo ""

# 1. Install dev tooling
if [ ! -d node_modules ]; then
  echo "[1/2] Installing dev tooling (ajv, semver, glob)..."
  npm ci
else
  echo "[1/2] node_modules already exists — skipping npm install."
fi

# 2. Point git at our pre-commit hooks
echo "[2/2] Configuring git hooks → scripts/hooks/"
git config core.hooksPath scripts/hooks

echo ""
echo "Bootstrap complete."
echo ""
echo "Next steps:"
echo "  - Add a skill: see docs/CONTRIBUTING.md"
echo "  - Run validators: npm run validate:all"
echo "  - Pre-commit hook will auto-run on git commit."
