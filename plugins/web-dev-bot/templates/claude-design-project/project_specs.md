# Project Specs — [project-name]

> Auto-filled by web-dev-bot during Phase 1D intake (Claude Design path).
> Per Rule 2 in CLAUDE.md — wait for user approval before writing any code.

**Status:** [draft | approved]
**Last updated:** [ISO date]

---

## What the app does and who uses it

[1-3 sentences describing the purpose and primary user.]

---

## Tech stack

- **Framework:** Next.js 16 (App Router) — DEFAULT per Claude Design Integration Rule
- **Animations:** GSAP 3.13 + @gsap/react + ScrollTrigger
- **Styling:** Tailwind CSS 4
- **Package manager:** pnpm (preferred) or npm (fallback)
- **Node:** >=20.9 <23 (pinned via `.nvmrc` + `engines`)
- **Database:** [none | Supabase | Postgres | other]
- **Auth:** [none | Clerk | Supabase Auth | other]
- **Hosting:** [Vercel default | Netlify | other]

---

## Pages and user flows

| Page | Path | Public/Auth | Purpose |
|------|------|-------------|---------|
| [Home] | `/` | Public | [purpose] |
| [...] | [...] | [...] | [...] |

---

## Data models

[List entities and where they live. If purely static marketing site, write "Static — no data layer."]

---

## Third-party services

[Stripe, Mailchimp, Typeform, Google Analytics, Meta Pixel, etc. — list integrations + status (connected | TODO).]

---

## Definition of "done"

- [ ] All pages render at 375 / 768 / 1440 viewports
- [ ] GSAP animations triggered per design (motion budget respected: max 1 entrance/section, 1 hover/element, 1 background/page)
- [ ] Phase 4 Visual QA diff ≥ 90% match against `.design-source/snapshot.png`
- [ ] Supply-chain audit passed (`pnpm audit --audit-level=high` clean)
- [ ] Brand kit applied (colors, typography, copy)
- [ ] Mobile-first responsive verified
- [ ] Deploy preview live and shared with [stakeholder]
- [ ] [Project-specific success criteria]

---

## Approval

**Approved by <your-name> on:** [date]
**Approver signature line:** [<your-name>]
