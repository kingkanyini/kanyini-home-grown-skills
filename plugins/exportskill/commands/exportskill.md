---
description: Export Claude Code skills to Claude Web project knowledge format
---

# ExportSkill

You are a utility that exports Claude Code skills to a format compatible with **Claude Web's project knowledge system**. This tool transforms local skills into portable, self-contained files that can be uploaded to Claude Web projects.

---

## WHEN INVOKED

### Step 1 of 5: IDENTIFY SOURCE

**If argument provided:**
- Check if it's a skill name (e.g., `funnel-hack-research`)
  - Look in `~/.claude/plugins/local/[skill-name]/commands/[skill-name].md`
- Check if it's a file path (e.g., `C:\path\to\custom-skill.md`)
  - Validate the file exists
  - **Security:** Only allow paths within `~/.claude/plugins/local/`, `~/.claude/skill-export/`, or `~/Dropbox/`. Reject paths to `.ssh/`, `.claude/vault/`, or any sensitive directory. If a path outside allowed directories is requested, warn the user and ask for confirmation.
- If not found, report error and list available skills

**If no argument provided:**
- List available skills from `~/.claude/plugins/local/`:

```
Available skills to export:

1. offer-optimizer
2. funnel-hack-lvl-1
3. propaganda-machine
4. funnel-hack-research
5. quickshare
6. quicksave

Enter skill name or file path:
```

Wait for user selection before proceeding.

**Display progress:**
```
Step 1 of 5: Identifying source...
✓ Found: [path to skill file]
```

---

### Step 2 of 5: LOCATE ALL COMPONENTS

**Find the command file:**
- Read the main `.md` file from the skill folder or provided path
- Note the file size

**Search CLAUDE.md for related sections:**
- Read `~/.claude/CLAUDE.md`
- Search for sections containing the skill name (case-insensitive)
- Look for patterns like:
  - `## [Skill Name]` or `### [Skill Name]`
  - `Skill Architecture Reference: [skill-name]`
  - Any heading containing the skill name
- Extract the full section (from heading to next same-level or higher heading)

**Detect reference files:**
- Check the skill folder for additional files (not `.claude-plugin/` or the main command file)
- Check for common reference file patterns: `.json`, `.csv`, `.txt`, example files
- Note file sizes for each

**Display progress:**
```
Step 2 of 5: Locating components...
✓ Command file: [filename] ([size])
✓ CLAUDE.md context: "[section name]" ([size]) — or "No related sections found"
✓ Reference files: [count] found — or "No reference files detected"
```

**Export-anonymization gate (MUST — runs before any output):**
Grep ALL components being packaged (command file + every detected reference file + merged CLAUDE.md context) for the marker `ANONYMIZE BEFORE EXPORT`. If the marker appears in ANY component:
1. HARD-STOP. Do not proceed to Step 3/4.
2. Show the user the exact file + the client-specific content flagged (client name, paid back-end name, audience psychographics, etc.).
3. AskUserQuestion: "This file is flagged to anonymize before export. How do you want to proceed?" — options: "I've stripped/generalized it — re-scan and continue" / "Exclude this reference file from the export" / "Cancel export".
4. Only continue once the marker is gone from packaged content (re-grep to confirm) OR the flagged file is excluded. NEVER package live client data flagged for anonymization. This implements the keep-but-protect contract from skills like headline-creator's `gold-standard-headlines.md`.

---

### Step 3 of 5: TRANSFORM & MERGE

**Ask which header style to use:**

> Which export format do you want?
>
> 1. **Generic** — Works with any Claude Web project
> 2. **DCM-Specific** — For <your-name>'s Digital Content Manager
>
> (Default: Generic)

**Apply the selected header (see templates below)**

**Merge CLAUDE.md context:**
- If related sections were found, add them under `## Extended Context (from CLAUDE.md)` at the end of the skill content
- Preserve all formatting, tables, and code blocks

**Process reference files:**
- For each reference file detected, apply the size thresholds:

| Size | Chat Output | Export Folder | Marker |
|------|-------------|---------------|--------|
| < 100KB text | Full content displayed | Included | `[x] Included (displayed)` |
| 100KB - 5MB text | Summary only | Included | `[x] Included (see export folder)` |
| > 5MB or binary | Flag message | NOT included | `[ ] Upload required` |

**Add dependency markers:**
- In the header's "Required Reference Files" section, list all detected files with their status

**Display progress:**
```
Step 3 of 5: Transforming...
✓ Added web-specific header ([format] style)
✓ Merged CLAUDE.md context — or "No context to merge"
✓ Processed [X] reference files — or "No dependencies to mark"
```

---

### Step 4 of 5: OUTPUT

**Save to export folder:**
- Save the merged file to `~/.claude/skill-export/[skill-name]-skill.md`
- Copy included reference files to `~/.claude/skill-export/`
- For multiple reference files, create `~/.claude/skill-export/[skill-name]-reference/`

**Display the full merged content in chat:**
- After the file is saved, display the entire content in a code block so user can copy it directly

**Display progress:**
```
Step 4 of 5: Outputting...
✓ Saved: ~/.claude/skill-export/[skill-name]-skill.md
✓ Reference files: [list saved files] — or "None"
```

---

### Step 5 of 5: SUMMARY

Display completion box:

```
╔═══════════════════════════════════════════════════════════════════╗
║                       EXPORT COMPLETE                             ║
╠═══════════════════════════════════════════════════════════════════╣
║ Exported: [skill-name]-skill.md                                   ║
║ Location: ~/.claude/skill-export/                                 ║
║ Size: [size] (merged)                                             ║
╠═══════════════════════════════════════════════════════════════════╣
║ Files included:                                                   ║
║   ✓ [skill-name]-skill.md                                         ║
║   ✓ [reference-file] (if any)                                     ║
╠═══════════════════════════════════════════════════════════════════╣
║ Manual uploads required:                                          ║
║   ○ [large-file] — Upload to project knowledge                    ║
║   — or "None"                                                     ║
╚═══════════════════════════════════════════════════════════════════╝
```

Then display:

```
[COPY-READY CONTENT BELOW]
---
```

Followed by the full merged file content in a markdown code block.

---

## HEADER TEMPLATES

### Option A: Generic (Any Claude Web Project)

```markdown
# [Skill Name]

> **Project Skill** — Read this file before executing tasks related to [skill-name].

## How to Use This Skill

1. When given a task matching this skill's purpose, read this entire file first
2. Follow the workflow steps in order
3. If reference files are mentioned below, ensure they exist in project knowledge

## Required Reference Files

<!-- AUTO-GENERATED: List of dependencies -->
- [ ] `[filename]` — [description] <!-- FLAG: Upload required -->
- [x] `[filename]` — [description] <!-- Included in export -->

---

<!-- SKILL CONTENT BEGINS -->
```

### Option B: DCM-Specific (Digital Content Manager)

```markdown
# [Skill Name]

> **DCM Skill** — Part of <your-name>'s Digital Content Manager skills library.

## How to Use This Skill

1. Identify this skill is relevant to the current task
2. Read the [name]-skill.md file completely before starting
3. Use any associated reference materials (`[name]-reference/` or `[name]-example.*`)
4. If no skill matches the task, proceed with general best practices

## Skill naming convention:
- `[name]-skill.md` — the skill instructions (this file)
- `[name]-reference/` or `[name]-example.*` — supporting materials

## Required Reference Files

<!-- AUTO-GENERATED: List of dependencies -->
- [ ] `[filename]` — [description] <!-- FLAG: Upload to project knowledge -->
- [x] `[filename]` — [description] <!-- Included in export -->

---

<!-- SKILL CONTENT BEGINS -->
```

---

## CLAUDE.MD CONTEXT EXTRACTION

When searching CLAUDE.md for related sections:

1. **Search patterns** (case-insensitive):
   - Exact skill name in any heading: `## [skill-name]`, `### [skill-name]`
   - "Skill Architecture Reference: [skill-name]"
   - Framework names mentioned in the skill

2. **Extraction rules:**
   - Start from the matched heading
   - Continue until reaching a heading of the same level or higher
   - Include all content, tables, code blocks, and sub-headings

3. **Placement in output:**
   - Add extracted content at the END of the skill file
   - Under heading: `## Extended Context (from CLAUDE.md)`
   - Add note: `*This context was automatically merged from CLAUDE.md during export.*`

---

## REFERENCE FILE HANDLING

### Size Thresholds

```
For each reference file:
│
├── IF file size < 100KB AND text-based (.md, .json, .txt, .csv):
│   ├── Include in export folder
│   ├── Display FULL content in chat after main skill content
│   └── Mark as "[x] Included (displayed)"
│
├── ELIF file size 100KB - 5MB AND text-based:
│   ├── Include in export folder
│   ├── Display SUMMARY: "File: [name] ([size]) - saved to export folder"
│   └── Mark as "[x] Included (see export folder)"
│
├── ELIF file size > 5MB OR binary file (.png, .jpg, .pdf, etc.):
│   ├── DO NOT include in export
│   ├── Display FLAG: "⚠ Large/binary file requires manual upload"
│   ├── Mark as "[ ] Upload required" with FLAG
│   └── Add instruction in skill: "FLAG: [filename] missing - upload to project knowledge"
```

### Missing File Check

Add this to the skill header when reference files exist:

```markdown
## Dependency Check

Before running this skill, verify these files exist in project knowledge:
- `[filename]` — [purpose]

If any file is missing, notify the user: "Missing required file: [filename]. Please upload to project knowledge."
```

---

## QUICK INVOCATION

If the user specifies the skill in the command, skip to Step 1 validation:

- `/exportskill funnel-hack-research` → Export that specific skill
- `/exportskill C:\path\to\skill.md` → Export from file path
- `/exportskill` → Start interactive mode (list available skills)

---

## GLOBAL BEHAVIORS

1. **Progress indicators** — Show "Step X of 5" at each phase

2. **File size formatting** — Display sizes in human-readable format (KB, MB)

3. **Preserve original formatting** — Don't modify the skill content except for adding headers and merged context

4. **Handle missing CLAUDE.md gracefully** — If no related sections found, note "No extended context found" and continue

5. **Create export folder if needed** — Ensure `~/.claude/skill-export/` exists before saving

6. **Overwrite warning** — If file already exists in export folder, note "Overwriting existing export"

7. **Copy-ready output** — Always end with the full content displayed in chat for easy copying

8. **Anonymization gate is non-negotiable** — Never package content carrying an `ANONYMIZE BEFORE EXPORT` marker until the flagged client-specific data is stripped or the file is excluded (see Step 2 gate). Scrubbing after distribution is impossible — gate before output.

---

## EXAMPLE OUTPUT

For `/exportskill quicksave`:

```
Step 1 of 5: Identifying source...
✓ Found: ~/.claude/plugins/local/quicksave/commands/quicksave.md

Step 2 of 5: Locating components...
✓ Command file: quicksave.md (4KB)
✓ CLAUDE.md context: No related sections found
✓ Reference files: No reference files detected

Which export format do you want?
1. Generic — Works with any Claude Web project
2. DCM-Specific — For <your-name>'s Digital Content Manager
(Default: Generic)

[User selects 1]

Step 3 of 5: Transforming...
✓ Added web-specific header (Generic style)
✓ No context to merge
✓ No dependencies to mark

Step 4 of 5: Outputting...
✓ Saved: ~/.claude/skill-export/quicksave-skill.md

Step 5 of 5: Summary

╔═══════════════════════════════════════════════════════════════════╗
║                       EXPORT COMPLETE                             ║
╠═══════════════════════════════════════════════════════════════════╣
║ Exported: quicksave-skill.md                                      ║
║ Location: ~/.claude/skill-export/                                 ║
║ Size: 5KB (merged)                                                ║
╠═══════════════════════════════════════════════════════════════════╣
║ Files included:                                                   ║
║   ✓ quicksave-skill.md                                            ║
╠═══════════════════════════════════════════════════════════════════╣
║ Manual uploads required: None                                     ║
╚═══════════════════════════════════════════════════════════════════╝

[COPY-READY CONTENT BELOW]
---

[Full merged .md content here]
```

---

## DIFFERENCE FROM QUICKSHARE

| ExportSkill | Quickshare |
|-------------|------------|
| Claude Web project knowledge format | Universal AI prompt format |
| Adds project-specific header | Adds "How to Use" for any AI |
| Merges CLAUDE.md context | No context merging |
| Handles reference files | No reference handling |
| Output: `[name]-skill.md` | Output: `[name]-share.md` |
| Location: `~/.claude/skill-export/` | Location: `~/.claude/history/` |

---

*ExportSkill by <your-name>*
