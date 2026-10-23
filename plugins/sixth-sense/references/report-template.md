# SixthSense Report Template

## Assembly Map

| Report Section | Source | Notes |
|---|---|---|
| Header metadata | Registry (preprocessing data) | Duration, segments, word count, scan date |
| Agents Deployed table | Registry (agent count + segment counts from outputs) | 6 agents, their roles, segment counts |
| Consensus Map | Consensus algorithm output | Top clips with multi-persona breakdown |
| Content Scanner (P1-A) full results | `p1a_content_scanner.md` | Ranked table + key quotes + stats |
| Content Deep Diver (P1-B) summary | `p1b_content_deep_diver.md` | Top 3 highlights + FINAL ADJUSTED RANKINGS |
| Emotion Scanner (P2-A) full results | `p2a_emotion_scanner.md` | Ranked table + Emotion-Only Discoveries + arc |
| Emotion Deep Diver (P2-B) summary | `p2b_emotion_deep_diver.md` | Top 3 goosebump moments + trajectory map + rankings |
| Structure Scanner (P3-A) full results | `p3a_structure_scanner.md` | Ranked table + loop candidates + series + platforms |
| Structure Deep Diver (P3-B) summary | `p3b_structure_deep_diver.md` | Top 3 viral predictions + cross-segment analysis + rankings |
| Energy Profile | `energy_map.txt` | Filtered to top 5 peaks and valleys |
| Clip Packages (A, B, C) | Consensus algorithm output | Quick Wins, Deep Value, The Story |
| Summary Statistics | Derived from all agent outputs | Totals, averages, tier distribution |

---

## Template

```markdown
# SIXTHSENSE REPORT: {VIDEO_TITLE}

**Scan Date:** {SCAN_DATE}
**Video:** {VIDEO_FILENAME}
**Duration:** {DURATION_FORMATTED} ({DURATION_SECONDS}s)
**Transcript Segments:** {TRANSCRIPT_SEGMENTS} | **Words:** {WORD_COUNT}
**Scan Config:** {CLIP_TARGETS_SUMMARY} | Platforms: {PLATFORMS} | Focus: {CONTENT_FOCUS}

---

## Agents Deployed

| Agent | Role | Segments Analyzed | Top Score |
|-------|------|-------------------|-----------|
| P1-A | Content Scanner | {P1A_COUNT} | {P1A_TOP} |
| P1-B | Content Deep Diver | Top {P1B_COUNT} from P1-A | {P1B_TOP} |
| P2-A | Emotion Scanner | {P2A_COUNT} (+{P2A_DISCOVERIES} discoveries) | {P2A_TOP} |
| P2-B | Emotion Deep Diver | Top {P2B_COUNT} from P2-A | {P2B_TOP} |
| P3-A | Structure Scanner | {P3A_COUNT} | {P3A_TOP} |
| P3-B | Structure Deep Diver | Top {P3B_COUNT} from P3-A | {P3B_TOP} |

---

## Consensus Map

*Top clips ranked by consensus algorithm. Triple-flagged first, then double, then promoted emotion-only.*

{For each consensus segment, write:}

### {RANK}. "{CLIP_TITLE}" — {TIER}
**Timestamp:** [{TIMESTAMP}] | **Consensus Score:** {SCORE} | **Flags:** {FLAG_ICONS}

**Why this ranks #{RANK}:**
{2-3 sentence summary pulling the strongest insight from each flagging agent. Reference specific scores, energy data, and structural qualities.}

| Lens | Score | Key Finding |
|------|-------|-------------|
| Content (P1-B) | {SCORE} | {One-line finding} |
| Emotion (P2-B) | {SCORE} | {One-line finding} |
| Structure (P3-B) | {SCORE} | {One-line finding} |

**Recommended Platform:** {PLATFORM} | **Clip Length:** {LENGTH} | **Package:** {A/B/C}

---

{Repeat for top 5-8 consensus segments}

---

## Content Scanner (P1-A) — Full Results
**Agent:** Content Intelligence Scanner | **Segments Found:** {COUNT}

{Paste full P1-A ranked table}

**Key Quotes:**
{Paste P1-A key quotes section}

**Stats:** {Paste P1-A stats line}

---

## Content Deep Diver (P1-B) — Summary

**Top 3 Content Highlights:**
{For each of the top 3 P1-B segments, include: title, timestamp, adjusted score, 2-sentence summary of teaching value + editing recommendation}

**Full Rankings:**
{Paste P1-B FINAL ADJUSTED RANKINGS table}

---

## Emotion Scanner (P2-A) — Full Results
**Agent:** Energy & Emotion Scanner | **Moments Found:** {COUNT}

{Paste full P2-A ranked table}

**Emotion-Only Discoveries:**
{Paste P2-A discoveries section}

**Emotional Arc:** {Paste P2-A emotional arc summary}

---

## Emotion Deep Diver (P2-B) — Summary

**Top 3 Goosebump Moments:**
{For each of the top 3 P2-B moments: title, timestamp, adjusted score, vulnerability score, goosebump factor, 2-sentence emotional impact summary}

**Emotional Trajectory:**
{Paste P2-B ASCII trajectory map if generated}

**Full Rankings:**
{Paste P2-B FINAL ADJUSTED RANKINGS table}

---

## Structure Scanner (P3-A) — Full Results
**Agent:** Structure & Virality Scanner | **Segments Found:** {COUNT}

{Paste full P3-A ranked table}

**Loop Candidates:** {Paste P3-A loop candidates}
**Series Potential:** {Paste P3-A series section}

---

## Structure Deep Diver (P3-B) — Summary

**Top 3 Viral Predictions:**
{For each of the top 3 P3-B segments: title, timestamp, adjusted score, viral prediction score, structure type, recommended platform}

**Cross-Segment Analysis:**
{Paste P3-B cross-segment findings: loop pairs, series architecture, stitch bait candidates}

**Full Rankings:**
{Paste P3-B FINAL ADJUSTED RANKINGS table}

---

## Energy Profile

**Top 5 Energy Peaks:**
{From energy_map.txt, list the 5 highest-energy windows with timestamp, bar count, BPM, silence %}

**Top 5 Energy Valleys:**
{5 lowest-energy windows — these may indicate reflective/vulnerable moments}

**Energy-to-Clip Correlation:**
{How many of the top 10 consensus clips occur at or within 30s of an energy peak?}

---

## Recommended Clip Packages

### Package A: Quick Wins ({COUNT} clips)
*Ready to publish with minimal editing.*

| # | Clip Title | Timestamp | Score | Platform | Length |
|---|-----------|-----------|-------|----------|--------|
{Quick Win clips}

### Package B: Deep Value ({COUNT} clips)
*High substance, needs editing work.*

| # | Clip Title | Timestamp | Score | Needs | Platform |
|---|-----------|-----------|-------|-------|----------|
{Deep Value clips with "Needs" column: extended window / text overlay / context frame / re-cut}

### Package C: The Story ({COUNT} clips)
*Narrative arc — combine for long-form or multi-part series.*

| Order | Clip Title | Timestamp | Role in Arc |
|-------|-----------|-----------|-------------|
{Story clips with narrative role: Setup / Build / Peak / Resolution / Callback}

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total unique segments found | {N} |
| Triple-flagged | {N} |
| Double-flagged | {N} |
| Single-flagged | {N} |
| Emotion-Only Discoveries | {N} |
| GOLD tier | {N} |
| STRONG tier | {N} |
| SOLID tier | {N} |
| Highest consensus score | {SCORE} — "{TITLE}" |
| Average consensus score | {AVG} |
| Clips at energy peaks | {N} of {TOTAL} |

---

## What This Report Does Not Do

- **It does not edit your video.** It identifies WHERE to cut, not HOW to cut.
- **It does not guarantee virality.** Scores predict quality and platform fit, not algorithmic performance.
- **It does not replace human judgment.** The final clip selection should always include your creative instinct.
- **Timestamps are approximate.** They reference transcript segment boundaries, which may be +/- 2 seconds from ideal cut points.

---

*Generated by SixthSense v1.0 — 6-agent video intelligence scanner*
*Agents: P1-A, P1-B, P2-A, P2-B, P3-A, P3-B*
*Output files: {LIST_OF_OUTPUT_FILES}*
```
