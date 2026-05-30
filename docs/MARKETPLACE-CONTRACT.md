# Marketplace Contract

This is what you can expect from the marketplace, and what's expected of you in return. Read this before installing if you're unsure whether the marketplace is right for your situation.

## Access

- **Private repo, collaborator-invite-only.** Kanyini grants access; Kanyini can revoke access. Access is granted for your personal use within the community membership it was associated with.
- **Revocation = collaborator removal from GitHub.** Future `git pull` and `/plugin update` will be denied. Already-installed copies on your machine continue to function until you uninstall (see "Honest limitations" below).

## Versioning

- **Per-skill semver.** Each plugin (`plugins/<skill>/.claude-plugin/plugin.json`) carries an exact `version` (`1.0.0`, `1.0.1`, etc.).
- **Marketplace pins, plugins range.** The top-level `marketplace.json` pins each plugin's `latest` to an exact version. Per-plugin `requires:` arrays may use semver ranges (e.g., `^1.0.0`).
- **Releases are git-tagged.** When you `/plugin install <name>`, you pull the tagged version, not `main` HEAD.

## Yank protocol

If a release has a regression:

1. The bad version is added to `marketplace.json` → `plugins.<name>.yanked[]`.
2. Resolver refuses to install any version listed in `yanked[]`.
3. Already-installed bad copies show a warning on the next `/plugin update`.
4. A patch is published (e.g., `v1.0.1`), the new version tagged, `latest:` bumped.

## Deprecation + replacement

A skill that's being retired gets `deprecated: true` in its `plugin.json`. The successor name lives in `replacedBy:`. Resolver warns at install but does not auto-redirect.

## Support model

- **No SLA.** Best-effort, async responses. No guaranteed response time, no resolution commitment.
- **Channels:** see [`FEEDBACK.md`](FEEDBACK.md).
- **GitHub Issues** use the templates in `.github/ISSUE_TEMPLATE/` for skill-broken and prereq-failed cases.

## Telemetry disclosure

The marketplace ships **no telemetry**. No install ping, no usage tracking, no error reporting back to Kanyini. If a skill breaks for you, Kanyini will not know unless you report it via the support channels.

This may change in v1.1+ (a documented, opt-in install-ping would unlock proactive yank notifications). If it does, it will be disclosed here and require explicit consent.

## License (summary)

See [`../LICENSE`](../LICENSE) for the binding text. Plain-English summary:

- ✅ Use these skills on your own machines, with your own clients, as part of your business.
- ❌ Do not redistribute, fork, mirror, or publish any skill or the marketplace to any other repo (public or private) without written consent.
- ❌ Do not use the skills to train, fine-tune, or feed AI models whose outputs are made available to third parties.
- ❌ Do not strip attribution or sublicense.

Violation = immediate revocation of access. Continued use after revocation is a breach of the license terms.

## Honest limitations (v1.0.0)

1. **Revocation isn't technical.** Removing your collaborator access prevents you from pulling NEW versions. Skills already installed on your machine continue to function until you manually uninstall them. We trust the community membership context to make this an honor-system arrangement, backed by the legal language in the LICENSE.

2. **No killswitch.** v1.0.0 doesn't ship a remote allowlist check. If/when v1.1+ adds one, it will be documented in [`UPGRADING.md`](UPGRADING.md).

3. **No drift telemetry.** Kanyini can't see who's installed which skills, which versions are running, or which prereqs are failing. Honest reports are how he knows what's breaking — see [`FEEDBACK.md`](FEEDBACK.md).

4. **Windows-tested, but cross-platform claims are best-effort.** CI runs Ubuntu + Windows Server 2022. Mac is presumed-compatible but not actively smoke-tested. Issues on Mac are first-class bugs — please report.

5. **Updates may clobber user-edited files** if you've edited files INSIDE a plugin folder. To keep config safe across updates, write configs to `~/.claude/kanyini-config/<skill>/` instead of `~/.claude/plugins/<skill>/`. See [`UPGRADING.md`](UPGRADING.md).

## Contact for license terms

For questions about the license, custom-use arrangements, or removal requests, contact via the channels in [`FEEDBACK.md`](FEEDBACK.md).
