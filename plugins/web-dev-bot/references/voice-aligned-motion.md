# Voice-Aligned Motion (web-dev-bot)

> Translates <your-name>'s V.I.S.A. brand voice into motion language.
> Read by Phase 3 build agent BEFORE picking patterns from animation-library.md.

---

## Mapping: V.I.S.A. → Motion Behavior

### V — Vulnerability
**Principle:** Authentic self-expression, opening the heart.
**In motion:**
- Reveals are honest, not flashy
- Slow ease-out (`power3.out`, 0.8–1.2s duration)
- NO overshoot bounces (`back.out(1.7)` is forbidden by default)
- NO "dramatic" entrances (giant scale-ups, spinning text)

### I — Intuition
**Principle:** Listening to higher self / inner knowing.
**In motion:**
- Motion responds to the user (scroll-tied, cursor-aware)
- NO autoplay loops on hero (user must initiate)
- Magnetic buttons (H1) honor this — they react to presence

### S — Service to Others
**Principle:** Helping others amplifies your own growth.
**In motion:**
- `prefers-reduced-motion: reduce` ALWAYS respected
- All GSAP timelines wrapped in:
  ```tsx
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ```
- Service-first means accessibility-first

### A — Awareness
**Principle:** Presence, hitting the "ESC button" to observe life.
**In motion:**
- NO surprise jumps (sudden reveals without scroll trigger)
- NO hijacked scroll (native scroll behavior preserved)
- Motion serves comprehension, never spectacle for its own sake
- Pinned sections (S2) used SPARINGLY — once per page max

---

## Bonus: Gaming Heritage

<your-name>'s "Your Book" lens earns ONE motion exception:

- **Subtle "level-up" cues at conversion points** — CTA pulse on focus, progress bar completion micro-celebration, success-state checkmark draw
- These are quiet, single-frame moments. NOT arcade flash. NOT particle explosions.

Example acceptable: button briefly scales 1.0 → 1.02 → 1.0 over 0.4s when form successfully submits.
Example forbidden: confetti, sparkle particles, glitch effects, retro-arcade pixel transitions.

---

## Default Decisions When Design Doesn't Specify

| Question | Default |
|----------|---------|
| Hero entrance | E1 split-letter (V — vulnerability of unveiling) |
| Section transitions | E2 reveal (A — awareness of arrival) |
| CTA hover | H1 magnetic (I — intuition of presence) |
| Navigation hover | H2 CSS underline (A — awareness of intent) |
| Background | None unless brand kit specifies |
| Page transition | T1 fade only (V — gentle, never disorienting) |

---

## Anti-Patterns (NEVER apply)

- Marquee scroll text
- Cursor follower trails
- Auto-rotating carousels
- Infinite background loops with high contrast
- Neon glow / chromatic aberration
- "AI-glow" gradient mesh backgrounds (banned by Section 3 design rule)
