# soulcial-posts-v2

> Seven-skill daily social suite: hook library, virality grader, repurposing, and gated publishing on your voice profile plus an ethics and claims-safety gate. Start with /content-coach-v2

**Tier:** T8
**Version:** 1.0.0
**Command:** `/content-coach-v2`

## Usage

```
/content-coach-v2   (also: /brand-brief-v2, /post-writer-v2, /post-grader-v2, /viral-hooks-v2, /repurpose-v2, /post-scheduler-v2)
```

## Prerequisites

**Recommended skills** (warning if missing, not blocking):
- `soulcial-media-engine`
- `voice-profile-build`

**MCP servers:**
- `mcp__blotato__*`

**CLI tools:**
- `node`

**External services:**
- Optional: Blotato account + mcp__blotato__* MCP, only for /post-scheduler-v2 publishing. Writing, grading, and repurposing work without it (help.blotato.com/claude-skills)


Run `node preflight.mjs` from this skill's folder to verify all prereqs are met.

## Notes

- Frameworks studied and adapted from Blotato's free Claude skills (blotato.com, github.com/Blotato-Inc/blotato-skills), rewritten in original wording. Blotato's own skills are separate and unaffected; install them from Blotato if you want the originals.
- Installing this plugin adds a publish lock over every `mcp__blotato__*` tool call, including calls from Blotato's own skills. Nothing posts unless /post-scheduler-v2 armed it after the ethics gate cleared and you confirmed. If you also use Blotato's skills, publish through /post-scheduler-v2.

## See also

- [`docs/skills-by-tier.md`](../../docs/skills-by-tier.md) — full tier list
- [`docs/prereq-setup.md`](../../docs/prereq-setup.md) — MCP and CLI install steps
- [`docs/dependency-graph.md`](../../docs/dependency-graph.md) — skill dependencies
