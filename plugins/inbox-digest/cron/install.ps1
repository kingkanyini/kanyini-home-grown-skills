# Install the InboxDigest scheduled task.
# Run from an elevated PowerShell once. Re-running is safe (idempotent — overwrites existing).

$ErrorActionPreference = "Stop"

$taskName = "InboxDigest"
$xmlPath = "$PSScriptRoot\InboxDigest.xml"

if (-not (Test-Path $xmlPath)) {
    Write-Error "InboxDigest.xml not found at $xmlPath"
    exit 1
}

# Sanity check: claude CLI must be in PATH
$claude = Get-Command claude -ErrorAction SilentlyContinue
if (-not $claude) {
    Write-Warning "claude CLI not found in PATH. The cron task will fail until 'claude' is reachable. Continue anyway? (y/N)"
    $answer = Read-Host
    if ($answer -ne "y" -and $answer -ne "Y") { exit 1 }
}

# Remove existing task if present, then register fresh from XML
if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Write-Host "Removing existing $taskName task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Write-Host "Registering $taskName..." -ForegroundColor Cyan
Register-ScheduledTask -TaskName $taskName -Xml (Get-Content $xmlPath -Raw)

Write-Host ""
Write-Host "Installed. Triggers:" -ForegroundColor Green
Write-Host "  - 5 minutes after sign-on"
Write-Host "  - 1:00 PM daily"
Write-Host "  - 6:00 PM daily"
Write-Host ""
Write-Host "Logs: %LOCALAPPDATA%\inbox-digest-cron\<example-client>-<timestamp>.log (rotated after 30 days)"
Write-Host ""
Write-Host "Manual test:  Start-ScheduledTask -TaskName $taskName"
Write-Host "Disable:      Disable-ScheduledTask -TaskName $taskName"
Write-Host "Uninstall:    Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false"
