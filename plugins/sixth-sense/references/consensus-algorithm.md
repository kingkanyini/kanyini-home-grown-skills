# SixthSense Consensus Algorithm

## Overview

The consensus algorithm merges outputs from all 6 agents (3 Scanners + 3 Deep Divers) into a unified ranking. It deduplicates overlapping segments, classifies by flag count, calculates consensus scores, assigns tiers, and assembles clip packages.

## 8-Step Algorithm

### Step 1: Collect Final Scores

Read the `## FINAL ADJUSTED RANKINGS` table from each Deep Diver output:
- **P1-B:** Content Deep Diver rankings (top 10 content segments)
- **P2-B:** Emotion Deep Diver rankings (top 10 + up to 4 Emotion-Only Discoveries)
- **P3-B:** Structure Deep Diver rankings (top 10 structure segments)

For each entry, extract: `Timestamp`, `Title`, `Adjusted Score`, `Source Agent`.

### Step 2: Deduplicate Overlapping Segments

Two segments OVERLAP if their timestamp ranges share >50% of the shorter segment's duration.

```
Overlap function:
  overlap_start = max(seg_a.start, seg_b.start)
  overlap_end = min(seg_a.end, seg_b.end)
  overlap_duration = max(0, overlap_end - overlap_start)
  shorter_duration = min(seg_a.duration, seg_b.duration)
  overlap_ratio = overlap_duration / shorter_duration

  IF overlap_ratio > 0.50 → SAME segment (merge)
  ELSE → DIFFERENT segments (keep both)
```

**When merging:** Use the wider timestamp range (union of both). Keep all titles (primary = highest-scoring agent's title). Collect all scores by lens.

### Step 3: Classify by Flag Count

After deduplication, classify each unique segment:

| Classification | Condition |
|---------------|-----------|
| **Triple-flagged** | Appeared in P1-B AND P2-B AND P3-B |
| **Double-flagged** | Appeared in exactly 2 of 3 Deep Diver outputs |
| **Single-flagged** | Appeared in exactly 1 Deep Diver output |
| **Emotion-Only** | Appeared ONLY in P2-B as an Emotion-Only Discovery (never flagged by P1-A or P3-A) |

### Step 4: Calculate Consensus Scores

| Classification | Formula |
|---------------|---------|
| Triple-flagged | `consensus = average(p1b_score, p2b_score, p3b_score)` |
| Double-flagged | `consensus = average(two_scores) - 0.02` |
| Single-flagged | `consensus = adjusted_score - 0.05` |
| Emotion-Only | `consensus = p2b_adjusted_score` (no discount) |

### Step 5: Assign Tiers

Apply the scoring rubric tiers to the consensus score:

| Consensus Score | Tier |
|----------------|------|
| 0.90 - 1.00 | GOLD |
| 0.80 - 0.89 | STRONG |
| 0.70 - 0.79 | SOLID |
| < 0.70 | REFERENCE |

### Step 6: Rank

**Primary sort:** Flag count (triple > double > single/emotion-only)
**Secondary sort:** Consensus score (descending)

**Promotion rule:** Emotion-Only segments with consensus score >= 0.85 are ranked alongside double-flagged segments (promoted above single-flagged).

### Step 7: Assemble Clip Packages

Group the ranked segments into 3 packages:

#### Package A: Quick Wins
- Segments that are **ready to clip with minimal editing**
- Criteria: GOLD or STRONG tier + Entry/Exit Score >= 4/5 (from P3-B) + duration matches a clip target
- These go straight to the editor

#### Package B: Deep Value
- Segments with **high teaching or emotional value** but need editing work
- Criteria: STRONG or SOLID tier + Teaching Value >= 0.80 (from P1-B) OR Vulnerability >= 8/10 (from P2-B)
- May need: extended windows, text overlays, context framing, re-cuts

#### Package C: The Story
- Segments that **tell a narrative when combined**
- Select 3-5 segments that form a narrative arc (emotional buildup → peak → resolution)
- These become a long-form compilation or multi-part series
- Use the Emotional Arc (from P2-A/B) and Series Potential (from P3-B) to guide selection

### Step 8: Write Outputs

**consensus-merge.json** — Machine-readable output:
```json
{
  "scan_date": "YYYY-MM-DD",
  "video": "filename",
  "total_unique_segments": N,
  "segments": [
    {
      "rank": 1,
      "timestamp": "MM:SS-MM:SS",
      "title": "Clip Title",
      "consensus_score": 0.93,
      "tier": "GOLD",
      "flag_count": 3,
      "flags": ["content", "emotion", "structure"],
      "scores": { "p1b": 0.92, "p2b": 0.95, "p3b": 0.91 },
      "package": "A"
    }
  ],
  "packages": {
    "A": { "name": "Quick Wins", "count": N, "segments": [...ranks] },
    "B": { "name": "Deep Value", "count": N, "segments": [...ranks] },
    "C": { "name": "The Story", "count": N, "segments": [...ranks] }
  }
}
```

**Feed into report:** The consensus data populates the Consensus Map section and Clip Packages section of SIXTHSENSE_REPORT.md.

## Edge Cases

- **No triple-flagged segments:** This is normal for shorter or lower-energy videos. Double-flagged becomes the top tier.
- **Emotion-Only floods:** If P2-B produces more than 4 Emotion-Only Discoveries, only promote the top 4 by score.
- **Score ties:** Break ties by flag count first, then by segment duration (shorter = more platform-flexible = ranked higher).
- **All scores below 0.70:** The video may not have strong clip material. Report this honestly in the summary — SixthSense does not fabricate quality.
