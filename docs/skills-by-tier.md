# Skills by Tier

The marketplace ships 39 skills across 9 tiers. Install order matters — install T1 Foundation first; later tiers may depend on earlier ones (see [dependency-graph.md](./dependency-graph.md)).

## T1 — Foundation / Memory

### `council-primer`

The First-Council Forge — build a 4-person advisory council of real experts in any domain via guided interview + live research, then summon them. Ships a 3-council starter kit.

- **Requires:** _none_
- **Recommends:** `counsel-dispatch`

### `counsel-dispatch`

Dispatch a counsel member from the vault. Loads their stat sheet, embodies their voice, and logs the dispatch for XP accumulation.

- **Requires:** _none_
- **Recommends:** _none_

### `learn-eval`

Extract reusable patterns from the session, self-evaluate quality before saving, and determine the right save location (Global vs Project)

- **Requires:** _none_
- **Recommends:** _none_

### `obsidian-brain-install`

Scaffold a self-compounding Obsidian memory layer into an AI-Brain — /obsidian-brain-install plus /ingest, /brain-lint, /brain-status. Layer-1 becomes the wiki; deterministic, idempotent, PII-safe.

- **Requires:** _none_
- **Recommends:** `savepoint`

### `quicksave`

Save progress of projects, conversations, or skills for personal reference

- **Requires:** _none_
- **Recommends:** _none_

### `savepoint`

Save session context and git snapshots — your video game save point for agent work

- **Requires:** _none_
- **Recommends:** _none_

## T2 — Daily Intel

### `inbox-digest`

Scan Gmail for client emails, file into vault per-client, generate per-client daily briefs

- **Requires:** _none_
- **Recommends:** _none_

### `perplexity-research`

On-demand citation-rich research via Perplexity Sonar API. Quick (~10s), Standard (~30s), or Deep (2-5min) tiers.

- **Requires:** _none_
- **Recommends:** _none_

## T3 — Voice / Personalization

### `charisma-codes`

Discover your unique Charisma Code (Energetic + Trust + Authority) using McCall Jones framework with breathwork and RPG-style discovery

- **Requires:** _none_
- **Recommends:** _none_

### `voice-dna-blueprint-builder`

Interview-based Voice DNA Blueprint generator. Walks a subject through a counsel-locked question bank (5/10/15q), then synthesizes a transcript + blueprint MD.

- **Requires:** `voice-dna-extractor`
- **Recommends:** `savepoint`

### `voice-dna-extractor`

Extract clean voice DNA audio from IG, YouTube, or local video files. Auto-cleans, quality-gates, outputs MP3 + voice profile card.

- **Requires:** _none_
- **Recommends:** _none_

### `voice-profile-build`

Build a deep Voice DNA profile for any person. Recon → Copy Forensics Counsel #39 (4 parallel agents) → synthesis → 6-field Character Intake Card. Recon-based sibling to voice-dna-blueprint-builder.

- **Requires:** _none_
- **Recommends:** `voice-dna-blueprint-builder`, `savepoint`

## T4 — Build & Ship

### `exportskill`

Export Claude Code skills to Claude Web project knowledge format

- **Requires:** _none_
- **Recommends:** _none_

### `five-min-texter`

Stand up a 5-minute SMS auto-responder for a solo wellness practice: guided intake interview, then n8n + Twilio + A2P 10DLC setup on a council-reviewed engine. Crisis screen (988) runs first.

- **Requires:** _none_
- **Recommends:** `voice-dna-blueprint-builder`

### `quickshare`

Save any skill or content as a shareable universal AI prompt with optional access control + expiration

- **Requires:** _none_
- **Recommends:** _none_

### `skill-to-site`

Turn any installed skill into a deployed Vercel chat site (Next.js + streaming Anthropic API + secret-safe env piping)

- **Requires:** _none_
- **Recommends:** _none_

### `web-dev-bot`

Build, clone, sketch, debug, and connect websites with Web Dev Counsel guidance

- **Requires:** _none_
- **Recommends:** `counsel-dispatch`

## T5 — Offer & Messaging

### `magnetic-offer-blueprint`

Embodiment-first offer creation with 3-person Council — 6 parts from soul alignment to strategic skeleton

- **Requires:** _none_
- **Recommends:** _none_

### `offer-optimizer`

Comprehensive offer optimization — guides you through building messaging, positioning, and offer structure by reverse-engineering from your best client transformation

- **Requires:** _none_
- **Recommends:** `counsel-dispatch`

### `propaganda-machine`

Build a belief-shifting content system from your Offer Optimizer using the Propaganda Machine framework

- **Requires:** `voice-dna-blueprint-builder`, `offer-optimizer`
- **Recommends:** `counsel-dispatch`

## T6 — Funnels

### `funnel-audit`

Funnel page audit with 6-agent scanning, belief architecture review, and micro-arc analysis

- **Requires:** _none_
- **Recommends:** `counsel-dispatch`, `offer-optimizer`

### `funnel-hack-lvl-1`

Create a funnel for a new customer from scratch using the ABCDE + SWIPES framework with 3-hat copy counsel

- **Requires:** _none_
- **Recommends:** `counsel-dispatch`

### `funnel-hack-research`

Find the perfect funnels to hack — Phase B of the ABCDE framework. BMAD Analyst orchestrates parallel research agents.

- **Requires:** _none_
- **Recommends:** _none_

### `funnel-translate`

Voice-aware funnel translation with counsel review, formatting preservation, and Vercel deployment for team handoff

- **Requires:** _none_
- **Recommends:** `voice-dna-blueprint-builder`

## T7 — Webinar / VSL

### `vsl-activator`

Build high-converting VSL scripts merging Perfect Webinar + 6 Core Beliefs with VSL Allstar Squad counsel

- **Requires:** _none_
- **Recommends:** `counsel-dispatch`, `voice-dna-blueprint-builder`

### `webinar-forge`

Forge a Perfect Webinar script (outline + 90min + variants) with counsel guidance

- **Requires:** `voice-dna-blueprint-builder`
- **Recommends:** `counsel-dispatch`

## T8 — Email / Copy

### `belief-shift-e-engine`

Build dual-path belief-shifting email sequences with entry emails, nurture + conversion CTAs, and reminder templates

- **Requires:** _none_
- **Recommends:** `offer-optimizer`

### `daily-email-digest`

Write, review, and brainstorm emails with 3-hat counsel, Voice Foreman quality gate, and 3-level template training

- **Requires:** `voice-dna-blueprint-builder`
- **Recommends:** `counsel-dispatch`

### `headline-creator`

High Converting Headline Creator — builds ICA avatars and generates three-tier headline sets for Facebook ads and short-form video

- **Requires:** _none_
- **Recommends:** _none_

## T9 — Ads / Video

### `ad-copy-forge`

Convert video ad scripts into Meta-ready ad copy using the OO + Prop Machine + learned ad patterns with counsel review

- **Requires:** `offer-optimizer`, `propaganda-machine`
- **Recommends:** `counsel-dispatch`

### `overlay-director`

Turn any talking-head/screen-recording video into a counsel-reviewed animated-overlay HyperFrames build — auto-drafted from an accumulating playbook, tweaked by you, getting faster with every video

- **Requires:** _none_
- **Recommends:** `counsel-dispatch`

### `power-clip-pro`

Craft 3-5 minute value-first video scripts (Power Clips) with a 3-advisor counsel and 12-part framework

- **Requires:** _none_
- **Recommends:** `voice-dna-blueprint-builder`

### `sixth-sense`

6-agent video intelligence scanner — identifies clip-worthy segments across Content, Emotion, and Structure

- **Requires:** _none_
- **Recommends:** `sixth-sense-scissors`, `transcript-extractor-plus`

### `sixth-sense-sage`

B-roll placement intelligence — identifies moments, builds production briefs with bilingual mapping, Artgrid sourcing, and interactive HTML playbooks

- **Requires:** _none_
- **Recommends:** `sixth-sense`, `transcript-extractor-plus`

### `sixth-sense-scissors`

Auto-cut video recordings — silence detection, A/V-synced cuts, dual-language edit maps, and iterative creative cut consultation

- **Requires:** _none_
- **Recommends:** `sixth-sense`, `transcript-extractor-plus`

### `sixth-sense-xray`

Visual reverse-engineering — analyzes video effects and produces interactive CapCut recreation playbooks with YouTube tutorial links

- **Requires:** _none_
- **Recommends:** `sixth-sense`

### `snapshot`

Take high-def screenshots from videos, websites, or extract photos from PDFs

- **Requires:** _none_
- **Recommends:** _none_

### `ss-ad-generator`

Subconscious Seduction Ad Generator — generate 14 psychology-driven video ads using psychological triggers + framework with 3-hat counsel

- **Requires:** _none_
- **Recommends:** `counsel-dispatch`, `voice-dna-blueprint-builder`

### `transcript-extractor-plus`

Transcribe videos in any language and translate to any target language using Whisper + AI translation

- **Requires:** _none_
- **Recommends:** `sixth-sense-scissors`
