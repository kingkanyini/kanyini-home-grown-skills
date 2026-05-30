@echo off
setlocal

REM ============================================================
REM Silent cron invocation of the inbox-digest Node CLI for the
REM jen-the-gut-center client. Fires from Task Scheduler 1x daily
REM at 9:00 AM local (separate Task Scheduler entry: JenScan).
REM
REM Jen is a sub-engagement under <your-related-note> — same
REM Gut Center client engagement, different team member. Priority
REM is medium so multi-client conflict resolution files overlapping
REM threads (Jen-from-<example-client> emails) under <example-client> (high priority).
REM Jen's brief catches direct-to-Jen activity that isn't already
REM covered by <example-client>'s match channels.
REM
REM Bypasses claude -p — uses the standalone Node CLI per
REM ~/.claude/skills/learned/oauth-credential-single-writer-rule.md
REM and patterns/python-sdk-orchestration-for-unattended-skills.md.
REM ============================================================

set LOGDIR=%LOCALAPPDATA%\inbox-digest-cron
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set TS=%date:~-4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%
set TS=%TS: =0%
set LOGFILE=%LOGDIR%\jen-the-gut-center-%TS%.log

set SCRIPT=%USERPROFILE%\.claude\plugins\local\inbox-digest\scripts\digest.js

echo [%date% %time%] inbox-digest Node CLI firing for jen-the-gut-center > "%LOGFILE%"

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

%NODE% "%SCRIPT%" --client jen-the-gut-center >> "%LOGFILE%" 2>&1

echo [%date% %time%] cron run complete (exit code %ERRORLEVEL%) >> "%LOGFILE%"

REM Rotate logs: keep last 30 days
forfiles /p "%LOGDIR%" /m jen-the-gut-center-*.log /d -30 /c "cmd /c del @path" 2>nul

endlocal
exit /b 0
