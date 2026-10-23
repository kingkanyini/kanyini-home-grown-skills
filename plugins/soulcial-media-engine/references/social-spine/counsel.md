# Social Spine — Counsel Dispatch

> How social skills run the counsel review. The mechanical virality grader is NOT a counsel — only the review below is.

## Which counsel
- **Primary: Conscious Content Counsel** — Brock Johnson (short-form virality / repeatable Reel formats), Jasmine Star (content systems/calendar), Vex King (conscious short-form), Justin Welsh (lean one-person content OS), Marie Forleo (conscious-business heart).
- **Add a wellness-safety lens** when `regulated_flag` is set: a Safety Steward (claims + compliance), a Voice Keeper (brand voice fidelity), and a Resonance Editor (does it land for the one customer).
- **Hook weighting:** hard-weight Brock's hook lens at 50% inside the rubric so committee-averaging can't dilute the hook.

## Dispatch (agent mode, high-stakes / client deliverables)
- Dispatch each member as a parallel Task agent. If you keep counsel stat sheets (vault `counsel/members/[slug].md` or `~/.claude/references/counsel/members/[slug].md`), inject that member's sheet by path. No sheet → the agent reviews from the member's public body of work. Subagents CANNOT use MCP or write files — they return text; the orchestrator writes.
- Each scores 1–10, names what-lands / what's-weak, gives a line-level edit, and emits `BLOCKER?: yes/no`. Any `yes` forces a revision cycle.
- **Persona mode** is fine for a quick single-post gut-check; **agent mode** for client deliverables, paid-adjacent, or a batch ship.

## XP logging (optional)
If `~/.claude/scripts/log-counsel-xp.js` exists, log each member after the agents finish (one `--session` UUID per round, one call per member, fire-and-forget — a logging failure never blocks the review; keep project/synopsis free of client identifiers). If the helper isn't installed, skip this step silently.

## Ship gate
The counsel score is NOT the ship gate. The user's (or the client-approver's) read-through in `ethics-gate.md` Step 5 is. The counsel PUSHES the draft; the human ships it.
