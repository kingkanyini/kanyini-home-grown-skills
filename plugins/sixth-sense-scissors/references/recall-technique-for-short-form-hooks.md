---
type: gou-gold-standard
tags:
  - recall-technique
  - short-form
  - hook
  - ig-reels
  - tiktok
  - youtube-shorts
  - clip-cutting
  - sixth-sense-scissors
  - sixth-sense-sage
scope: workflow
applies_to:
  - sixth-sense-scissors
  - sixth-sense-sage
  - sixth-sense
  - vsl-activator
  - ad-copy-forge
  - power-clip-pro
kind: practice
status: stable
qualified_by: <your-username>
qualification_date: 2026-05-17
qualification_score: 9.5
last_validated: 2026-06-02
version: 2
replicable: true
confidence: high
pii_firewall: true
redaction_status: redacted
source_session: '<your-related-note>'
aliases:
  - "recall technique"
  - "hook recall"
  - "loop-and-land hook"
  - "front-loaded recall"
duration_scope:
  min_seconds: 15
  max_seconds: 90
  sweet_spot_seconds: 60-90
related:
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
---

# GOU Gold Standard — Recall Technique for Short-Form Hooks

## The Insight

For short-form video clips **≤90 seconds**, open with a **2-3 second cold-open of the speaker's most quotable line pulled from later in the source recording.** Then drop to the natural beginning (host setup or speaker's narrative entry). Let the story earn the line. When the recording reaches the line in its natural delivery, **keep it in** — the viewer experiences the loop closing. Continue past the recall into the payoff.

The line appears TWICE: once as a curiosity-tease cold open, once as the earned-payoff recall. Memory anchors via primacy + recency + earned context.

## Why It's Gold

Validated in the example-artist "If You Don't Choose Yourself, Life Won't Choose You" cut (94s, 1080p) — the gold-standard exemplar for this technique. Found at `~/<your-vault-path> Assets\Funnel Hacking\example-artist\Interview\Full Video (EDITED)\If You Don't Choose Yourself, Life Won't Choo.mp4` (canonical reference — do NOT wikilink per PII firewall).

The technique solves three problems endemic to short-form video:

1. **The cold-open problem.** Direct natural-start clips (<example-client> "I think as women too...") work, but they front-load context-building instead of hook. In a scroll-feed, the first 3 seconds decide retention. A natural conversational start can lose viewers before the payoff lands.

2. **The "earned line" problem.** Hook-only clips deliver the punch but lose the context that makes the punch meaningful. Story-only clips have context but no hook.

3. **The memory problem.** Lines you hear once fade. Lines you hear twice — once mysterious, once contextualized — embed. IG-save behavior correlates with the "OH that's what they meant" moment.

This is the same loop-and-land pattern used in long-form storytelling (Save the Cat's "opening image / closing image" mirror, podcast cold opens that quote from minute 47), miniaturized for ≤90s clips.

## When to Apply

**Apply when ALL of these are true:**

- Clip duration target ≤90 seconds (above that, the loop is too long for viewer to track)
- Source contains at least one quotable/standalone-meaningful line (not "as I was saying," not a half-sentence)
- The quotable line is delivered naturally somewhere AFTER the natural start (so the structural recall has somewhere to loop FROM)
- Platform is short-form scroll-feed: IG Reels, TikTok, YouTube Shorts, X video clips
- The clip is content-bearing (teaching, story, vulnerability moment) — not pure aesthetic

**Skip when:**

- Clip is ≥2 minutes — the loop is too long to track, use linear structure
- The natural opening already IS the most quotable moment (no recall available, just open on it)
- The hook line requires immediate context to make sense (e.g., "...the third one is..." — meaningless without setup)
- The source is action/visual-driven, not verbal — recall depends on a memorable verbal line
- Format is talking-head documentary or longer-form essay where curiosity gaps are unwelcome

## How to Apply

### Phase 1 — Identify the Recall Line

Scan the source clip / SS report for the most quotable line. Criteria:

- **Standalone meaning** — works without prior context as a cold open
- **Punchy phrasing** — short, declarative, emotionally direct
- **Earned by the story** — gains weight after the explanation, lands harder on recall
- **Belief-shift anchor** — connects to the offer's core belief shifts (R1-R6, etc.)
- **Natural delivery moment** — <example-client>/example-artist/speaker actually says it on camera with conviction

Typically the SS report's Gold-tier clips and Triple-flagged segments are the candidate set.

### Phase 2 — Cut the Hook (2-3 seconds)

Extract the hook line as its own micro-clip:

- Duration target: **2.0-3.0 seconds** (<your-name>'s 3-second hook rule)
- Include a **0.2s lead-in** so the first consonant isn't clipped
- Include a **0.3s tail** so the final consonant lands cleanly
- **Single sentence/phrase only** — don't run two sentences into the hook
- Word-level Whisper from `gold-standards/whisper-anti-hallucination-config.md` gives precise boundaries

### Phase 3 — Cut the Body (the natural sequence)

Cut the natural sequence as you would for a non-recall clip:

- Start at the natural opening (host setup, speaker's narrative entry)
- Run through the full story including the recall moment in its natural position
- End on the payoff/resolution + 0.5s tail buffer (see `gous/scissors-half-second-tail-buffer.md`)

**Critical:** Do NOT cut around the recall line in the body. The viewer must hear it land naturally for the loop to close.

### Phase 4 — Concatenate Hook → Body

Stitch hook + body via segment-extraction + concat demuxer (NEVER `select/aselect` — see Scissors pitfall registry):

```
final_clip = hook_2-3s + body_full
```

Total duration = hook + body. Verify ≤90s for Reels/Shorts; ≤60s for IG Feed Video; ≤30s for ultra-tight cuts.

### Phase 5 — Fidelity Verification (mandatory)

Run the fidelity verification loop (`gold-standards/fidelity-verification-loop-for-clip-cutting.md`) on the concatenated clip. Verify:

- Hook line appears in transcript at t=0
- Hook line appears AGAIN at its natural source position (proves the body kept it)
- Word-count and key phrases match expected ≥98%

If the recall line is missing from the body (you accidentally trimmed past it), the loop doesn't close — re-cut.

### Phase 6 — Visual Treatment Notes (for editor in CapCut)

In the edit map, flag:

- **Hook frame:** subject's most direct-address moment with the line. If source delivery has weak eye contact, use B-roll or kinetic text instead.
- **Hook-to-body transition:** clean hard cut, no fade. The curiosity gap depends on viewer not seeing the seam.
- **Recall moment:** can be visually identical to hook (intentional callback) OR a different moment of subject on camera (subtler — viewer recognizes audio, not visual). example-artist's exemplar uses the subtler version.
- **Captions:** burn the hook line large + kinetic on the cold open. Standard captions for the body. When the recall happens in the body, optionally repeat the kinetic-text treatment so the visual mirrors the audio loop.

## Anti-Patterns (Failure Modes This Prevents)

- **Linear-only opens for ≤90s content.** Loses the hook-retention window. The first 3 seconds are the conversion event.
- **Hook-only clips with no recall.** Punch lands, then evaporates. No memory anchor. Save rate drops.
- **Recall line cut from body.** Loop never closes. Viewer feels the cold open was unearned. Worse than no recall at all.
- **Recall on >90s content.** Loop too long to track. Viewer forgets the cold open before the recall hits.
- **Two different lines as hook + recall.** Confuses the loop. The SAME line is what creates the closure.
- **Hook lines that need context.** "...the third reason is..." → meaningless cold open.
- **Visual identical hook + recall when subtler would land harder.** Viewer notices the visual repeat and feels gimmick. Use different on-camera moments when possible.

## Anti-Pattern: Fast Run-On Leading-Word Bleed (slow-seek edition)

Distinct from <your-related-note> (which is about fast-seek snapping to a keyframe). Even with FRAME-ACCURATE slow-seek, a hook IN placed at the word boundary of a fast conversational run-on catches the tail of the preceding filler/conjunction — because there is no inter-word silence to cut on.

Observed (2026-06-02 Cortisol × <example-client> batch), surfaced by the fidelity loop:
- "no no like it's not your kids"  → hook opened "no like it's not your kids"
- "because all your neurotransmitters…" → hook opened "because all your…"
- "…that it all begins with digestion" → hook opened "that it all begins…"

### Decision rule — accept vs. clip (apply once, then commit)
1. Move the IN forward 0.1–0.3s ONE time.
2. If the leading filler clears AND the first real word's onset is intact → keep.
3. If the only way to drop the filler is to clip INTO the payload word's onset (soft/garbled first syllable) → STOP. Accept the soft filler. Flag the editor (CapCut) to shave it on the waveform + burn the clean caption.

**The payload word's integrity outranks filler removal.** A soft "no like" is better than a clipped "—t's not your kids." This is the inverse of the Phase 2 "0.2s lead-in" rule: lead-in protects the first consonant; this protects against the lead-in swallowing the previous word.

## Validation History

- **Canonical exemplar:** example-artist "If You Don't Choose Yourself" clip (94s, 1080p). Editor pulled the signature line from approximately mid-conversation, placed as 0:00-0:02.78 cold open, dropped to host's setup question, ran the full story including the line's natural delivery at 0:53.66-0:60.86, continued through the "do it scared / life opens up" payoff at 0:88.56.
- **Decoded:** 2026-05-17 via word-level Whisper transcription + 1fps frame extraction. Confirmed structural pattern: HOOK → TRANSITION → STORY → RECALL → PAYOFF.
- **Qualification date:** 2026-05-17
- **Counsel review:** <your-name> direct ("This will be one of our gold standards for starting videos")
- **Replication count:** 1 documented canonical exemplar (example-artist). Additional <example-client> clips queued for replication via remaining SS handoff segments.
- **Last re-validated:** 2026-05-17
- **Replication target:** apply to ≥5 <example-client> clips before quarterly re-validation. Track failure modes (lines that didn't earn the recall, length overshoots, fidelity-loop failures).

## Cross-Skill Applicability

| Skill | How It Applies |
|---|---|
| `sixth-sense-scissors` | Default opening structure for any clip cut ≤90s with a quotable line. Add to Phase 4 (Analysis) as a default-on architecture option. |
| `sixth-sense-sage` | When Sage produces B-roll-bearing clips ≤90s, apply recall structure for the verbal narrative. |
| `sixth-sense` (analysis) | SS reports should flag candidate "recall lines" alongside Gold-tier moments (the lines most likely to earn cold-open + recall treatment). |
| `vsl-activator` | VSL hook architecture parallel — the "10x hook tease" technique. Recall closure happens at the offer reveal. Different scale, same principle. |
| `ad-copy-forge` | When forge ingests a clip as ad source, the hook line becomes the headline; the recall structure informs copy flow. |
| `power-clip-pro` | Power Clip 12-part framework already has hook + reveal — recall technique is the explicit clip-mechanics version for video output. |

## The 3-Second Hook Rule (<your-name>, 2026-05-17)

**All IG/short-form clips must have a strong hook in the first 3 seconds.** This rule applies whether or not the recall technique is used. When the recall technique is in scope, the 2-3s hook IS the cold-open line. When recall is not in scope (>90s, no quotable line), the first 3 seconds must still earn the watch — punchy declarative, emotional reveal, pattern interrupt, or visual cold open with kinetic text.

The 3-second rule is a HARD requirement for IG Reels saves and TikTok For-You-Page retention.

## Connections

- <your-related-note> — session that spawned this gold standard (example-artist clip study session)
- <your-related-note> — required to verify the recall line is preserved in the body
- <your-related-note> — word-level boundary identification for hook extraction
- <your-related-note> — applies to body's end + hook's tail
- example-artist SS report at `~/Projects\sixth-sense\output\example-artist Interview\SIXTHSENSE_REPORT.md` — top clip "If You Don't Choose Yourself" is the canonical Recall Technique exemplar
