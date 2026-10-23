# Scroll-Posts Hero-Post Format Template (P6 Assembly)

**Canonical source for:** Phase 6 assembly (`06-posts.md` → `scroll-posts.md` export)

**This template documents the per-post structure for the 5 hero "scroll-stopping" posts.** Each post is one of the 5 content pillars and follows this format block exactly.

---

## H7 Rules (P6 Design Decision)

- **5 hero posts** — one per content pillar, derived from `04-pillars.md`
- **Format variety** — must span **at least 3 distinct formats** (Reel, carousel, static, story); no all-Reels collapse
- **Platform tagging** — if `active_platforms` has multiple entries, each post names its target platform (Instagram, LinkedIn, TikTok, YouTube Shorts, etc.)
- **Hook bank required** — each post picks a named hook type from `references/hook-bank.md` (Contrarian Take, Open Loop, Callout, Result-Reveal, Mistake/Confession, or First-3-Words rule applied inside one of the above)
- **Format-specific first-beat rule** — each format has a non-negotiable rule: Reel = hook in frame 1; carousel = cover-slide promise ≤10 words; static = hook in caption's first ~125 characters; story = open with poll/question
- **Thumb-stop test** — every post passes: *"Would the first line/frame stop YOUR thumb? If not, rewrite."* A FAIL is a blocker — mark `BLOCKER?: yes` and rewrite before shipping; never forward a FAIL to checkpoint
- **AI-isms ban + Humanization Pass** — all 5 posts are public-facing copy; run the full scrub (banned phrases/patterns + 7-step Humanization Pass per references/social-spine/voice.md) before writing into artifact
- **Soul-lens application** — apply `soul_intensity` across all 4 axes to every post (spiritual vocabulary, framework naming, story-vs-statement ratio, CTA tone); validate the feeling before reframing at any intensity

---

## Per-Post Template Block

### **Post [N] — Pillar: [Pillar Name]**

**Platform:** [Instagram / LinkedIn / TikTok / YouTube Shorts / etc.] *(omit if single platform)*  
**Format:** [Reel / carousel / static / story]  
**Hook type:** [Named hook type from hook-bank.md]  
**Thumb-stop check:** [PASS / FAIL] *(BLOCKER?: yes/no)*  
**Soul-lens setting applied:** [soul_intensity level]

---

**[Hook Line]**  
*(The format-specific first beat. For Reel: the first spoken word or visual premise. For carousel: the cover-slide promise ≤10 words. For static: the opening caption line ≤125 characters. For story: the poll/question)*

**[Body / Value]**  
*(The useful insight, proof, or story payload. Format-agnostic.)*

**[CTA]**  
*(The ask: comment, save, click, DM, swipe up, etc.)*

---

## Example: Filled Post (Single Platform)

### **Post 1 — Pillar: Vulnerability & Authenticity**

**Platform:** Instagram  
**Format:** Reel  
**Hook type:** Open Loop  
**Thumb-stop check:** PASS  
**Soul-lens setting applied:** balanced

---

**"I posted one reel and got 40 coaching inquiries in 72 hours. Here's the thing I almost didn't share about how it happened."**  
*(Opens a question the viewer can't ignore — the brain wants the answer.)*

**Most creators think virality is about algorithms. It's not. It's about one moment of truth: did you stop scrolling because the person on-screen was being REAL? I stopped performing. I showed up as myself — the healer, the doubter, the one still learning. That authenticity is what stopped the scroll. People don't follow perfect. They follow honest.**

**Drop a comment: What's the ONE thing you've been afraid to share that might actually be your superpower?**

---

## Example: Blank Template (Copy & Paste)

### **Post [N] — Pillar: [Pillar Name]**

**Platform:** [Instagram / LinkedIn / TikTok / YouTube Shorts]  
**Format:** [Reel / carousel / static / story]  
**Hook type:** [Contrarian Take / Open Loop / Callout / Result-Reveal / Mistake/Confession]  
**Thumb-stop check:** [PASS / FAIL] *(BLOCKER?: yes/no)*  
**Soul-lens setting applied:** [subtle / balanced / overt]

---

**[Hook line — format-specific first beat goes here]**

**[Body / Value — the useful insight, story, or proof]**

**[CTA — what you're asking the audience to do]**

---

## Format-Specific First-Beat Checklist

Before marking `Thumb-stop check: PASS`, verify:

| Format | First-Beat Rule | Filled? |
|--------|---|---|
| **Reel** | Hook lands in frame 1 — first second of video. Spoken word or visual pattern interrupt, no intro/logo/countdown. | [ ] |
| **Carousel** | Cover slide makes ONE promise, ≤10 words. Next slide keeps it (proof or expansion). Hook on slide 2 = failed carousel. | [ ] |
| **Static** | First line of caption ≤~125 characters. Image supports but does not substitute. If image alone doesn't arrest, caption carries the weight. | [ ] |
| **Story** | Opens with poll or question — A/B, yes/no. Passive stories are skipped. Question must be easy to answer and self-identifying. | [ ] |

---

## Thumb-Stop Test (Non-Negotiable Gate)

**Before every `PASS` mark:**

Read the hook line as if you are scrolling at 1.5× on a crowded feed. Does it create a pattern interrupt — something that does NOT fit the expected content in that space?

- **Yes** → `PASS` ✓
- **Maybe / Sort of** → Rewrite. Revisit after rewriting.
- **No** → `FAIL` (blocker). Rewrite. Mark `BLOCKER?: yes` and do not ship.

If the hook is vague, safe, or predictable, it will not stop a thumb. Rewrite.

---

## AI-Isms Ban + Humanization Pass (Mandatory Before Write)

Every post must be scrubbed for:

1. **Banned phrases** (per references/social-spine/voice.md): "Here's the thing," "dive deep," "unlock your potential," "Let's be honest," "navigate," "leverage," etc. REPLACE before write.
2. **Banned structural patterns**: "So," "Now," "Remember,", repeated "not X, but Y", trailing "the one where…" qualifiers. REPLACE before write.
3. **7-step Humanization Pass**:
   - Rewrite anything that sounds built, not spoken (rougher, more direct, less impressive)
   - Make thought flow uneven — fragments, "And" openings allowed (but no em-dashes in emails per 2026-06-11 directive)
   - Strip AI tells one by one
   - Carry a clear point of view, not neutral observer tone
   - Add one concrete detail if it lands
   - Make every line pull the reader forward
   - Read as a skeptic — rewrite anything that sounds constructed or overcorrected

If more than 2 matches found, flag during P6 assembly.

---

## Soul-Lens Application (H5 Integration)

Apply `soul_intensity` to every post across these 4 axes:

| Axis | Subtle | Balanced | Overt |
|------|--------|----------|-------|
| **Spiritual vocabulary** | None explicit — values expressed through word choice and story, no spiritual terms in copy | Light — one or two conscious/values words per piece (e.g., "presence," "intention") without defining them | Foregrounded — spiritual vocabulary named and used as the lens (e.g., "energy," "healing," "subtle realm," "consciousness") |
| **Framework naming** | Off — no brand-specific framework terms appear in public copy | One per piece — one framework term introduced with brief context, never stacked | Woven through — multiple framework names used across the piece; audience is assumed to know the vocabulary |
| **Story-vs-statement ratio** | Story-led, value implied — the story carries the lesson; the principle is never stated outright | Mixed — one explicit principle statement embedded in a story arc; story still does the heavy lifting | Principle stated then illustrated — the conscious insight lands first, the story serves as proof |
| **CTA tone** | Invitation — soft, curiosity-led ("if this landed for you…") | Gentle direct — clear ask with warmth ("drop a comment / save this") | Mission-framed — the CTA is tied to a larger purpose or transformation ("this is how we change the game together") |

**Non-bypassable ceiling guardrail (all intensities):** Validate the feeling before reframing. If the post fixes the audience's pain without seeing it first, revise.

---

## Assembly Notes

- **P6 writes 5 of these blocks into `06-posts.md` (one per pillar)**
- **Export assembly reads this template and fills a new block per additional post requested in the expand offer**
- **Each block is self-contained** — no dependency on post order; posts can be reordered post-write without breaking structure
- **Format Variety Rule validation:** after all 5 are drafted, count distinct formats. If fewer than 3, flag and offer to rewrite one post in a different format.

