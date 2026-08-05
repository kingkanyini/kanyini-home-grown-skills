# Install the InboxDigest + SentinelWatchdog scheduled tasks.
# Run once. Re-running is safe (idempotent — overwrites existing).

$ErrorActionPreference = "Stop"

function Install-TaskFromXml([string]$TaskName, [string]$XmlPath) {
    if (-not (Test-Path $XmlPath)) {
        Write-Error "$TaskName XML not found at $XmlPath"
        exit 1
    }
    if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
        Write-Host "Removing existing $TaskName task..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }
    Write-Host "Registering $TaskName..." -ForegroundColor Cyan
    Register-ScheduledTask -TaskName $TaskName -Xml (Get-Content $XmlPath -Raw) | Out-Null
}

# Sanity check: node must be reachable (the digest is a self-contained Node CLI;
# the old 'claude CLI' check is obsolete — headless claude was replaced by digest.js).
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Warning "node not found in PATH. run-example.bat resolves node itself, but verify Node 18+ exists. Continue anyway? (y/N)"
    $answer = Read-Host
    if ($answer -ne "y" -and $answer -ne "Y") { exit 1 }
}

Install-TaskFromXml -TaskName "InboxDigest" -XmlPath "$PSScriptRoot\InboxDigest.xml"
Install-TaskFromXml -TaskName "SentinelWatchdog" -XmlPath "$PSScriptRoot\SentinelWatchdog.xml"

Write-Host ""
Write-Host "Installed." -ForegroundColor Green
Write-Host "  InboxDigest: sign-on + 08:00 / 12:00 / 18:00 daily, 60-min limit for Slack sweeps"
Write-Host "  SentinelWatchdog: sign-on + 10:00 / 14:00 / 20:00 daily, dead-man check + toast"
Write-Host ""
Write-Host "Logs: %LOCALAPPDATA%\inbox-digest-cron\  ·  Heartbeats: ~/.claude/.inbox-digest-*.last-run.json + .sentinel-watchdog.last-run.json"
Write-Host ""
Write-Host "Manual test:  Start-ScheduledTask -TaskName InboxDigest"
Write-Host "Watchdog test: powershell -NoProfile -File `"$PSScriptRoot\sentinel-watchdog.ps1`""
Write-Host "Uninstall:    Unregister-ScheduledTask -TaskName <name> -Confirm:`$false"
