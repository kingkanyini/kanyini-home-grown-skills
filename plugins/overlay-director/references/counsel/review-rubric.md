# Review Rubric (Phase 7) — two rubrics

Reviews run on **card-visible frames** (the frame at each card's mid-hold), and the MVP preview
must supply proxy frames spanning the **FULL duration**, not just the first 3 minutes.

---

## Rubric A — Per-card (one pass per card)

For each card, on its visible frame:

| Field | What to assess |
|-------|----------------|
| **Score** (1–10) | Overall craft of this card in this moment. 0.90+ = top-10% overlay work. |
| **Lands** | The specific thing that works (copy, placement, timing, art). |
| **Weak** | The specific weakness (illegible? mistimed? wrong move? off-voice?). |
| **Edit** | A concrete line-level change for THIS card. |

Per-card checklist:
- Legible on mobile (size, contrast, dark plate behind art captions)?
- Anchored to the spoken line, lead-in ~0.4s before the word?
- Held long enough to read (2.5–4.5s), not dwelling past the ceiling?
- Placement clears the cam (or is intentionally frame-centered)?
- Copy passes AI-isms ban + voice profile; provenance correct (verbatim vs distilled)?

---

## Rubric B — Sequence-level (one pass over the whole video)

| Field | What to assess |
|-------|----------------|
| **Rhythm** | Does the cadence breathe — bursts and rests — or metronomic/templated? |
| **Variety** | Cross-check `variety_score` + `top3_type_share`; does it *feel* varied on screen? |
| **Pacing collisions** | Any ≥3 cards live at once (`concurrencyFlag`)? Entrances/exits stepping on each other? |
| **Art consistency** | Does the generated-art set read as one hand (art-direction skin held)? |
| **Authored vs generated** | The gut-check: does this look like a person made deliberate choices, or a generator filled slots? |

Sequence output: Score (1–10) + the single highest-leverage change to make the whole thing read better.

---

## Synthesis
Combine per-card + sequence notes into one revision. Integrate minority dissent as mandatory
hardening conditions. Present the synthesized revision for <your-name>'s approval at the Phase 7 ◆ gate.
**Foreman/counsel score is NOT the ship gate — <your-name>'s read-through is** (`principles/read-through-as-final-ship-gate`).
