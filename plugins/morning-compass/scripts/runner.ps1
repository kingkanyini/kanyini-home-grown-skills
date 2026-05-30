<#
.SYNOPSIS
  Morning Compass runner. Spawned by Task Scheduler, desktop shortcut, or webhook.

.DESCRIPTION
  Three-actor architecture (per design spec r2):
    1. Acquire Windows named mutex (single-instance enforcement, per PHANTOM)
    2. Load env from ~/.claude/.env.morning-compass
    3. Pre-flight: verify voice profile, state files, Telegram, Claude CLI
    4. Pre-fetch Stripe directly via restricted key (architecture deviation — money never touches Composio)
    5. Build mode-specific flags + spawn headless Claude with the skill
    6. JSON-line log all events. Backup state to Dropbox after success.

.PARAMETER Mode
  "auto" (default daily run, --auto --telegram)
  "refresh" (regenerate brief with current state, --auto --telegram --refresh)
  "check-missed" (logon trigger — skip if last brief was within 18h)
  "dry-run" (no Telegram POST, write brief to file)
  "manual" (interactive prompts via AskUserQuestion)

.PARAMETER Voice
  Voice profile slug. Maps to ~/.claude/references/voice-profiles/{Voice}-voice.md
  AND ~/.claude/plugins/local/morning-compass/reference/coaches/{Voice}/integrations.yml.
  Default: <your-username>.
#>
param(
    [ValidateSet("auto","refresh","check-missed","dry-run","manual")]
    [string]$Mode = "auto",
    [string]$Voice = "<your-username>"
)

$ErrorActionPreference = "Stop"

# === Mutex acquisition (Task 15, per PHANTOM P0) ===
$mutexName = "Global\MorningCompass"
$createdNew = $false
$mutex = New-Object System.Threading.Mutex($true, $mutexName, [ref]$createdNew)

if (-not $createdNew) {
    Write-Output "MUTEX_HELD - another runner instance is active. Exiting."
    exit 0
}

# === State backup (Task 19) — defined outside try so it can run after spawn ===
function Backup-State {
    param([string]$VoiceName)
    $stateDir  = "$env:USERPROFILE\.claude\state"
    $backupDir = "$env:USERPROFILE\Dropbox\.claude-state-backup\morning-compass"

    try {
        if (-not (Test-Path $backupDir)) {
            New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
        }
        $files = @(
            "morning-compass-$VoiceName.json",
            "morning-compass-feedback.jsonl",
            "morning-compass-actions.jsonl",
            "morning-compass-actions-rollup.json",
            "morning-compass-conversation.jsonl"
        )
        foreach ($f in $files) {
            $src = Join-Path $stateDir $f
            if (Test-Path $src) {
                Copy-Item $src -Destination (Join-Path $backupDir $f) -Force
            }
        }
        return @{ok = $true}
    } catch {
        return @{ok = $false; error = $_.Exception.Message}
    }
}

# === Stripe direct REST pre-fetch (architecture deviation — runner_pre_inject) ===
function Get-StripeRevenue {
    param([string]$RestrictedKey)
    if (-not $RestrictedKey) { return $null }

    $now              = [DateTimeOffset]::Now.ToUnixTimeSeconds()
    $sevenDaysAgo     = $now - (7 * 86400)
    $fourteenDaysAgo  = $now - (14 * 86400)
    $headers = @{ Authorization = "Bearer $RestrictedKey" }

    function Get-StripeChargesSum {
        param([int64]$Since, [int64]$Until)
        $sumCents = 0
        $startingAfter = $null
        do {
            $params = "limit=100&created[gte]=$Since"
            if ($Until) { $params += "&created[lt]=$Until" }
            if ($startingAfter) { $params += "&starting_after=$startingAfter" }
            try {
                $resp = Invoke-RestMethod -Uri "https://api.stripe.com/v1/charges?$params" -Headers $headers -TimeoutSec 10
            } catch {
                return $null
            }
            foreach ($c in $resp.data) {
                if ($c.status -eq "succeeded" -and -not $c.refunded) {
                    $sumCents += [int64]($c.amount - $c.amount_refunded)
                }
            }
            $startingAfter = if ($resp.data -and $resp.has_more) { $resp.data[-1].id } else { $null }
        } while ($startingAfter)
        return [math]::Round($sumCents / 100.0, 2)
    }

    $revenue7d      = Get-StripeChargesSum -Since $sevenDaysAgo -Until $now
    $revenuePrior7d = Get-StripeChargesSum -Since $fourteenDaysAgo -Until $sevenDaysAgo

    $openInvoicesCents = 0
    try {
        $inv = Invoke-RestMethod -Uri "https://api.stripe.com/v1/invoices?status=open&limit=100" -Headers $headers -TimeoutSec 10
        foreach ($i in $inv.data) { $openInvoicesCents += [int64]$i.amount_due }
    } catch {
        $openInvoicesCents = $null
    }
    $openInvoices = if ($null -eq $openInvoicesCents) { $null } else { [math]::Round($openInvoicesCents / 100.0, 2) }

    return @{
        revenue_7d       = $revenue7d
        revenue_prior_7d = $revenuePrior7d
        open_invoices    = $openInvoices
        fetched_at       = (Get-Date -Format o)
    }
}

try {
    # === Logging setup (Task 18) ===
    $logFile = "$env:USERPROFILE\.claude\state\morning-compass-runner.log"

    if (Test-Path $logFile) {
        $logAge = (Get-Date) - (Get-Item $logFile).LastWriteTime
        if ($logAge.TotalDays -gt 30) {
            $archived = "$logFile.$(Get-Date -Format yyyyMMdd).archive"
            Move-Item $logFile $archived
        }
    }

    $script:runId      = [guid]::NewGuid().ToString().Substring(0, 8)
    $script:runStarted = (Get-Date -Format o)

    function Write-Log {
        param([string]$Event, [hashtable]$Data = @{})
        $payload = @{
            ts     = (Get-Date -Format o)
            run_id = $script:runId
            mode   = $Mode
            voice  = $Voice
            event  = $Event
            data   = $Data
        }
        $line = $payload | ConvertTo-Json -Compress -Depth 10
        Add-Content -Path $logFile -Value $line
        Write-Output $line
    }

    # === Heartbeat (NEW 2026-05-21 per NSA Counsel review of inbox-digest pivot) ===
    # Writes ~/.claude/.morning-compass.last-run.json after every exit path so the
    # silent-rot failure mode (cron fires but produces nothing) is detectable by
    # the same grep pattern used for /inbox-digest heartbeats.
    $script:heartbeatPath = "$env:USERPROFILE\.claude\.morning-compass.last-run.json"

    function Write-Heartbeat {
        param(
            [string]$Status,
            [string]$ErrorMessage = $null,
            [hashtable]$Extra = @{}
        )

        # Resolve coach.mode from integrations.yml (best-effort regex parse — avoids YAML dep)
        $coachMode = "unknown"
        $modeKnown = $false
        $knownModes = @("full", "inbox_only", "weekly")
        try {
            $integMapPath = "$env:USERPROFILE\.claude\plugins\local\morning-compass\reference\coaches\$Voice\integrations.yml"
            if (Test-Path $integMapPath) {
                $yml = Get-Content $integMapPath -Raw
                if ($yml -match '(?m)^\s*mode:\s*([A-Za-z_]+)') {
                    $coachMode = $Matches[1]
                    $modeKnown = $knownModes -contains $coachMode
                }
            }
        } catch { }

        # Tripwire: unknown mode value = fail loud (Launch Operator / Fadell re-review)
        # Protects Phase 2 rename + future enum expansion from silent misroute. If $coachMode
        # is "unknown" or not in $knownModes, the heartbeat surfaces it explicitly.
        if (-not $modeKnown -and $Status -eq "ok") {
            $Status = "mode_unknown_tripwire"
            $ErrorMessage = "Parsed coach.mode='$coachMode' is not in known enum [$($knownModes -join ', ')]. Brief may have rendered in default fallback. Check integrations.yml for typo or new mode value."
        }

        $payload = [ordered]@{
            run_id      = $script:runId
            started     = $script:runStarted
            finished    = (Get-Date -Format o)
            status      = $Status
            coach_mode  = $coachMode
            runner_mode = $Mode
            voice       = $Voice
            error       = $ErrorMessage
        }
        foreach ($k in $Extra.Keys) { $payload[$k] = $Extra[$k] }

        try {
            $tmpPath = "$($script:heartbeatPath).tmp"
            $payload | ConvertTo-Json -Depth 10 | Set-Content -Path $tmpPath -NoNewline -Encoding UTF8
            Move-Item -Force -Path $tmpPath -Destination $script:heartbeatPath
        } catch {
            Write-Output "HEARTBEAT_WRITE_FAIL: $($_.Exception.Message)"
        }
    }

    Write-Log "RUN_START"

    # === Load env ===
    $envFile = "$env:USERPROFILE\.claude\.env.morning-compass"
    if (-not (Test-Path $envFile)) {
        Write-Log "ENV_MISSING" @{path=$envFile}
        Write-Heartbeat -Status "env_missing" -ErrorMessage "Missing env file: $envFile"
        exit 1
    }
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#=]+)=(.*)$") {
            Set-Item -Path "env:$($Matches[1].Trim())" -Value $Matches[2].Trim()
        }
    }

    # === Pre-flight checks (Task 16) ===
    function Test-Preflight {
        $issues = @()

        $voicePath = "$env:USERPROFILE\.claude\references\voice-profiles\$Voice\$Voice-voice.md"
        if (-not (Test-Path $voicePath)) {
            $issues += "VOICE_MISSING: $voicePath"
        }

        $stateFiles = @(
            "morning-compass-$Voice.json",
            "morning-compass-feedback.jsonl",
            "morning-compass-actions.jsonl",
            "morning-compass-actions-rollup.json",
            "morning-compass-conversation.jsonl"
        )
        foreach ($f in $stateFiles) {
            if (-not (Test-Path "$env:USERPROFILE\.claude\state\$f")) {
                $issues += "STATE_MISSING: $f"
            }
        }

        $integMap = "$env:USERPROFILE\.claude\plugins\local\morning-compass\reference\coaches\$Voice\integrations.yml"
        if (-not (Test-Path $integMap)) {
            $issues += "INTEGRATION_MAP_MISSING: $integMap"
        }

        if ($Mode -ne "dry-run") {
            try {
                $resp = Invoke-RestMethod -Uri "https://api.telegram.org/bot$env:TELEGRAM_BOT_TOKEN/getMe" -TimeoutSec 5
                if (-not $resp.ok) { $issues += "TELEGRAM_AUTH_FAIL" }
            } catch {
                $issues += "TELEGRAM_UNREACHABLE: $($_.Exception.Message)"
            }
        }

        if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
            $issues += "CLAUDE_CLI_MISSING"
        }

        return $issues
    }

    $preflightIssues = Test-Preflight
    if ($preflightIssues.Count -gt 0) {
        Write-Log "PREFLIGHT_FAIL" @{issues=$preflightIssues}
        Write-Heartbeat -Status "preflight_fail" -ErrorMessage ($preflightIssues -join "; ") -Extra @{preflight_issues=$preflightIssues}
        exit 1
    }
    Write-Log "PREFLIGHT_OK"

    # === Stripe pre-fetch (architecture deviation, runner_pre_inject) ===
    $runnerInputs = @{}
    $stripe = Get-StripeRevenue -RestrictedKey $env:STRIPE_RESTRICTED_KEY
    if ($null -eq $stripe -or $null -eq $stripe.revenue_7d) {
        Write-Log "STRIPE_FETCH_FAIL" @{note="revenue role will show data unavailable"}
    } else {
        $runnerInputs.revenue = $stripe
        Write-Log "STRIPE_FETCH_OK" @{revenue_7d=$stripe.revenue_7d; open_invoices=$stripe.open_invoices}
    }

    $runnerInputsPath = "$env:USERPROFILE\.claude\state\morning-compass-runner-inputs.json"
    $runnerInputs | ConvertTo-Json -Depth 10 | Set-Content -Path $runnerInputsPath -NoNewline

    # === Mode dispatch (Task 17) ===
    $flags = @()
    switch ($Mode) {
        "auto"         { $flags = @("--auto", "--telegram") }
        "refresh"      { $flags = @("--auto", "--telegram", "--refresh") }
        "check-missed" {
            $stateFile = "$env:USERPROFILE\.claude\state\morning-compass-$Voice.json"
            $state = Get-Content $stateFile | ConvertFrom-Json
            $now = Get-Date
            if ($state.last_brief_timestamp) {
                $lastRun = [DateTime]::Parse($state.last_brief_timestamp)
                $hoursSince = ($now - $lastRun).TotalHours
                if ($hoursSince -lt 18 -or $now.Hour -lt 5) {
                    Write-Log "CHECK_MISSED_SKIP" @{hours_since=[math]::Round($hoursSince,1)}
                    Write-Heartbeat -Status "check_missed_skip" -Extra @{hours_since=[math]::Round($hoursSince,1)}
                    exit 0
                }
            }
            $flags = @("--auto", "--telegram")
        }
        "dry-run"      { $flags = @("--auto", "--dry-run") }
        "manual"       { $flags = @("--telegram") }
    }
    $flags += @("--voice", $Voice)

    # === Spawn headless Claude ===
    # 2026-05-22: Switched from slash-command invocation (`claude -p /morning-compass ...`)
    # to natural-language invocation. Claude CLI v2.1.148 stopped recognizing slash commands
    # passed via -p (returns "Unknown command: /morning-compass"). Natural-language wrapper
    # lets the headless agent invoke the skill via the Skill tool, which is version-stable.
    $flagsStr = ($flags -join " ")
    $prompt = "Run the morning-compass skill in $Mode mode for voice $Voice. Use these arguments: $flagsStr. Runner pre-fetched data at: $runnerInputsPath. Follow the skill instructions exactly, deliver per the flags, and update all state files."
    Write-Log "SPAWN_START" @{command="(natural-language) morning-compass $flagsStr"; runner_inputs_path=$runnerInputsPath}

    # Snapshot last_brief_timestamp before spawn — primary success signal (state mutation).
    # Stdout-based detection is unreliable with natural-language invocation since the agent
    # prints a summary, not the full brief.
    $statePathPreSpawn = "$env:USERPROFILE\.claude\state\morning-compass-$Voice.json"
    $preSpawnTimestamp = $null
    if (Test-Path $statePathPreSpawn) {
        try {
            $preState = Get-Content $statePathPreSpawn -Raw | ConvertFrom-Json
            $preSpawnTimestamp = $preState.last_brief_timestamp
        } catch { }
    }

    $start = Get-Date
    $script:claudeOutputLines = @()
    $script:claudeOutputContent = ""
    & claude -p $prompt --permission-mode bypassPermissions 2>&1 | ForEach-Object {
        $line = "$_"
        Write-Log "CLAUDE_OUT" @{line=$line}
        $script:claudeOutputLines += $line
    }
    $script:claudeOutputContent = $script:claudeOutputLines -join "`n"
    $exitCode = $LASTEXITCODE
    $duration = ((Get-Date) - $start).TotalSeconds

    # Brief-content sanity check.
    # Primary signal: state file mutation (last_brief_timestamp changed during spawn).
    # Secondary signals: known error patterns in stdout, suspicious duration.
    $script:briefDegraded = $false
    $script:degradationReason = $null

    if ($exitCode -eq 0) {
        $postSpawnTimestamp = $null
        if (Test-Path $statePathPreSpawn) {
            try {
                $postState = Get-Content $statePathPreSpawn -Raw | ConvertFrom-Json
                $postSpawnTimestamp = $postState.last_brief_timestamp
            } catch { }
        }

        if ($script:claudeOutputContent -match "^Unknown command:") {
            $script:briefDegraded = $true
            $script:degradationReason = "claude_cli_unknown_command"
        } elseif ($script:claudeOutputContent -match "Configuration error in.+\.claude\.json|\.claude\.json is corrupted") {
            $script:briefDegraded = $true
            $script:degradationReason = "claude_json_corrupted"
        } elseif ($script:claudeOutputContent -match "Inbox data unavailable this morning") {
            $script:briefDegraded = $true
            $script:degradationReason = "vault_mcp_down"
        } elseif ($postSpawnTimestamp -eq $preSpawnTimestamp) {
            $script:briefDegraded = $true
            $script:degradationReason = "state_unchanged_skill_did_not_run"
        } elseif ($duration -lt 15 -and $Mode -ne "check-missed") {
            # inbox_only quiet-day path runs faster than the previous full-mode 30s floor.
            $script:briefDegraded = $true
            $script:degradationReason = "duration_under_15s_likely_no_brief"
        }
    }

    if ($exitCode -ne 0) {
        Write-Log "SPAWN_FAIL" @{exit=$exitCode; duration_s=[math]::Round($duration,1)}
        Write-Heartbeat -Status "spawn_fail" -ErrorMessage "Claude exited $exitCode" -Extra @{exit_code=$exitCode; duration_s=[math]::Round($duration,1)}
        exit $exitCode
    }
    Write-Log "SPAWN_OK" @{duration_s=[math]::Round($duration,1)}

    # === Backup state (Task 19, belt-and-suspenders with skill's own backup in Step 12) ===
    $backup = Backup-State -VoiceName $Voice
    if ($backup.ok) {
        Write-Log "BACKUP_OK"
    } else {
        Write-Log "BACKUP_FAIL" @{error=$backup.error}
    }

    if ($script:briefDegraded) {
        Write-Log "RUN_END" @{status="brief_degraded"; degradation_reason=$script:degradationReason}
        Write-Heartbeat -Status "brief_degraded" -ErrorMessage "Spawn exited 0 but brief content failed sanity check: $($script:degradationReason)" -Extra @{
            exit_code=0
            duration_s=[math]::Round($duration,1)
            backup_ok=$backup.ok
            degradation_reason=$script:degradationReason
            output_line_count=$script:claudeOutputLines.Count
        }
    } else {
        Write-Log "RUN_END" @{status="success"}
        Write-Heartbeat -Status "ok" -Extra @{exit_code=0; duration_s=[math]::Round($duration,1); backup_ok=$backup.ok; output_line_count=$script:claudeOutputLines.Count}
    }
}
catch {
    if (Get-Command Write-Log -ErrorAction SilentlyContinue) {
        Write-Log "RUN_FATAL" @{error=$_.Exception.Message; stack=$_.ScriptStackTrace}
    } else {
        Write-Output "RUN_FATAL_PRELOG: $($_.Exception.Message)"
    }
    if (Get-Command Write-Heartbeat -ErrorAction SilentlyContinue) {
        Write-Heartbeat -Status "fatal" -ErrorMessage $_.Exception.Message -Extra @{stack=$_.ScriptStackTrace}
    }
    exit 1
}
finally {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
