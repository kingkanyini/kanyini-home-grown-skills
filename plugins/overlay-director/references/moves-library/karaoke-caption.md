---
status: active
version: 1
move_type: caption-track
affects: []
hero_capable: false
requires: [word-level-srt]
---

# Karaoke Caption

## Purpose
A **persistent** bottom subtitle that highlights word-by-word as spoken, on a
calm cream plate. Not a card — a track that runs for the span it's enabled.

> **Scoped to a real mechanic, not retention chrome** (<your-name>, 2026-06-01):
> use this specifically when **dictating to Claude Code via Wispr Flow** — the
> caption shows the viewer the *exact words being spoken as input*. That purpose
> is what separates it from Abdaal/MrBeast "hype karaoke" (which Visual Visionary
> #26 flagged as cosplay). It earns its place by tying to the voice→Claude action,
> not by filling frames with motion.

## When to use
- **Primary:** a Wispr-Flow dictation segment — the speaker is talking TO Claude
  Code and the viewer should see the words land as the prompt is built.
- **Opt-in per clip, never default-on** (Collin). Calm tutorials breathe; an
  always-on word-ticker fights that unless it's carrying the dictation mechanic.
- Exempt from the Variety Engine — it's a baseline track, not a move competing
  for the 90s window.

## Counsel-locked build rules (VV#26 2026-06-01)
1. **Calm, not hype** [Collin] — no per-word scale-punch/pop. Soft cream caption
   bar, **sage** active-word highlight, gentle cross-dissolve between words.
2. **Contrast corrected** [Brown] — spoken = BRIGHT (`#FFFFFF` solid) is the lit
   state; upcoming = muted (`#A59A86`); plate `rgba(20,14,9,0.65)`. (Spoken is the
   bright state, not the near-black state — Brown caught the original inversion.)
3. **Word-timestamp preflight gate** [Hogg] — this depends on word-level SRT. If
   `caption_track:karaoke` is flagged, Phase 3 MUST assert the SRT carries word
   tokens. If absent → hard-fail with "re-transcribe with word timestamps" OR
   fall back to a line-level whole-line sweep flagged `degraded`. **Never let it
   reach render unvalidated** — it's the one move that fails *invisibly*.
4. **Reserved caption lane** [Brown] — owns the bottom 18% (see playbook P6b);
   no other move's text or tether may enter that lane while this is active.

## CSS / GSAP
- Driven directly off the **word-level** Groq SRT (Phase 1). Each word span flips
  from `upcoming` → `spoken` at its `start` via a gentle opacity/color dissolve
  (no transform punch). Plate: `rgba(20,14,9,0.65)` + `blur(8px)`.
- Per-segment re-anchor so drift can't accumulate past one caption block over a
  long runtime [Marsh].

## Params
| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `enabled_span` | {start,end} | — | the dictation segment (NOT whole video by default) |
| `position` | bottom\|lower-third | bottom | reserved-lane, clear of other content |
| `spoken` | color | #FFFFFF | the BRIGHT/lit state (rule 2) |
| `upcoming` | color | #A59A86 | muted (rule 2) |
| `active` | color | sage #8FA67E | the word landing right now (rule 1) |
| `srt_mode` | word\|line | word | `line` = degraded fallback (rule 3) |

## Note
Composition-level track: wired in Phase 5 build, not drafted per-moment in Phase
3. Flagged in plan.json as `caption_track: karaoke` with its `enabled_span`.

## Impl
`_impl/karaoke-caption.html` — canonical render derived from this card (re-derive + re-gate on any motion change). Passes the objective motion gate.
