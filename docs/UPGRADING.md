# Upgrading

How releases work and how to upgrade installed skills safely.

## Release model

- **Tagged releases.** Every shipped version of any skill is a git tag (`v1.0.0`, `v1.0.1`, etc.). The `main` branch is not the install target; tags are.
- **Per-skill versioning.** Each skill carries its own `version` in its `plugin.json` and its own `CHANGELOG.md`. Skills evolve independently.
- **Marketplace meta-version.** The top-level `marketplace.json` `version` field bumps only when the marketplace.json shape itself changes (new required fields, new schema). Skill releases don't bump it.

## Checking your installed version

Per skill, look at:

```
~/.claude/plugins/<skill>/.claude-plugin/plugin.json
```

The `version` field tells you what you have. Compare to the `latest` listed in the marketplace's `.claude-plugin/marketplace.json`.

## Upgrading

```
/plugin update <skill-name>@kanyini-home-grown-skills
```

This pulls the tagged version listed in `marketplace.json.plugins.<skill>.latest`. If your installed version is yanked, you'll see a warning prompting you to upgrade.

## Yank protocol

If a release has a critical regression:

1. The bad version gets added to `marketplace.json` → `plugins.<name>.yanked[]`.
2. `/plugin update` warns on machines with the bad version installed.
3. A patch (e.g., `v1.0.1`) is published.
4. `latest:` bumps to the patch version.

If you see a yank warning, upgrade as soon as practical. The skill still works on the yanked version but won't receive further fixes.

## Deprecation

A skill being retired gets two fields:
- `deprecated: true` in its `plugin.json`
- `replacedBy: <new-skill-name>` pointing to the successor

`/plugin update` warns when you have a deprecated skill installed. The skill keeps working — deprecation is a heads-up, not a kill signal. Install the replacement when ready.

## Keeping your configs across updates

User configs (e.g., a skill's per-user `config/<your-username>/integrations.yml`) should NEVER live inside a plugin's folder. They get overwritten on update.

Per PLAN-v3.1 §5, skills write user configs to:

```
~/.claude/kanyini-config/<skill>/<config-files>
```

This path is outside the plugin folder, untouched by `/plugin update`. If you've manually edited files inside `~/.claude/plugins/<skill>/`, those edits will be reverted on the next update — move them to `kanyini-config/` instead.

## Pre-update smoke test (optional but recommended)

If you've heavily customized your setup, before running `/plugin update`:

1. Note the current version of the skill you're upgrading
2. Capture your working state (savepoint, screenshot, whatever proves "it works")
3. Run the update
4. Re-test the skill
5. If broken, roll back: `git checkout v<old-version>` in the marketplace clone, then reinstall

For v1.1+ releases, per-skill `UPGRADE-CHECKLIST.md` files will appear in `plugins/<skill>/` listing any migration steps. v1.0.0 doesn't ship these (no migrations yet).

## Roadmap

| Phase | Release | Content |
|-------|---------|---------|
| Phase 1 | v1.0.0 | 28 skills across 9 tiers — initial release |
| Phase 2 | v1.1.0 (planned) | T0 Bootstrap tier — `hermes-doctor` + `hermes-scaffold-vault` |
| Phase 3 | v1.2.0+ (planned) | Pre-revenue skills — `client-intake`, `calendar`, `payment` |

Roadmap is non-binding; dates aren't committed. Community feedback (see [`FEEDBACK.md`](FEEDBACK.md)) shapes what ships when.

## Anthropic / Claude Code compatibility

When Claude Code itself updates its plugin API, skills compatibility is tracked in each `plugin.json` `compatibleClaudeCodeVersion` field. Resolver will hard-block installs of incompatible skills.

If you're on a bleeding-edge Claude Code release and a skill installs but breaks, file a `skill-broken` issue with your Claude Code version listed.
