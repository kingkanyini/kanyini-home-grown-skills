# Tone Profiles Reference

## Schema

Each project gets a tone profile built from the client's Offer Optimizer during Phase 0 intake.

```json
{
  "ica_summary": "Brief description of the ideal client avatar",
  "visual_genres": ["cinematic", "nature", "clinical", "spiritual"],
  "emotional_register": "raw-vulnerable + aspirational",
  "reference_anchors": "X meets Y description",
  "cultural_notes": "Audience-specific considerations",
  "is_translated": true,
  "source_language": "German",
  "target_language": "English"
}
```

### Visual Genre Options
- cinematic / documentary
- anime / illustrated / hand-drawn
- abstract / artistic
- nature / organic
- urban / modern
- clinical / scientific
- spiritual / mystical
- energetic / motivational

### Emotional Register Options
- raw / vulnerable
- aspirational / elevated
- clinical / authoritative
- spiritual / contemplative
- energetic / motivational

---

## Gold-Standard Example: example-collective (example-contact example-surname)

**Source:** example-collective Offer Optimizer, POC session 2026-03-20

```json
{
  "ica_summary": "High-performing entrepreneurs (men AND women), 32-44, 5-20K+/mo, successful but physically disconnected, emotionally dysregulated",
  "visual_genres": ["cinematic", "nature/organic", "clinical/scientific", "spiritual/contemplative"],
  "emotional_register": "raw/vulnerable + aspirational — German directness with room for softness",
  "reference_anchors": "Wim Hof's raw intensity meets Pina Bausch's emotional movement — powerful enough for a boardroom, tender enough for a bedroom",
  "cultural_notes": "German audience values directness and substance. B-roll should feel EARNED, not decorative. Each visual moment should serve the argument, not just look pretty.",
  "is_translated": true,
  "source_language": "German",
  "target_language": "English"
}
```

### How the Tone Profile Shapes Agent Behavior

- **A1 (First Sweep):** Uses visual genres to suggest appropriate B-roll imagery. "clinical/scientific" → diagrams and data viz for technical moments. "spiritual/contemplative" → nature and breathwork footage for transformation moments.
- **A2 (Gap Hunter):** Uses emotional register to catch subtle shifts. "raw/vulnerable" register means even quiet moments of self-disclosure deserve visual support.
- **A3 (Synthesizer):** Uses cultural notes to validate appropriateness. Flags any B-roll suggestion that feels decorative rather than substantive for the audience.
- **Foreman:** Uses reference anchors to evaluate sourcing options. "Wim Hof meets Pina Bausch" means the footage should balance intensity with grace.
- **Boss Foreman:** Uses is_translated flag to gate bilingual mapping in the production brief.
