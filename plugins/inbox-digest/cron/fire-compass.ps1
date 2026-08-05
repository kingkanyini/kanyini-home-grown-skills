<#
.SYNOPSIS
  Event-driven Compass trigger. Called by run-example.bat AFTER a digest run.
  Fires the time-of-day MorningCompass on-demand task ONLY when this run wrote a brief.

.DESCRIPTION
  Detection: per-slug digest heartbeat `~/.claude/.inbox-digest-<slug>.last-run.json`
  has `brief_path` non-null exactly when a brief was written this run (covers reply/merged
  threads where new_threads==0). We do NOT parse stdout (it's piped to a logfile; the ✓ glyph
  is unreliable across code pages).

  Band: hour<11 -> nothing (the 09:00 MorningCompass-Daily owns morning); 11-16 -> Afternoon;
  16-22 -> Evening; else nothing.

  Min-interval brake: skip if a Compass send finished < 20 min ago (reuses the compass heartbeat
  `~/.claude/.morning-compass.last-run.json` — no new state file). Prevents an accumulated-state
  double-buzz when a logon catch-up digest fires in the same band as a scheduled run.

  This script never throws to the caller and never affects the digest's exit code.
#>
param([string]$Slug = '<example-client>')

try {
  $hbPath = Join-Path $env:USERPROFILE ".claude\.inbox-digest-$Slug.last-run.json"
  if (-not (Test-Path $hbPath)) { return }
  $hb = Get-Content $hbPath -Raw | ConvertFrom-Json

  # 1. Only fire if a brief was actually written this run.
  if ([string]::IsNullOrEmpty($hb.brief_path)) { return }

  # 2. Clock band -> label. Morning/overnight handled by the scheduled 09:00 Daily.
  $hour = (Get-Date).Hour
  $label = if     ($hour -ge 11 -and $hour -lt 16) { 'Afternoon' }
           elseif ($hour -ge 16 -and $hour -lt 22) { 'Evening' }
           else { $null }
  if (-not $label) { return }

  # 3. Min-interval brake (20 min) off the compass heartbeat.
  $compassHb = Join-Path $env:USERPROFILE ".claude\.morning-compass.last-run.json"
  if (Test-Path $compassHb) {
    try {
      $c = Get-Content $compassHb -Raw | ConvertFrom-Json
      # Brake ONLY against an actual DELIVERY (status=ok). A failed send
      # (preflight_fail / spawn_fail / brief_degraded / mutex_held) writes a fresh
      # `finished` too — keying on that would turn a transient Telegram blip into a
      # 20-min delivery blackout. The age>=0 guard defends against any clock skew.
      if ($c.finished -and $c.status -eq 'ok') {
        $age = (Get-Date) - [DateTime]::Parse($c.finished)
        if ($age.TotalMinutes -ge 0 -and $age.TotalMinutes -lt 20) {
          Write-Output "fire-compass: SKIP $label (last DELIVERED $([int]$age.TotalMinutes)m ago, < 20m brake)"
          return
        }
      }
    } catch { }   # unreadable heartbeat -> don't block the send
  }

  # 4. Fire the on-demand task (detached; runs in its own process tree under Task Scheduler).
  Write-Output "fire-compass: firing MorningCompass-$label (brief=$([System.IO.Path]::GetFileName($hb.brief_path)))"
  & schtasks.exe /Run /TN "MorningCompass-$label" | Out-Null
  if ($LASTEXITCODE -ne 0) { Write-Output "fire-compass: WARNING schtasks /Run rc=$LASTEXITCODE (task missing or denied?)" }
} catch {
  Write-Output "fire-compass: ERROR (non-fatal) $($_.Exception.Message)"
}
