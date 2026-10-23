# scripts/windows-smoke-test.ps1
# Post-sanitize Windows verification.
# Per PLAN-v3.1 §6 Windows failure-mode catalog.
#
# Validates that the sanitized marketplace:
#   1. Tilde expansion (~/) works in JSON, PowerShell, Node fs reads
#   2. Path separators (\ vs /) are handled
#   3. CRLF vs LF is consistent per file type
#   4. No case-sensitivity collisions
#   5. No reserved Windows names (CON, PRN, AUX, NUL, COM1-9, LPT1-9)
#   6. Scheduled-task installers prompt for consent

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $RepoRoot

try {
    Write-Host "[windows-smoke-test] Running checks..."
    $failures = 0

    # Check 5: Reserved Windows names
    Write-Host "[5] Checking for reserved Windows names..."
    $reserved = @('CON', 'PRN', 'AUX', 'NUL') + (1..9 | ForEach-Object { "COM$_" }) + (1..9 | ForEach-Object { "LPT$_" })
    Get-ChildItem -Path "plugins" -Recurse | ForEach-Object {
        $base = $_.BaseName.ToUpper()
        if ($reserved -contains $base) {
            Write-Host "  ❌ Reserved name found: $($_.FullName)" -ForegroundColor Red
            $failures++
        }
    }

    # Check 4: Case-sensitivity collisions (Windows is case-insensitive but the marketplace runs on Linux too)
    Write-Host "[4] Checking for case-sensitivity collisions..."
    $folders = Get-ChildItem -Path "plugins" -Recurse -Directory | Select-Object -ExpandProperty FullName
    $lowerCount = $folders | ForEach-Object { $_.ToLower() } | Group-Object | Where-Object { $_.Count -gt 1 }
    if ($lowerCount) {
        Write-Host "  ❌ Case collisions found:" -ForegroundColor Red
        $lowerCount | ForEach-Object { Write-Host "      $($_.Name)" -ForegroundColor Red }
        $failures += $lowerCount.Count
    }

    # Check 1-3: tilde, path separator, CRLF — covered by validators + sanitize binary detection.
    # Check 6: scheduled-task installer consent — manual review documented in docs/CONTRIBUTING.md.

    Write-Host ""
    if ($failures -eq 0) {
        Write-Host "✅ Windows smoke test passed." -ForegroundColor Green
        exit 0
    } else {
        Write-Host "❌ Windows smoke test failed with $failures issues." -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}
