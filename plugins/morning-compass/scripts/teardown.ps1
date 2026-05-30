<#
.SYNOPSIS
  Removes Morning Compass services, scheduler entries, webhook registrations.

.DESCRIPTION
  Inverse of setup.ps1. Does NOT delete state files or .env — those are user data.
  Idempotent: safe to run multiple times.
#>
$ErrorActionPreference = "SilentlyContinue"

Write-Host "=== Morning Compass Teardown ===" -ForegroundColor Yellow

nssm stop morning-compass-bot 2>$null
nssm remove morning-compass-bot confirm 2>$null
Write-Host "[OK] Bot service removed"

nssm stop morning-compass-tunnel 2>$null
nssm remove morning-compass-tunnel confirm 2>$null
Write-Host "[OK] Tunnel service (morning-compass-tunnel) removed"

$envFile = "$env:USERPROFILE\.claude\.env.morning-compass"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.*)$") {
            Set-Item -Path "env:$($Matches[1].Trim())" -Value $Matches[2].Trim()
        }
    }
    foreach ($token in @($env:TELEGRAM_BOT_TOKEN, $env:TEST_BOT_TOKEN)) {
        if ($token -and $token -ne "PASTE_FROM_SECRETS") {
            Invoke-RestMethod -Uri "https://api.telegram.org/bot$token/deleteWebhook" -Method POST -ErrorAction SilentlyContinue | Out-Null
        }
    }
    Write-Host "[OK] Telegram webhooks removed"
}

@("MorningCompass-Daily", "MorningCompass-OnLogon", "MorningCompass-BotRestart", "MorningCompass-Manual", "MorningCompass-Refresh") | ForEach-Object {
    Unregister-ScheduledTask -TaskName $_ -Confirm:$false -ErrorAction SilentlyContinue
}
Write-Host "[OK] Scheduled tasks removed (Daily, OnLogon, BotRestart, Manual, Refresh)"

Write-Host "`n=== Teardown complete ===" -ForegroundColor Green
Write-Host "State files preserved at: $env:USERPROFILE\.claude\state\"
Write-Host ".env preserved at:        $env:USERPROFILE\.claude\.env.morning-compass"
