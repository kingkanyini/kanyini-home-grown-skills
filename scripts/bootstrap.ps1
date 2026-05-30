# scripts/bootstrap.ps1
# Windows variant of bootstrap.sh.
# Per PLAN-v3.1 §4.6.1.

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot

Push-Location $RepoRoot
try {
    Write-Host "Kanyini Home-Grown Skills — Bootstrap"
    Write-Host ""

    # 1. Install dev tooling
    if (-not (Test-Path node_modules)) {
        Write-Host "[1/2] Installing dev tooling (ajv, semver, glob)..."
        npm ci
    } else {
        Write-Host "[1/2] node_modules already exists — skipping npm install."
    }

    # 2. Point git at our pre-commit hooks
    Write-Host "[2/2] Configuring git hooks -> scripts/hooks/"
    git config core.hooksPath scripts/hooks

    Write-Host ""
    Write-Host "Bootstrap complete."
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "  - Add a skill: see docs/CONTRIBUTING.md"
    Write-Host "  - Run validators: npm run validate:all"
    Write-Host "  - Pre-commit hook will auto-run on git commit."
} finally {
    Pop-Location
}
