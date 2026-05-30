# Feedback + Support Channels

The marketplace ships with no telemetry, no SLA, and no automatic issue detection. If something breaks, the only way Kanyini will know is if you report it. Here's how.

## Reporting a broken skill

Use the **GitHub Issues** templates:

- **Skill broken** — a specific skill isn't working as expected: open via `.github/ISSUE_TEMPLATE/skill-broken.md`
- **Prereq setup failed** — you can't get a skill's prerequisites installed: open via `.github/ISSUE_TEMPLATE/prereq-failed.md`

Both templates ask for the output of the skill's `preflight.mjs` script — please include it. The diagnosis is usually obvious from the `MISSING:` lines.

To file: go to the repo's Issues tab → New Issue → pick a template.

## Asking a question (not a bug)

For questions, feature requests, or "is there a skill for X?":

- **Designated community channel** — see your invitation email for the link (Skool / Slack / Discord, depending on which community you're in)

Discussion threads are public to the community; Issues are public to anyone with repo access.

## Reaching Kanyini directly

For license questions, custom-use arrangements, or anything that shouldn't be public:

- Reply to the invitation email
- Or reach out via the community channel's DM

Response time is **best-effort, no SLA**. Expect days, not hours.

## Suggesting a new skill

If you have an idea for a skill that should exist in the marketplace, mention it in the community channel. Most additions will land in Phase 2 (T0 Bootstrap) or Phase 3 (pre-revenue skills) — see [`UPGRADING.md`](UPGRADING.md) for the release roadmap.

## What NOT to do

- ❌ Don't fork the repo and publish your own version (license violation — see [`MARKETPLACE-CONTRACT.md`](MARKETPLACE-CONTRACT.md))
- ❌ Don't share the install URL or the GitHub invite with anyone outside the community
- ❌ Don't paste sensitive data (real client names, API keys, full email bodies) into a public Issue — use the redacted format

## Issue triage expectations

Filed Issues will be triaged in batches, not real-time. Labels you may see:

- `bug` — confirmed defect, will be fixed in a patch release
- `prereq-issue` — your environment is missing something; setup help will be offered
- `enhancement` — feature request, will be considered for the next release
- `wontfix` — not aligned with the marketplace's direction
- `duplicate` — already tracked elsewhere
