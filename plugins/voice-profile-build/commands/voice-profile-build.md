---
description: Build a deep Voice DNA profile for any person. Recon → Copy Forensics Counsel #39 (4 parallel agents) → synthesis → 6-field Character Intake Card. Output saves to ~/.claude/references/voice-profiles/[slug]-voice.md.
---

# /voice-profile-build

You are running <your-name>'s canonical Voice DNA build pipeline. The skill takes a person's name + their public channels (YouTube, IG, website, LinkedIn, press), runs automated recon, dispatches Copy Forensics Counsel #39 in **AGENT MODE** (4 parallel Task subagents), synthesizes a voice profile MD with the 6-field Character Intake Card baked in, and saves it to the standard voice-profiles directory.

**Counsel for this skill:** **Copy Forensics Counsel #39** — Stefan Georgi (RMBC structural skeleton) / Kyle Milligan (modern social-native deconstruction) / Gary Bencivenga (granular micro-craftsmanship) / Gary Halbert (soul / persona / emotional contract). **AGENT MODE is mandatory** — this is a high-stakes artifact that downstream ghostwriting (emails, ads, VSLs, headlines) will rely on. Each counsel member must be dispatched as an independent parallel Agent subagent, not personified inline.

**Reference files (read on-demand):**
- `reference/counsel-39-prompts.md` — the 4 reusable agent-mode prompt templates
- `reference/voice-profile-template.md` — the standard output structure (24 sections + Character Intake Card)

**Reference targets (read for rigor calibration):**
- `~/.claude/references/voice-profiles/exemplar-one-voice.md` — gold-standard reference
- `~/.claude/references/voice-profiles/exemplar-two-voice.md` — second reference

---

## Phase 0: Dashboard

List existing voice profiles in `~/.claude/references/voice-profiles/*-voice.md` via Glob. Render an ASCII dashboard:

```
╔════════════════════════════════════════════════════════════════╗
║  VOICE PROFILE LIBRARY                                         ║
╠════════════════════════════════════════════════════════════════╣
║  [name-slug]  | [date created]  | [source count]               ║
║  ...                                                           ║
╚════════════════════════════════════════════════════════════════╝
```

Then `AskUserQuestion`:
- **New voice profile (Recommended)** — start fresh build
- **Update existing** — pick one and add new sources / re-run synthesis
- **View existing profile** — read it into context for review

If no profiles exist yet, skip to Phase 1.

---

## Phase 1: Identity & Sources Intake

Use `AskUserQuestion` for each.

**Q1 — Person's full name** (free text via "Other"). Generate `slug = lowercase, hyphenated` (e.g., "Exemplar Two" → `exemplar-two`).

**Q2 — Primary use case for the profile?**
- Full clone (everything — Charisma Code, ICA, Voice DNA, signature phrases, IG-native register, mode-switches, templates, Character Intake Card)
- Email-ghostwriting focus (lighter — Voice DNA + signatures + email register)
- Funnel/copy work (heavier on offer/positioning, lighter on personal narrative)
- Pitch / partnership outreach (tone + values + deal-frame language)

**Q3 — Source channels available?** (multi-select)
- YouTube (channel + podcast guesting)
- Instagram (captions + reels)
- LinkedIn (long-form posts)
- Website / brand copy
- Press / written interviews / Substack
- Local files (Dropbox/disk — user provides path)

**Q4 — Specific URLs to anchor on?** (free text, accept multi-line). Get at least 3-5 anchor URLs minimum (YouTube videos preferred — longest single sources give the deepest soul material). For each YouTube URL, capture the title and approx duration so you can pick the deepest single source for the Halbert agent.

**Q5 — Source corpus depth target?**
- Exemplar One-equivalent (~190K+ chars, 4-5 long-form transcripts) — RECOMMENDED for full clone
- Exemplar Two-equivalent (~150K+ chars, 3-4 long-form transcripts) — sufficient for full clone
- Lean (~60-80K chars, 1-2 transcripts + brand copy) — only for email-ghostwriting use case

---

## Phase 2: Recon

Set up project folder: `~/.claude/projects/[slug]-recon/transcripts/`. Mirror `exemplar-one-recon/` and `exemplar-two-recon/` structure.

Run **in parallel** (single message with multiple tool calls):

### YouTube transcripts
For each user-provided URL:
- `mcp__yt-dlp-mcp__ytdlp_get_video_metadata_summary` (capture title, duration, channel, upload date)
- `mcp__yt-dlp-mcp__ytdlp_download_transcript` with `language: en`

Then run `mcp__yt-dlp-mcp__ytdlp_search_videos` with query `"[Person Name]"` and `maxResults: 15` to surface additional podcast guesting + own-channel content. Pick top 2-3 longest (>45min) that the user hasn't already provided. Pull transcripts.

### Instagram
For each provided IG post URL: `WebFetch` with prompt to extract caption verbatim, hashtags, post date, post type (reel/post/carousel).

Note: IG bio + reel transcription often unscrapable in the broad sweep — flag what's missing as an open gap, don't block synthesis.

### Website
For Example Wellness Co-equivalent brand site:
- `WebFetch` homepage (extract all visible copy verbatim — headlines, taglines, body, CTAs, footer)
- `WebFetch` /about (mission, vision, founder bio, values)
- Optional: founder/team page, blog index for any author-by-name posts

### LinkedIn
Long-form posts: try `WebFetch` on the user's LinkedIn profile URL. If gated (most likely), flag as open gap and proceed with what we have.

### Press research
Optional but recommended for high-stakes profiles: `mcp__perplexity__perplexity_research` with query like *"[Person Name] [their primary domain] interviews quotes founder backstory"*. Save the citation-rich output to `[slug]-recon/press-research.md`.

### Save corpus index
Write `[slug]-recon/corpus-index.md` listing every source with file path, char count, source type, and a 2-sentence summary. This is what the agents will read.

---

## Phase 3: Dispatch Copy Forensics Counsel #39 (AGENT MODE)

**Read** `reference/counsel-39-prompts.md` for the 4 prompt templates. Each has placeholders for `{NAME}`, `{SLUG}`, `{CORPUS_PATHS}`, `{INLINE_QUOTES}`, etc.

Dispatch all 4 agents **in parallel** in a single message — one `Agent` tool call per counsel member. Each must:
- Receive the same corpus paths + inline quotes
- Receive the role-specific lens (their template)
- Read the gold-standard reference (`exemplar-one-voice.md` lines 14-24 for Charisma Code, lines 126-142 for Voice DNA, lines 200-220 for WOULD/WOULD NEVER, lines 241-252 for Tonal Modes)
- Return a 2500-4000 word structured markdown report

**Critical:** Use `Agent` tool with `subagent_type: "general-purpose"`. Pass `description` like `"[CounselMember] forensics on [Name]"`. Run all 4 in foreground (default) — we need their output before synthesis.

If the corpus is genuinely large (>200K chars), pass file paths and trust the agents to Read them. If the corpus is small enough to inline, embed the most-load-bearing 5-10 quotes directly in each agent's prompt to save them a Read round-trip.

---

## Phase 4: Synthesize Voice Profile MD

Once all 4 agent reports return:

1. **Read** `reference/voice-profile-template.md` for the section order and structure.
2. **Merge** the 4 reports section-by-section. Where agents disagree on facts (e.g., archetype name, master verb), surface the disagreement to the user via `AskUserQuestion` and let them pick.
3. **Write** the synthesized MD to `~/.claude/references/voice-profiles/[slug]-voice.md`.

**Quality bar:** match the rigor of `exemplar-one-voice.md` and `exemplar-two-voice.md`. Specifically:
- Verbatim quotes everywhere — no paraphrase
- Counts and quotes only — no vibes
- Filler word frequency rankings (top 5)
- Specific-numbers dossier
- Metaphor catalog (5-10 with verbatim examples)
- Master verb analysis with hit counts across 4+ sources
- Tonal Modes table (5-8 modes with mode-switch trigger + verbatim signature)
- WOULD/WOULD NEVER table (15-20 rows)
- AVOID list (10-20 items)
- 10-Point Voice Verification Checklist

---

## Phase 5: Generate Character Intake Card (CoS Format)

After the main profile is written, distill the 6-field Character Intake Card. **This is non-negotiable** — every voice profile gets one. Append it as the final section of the MD file under the header `## Character Intake Card (CoS Format)`.

The 6 fields, in order:

1. **Tagline** — one-line description visitors see under the name. Sets expectations for what this character helps with.
2. **Character Type** — archetype this character plays (e.g., Expert, Rebel, Everyman, Sage-Caregiver). Shapes voice and posture in replies.
3. **Core Flaw** — relatable weakness that keeps them human. Used to soften wins and make stories land.
4. **Polarity** — internal tension they live in (e.g., Engineer vs. Shaman, Sovereignty vs. Safety). Drives the angles they argue from.
5. **Origin Story** — founding moment that shaped their POV. Used in stories the CoS writes for them.
6. **Backstory** — longer history (5-act structure or chronological). Pulled into longer-form content.

**Format reference:** see `~/.claude/references/voice-profiles/exemplar-one-voice.md` and `exemplar-two-voice.md` end-of-file sections for the exact formatting.

**Distillation rules:**
- Tagline = the Charisma Code composite + Activation Phrase + Main Argument compressed to <30 words
- Character Type = the Halbert agent's archetype synthesis
- Core Flaw = the "shadow shown" + the "how they soften wins on themselves" pattern
- Polarity = the central tension the agents identified (often surfaces in the Trinity-Stack or counter-positioning section)
- Origin Story = the load-bearing inflection moment from the wound stack (the moment that built the framework)
- Backstory = the multi-act biographical arc, evidenced by quotes

**Get user approval on the 6 fields before writing them to the MD.** Surface them in chat first — same way <your-name> reviewed Exemplar One's verbatim before they got ported.

---

## Phase 6: Save + Register

1. **Confirm** the file is at `~/.claude/references/voice-profiles/[slug]-voice.md`.
2. **Offer** to update `~/.claude/CLAUDE.md` Reference Files table (line ~480) to register the new voice profile in the load-on-demand index.
3. **Offer** to register in `~/.claude/CLAUDE.md` Save-Path Mapping if this is a recurring client (so future skills auto-route here).
4. **Offer** to add a counsel entry in `~/.claude/references/counsel-registry.md` if the person is also being added as a counsel member.
5. **Show summary**: total corpus chars, agent runtime, output file path, open gaps list.

---

## Quality Gates

Before declaring DONE, verify:
- [ ] All 4 counsel agents returned reports (no silent failures)
- [ ] Output MD has all 24 standard sections (see `reference/voice-profile-template.md`)
- [ ] 6-field Character Intake Card is present and user-approved
- [ ] Source Materials section lists every recon file with path
- [ ] Open gaps section lists what wasn't captured (LinkedIn, exact pricing, email voice, etc.)
- [ ] No paraphrased quotes — all verbatim with attribution
- [ ] Master verb analysis cites count across 2+ sources
- [ ] WOULD/WOULD NEVER table has 15+ rows
- [ ] AVOID list crosschecks against `~/.claude/CLAUDE.md` AI-isms ban list

If any gate fails, fix before saving.

---

## Open Gaps Default List

Always include this at the bottom of the MD if not directly verified:
1. Email / sales-page voice — usually unobserved in podcast-only corpus
2. Long-form written prose (book chapters, white papers)
3. LinkedIn long-form (often gated)
4. Exact pricing for tiered offers (often gated behind application)
5. Q&A / objection-handling voice under skeptical pressure
6. TikTok / YouTube Shorts native register
7. Email open rates / list size (if relevant for ICA Tier 1 sizing)

The user can fill these in later via `/voice-profile-build` Update Existing mode.

---

## Notes

- This skill is a successor pattern to the ad-hoc 4-agent dispatch we ran for Exemplar One (2026-05-04) and Exemplar Two (2026-05-05). Outputs should be isomorphic with those two.
- The 6-field Character Intake Card was added to the standard format on 2026-05-06 after <your-name> provided his Exemplar One answers. **Do not omit it.**
- Counsel #39 (Copy Forensics) members are Stefan Georgi, Kyle Milligan, Gary Bencivenga, Gary Halbert. Stat sheets at `counsel/members/` if/when added to the vault. Until then, the prompts in `reference/counsel-39-prompts.md` carry the lens specification.
- Output dates inside the MD use ISO format `YYYY-MM-DD` (e.g., `2026-05-06`).