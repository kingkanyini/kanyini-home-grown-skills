# Command Center Sentinel — Slack Setup Runbook (M0)

**Spec:** `~/.claude/docs/superpowers/specs/2026-07-02-command-center-sentinel-design.md` (§2 apps/scopes, §5 tokens)
**Who does this:** <your-name>, manually, at api.slack.com — signed into **<example-client> workspace**.
**Time:** ~40 minutes, once. Nothing here is reversible-scary; worst case you delete an app and redo it.

> **Parent-spec amendment (record-keeping):** the Scout below IS the parent Command Center spec's
> "Command Center Capture" app, renamed **"example-client Capture"**, with `reactions:read` added
> BEFORE first install (Quest A's capture-app install never executed — confirmed 2026-07-02, so
> this costs zero reinstall/rotation). This note satisfies spec §10 DoD box 1's amendment record.

---

## Step 1 — Create App 1: "example-client Capture" (the Scout — read-only)

1. Go to https://api.slack.com/apps → **Create New App** → **From scratch**.
2. Name: `example-client Capture`. Workspace: **<example-client>**.
3. Left sidebar → **OAuth & Permissions** → **Scopes → Bot Token Scopes**. Add EXACTLY these five, nothing else:
   - `channels:history`
   - `groups:history`
   - `channels:read`
   - `groups:read`
   - `reactions:read`
   - ❌ NO `chat:write`. ❌ NO user scopes. ❌ NO admin scopes. (The sweep asserts this list every run — extra scopes will trigger a drift alert.)
4. Top of the same page → **Install to Workspace** → Allow.
5. Copy the **Bot User OAuth Token** (`xoxb-…`). This is `SLACK_SCOUT_TOKEN` (Step 5).

## Step 2 — Create App 2: "Gutsy" (the Herald — write-only)

1. **Create New App** → From scratch. Name: `Gutsy`. Workspace: <example-client>.
2. **OAuth & Permissions → Bot Token Scopes**: add EXACTLY one:
   - `chat:write`
3. **Basic Information → Display Information**: set the display name **Gutsy** and upload an avatar (example-client branded).
4. **Install to Workspace** → Allow. Copy the Bot User OAuth Token → `SLACK_GUTSY_TOKEN`.

## Step 3 — Create the briefing room: `#command-center`

1. In Slack: create a **private** channel named `command-center`.
2. Members: **you + the two bots only.** Invite both: `/invite @Gutsy` and `/invite @example-client Capture`.
   - Gutsy posts the digests. The Scout must ALSO be a member — it reads your ✅/🚫 reactions and replies (that's its only job in this channel; its content is never captured as client comms).
3. Do NOT invite anyone else. This is your private intel channel inside the client's workspace — treat everything posted there as living in <example-client>'s data estate (the digest is designed for that: no `#<your-username>-<example-client>` quotes ever render there).

## Step 4 — Invite the Scout to the 7 capture channels

`/invite @example-client Capture` in each of:

| Channel | Notes |
|---|---|
| `#general` | |
| `#announcements` | |
| `#team-ops` | |
| `#<your-username>-<example-client>` | private — invite from within the channel |
| `#orders` | |
| `#email-sequences` | |
| `#booked-calls` | |

**NEVER invite either bot to:** `#compliance`, `#Alex-tasks`, `#Robin-handoff`. (Code refuses to fetch them even if someone does — but don't.)

## Step 5 — Record IDs and tokens

1. **Channel IDs** (11 total): for each of the 8 channels above + the 3 forbidden ones — open the channel → click its name → scroll to the bottom of the About tab → copy the **Channel ID** (`C…` / `G…`).
2. **Your Slack user ID**: your profile → ⋮ → **Copy member ID** (`U…`).
3. Add the tokens to `~/.env.env` (the file `util.js loadEnv()` already reads — it lives OUTSIDE the vault, git, and Dropbox sync):
   ```
   SLACK_SCOUT_TOKEN=xoxb-...
   SLACK_GUTSY_TOKEN=xoxb-...
   ```
4. Verify the file's ACL is user-only (PowerShell): `icacls $env:USERPROFILE\.env.env` — should show only your user + SYSTEM/Administrators. If it shows `Everyone` or `Users`, fix: `icacls $env:USERPROFILE\.env.env /inheritance:r /grant:r "$env:USERNAME:(F)"`.
5. Hand the channel IDs + your user ID to Claude — they go into the client hub's `slack:` frontmatter block (allowlist, by ID) and the code deny-list.

## Step 6 — Verify

```powershell
node "$env:USERPROFILE\.claude\plugins\local\inbox-digest\scripts\slack.js" --check
```
This authenticates both tokens, prints each app's granted scopes, and PASSES only if they match the spec lists exactly.

## Step 7 — Capability card (after M4 ships)

```powershell
node "$env:USERPROFILE\.claude\plugins\local\inbox-digest\scripts\digest-post.js" --post-capability-card
```
Gutsy posts its introduction card in `#command-center`. **Pin it manually** (hover the message → ⋮ → Pin to channel). Gutsy has no `pins:write` on purpose.

---

## Backfill (run AFTER staged rollout — see M8)

Slack backfill is a **manual, attended, resumable** operation — never let it run inside a cron slot.
At the API tier this app gets (~1 request/minute on history/replies, ≤15 messages per call), a
30-day multi-channel backfill takes **hours by design**. It holds cursors mid-run and resumes where
it left off, so you can stop and restart freely.

```powershell
node scripts\digest.js --client <example-client> --since 2026-06-01
```

Run it in a terminal you can watch, after the `#team-ops`-only staged sweep has been eyeballed and
the remaining channels are enabled.
