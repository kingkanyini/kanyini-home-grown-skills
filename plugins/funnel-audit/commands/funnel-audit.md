---
description: OO-powered funnel page audit with 6-agent scanning, belief architecture review, and micro-arc analysis
---

# /funnel-audit — Funnel Page Audit Skill

## Overview
A structured funnel page audit tool that uses the client's **Offer Optimizer as the single source of truth** and the **Propaganda Machine's belief architecture** for all copy decisions. Six parallel scanning agents analyze hook quality, belief shifts, proof architecture, conversion mechanics, and emotional micro-arc. Expert Counsel reviews findings section by section.

---

## ETHICS CHECK (START — Run silently before ANY work)
- Framing: We're improving the client's page to serve THEIR audience
- Language: No prohibited terms (steal, copy, rip off, hack in exploitative sense)
- Intent: Client's authentic expression is centered
- Golden Rule: "Would the client feel honored by these edits?"

---

## PHASE 0: DASHBOARD

### Step 1: Load Registry
Read the registry from `~/.claude/projects/funnel-audit/registry.json`.

If registry doesn't exist, create it:
```json
{ "clients": {} }
```

### Step 2: Render Dashboard
For each client in the registry, display:
```
╔══════════════════════════════════════════════════════════╗
║  FUNNEL AUDIT — Command Center                          ║
╠══════════════════════════════════════════════════════════╣
║  [CLIENT] — [Page Name]                                  ║
║  [████████░░░░] X/Y edits locked    Last: YYYY-MM-DD     ║
║  Phase: [current phase]                                  ║
╠══════════════════════════════════════════════════════════╣
║  [CLIENT 2] — [Page Name]                                ║
║  [░░░░░░░░░░░░] Not started        Last: —              ║
╚══════════════════════════════════════════════════════════╝
```

Progress bar: 12 chars wide. `█` = locked edits proportion. `░` = remaining.

### Step 3: Menu
Use AskUserQuestion:
- Resume [client name] (for each in-progress audit)
- Start new audit
- View completed audits

### Resume Logic
If resuming: read the client's registry entry, find the first incomplete phase, resume there.
- If scan phase incomplete: check per-agent status, re-run only failed/pending agents
- If audit phase incomplete: load edit-progress.md, resume at first pending edit
- If execution/verification/translation incomplete: resume at that phase

---

## PHASE 1: INTAKE + SCAN

### Step 1: Client Intake
Use AskUserQuestion to gather (RPG-style interview):

**Required:**
- Client name (suggest code: first name lowercase)
- OO file path — Search common locations:
  - `~/.claude/plugins/local/offer-optimizer/client files/`
  - `~/<your-vault-path> Clients/[Client]/`
- Page URL (preview or live)

**Recommended:**
- Prop Machine path — Search: `~/.claude/projects/prop-machine/[client]/`
- Voice DNA path — Search: `~/.claude/references/voice-profiles/` or `~/.claude/history/`

**Optional:**
- Editor URL (for Phase 3 execution)
- Platform (CF2 / WordPress / Kajabi / Other — default CF2)
- Client-specific change requests
- Target language for translation (Phase 5)

### Step 2: Load Assets (Parallel)
Launch 3 parallel operations:
1. **Read OO** — Full document into memory
2. **Scrape page** — Use Playwright `browser_navigate` + `browser_snapshot` to capture full page content. Save the accessibility snapshot as the section map source.
3. **Read Prop Machine + Voice DNA** — If paths provided

### Step 3: Generate Section Map
From the page snapshot, create a numbered section map:
```
1. Hero — Headline + subheadline + CTA
2. Problem/Agitate — Pain point copy
3. Two Avatars — Old belief vs new belief comparison
4. Solution/Opportunity — Program description
5. What's Included — Features/benefits
6. Testimonials — Social proof
7. Bonuses — Additional value
8. Value Stack — Pricing
9. Guarantee — Risk reversal
10. Closing — Final CTA
11. Footer
```

Present section map to <your-name> for confirmation. Adjust if needed.

### Step 4: Parallel Scan (5 Agents)
Read the agent prompts from `reference/scan-agents.md`. For each agent:
1. Read the prompt template
2. Resolve all `{VARIABLES}` with real data (OO content, section map, page snapshot, etc.)
3. Launch as a Task agent

Launch all 5 in parallel:
- **Hook Scanner** — Headlines, subheads, bridge copy
- **Belief Scanner** — Old/new beliefs, 6 core belief mapping (lite mode if no Prop Machine)
- **Proof Scanner** — Testimonials, authority, data, proof block coverage
- **Conversion Scanner** — CTAs, pricing, value stack, urgency
- **Arc Scanner** — Micro-arc per section (camaraderie → curiosity → relief → urgency)

Update registry: set each agent status to `in_progress` BEFORE launching.

### Step 5: Validate Agent Outputs
As each agent completes:
1. Verify output file exists
2. Verify it contains expected section headers
3. Verify minimum content length (not empty/truncated)
4. Set status to `complete` or `failed`
5. Offer re-run for failed agents

Save each output to `~/.claude/projects/funnel-audit/[client-code]/[agent]-scan.md`.

### Step 6: Foreman Review
After all 5 agents complete:
1. Read the Foreman prompt from `reference/scan-agents.md`
2. Inject all 5 agent outputs into the Foreman's prompt
3. Launch Foreman as a Task agent
4. Save output to `foreman-review.md`

Present Foreman's Executive Summary to <your-name> before proceeding to Phase 2.

### Step 7: Update Registry
```json
"scan": {
  "status": "complete",
  "agents": { ... per-agent status ... }
}
```

---

## PHASE 2: SECTION-BY-SECTION AUDIT

### Mode Selection
When starting or resuming Phase 2, determine the mode:

**Full Audit Mode** (default for new audits): Follow the Foreman's recommended audit order from Phase 1 scan.

**Visual Rescan Mode** (for resumed audits where client has edited the live page):
When the client has trimmed, restructured, or edited the page since the last session:
1. Navigate to the live page via Playwright
2. Screenshot ONE section at a time — identify sections by color partition changes in the page design
3. Extract exact copy from each screenshot
4. Run Counsel + Foreman review in parallel (not full 6-agent scan — those already ran)
5. Compare against `edit-progress.md` to identify new/changed content vs. already-locked edits
6. Lock or flag each section, then scroll to next
7. Use AskUserQuestion after each section before proceeding

Visual Rescan is faster than re-running the 6-agent scan and more natural for iterative editing sessions.

### Copy Review Sub-Flow (for drafts not yet on page)
When <your-name> pastes copy for review that isn't on the live page yet (e.g., a bio rewrite, new section, replacement copy):
1. Scan for Voice DNA match (load voice profile)
2. Run counsel review — each member scores (X/10) + OO citations
3. Run Foreman AI-isms + Voice DNA checklist
4. Present report with score, flags, and suggestions
5. <your-name> approves, modifies, or iterates
6. Save locked copy to `[client]-full-copy-final.md`

This sub-flow can be invoked at any point during Phase 2 without disrupting the section-by-section flow.

### Counsel Activation
Default: **Expert Counsel (#2)** — Russell Brunson (funnels/copy), Myron Golden (offers/pricing), Marisa Murgatroyd (experience design).

All counsel recommendations MUST cite OO sections. Load `reference/audit-rules.md` for the 10 behavioral rules.

### Audit Order
Follow the Foreman's recommended audit order (highest impact first). If no recommendation, go top-to-bottom on the page.

### For Each Section:

**Step A — Present Current State**
Show:
1. Current copy (verbatim)
2. Agent findings for this section:
   - Hook score (if headline/subhead present)
   - Belief mapping (which belief this section addresses)
   - Proof inventory (what proof is here)
   - Conversion check (any CTAs or pricing here)
   - Arc scores (all 4 beats)
3. Foreman priority for this section (RED/YELLOW/GREEN)

**Step B — Counsel Reviews**
Each counsel member provides feedback with OO citations:
- **Russell:** Funnel flow, hook quality, story structure
- **Myron:** Value positioning, pricing psychology, transformation language
- **Marisa:** Experience design, emotional journey, engagement

**Step C — Propose Edits**
Based on counsel feedback, propose specific replacement copy. Each proposed edit includes:
- The exact new copy
- OO sections it's grounded in
- Which micro-arc beat it strengthens
- Which belief it supports (if applicable)

**Step C.5 — High-Ticket Conversion Model (Value Stack / Pricing sections)**
If the section is the pricing/value stack AND the offer is $3,000+, proactively offer:
- **Application-based model** — Remove visible pricing, keep tier names + deliverables, replace purchase CTAs with application form. Application asks qualifying questions (revenue range, motivation). Revenue-based routing determines which tier the applicant sees.
- This is standard for high-ticket transformation offers. The conviction should happen on the page; the pricing conversation happens on a call after qualification.

**Step C.6 — Testimonial Asset Check (Testimonial sections)**
Before recommending testimonial replacements, check for existing assets:
1. Search `~/.claude/projects/testimonial-titrator/[client-code]/` for belief-breaking testimonials
2. Search `~/.claude/projects/prop-machine/[client-code]/` for testimonial files
3. If found: use these as replacement candidates (they're already mapped to beliefs)
4. If not found: recommend sourcing from PM case studies or flagging as "client to provide"

**Step D — Headline Workshop (Hero Only)**
If the section is the Hero, activate the Headline Workshop:
1. Read `reference/headline-workshop.md`
2. Extract OO headline ingredients
3. Generate 5-7 **full Hero stack** options using the 6 formulas (not just H1 — include H2, bridge, CTA)
4. Counsel scores each option
5. Present top 3 to <your-name>
6. If <your-name> proposes their own direction, counsel EXPLORES it before scoring alternatives

**Step E — <your-name> Decides**
Use AskUserQuestion:
- Approve (LOCK the edit)
- Modify (<your-name> adjusts, counsel does a quick review)
- Skip (mark as PENDING, move on)
- Deep dive (more counsel discussion on this section)

**Step F — Save Progress**
After each section decision, save to `edit-progress.md`:
```
| # | Section | Edit | Status | OO Citations |
|---|---------|------|--------|-------------|
| 1 | Hero | Headline rewrite | LOCKED | Sec 2, 7, 10 |
| 2 | CTAs | Language change | LOCKED | Sec 5 |
| 3 | Outcomes | Rewrite needed | PENDING | — |
```

Update registry: `"audit": { "status": "in_progress", "edits_locked": X, "edits_total": Y }`

---

## PHASE 2.5: FULL COPY CAPTURE

### Purpose
After all edits are locked, compile the **complete final English copy** as a single source-of-truth document. This is required before Phase 3 (Execution) or Phase 5 (Translation) can proceed.

### Process
1. Navigate to the live page via Playwright (or use the most recent screenshots)
2. For each section on the page:
   - If the section has a LOCKED edit in `edit-progress.md` → use the locked replacement copy
   - If the section has no edit → extract current live copy verbatim
3. Compile everything into `~/.claude/projects/funnel-audit/[client-code]/[client]-full-copy-final.md`
4. Structure the file with clear section headers matching the page flow
5. Include formatting notes (bold, italic, underline, ALL CAPS) where relevant for reproduction

### File Format
```markdown
# [Client] — Full Copy (Final English)
Last updated: YYYY-MM-DD
Source: [page URL]

---

## Section 1: HERO
[Complete hero copy including H1, H2, bridge, identity hook, CTA, urgency]

## Section 2: [Next Section]
[Complete copy]

... etc for every section on the page
```

### When to Run
- After the last edit is LOCKED in Phase 2
- Before starting Phase 3 (team execution) or Phase 5 (translation)
- <your-name> can trigger manually by asking to "capture the full copy"

### Why This Matters
- `edit-progress.md` tracks WHAT changed (diffs) — this file captures the FINAL STATE (complete text)
- Translation (Phase 5) needs the full text, not diffs
- Team handoff (Phase 4 HTML) needs the full text
- Single source of truth prevents drift between locked edits and live page

---

## PHASE 3: EDIT EXECUTION

### Platform Check
Read platform from registry. Present approach options via AskUserQuestion:

**CF2 (ClickFunnels 2.0):**
- **"You click, I guide"** (Recommended) — <your-name> makes edits in CF2 editor. Claude provides exact copy per edit.
- **Playwright automation** — Claude drives the browser. Note: CF2 editor uses nested iframes, text edits are unreliable via automation.
- **Mix** — Automate simple swaps, guide structural changes.

**CF2 Notes:**
- Login URL: `https://accounts.myclickfunnels.com/users/sign_in`
- Chrome must be FULLY CLOSED before Playwright can use it
- CF2 has beforeunload dialogs — handle with `browser_handle_dialog`
- "You click, I guide" is usually faster for CF2 text changes

**Other Platforms:**
- Provide edit copy. <your-name> applies manually.

### Execution Flow
For each LOCKED edit:
1. Display the edit number, section, and exact new copy
2. If "you click, I guide": wait for <your-name> to confirm each one is applied
3. If Playwright: attempt the edit, verify with snapshot
4. Mark as APPLIED in progress file

### Save Progress
Update `edit-progress.md` with APPLIED status.

---

## PHASE 4: VERIFICATION + EXPORT

### Verification
1. Open page via Playwright (`browser_navigate` to preview URL)
2. Take full page snapshot (`browser_snapshot`)
3. Scroll through every section — verify changes are visible
4. Check CTA buttons (do they link correctly?)
5. Note any visual issues

### Ethics Check (END)
- Scan all output for prohibited language
- Verify client's unique voice is centered
- Verify recommendations are framed as adaptation
- Ask: "Does this output reflect a Life Gamer or a button masher?"

### Internal Save
Save final `edit-progress.md` with all statuses to `~/.claude/projects/funnel-audit/[client-code]/`.

### Client Report (Google Doc)
Use AskUserQuestion: "Create a Google Doc report for the client?"

If yes, route through `/google-doc-builder` protocol:
1. Read `~/.claude/contacts/accounts.json` for account selection
2. Read `~/.claude/contacts/contacts.json` for recipient
3. Build report with:
   - Section-by-section before/after
   - OO citations for each change
   - Micro-arc improvements
   - Proof coverage changes
   - Conversion optimizations

### Team Edit Plan (Interactive HTML)
If edits will be implemented by a team member (not <your-name> directly), offer to generate an interactive HTML edit plan:
- Tabs organized by priority: Completed | RED Fix Now | YELLOW Strengthen | GREEN Don't Touch | Client Actions
- Checkboxes on RED and YELLOW items — when checked, item moves to Completed tab
- localStorage persistence (progress saves between browser sessions)
- Dynamic progress bar and stat counters
- Before/after copy blocks for every edit
- Offer to email the plan + export the funnel-audit skill via `/quickshare` so the team member can run future audits in Claude

### Skill Handoff
After export, offer related skills via AskUserQuestion:
- `/belief-shift-e-engine` — Build email sequences based on the belief architecture
- `/vsl-activator` — Create a VSL for the funnel
- `/propaganda-machine` — Build the Prop Machine if one doesn't exist yet
- No handoff — done for now

### Update Registry
Set all phases to `complete`. Update `last_updated`.

---

## PHASE 5: TRANSLATION (Optional)

### Activation
Only available after all edits are LOCKED in the original language. AskUserQuestion:
- "Run full translation via `/funnel-translate`" (Recommended — full voice-aware translation with counsel review, HTML preview, and Vercel deployment)
- "Quick translate here" (lightweight translation within funnel-audit — Phase 5 below)

If `/funnel-translate` is selected, hand off to that skill. The shared registry ensures all client data carries over.

### Quick Translate (if staying in funnel-audit)

### Step 1: Target Language
AskUserQuestion for target language.

### Step 2: Section-by-Section Translation
For each section with locked edits:
1. Present original locked copy
2. Translate to target language
3. Counsel reviews for:
   - Voice match in target language
   - Cultural adaptation (idioms, references)
   - Micro-arc preservation (do all 4 beats survive translation?)
4. <your-name> approves or modifies

### Step 3: Delivery Format
Use AskUserQuestion to offer two formats:

**A) Interactive HTML (Recommended for team handoff)**
Side-by-side English | German chart:
- Left column: original English (from `[client]-full-copy-final.md`)
- Right column: translated copy
- Section headers matching the page flow
- Color-coded section partitions matching the original page design
- Copy-paste-ready text blocks (click to select)
- Print-friendly layout
- Save to `~/.claude/projects/funnel-audit/[client-code]/[client]-translation-[lang].html`

**B) Markdown (for archive/reference)**
- Save to `~/.claude/projects/funnel-audit/[client-code]/[client]-full-copy-[lang].md`
- Same section structure as the English full-copy file

Update registry: `"translation": { "status": "complete", "target_lang": "[lang]", "format": "html|md" }`

### Step 4: Voice Fidelity Check
For clients who are native speakers of the target language (e.g., Jonas is German-native):
- The translation should sound like the client WRITING in their native language, not a translated English page
- Cross-reference Voice DNA — the native-language version should feel MORE natural than the English
- Counsel reviews for voice match in the target language

### Step 5: Optional Re-Scan
Offer to re-run the Arc Scanner on the translated version to verify micro-arc integrity.

---

## REGISTRY MANAGEMENT

### Registry Location
`~/.claude/projects/funnel-audit/registry.json`

### Registry Structure
```json
{
  "clients": {
    "[client-code]": {
      "name": "Client Full Name",
      "oo_path": "path/to/OO.md",
      "prop_machine_path": "path/to/prop-machine.md or null",
      "voice_dna_path": "path/to/voice-dna.md or null",
      "pages": {
        "[page-code]": {
          "name": "Page Name",
          "url": "preview or live URL",
          "editor_url": "editor URL or null",
          "platform": "cf2",
          "phases": {
            "intake": { "status": "pending" },
            "scan": {
              "status": "pending",
              "agents": {
                "hook": { "status": "pending", "output": null },
                "belief": { "status": "pending", "output": null },
                "proof": { "status": "pending", "output": null },
                "conversion": { "status": "pending", "output": null },
                "arc": { "status": "pending", "output": null },
                "foreman": { "status": "pending", "output": null }
              }
            },
            "audit": { "status": "pending", "edits_locked": 0, "edits_total": 0 },
            "execution": { "status": "pending" },
            "verification": { "status": "pending" },
            "translation": { "status": "pending", "target_lang": null },
            "export": { "status": "pending" }
          },
          "last_updated": null
        }
      }
    }
  }
}
```

### Read-Write Protocol
1. ALWAYS read registry before writing
2. Merge changes — never overwrite the entire file
3. Update `last_updated` on every write
4. Status values: `pending` → `in_progress` → `complete` | `failed` | `skipped`
5. Mark `in_progress` BEFORE launching work, `complete` AFTER validation

---

## BEHAVIORAL RULES (Quick Reference)

These rules are loaded from `reference/audit-rules.md`. Summary:

1. **OO is the Bible** — Every recommendation cites OO sections
2. **Counsel advises, <your-name> decides** — Final call is always <your-name>'s
3. **Client requests are non-negotiable** — Counsel implements, doesn't override
4. **Paradox headlines win** — For high-ticket ($3,000+)
5. **"How To" with OO data** — Russell's formula populated with OO content
6. **Mechanism vs Outcome** — Headlines = outcomes, body = mechanisms
7. **Premium positioning** — Language matches price point
8. **Voice DNA cross-reference** — Edits sound like the CLIENT
9. **Section-level approval** — One at a time, never batched
10. **Micro-arc per section** — Every section spirals through camaraderie → curiosity → relief → urgency

---

## ERROR HANDLING

- **Playwright fails to load page:** Ask <your-name> to paste the page content manually, or provide a different URL
- **OO file not found:** Search common OO locations. If not found, cannot proceed — OO is required
- **Prop Machine not available:** Run Belief Scanner in "lite mode." Flag: "Full belief audit requires Propaganda Machine."
- **Agent fails:** Mark as `failed` in registry. Offer to re-run individually without re-running successful agents.
- **CF2 editor unresponsive:** Switch to "you click, I guide" mode

---

## NOTES

- This skill audits ONE PAGE at a time, but loads the full funnel context so counsel understands where the page sits in the flow.
- The client's Offer Optimizer is the single source of truth for all copy decisions.
- The Propaganda Machine's 6 beliefs and shift frameworks provide the persuasive architecture.
- The micro-arc (camaraderie → curiosity → relief → urgency) is checked per section, not just page-level.
- Progress is saved after every section decision so work can resume across sessions.
- Translation (Phase 5) is optional and only activates after all edits are locked in the original language.
