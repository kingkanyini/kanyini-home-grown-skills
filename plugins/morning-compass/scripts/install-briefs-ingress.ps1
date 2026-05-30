#requires -RunAsAdministrator
# Phase 3 of inbox-digest surfacing — add path-based ingress rule for /briefs/*
# to cloudflared config.yml on the morning-compass-tunnel.
#
# Sequence: backup -> write new config -> validate -> resolve a sample path ->
# restart service -> exit with status. If validation fails, restore the backup
# automatically before the service ever restarts.
#
# Idempotent: re-running detects the existing /briefs rule and exits no-op.

$ErrorActionPreference = "Stop"

$cfgDir   = "C:\Program Files (x86)\cloudflared"
$cfgPath  = Join-Path $cfgDir "config.yml"
$backup   = Join-Path $cfgDir ("config.yml.bak-{0}" -f (Get-Date -Format "yyyy-MM-dd"))
$cfdExe   = Join-Path $cfgDir "cloudflared.exe"
$svcName  = "morning-compass-tunnel"
$sampleUrl = "https://compass.<your-github-handle>.com/briefs/c/<example-client>/2026-05-17"

# Elevated processes can't be -RedirectStandardOutput'd by the launcher, so we
# write our own log to a known path the parent can tail after we exit.
$logPath = "~/AppData\Local\Temp\briefs-ingress-install.log"
Remove-Item -LiteralPath $logPath -ErrorAction SilentlyContinue
function Log($msg) {
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
  Write-Host $line
  Add-Content -LiteralPath $logPath -Value $line
}
Start-Transcript -Path "$logPath.transcript" -Force | Out-Null

if (-not (Test-Path $cfgPath)) {
  Log "CONFIG_MISSING $cfgPath"
  exit 2
}

$current = Get-Content -Raw -LiteralPath $cfgPath
if ($current -match "path:\s*['""]?\^\/briefs") {
  Log "ALREADY_INSTALLED"
  exit 0
}

# Build new content. Inserts the /briefs rule directly ABOVE the existing
# bare compass.<your-github-handle>.com rule so path-matching fires first.
$newContent = @'
tunnel: 230540d6-9dc1-49d4-9527-5bb828f89518
credentials-file: C:\Program Files (x86)\cloudflared\230540d6-9dc1-49d4-9527-5bb828f89518.json

ingress:
  - hostname: compass.<your-github-handle>.com
    path: ^/briefs(/.*)?$
    service: http://localhost:7374
  - hostname: compass.<your-github-handle>.com
    service: http://localhost:3000
  - service: http_status:404
'@

# Backup current
Copy-Item -LiteralPath $cfgPath -Destination $backup -Force
if (-not (Test-Path $backup)) {
  Log "BACKUP_FAIL"
  exit 3
}
Log "BACKUP_OK $backup"

# Write new config
Set-Content -LiteralPath $cfgPath -Value $newContent -Encoding UTF8 -NoNewline:$false
Log "WRITE_OK"

# Validate the new config. If invalid, restore backup and abort.
$validate = & $cfdExe tunnel --config $cfgPath ingress validate 2>&1
$validateExit = $LASTEXITCODE
Log "VALIDATE_EXIT=$validateExit"
$validate | ForEach-Object { Log "  $_" }
if ($validateExit -ne 0) {
  Copy-Item -LiteralPath $backup -Destination $cfgPath -Force
  Log "VALIDATE_FAIL_ROLLED_BACK"
  exit 4
}

# Verify the rule resolves the way we expect. Note: $rule is a string ARRAY
# (one line per stdout line), so -notmatch on the array filters elements
# instead of returning bool. Join into a single string for the predicate.
$rule = & $cfdExe tunnel --config $cfgPath ingress rule $sampleUrl 2>&1
Log "RULE_TEST:"
$rule | ForEach-Object { Log "  $_" }
$ruleJoined = ($rule -join "`n")
if ($ruleJoined -notmatch "localhost:7374") {
  Copy-Item -LiteralPath $backup -Destination $cfgPath -Force
  Log "RULE_TEST_FAIL_ROLLED_BACK (expected localhost:7374 in resolution of $sampleUrl)"
  exit 5
}
Log "RULE_TEST_OK"

# Restart the tunnel service
try {
  Restart-Service -Name $svcName -ErrorAction Stop
  Log "RESTART_OK"
} catch {
  Log "RESTART_FAIL $($_.Exception.Message)"
  Log "Manual recovery: Restart-Service -Name $svcName"
  exit 6
}

Start-Sleep -Seconds 4
$svcState = (Get-Service -Name $svcName).Status
Log "SERVICE_STATE=$svcState"
if ($svcState -ne "Running") {
  Log "SERVICE_NOT_RUNNING"
  exit 7
}

# Real readiness probe — service "Running" only proves the process exists, not
# that the tunnel forwards /briefs/* to localhost:7374 end-to-end. Hit the
# sample URL through the public tunnel; if non-2xx, restore backup + restart.
$probeUrl = $sampleUrl
$probeOk = $false
for ($i = 1; $i -le 6; $i++) {
  try {
    $r = Invoke-WebRequest -Uri $probeUrl -UseBasicParsing -TimeoutSec 8 -MaximumRedirection 0 -ErrorAction Stop
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 300) {
      Log "PROBE_OK status=$($r.StatusCode) attempt=$i"
      $probeOk = $true
      break
    } else {
      Log "PROBE_NON2XX status=$($r.StatusCode) attempt=$i"
    }
  } catch {
    Log "PROBE_FAIL attempt=$i message=$($_.Exception.Message)"
  }
  Start-Sleep -Seconds 2
}
if (-not $probeOk) {
  Copy-Item -LiteralPath $backup -Destination $cfgPath -Force
  try { Restart-Service -Name $svcName -ErrorAction Stop } catch { Log "ROLLBACK_RESTART_FAIL $($_.Exception.Message)" }
  Log "PROBE_FAIL_ROLLED_BACK after 6 attempts (12s total). Tunnel + viewer not serving $probeUrl."
  exit 8
}

Log "PHASE_3_DONE"
exit 0
