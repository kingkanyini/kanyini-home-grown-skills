---
type: gold-standard
confidence: high
created: 2026-07-19
related:
  - "<your-related-note>"
tags:
  - video
  - highlight-reel
  - sixth-sense
  - scissors
  - production-beast
---
# Gold Standard — Highlight Reel Creation (Tiered Ladder)

Canonical reference run: **King <your-name> Highest Self Breathwork (Aurea)**, 2026-07-19. A 52m53s live-session video turned into a fidelity-verified 3-tier highlight ladder (15s / 60s / 5min) in one session.

## Deliverables (pointers — videos live in Dropbox, NOT in the vault)

`~/<your-vault-path> Sessions\Clips\king-<your-username>-aurea\`
- `King<your-name>_Aurea_Release_15s.mov` — 15.2s, 8 cuts
- `King<your-name>_Aurea_ChooseYou_60s.mov` — 69.6s, 13 cuts (trim map to 60.0 included)
- `King<your-name>_Aurea_Highlight_5min.mov` — 3:55 picture-lock, 22 cuts, 5 acts

Edit-map HTML copies (in this vault): `gold-standards/highlight-reel-creation/*.html`
Handoff spec: `~/Projects\sixth-sense\output\King<your-name>Aurea\SCISSORS_HANDOFF.md`
Scan report: same folder, `SIXTHSENSE_REPORT.md` (+ visual addendum)

## The Pipeline (non-negotiables)

1. **SixthSense 6-agent scan first** — words + emotion + structure. Honest calibration (0 GOLD is a valid result).
2. **/watch visual pass** — read actual frames; transcript-only scans miss hero shots (the scream arm-raise and the bow were invisible to the text lenses).
3. **Zoomed-in watch for cut points** — 5s frame sampling is NOT cut-accurate. Extract 0.5-1s timestamped tile grids (ffmpeg fps+tile) per cut window; verify every IN/OUT to ±0.5s. User-supplied timestamps get the same zoom verification (two of <your-name>'s were right, one was off — the grids caught it).
4. **Counsel EDL review in agent mode BEFORE cutting** (Production Beast #29). Round 1 rejected a "beautiful but static" 3-cut 15s (4-5/10); platform-native = 6-9 cuts/15s, hook ≤2s, differentiator (the Reiki) inside the first 30-45s. Dissent integration: McKinnon's song-as-summit overruled majority trimming.
5. **9.8 fidelity gate on the handoff doc** — adversarial audit of every quote/timestamp/sum vs transcript. Caught a wrong-line window (52:12 vs 51:57) and a wrong VO core. Iterate fixes → re-audit → PASS before Scissors touches ffmpeg.
6. **Cut = segment extraction + concat demuxer**, two-stage slow seek, never select/aselect. Zooms = crop/scale within 16:9. Probe the real source resolution first (this "4K" file was 1080p60).
7. **Fidelity loop on the cut files** — Whisper (anti-hallucination config) on each rendered tier, phrase-presence checks. Iteration 1 caught the plant-medicine line outside its picture window + a hook word clipped. Iteration 2 PASS. Shouted words over crowd noise won't transcribe — verify by boundary math, don't false-fail.
8. **Ladder DNA** — every tier is the same arc at higher compression: hook (peak moment) → what-he-does (differentiator) → community/emotion proof → release → resolution beat (bow/hug). Longer tiers expand the SAME spine; they don't add new ideas.
9. **B-roll carries live audio** — in guided-session footage the facilitator speaks during the "visual" windows; verify what the B-roll says before layering VO over it (here it was gold and kept).
10. **Cleanup + routing** — delete intermediate segment renders, keep `.py` toolchain in `_build/`, MOVE finished clips to the Dropbox project Clips folder.

## Related skills
- `/sixth-sense` (scan) → `/watch` (visual) → Production Beast #29 (EDL) → fidelity gate → `/sixth-sense-scissors` (cut + verify)
