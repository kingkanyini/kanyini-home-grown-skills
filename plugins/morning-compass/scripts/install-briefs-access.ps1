# Phase 4 of inbox-digest surfacing — create Cloudflare Access application
# + Allow policy that gates compass.<your-github-handle>.com/briefs/* behind one-time PIN
# auth. The /briefs/* path requires auth; root compass.<your-github-handle>.com stays
# open so the Morning Compass bot webhook keeps working.
#
# Token is read from ~/.env.env (CLOUDFLARE_API_TOKEN=...) and never
# echoed to stdout or written to the log. Token verification fails loudly if
# missing or scoped wrong.
#
# Idempotent: re-running detects an existing app with the same domain+path and
# updates the policy in place instead of duplicating.

$ErrorActionPreference = "Stop"

$logPath = "$env:LOCALAPPDATA\briefs-access\install.log"
$logDir = [System.IO.Path]::GetDirectoryName($logPath)
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Force -Path $logDir | Out-Null }
Remove-Item -LiteralPath $logPath -ErrorAction SilentlyContinue
function Log($msg) {
  $line = "[$(Get-Date -Format 'HH:mm:ss')] $msg"
  Write-Host $line
  Add-Content -LiteralPath $logPath -Value $line
}

# ---- Load token from secrets file (never echo) -----------------------------

$secretsPath = "$env:USERPROFILE\.env.env"
if (-not (Test-Path $secretsPath)) {
  Log "SECRETS_FILE_MISSING $secretsPath"
  Log "Create the file and add: CLOUDFLARE_API_TOKEN=..."
  exit 2
}

$token = $null
foreach ($line in (Get-Content -LiteralPath $secretsPath)) {
  if ($line -match '^\s*export\s+') { $line = ($line -replace '^\s*export\s+', '') }
  if ($line -match '^\s*CLOUDFLARE_API_TOKEN\s*=\s*(.+?)\s*$') {
    $token = $Matches[1].Trim('"', "'")
    break
  }
}
if (-not $token) {
  Log "CLOUDFLARE_API_TOKEN_MISSING in $secretsPath"
  Log "Add: CLOUDFLARE_API_TOKEN=<token-from-dash.cloudflare.com>"
  exit 3
}
Log "TOKEN_LOADED length=$($token.Length) (not echoed)"

# ---- Verify the token ------------------------------------------------------

$headers = @{
  "Authorization" = "Bearer $token"
  "Content-Type"  = "application/json"
}

try {
  $verify = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $headers -Method Get
} catch {
  Log "TOKEN_VERIFY_FAIL $($_.Exception.Message)"
  exit 4
}

if (-not $verify.success) {
  Log "TOKEN_VERIFY_REJECTED $($verify.errors | ConvertTo-Json -Depth 4)"
  exit 4
}
Log "TOKEN_VERIFY_OK status=$($verify.result.status) id=$($verify.result.id)"

# Introspect the token's actual policies so we can diagnose 403s
try {
  $tokenDetail = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/$($verify.result.id)" -Headers $headers -Method Get
  if ($tokenDetail.success) {
    Log "TOKEN_POLICIES (what this token can actually do):"
    foreach ($p in $tokenDetail.result.policies) {
      $resources = if ($p.resources) { ($p.resources.PSObject.Properties | ForEach-Object { "$($_.Name)=$($_.Value)" }) -join ", " } else { "(no resources)" }
      $groups = if ($p.permission_groups) { ($p.permission_groups | ForEach-Object { $_.name }) -join " + " } else { "(no groups)" }
      Log "  effect=$($p.effect) groups=[$groups] resources=[$resources]"
    }
  } else {
    Log "TOKEN_DETAIL_READ_REJECTED — proceeding without introspection"
  }
} catch {
  Log "TOKEN_DETAIL_READ_FAIL $($_.Exception.Message) — proceeding without introspection"
}

# ---- Account ID — known from cloudflared tunnel credentials -----------------
# Tunnel 230540d6-9dc1-49d4-9527-5bb828f89518.json AccountTag = this value.
# If you ever rotate accounts, update here.

$accountId = "18760f3a6e551b46d2eb6757509bfe01"

# Sanity-check the token can read this account
try {
  $accountInfo = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId" -Headers $headers -Method Get
} catch {
  Log "ACCOUNT_READ_FAIL $($_.Exception.Message)"
  Log "Token may not be scoped to account $accountId. Re-create the token with"
  Log "Account Resources -> Include -> the account matching $accountId."
  exit 5
}

if (-not $accountInfo.success) {
  Log "ACCOUNT_READ_REJECTED $($accountInfo.errors | ConvertTo-Json -Depth 4)"
  exit 5
}
Log "ACCOUNT $($accountInfo.result.name) ($accountId)"

# ---- Idempotency: find existing Access app for compass.<your-github-handle>.com -----

$appName = "Brief Viewer · <your-github-handle>"
$appDomain = "compass.<your-github-handle>.com/briefs"
$allowEmail = "<your-email>"
$sessionDuration = "24h"

function Test-AccessEnabled {
  try {
    $r = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps?per_page=1" -Headers $headers -Method Get
    return $true
  } catch {
    return $false
  }
}

if (-not (Test-AccessEnabled)) {
  Log "ACCESS_NOT_ENABLED — attempting one-time Zero Trust org initialization"
  $orgBody = @{
    name = "<your-name> Zero Trust"
    auth_domain = "<your-username>.cloudflareaccess.com"
  } | ConvertTo-Json
  try {
    $org = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/organizations" -Headers $headers -Method Post -Body $orgBody
    if ($org.success) {
      Log "ZERO_TRUST_INIT_OK team=$($org.result.auth_domain)"
      Start-Sleep -Seconds 3
    } else {
      Log "ZERO_TRUST_INIT_REJECTED $($org.errors | ConvertTo-Json -Depth 4)"
      Log "Open https://dash.cloudflare.com/$accountId/access and click 'Get Started' to enable Access manually, then re-run this script."
      exit 6
    }
  } catch {
    Log "ZERO_TRUST_INIT_FAIL $($_.Exception.Message)"
    try { $body = $_.ErrorDetails.Message; if ($body) { Log "  body=$body" } } catch {}
    Log "Open https://dash.cloudflare.com/$accountId/access and click 'Get Started' to enable Access manually, then re-run this script."
    exit 6
  }
}

try {
  $apps = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps?per_page=200" -Headers $headers -Method Get
} catch {
  Log "APPS_LIST_FAIL $($_.Exception.Message)"
  try {
    $errBody = $_.ErrorDetails.Message
    if ($errBody) { Log "  cloudflare_response_body: $errBody" }
  } catch {}
  exit 6
}

$existing = $apps.result | Where-Object {
  ($_.domain -eq $appDomain) -or
  ($_.domain -match "^compass\.<your-github-handle>\.com/briefs(/.*)?$")
}

if ($existing) {
  $appId = if ($existing -is [array]) { $existing[0].id } else { $existing.id }
  Log "APP_EXISTS id=$appId — will update policy in place"
} else {
  # Create new app
  $createAppBody = @{
    name = $appName
    domain = $appDomain
    type = "self_hosted"
    session_duration = $sessionDuration
    auto_redirect_to_identity = $false  # show landing so PIN flow is intentional
    app_launcher_visible = $false
  } | ConvertTo-Json -Depth 4

  try {
    $createApp = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps" -Headers $headers -Method Post -Body $createAppBody
  } catch {
    Log "APP_CREATE_FAIL $($_.Exception.Message)"
    try { $body = $_.ErrorDetails.Message; Log "  body=$body" } catch {}
    exit 7
  }
  if (-not $createApp.success) {
    Log "APP_CREATE_REJECTED $($createApp.errors | ConvertTo-Json -Depth 4)"
    exit 7
  }
  $appId = $createApp.result.id
  Log "APP_CREATED id=$appId name=`"$appName`" domain=$appDomain"
}

# ---- Add/update Allow policy with one-time PIN -----------------------------

$policyName = "Allow <your-name> · one-time PIN"
$policyBody = @{
  name = $policyName
  decision = "allow"
  include = @(@{ email = @{ email = $allowEmail } })
  precedence = 1
} | ConvertTo-Json -Depth 6

# List existing policies on this app
try {
  $policies = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps/$appId/policies" -Headers $headers -Method Get
} catch {
  Log "POLICIES_LIST_FAIL $($_.Exception.Message)"
  exit 8
}

$existingPolicy = $policies.result | Where-Object { $_.name -eq $policyName -or $_.decision -eq "allow" }

if ($existingPolicy) {
  $policyId = if ($existingPolicy -is [array]) { $existingPolicy[0].id } else { $existingPolicy.id }
  try {
    $updatePolicy = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps/$appId/policies/$policyId" -Headers $headers -Method Put -Body $policyBody
  } catch {
    Log "POLICY_UPDATE_FAIL $($_.Exception.Message)"
    exit 9
  }
  Log "POLICY_UPDATED id=$policyId email=$allowEmail"
} else {
  try {
    $createPolicy = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/accounts/$accountId/access/apps/$appId/policies" -Headers $headers -Method Post -Body $policyBody
  } catch {
    Log "POLICY_CREATE_FAIL $($_.Exception.Message)"
    try { $body = $_.ErrorDetails.Message; Log "  body=$body" } catch {}
    exit 9
  }
  if (-not $createPolicy.success) {
    Log "POLICY_CREATE_REJECTED $($createPolicy.errors | ConvertTo-Json -Depth 4)"
    exit 9
  }
  Log "POLICY_CREATED id=$($createPolicy.result.id) email=$allowEmail"
}

# ---- Smoke probe — should now 302 to Cloudflare Access challenge -----------

Log "SMOKE_PROBE https://compass.<your-github-handle>.com/briefs/c/<example-client>/2026-05-17"
try {
  $r = Invoke-WebRequest -Uri "https://compass.<your-github-handle>.com/briefs/c/<example-client>/2026-05-17" -UseBasicParsing -MaximumRedirection 0 -ErrorAction Stop
  Log "  status=$($r.StatusCode) — UNEXPECTED (Access policy may not have propagated yet; Cloudflare takes ~30s)"
} catch {
  $sc = $_.Exception.Response.StatusCode.value__
  $loc = $_.Exception.Response.Headers.Location
  if ($sc -eq 302 -or $sc -eq 301) {
    if ("$loc" -match "cloudflareaccess\.com|/cdn-cgi/access") {
      Log "  SMOKE_OK status=$sc Location=$loc — Access challenge active"
    } else {
      Log "  REDIRECT_NON_ACCESS status=$sc Location=$loc — investigate"
    }
  } else {
    Log "  status=$sc message=$($_.Exception.Message)"
  }
}

Log "PHASE_4_DONE"
exit 0
