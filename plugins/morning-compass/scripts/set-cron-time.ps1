#requires -RunAsAdministrator
# Move MorningCompass-Daily to 9:00 AM local (ET). Idempotent — re-running
# with the same target time is a no-op. Logs to %TEMP%\set-cron-time.log.

$ErrorActionPreference = "Stop"
$logPath = "~/AppData\Local\Temp\set-cron-time.log"
Remove-Item -LiteralPath $logPath -ErrorAction SilentlyContinue
function Log($msg) {
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
  Write-Host $line
  Add-Content -LiteralPath $logPath -Value $line
}

$taskName = "MorningCompass-Daily"
# <your-name> works in ET; his Windows system is Pacific. 9 AM ET = 6 AM PT (system local).
# New-ScheduledTaskTrigger uses system local time, so we encode 6:00 AM here.
$targetTime = "6:00am"

$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if (-not $task) {
  Log "TASK_NOT_FOUND $taskName"
  exit 2
}

$before = $task.Triggers[0].StartBoundary
Log "BEFORE StartBoundary=$before"

$newTrigger = New-ScheduledTaskTrigger -Daily -At $targetTime
Set-ScheduledTask -TaskName $taskName -Trigger $newTrigger | Out-Null

$after = (Get-ScheduledTask -TaskName $taskName).Triggers[0].StartBoundary
Log "AFTER  StartBoundary=$after"
Log "DONE   target=$targetTime"
exit 0
