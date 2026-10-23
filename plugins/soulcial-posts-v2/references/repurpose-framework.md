> **Source & Attribution:** Frameworks studied and adapted (not copied) from Blotato — blotato.com · support@blotato.com · GitHub Blotato-Inc/blotato-skills · help.blotato.com. No OSS license grant exists; attribution is credit-by-name + source-link per the user's Life Gamer Code (study/adapt/model, never steal/copy). Blotato's own 7 skills remain installed and unmodified.

# Repurpose Framework (v2) — 1 → many fan-out

One big piece goes in (a blog post, a newsletter, a YouTube transcript, a raw script). A week of posts built for each platform comes out. The split never changes:

> **Exactly 3 LinkedIn posts + 5 X threads + 2 short-form video scripts.**

Every piece gets written for the platform it lands on. Nothing gets pasted from one to the next. That handles the two jobs that make distribution hard: getting many posts out of one idea, and getting each of those posts read.

**Use this when** you're working from a full, long piece. A lone idea that fits in a paragraph belongs with the single-post writer, so pass it there.

## Workflow

### Step 1: Load context
Open the active voice profile (`active_voice_path`, resolved by `references/social-spine/voice.md`). Its voice, audience, CTA, and **Strong Opinion / Wedge** steer every output, and its protected tics get credited. No profile? Keep going. Repurpose runs fine without one; say once that loading it tightens the voice, then move on. Note the source type (blog / newsletter / transcript / script). Anything spoken, like a transcript or a raw script, comes loaded with filler and verbal habits, so expect to trim.

### Step 2: Extract the core themes
Go through the whole source, start to finish. Pull:
- **1 central thesis** — the biggest idea in the piece.
- **3-7 supporting points** — separate sub-ideas, each able to carry a post by itself.
- **Every concrete asset** — numbers, names, stories, quotes, results, and the contrarian takes. Hooks and proof get built out of these.

Before drafting, give the user a quick 2-3 line readback of the themes so they can steer. Keep it tight. Nobody should have to sign off on a long outline.

### Step 3: Map themes to outputs
The output is always:
- **3 LinkedIn posts** — built from the 3 themes with the strongest professional or story angle.
- **5 X threads** — built from 5 themes that break into a run of quick, punchy tweets.
- **2 short-form video scripts** (Reels / TikTok) — the 2 most visual or emotional themes.

A theme can show up in two formats only if the angle is different each time. The same post in a new font is still the same post.

### Step 4: Open every output with a hook
The first line of every post, thread, and script **comes from `viral-hooks-library.md`.** Give it the theme and the platform, and take back a tested pattern filled in with details from the source. **A generic AI intro never opens anything.**
- Pair category with theme: a result or number goes to The Receipt, a strong opinion to Contrarian, a mistake to Negative Frame.
- **Rotate categories through the batch.** Ten posts with identical openings look like a template.

### Step 5: Write each output to its platform (native-rewrite rules)

**LinkedIn posts (3):**
- Land the hook inside the first 2 lines (roughly 140 chars before "…see more").
- Target 1,200-1,500 chars.
- One idea only. Keep paragraphs short and break lines so it skims easily.
- Close on a CTA that pulls comments (LinkedIn counts a comment for roughly 2x a like): a question that splits the room, or "what's missing from this?"
- Keep outside links out of the post and put them in the first comment. 3-5 hashtags at the end are optional.

**X threads (5):**
- The first tweet is the hook. Under 280 chars, best at 60-100. It has to make someone tap to open the thread.
- 4-7 tweets in each thread, one beat apiece. Each tweet has to make sense read alone.
- Zero hashtags. Links wait for the last tweet.
- The closing tweet either asks for replies or sums it up, with a link or follow ask if you want one.

**Short-form video scripts (2):**
- **Hook (first 1.7s):** what you say AND what's written on screen, and each has to stop a thumb on its own. Take it from `viral-hooks-library.md`.
- **Body (15-40s):** the spoken lines kept short, marked up with bracket cues for [b-roll / visual] and [on-screen text].
- **CTA (final 3s):** something like "Save this," "Follow for part 2," or "Comment [keyword]."
- Lay it out as `HOOK`, `BODY`, `CTA`. Keep the spoken total under 45s.

### Step 6: Universal voice rules (every output)
- Contracted forms every time (can't, we're, you'll).
- Short sentences, active voice.
- Talk straight to the reader as "you."
- Digits for numbers ("3 steps," not "three steps").
- Em dashes per the active voice profile (zero by default; allowed only if the profile documents em-dashes-on-social as a tic).
- One post, one concrete idea.
- Real details beat broad claims, so take the actual numbers and names from the source.
- Credit documented voice tics; don't scrub them out as "AI-isms."

### Step 7: Grade + ethics gate (ship condition)
Put every output through `virality-grader.md`. Hook strength carries 50% of that score. Make the fixes it hands back and keep reworking the hook until it passes. **Ship condition per output: graded 8+ AND clears both precedence vetoes (compliance/claims-safety and ethics/soul-lens).** A high virality score never overrides an ethics or compliance block. Nothing under 8/10 goes back to the user, and nothing that fails the gate does either.

### Step 8: Return the batch (grouped output)

```
## LinkedIn (3 posts)
### Post 1 — [theme] — [hook category] — [score]/10
[full post]
...

## X Threads (5)
### Thread 1 — [theme] — [hook category] — [score]/10
1/ [hook tweet]
2/ ...
...

## Short-Form Video Scripts (2)
### Script 1 — [theme] — [hook category] — [score]/10
HOOK: [spoken] / [on-screen text]
BODY: ...
CTA: ...
```

Once the batch is out, ask if any of it should be scheduled, and pass the picks to the scheduler.

## What NOT to Do
- No identical text on two platforms. Each one gets rewritten for where it lives, not just reformatted.
- Hold the counts exactly: 3 for LinkedIn, 5 X threads, 2 scripts. When the source can't support 10 different angles, tell the user and deliver fewer strong posts instead of stuffing the batch with weak ones.
- No generic AI intro on anything. Every opening line comes out of the hooks library.
- Nothing below 8/10 and nothing that fails the ethics/compliance gate goes back to the user. Keep looping.
- No long outline for the user to approve. Two or three lines on the themes will do.
- Scrub transcript filler ("um," "like I said," "you know what I mean") from every output.
