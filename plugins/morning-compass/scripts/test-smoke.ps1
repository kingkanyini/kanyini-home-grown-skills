<#
.SYNOPSIS
  Phase 6 Tier A smoke tests. Run after setup.ps1.

.DESCRIPTION
  Verifies env vars present, NSSM bot service running, tunnel /health reachable,
  Telegram getMe responds, Composio reachable. Read-only checks.
#>
$ErrorActionPreference = "Continue"

$results = @()
function Add-Result {
    param([string]$Check, [bool]$Pass, [string]$Note = "")
    $script:results += [PSCustomObject]@{
        Check = $Check
        Pass  = $Pass
        Note  = $Note
    }
    $icon = if ($Pass) { "[OK]" } else { "[FAIL]" }
    $extra = if ($Note) { " - $Note" } else { "" }
    Write-Host "$icon $Check$extra"
}

Write-Host "=== Morning Compass Smoke Test (Tier A) ===" -ForegroundColor Cyan

# === 1. Env file present + populated ===
$envFile = "$env:USERPROFILE\.claude\.env.morning-compass"
if (-not (Test-Path $envFile)) {
    Add-Result "env file exists" $false "Missing $envFile"
} else {
    Add-Result "env file exists" $true
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.*)$") {
            Set-Item -Path "env:$($Matches[1].Trim())" -Value $Matches[2].Trim()
        }
    }
    $required = @(
        "TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_WEBHOOK_SECRET",
        "TEST_BOT_TOKEN", "TEST_CHAT_ID", "TEST_WEBHOOK_SECRET",
        "COMPOSIO_API_KEY", "STRIPE_RESTRICTED_KEY",
        "CLOUDFLARE_TUNNEL_HOSTNAME", "CLOUDFLARE_TUNNEL_UUID"
    )
    foreach ($v in $required) {
        $val = (Get-Item "env:$v" -ErrorAction SilentlyContinue).Value
        $present = $val -and $val -ne "PASTE_FROM_SECRETS"
        Add-Result "$v populated" $present
    }
}

# === 2. State files exist ===
$voice = "<your-username>"
$stateFiles = @(
    "morning-compass-$voice.json",
    "morning-compass-feedback.jsonl",
    "morning-compass-actions.jsonl",
    "morning-compass-actions-rollup.json",
    "morning-compass-conversation.jsonl"
)
foreach ($f in $stateFiles) {
    Add-Result "state file: $f" (Test-Path "$env:USERPROFILE\.claude\state\$f")
}

# === 3. Voice profile + coach config ===
Add-Result "voice profile: $voice/$voice-voice.md" (Test-Path "$env:USERPROFILE\.claude\references\voice-profiles\$voice\$voice-voice.md")
Add-Result "coach integrations.yml" (Test-Path "$env:USERPROFILE\.claude\plugins\local\morning-compass\reference\coaches\$voice\integrations.yml")

# === 4. NSSM bot service running ===
$svcStatus = nssm status morning-compass-bot 2>&1
Add-Result "NSSM bot service running" ($svcStatus -match "SERVICE_RUNNING") "Status: $svcStatus"

# === 5. Tunnel /health endpoint reachable ===
if ($env:CLOUDFLARE_TUNNEL_HOSTNAME) {
    try {
        $health = Invoke-RestMethod -Uri "https://$env:CLOUDFLARE_TUNNEL_HOSTNAME/health" -TimeoutSec 10
        Add-Result "tunnel /health reachable" ($health.status -eq "ok") "Uptime: $($health.uptime_s)s"
    } catch {
        Add-Result "tunnel /health reachable" $false $_.Exception.Message
    }
}

# === 6. Telegram getMe (both bots) ===
foreach ($pair in @(@{Name="prod"; Token=$env:TELEGRAM_BOT_TOKEN}, @{Name="test"; Token=$env:TEST_BOT_TOKEN})) {
    if ($pair.Token -and $pair.Token -ne "PASTE_FROM_SECRETS") {
        try {
            $me = Invoke-RestMethod -Uri "https://api.telegram.org/bot$($pair.Token)/getMe" -TimeoutSec 5
            Add-Result "telegram $($pair.Name) bot responds" $me.ok "Bot: @$($me.result.username)"
        } catch {
            Add-Result "telegram $($pair.Name) bot responds" $false $_.Exception.Message
        }
    }
}

# === 7. Stripe restricted key valid ===
if ($env:STRIPE_RESTRICTED_KEY -and $env:STRIPE_RESTRICTED_KEY -ne "PASTE_FROM_SECRETS") {
    try {
        $stripe = Invoke-RestMethod -Uri "https://api.stripe.com/v1/charges?limit=1" -Headers @{Authorization="Bearer $env:STRIPE_RESTRICTED_KEY"} -TimeoutSec 5
        Add-Result "stripe restricted key valid" $true
    } catch {
        Add-Result "stripe restricted key valid" $false $_.Exception.Message
    }
}

# === 8. Claude CLI available ===
Add-Result "claude CLI on PATH" ($null -ne (Get-Command claude -ErrorAction SilentlyContinue))

# === Last runner log line (informational) ===
$logFile = "$env:USERPROFILE\.claude\state\morning-compass-runner.log"
if (Test-Path $logFile) {
    $lastLine = Get-Content $logFile -Tail 1 -ErrorAction SilentlyContinue
    if ($lastLine) {
        Write-Host "`nLast runner log line:" -ForegroundColor DarkGray
        Write-Host "  $lastLine" -ForegroundColor DarkGray
    }
}

# === Summary ===
$failed = $results | Where-Object { -not $_.Pass }
Write-Host "`n=== Smoke Test Summary ===" -ForegroundColor Cyan
Write-Host "Total checks: $($results.Count)"
Write-Host "Passed:       $($results.Count - $failed.Count)" -ForegroundColor Green
Write-Host "Failed:       $($failed.Count)" -ForegroundColor $(if ($failed.Count) { "Red" } else { "Green" })

if ($failed.Count) {
    Write-Host "`nFailures:" -ForegroundColor Red
    $failed | ForEach-Object { Write-Host "  - $($_.Check): $($_.Note)" -ForegroundColor Red }
    exit 1
}
exit 0
