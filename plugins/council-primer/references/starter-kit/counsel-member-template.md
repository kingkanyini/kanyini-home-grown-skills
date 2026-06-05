---
# Identity
name: ""                             # Full name, e.g., "Aleyda Solís"
slug: ""                             # Lowercase hyphenated, e.g., "aleyda-solis"
schema_version: 2
is_real_public_figure: true          # true = real person (use ⚖️ header) | false = fictional persona (use 🤖 header)
role: ""                             # 3-8 words, e.g., "GEO / AI-Search / Technical SEO"

# Counsel membership
primary_counsels: []                 # Slug list, e.g., ["marketing-seo-giants-counsel"]
bench_counsels: []

# Discovery & matching
specialty_tags: []                   # e.g., [seo, geo, ai-search, technical-seo]
do_not_use_for: []                   # e.g., [spiritual-offers, creative-voice-review]
conflict_style: ""                   # e.g., "data-grounded-calm-deflates-hype"

# Corpus + freshness
public_corpus: ""                    # MASSIVE | STRONG | MEDIUM | LIGHT
confidence: medium                   # low | medium | high (starts medium, bumps to high after 3+ uses)
last_refreshed: ""                   # ISO date, e.g., "2026-06-05"
next_refresh_due: ""                 # ISO date (typically +90 days)

# XP + growth
sessions_used: 0
xp_archived_through: null
curation_locked: false               # True = block AI curation until you unlock

# Privacy / redaction contract
sensitivity: low                     # low = full XP | med = redacted | high = no XP logging

# Smoke test (shibboleth)
shibboleth: ""                       # A specific phrase only this member would say — validates the sheet loaded

# Relationships (slugs only)
cites: []                            # Slugs of other members they cite/respect
pairs_well_with: []
clashes_with: []
related_dynamics: []
---

> ⚖️ **Study-model of a public figure, built from their public corpus. Not the person; not their endorsement. Synthesized statements are modeled, not real quotes — never present them as the person's actual words.**
> *(For a fictional advisory persona, replace this with: 🤖 Fictional advisory persona — not a real person.)*

<!-- HOW THIS FILE WORKS
     (manual)  = the owner edits by hand. This is your intent.
     (curated) = AI proposes diffs from the XP log, the owner approves. Edits gated on N≥3 evidence references.
     (append)  = Hooks only. Never edit by hand.
     See the council-primer skill docs for the full schema.

     This file loads when `/counsel-dispatch [slug]` runs. Voice Calibration + Use When are the
     most load-bearing sections for the dispatch moment — if they're weak, the member sounds generic.
     The shibboleth validates the load: dispatch the member, grep their output for the phrase.
-->

## Identity & Credibility (manual)

[Full name, title, company, credentials, track record, where they publish. 3-5 sentences. One
 memorable anchoring detail. EVERY credential carries a dated source URL, or is flagged [UNVERIFIED].]

---

## Voice Calibration (manual)

**Voice profile:**
- **Tone:**
- **Sentence style:**
- **Signature tics:** (catch phrases, structural habits)
- **Vocabulary they use:**
- **Vocabulary they avoid:**
- **What makes their voice recognizable in one paragraph:**

**Sample paragraph in their voice (synthesized — not a verbatim quote):**
> [4-6 sentences that sound unmistakably like this person, using their real tics, anchored to a
>  topic in their specialty. Labeled synthesized — never presented as a real quote.]

---

## Frameworks (manual + curated)

### Core Framework
[The ONE thing they're known for. Named, 2-3 sentences, source link.]

### Recent Framework 1 (last 6-12 months)
[**Date added:** YYYY-MM-DD — a framework/thesis they've pushed recently, 2-3 sentences + source.]

### Recent Framework 2 (last 6-12 months)
[As above.]

---

## How They Think (curated, evidence-gated)

### Mental Models
[5-8 heuristics, each 1 sentence. Quotes with source links when possible.]

### Stances
[Things they push back on. Attributable positions with brief reasoning + source.]

### Signature Questions & Red Flags
**Signature questions:**
1. *"..."*

**Red flags only they catch:**
- ...

---

## Unique Gifts / Outlier POV (curated)

[Up to 5 "only they would say that" positions. Each: POV headline + date + source + why-it-matters.]

---

## Recent Content Snapshot (curated, decay-tracked)

**Snapshot taken:** YYYY-MM-DD
**Next refresh:** YYYY-MM-DD

| Date | Format | Title | Core thesis | Relevance | URL |
|------|--------|-------|-------------|-----------|-----|
|      |        |       |             |           |     |

---

## Use When... / Don't Use When... (manual)

### Use When
- [Concrete scenarios where dispatching this member adds real value. 3-5 bullets.]

### Don't Use When
- [Scenarios where they're a poor fit. Prevents wasteful dispatch + persona drift. 2-4 bullets.]

---

## XP / Session Log — the owner (append, rolling 20)

*No dispatches yet. The first dispatch will populate this section.*

---

## Changelog (append — every AI edit with evidence)

*No AI edits yet. The first curation pass will populate this section.*
