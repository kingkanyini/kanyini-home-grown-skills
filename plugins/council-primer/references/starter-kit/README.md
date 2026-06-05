# Council Primer — Starter Kit

Three ready-to-use councils so you have advisors to summon the moment you install — plus the blank
template for building your own.

## What's in here

```
starter-kit/
├── counsel-registry.starter.md       # 3 starter councils (seed registry)
├── counsel-member-template.md        # blank v2 template for building new members
└── members/                          # 10 ready-to-dispatch member sheets
    ├── russell-brunson.md  myron-golden.md  marisa-murgatroyd.md      (Expert Counsel)
    ├── aleyda-solis.md  rand-fishkin.md  seth-godin.md  peep-laja.md  (Marketing SEO Giants)
    └── cipher.md  phantom.md  architect.md                            (NSA Elite Squad)
```

> ⭐ **`members/aleyda-solis.md` is the gold-standard exemplar.** It's the canonical finished sheet the
> skill compares every newly-built member against (see `../stat-sheet-target.md` for the quality bar).
> It doubles as a working starter member *and* the reference you match new sheets to.

## The three starter councils

1. **Expert Counsel** — marketing, funnels, offers, sales. Russell Brunson · Myron Golden · Marisa Murgatroyd.
2. **Marketing SEO Giants Counsel** — get found → mean something → convert. Aleyda Solís · Rand Fishkin · Seth Godin · Peep Laja. (Built-in productive clash: Godin's intuition vs Laja's test-everything.)
3. **NSA Elite Squad** — coding + build-safety support. CIPHER (security) · PHANTOM (ops/failure-modes) · ARCHITECT (architecture). Fictional composite personas grounded in public security/engineering frameworks.

## Seeding the kit (so `/counsel-dispatch` can find them)

`/council-primer` offers to seed this kit for you at the start. Seeding copies:
- the 10 member sheets → your `counsel/members/` directory (your Obsidian vault if the `obsidian-brain`
  MCP is connected — that's where `/counsel-dispatch` reads — otherwise `~/.claude/references/counsel/members/`), and
- the 3 councils → your counsel registry (creating it if you don't have one yet).

Or do it by hand: copy `members/*.md` into your `counsel/members/` directory and paste the three rows
from `counsel-registry.starter.md` into your registry.

Then: `/counsel-dispatch aleyda-solis about my homepage` — and you're consulting.

## Honesty notes

- The real-person sheets are **study-models built from public corpus** — not the people, not their
  endorsement. Synthesized voice samples are modeled, never real quotes. Each sheet carries that header.
- The NSA personas (CIPHER / PHANTOM / ARCHITECT) are **fictional composites**, not real individuals.
- Sheets carry a `next_refresh_due` date. When a member's "Recent Content" goes stale, refresh it before
  high-stakes use — or rebuild the member with `/council-primer`.
