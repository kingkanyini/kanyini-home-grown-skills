---
updated: '2026-06-03'
---
---
type: gou-gold-standard
tags:
  - fidelity-loop
  - clip-cutting
  - whisper
  - sixth-sense-scissors
  - sixth-sense-sage
  - transcript-extractor-plus
scope: workflow
applies_to:
  - sixth-sense-scissors
  - sixth-sense-sage
  - sixth-sense
  - transcript-extractor-plus
  - watch
  - ad-copy-forge
kind: practice
status: stable
qualified_by: <your-username>
qualification_date: 2026-05-16T00:00:00.000Z
qualification_score: 9.5
last_validated: '2026-05-30'
version: 1
replicable: true
confidence: high
pii_firewall: true
redaction_status: redacted
version: 2
source_session: '<your-related-note>'
aliases:
  - fidelity verification loop
  - clip transcription verification
related:
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
  - '<your-related-note>'
updated: '2026-06-03'
---

# GOU Gold Standard — Fidelity Verification Loop for Clip Cutting

## The Insight

After every clip cut, **re-transcribe the CUT FILE with word-level Whisper and compare to the expected verbatim content. Iterate (re-cut → re-verify) until ≥98% fidelity.** The cut file is ground truth, never the source SRT.

## Why It's Gold

Visual review of short clips is unreliable. Truncations and mid-word starts are nearly invisible to an editor previewing a 60s clip in the timeline — the eye assumes the cut ended cleanly when it didn't.

Empirically proven in <your-related-note>: the initial <example-client> clip (v1, 44:57.0 → 46:00.0) truncated mid-sentence at "...and assess" — missing the full closing thought "where we need to take care of ourselves." Visual preview missed it. <your-name> caught it on playback. Without a verification loop, this would have shipped to a paid client.

After implementing the loop, v5 hit ≥98% verbatim match in 4 iterations. Catches both ends of the cut, internal duplications, and Whisper-side artifacts.

This practice also enforces the <your-related-note> discipline: the user's expectation of what's in the clip becomes machine-verifiable instead of assumed.

## When to Apply

Fires when ANY of the following are true:

- A clip-cutting skill produces a `_clean.*` deliverable
- A client deliverable (paid engagement) is being prepared, regardless of skill
- A specific quote or phrase is the load-bearing payload of the clip
- The cut spans a sentence/phrase boundary (high truncation risk)
- The user explicitly requests verification

Skip when:

- Producing a rough scratch preview (not deliverable)
- The cut is a single long take with no content boundary near edges (e.g., 5-minute lecture mid-section)

## How to Apply

Standard loop:

```
LOOP:
  1. CUT       — extract clip with current in/out boundaries
  2. TRANSCRIBE — run word-level Whisper on the cut file (see <your-related-note> for settings)
  3. COMPARE   — diff transcribed words vs expected verbatim content
                 score = (words_matching / total_expected_words) * 100
  4. DECIDE    —
       if score >= 98 AND boundaries clean (first/last words intact): PROMOTE
       else:
         identify failure mode (truncation, mid-word start, hallucination, drift)
         adjust in/out boundaries based on word-level timestamps
         goto LOOP
  5. PROMOTE   — rename cut to final deliverable name, copy transcript artifacts
```

Recommended Whisper backend: `faster-whisper` large-v3 with CUDA when available (faster, free, local — no API key). Reuse an existing project venv (e.g., the SixthSense `decoupled_preprocess.py` venv at `~/Projects\sixth-sense\.venv\`). Fall back to `/watch` skill's Groq/OpenAI path only if no local Whisper.

Always use the anti-hallucination settings from <your-related-note> for verification passes — verification depends on the transcript being faithful to audio, not language-model-imagined.

```python
from faster_whisper import WhisperModel

model = WhisperModel("large-v3", device="cuda", compute_type="float16")
segments_iter, info = model.transcribe(
    str(cut_path),
    word_timestamps=True,
    vad_filter=False,
    beam_size=5,
    language="en",
    condition_on_previous_text=False,   # anti-hallucination
    temperature=0.0,                    # anti-hallucination
    no_repeat_ngram_size=3,             # anti-hallucination
    compression_ratio_threshold=2.0,    # anti-hallucination
)
```

The `_words.json` output gives per-word start/end timestamps that pinpoint exact cut boundaries for the next iteration.

## Anti-Patterns (Failure Modes This Prevents)

- **Trusting visual preview alone.** A truncated end ("…and assess") looks like a clean cut in the timeline; the missing payoff word is invisible until playback.
- **Retrofitting original SRT onto the cut.** Per Scissors pitfall registry — Whisper SRT entries spanning the cut boundary get dropped or mistimed. Re-transcription is the only reliable source.
- **Single-pass verification.** One Whisper run can hallucinate or mis-segment. Loop until stable.
- **Stopping at "looks right enough."** 98% is the bar. 90% means a missing or mis-cut word that may be the load-bearing payload.

## Batch Discipline: score ALL clips (both ends) BEFORE pruning working files

For a BATCH of clips, do NOT rely on per-clip hook spot-checks — they miss TAIL truncations. Run an automated full-file scorer over EVERY clip that re-transcribes and reports first words + last words + a no-fabrication / order-fidelity score (e.g. `fidelity_score.py`: no-fab% = cut words present in source; order% = LCS vs source; recall clips dip ~3-5% from the intentional hook repeat).

**Sequencing rule:** run the batch scorer BEFORE deleting the source working windows. If you prune first and the scorer then finds a truncation, you must re-extract the working window to fix it — costly and avoidable.

**Boundary rule:** "first/last words intact" means checking the TAIL too, not just the hook. A clip can have a perfect cold-open and still clip its payoff line.

Evidence: 2026-06-03 Cortisol × <example-client> batch — 14 clips passed hook spot-checks, but the full-file scorer caught 3 tail truncations (payoff lines clipped: "...managing your cortisol", "...impossible to get anywhere else", "...clean up foundationally"). Working windows had already been pruned → forced re-extraction to fix. Order-fidelity dips on recall clips (87-91%) were correctly read as the intentional hook duplication, not defects.

## Validation History

- **Spawning incident:** v1 <example-client> Lymphatic cut (44:57.0 → 46:00.0) truncated at "assess" — missing the full closing thought. <your-name> caught on preview before promotion. See <your-related-note>.
- **Qualification date:** 2026-05-16
- **Counsel review:** <your-name> direct (post-incident directive: "We need 98% fidelity on these ones, super important")
- **Replication count:** 1 engagement (<example-client> Lymphatic, IG Reels clip 01). Subsequent clips in this same project will validate further.
- **Last re-validated:** 2026-05-16

## Cross-Skill Applicability

| Skill | How It Applies |
|---|---|
| `sixth-sense-scissors` | Mandatory at Phase 6 (re-transcribe clean file). Loop replaces single re-transcription pass. |
| `sixth-sense-sage` | When Sage produces a clip cut for B-roll placement or sub-comp output, run loop. |
| `sixth-sense` | If SS recommends a clip range, downstream cutter must verify. |
| `transcript-extractor-plus` | When TEP is used to transcribe a CUT file (vs source), loop applies. |
| `watch` | When `/watch` is invoked on a clip-deliverable, the response IS one loop iteration. |
| `ad-copy-forge` | When source material is a video clip, fidelity loop validates the clip's spoken content before forge ingestion. |

## Connections

- <your-related-note> — spawning session
- <your-related-note> — paired config that makes verification reliable
- <your-related-note> — verification respects user's explicit expectations
- Scissors pitfall registry entry: "Retrofitting original SRT onto clean file" — paired pitfall this loop prevents
- CLAUDE.md "Fidelity Principle" — global principle this is a concrete instantiation of
