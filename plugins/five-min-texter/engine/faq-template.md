# FAQ — the closed-book scope fence (billboard rule)

> The bot may **only** state facts that live in this file. the owner fills it in Intake Round 3.
> **Billboard rule:** only put here what the owner would be comfortable seeing on a public billboard.
> Anything sensitive, clinical, or case-specific does NOT go here — it routes to the owner personally.

```yaml
# config → faq  (this block is injected into the bot brain as `faq`)

practice_name:        # [FILL]  e.g. "Riverstone Wellness"
owner_first:         # [FILL]  e.g. "Riley"
booking_link:         # [FILL]  the SimplePractice shareable booking URL

services:             # [FILL]  plain, non-clinical descriptions
  -                   #   e.g. "1:1 wellness coaching sessions"
  -                   #   e.g. "breathwork sessions"

hours:                # [FILL]  e.g. "Mon–Thu, 9am–5pm PT"
location:             # [FILL]  e.g. "Virtual (Zoom) + in-person in Spokane, WA"
rate_band:            # [FILL or OMIT]  e.g. "Sessions start at $X" — only if the owner wants it stated
insurance_stance:     # [FILL]  e.g. "I don't bill insurance; I can provide a superbill on request"

# Hard scope fence — the bot will NOT discuss these over text; it defers to the owner:
will_not_discuss:
  - specific health concerns, symptoms, or diagnoses
  - anything that sounds like medical or mental-health advice
  - detailed pricing beyond rate_band (if set)
  - scheduling specifics beyond sharing the booking link
```

> Anything a prospect asks that isn't covered here → the bot says, warmly, that {{OWNER_FIRST}}
> will answer personally, and offers the booking link. It never improvises.
