# sentinel-watchdog.ps1 — standalone dead-man's watch for the Sentinel sweep (spec §6).
# A dead process cannot self-report, so this runs as its OWN scheduled task
# (SentinelWatchdog.xml), never inside the sweep.
#
# Per-slot expectation: sweep slots fire locally at 08:00 / 12:00 / 18:00. If a slot's
# expected run time + 90 minutes has passed and the client heartbeat shows no run
# FINISHING after that slot time, raise a Windows toast (BurntToast preferred,
# msg.exe fallback — house pattern from vault_audit/notify/toast.py).
# The watchdog writes its OWN heartbeat so a dead watchdog is distinguishable from
# a healthy-quiet one.

param(
  [string]$Slug = "<example-client>",
  [int[]]$SlotHours = @(8, 12, 18),
  [int]$GraceMinutes = 90
)

$ErrorActionPreference = "Stop"
$home_ = [Environment]::GetFolderPath("UserProfile")
$hbPath = Join-Path $home_ ".claude\.inbox-digest-$Slug.last-run.json"
$selfHbPath = Join-Path $home_ ".claude\.sentinel-watchdog.last-run.json"

function Send-Toast([string]$Title, [string]$Message) {
  $clean = { param($s) ($s -replace '[\x00-\x1F]', ' ').Substring(0, [Math]::Min($s.Length, 200)) }
  $t = & $clean $Title; $m = & $clean $Message
  try {
    if (Get-Module -ListAvailable -Name BurntToast) {
      New-BurntToastNotification -Text $t, $m
      return $true
    }
  } catch { }
  try {
    & msg.exe $env:USERNAME "${t}: ${m}" 2>$null
    return $true
  } catch { }
  return $false
}

$now = Get-Date
$today = $now.Date
$alerts = @()

# Which slots are DUE (expected time + grace has passed) today?
$dueSlots = @()
foreach ($h in $SlotHours) {
  $slotTime = $today.AddHours($h)
  if ($now -gt $slotTime.AddMinutes($GraceMinutes)) { $dueSlots += $slotTime }
}

if ($dueSlots.Count -gt 0) {
  $lastFinished = $null
  $lastStatus = "no-heartbeat-file"
  if (Test-Path $hbPath) {
    try {
      $hb = Get-Content $hbPath -Raw | ConvertFrom-Json
      $lastStatus = $hb.status
      if ($hb.finished) { $lastFinished = [DateTime]::Parse($hb.finished).ToLocalTime() }
    } catch {
      $lastStatus = "heartbeat-unparseable"
    }
  }
  # The LATEST due slot must have a run finishing at/after its slot time.
  $latestDue = ($dueSlots | Sort-Object)[-1]
  if (-not $lastFinished -or $lastFinished -lt $latestDue) {
    $slotLabel = $latestDue.ToString("HH:mm")
    $alerts += "Sentinel sweep MISSED its $slotLabel slot for $Slug (last: $lastStatus $(if ($lastFinished) { $lastFinished.ToString('MM-dd HH:mm') } else { 'never' })). Check Task Scheduler 'InboxDigest' + logs."
  } elseif ($lastStatus -eq "failed") {
    $alerts += "Sentinel sweep for $Slug is FAILING (status=failed at $($lastFinished.ToString('HH:mm'))). Check logs."
  }
}

foreach ($a in $alerts) {
  Write-Output "ALERT: $a"
  Send-Toast "Sentinel Watchdog" $a | Out-Null
}
if ($alerts.Count -eq 0) {
  Write-Output "ok: no due slot missed"
  # Recovery toast: if the PREVIOUS watchdog run alerted AND a due slot was actually
  # verified healthy this run, tell the user it cleared. The $dueSlots gate prevents a
  # false "healthy again" on a vacuous pass (e.g. early-morning run before any slot is
  # due, when nothing was checked). alerts>0 in the self-heartbeat acts as a recovery
  # latch, reset by the heartbeat write below — so this fires once per recovery.
  if ($dueSlots.Count -gt 0 -and (Test-Path $selfHbPath)) {
    try {
      $prev = Get-Content $selfHbPath -Raw | ConvertFrom-Json
      if ($prev.PSObject.Properties['alerts'] -and [int]$prev.alerts -gt 0) {
        $msg = "Sentinel sweep for $Slug is healthy again. Previous alert cleared."
        Write-Output "RECOVERED: $msg"
        Send-Toast "Sentinel Watchdog" $msg | Out-Null
      }
    } catch { Write-Output "warn: recovery-check skipped (unreadable self-heartbeat): $_" }
  }
}

# Watchdog's own heartbeat — a dead watchdog is distinguishable from a quiet one.
# On a VACUOUS run (no slot due yet, nothing verified) carry the previous alerts value
# forward instead of resetting it, so the recovery latch survives an early-morning run
# and the genuine recovery after the next sweep still gets its toast.
$hbAlerts = $alerts.Count
if ($dueSlots.Count -eq 0 -and (Test-Path $selfHbPath)) {
  try {
    $prevHb = Get-Content $selfHbPath -Raw | ConvertFrom-Json
    if ($prevHb.PSObject.Properties['alerts'] -and [int]$prevHb.alerts -gt 0) { $hbAlerts = [int]$prevHb.alerts }
  } catch { Write-Output "warn: latch carry-forward skipped (unreadable self-heartbeat): $_" }
}
@{
  checked_iso = (Get-Date).ToUniversalTime().ToString("o")
  slug        = $Slug
  alerts      = $hbAlerts
  status      = "ok"
} | ConvertTo-Json | Set-Content -Path "$selfHbPath.tmp" -Encoding UTF8
Move-Item -Path "$selfHbPath.tmp" -Destination $selfHbPath -Force

exit 0
