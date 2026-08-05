@echo off
setlocal

REM ============================================================
REM Silent cron invocation of the inbox-digest Node CLI for the
REM <example-client> client. Fires from Task Scheduler at
REM logon + 08:00 + 12:00 + 18:00 ET. On a brief-writing run it
REM also fires the time-of-day Compass via fire-compass.ps1.
REM
REM This replaces the deprecated `claude -p` path — claude's
REM headless mode does not dispatch local plugin slash commands
REM (Anthropic Claude Code GitHub issues #29022, #30649, #34667,
REM #56194). The Node CLI is self-contained: bypasses Claude
REM Code entirely, talks to Gmail API directly using the same
REM OAuth tokens at ~/.gmail-mcp/credentials.json that gongrzhe
REM uses, and calls Anthropic API for brief synthesis using
REM ANTHROPIC_API_KEY from ~/.claude/.env.
REM
REM Phase 3 (brief synthesis) requires ANTHROPIC_API_KEY in
REM ~/.claude/.env. If missing, Phase 1+2 still file new threads
REM and download attachments, but no brief is generated.
REM ============================================================

set LOGDIR=%LOCALAPPDATA%\inbox-digest-cron
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set TS=%date:~-4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%
set TS=%TS: =0%
set LOGFILE=%LOGDIR%\<example-client>-%TS%.log

set SCRIPT=%USERPROFILE%\.claude\plugins\local\inbox-digest\scripts\digest.js

echo [%date% %time%] inbox-digest Node CLI firing for <example-client> > "%LOGFILE%"

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

%NODE% "%SCRIPT%" --client <example-client> >> "%LOGFILE%" 2>&1
set NODE_RC=%ERRORLEVEL%

echo [%date% %time%] cron run complete (exit code %NODE_RC%) >> "%LOGFILE%"

REM ============================================================
REM Event-driven Compass send. fire-compass.ps1 decides whether to
REM fire (brief written this run? clock band? 20-min brake?) and
REM triggers MorningCompass-Afternoon/-Evening. It never throws and
REM never touches NODE_RC. Prefer pwsh 7; fall back to Windows PS 5.1.
REM ============================================================
set PWSH=C:\Program Files\PowerShell\7\pwsh.exe
if not exist "%PWSH%" set PWSH=powershell.exe
"%PWSH%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0fire-compass.ps1" -Slug <example-client> >> "%LOGFILE%" 2>&1

REM Rotate logs: keep last 30 days
forfiles /p "%LOGDIR%" /m <example-client>-*.log /d -30 /c "cmd /c del @path" 2>nul

REM endlocal & exit on ONE line: endlocal discards NODE_RC, & expands it first.
endlocal & exit /b %NODE_RC%
