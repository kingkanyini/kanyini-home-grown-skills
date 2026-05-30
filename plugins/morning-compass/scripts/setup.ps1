<#
.SYNOPSIS
  One-time setup for Morning Compass: NSSM bot service, Cloudflared service, Task Scheduler, Telegram webhook.

.DESCRIPTION
  Idempotent. Default registers TEST bot for Phase 6 Tier C. Pass -Production for prod cutover (Phase 7 Task 34).

.PARAMETER Production
  Switch to production bot + secret. Default: test bot.
#>
param([switch]$Production)

$ErrorActionPreference = "Stop"

# === Load env ===
$envFile = "$env:USERPROFILE\.claude\.env.morning-compass"
if (-not (Test-Path $envFile)) {
    throw "Missing $envFile. Phase 1 Task 6 must be complete (with all 8 secret values pasted)."
}
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^([^#=]+)=(.*)$") {
        Set-Item -Path "env:$($Matches[1].Trim())" -Value $Matches[2].Trim()
    }
}

$botToken = if ($Production) { $env:TELEGRAM_BOT_TOKEN } else { $env:TEST_BOT_TOKEN }
$secret   = if ($Production) { $env:TELEGRAM_WEBHOOK_SECRET } else { $env:TEST_WEBHOOK_SECRET }
$mode     = if ($Production) { "PRODUCTION" } else { "TEST" }

if (-not $botToken -or -not $secret) {
    throw "Missing bot token or webhook secret in env. Check claude-secrets.env paste-through."
}

Write-Host "=== Morning Compass Setup ($mode mode) ===" -ForegroundColor Cyan

# === 1. Install bot.js as NSSM service ===
$svcName = "morning-compass-bot"
$nssmStatus = nssm status $svcName 2>&1
if ($nssmStatus -notmatch "SERVICE_") {
    Write-Host "Installing NSSM service: $svcName"
    $nodePath = (Get-Command node).Source
    $botPath  = "$env:USERPROFILE\.claude\plugins\local\morning-compass\bot\bot.js"
    nssm install $svcName $nodePath $botPath
    nssm set $svcName AppDirectory "$env:USERPROFILE\.claude\plugins\local\morning-compass\bot"
    nssm set $svcName AppStdout    "$env:USERPROFILE\.claude\state\morning-compass-bot.log"
    nssm set $svcName AppStderr    "$env:USERPROFILE\.claude\state\morning-compass-bot.err.log"
    nssm set $svcName AppRotateOnline 1
    nssm set $svcName AppRotateBytes 10485760
}
nssm restart $svcName 2>$null
Write-Host "[OK] Bot service installed and started"

# === 2. Install cloudflared as morning-compass-tunnel NSSM service ===
# Delegates to install-tunnel-service.ps1 — uses NSSM with explicit --config to
# avoid the cloudflared default-service-install path (which silently resets
# config.yml to a stub on startup). Idempotent.
$tunnelInstaller = "$env:USERPROFILE\.claude\plugins\local\morning-compass\scripts\install-tunnel-service.ps1"
& pwsh -NoProfile -File $tunnelInstaller
if ($LASTEXITCODE -ne 0) { throw "install-tunnel-service.ps1 failed (exit $LASTEXITCODE)" }
Write-Host "[OK] morning-compass-tunnel NSSM service installed"

# === 3. Register Telegram webhook ===
$tunnelUrl = "https://$env:CLOUDFLARE_TUNNEL_HOSTNAME/telegram-webhook"
try {
    $webhookResp = Invoke-RestMethod -Uri "https://api.telegram.org/bot$botToken/setWebhook" -Method POST -Body @{
        url          = $tunnelUrl
        secret_token = $secret
    } -ContentType "application/x-www-form-urlencoded"
    if ($webhookResp.ok) {
        Write-Host "[OK] Telegram webhook registered: $tunnelUrl"
    } else {
        throw "Webhook registration failed: $($webhookResp.description)"
    }
} catch {
    throw "Telegram setWebhook call failed: $($_.Exception.Message)"
}

# === 4. Create Task Scheduler entries ===
$runnerPath = "$env:USERPROFILE\.claude\plugins\local\morning-compass\scripts\runner.ps1"
$pwshPath = (Get-Command pwsh).Source

$dailyAction   = New-ScheduledTaskAction -Execute $pwshPath -Argument "-NoProfile -File `"$runnerPath`" -Mode auto"
$dailyTrigger  = New-ScheduledTaskTrigger -Daily -At "6:00am"
$dailySettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15)
Register-ScheduledTask -TaskName "MorningCompass-Daily" -Action $dailyAction -Trigger $dailyTrigger -Settings $dailySettings -Force | Out-Null

$logonAction  = New-ScheduledTaskAction -Execute $pwshPath -Argument "-NoProfile -File `"$runnerPath`" -Mode check-missed"
$logonTrigger = New-ScheduledTaskTrigger -AtLogOn
Register-ScheduledTask -TaskName "MorningCompass-OnLogon" -Action $logonAction -Trigger $logonTrigger -Force | Out-Null

$restartAction  = New-ScheduledTaskAction -Execute "nssm" -Argument "restart morning-compass-bot"
$restartTrigger = New-ScheduledTaskTrigger -Daily -At "3:30am"
Register-ScheduledTask -TaskName "MorningCompass-BotRestart" -Action $restartAction -Trigger $restartTrigger -Force | Out-Null

# Manual + Refresh tasks: triggered on-demand by bot.js via `schtasks /Run`.
# LogonType S4U so they run as the user without password storage. The bot
# service itself runs as LocalSystem; these tasks bridge to the user-profile
# execution context that claude/plugins/MCP/OAuth need.
$s4uPrincipal     = New-ScheduledTaskPrincipal -UserId "$env:COMPUTERNAME\<your-username>" -LogonType S4U -RunLevel Highest
$onDemandSettings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Minutes 15) -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries

$manualAction = New-ScheduledTaskAction -Execute $pwshPath -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runnerPath`" -Mode manual -Voice <your-username>"
Register-ScheduledTask -TaskName "MorningCompass-Manual" -Action $manualAction -Settings $onDemandSettings -Principal $s4uPrincipal -Description "Triggered by Telegram bot /run. S4U logon as <your-username>." -Force | Out-Null

$refreshAction = New-ScheduledTaskAction -Execute $pwshPath -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runnerPath`" -Mode refresh -Voice <your-username>"
Register-ScheduledTask -TaskName "MorningCompass-Refresh" -Action $refreshAction -Settings $onDemandSettings -Principal $s4uPrincipal -Description "Triggered by Telegram bot /refresh. S4U logon as <your-username>." -Force | Out-Null

Write-Host "[OK] Task Scheduler entries created (Daily 6am, OnLogon, BotRestart 3:30am, Manual + Refresh on-demand via S4U)"

Write-Host "`n=== Setup complete ===" -ForegroundColor Green
Write-Host "Mode:        $mode"
Write-Host "Webhook URL: $tunnelUrl"
Write-Host "Next step:   run scripts/test-smoke.ps1 to verify (Phase 6)"
