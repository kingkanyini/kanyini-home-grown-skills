# Social Spine — Brand Context (the reusable engine input)

> The single brand-context object every social skill reads. `brand-brief-v2` is a thin wrapper that captures/refreshes it; it does NOT own duplicate state — the schema + resolver live HERE.

## Schema (`brand-context.md` in the brand's project folder)
```markdown
# Brand Context — {brand}
> brief_tier: {lean|full} · updated: {date}

## Business
[what they sell, plain words]

## Customer (ONE real person)
[a specific human — what they want, what they hate]

## Primary CTA (ONE action)
[buy / follow / DM / sign up — one]

## This Week's Wedge  ← the reach engine
[the ONE contrarian conviction in their niche most people are too polite to say.
Pulled from the voice profile's polarity / strong opinions (self) or captured (client).
Reused on every post. Refresh weekly. A conviction, never manufactured outrage or shaming.]

## Story Vault
- [recent real moments, wins, customer transformations — raw material for hooks]

## Platforms
[active platforms + primary]

## Voice
[active_voice_path pointer — resolved by voice.md]

## metaphor_dial: {0-10}
[how much signature metaphor / brand-lens language this brand uses. STORED so the coach doesn't re-ask every session; 0 = plain and serious, 5-6 = default, 8-10 = full brand lens. Re-ask only when the content type shifts.]

## regulated_flag: {yes|no}
```

## Resolver (how a skill gets brand context)
1. **Reuse first (schema-by-discovery):** if `~/.claude/projects/{slug}-social-engine/00-master-brief.md` (from `/soulcial-media-engine`) exists, read it and map its Part A → this schema by the shape the file carries (do NOT assume a rigid layout). A full soulcial strategy build instantly powers the rapid suite. If the master-brief lacks an explicit **wedge**, derive one from its polarity/positioning and confirm with the user.
2. **Else lean-capture:** run `brand-brief-v2`'s 6 questions (business · ONE customer · ONE CTA · **wedge** · one story · voice) and write `brand-context.md` tagged `brief_tier: lean`. A later soulcial build resumes/deepens the SAME object (one canonical brand context per brand — never a second brief).

## The wedge is load-bearing
Every downstream reach lever (hooks, the grader's polarity dimension, algorithm-reward CTAs) is only as strong as whether the post takes a position. If `This Week's Wedge` is empty, the coach asks for it before writing. It's the cheapest, highest-leverage field: most voice systems capture polarity as a *trait* but never fire it as a position on every post.

## Brand artifact locations (all in ONE per-brand folder)
Every per-brand file lives in the brand project folder (`~/.claude/projects/{slug}-posts/` or `{slug}-social-engine/`): `brand-context.md`, `posts-shipped.log` (the cadence leading indicator), `publish-ledger.jsonl`, `post-ready-to-paste.txt`. Never a global path.

## Client mode
In client mode the folder carries the `.client-data-boundary` sentinel (dropped before first write). EVERY file above holds client PII → never vault-promoted, never `/quickshare`-exported, never a global path.
