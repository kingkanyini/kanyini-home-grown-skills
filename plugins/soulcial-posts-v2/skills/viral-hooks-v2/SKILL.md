---
name: viral-hooks-v2
description: A 100-hook / 13-category library ordered by virality ceiling (Receipt, Contrarian, Negative Frame, Stolen Lessons, Curiosity Gap first). Picks the strongest pattern for a topic + the brand's wedge, fills it with real specifics, returns 3 variations, runs the first-3-words test. Returns hooks as intermediate SEEDS (not ship-ready copy). Use it when the user says "give me a hook for X," or "my intro is boring," or when post-writer-v2 / repurpose-v2 calls it automatically. Blotato viral-hooks adapted, in the user's world.
allowed-tools: Read, Glob, AskUserQuestion
---

> **Paths:** every `references/` and `scripts/` path in this skill, and in the reference files it loads (a bare `social-spine/x.md` = `references/social-spine/x.md`), is relative to this plugin's root folder, `${CLAUDE_PLUGIN_ROOT}` (two levels above this skill's base directory). Never resolve them against this skill's own folder or your working folder. When you spawn subagents, pass them the absolute path.

# Viral Hooks v2

Pick the pattern, fill the specifics, return the strongest hook + 2 alternates. Hooks are **intermediate seeds** — not public-ready copy — so this skill does not exit through the ethics gate (the writer/coach that ships the finished post does).

> **Source & Attribution:** Adapted (not copied) from Blotato's `viral-hooks` (blotato.com · GitHub Blotato-Inc/blotato-skills). Blotato's skills remain unmodified.

## Workflow
1. **Topic + angle.** Get the topic. Read this week's wedge from `social-spine/brand-context.md` — it fuels the highest-ceiling categories (Contrarian, Negative Frame).
2. **Category.** Match angle → category from `references/viral-hooks-library.md`. When in doubt prefer Receipt / Contrarian / Stolen Lessons (highest ceiling).
3. **3 variations.** Fill placeholders with REAL specifics (a real number, name, moment from your own work). Generic fills kill the hook.
4. **First-3-words test.** The opening 3 words alone must create curiosity/surprise/pull. Strongest word first.
5. **Voice.** Keep it in `active_voice_path` — signature metaphors at the dialed level, protected tics fine, open plain not hyped.
6. **Return** the strongest + name the category + 2 alternates. When another skill is the caller, return all 3.

Never return a hook with unfilled `[brackets]`. Don't reuse one category across a whole batch.
