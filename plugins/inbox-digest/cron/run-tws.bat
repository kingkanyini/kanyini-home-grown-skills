@echo off
setlocal

REM ============================================================
REM Silent cron invocation of the inbox-digest Node CLI for the
REM tws-newsletter client (<your-org-email>).
REM Fires from Task Scheduler at logon + 13:00 + 18:00 local.
REM
REM Scans the SECOND OAuth credential set at ~/.gmail-mcp-tws/
REM (account routing via gmail_accounts frontmatter), files
REM newsletter replies into the vault, and auto-DRAFTS replies
REM into the info@ Drafts folder (never sends — <your-name> reviews
REM and sends manually). Phase 3 brief lists drafts awaiting
REM review with deep links.
REM
REM Phase 3 + the reply drafter require ANTHROPIC_API_KEY in
REM ~/.claude/.env. If missing, Phase 1+2 still file new threads
REM but no drafts or brief are generated.
REM ============================================================

set LOGDIR=%LOCALAPPDATA%\inbox-digest-cron
if not exist "%LOGDIR%" mkdir "%LOGDIR%"
set TS=%date:~-4%-%date:~-10,2%-%date:~-7,2%_%time:~0,2%-%time:~3,2%
set TS=%TS: =0%
set LOGFILE=%LOGDIR%\tws-%TS%.log

set SCRIPT=%USERPROFILE%\.claude\plugins\local\inbox-digest\scripts\digest.js

echo [%date% %time%] inbox-digest Node CLI firing for tws-newsletter > "%LOGFILE%"

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

%NODE% "%SCRIPT%" --client tws-newsletter >> "%LOGFILE%" 2>&1
set NODE_RC=%ERRORLEVEL%

echo [%date% %time%] cron run complete (exit code %NODE_RC%) >> "%LOGFILE%"

REM Rotate logs: keep last 30 days
forfiles /p "%LOGDIR%" /m tws-*.log /d -30 /c "cmd /c del @path" 2>nul

REM endlocal & exit on ONE line: endlocal discards NODE_RC, & expands it first.
endlocal & exit /b %NODE_RC%
