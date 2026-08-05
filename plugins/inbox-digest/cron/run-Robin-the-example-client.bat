@echo off
setlocal

REM ============================================================
REM Silent cron invocation of the inbox-digest Node CLI for the
REM Robin-the-example-client client. Fires from Task Scheduler 3x daily
REM at 09:00 / 13:00 / 18:00 local + sign-on catch-up (Task Scheduler
REM entry: ExampleScan).
REM
REM Robin is the DEPARTING CO-FOUNDER of <example-client>. This is a
REM TRANSITION WATCH (high priority), not a teammate scan — close
REM capture of exit/handoff threads (legal, equity, ops) while she
REM winds down. Her address is also in <example-client>'s roster, so exit threads
REM surface in both this watch and <example-client>'s brief. Retire when the
REM transition closes (Unregister-ScheduledTask -TaskName ExampleScan).
REM
REM Bypasses claude -p — uses the standalone Node CLI per
REM ~/.claude/skills/learned/oauth-credential-single-writer-rule.md
REM and patterns/python-sdk-orchestration-for-unattended-skills.md.
REM ============================================================

set LOGDIR=%LOCALAPPDATA%\inbox-digest-cron
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set TS=%date:~-4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%
set TS=%TS: =0%
set LOGFILE=%LOGDIR%\Robin-the-example-client-%TS%.log

set SCRIPT=%USERPROFILE%\.claude\plugins\local\inbox-digest\scripts\digest.js

echo [%date% %time%] inbox-digest Node CLI firing for Robin-the-example-client > "%LOGFILE%"

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

%NODE% "%SCRIPT%" --client Robin-the-example-client >> "%LOGFILE%" 2>&1

echo [%date% %time%] cron run complete (exit code %ERRORLEVEL%) >> "%LOGFILE%"

REM Rotate logs: keep last 30 days
forfiles /p "%LOGDIR%" /m Robin-the-example-client-*.log /d -30 /c "cmd /c del @path" 2>nul

endlocal
exit /b 0
