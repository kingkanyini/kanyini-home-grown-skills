#Requires -RunAsAdministrator
# Install the ExampleScanTwo scheduled task (1x/day at 9:00 AM for Alex-the-example-client).
# Run from an ELEVATED PowerShell once. Re-running is safe (overwrites).
#
# To bypass execution policy in one shot:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; .\install-Alex.ps1

$ErrorActionPreference = "Stop"

$taskName = "ExampleScanTwo"
$xmlPath = "$PSScriptRoot\ExampleScanTwo.xml"

if (-not (Test-Path $xmlPath)) {
    Write-Error "ExampleScanTwo.xml not found at $xmlPath"
    exit 1
}

# Sanity check: node + claude CLI sanity is already verified by the <example-client> cron;
# we share the same digest.js engine.

if (Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue) {
    Write-Host "Removing existing $taskName task..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

Write-Host "Registering $taskName..." -ForegroundColor Cyan
Register-ScheduledTask -TaskName $taskName -Xml (Get-Content $xmlPath -Raw)

Write-Host ""
Write-Host "Installed. Triggers:" -ForegroundColor Green
Write-Host "  - 9:00 AM daily"
Write-Host "  - 5 minutes after sign-on (catch-up if 9 AM was missed)"
Write-Host ""
Write-Host "Brief lands at:  <vault>\context\clients\Alex-the-example-client\briefs\YYYY-MM-DD_brief.md"
Write-Host "Heartbeat:       ~/.claude/.inbox-digest-Alex-the-example-client.last-run.json"
Write-Host "Logs:            %LOCALAPPDATA%\inbox-digest-cron\Alex-the-example-client-<timestamp>.log"
Write-Host ""
Write-Host "Manual test:  Start-ScheduledTask -TaskName $taskName"
Write-Host "Disable:      Disable-ScheduledTask -TaskName $taskName"
Write-Host "Uninstall:    Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false"
