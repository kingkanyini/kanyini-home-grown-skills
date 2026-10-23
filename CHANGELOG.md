# Marketplace Changelog

This file tracks META-level changes to the marketplace itself (schema changes, new skills added, breaking changes). Per-skill changes live in `plugins/<skill>/CHANGELOG.md`.

## Unreleased

**Now 42 skills across 9 tiers** (up from 28 at the initial release).

- Added: council-primer, obsidian-brain-install (T1); voice-profile-build (T3); five-min-texter, web-dev-bot (T4); soulcial-media-engine, soulcial-posts-v2 (T8); ad-decoder, overlay-director, snapshot, transcript-extractor-plus, sixth-sense, sixth-sense-scissors, sixth-sense-xray, sixth-sense-sage (T9)
- Removed: morning-compass (T2)
- Docs: README and QUICKSTART install line is now `/plugin marketplace add kingkanyini/kanyini-home-grown-skills` (tested). Added Windows "Filename too long" and restart-after-install tips.

## v1.0.0 — Phase 1 (TBD)

**Initial release.** 28 skills across 9 tiers.

- T1 Foundation: savepoint, quicksave, counsel-dispatch, learn-eval
- T2 Daily Intel: morning-compass, inbox-digest, perplexity-research
- T3 Voice: voice-dna-extractor, voice-dna-blueprint-builder, charisma-codes
- T4 Build & Ship: exportskill, quickshare, skill-to-site
- T5 Offer: offer-optimizer, magnetic-offer-blueprint, propaganda-machine
- T6 Funnels: funnel-hack-research, funnel-hack-lvl-1, funnel-audit, funnel-translate
- T7 Webinar/VSL: webinar-forge, vsl-activator
- T8 Email/Copy: daily-email-digest, belief-shift-e-engine, headline-creator
- T9 Ads/Video: ad-copy-forge, ss-ad-generator, power-clip-pro

Excluded from v1.0.0: vsl-post-production (deferred to a future release).

### Infrastructure

- JSON Schema validation (`schemas/{marketplace,plugin}.schema.json`)
- Sanitization pipeline (`scripts/sanitize.mjs`) with binary-detection text scanning, snapshot rollback, identity find-replace, folder name normalization, universal DELETE patterns
- Pre-commit hooks (`scripts/hooks/pre-commit`) running schema validation + leak audit
- CI workflows (`.github/workflows/`) running schema validation + Windows smoke test
- Cycle detection (Kahn's algorithm), diamond conflict resolution, self-loop guard
- Release Train Contract — git-tagged releases, `yanked[]` array, `deprecated` field

## v0.0.0 — Planning

PLAN v3.1 approved at 9.58/10 average across 5 counsel reviewers (CIPHER, PHANTOM, ARCHITECT, Mosh, Hogg) over 3 rounds.
