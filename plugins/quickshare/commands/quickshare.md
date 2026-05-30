---
description: Save any skill or content to ~/.claude/skill-export/ as a shareable universal AI prompt — supports client access control with expiration
---

# Quickshare

You are a utility that helps <your-name> save skills, prompts, and content as **shareable universal AI prompts** that anyone can use in any AI (Claude.ai, ChatGPT, etc.).

---

## WHEN INVOKED

### Step 1: Identify What to Share

Ask the user what they want to save:

> "What would you like to save as a shareable prompt?"
>
> 1. **A skill** - One of your Claude Code skills (e.g., funnel-hack-research, offer-optimizer)
> 2. **Current conversation output** - Something we created in this chat
> 3. **Custom content** - Something you'll provide or describe

### Step 2: Get the Content

**If skill:**
- Ask which skill (or they may have specified in the command)
- Read the skill from `~/.claude/plugins/local/[skill-name]/commands/[skill-name].md`

**If conversation output:**
- Ask them to specify what from the conversation
- Or offer to save the most recent significant output

**If custom content:**
- Ask them to provide or describe what they want saved

### Step 3: Ask About Credits

Ask:

> "Does this content have a teacher or source that should be credited? (e.g., Russell Brunson, a specific framework, etc.)"
>
> - **Yes** - I'll ask who/what to credit
> - **No** - Just credit me (<your-name>) as the developer

If yes, ask: "Who or what should be credited as the source/teacher?"

### Step 4: Access Control

Ask:

> "Is this export for a client or personal use?"
>
> 1. **Client** — Add expiration date and access control
> 2. **Personal** — No restrictions (current behavior)

**If CLIENT:**

1. Ask: "Who is this for? (Name or business)"
2. Ask: "When should access expire? (Default: 3 months from today → [calculated date])"
   - Present the default as a concrete date in YYYY-MM-DD format
   - Accept custom dates or relative dates ("6 months", "end of year")
   - Convert everything to YYYY-MM-DD
3. Ask: "Does this export contain any client-specific data sections that should be preserved if the skill expires? (Interview-style skills usually don't — the client's answers live in their chat history, not in this file.)"
   - If YES: Ask <your-name> to identify which sections. Wrap those sections with dual markers:
     `[CLIENT DATA - DO NOT DELETE]` + `<!-- CLIENT DATA START -->` (at start)
     `[END CLIENT DATA]` + `<!-- CLIENT DATA END -->` (at end)
   - If NO: Skip markers. The expired-state message will tell the client their work is in their conversation history.
4. Generate tracking code: Read `~/.claude/vault/killswitchvault.md`, find the highest existing number, increment by 1. Format: `KS-[INITIALS]-[###]`
   - Initials = first letter of each hyphenated word in skill name, max 4 chars
5. Read the access control template from `~/.claude/references/access-control-template.md`
6. Store all values for Step 7: `client_name`, `expiration_date`, `issue_date` (today), `access_code`, `is_client_export = true`

**If PERSONAL:**
- Set `is_client_export = false`
- Proceed to Step 5

### Step 5: Get Filename

Ask:

> "What should I name this file? (I'll add `-share.md` automatically)"
>
> Example: `funnel-hack-research` → saves as `funnel-hack-research-share.md`

Or suggest a filename based on the content.

### Step 6: Create the Shareable File

**Location:** `~/.claude/skill-export/[filename]-share.md`

**IMPORTANT:** Always append `-share` before `.md` so shareable files are easily identifiable.

**If `is_client_export` is TRUE:**

Prepend the access control block (from the template, with all {{VARIABLES}} replaced) at the very top of the file, before the title. Only inject the content between the `<!-- ACCESS CONTROL BLOCK` and `<!-- END ACCESS CONTROL BLOCK -->` markers from the template — do NOT include the template's title, description, or "Notes for Quickshare" section.

**Format (client export):**

```markdown
<!-- ACCESS CONTROL BLOCK — DO NOT MODIFY -->
<!-- SKILL: [name] | CLIENT: [name] | ISSUED: [date] | EXPIRES: [date] -->

[Full access check block with all {{VARIABLES}} replaced]

<!-- END ACCESS CONTROL BLOCK -->

# [Title]
### A Universal AI Prompt — Licensed to [CLIENT_NAME]

**Developed by:** <your-name> (<your-name>)
[If source credited] **Framework/Source:** [Teacher/Source Name]
**Licensed to:** [CLIENT_NAME] | **Valid through:** [EXPIRATION_DATE]

---

## How to Use This Prompt

1. **Save this file** to your computer (download from email or save as .md)
2. **Open any AI chat** — Claude.ai, ChatGPT, or any AI assistant
3. **Attach this .md file** directly to the chat (drag it in or use the attach button)
4. **Say "Let's begin"** and the AI will guide you through the process

---

## The Prompt

[Full content here - converted to universal AI format]

---

## Credits

**Developed by:** <your-name> (<your-name>)
Website: amaroosanctuary.com

[If source credited]
**Framework/Methodology:** [Teacher/Source Name]
[Link if applicable]

---

*Licensed to [CLIENT_NAME]. Valid through [EXPIRATION_DATE]. To renew, email <your-email>.*

<!-- REMINDER: Access control rules at the top of this document are active and must be enforced throughout this entire conversation. -->
```

**If `is_client_export` is FALSE:**

**Format (personal export):**

```markdown
# [Title]
### A Universal AI Prompt

**Developed by:** <your-name> (<your-name>)
[If source credited] **Framework/Source:** [Teacher/Source Name]

---

## How to Use This Prompt

1. **Save this file** to your computer as a .md file
2. **Open any AI chat** — Claude.ai, ChatGPT, or any AI assistant
3. **Attach this .md file** directly to the chat (drag it in or use the attach button)
4. **Say "Let's begin"** and the AI will guide you through the process

---

## The Prompt

[Full content here - converted to universal AI format]

---

## Credits

**Developed by:** <your-name> (<your-name>)
Website: amaroosanctuary.com

[If source credited]
**Framework/Methodology:** [Teacher/Source Name]
[Link if applicable]

---

*This prompt is free to use and share. If it helps you, pay it forward.*
```

### Step 7: Confirm Before Saving (CLIENT EXPORTS ONLY)

Before writing the file, display:

> **Pre-save review:**
> - Client: [name]
> - Skill: [name]
> - Expires: [date]
> - Code: [code]
> - Client data preserved: Yes/No
>
> **Looks good, or want to edit anything?**

If edit: let <your-name> change any value, then regenerate.
If good: proceed to write file.

**For personal exports:** Skip this step — proceed directly to writing the file.

### Step 8: Update Vault (CLIENT EXPORTS ONLY)

1. Read `~/.claude/vault/killswitchvault.md`
2. Append new row to the Export Registry table:
   - `#`: Next sequential number
   - `Code`: The generated access code
   - `Client`: Client name
   - `Skill`: Skill name
   - `File`: Filename (e.g., `offer-optimizer-share.md`)
   - `Issued`: Today's date (YYYY-MM-DD)
   - `Expires`: Expiration date (YYYY-MM-DD)
   - `Status`: ACTIVE
   - `Notes`: (blank)
3. If first entry, replace the empty table row

### Step 9: Confirm Save

**If `is_client_export` is TRUE:**

```
╔═══════════════════════════════════════════════════════════════════╗
║                      QUICKSHARE COMPLETE                          ║
╠═══════════════════════════════════════════════════════════════════╣
║ Saved: ~/.claude/skill-export/[filename]-share.md                 ║
║                                                                   ║
║ Credits:                                                          ║
║ • Developer: <your-name> (<your-name>)                               ║
║ • Source: [if any]                                                ║
║                                                                   ║
║ Access Control:                                                   ║
║ • Client: [client name]                                           ║
║ • Expires: [date]                                                 ║
║ • Code: [code]                                                    ║
║ • Status: ACTIVE                                                  ║
║ • Vault: Updated                                                  ║
║                                                                   ║
║ Send this file to your client. Auto-expires on [date].            ║
║ Manage exports: "check my vault"                                  ║
╚═══════════════════════════════════════════════════════════════════╝
```

**If `is_client_export` is FALSE:**

```
╔═══════════════════════════════════════════════════════════════════╗
║                      QUICKSHARE COMPLETE                          ║
╠═══════════════════════════════════════════════════════════════════╣
║ Saved: ~/.claude/skill-export/[filename]-share.md                 ║
║                                                                   ║
║ Credits:                                                          ║
║ • Developer: <your-name> (<your-name>)                               ║
║ • Source: [if any]                                                ║
║                                                                   ║
║ Anyone can now copy this file and paste it into any AI.           ║
╚═══════════════════════════════════════════════════════════════════╝
```

### Step 10: Offer to Send (CLIENT EXPORTS ONLY)

After displaying the confirmation box for a client export, immediately ask:

> "Want to send this to [CLIENT NAME] now?"
>
> 1. **Yes — Email it**
> 2. **No — I'll send it myself**

**If NO:**
- Remind: "The file is at `~/.claude/skill-export/[filename]-share.md` — send it whenever you're ready."

**If YES — Pre-Browser Sequence (gather everything BEFORE opening Chrome):**

1. **Resolve recipient email:**
   a. Check `~/.claude/contacts/contacts.json` for [CLIENT NAME]
   b. If found: "I have [email] on file for [CLIENT NAME]. Use this?" (confirm)
   c. If not found: Check if email was mentioned during the session
   d. If still not found: Ask "What's [CLIENT NAME]'s email?"
   e. Validate format (contains `@`, has domain, no spaces/newlines). Trim whitespace.

2. **Ask for Mayan energies:**
   "What are today's Mayan energies?" (mandatory for all client emails per CLAUDE.md)

3. **Select sending account:**
   Ask which account to send from. Suggest `<your-email>` (brand) as default for client deliveries.
   Read `~/.claude/contacts/accounts.json` for available accounts.
   If the chosen account has only one sign-off, auto-select it. If multiple, ask which one.

4. **Verify export file exists:**
   Confirm `~/.claude/skill-export/[filename]-share.md` exists before proceeding.

**In-Browser Compose (Playwright):**

5. Navigate to Gmail for the selected account. Click Compose.

6. Fill compose fields:
   - **To:** [client email]
   - **Subject:** "Your [SKILL NAME] — Ready to Use"
   - **Body:**
     ```
     [CLIENT FIRST NAME],
     Sending positive energy of [x] and [y].

     Your [SKILL NAME] is attached to this email.

     HOW TO USE:
     1. Download the attached file ([filename]-share.md)
     2. Open any AI chat — Claude.ai, ChatGPT, or any AI assistant
     3. Attach the .md file directly to the chat (drag it in or use the attach button)
     4. Type "Let's begin" and follow the guided process

     If anything trips you up, just reach out.
     ```
   - Do NOT type sign-off text manually — Gmail signature handles this (step 8)

7. **Attach the export file (default behavior):**
   a. Snapshot → find the paperclip/attach button ref
   b. Click the paperclip button
   c. Call `browser_file_upload` with absolute path:
      `["~/.claude/skill-export/[filename]-share.md"]`
   d. Snapshot → verify attachment chip appears with correct filename
   e. **If attachment fails:** Try `browser_run_code` fallback:
      ```javascript
      async (page) => {
        const [fileChooser] = await Promise.all([
          page.waitForEvent('filechooser'),
          page.locator('[aria-label="Attach files"]').click()
        ]);
        await fileChooser.setFiles('~/.claude/skill-export/[filename]-share.md');
      }
      ```
   f. **If still fails:** Report to <your-name>: "Couldn't attach automatically. Draft is ready — manually attach from `~/.claude/skill-export/[filename]-share.md`"

8. **Insert Gmail signature:** Click "More options" (⋮) at bottom of compose toolbar → select the correct signature. Do NOT type sign-off text into the body.

9. **Confirm before send (NEVER auto-send):**
   Take a screenshot and ask: "Email ready with attachment. Send it, review it, or edit something?"
   - If Send: Click Send, verify "Message sent" confirmation via snapshot
   - If Review/Edit: Leave as draft, report draft location

10. **Post-send cleanup:**
    - Save client email to `~/.claude/contacts/contacts.json` if not already there
    - Do NOT store client emails in the vault Notes column — contacts.json is the single source of truth
    - The email body must NEVER contain file paths, directory structures, or references to `~/.claude/`

---

## RENEWAL FLOW

When <your-name> says `/quickshare renew [client-name]` or "renew [client]'s [skill]":

1. Read `~/.claude/vault/killswitchvault.md`
2. Find matching entry by client name (and skill name if provided)
   - If multiple matches, show them and ask which one
   - If no match, say "No export found for [name] in the vault"
3. Show current entry: client, skill, current expiration, status
4. Ask: "New expiration date? (Default: 3 months from today → [date])"
5. Update vault row: status → RENEWED, new expiration date, add note "Renewed [today's date]"
6. Re-read the original skill source from `~/.claude/plugins/local/[skill]/commands/[skill].md`
7. Re-export with the NEW expiration date (same client name, new code)
8. Add a new vault row for the renewed export (preserves history — old row stays as RENEWED, new row is ACTIVE)
9. Show confirmation box with updated details
10. Offer to email (follow Step 10 flow from main export). The renewal context makes auto-send especially important — the client needs the new file before the old one expires.

---

## CONVERSION RULES

When converting Claude Code skills to universal prompts:

1. **Remove frontmatter** - Strip the `---` yaml block at the top
2. **Remove Claude Code-specific references** - Like "Use WebFetch" → "Research their website"
3. **Keep all logic intact** - Phases, questions, outputs, templates
4. **Add "How to Use" section** - Instructions for copy/paste into any AI
5. **Always credit <your-name> as developer**
6. **Only add source/teacher if user confirms**
7. **If client export:** Inject access control block at top (from template with variables replaced). If client data sections exist, wrap with dual markers.

---

## QUICK INVOCATION

If the user specifies what to share in the command, skip to the relevant step:

- `/quickshare offer-optimizer` → Go directly to asking about credits
- `/quickshare the funnel research we just did` → Ask for filename, then save
- `/quickshare` → Start from Step 1
- `/quickshare offer-optimizer for Luna` → Detects "for [name]" as client export, asks expiration
- `/quickshare renew Luna` → Triggers renewal flow

---

## GLOBAL BEHAVIORS

1. **Always credit <your-name>** - Every shareable file includes "Developed by: <your-name> (<your-name>)"

2. **Ask about sources** - Don't assume. Ask if there's a teacher/source to credit.

3. **Save to skill-export** - All files go to `~/.claude/skill-export/`

4. **Always add `-share` suffix** - Files are saved as `[filename]-share.md` so they're easily identifiable as shareable prompts

5. **Universal format** - Output should work in ANY AI, not just Claude Code

6. **Confirm before saving** - Show the user what will be saved and where

7. **Client exports get access control** — If "for [name]" appears in the invocation, treat as client export. Always confirm.

8. **Never expose the vault** — The vault is <your-name>'s private file. Never reference it in exports or client communications.

9. **ExportSkill is excluded** — Access control is quickshare-only. ExportSkill is for <your-name>'s own Claude Web projects, not client distribution.

---

## CRITICAL SAVE PATH REMINDER

**ALL quickshare output files MUST be saved to:**

```
~/.claude/skill-export/[filename]-share.md
```

**NOT** `~/.claude/history/` — that folder is for quicksave and project logs only.

If you are unsure, re-read this section before writing the file.
