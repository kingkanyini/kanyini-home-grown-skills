# savepoint — Changelog

## 1.1.0 — Save into the brain's `context/memory/`

- **Re-routed the LOCKED-build save location.** Session notes now save to `<workspace-root>/context/memory/` when the workspace is a confirmed AI-brain (a `.claude/` dir, or `context/` + a `skills/`/`automation/` sibling, or a `.ai-brain` marker). When the workspace is NOT a confirmed brain, saves fall back to the previous `~/.claude/references/context/` — so the skill never creates a stray `context/` folder in an unrelated repo.
- **Git-contamination guard.** The session note is never staged/committed into the client's own repo; the skill offers to add `context/memory/` to the workspace `.gitignore`.
- **Auto-compact saves are strictly gated** to the brain marker (unattended path); no marker → home fallback.
- **Bundled a read-only "Memory Forensics" maintenance pass** (lite Vault Forensics council — persona mode) at `counsel/lite-vault-forensics.md` to audit the `context/memory/` store (placement, git-contamination, orphans, convention drift, rotation health). Reports and offers fixes; never deletes.
- **Migration note:** older saves at `~/.claude/references/context/` are no longer rotated or read once a brain is in use — migrate or delete them manually.
- **Loader note:** for `memory/` to stay episodic, the brain's context loader / `CLAUDE.md` must load `context/` but exclude `context/memory/**` from always-load.

## 1.0.0 — Initial release

First version published in the Kanyini Home-Grown Skills Marketplace.
