# savepoint — Changelog

## 1.1.0 — Save into the brain's `context/memory/`

- **Permission-based save location.** On first run in a workspace, savepoint ASKS where to save session notes (suggesting `<workspace-root>/context/memory/` — episodic memory inside the Context layer) and remembers the choice in a `.savepoint-location` marker. Later runs read the marker; the skill never creates a save folder the user hasn't approved. Unattended auto-compact saves with no marker fall back to `~/.claude/references/context/` (the user's own home) — never a silent write into an unconfigured workspace.
- **Git-contamination guard.** The session note is never staged/committed into the client's own repo; the skill offers to add `context/memory/` to the workspace `.gitignore`.
- **Auto-compact saves are strictly gated** to the brain marker (unattended path); no marker → home fallback.
- **Bundled a read-only "Memory Forensics" maintenance pass** (lite Vault Forensics council — persona mode) at `counsel/lite-vault-forensics.md` to audit the `context/memory/` store (placement, git-contamination, orphans, convention drift, rotation health). Reports and offers fixes; never deletes.
- **Migration note:** older saves at `~/.claude/references/context/` are no longer rotated or read once a brain is in use — migrate or delete them manually.
- **Loader note:** for `memory/` to stay episodic, the brain's context loader / `CLAUDE.md` must load `context/` but exclude `context/memory/**` from always-load.

## 1.0.0 — Initial release

First version published in the Kanyini Home-Grown Skills Marketplace.
