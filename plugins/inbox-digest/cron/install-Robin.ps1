#Requires -RunAsAdministrator
# Install the ExampleScan scheduled task (1x/day at 9:00 AM for Robin-the-example-client).
# Run from an ELEVATED PowerShell once. Re-running is safe (overwrites).
#
# To bypass execution policy in one shot:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force; .\install-Robin.ps1

$ErrorActionPreference = "Stop"

$taskName = "ExampleScan"
$xmlPath = "$PSScriptRoot\ExampleScan.xml"

if (-not (Test-Path $xmlPath)) {
    Write-Error "ExampleScan.xml not found at $xmlPath"
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
Write-Host "Brief lands at:  <vault>\context\clients\Robin-the-example-client\briefs\YYYY-MM-DD_brief.md"
Write-Host "Heartbeat:       ~/.claude/.inbox-digest-Robin-the-example-client.last-run.json"
Write-Host "Logs:            %LOCALAPPDATA%\inbox-digest-cron\Robin-the-example-client-<timestamp>.log"
Write-Host ""
Write-Host "Manual test:  Start-ScheduledTask -TaskName $taskName"
Write-Host "Disable:      Disable-ScheduledTask -TaskName $taskName"
Write-Host "Uninstall:    Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false"
