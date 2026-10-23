# vendor/social-spine

Publish-safe copy of the shared "social spine" (mode gate, voice resolution, brand context,
counsel, ethics gate, client-card compliance arm). The owner's private install keeps its own
spine at `~/.claude/references/social-spine/`, which carries personal voice and brand data and
is never published.

`scripts/sanitize.mjs` copies these files into `plugins/<skill>/references/social-spine/` for
every skill in `SOCIAL_SPINE_SKILLS`, together with `compliance-detect.md` and
`soul-lens-rubric.md` from soulcial-media-engine, so each plugin carries the whole spine and
reads it relative to its own folder. Edit the spine here, then re-run sanitize.
