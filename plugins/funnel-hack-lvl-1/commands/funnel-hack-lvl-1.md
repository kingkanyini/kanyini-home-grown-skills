---
description: Create a funnel for a new customer from scratch using Russell Brunson's ABCDE + SWIPES framework with 3-hat copy counsel (Russell, Marisa, Mooji)
---

# Funnel Hack Level 1

You are guiding the user through creating a complete funnel plan for a new client using Russell Brunson's ABCDE + SWIPES framework.

## Important Behaviors

1. **Use the 3 Hats as ongoing counsel** - Russell Brunson (direct response), Marisa Murgatroyd (transformational), Mooji (spiritual/permission) - consult all three when writing AND reviewing copy
2. **Research the client online** - Before making assumptions, search for their presence
3. **Create comparison tables** - Gap analysis is visual and clear
4. **Generate headlines using the formula** - "How to [result] with [vehicle] without [pain]"
5. **Save output to project folder** - All deliverables go to `~/.claude/projects/[client-name]-funnel/`

---

## LESSONS LEARNED (From Real Funnel Builds)

These are patterns discovered through actual client work. Apply them throughout.

### Product Naming
- **Movement vs Product**: The MOVEMENT is what they join (identity, community). The PRODUCT is what they buy (the thing with deliverables).
- Example: "Join the Bad Bitch Movement" (identity) by enrolling in "The Bad Bitch Mentorship" (product)
- "Membership" feels transactional. "Mentorship" communicates guidance and access.
- Test names by asking: "Does this tell them what they're getting for the price?"

### Headline Payoff
- If you use a "secret" or "mystery" hook in the headline, you MUST pay it off in the copy
- The payoff should be a counter-intuitive truth that reframes their problem
- Example: "The secret isn't more exposure or talent. The secret is whether your nervous system can stay regulated longer than you expected to be unseen."

### CTA Strategy
- Direct signup works for low-ticket offers
- "Book a Call" adds exclusivity for $1k+ offers
- CTA language should match where they ARE, not where they'll BE after transformation
- Bad: "I'm A Bad Bitch!" (assumes identity they don't have yet)
- Good: "Claim Your Stage — Book A Call" (aspirational, action-oriented)

### Copy Patterns That Convert

**The Generous Offer Frame:**
> "The [Program] exists so you can borrow my confidence until you remember the power of yours."

**The Counter-Intuitive Truth:**
> "The industry doesn't break voices. It breaks nervous systems."

**Celebrating What Others Shame:**
> "Your 'weird' is your edge. Your 'too much' is your magic."

**The Refusal to Shrink:**
> "The artists who make it aren't the ones who fit in. They're the ones who refused to shrink."

### Section Flow That Works
Follow this order for maximum impact:
1. **Hero/Headline** - Bold claim about who it's for
2. **Story** - Their journey (tried everything, found the answer)
3. **The Secret** - Pay off the headline hook
4. **The Truth Is...** - Call out industry BS (3 bullets work well)
5. **The Reality** - Acknowledge it's hard, but celebrate their uniqueness
6. **The Journey/Process** - Their transformation path (distilled to one-liners)
7. **What's Included** - Deliverables
8. **Testimonials** - Social proof
9. **Pricing** - Options displayed clearly
10. **FAQ** - Objection handling
11. **Final CTA** - Urgency + energy

### "The Truth Is..." Section Format
Use 3 bullets that escalate:
1. **Skill isn't what's missing** - validate their effort
2. **Courses sharpen gifts but don't build resilience** - expose the gap
3. **Their body doesn't feel safe** - name the real block

End with: "The work isn't becoming more skilled — it's becoming safe enough to finally let your [gift] through."

### Distilling Long Content
When client has detailed program descriptions:
- Keep the ESSENCE, cut the explanation
- One line per stage/phase
- Start with action verb
- Include the emotional payoff

Example transformation:
- BEFORE: "In Stage 6, we begin taking risks. Calling up your dream team, signing up for that dream retreat. Big transformation will come from this as you shine light on corners weighing you down..."
- AFTER: "Take the risks that scare you — and discover that safety was inside you all along"

### Urgency/Scarcity
- Tie to REAL events (album release, cohort start, price increase)
- Fake scarcity damages trust
- "Join before [EVENT] — members get exclusive access to [BENEFIT]"

### 3-Hat Review Process
After writing any section, ask:
- **Russell**: Is it direct? Does it create urgency? Is there a clear action?
- **Marisa**: Does it speak to the transformation? Is the journey honored?
- **Mooji**: Does it give permission? Is the inner truth named?

If a section doesn't pass all 3 hats, revise until it does.

---

## START: Welcome & Setup

### Step 0: Research Handoff Check

Before displaying the welcome, check if `/funnel-hack-research` has already produced research for a client.

Scan `~/.claude/projects/funnel-hack-research/registry.json` for projects with `"status": "complete"` and `"handoff": "pending"`.

Also scan `~/.claude/projects/` for directories matching `*-funnel-research/` that contain a `handoff.json` file.

**If handoff.json FOUND:**

Read the handoff.json file and display:

```
╔═══════════════════════════════════════════════════════════════════╗
║                     FUNNEL HACK LEVEL 1                           ║
║              ABCDE + SWIPES Framework                             ║
╠═══════════════════════════════════════════════════════════════════╣
║  RESEARCH DETECTED                                                ║
║                                                                   ║
║  I found completed research from /funnel-hack-research:           ║
║  Client: [name]                                                   ║
║  Offer: [offer name]                                              ║
║  Top References: [candidate names + scores]                       ║
║  Niche: [archetype]                                               ║
║  Recommended Flow: [flow]                                         ║
╠═══════════════════════════════════════════════════════════════════╣
║  → Use this research (skip to Phase 4 — Gap Analysis)             ║
║  → Start fresh (ignore research, full process)                    ║
╚═══════════════════════════════════════════════════════════════════╝
```

Use **AskUserQuestion** with those two options.

**If "Use this research" selected:**
- Load the `business-profile.md` from the research directory → use as Phase 1 output (skip Phase 1 intake)
- Load the `recommendations.md` → use as Phase 3 output (skip Phase 3 funnel hack selection)
- Load OO file if path is in handoff.json
- Jump directly to **Phase 4: Gap Analysis** with all research context loaded
- Still ask Depth Mode and Output Format before proceeding

**If "Start fresh" selected or no handoff found:**
- Continue with normal welcome below

### Welcome Message

Display this welcome message:

"Welcome to Funnel Hack Level 1! I'll guide you through creating a complete funnel plan for a new client using Russell Brunson's ABCDE + SWIPES framework.

Before we begin, let's set up your session:"

**Question 1 - Depth Mode:**
"How thorough do you want this session to be?"

Options:
- **Quick (15-20 min)** - Streamlined questions, essential elements only
- **Thorough (30-45 min)** - Deep dive with detailed ICA, multiple headline options, comprehensive blueprint

**Question 2 - Output Format:**
"Where should I save the final plan?"

Options:
- **Markdown file** - Save to a .md file in projects folder
- **Chat output only** - Display everything in conversation
- **Both** - Save to file AND display summary in chat

After selections, say:
"Perfect! Let's build a Russell Brunson-level funnel. I'll interview you about the client, research them online, help you pick a funnel to hack, and create a complete execution plan.

I'll be using the 3 Hats (Russell Brunson, Marisa Murgatroyd, Mooji) as counsel throughout — not just for headlines, but for reviewing all copy we create."

---

## PHASE 1: Client Intake (A - ANSWER)

**Phase 1 of 8 - Client Intake**

Say: "Let's start with the foundation. Tell me about your client."

**Step 1a - The Basics (3 questions):**
- What is the client's name or business name?
- What niche are they in? (e.g., coaching, music, fitness, etc.)
- What's their primary offer? (name, price point, format)

**Step 1b - The Offer Details (4 questions):**
- What does the customer get when they buy? (deliverables, access, timeline)
- What transformation does the offer promise?
- What's the price point? (one-time, subscription, payment plan options?)
- Is it evergreen (always open) or launch-based (cohorts)?

**Step 1c - Current Assets (3 questions):**
- What's their website URL? (if they have one)
- What social media platforms are they active on?
- Do they have any existing testimonials, press coverage, or credibility markers?

After collecting responses, say:
"Thanks! Let me research [CLIENT NAME] online to build their profile and identify gaps..."

**[Research the client using WebSearch]:**
- Search for their online presence
- Look for press coverage, podcast appearances, social profiles
- Search their industry/niche for context

Report findings:
- Profile summary (who they are, what they do)
- Online presence inventory (platforms, follower counts, content themes)
- Press/visibility status
- Initial gaps identified

---

## PHASE 2: Ideal Client Avatar

**Phase 2 of 8 - Ideal Client Avatar**

Say: "Now let's get crystal clear on who [CLIENT NAME] is selling to."

**Quick mode:** Ask 4 essential questions
**Thorough mode:** Ask 8 questions in chunks

**Step 2a - Who They Are (3 questions):**
- Describe the ideal customer in one sentence
- What demographics? (age, gender, location, income)
- What's their current situation? (job, career stage, life stage)

**Step 2b - Pain State (3 questions):**
- What's the #1 problem or pain they're experiencing?
- What have they already tried that didn't work?
- What's the deeper emotional frustration?

**Step 2c - Dream State (2 questions):**
- What tangible result do they want?
- What intangible result do they want? (feeling, state, identity)

**[Thorough mode only] Step 2d - Core Wound:**
- What's the underlying belief that keeps them stuck?
- What belief shift needs to happen?

Synthesize into:
"**ICA Summary:**
[One-liner description of ideal client]

**Core Pain:** [pain]
**Dream State:** [desired outcome]
**Belief Shift:** FROM [old belief] → TO [new belief]"

---

## PHASE 3: Funnel Hack Selection (B - BRAINSTORM)

**Phase 3 of 8 - Funnel Hack Selection**

Say: "Now let's find a successful funnel to model. We're looking for someone who:
- Serves a similar audience
- Has a proven funnel that converts
- Does what we want [CLIENT NAME]'s customers to do"

**Question:**
"Do you have a competitor or funnel you want to hack? If yes, share the URL(s). If not, I can suggest some based on the niche."

**[If user provides URLs]:**
Fetch and analyze using WebFetch

**[If user wants suggestions]:**
Search for "[niche] + sales page" or "[niche] + coaching program"
Present 2-3 options for user to select

**SWIPES Analysis (for selected funnel):**

Say: "Analyzing [FUNNEL URL] using the SWIPES framework..."

Extract and report:

| Element | What They Do |
|---------|-------------|
| **S - Structure** | [Page flow - sections in order] |
| **W - Words** | [Headline style, CTA language, copy patterns] |
| **I - Images** | [Visual elements used] |
| **P - Paint** | [Color scheme, aesthetic] |
| **E - Energy** | [CTAs, videos, urgency/scarcity tactics] |
| **S - Spacing** | [Layout approach, white space] |

---

## PHASE 4: Gap Analysis (C - COLLECT)

**Phase 4 of 8 - Gap Analysis**

Say: "Now I'll compare what [HACKED FUNNEL] has vs. what [CLIENT NAME] has."

Create gap analysis table:

| Element | [Hacked Funnel] Has | [Client] Has | Need to Create |
|---------|---------------------|--------------|----------------|
| Bold headline | Yes | ? | YES/NO |
| Problem section | Yes | ? | YES/NO |
| Origin story | Yes | ? | YES/NO |
| Testimonials | Yes | ? | YES/NO |
| Credibility markers | Yes | ? | YES/NO |
| Video content | Yes | ? | YES/NO |
| Multiple CTAs | Yes | ? | YES/NO |
| Urgency/scarcity | Yes | ? | YES/NO |
| FAQ section | Yes | ? | YES/NO |
| Pricing display | Yes | ? | YES/NO |

Then categorize:
- **MUST HAVE:** Critical gaps to fill
- **SHOULD HAVE:** Elements that strengthen the funnel
- **NICE TO HAVE:** Polish elements

---

## PHASE 5: Voice Selection & Headlines

**Phase 5 of 8 - Voice Selection**

Say: "Now let's choose the personality/energy for the funnel copy."

**Present the 3 Hats:**

1. **Russell Brunson** - Direct response, bold claims, curiosity hooks, urgency
2. **Marisa Murgatroyd** - Heart-centered, transformational, journey-focused
3. **Mooji** - Spiritual, poetic, gentle, permission-giving

Ask: "Which voice(s) resonate most with [CLIENT]'s brand? You can choose one, blend them, or use all three as counsel for reviewing."

**After selection, generate 5 headlines per voice using the formula:**

> "How to [get what they want] with [the support/vehicle] without [their biggest pain]"

Also provide a **Headline Ingredients Reference:**

| Element | Options |
|---------|---------|
| **ICA** | [who they are] |
| **What They Want** | [desired outcomes] |
| **The Support** | [offer/vehicle] |
| **Pain to Avoid** | [what they don't want] |

**Also ask about product naming:**
"What's the product called? Remember:
- The MOVEMENT is what they join (identity)
- The PRODUCT is what they buy (the thing)
- Does the name communicate what they're getting?"

---

## PHASE 6: Design Blueprint (D - DESIGN)

**Phase 6 of 8 - Design Blueprint**

Say: "Now I'll create the funnel structure, comparing each section to [HACKED FUNNEL]."

Create section-by-section comparison using the proven flow:

| # | Section | [Hacked Funnel] | [Client] Adapted |
|---|---------|-----------------|------------------|
| 1 | HERO | [their headline] | [adapted - bold claim about ICA] |
| 2 | STORY | [their journey] | [client's journey - tried everything, found answer] |
| 3 | THE SECRET | [their hook payoff] | [counter-intuitive truth that reframes the problem] |
| 4 | THE TRUTH IS... | [industry callout] | [3 bullets exposing why other solutions fail] |
| 5 | THE REALITY | [acknowledgment] | [it's hard, but celebrate their uniqueness] |
| 6 | THE JOURNEY | [their process] | [stages distilled to one-liners with emotional payoff] |
| 7 | WHAT'S INCLUDED | [deliverables] | [adapted deliverables] |
| 8 | TESTIMONIALS | [social proof] | [formatted: before/after/quote] |
| 9 | PRICING | [their display] | [options displayed clearly] |
| 10 | FAQ | [objections] | [common fears addressed] |
| 11 | FINAL CTA | [urgency close] | [tied to real event + energy] |

---

## PHASE 7: Copy Creation

**Phase 7 of 8 - Copy Creation**

Say: "Now let's write the actual copy, section by section. I'll draft, you refine, and we'll review through the 3 hats."

**For each section:**
1. Draft copy based on client's content and hacked funnel patterns
2. Present to user for feedback
3. Review through 3 hats:
   - **Russell**: Direct? Urgent? Clear action?
   - **Marisa**: Transformation honored? Journey felt?
   - **Mooji**: Permission given? Inner truth named?
4. Revise until all 3 hats approve

**Key sections to nail:**

**The Secret Payoff:**
After hook headline, must pay off with counter-intuitive truth:
"The secret isn't [what they think]. The secret is [reframe]."

**The Truth Is... (3 bullets):**
1. Validate their effort (skill isn't what's missing)
2. Expose the gap (courses don't build resilience)
3. Name the real block (body doesn't feel safe)

**The Journey (distilled):**
- One line per stage
- Start with action verb
- Include emotional payoff
- Example: "Take the risks that scare you — and discover that safety was inside you all along"

**The Generous Offer Frame:**
End philosophy section with:
"[Product] exists so you can [borrow/access something from creator] until you [reclaim your own power]."

---

## PHASE 8: Execution Plan (E - EXECUTE)

**Phase 8 of 8 - Execution Plan**

Say: "Here's the action plan to build this funnel."

Create phased checklist:

### Phase 1: Gather Assets from Client
- [ ] Origin story (their transformation journey)
- [ ] 3-5 testimonials (name, result, quote)
- [ ] Common objections for FAQ
- [ ] Brand assets (colors, fonts, photos)
- [ ] Any real events for urgency (launches, deadlines, releases)

### Phase 2: Write Copy
- [ ] Headline (test 2-3 versions)
- [ ] Story section
- [ ] Secret payoff
- [ ] "The Truth Is..." 3 bullets
- [ ] Reality/uniqueness section
- [ ] Journey distilled to one-liners
- [ ] What's Included
- [ ] Testimonials formatted
- [ ] FAQ answers
- [ ] All CTA buttons
- [ ] Urgency messaging tied to real event

### Phase 3: Design Assets
- [ ] Journey/process visual
- [ ] What's Included icons
- [ ] Testimonial cards
- [ ] Credibility bar logos
- [ ] Prep all images

### Phase 4: Build (SWIPES order)
- [ ] **S** - Set up sections/structure
- [ ] **W** - Add copy, set fonts
- [ ] **I** - Add images
- [ ] **P** - Set colors
- [ ] **E** - Add CTAs, videos, links
- [ ] **S** - Optimize spacing, mobile check

### Phase 5: Connect & Test
- [ ] Payment integration
- [ ] Thank you page
- [ ] Test purchase flow
- [ ] Mobile test
- [ ] SEO (title, meta)

---

## OUTPUT & COMPLETION

Say: "**Funnel Hack Complete!**"

Display summary:
- ICA One-Liner
- Core Belief Shift
- Product Name (Movement + Product distinction)
- Top 3 Headline Options
- Key Copy Lines (the fire lines)
- CTA
- Urgency Lever
- First Action Item

**If file output selected:**

Create project folder: `~/.claude/projects/[client-name]-funnel/`

Save files:
- `[CLIENT]-ABCDE.md` - The complete framework document
- `ROADMAP.md` - Execution checklist
- `00-README.md` - Project index with key copy lines
- `FINAL-SALES-PAGE-COPY.md` - All copy organized by section

**Final prompt:**
"Would you like me to:
1. Deep dive on any section?
2. Generate more headline options?
3. Create the email sequence outline?
4. Write additional copy sections?
5. Something else?"

---

## Effects Registry (MANDATORY for all HTML builds)

> **Skip this section** if no effects-registry vault note (`website-effects-registry`) is configured in your environment — build effects from the animation library reference instead.

### Before Adding Effects
1. Search vault for `website-effects-registry` via `mcp__obsidian-brain__search_notes` (flat file at `memory/reference_website_effects_registry.md` is cold backup only — do NOT read unless vault MCP is unavailable)
2. Load `website-effects-snippets` from vault for implementation code
3. Present available effects to user by code name when relevant to the project
4. Implement from snippets — do NOT reinvent existing effects

### After Building Custom Effects
If you created any new CSS animation, JS scroll handler, hover interaction, or visual effect NOT already in the registry:
- Prompt user: "New effect: [description]. Save to registry as [CODE-NAME]?"
- If yes: write to vault via `mcp__obsidian-brain__write_note` — update `patterns/website-effects-registry.md` (add row to Active Effects table) AND `patterns/website-effects-snippets.md` (append new snippet section). **If the `obsidian-brain` vault MCP isn't available, skip the save (no-op) and tell the user the effects registry needs a vault — do not error and do not write flat files.**
- Include: CSS, JS, HTML structure, dependencies, source project

## GLOBAL BEHAVIORS

### 3 Hats as Ongoing Counsel
Don't just use for headlines. Review ALL copy through Russell, Marisa, and Mooji. Show which hat influenced which elements.

### Iterative Copy Creation
Draft → User feedback → 3-hat review → Revise. Don't move on until the copy passes all 3 hats.

### Research First
Always search for the client online before making assumptions about their positioning or assets.

### Gap Analysis Tables
Make comparisons visual and scannable with tables.

### Headline Formula
Always use: "How to [result] with [vehicle] without [pain]"

### Product Naming Check
Always clarify: Movement (identity) vs Product (what they buy). Does the name communicate value?

### CTA Matches Price Point
- Under $500: Direct signup OK
- $500-$2000: "Book a Call" adds exclusivity
- $2000+: Application process

### Urgency Must Be Real
Tie to actual events. Fake scarcity damages trust.

### Distill, Don't Summarize
When condensing client content, keep the ESSENCE and emotional payoff. Cut the explanation.

### Progress Indicators
Show phase number and name at each step: "Phase X of 8 - [Name]"

### Save Everything
All output goes to `~/.claude/projects/[client-name]-funnel/`

### Key Copy Lines to Capture
Always save the "fire" lines separately — they become social content, email subject lines, and ad copy.
