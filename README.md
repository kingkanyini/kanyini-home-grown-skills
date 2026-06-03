# Kanyini Home-Grown Skills Marketplace

> A Claude Code plugin marketplace for the Kanyini community — coaches, healers, and spiritual entrepreneurs building their own agentic chief of staff.

**Version:** 1.0.0
**Status:** Phase 1 — 28 skills across 9 tiers
**Access:** Public. Add it in one command — no invite or login needed.

---

## What this is

A curated collection of 28 Claude Code skills Kanyini has built and used personally — covering memory + counsel infrastructure, daily intel gathering, voice DNA personalization, offer + funnel + webinar building, email and ad copy, and video content. Designed for spiritual entrepreneurs and coaches to install as the foundation of their own agentic chief of staff system.

Future phases will add:
- **Phase 2:** T0 Bootstrap tier (`hermes-doctor`, `hermes-scaffold-vault`) — install-time prereq verification.
- **Phase 3:** Pre-revenue skills (`client-intake`, `calendar`, `payment`) — pipeline for community members who don't yet have clients.

---

## Quickstart

```bash
# 1. Add the marketplace (public — no invite or login needed).
/plugin marketplace add github:kingkanyini/kanyini-home-grown-skills

# 2. Install T1 Foundation skills first (everything else depends on them).
/plugin install savepoint@kanyini-home-grown-skills
/plugin install counsel-dispatch@kanyini-home-grown-skills
/plugin install quicksave@kanyini-home-grown-skills
/plugin install learn-eval@kanyini-home-grown-skills

# 3. Build your voice profile + counsel registry (~20 min, one-time).
# See docs/voice-and-counsel-build-guide.md

# 4. Install other tiers as needed.
# Hard requires:[] dependencies will block install order automatically.
```

Full setup walkthrough: **[docs/QUICKSTART.md](docs/QUICKSTART.md)**

---

## What you'll need

| Required | Purpose |
|----------|---------|
| Claude Code (CLI or desktop) | Plugin runtime |
| GitHub account | Optional — not needed to add a public marketplace; only if you want to clone or report issues |
| Obsidian + obsidian-brain MCP | Memory infrastructure (T1, T2 skills) |
| Various per-skill MCPs/CLIs/keys | Per-skill — see `docs/prereq-setup.md` |

See **[docs/prereq-setup.md](docs/prereq-setup.md)** for per-skill prerequisites.

---

## The 28 skills, by tier

See **[docs/skills-by-tier.md](docs/skills-by-tier.md)** for the full breakdown with "when to use" notes for each skill.

| Tier | Theme | Skills |
|------|-------|--------|
| T1 | Foundation / Memory | savepoint, quicksave, counsel-dispatch, learn-eval |
| T2 | Daily Intel | morning-compass, inbox-digest, perplexity-research |
| T3 | Voice / Personalization | voice-dna-extractor, voice-dna-blueprint-builder, charisma-codes |
| T4 | Build & Ship | exportskill, quickshare, skill-to-site |
| T5 | Offer & Messaging | offer-optimizer, magnetic-offer-blueprint, propaganda-machine |
| T6 | Funnels | funnel-hack-research, funnel-hack-lvl-1, funnel-audit, funnel-translate |
| T7 | Webinar / VSL | webinar-forge, vsl-activator |
| T8 | Email / Copy | daily-email-digest, belief-shift-e-engine, headline-creator |
| T9 | Ads / Video | ad-copy-forge, ss-ad-generator, power-clip-pro |

---

## Voice + Counsel

These skills assume you have:
1. **A voice profile** at `~/.claude/references/voice-profiles/<your-username>/` (built via `/voice-dna-blueprint-builder`)
2. **A counsel registry** at `~/.claude/references/counsel-registry.md` (built per `docs/voice-and-counsel-build-guide.md`)

If you don't have these yet, install T3 (Voice/Personalization) skills FIRST and run the setup. Other skills will warn when these are missing.

---

## Support & Issues

- **Bug reports** — GitHub Issues using the templates in `.github/ISSUE_TEMPLATE/`
- **Questions** — Designated community channel (see the bootcamp materials for details)
- **Feedback** — `docs/FEEDBACK.md`

No SLA. Best-effort response.

---

## Not for redistribution

These skills are shared for the **Build Your Freedom with AI** bootcamp community, to install and use in your own Claude Code, for your own work and your own clients.

**Please don't redistribute, repackage, re-host, or resell them.** The repo is public so the community can add it in one command, not so it can be re-shared. Want to bring someone in? Just send them this link.

Provided as is, with no warranty. Thank you for honoring the work. 🙏

See **[LICENSE](LICENSE)** for the short version.
