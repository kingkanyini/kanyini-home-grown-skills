@echo off
setlocal

REM ============================================================
REM Silent cron invocation of the inbox-digest Node CLI for the
REM Alex-the-example-client client. Fires from Task Scheduler 3x daily
REM at 09:00 / 13:00 / 18:00 local + sign-on catch-up (Task Scheduler
REM entry: ExampleScanTwo).
REM
REM Alex is a sub-engagement under [[<example-client>]] — same
REM example-client client engagement, different team member (Outsourced
REM Doers VA). Priority is medium so multi-client conflict resolution
REM files overlapping threads (Alex-from-<example-client> emails) under <example-client>
REM (high priority). Alex's brief catches direct-to-Alex activity
REM that isn't already covered by <example-client>'s match channels.
REM
REM Bypasses claude -p — uses the standalone Node CLI per
REM ~/.claude/skills/learned/oauth-credential-single-writer-rule.md
REM and patterns/python-sdk-orchestration-for-unattended-skills.md.
REM ============================================================

set LOGDIR=%LOCALAPPDATA%\inbox-digest-cron
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set TS=%date:~-4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%
set TS=%TS: =0%
set LOGFILE=%LOGDIR%\Alex-the-example-client-%TS%.log

set SCRIPT=%USERPROFILE%\.claude\plugins\local\inbox-digest\scripts\digest.js

echo [%date% %time%] inbox-digest Node CLI firing for Alex-the-example-client > "%LOGFILE%"

REM Resolve node from common locations (PATH may not be inherited by Task Scheduler)
where node >nul 2>&1
if errorlevel 1 (
  if exist "C:\Program Files\nodejs\node.exe" set NODE="C:\Program Files\nodejs\node.exe"
  if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set NODE="%LOCALAPPDATA%\Programs\nodejs\node.exe"
) else (
  set NODE=node
)

if not defined NODE (
  echo [%date% %time%] FATAL: node not found in PATH or common install locations >> "%LOGFILE%"
  exit /b 2
)

%NODE% "%SCRIPT%" --client Alex-the-example-client >> "%LOGFILE%" 2>&1

echo [%date% %time%] cron run complete (exit code %ERRORLEVEL%) >> "%LOGFILE%"

REM Rotate logs: keep last 30 days
forfiles /p "%LOGDIR%" /m Alex-the-example-client-*.log /d -30 /c "cmd /c del @path" 2>nul

endlocal
exit /b 0
