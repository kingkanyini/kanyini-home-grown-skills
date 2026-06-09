---
description: Voice-aware funnel translation with counsel review, formatting preservation, and Vercel deployment for team handoff
---

# /funnel-translate — Funnel Page Translation Skill

## Overview
A structured funnel translation tool that translates any funnel page into a target language using the client's **voice profile** as the translation guide — not generic translation, but copy that sounds like the client WRITING in their native language. Expert Counsel (#2) reviews every section. Foreman scans both languages for AI-isms. Output: side-by-side HTML preview with client brand colors + master content markdown. Auto-deployed to Vercel for team handoff.

**Relationship to /funnel-audit:** Shares the same registry. If a funnel-audit has been completed for the client, the skill auto-detects and pre-fills voice profile, OO path, section map, and full copy. Phase 5 of /funnel-audit offers a handoff to this skill.

**Funnel lifecycle:** `/funnel-hack-lvl-1` (build) → `/funnel-audit` (review) → `/funnel-translate` (localize)

---

## ETHICS CHECK (START — Run silently before ANY work)
- Framing: We're translating the client's page to serve THEIR audience in another language
- Language: No prohibited terms (steal, copy, rip off, hack in exploitative sense)
- Intent: Client's authentic expression is centered — translation preserves their voice, not replaces it
- Golden Rule: "Would the client feel honored by this translation?"

---

## ETHICS CHECK (END — Run silently after ALL work)
- Scan all translated output for prohibited language (CLAUDE.md Language Rules table)
- Verify all recommendations are framed as adaptation, not copying
- Verify client's unique voice is centered in the translation
- Ask: "Does this output reflect a Life Gamer or a button masher?"
- If ANY output fails, revise before delivering

---

## PHASE 0: DASHBOARD

### Step 1: Load Registry
Read the shared registry from `~/.claude/projects/funnel-audit/registry.json`.

If registry doesn't exist, create it:
```json
{ "clients": {} }
```

### Step 2: Scan for Translation Data
For each client, check if any pages have a `translations` object.

### Step 3: Render Dashboard
```
╔══════════════════════════════════════════════════════════════╗
║  FUNNEL TRANSLATE — Command Center                          ║
╠══════════════════════════════════════════════════════════════╣
║  [CLIENT] — [Page Name] → [Language]                        ║
║  [████████░░░░] X/Y sections locked    Last: YYYY-MM-DD     ║
║  Status: [current status]                                   ║
╠══════════════════════════════════════════════════════════════╣
║  [CLIENT 2] — No translations yet                           ║
╚══════════════════════════════════════════════════════════════╝
```

Progress bar: 12 chars wide. `█` = locked sections. `░` = remaining.

### Step 4: Menu
Use AskUserQuestion:
- Resume [client — language] (for each in-progress translation)
- Start new translation
- View completed translations

### Resume Logic
If resuming: read the client's translation entry, find the first non-locked section, resume at Phase 2 for that section.

---

## PHASE 1: INTAKE

### Step 1: Client Detection
Check the funnel-audit registry for existing clients.

**If client exists:**
- Pre-fill: name, code, voice_dna_path, oo_path
- Show what's available: "Found Jonas in the registry. Voice profile, OO, and section map ready."
- Use AskUserQuestion to confirm or override

**If new client:**
- Full intake (Step 2)

### Step 2: Intake Interview (RPG-style, AskUserQuestion)

Gather via 2-3 AskUserQuestion rounds:

Present all interview rounds in **RPG format** per CLAUDE.md — frame as quest briefings, use dialogue trees, counsel speak as NPCs. ALWAYS use AskUserQuestion with selectable options.

**Round 1:**
- Client name + code (suggest lowercase first name)
- Target language (German, Spanish, Portuguese, French, etc.)
- Source page URL

**Round 2:**
- Voice profile path — **REQUIRED**
  - Search `~/.claude/references/voice-profiles/` first
  - If found: confirm
  - If NOT found: offer two options via AskUserQuestion:
    1. "Run /charisma-codes first to build a full voice profile" (Recommended)
    2. "Create a lightweight voice profile now" → Ask 5 questions inline:
       - Tone (3 words)
       - Sentence length preference (short/medium/long)
       - Borrowed English words (list any they keep in their native language)
       - Avoided phrases / things they'd never say
       - Signature expressions / catchphrases

**Round 3:**
- Input mode (auto-detect and suggest):
  - If funnel-audit has `full-copy-final.md` for this page: suggest File mode
  - Otherwise: suggest Screenshot mode
  - Always allow override
- Team member for handoff (optional — if provided, enables Vercel auto-deploy)
- Platform (CF2 / WordPress / other — for formatting notes only)

### Step 3: Load Assets (Parallel)
Launch parallel reads:
1. **Voice profile** — full document
2. **OO** — if path exists in registry
3. **Section map** — if funnel-audit scan completed for this page
4. **Full copy file** — if funnel-audit produced one (`[client]-full-copy-final.md`)
5. **VSL transcripts** — search `~/.claude/projects/*/Transcripts/` for client transcripts

### Step 4: Extract Borrowed Words
From the voice profile and any transcripts found:
1. Scan for English words used naturally in the client's native-language speech
2. Build a borrowed words list
3. Present to <your-name> via AskUserQuestion for approval:
   - Show the list with examples of usage
   - Allow additions/removals
   - Save approved list to the voice profile (append under a `## Borrowed Words ([Language])` section)
   - Also store in registry under the translation entry

### Step 5: Brand Colors
Extract client brand colors for the HTML preview:
- **Option A:** If a screenshot or Playwright snapshot is available, identify 3-4 primary colors (background, accent, text, secondary)
- **Option B:** Ask <your-name> via AskUserQuestion: "What are the brand colors? (hex codes or descriptions)"
- Store as CSS variables for the HTML template

### Step 6: Initialize Registry
Add translation entry to the shared registry (nested under the page):

```json
"translations": {
  "[lang-code]": {
    "status": "in-progress",
    "target_lang": "[Language Name]",
    "voice_profile": "[path]",
    "borrowed_words": ["word1", "word2"],
    "brand_colors": {
      "bg": "#0a0a0a",
      "accent": "#C8A415",
      "text": "#e5e5e5",
      "secondary": "#22c55e"
    },
    "deploy_url": null,
    "team_member": "[name or null]",
    "input_mode": "screenshot|file",
    "sections": {},
    "html_file": "[client]-translation-[lang].html",
    "md_file": "[client]-[lang]-master-content.md",
    "last_updated": "[date]"
  }
}
```

### Step 7: Initialize Deliverable Files
Create both output files with headers:

**HTML Preview** — Use the template structure from the gold standard (SOMA translation).
- Apply client brand colors to CSS variables
- Set title, subtitle, nav placeholder
- Save to `~/.claude/projects/funnel-audit/[client-code]/[client]-translation-[lang].html`

**Master Content Markdown:**
```markdown
# [Client] [Page Name] — Master Content (EN + [Language])

**Page:** [source URL] (EN) | [target URL] ([lang])
**Voice:** [Client Name] ([voice profile descriptor])
**Last updated:** [date]
**Status:** Translation in progress

---

## Formatting Key

- `[U]text[/U]` = underlined
- `[B]text[/B]` = bold
- `[I]text[/I]` = italic
- `[B+I]text[/B+I]` = bold + italic
- `[BUTTON]text[/BUTTON]` = CTA button
- `[GOLD]text[/GOLD]` = gold/accent color
- `(all caps)` = uppercase styling

---
```

Save to `~/.claude/projects/funnel-audit/[client-code]/[client]-[lang]-master-content.md`

---

## PHASE 2: TRANSLATE + REVIEW (Per Section Loop)

This phase runs once per section. Repeat until all sections are complete.

### Step 1: Source Capture

**File Mode:**
- Load the next untranslated section from `full-copy-final.md`
- Extract all text elements with their formatting context
- Auto-detect section name from headers/content
- Confirm section name with <your-name> via AskUserQuestion

**Screenshot Mode:**
- Prompt <your-name>: "Send the next screenshot."
- When screenshot arrives:
  1. Extract ALL text from the image — miss nothing
  2. Map formatting for every element:
     - **Bold** → `[B]`
     - *Italic* → `[I]`
     - Underline → `[U]`
     - Bold+Italic → `[B+I]`
     - ALL CAPS → note as `(all caps)`
     - Gold/accent color → `[GOLD]`
     - Button text → `[BUTTON]`
  3. Present extraction table to <your-name>:
     ```
     | # | Text | Formatting |
     |---|------|-----------|
     | 1 | HIGH PERFORMERS HITTING A CEILING? | all caps, gold |
     | 2 | THE KEY TO BREAKING THROUGH | [U] BREAKING THROUGH |
     ```
  4. Auto-detect section name, confirm with <your-name>

### Step 2: Translate

For each text element in the section:

1. **Load voice profile rules** — tone, sentence length, energy, avoided phrases
2. **Check borrowed words list** — preserve approved English words untranslated
3. **Translate** — sound like the client WRITING in their native language, not a translated English page
4. **Preserve formatting tags** — every [B], [U], [I] maps to the corresponding translated word
5. **Call out formatted words** — for each formatted element, note the EN→DE mapping:
   ```
   [U] BREAKING THROUGH → [U] DURCHBRUCH
   [B+I] BURNING OUT → [B+I] AUSZUBRENNEN
   ```

**Testimonial Rule:**
When translating testimonials, show BOTH the original and the translation:
```
| EN (original) | DE (translation) |
|---|---|
| "Jonas has an amazing ability..." | „Jonas hat eine besondere Fähigkeit..." |
```
Testimonials are translated as natural speech in the target language — NOT in the client's voice profile, but as a natural-sounding person giving feedback.

**Cultural Adaptation:**
- Quotation marks: use target language conventions (DE: „ " | ES: « » | FR: « »)
- Currency placement: follow target convention (DE: 500 EUR after | US: $500 before)
- Number formatting: follow target convention (DE: 1.500 with dots | US: 1,500 with commas)
- Date formatting: follow target convention (DE: 9. Mai | US: May 9th)
- Title Case: drop in languages that don't use it (German only capitalizes nouns)

### Step 3: Counsel Review

**Expert Counsel #2** (Russell Brunson, Myron Golden, Marisa Murgatroyd) reviews:

**Russell (Structure/Copy):**
- Does the translated copy maintain the same persuasive structure?
- Do CTAs hit as hard in the target language?
- Any phrases that lose impact in translation?

**Myron (Value/Proof):**
- Do proof elements translate (numbers, results, testimonials)?
- Does the value proposition carry the same weight?

**Marisa (Experience Design):**
- Does the emotional arc survive translation?
- Does the reading experience flow naturally in the target language?

**Foreman (AI-ism + Voice Check) — BOTH languages:**
- Scan EN for AI-isms (banned phrases from CLAUDE.md)
- Scan target language for AI-isms adapted to that language
- Run voice profile verification checklist
- Check borrowed words are preserved correctly

**Present counsel findings as a table:**
```
## Counsel Review — [Section Name]

| Reviewer | Score | Notes |
|----------|-------|-------|
| Russell | 8.5/10 | CTA strong. "Durchbruch" lands well. |
| Myron | 9/10 | Numbers translate cleanly. |
| Marisa | 8/10 | Emotional arc preserved. |
| Foreman | 0 flags | Clean. Voice match confirmed. |
```

**If counsel suggests EN edits:** Update BOTH the English AND the target language copy. Present changes to <your-name> for approval.

### Step 4: Approve + Lock

Present the final side-by-side to <your-name>. Use AskUserQuestion:
- Lock this section (move to next)
- Revise (specify what to change)
- Re-run counsel

### Step 5: Update Deliverables

After each section is locked:

1. **Update HTML preview:**
   - Add section to the HTML file (side-by-side row structure)
   - Add nav link for the section
   - Set status badge: green for locked
   - Formatted words callouts in blue tags

2. **Update master content markdown:**
   - Add section with EN | DE table
   - Include formatting tags inline
   - Note any cultural adaptations

3. **Update registry:**
   - Set section status to "locked"
   - Update `last_updated`

4. **Auto-deploy to Vercel:**
   - Copy HTML to deploy directory
   - Run `vercel deploy --yes --prod`
   - Store deploy URL in registry

### Step 6: Loop
Return to Step 1 for the next section. Continue until all sections are translated + reviewed + locked.

---

## PHASE 3: ADDITIONAL PAGES

After the main landing page is complete, use AskUserQuestion to offer:
- Destination pages (qualified, not-ready, downsell)
- Upsell/order bump pages
- Survey/application forms
- Calendly flow text (event name, description, confirmation, on-page messages)
- WhatsApp/messaging templates
- Email sequences
- No more pages — proceed to completion

Each additional page follows the same Phase 2 loop:
1. Capture (screenshot or file)
2. Translate with voice profile
3. Counsel review
4. Lock
5. Update deliverables + deploy

All additional pages are **appended** to the same HTML preview and master content files. The nav grows as pages are added.

**If "No more pages — done":** Proceed directly to Phase 4: Completion.

---

## PHASE 4: COMPLETION

### Step 1: Summary Report
Generate and display:

```
╔══════════════════════════════════════════════════════════════╗
║  FUNNEL TRANSLATE — Summary Report                          ║
╠══════════════════════════════════════════════════════════════╣
║  Client:    [name]                                          ║
║  Language:  [target language]                                ║
║  Date:      [date]                                          ║
╠══════════════════════════════════════════════════════════════╣
║  SECTIONS                                                   ║
║  Translated:  XX                                            ║
║  Reviewed:    XX (counsel)                                   ║
║  Locked:      XX                                            ║
║  Pages:       [list of page types translated]                ║
╠══════════════════════════════════════════════════════════════╣
║  DEPLOY                                                     ║
║  URL: [vercel URL]                                          ║
║  Team: [team member name or "—"]                             ║
╠══════════════════════════════════════════════════════════════╣
║  VOICE TRANSLATION CARD                                     ║
║                                                             ║
║  Borrowed Words (kept in English):                           ║
║  [word1], [word2], [word3], ...                              ║
║                                                             ║
║  Cultural Adaptations:                                       ║
║  - Quotation marks: „ " (German low-high)                    ║
║  - Currency: 500 EUR (after number)                          ║
║  - Numbers: 1.500 (dot separator)                            ║
║  - Title Case: dropped (German convention)                   ║
║                                                             ║
║  Voice Match Notes:                                          ║
║  [key observations about voice fidelity]                     ║
║                                                             ║
║  Foreman: X flags caught across Y sections, all resolved     ║
╚══════════════════════════════════════════════════════════════╝
```

### Step 2: Save Voice Card
Append translation notes to the client's voice profile:

```markdown
## Translation Card — [Language] ([Date])

### Borrowed Words
[list of approved English words preserved in translation]

### Cultural Adaptations
[list of key adaptations made]

### Voice Match Notes
[observations about how the client's voice translates]
```

### Step 3: Update Registry
Set all section statuses to "locked". Set translation status to "complete".

### Step 4: Skill Handoff
Use AskUserQuestion to offer:
- `/belief-shift-e-engine` — Build translated email sequences
- `/funnel-audit` — Audit the translated page
- Done for now

---

## RE-TRANSLATE FLOW

When resuming a completed translation and a section needs updating:

### Step 1: Identify Changes
- Compare current EN copy to the version that was last translated
- Show the diff: "English copy changed in these sections: [list]"

### Step 2: Unlock + Re-Translate
- Mark the changed section as "pending" in registry
- Re-translate just that section
- Re-run counsel review
- Re-lock

### Step 3: Update + Deploy
- Update both deliverable files
- Auto-deploy to Vercel

---

## HTML PREVIEW TEMPLATE

The HTML preview uses this structure. Brand colors are injected via CSS variables.

### CSS Variables (set per client)
```css
:root {
  --bg: [client bg color];
  --surface: [slightly lighter than bg];
  --surface-2: [slightly lighter than surface];
  --border: [border color];
  --text: [primary text color];
  --text-muted: [muted text color];
  --accent: [client accent/brand color];
  --accent-dim: [accent at 20% opacity];
  --green: #22c55e;
  --green-dim: #22c55e22;
  --red: #ef4444;
  --blue: #3b82f6;
  --blue-dim: #3b82f622;
}
```

### Status Badge Classes
```css
.status-pending { color: var(--text-muted); background: #88888822; }
.status-translated { color: var(--accent); background: var(--accent-dim); }
.status-reviewed { color: var(--blue); background: var(--blue-dim); }
.status-locked { color: var(--green); background: var(--green-dim); }
```

### Section Structure
Each section in the HTML follows this pattern:
```html
<div class="section" id="s[N]">
  <div class="section-title">
    [Section Name]
    <span class="section-tag">[description]</span>
    <span class="status-[status]">[STATUS]</span>
  </div>
  <div class="row header">
    <div class="cell">English</div>
    <div class="cell">[Target Language]</div>
  </div>
  <div class="row">
    <div class="cell en">
      <div class="field-label">[element type]</div>
      [English text with formatting]
      <span class="format-note">[formatting callout]</span>
    </div>
    <div class="cell de">
      <div class="field-label">[element type in target lang]</div>
      [Translated text with formatting]
      <span class="format-note">[formatting callout in target lang]</span>
    </div>
  </div>
</div>
```

### Testimonial Structure (Original + Translation)
```html
<div class="row">
  <div class="cell en">
    <div class="field-label">Original Quote</div>
    "[original testimonial text]"
    <div class="field-label" style="margin-top:0.5rem;">— [Name]</div>
  </div>
  <div class="cell de">
    <div class="field-label">Translation</div>
    „[translated testimonial text]"
    <div class="field-label" style="margin-top:0.5rem;">— [Name]</div>
  </div>
</div>
```

---

## FORMATTING SYSTEM

### Extraction Tags
When extracting copy from screenshots or files, map visual formatting to these tags:

| Visual | Tag | Example |
|--------|-----|---------|
| **Bold text** | `[B]text[/B]` | `[B]The Machine Is Tired.[/B]` |
| *Italic text* | `[I]text[/I]` | `[I]uncomfortably accurate[/I]` |
| Underlined text | `[U]text[/U]` | `[U]BREAKING THROUGH[/U]` |
| ***Bold + Italic*** | `[B+I]text[/B+I]` | `[B+I]BURNING OUT[/B+I]` |
| **Underline + Bold** | `[B+U]text[/B+U]` | `[B+U]on command[/B+U]` |
| ALL CAPS | `(all caps)` | Note in formatting column |
| Gold/accent color | `[GOLD]text[/GOLD]` | `[GOLD]HIGH PERFORMERS[/GOLD]` |
| Button text | `[BUTTON]text[/BUTTON]` | `[BUTTON]APPLY NOW[/BUTTON]` |

### Formatting Callout Display
In the HTML preview, formatted words are called out with blue tags:
```html
<span class="format-note">U: BREAKING THROUGH → DURCHBRUCH</span>
```

### Formatting Mapping Rule
Every formatted word in EN must have a corresponding formatted word in the target language:
- `[U]BREAKING THROUGH[/U]` → `[U]DURCHBRUCH[/U]`
- The translated word gets the SAME formatting tag
- Call out EVERY mapping in the format-note

---

## VERCEL DEPLOYMENT

### Deploy Structure
```
~/.claude/projects/funnel-audit/[client-code]/deploy/
├── index.html     (copy of translation HTML)
└── survey.html    (copy of survey translation HTML, if exists)
```

### Deploy Command
After each section lock:
```bash
cp [html-file] [deploy-dir]/index.html
cd [deploy-dir]
vercel deploy --yes --prod
```

Store the deploy URL in the registry.

### Naming Convention
Deploy project name: `[client]-funnel-translations`
Example: `soma-funnel-translations.vercel.app`

---

## REGISTRY INTEGRATION

### Location
Shared with /funnel-audit: `~/.claude/projects/funnel-audit/registry.json`

### Translation Schema (nested under each page)
```json
"translations": {
  "[lang-code]": {
    "status": "pending|in-progress|complete",
    "target_lang": "German",
    "voice_profile": "path/to/voice-profile.md",
    "borrowed_words": ["Business", "Hustle", "Coaching"],
    "brand_colors": {
      "bg": "#0a0a0a",
      "accent": "#C8A415",
      "text": "#e5e5e5",
      "secondary": "#22c55e"
    },
    "deploy_url": "client-funnel-translations.vercel.app",
    "team_member": "Julius",
    "input_mode": "screenshot",
    "sections": {
      "hero": { "status": "locked", "counsel_scores": { "russell": 9, "myron": 8.5, "marisa": 9, "foreman": 0 } },
      "qualification": { "status": "locked" },
      "cta-card": { "status": "reviewed" },
      "machine-mind": { "status": "translated" },
      "embodied-leader": { "status": "pending" }
    },
    "html_file": "[client]-translation-[lang].html",
    "md_file": "[client]-[lang]-master-content.md",
    "last_updated": "2026-03-25"
  }
}
```

### Status Values
`pending` → `translated` → `reviewed` → `locked`

### Read-Write Protocol
1. ALWAYS read registry before writing
2. Merge changes — never overwrite the entire file
3. Update `last_updated` on every write
4. Mark section `translated` after translation, `reviewed` after counsel, `locked` after <your-name> approval

---

## BEHAVIORAL RULES

1. **Voice profile is the Bible** — Every translation decision references the voice profile
2. **Counsel advises, <your-name> decides** — Final call on every section is <your-name>'s
3. **Borrowed words are sacred** — Once approved, never translate them
4. **Format everything** — No formatted word goes unmapped
5. **Both languages get Foreman** — AI-isms checked in EN AND target language
6. **Testimonials show both** — Original + translation, always
7. **Deploy on every lock** — Julius always has the latest
8. **Cultural adaptation over literal translation** — The goal is IMPACT, not accuracy
9. **If counsel catches EN issues, fix BOTH** — Don't just translate a broken sentence
10. **Section-level approval** — One at a time, never batched

---

## ERROR HANDLING

- **No voice profile:** Block translation. Offer /charisma-codes or lightweight inline profile creation. Translation quality depends entirely on voice fidelity.
- **Screenshot unreadable:** Ask for a clearer screenshot or manual text input
- **Vercel deploy fails:** Save files locally, note deploy failure in registry, offer manual deploy later
- **Counsel disagrees on translation:** Present all counsel opinions to <your-name>. <your-name> decides.
- **Borrowed word ambiguity:** When unsure if a word should stay English, ASK. Don't guess.
- **Registry conflict:** If funnel-audit and funnel-translate write simultaneously, re-read and merge. Never overwrite.

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

## NOTES

- This skill translates ONE language at a time. Run again for additional languages.
- Voice profile quality directly determines translation quality. A lightweight profile produces lighter results — flag this to <your-name>.
- The gold-standard reference for HTML template + master content format is the SOMA translation: `~/.claude/projects/soma-jonas/funnel build/`
- Testimonials are NOT translated in the client's voice — they're translated as natural speech from the testimonial giver.
- The skill supports all page types: landing pages, destination pages, upsell/downsell, surveys, Calendly flow, WhatsApp templates, email sequences.
- Progress is saved per-section so work can resume across sessions.
- The borrowed words list is saved to the voice profile for reuse across all future translations for that client.
