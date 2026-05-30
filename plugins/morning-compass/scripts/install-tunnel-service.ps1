<#
.SYNOPSIS
  Install/repair the morning-compass-tunnel NSSM service that runs cloudflared
  as the persistent tunnel for compass.<your-github-handle>.com.

.DESCRIPTION
  Replaces the broken default `Cloudflared` Windows service installed by
  `cloudflared service install`. That service launched cloudflared with no
  args, which caused it to reset config.yml in the install dir to a 49-byte
  stub and never connect to the edge.

  This NSSM service launches cloudflared with an EXPLICIT --config flag, so
  cloudflared never touches its default-config-discovery path. Runs as
  LocalSystem (NSSM default), no password storage required.

  Idempotent: safe to re-run. If the morning-compass-tunnel service already
  exists, it's stopped and removed before re-install so settings are clean.

.NOTES
  REQUIRES ELEVATION (admin). Spawn via:
    Start-Process pwsh -Verb RunAs -ArgumentList '-NoProfile','-File','<this>'

  After this script:
    - Existing `Cloudflared` SYSTEM service is removed
    - Fresh config.yml at C:\Program Files (x86)\cloudflared\config.yml
    - morning-compass-tunnel NSSM service installed + auto-start on boot
    - cloudflared running with edge connection to atl* / regional cluster
#>

[CmdletBinding()]
param(
    [string]$TunnelUUID = '230540d6-9dc1-49d4-9527-5bb828f89518',
    [string]$Hostname   = 'compass.<your-github-handle>.com',
    [int]   $LocalPort  = 3000,
    [string]$CfDir      = 'C:\Program Files (x86)\cloudflared'
)

$ErrorActionPreference = 'Stop'
$logPath = "$env:USERPROFILE\.claude\state\morning-compass-cf-install.log"
if (Test-Path $logPath) { Remove-Item $logPath -Force }

function Log($msg) {
    $msg | Tee-Object -FilePath $logPath -Append | Out-Host
}

# Verify elevation
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { throw "This script requires elevation. Run from an admin PowerShell." }

try {
    Log "=== 1. Stop user-mode cloudflared (if any) ==="
    Get-Process -Name cloudflared -ErrorAction SilentlyContinue | ForEach-Object {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
        Log "killed PID $($_.Id)"
    }
    Start-Sleep -Seconds 2

    Log ""
    Log "=== 2. Uninstall existing Cloudflared SYSTEM service ==="
    $cfExe = Join-Path $CfDir 'cloudflared.exe'
    if (-not (Test-Path $cfExe)) { throw "cloudflared.exe not found at $cfExe" }
    & $cfExe service uninstall 2>&1 | Out-String | ForEach-Object { Log $_.Trim() }
    Start-Sleep -Seconds 2
    sc.exe delete Cloudflared 2>&1 | Out-String | ForEach-Object { Log $_.Trim() }
    Start-Sleep -Seconds 1

    Log ""
    Log "=== 3. Write fresh config.yml ==="
    $credsFile = Join-Path $CfDir "$TunnelUUID.json"
    if (-not (Test-Path $credsFile)) { throw "Credentials file missing at $credsFile. Copy from ~/.cloudflared/$TunnelUUID.json first." }
    $configContent = @"
tunnel: $TunnelUUID
credentials-file: $credsFile

ingress:
  - hostname: $Hostname
    service: http://localhost:$LocalPort
  - service: http_status:404
"@
    $configPath = Join-Path $CfDir 'config.yml'
    Set-Content -Path $configPath -Value $configContent -Encoding UTF8 -Force
    $size = (Get-Item $configPath).Length
    Log "config.yml written: $size bytes"

    Log ""
    Log "=== 4. NSSM install morning-compass-tunnel ==="
    $svc = "morning-compass-tunnel"
    $existing = nssm status $svc 2>&1
    if ($existing -match "SERVICE_") {
        Log "service already exists; removing for clean re-install"
        nssm stop $svc 2>&1 | Out-String | ForEach-Object { Log $_.Trim() }
        Start-Sleep -Seconds 2
        Get-Process -Name cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
        nssm remove $svc confirm 2>&1 | Out-String | ForEach-Object { Log $_.Trim() }
        Start-Sleep -Seconds 1
    }
    $cfArgs = '--config "' + $configPath + '" tunnel run morning-compass'
    nssm install $svc $cfExe 2>&1 | Out-String | ForEach-Object { Log $_.Trim() }
    nssm set $svc AppParameters $cfArgs 2>&1 | Out-String | ForEach-Object { Log $_.Trim() }
    nssm set $svc AppDirectory $CfDir 2>&1 | Out-String | ForEach-Object { Log $_.Trim() }
    nssm set $svc AppStdout "$env:USERPROFILE\.claude\state\morning-compass-tunnel.log" 2>&1 | Out-Null
    nssm set $svc AppStderr "$env:USERPROFILE\.claude\state\morning-compass-tunnel.err.log" 2>&1 | Out-Null
    nssm set $svc AppRotateOnline 1 2>&1 | Out-Null
    nssm set $svc AppRotateBytes 10485760 2>&1 | Out-Null
    nssm set $svc Start SERVICE_AUTO_START 2>&1 | Out-Null

    Log ""
    Log "=== 5. Start service ==="
    nssm start $svc 2>&1 | Out-String | ForEach-Object { Log $_.Trim() }
    Start-Sleep -Seconds 5
    $status = nssm status $svc
    Log "status: $status"

    Log ""
    Log "=== Done ==="
}
catch {
    Log "ERROR: $_"
    Log $_.ScriptStackTrace
    exit 1
}
