# Quickstart

You've been invited to the Kanyini Home-Grown Skills Marketplace. This guide gets your first skill running in ~15 minutes.

## What you'll need (one-time setup)

- **Claude Code** (CLI or desktop) — you presumably already have this
- **GitHub account** — free is fine
- **Git** on your machine
- **Obsidian** + the `obsidian-brain` MCP — required by T1 Foundation skills (memory infrastructure)

If any of these are missing, set them up first. See [`prereq-setup.md`](prereq-setup.md) for MCP install steps.

## Step 1 — Accept the GitHub collaborator invite

You should have received an email from GitHub: *"Kanyini has invited you to collaborate on `kingkanyini/kanyini-home-grown-skills`"*. Click **Accept invitation**.

## Step 2 — Authenticate Claude Code to GitHub

If you've never used `gh` (GitHub CLI):

```bash
gh auth login
```

Pick **HTTPS** and follow the browser prompts. Test with `gh repo view kingkanyini/kanyini-home-grown-skills` — you should see the repo description without an error.

## Step 3 — Add the marketplace

In Claude Code:

```
/plugin marketplace add github:kingkanyini/kanyini-home-grown-skills
```

This subscribes you. Claude Code pulls the metadata. You should see the marketplace appear in `/plugin marketplace list`.

## Step 4 — Install T1 Foundation skills

T1 is the **memory + counsel substrate** every other tier depends on. Install these four first:

```
/plugin install savepoint@kanyini-home-grown-skills
/plugin install counsel-dispatch@kanyini-home-grown-skills
/plugin install quicksave@kanyini-home-grown-skills
/plugin install learn-eval@kanyini-home-grown-skills
```

Verify each with `node ~/.claude/plugins/<skill-name>/preflight.mjs`. If any preflight fails, fix the prereq before continuing — see the `MISSING:` lines in stderr.

## Step 5 — Build your voice profile + counsel registry (~20 min one-time)

These two artifacts are referenced by ~10 skills in the bundle. Without them, those skills will warn-on-first-run and ask you to build them first.

Follow [`voice-and-counsel-build-guide.md`](voice-and-counsel-build-guide.md) — it walks you through `/voice-dna-blueprint-builder` (for voice) and `/counsel-dispatch` onboarding (for the registry).

## Step 6 — Try your first non-foundation skill

Pick something that sounds useful — e.g., `/perplexity-research` if you do research, `/morning-compass` if you want a daily briefing.

```
/plugin install perplexity-research@kanyini-home-grown-skills
/perplexity-research "competitive landscape for biohacking coaches"
```

If you hit a "missing prereq" error, run the skill's `preflight.mjs` to see what's missing, then check [`prereq-setup.md`](prereq-setup.md).

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `/plugin marketplace add` fails with auth error | Re-run `gh auth login`, check `gh auth status` shows you logged in |
| Skill installs but fails on first run | Run `node ~/.claude/plugins/<skill>/preflight.mjs` to identify the missing prereq |
| "vault not found" errors | Install + configure `obsidian-brain` MCP per [`prereq-setup.md`](prereq-setup.md) |
| Tilde paths (`~/`) not expanding on Windows | Confirm you're using PowerShell 7+ (`pwsh`), not Windows PowerShell 5 |

For anything else, [`FEEDBACK.md`](FEEDBACK.md) has the support channels.
