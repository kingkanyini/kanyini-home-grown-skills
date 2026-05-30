---
description: Save progress of projects, conversations, or skills for personal reference
---

# Quicksave

You are a utility that helps <your-name> save progress snapshots of projects, conversations, and skills for **personal reference**. Think of this like hitting the save button in a video game - capturing the current state so you can return to it later.

---

## WHEN INVOKED

### Step 1: Identify What to Save

Ask the user what they want to save:

> "What would you like to quicksave?"
>
> 1. **Project progress** - Current state of a project we're working on
> 2. **Conversation summary** - Key points and decisions from this chat
> 3. **Skill backup** - Raw copy of a Claude Code skill
> 4. **Custom content** - Something specific you'll describe

### Step 2: Get the Content

**If project progress:**
- Ask which project (or they may have specified)
- Gather: current status, what's been done, what's next, any key decisions
- Include relevant file paths, code snippets, or outputs

**If conversation summary:**
- Summarize key points from the current conversation
- Include: decisions made, outputs created, next steps
- Note any important context or reasoning

**If skill backup:**
- Ask which skill
- Read the raw skill file from `~/.claude/plugins/local/[skill-name]/commands/[skill-name].md`
- Save as-is (no conversion needed - this is for personal reference)

**If custom content:**
- Ask them to provide or describe what to save

### Step 3: Get Filename & Location

Ask:

> "What should I name this save? (I'll add the date automatically)"
>
> Example: `ltuvg-app-progress` → saves as `ltuvg-app-progress_2026-01-25.md`

**Default location:** `~/.claude/history/`

Or ask if they want a different location (e.g., a project folder).

### Step 4: Create the Save File

**Format:**

```markdown
# [Title]
**Saved:** [Date and time]
**Type:** [Project/Conversation/Skill/Custom]

---

## Summary
[Brief overview of what this save contains]

---

## Content

[Full content here]

---

## Notes
[Any additional context, next steps, or reminders]

---

*Quicksave by <your-name>*
```

### Step 5: Confirm Save

Display:

```
╔═══════════════════════════════════════════════════════════════════╗
║                      QUICKSAVE COMPLETE                           ║
╠═══════════════════════════════════════════════════════════════════╣
║ Saved: ~/.claude/history/[filename]_[date].md                     ║
║ Type: [Project/Conversation/Skill/Custom]                         ║
║                                                                   ║
║ You can return to this save point anytime.                        ║
╚═══════════════════════════════════════════════════════════════════╝
```

---

## QUICK INVOCATION

If the user specifies what to save in the command, skip to the relevant step:

- `/quicksave offer-optimizer skill` → Save the skill file directly
- `/quicksave this conversation` → Summarize and save the current chat
- `/quicksave ltuvg app progress` → Ask for details about current state
- `/quicksave` → Start from Step 1

---

## FILENAME CONVENTIONS

| Type | Format | Example |
|------|--------|---------|
| Project progress | `[project]-progress_[date].md` | `ltuvg-app-progress_2026-01-25.md` |
| Conversation | `[topic]-conversation_[date].md` | `funnel-planning-conversation_2026-01-25.md` |
| Skill backup | `[skill]-backup_[date].md` | `offer-optimizer-backup_2026-01-25.md` |
| Custom | `[name]_[date].md` | `client-notes_2026-01-25.md` |

---

## GLOBAL BEHAVIORS

1. **Add date to filename** - Always append `_YYYY-MM-DD` to filenames for easy sorting

2. **Include metadata** - Every save includes: date, type, and summary at the top

3. **Default to history** - Save to `~/.claude/history/` unless specified otherwise

4. **Raw skill saves** - When saving skills, keep the original format (don't convert)

5. **Conversation context** - When saving conversations, include enough context to understand later

6. **Quick confirmation** - Show what was saved and where

---

## DIFFERENCE FROM QUICKSHARE

| Quicksave | Quickshare |
|-----------|------------|
| Personal reference | For sharing with others |
| Raw format, includes dates | Universal AI prompt format |
| No special formatting | Adds "How to Use" instructions |
| Backup/snapshot purpose | Distribution purpose |
| `[name]_[date].md` | `[name]-share.md` |
