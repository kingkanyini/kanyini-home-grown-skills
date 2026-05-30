<#
.SYNOPSIS
  Paste-through 8 secret values from ~/.env.env into
  ~/.claude/.env.morning-compass.

.DESCRIPTION
  Implements the "paste-through" pattern referenced in setup.ps1 line 31.
  ~/.env.env is the master secrets file (per GOU
  bashrc-hardcoded-secrets-leak.md). The morning-compass runner reads
  ~/.claude/.env.morning-compass directly, so the secret values must be
  copied across.

  Idempotent: safe to re-run. Atomic: writes a temp file then moves it
  into place. Quiet: never echoes values to stdout — only key names and
  a status flag (UPDATED / UNCHANGED / NOT_IN_SOURCE).

.NOTES
  Run after editing ~/.env.env to refresh the morning-compass
  copy. Run after a key rotation in any of the 8 services.
#>

[CmdletBinding()]
param(
    [string]$Source = "$env:USERPROFILE\.env.env",
    [string]$Target = "$env:USERPROFILE\.claude\.env.morning-compass"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $Source)) { throw "Source not found: $Source" }
if (-not (Test-Path $Target)) { throw "Target not found: $Target" }

$keys = @(
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
    'TELEGRAM_WEBHOOK_SECRET',
    'TEST_BOT_TOKEN',
    'TEST_CHAT_ID',
    'TEST_WEBHOOK_SECRET',
    'COMPOSIO_API_KEY',
    'STRIPE_RESTRICTED_KEY'
)

# Parse source into hashtable. Strip optional surrounding quotes.
$srcMap = @{}
foreach ($line in Get-Content -LiteralPath $Source) {
    if ($line -match '^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)$') {
        $k = $Matches[1]
        $v = $Matches[2].Trim()
        if ($v -match '^"(.*)"$' -or $v -match "^'(.*)'$") { $v = $Matches[1] }
        $srcMap[$k] = $v
    }
}

# Read target, rewrite matching key lines.
$targetLines = Get-Content -LiteralPath $Target
$updated     = [System.Collections.Generic.List[string]]::new()
$unchanged   = [System.Collections.Generic.List[string]]::new()
$missing     = [System.Collections.Generic.List[string]]::new()

for ($i = 0; $i -lt $targetLines.Length; $i++) {
    $line = $targetLines[$i]
    if ($line -match '^([A-Z][A-Z0-9_]*)=(.*)$') {
        $k = $Matches[1]
        if ($keys -contains $k) {
            if (-not $srcMap.ContainsKey($k)) {
                $missing.Add($k) | Out-Null
                continue
            }
            $newLine = "$k=$($srcMap[$k])"
            if ($line -eq $newLine) {
                $unchanged.Add($k) | Out-Null
            } else {
                $targetLines[$i] = $newLine
                $updated.Add($k) | Out-Null
            }
        }
    }
}

# Atomic write: tmp + move.
$tmp = "$Target.tmp.$(Get-Random)"
try {
    Set-Content -LiteralPath $tmp -Value $targetLines -Encoding UTF8 -NoNewline:$false
    Move-Item -LiteralPath $tmp -Destination $Target -Force
} catch {
    if (Test-Path $tmp) { Remove-Item -LiteralPath $tmp -Force -ErrorAction SilentlyContinue }
    throw
}

Write-Host ""
Write-Host "Paste-through complete: $Target" -ForegroundColor Green
Write-Host "  Updated:        $($updated.Count) ($($updated -join ', '))"
Write-Host "  Unchanged:      $($unchanged.Count) ($($unchanged -join ', '))"
if ($missing.Count -gt 0) {
    Write-Host "  NOT_IN_SOURCE:  $($missing.Count) ($($missing -join ', '))" -ForegroundColor Yellow
}
Write-Host ""
