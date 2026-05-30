# Voice + Counsel Setup Guide

About ~10 skills in this marketplace reference TWO artifacts that don't come pre-built:

1. **Your voice profile** — `~/.claude/references/voice-profiles/<your-username>/` (your authentic written voice DNA, used by email/copy/ad skills)
2. **Your counsel registry** — `~/.claude/references/counsel-registry.md` (your roster of advisor archetypes, used by review skills)

This guide walks through building both, one-time, in ~20 minutes total.

---

## 1. Voice profile (~10 min)

### Why it exists

When you ask AI to write in "your voice," generic AI sounds nothing like you. A **voice profile** is a structured document capturing your speech patterns, vocabulary, sentence cadence, signature moves, and the things you DON'T say. Skills like `/daily-email-digest`, `/funnel-translate`, `/webinar-forge`, `/propaganda-machine`, and `/ad-copy-forge` read it to keep your authentic voice across generated content.

### How to build it

Install the voice DNA toolchain:

```
/plugin install voice-dna-extractor@kanyini-home-grown-skills
/plugin install voice-dna-blueprint-builder@kanyini-home-grown-skills
```

You have two paths to a voice profile:

**Path A — Extract from existing video** (you have a YouTube video, IG reel, or recorded talk):
```
/voice-dna-extractor [url-or-local-path]
```
This downloads → cleans audio → produces an MP3 + a voice profile card.

**Path B — Build via interview** (no existing audio):
```
/voice-dna-blueprint-builder
```
This runs you through a counsel-locked question bank (5q / 10q / 15q variants) and synthesizes the blueprint.

Either way, the output lands at `~/.claude/references/voice-profiles/<your-username>/`. Skills that need it will read from there automatically.

### Verifying it works

After building, try:
```
/daily-email-digest
```
On Step 1 (voice load), the skill should report it found your profile. If it warns "voice profile not found," check the path — your username inside the folder name must match what skills expect.

---

## 2. Counsel registry (~10 min)

### Why it exists

Many skills in this marketplace use **multi-advisor review counsels** — small panels of named experts who score and refine your work. The counsel registry is a single Markdown file at `~/.claude/references/counsel-registry.md` that lists which counsels are available and which members are on each one.

Without it, skills that call out to specific counsels (`/funnel-audit`, `/ad-copy-forge`, `/propaganda-machine`, etc.) won't know who to dispatch.

### How to build it

Install counsel-dispatch:

```
/plugin install counsel-dispatch@kanyini-home-grown-skills
```

Then run it for the first time:

```
/counsel-dispatch
```

On first run, the skill detects no registry exists and walks you through the build:

1. Pick a counsel to start with (e.g., "Conscious Sales Counsel," "Voice DNA Interview Research Counsel," "Triple Threat")
2. Define its members (3-5 named experts in their field, with one-line specialty each)
3. Save as a row in the registry table

Repeat for the 3-5 counsels most relevant to your work. You can always add more later.

### Registry template

The skill writes it in this shape (you don't need to memorize the format — `/counsel-dispatch` handles it):

```markdown
| # | Counsel | Tags | Members |
|---|---------|------|---------|
| 1 | Conscious Sales | sales, ethics, b2c | Marisa Murgatroyd, Jordan Belfort (clean), Daniel Priestley |
| 2 | Voice DNA Interview | voice, identity, intake | Steven Bartlett, Tim Ferriss, Light Watkins |
| ... | ... | ... | ... |
```

Skills look up counsels by tag or by name and dispatch them when relevant work shows up.

---

## Both built — what now?

You're ready to install higher-tier skills:

- T5 Offer + Messaging (offer-optimizer, magnetic-offer-blueprint, propaganda-machine)
- T7 Webinar/VSL (webinar-forge, vsl-activator)
- T8 Email/Copy (daily-email-digest, belief-shift-e-engine, headline-creator)
- T9 Ads/Video (ad-copy-forge, ss-ad-generator, power-clip-pro)

See [`skills-by-tier.md`](skills-by-tier.md) for the full list and what each does.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| "voice profile not found" warning | Verify file exists at `~/.claude/references/voice-profiles/<your-username>/` — your username must match. Use `whoami` to check. |
| "counsel-registry.md not found" warning | Run `/counsel-dispatch` once — first run prompts to create the registry. |
| Voice profile output sounds generic | Re-run `/voice-dna-blueprint-builder` with the 15-question depth — short profiles produce generic results. |
| Counsel members feel like AI defaults | Use REAL named experts in your space. Generic "Marketing Expert" doesn't anchor the model the way "Russell Brunson" does. |
