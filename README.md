# Kanyini Home-Grown Skills Marketplace

> A Claude Code plugin marketplace for the Kanyini community: coaches, healers, and spiritual entrepreneurs building their own agentic chief of staff.

**Version:** 1.0.0
**Status:** 42 skills across 9 tiers
**Access:** Public. Add it in one command. No invite or login needed.

---

## What this is

A curated collection of 42 Claude Code skills Kanyini has built and used personally. They cover memory and counsel infrastructure, daily intel gathering, voice DNA personalization, offer, funnel, and webinar building, email and ad copy, and video content. Designed for spiritual entrepreneurs and coaches to install as the foundation of their own agentic chief of staff system.

Future phases will add:
- **Phase 2:** T0 Bootstrap tier (`hermes-doctor`, `hermes-scaffold-vault`): install-time prereq verification.
- **Phase 3:** Pre-revenue skills (`client-intake`, `calendar`, `payment`): a pipeline for community members who don't yet have clients.

---

## Quickstart

```bash
# 1. Add the marketplace (public, no invite or login needed).
/plugin marketplace add kingkanyini/kanyini-home-grown-skills

# 2. Install T1 Foundation skills first (everything else builds on them).
/plugin install savepoint@kanyini-home-grown-skills
/plugin install counsel-dispatch@kanyini-home-grown-skills
/plugin install quicksave@kanyini-home-grown-skills
/plugin install learn-eval@kanyini-home-grown-skills
/plugin install obsidian-brain-install@kanyini-home-grown-skills
/plugin install council-primer@kanyini-home-grown-skills

# 3. Restart Claude Code so the new skills load
#    (type /exit, then run claude again).

# 4. Build your voice profile + counsel registry (~20 min, one-time).
#    See docs/voice-and-counsel-build-guide.md

# 5. Install other tiers as needed.
#    Hard requires:[] dependencies will block install order automatically.
```

**Windows tip:** if adding the marketplace fails with "Filename too long," run `git config --global core.longpaths true` once, then try again.

Full setup walkthrough: **[docs/QUICKSTART.md](docs/QUICKSTART.md)**

---

## What you'll need

| Required | Purpose |
|----------|---------|
| Claude Code (CLI or desktop) | Plugin runtime |
| GitHub account | Optional. Not needed to add a public marketplace; only if you want to clone or report issues |
| Obsidian + obsidian-brain MCP | Only for skills that read or write your Obsidian vault (mainly T1 and T2 memory skills). See `docs/prereq-setup.md` for which ones |
| Various per-skill MCPs/CLIs/keys | Per-skill. See `docs/prereq-setup.md` |

See **[docs/prereq-setup.md](docs/prereq-setup.md)** for per-skill prerequisites.

---

## The 42 skills, by tier

See **[docs/skills-by-tier.md](docs/skills-by-tier.md)** for the full breakdown with "when to use" notes for each skill.

| Tier | Theme | Skills |
|------|-------|--------|
| T1 | Foundation / Memory | savepoint, quicksave, counsel-dispatch, council-primer, learn-eval, obsidian-brain-install |
| T2 | Daily Intel | perplexity-research |
| T3 | Voice / Personalization | voice-dna-extractor, voice-dna-blueprint-builder, voice-profile-build, charisma-codes |
| T4 | Build & Ship | exportskill, quickshare, skill-to-site, web-dev-bot, five-min-texter |
| T5 | Offer & Messaging | offer-optimizer, magnetic-offer-blueprint, propaganda-machine |
| T6 | Funnels | funnel-hack-research, funnel-hack-lvl-1, funnel-audit, funnel-translate |
| T7 | Webinar / VSL | webinar-forge, vsl-activator |
| T8 | Email / Copy / Social | daily-email-digest, belief-shift-e-engine, headline-creator, soulcial-media-engine, soulcial-posts-v2 |
| T9 | Ads / Video | ad-copy-forge, ad-decoder, ss-ad-generator, power-clip-pro, overlay-director, transcript-extractor-plus, snapshot, sixth-sense, sixth-sense-scissors, sixth-sense-xray, sixth-sense-sage |

---

## Voice + Counsel

These skills assume you have:
1. **A voice profile** at `~/.claude/references/voice-profiles/<your-username>/` (built via `/voice-dna-blueprint-builder`)
2. **A counsel registry** at `~/.claude/references/counsel-registry.md` (built per `docs/voice-and-counsel-build-guide.md`)

If you don't have these yet, install T3 (Voice/Personalization) skills FIRST and run the setup. Other skills will warn when these are missing.

---

## Support & Issues

- **Bug reports:** GitHub Issues using the templates in `.github/ISSUE_TEMPLATE/`
- **Questions:** Designated community channel (see the bootcamp materials for details)
- **Feedback:** `docs/FEEDBACK.md`

No SLA. Best-effort response.

---

## Not for redistribution

These skills are shared for the **Build Your Freedom with AI** bootcamp community, to install and use in your own Claude Code, for your own work and your own clients.

**Please don't redistribute, repackage, re-host, or resell them.** The repo is public so the community can add it in one command, not so it can be re-shared. Want to bring someone in? Just send them this link.

Provided as is, with no warranty. Thank you for honoring the work. 🙏

See **[LICENSE](LICENSE)** for the short version.
