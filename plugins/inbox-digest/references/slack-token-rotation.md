# Slack Token Rotation Runbook (Sentinel)

**When to rotate:** a token leaked (pasted somewhere public, machine compromised, `.env.env` ACL found open), a scope-drift alert fired, or annual hygiene.

## Blast radius per app (why there are two tokens)

| Token | Can | Cannot |
|---|---|---|
| `SLACK_SCOUT_TOKEN` (example-client Capture) | READ history of the 7 capture channels + #command-center reactions | Post anything, anywhere |
| `SLACK_GUTSY_TOKEN` (Gutsy) | POST/edit its own messages in #command-center | Read any channel history |

A leaked Scout token exposes client comms history (serious — tell <example-client> if confirmed leaked, per good-faith disclosure). A leaked Gutsy token can only spam one private channel you're in.

## Rotation steps (per app, ~3 minutes)

1. https://api.slack.com/apps → select the app → **OAuth & Permissions**.
2. Click **Rotate** (or **Reinstall to Workspace** — reinstall keeps channel memberships; scopes unchanged = no re-invites needed).
3. Copy the new `xoxb-…` token.
4. Edit `~/.env.env` — replace the old value. Save.
5. Verify: `node scripts\slack.js --check` (both tokens authenticate, scopes match spec).
6. Watch the next scheduled sweep's digest arrive in `#command-center` (or run `node scripts\digest.js --client <example-client> --dry-run` immediately).

## If a token was CONFIRMED leaked

1. Rotate immediately (above) — the old token dies the moment a new one issues.
2. Check Slack's app **Event/Activity logs** (app page → basic info) for unfamiliar API usage.
3. Scout leak: review what history was reachable (the 7 channels), decide disclosure with <example-client>.
4. Note the incident + date at the bottom of this file.

## Incident log

*(none)*
