# Social Spine — Voice Resolution & Precedence

> Resolves `active_voice_path` and defines how every social skill (and every grader) applies the active voice under precedence. Paths under `references/` resolve against this plugin's folder (`${CLAUDE_PLUGIN_ROOT}`), not a skill's own folder.

## Resolution

- **Self mode** → first that exists:
  1. `~/.claude/references/voice-profiles/{you}/{you}-social.md`
  2. `~/.claude/references/voice-profiles/{you}/{you}-voice.md`
  3. `~/.claude/references/voice-profiles/{you}/{you}-email.md` → treat email-only rules (e.g. a hard em-dash ban) as non-binding for social
  4. none → capture 3 voice basics (how you talk, words you'd never use, one sample post you love) as a session working note; recommend `/voice-profile-build` before shipping.
- **Client mode** → first that exists:
  1. `~/.claude/references/voice-profiles/{slug}/{slug}-social.md`
  2. `~/.claude/references/voice-profiles/{slug}/{slug}-email.md` → email-only rules are non-binding for social
  3. `~/.claude/references/voice-profiles/{slug}/{slug}-voice.md`
  4. none → the session `client_voice_basics` working note from mode-gate Step 2b; recommend `/voice-profile-build` before ship.

`{you}` is the folder name you chose when you built your own profile. If you haven't built one, step 4 applies.

## Load order
1. Load `active_voice_path`.
2. Apply the generalist AI-tell rules below, subordinate to the profile.

## Generalist AI-tell rules (the floor)
Cut on sight unless the profile documents them as a tic: "here's the thing" warm-ups, "dive deep", "unlock your potential", metaphorical "navigate", "leverage" as a verb, "it's not just X, it's Y" contrasts, paragraphs opening with "So," / "Now,", and "Remember, …" bow-tie endings. Then run a humanization pass: rewrite anything that sounds built rather than spoken, vary the rhythm, add one concrete detail, and make the first line earn the second.

## Precedence (the rule that protects the voice)
**Order on conflict:** `active_voice_path` frontmatter `critical_rules` > documented Voice DNA in the profile > the generalist AI-tell rules above.

- A **documented tic is voice-authentic, not an AI-ism.** If the profile lists protected tics, they win.
- The specialist (voice profile) overrides the generalist (ban list).

## Teaching the absorbed grader
`virality-grader.md`'s "Voice match" dimension + voice-rules audit MUST load `active_voice_path` and read its protected-tics list FIRST. Header the grader with:
> "Before flagging any voice-rule violation, check the active profile's protected-tics list. A documented tic is NOT a violation → zero deduction."

## Humanization
All public copy runs the humanization pass at the final draft point — but the pass governs *cadence*, never the profile's hard rules or protected tics.
