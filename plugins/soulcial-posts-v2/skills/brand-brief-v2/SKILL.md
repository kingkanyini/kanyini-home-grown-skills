---
name: brand-brief-v2
description: Capture or refresh the brand context the whole -v2 suite reads — business, ONE ideal customer, ONE CTA, THIS WEEK'S WEDGE (the reach engine), story vault, and voice. A thin wrapper over the shared brand-context schema; for the user it READS the Voice DNA Blueprint rather than re-capturing identity. Use it when the user says "set up my brand," "update my brand," or "refresh my wedge," or when another skill needs context and finds none. Blotato brand-brief adapted; wedge foregrounded.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

> **Paths:** every `references/` and `scripts/` path in this skill, and in the reference files it loads (a bare `social-spine/x.md` = `references/social-spine/x.md`), is relative to this plugin's root folder, `${CLAUDE_PLUGIN_ROOT}` (two levels above this skill's base directory). Never resolve them against this skill's own folder or your working folder. When you spawn subagents, pass them the absolute path.

# Brand Brief v2 (thin wrapper)

Capture/refresh `brand-context.md`. The schema + resolver live in `references/social-spine/brand-context.md` — this skill does not own duplicate state, it drives the capture. Produces intermediate context, not public copy (no ethics-gate exit).

> **Source & Attribution:** Adapted (not copied) from Blotato's `brand-brief` (blotato.com · GitHub Blotato-Inc/blotato-skills). Blotato's skills remain unmodified.

## Workflow
1. Run `social-spine/mode-gate.md` (mode/brand; client → sentinel-first).
2. **Reuse first:** if `00-master-brief.md` (soulcial) exists for this brand, read it and map Part A → the brand-context schema (schema-by-discovery). Don't re-capture what's there. If it has no explicit **wedge**, derive one from its Polarity/positioning and confirm.
3. **Self mode:** pull identity from your voice profile or Voice DNA Blueprint (built with /voice-profile-build or /voice-dna-blueprint-builder) — business, customer, pillars are already there. The ONE thing to actively capture/refresh is **This Week's Wedge**: "the one conviction in your niche most people are too polite to say" (delivered with the edge, never as outrage/shaming). Plus refresh the story vault + primary CTA.
4. **Client mode:** ask the 6 lean questions (business · ONE customer · ONE CTA · wedge · one recent story · voice). Write inside the `.client-data-boundary` folder.
5. Write/refresh `brand-context.md` (`brief_tier: lean|full`). Confirm what was saved. Any suite skill can now read it.

The wedge is the point. If a brand's posts sound like every other brand's, it's a missing or dull wedge — push for a real one.
