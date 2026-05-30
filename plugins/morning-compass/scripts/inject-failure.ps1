<#
.SYNOPSIS
  Phase 6 Tier D failure injection harness. Verifies graceful degradation per spec.

.DESCRIPTION
  Each test temporarily breaks one input, runs the runner in dry-run, asserts the expected
  failure mode is logged, then restores the input. Run after setup.ps1 + test-smoke.ps1 pass.
#>
$ErrorActionPreference = "Continue"

$stateDir = "$env:USERPROFILE\.claude\state"
$runner   = "$env:USERPROFILE\.claude\plugins\local\morning-compass\scripts\runner.ps1"
$logFile  = "$stateDir\morning-compass-runner.log"

function Get-LogTail {
    if (Test-Path $logFile) {
        Get-Content $logFile -Tail 30
    } else { @() }
}

function Assert-LogContains {
    param([string]$Pattern, [string]$Description)
    $tail = Get-LogTail | Out-String
    if ($tail -match $Pattern) {
        Write-Host "[OK] $Description (matched /$Pattern/)" -ForegroundColor Green
        return $true
    } else {
        Write-Host "[FAIL] $Description (did NOT match /$Pattern/)" -ForegroundColor Red
        return $false
    }
}

Write-Host "=== Tier D Failure Injection ===" -ForegroundColor Cyan

# Test 1: State file missing -> PREFLIGHT_FAIL with STATE_MISSING
Write-Host "`n--- Test 1: state file missing ---" -ForegroundColor Yellow
$victim = "$stateDir\morning-compass-feedback.jsonl"
$backup = "$victim.bak"
if (Test-Path $victim) {
    Move-Item $victim $backup -Force
    try {
        & pwsh -NoProfile -File $runner -Mode dry-run 2>&1 | Out-Null
        Assert-LogContains "STATE_MISSING.*feedback" "preflight catches missing state file" | Out-Null
    } finally {
        if (Test-Path $backup) { Move-Item $backup $victim -Force }
    }
}

# Test 2: Stripe key invalid -> STRIPE_FETCH_FAIL but RUN_END success
Write-Host "`n--- Test 2: invalid Stripe key (graceful degrade) ---" -ForegroundColor Yellow
$envFile = "$env:USERPROFILE\.claude\.env.morning-compass"
$envBackup = "$envFile.bak"
if (Test-Path $envFile) {
    Copy-Item $envFile $envBackup -Force
    try {
        (Get-Content $envFile) -replace "^STRIPE_RESTRICTED_KEY=.*", "STRIPE_RESTRICTED_KEY=rk_live_invalid_test" | Set-Content $envFile
        & pwsh -NoProfile -File $runner -Mode dry-run 2>&1 | Out-Null
        Assert-LogContains "STRIPE_FETCH_FAIL" "stripe fetch fails gracefully" | Out-Null
        Assert-LogContains "RUN_END" "run completes despite stripe failure" | Out-Null
    } finally {
        Move-Item $envBackup $envFile -Force
    }
}

# Test 3: Dropbox unavailable -> BACKUP_FAIL but RUN_END success
Write-Host "`n--- Test 3: Dropbox unreachable (graceful degrade) ---" -ForegroundColor Yellow
$dropbox = "$env:USERPROFILE\Dropbox"
$dropboxTemp = "$env:USERPROFILE\Dropbox-injected-fail-$(Get-Date -Format yyyyMMddHHmmss)"
if (Test-Path $dropbox) {
    try {
        Rename-Item $dropbox $dropboxTemp -ErrorAction SilentlyContinue
        if (-not (Test-Path $dropbox)) {
            & pwsh -NoProfile -File $runner -Mode dry-run 2>&1 | Out-Null
            Assert-LogContains "BACKUP_FAIL" "backup fails gracefully" | Out-Null
            Assert-LogContains "RUN_END" "run completes despite backup failure" | Out-Null
        } else {
            Write-Host "[SKIP] Could not rename Dropbox (likely in use)" -ForegroundColor Yellow
        }
    } finally {
        if (Test-Path $dropboxTemp) { Rename-Item $dropboxTemp $dropbox -ErrorAction SilentlyContinue }
    }
}

# Test 4: Mutex prevents double-run
Write-Host "`n--- Test 4: mutex single-instance enforcement ---" -ForegroundColor Yellow
$job = Start-Job -ScriptBlock {
    param($r)
    & pwsh -NoProfile -File $r -Mode dry-run 2>&1
} -ArgumentList $runner

Start-Sleep -Seconds 1

$secondRunOutput = & pwsh -NoProfile -File $runner -Mode dry-run 2>&1 | Out-String
if ($secondRunOutput -match "MUTEX_HELD") {
    Write-Host "[OK] mutex blocked second concurrent run" -ForegroundColor Green
} else {
    Write-Host "[FAIL] mutex did not block (or first run completed too fast)" -ForegroundColor Red
}

Wait-Job $job -Timeout 60 | Out-Null
Receive-Job $job | Out-Null
Remove-Job $job -Force -ErrorAction SilentlyContinue

Write-Host "`n=== Tier D complete ===" -ForegroundColor Cyan
Write-Host "Review log tail manually if any test failed: $logFile"
