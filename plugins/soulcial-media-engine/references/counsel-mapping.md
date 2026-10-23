# Soulcial Media Engine — Counsel Mapping Reference

**Canonical source for:** `phases-1-7.md`, `phase-05-counsel-interview.md`, `quality-gate.md`
**Do not modify without updating all consuming modules.**

---

## Table 1: Phase → Counsel Lead / Support + OO/Prop Feed

Copied from spec §7. Each phase uses **persona-mode** counsel guidance (Triple Threat orchestrates across all phases).

| Phase | Artifact | Counsel Lead | Support | OO/Prop Feed |
|---|---|---|---|---|
| P1 — Full Strategy | `01-strategy.md` | Justin Welsh | Marie Forleo | OO positioning/avatar seed |
| P2 — Audience Psychology | `02-audience.md` | Vex King | Marie Forleo | — *(H9: surface→wound ladder)* |
| P3 — Authority Positioning | `03-positioning.md` | Justin Welsh | Jasmine Star | OO differentiator/avatar (H8) |
| P4 — Content Pillars | `04-pillars.md` | Jasmine Star | Brock Johnson | OO/Prop belief architecture |
| P5 — 30-Day Calendar | `05-calendar.md` | Jasmine Star | Brock Johnson | — *(capacity-driven, H4)* |
| P6 — Scroll-Stopping Posts | `06-posts.md` | Brock Johnson | Vex King | Prop proof blocks + OO hooks |
| P7 — Monetization | `07-monetization.md` | Marie Forleo | Justin Welsh | DIRECT OO offer stack + pricing + avatar pain (H6) |

**OO/Prop feed notes:**
- **P1** — pull OO positioning statement + ideal avatar description to seed the strategy frame.
- **P3** — pull OO differentiator + avatar-pain language so authority positioning isn't generic (H8).
- **P4** — pull OO belief architecture + Prop belief-shift sequence to shape pillar sequencing.
- **P6** — pull Prop proof blocks (social proof, result snippets) + OO hooks for post CTAs.
- **P7** — pull OO offer stack, pricing tiers, and avatar pain **directly** (not transitively via P1) so prices and offers never drift. New offer ideas labeled as options; P7 checkpoint applies the Golden Rule (H6).

---

## Table 2: Phase 0.5 — Counsel Interview Question Bank

**When:** After Phase 0 basic intake. The 8 counsel voices interview the END USER to deepen `00-master-brief.md`.
**How:** 2 rounds of 4, one `AskUserQuestion` call per round. RPG narrative framing goes ABOVE each call. Every question has 2–4 selectable options + auto "Other."
**No duplication with Phase 0** (platform + niche are already captured).

> **Important:** Triple Threat speaks as its 3 branch-voices here — PM, Architect, Security — not as all 14 individuals.

### Round 1 — The Forge Council Opens

*RPG framing (use in message text above AskUserQuestion):*
> The war council assembles in the Forge Chamber. Three strategic voices lean over the map table. Behind them, the Conscious Content Counsel waits in the wings. The Forge speaks first.

| Voice | Source Persona | Question Topic | AskUserQuestion Options |
|---|---|---|---|
| 🎯 PM | Triple Threat · Product Forge (Marty Cagan) | **The #1 business outcome this content must drive** | (1) Grow audience + brand awareness · (2) Generate qualified leads for my offer · (3) Drive direct sales / conversions · (4) Build community and long-term trust |
| 🏛️ Architect | Triple Threat · AI Dev (Jobs / Hogg) | **Realistic weekly posting capacity they can sustain** | (1) 1–2 posts/week — lean and deliberate · (2) 3–4 posts/week — steady rhythm · (3) 5–7 posts/week — daily or near-daily · (4) 8+ posts/week — multi-platform daily |
| ✍️ Justin Welsh | Counsel #58 | **The lean content angle they can sustain solo** | (1) Personal story + lesson (narrative-led) · (2) Tactical how-to / step-by-step · (3) Contrarian opinion / hot take · (4) Behind-the-scenes / day-in-the-life |
| 💫 Vex King | Counsel #58 | **The emotional truth their audience is carrying** | (1) Feeling stuck and unseen, despite doing the work · (2) Fear of not being enough / imposter syndrome · (3) Exhausted by surface strategies that miss the root · (4) Longing for deeper purpose and identity |

### Round 2 — The Shadow Council Speaks

*RPG framing (use in message text above AskUserQuestion):*
> A second set of advisors steps forward — the Compliance Sentinel, the Calendar Queen, the Reel Alchemist, and the Heart Commander. Each asks exactly one question. Answer honestly; what you share here locks in the engine's operating parameters.

| Voice | Source Persona | Question Topic | AskUserQuestion Options |
|---|---|---|---|
| 🛡️ Security | Triple Threat · NSA (CIPHER · Troy Hunt) | **Regulated/compliance claims to guardrail** | (1) Health, wellness, or supplement claims · (2) Finance, investing, or income/results claims · (3) Mental health or therapeutic outcome claims · (4) None — my niche is not regulated |
| 📅 Jasmine Star | Counsel #58 | **Their batching reality + content systems** | (1) I batch once a week — one session, all week's content · (2) I create day-of / spontaneously · (3) I batch monthly — one big shoot/write day · (4) I have no system yet, starting from scratch |
| 🎬 Brock Johnson | Counsel #58 | **The format/hook that has worked before** | (1) Reels / short-form video · (2) Carousels / multi-slide posts · (3) Static single images with strong captions · (4) Stories / interactive polls and questions |
| ❤️ Marie Forleo | Counsel #58 | **What they actually want to sell, and to whom** | (1) 1:1 coaching or services to individuals · (2) A course, program, or digital product · (3) A membership or recurring community · (4) Physical products / e-commerce |

**After Round 2:** compile all 8 answers into `00-master-brief.md` (deepening the Phase 0 entries). Security answers feed the compliance block per the fail-closed rule (§6.5 / H1).

---

## Table 3: Dispatch Modes

Copied from spec §4 + §8 + `two-mode-counsel-dispatch` principle.

| Mode | When Used | Who Dispatches | Notes |
|---|---|---|---|
| **Persona mode** | Stage 1 (P1–P7) in-phase guidance | Orchestrator personifies each counsel lead/support inline | Speed + cost; each phase has a single lead voice. Viable here because stat sheets are loaded and in-phase guidance is directional, not a fidelity gate. |
| **Agent mode** | Stage 2 Quality Gate | Each counsel member dispatched as an independent parallel subagent | Fidelity matters; shipped artifacts. Each agent has its own context window, no awareness of others until synthesis. Real disagreements surface. |

### Triple Threat Branch-Voice Assignment

Triple Threat (#30) speaks as **3 distinct branch-voices** throughout the pipeline. Each branch is a separate agent in the Quality Gate and a distinct persona in Phase 0.5.

| Branch | Persona | Specialty in this skill |
|---|---|---|
| 🎯 **PM** | Product Forge · Marty Cagan | Business outcome gate, success metric, P7 monetization coherence |
| 🏛️ **Architect** | AI Dev · Jobs / Hogg | Posting cadence feasibility, system coherence, compaction-safety check |
| 🛡️ **Security** | NSA · CIPHER · Troy Hunt | Regulated-niche detection, compliance claims, export scrub (H3) |

**Quality Gate dispatch order:**
1. All 5 Conscious Content Counsel #58 members → agent mode simultaneously.
2. Triple Threat 3 branch-voices → agent mode simultaneously.
3. Each reviewer emits `BLOCKER?: yes/no`. Any `yes` forces a mandatory revision cycle on that artifact.
4. Synthesize → present revised artifacts inline → user read-through approval (foreman score is NOT the ship gate).
5. Counsel XP logged fire-and-forget via `node ~/.claude/scripts/log-counsel-xp.js` (one session-UUID; only if the helper is installed).

**Counsel #58 roster (agent-mode name → slug):**

| Member | Slug | Stage 2 Review Specialty |
|---|---|---|
| Justin Welsh | `justin-welsh` | Strategy coherence, lean content system, authority angle |
| Jasmine Star | `jasmine-star` | Calendar density, batching plan, system repeatability |
| Brock Johnson | `brock-johnson` | Hook craft, format variety, thumb-stop test (H7) — P6 veto |
| Vex King | `vex-king` | Emotional resonance, soul-lens calibration, depth vs surface |
| Marie Forleo | `marie-forleo` | Offer alignment, monetization ethics, Golden Rule check |
