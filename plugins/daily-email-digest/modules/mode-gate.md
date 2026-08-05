# Mode Gate — Personal vs Ghost Writing

## When this module loads

`commands/daily-email-digest.md` reads this module at session start, AFTER `state-management.md` and AFTER the first-run gate, and BEFORE the welcome screen.

The mode gate selects mode + active voice profile and persists the choice for the session (per `state-management.md` Rule 5: cache write at gate completion only).

---

## Step 0: Pre-flight — Validate Personal profile

Before showing the mode picker, run the §0.x validity check against <your-name>'s profile at `~/.claude/references/voice-profiles/<your-username>/<your-username>-email.md`.

**Validity check (§0.x compliance gate)** — file MUST contain these section headers, matched by these regexes (case-insensitive, whitespace-tolerant, NFC Unicode, BOM stripped, CRLF→LF normalized, trailing whitespace trimmed):

```
^##\s+0\.1\s+Identity(?:\s+&\s+Pillars)?\s*$
^##\s+0\.3\s+\S.+\s*$        # require content + at least 1 non-whitespace char (NSA residual #4)
^##\s+0\.4\s+Voice\s+DNA\s*$
^##\s+0\.5\s+Signature\s+Phrases\s*$
^##\s+0\.6\s+Guardrails\s+MANIFEST\s*$
```

Additionally, the §0.3 section MUST contain at least one bulleted line (`^-\s+\S` or `^\*\s+\S`) — required for register-name parsing in Path A (NSA residual #4).

**If validation passes:** proceed to Step 1.

**If validation fails:** display:

```
============================================================
       Profile Validation Error
============================================================

Your personal voice profile (<your-username>-email.md) is malformed:

  Missing section(s): §[X], §[Y]
  Or: §0.3 has no bulleted register list

Repair options:
  [1] Run /voice-profile-build to rebuild
  [2] Continue anyway (Voice Foreman Layer 2 will be degraded)
  [3] Exit
============================================================
```

Use AskUserQuestion with three options:
- "Run /voice-profile-build" → exit cleanly with the command suggestion
- "Continue degraded" → set a `personal_profile_degraded` flag in conversation context, proceed to Step 1
- "Exit" → exit the skill

---

## Step 1: Read `last_mode_used` cache (NSA residual #6 — untrusted input)

Cache location: `~/.claude/projects/daily-email-digest-voice-mode/.last-mode-cache.json`

**Read protocol:**

1. **Check existence.** If file does not exist, skip to Step 2 with defaults (`personal` + `<your-username>`).
2. **Try to parse JSON.** If parse throws, treat as absent + display: *"Cache invalid, ignored."* Skip to Step 2 with defaults.
3. **Verify required keys present:** `last_mode`, `last_profile_slug`, `last_used`. If any missing, treat as absent + display: *"Cache incomplete, ignored."* Skip to Step 2 with defaults.
4. **Validate `last_mode`** against the literal set `{"personal", "ghost"}`. If not in set, treat as absent.
5. **Validate `last_profile_slug`** against regex `^[a-z0-9-]+$`. If fails, treat as absent + display: *"Cache slug invalid, ignored."* (security per NSA residual #6).
6. **Parse `last_used`** as ISO 8601 timestamp. If parse fails or `last_used` is older than 30 days, treat as stale + use defaults.
7. **If all validations pass:** use cached values as the highlighted defaults in Step 2.

**Expected cache shape:**

```json
{
  "last_mode": "ghost",
  "last_profile_slug": "exemplar-two",
  "last_used": "2026-05-30T14:32:00Z"
}
```

---

## Step 2: Display mode picker

Display:

```
============================================================
       DAILY EMAIL DIGEST
       Choose your archetype.
============================================================

  [1] Personal Mode
      Write in your own voice (<your-name>).

  [2] Ghost Writing Mode
      Write in someone else's voice. For client work,
      collaborations, or voice fidelity reviews.

============================================================
```

Use `AskUserQuestion` with two options. **If cache from Step 1 yielded a valid last mode**, label that option with "(Last used)" and present it first.

**On Personal selection → Step 3a.**
**On Ghost selection → Step 3b.**

---

## Step 3a: Personal Mode branch

1. Set `active_profile_slug` = `<your-username>` (hardcoded default constant — see v2 spec Non-Goals on portability).
2. Set `active_mode` = `"personal"` (derived: slug == default constant).
3. Read `~/.claude/references/voice-profiles/<your-username>/<your-username>-email.md` §0.1 > Name. Use the extracted name as `active_profile_name` for display.
4. Update `last_mode_used` cache (atomic write — see Cache Write Protocol below).
5. Proceed to welcome screen.

### Cache Write Protocol (NSA residuals #1 and #2)

Atomic write pattern (prevents corruption on crash):

1. Construct cache JSON:
   ```json
   {
     "last_mode": "personal",
     "last_profile_slug": "<your-username>",
     "last_used": "[ISO 8601 timestamp]"
   }
   ```
2. Ensure cache directory exists: `~/.claude/projects/daily-email-digest-voice-mode/`. Create if missing.
3. Write JSON to `~/.claude/projects/daily-email-digest-voice-mode/.last-mode-cache.json.tmp`
4. Rename `.last-mode-cache.json.tmp` → `.last-mode-cache.json` (atomic on Windows + POSIX)
5. If rename fails, display *"Cache write failed (non-blocking)"* — do NOT block the session.

---

## Step 3b: Ghost Writing Mode branch

### Step 3b.1: Scan voice-profiles directory

Scan `~/.claude/references/voice-profiles/` for subdirectories with these explicit exclusions:
- `<your-username>` (Personal Mode's profile)
- Any directory starting with `_` (e.g., `_TEMPLATES/`, `_archive/`)
- Any directory starting with `.` (e.g., `.git/`)

### Step 3b.2: Validate each candidate slug

For each remaining subdirectory `[slug]/`:
1. Validate the slug against regex `^[a-z0-9-]+$`.
2. If slug fails, add to skipped-list with reason: *"`[slug]`: invalid name (must be lowercase letters, numbers, hyphens)"*. Skip.
3. If slug passes, proceed to Step 3b.3.

### Step 3b.3: Check for compliant email-channel profile

For each valid slug:
1. Check that `~/.claude/references/voice-profiles/[slug]/[slug]-email.md` exists.
2. If file does NOT exist, add to skipped-list with reason: *"`[slug]`: no email profile (missing `[slug]-email.md`)"*. Skip.
3. If file exists, proceed to Step 3b.4.

### Step 3b.4: Validate §0.x compliance

Run the same §0.x validity check defined in Step 0 against the email profile. If validation fails, add to skipped-list with reason: *"`[slug]`: missing §[section]"*.

### Step 3b.5: Read display name + last used

For each valid profile:
1. Read §0.1 > Name from the profile file → use as display name.
2. Check if the cached `last_profile_slug` matches → flag as "(last used)" for sort priority.

### Step 3b.6: Edge case — no valid profiles found

If the valid-profiles list is empty:

```
No client voice profiles found.
Build one with /voice-profile-build or /voice-dna-blueprint-builder,
then come back.
```

Return to Step 2 (mode picker) — Personal still selectable.

### Step 3b.7: Display picker with skipped-list (UI-visible — NOT stderr)

```
============================================================
     Whose voice are we writing for?
============================================================

  [N] valid voices available.
  [If skipped count > 0:]
  Skipped: `[slug-A]` ([reason-A]).
           `[slug-B]` ([reason-B]).
           Run /voice-profile-build to repair.

  [1] [Voice Name 1]  [(last used [date])]
  [2] [Voice Name 2]
  [3] [Voice Name 3]
  [4] [Voice Name 4]
  ... more profiles available — type the name to pick

============================================================
```

Use AskUserQuestion with up to 4 options:
- Sort by recency (last_used match first), then alphabetically.
- If MORE than 4 valid profiles, the 4th option displays *"More profiles available — type the name to pick"* and the AskUserQuestion "Other" escape hatch captures free-text input.

### Step 3b.8: Free-text "Other" handling

If the user picked "Other" and typed a slug:
1. Validate against regex `^[a-z0-9-]+$`. If fails: *"Profile names must be lowercase letters, numbers, hyphens only. Try again or pick from the list."* Return to Step 3b.7.
2. Verify `~/.claude/references/voice-profiles/[typed-slug]/[typed-slug]-email.md` exists. If not: *"No profile found at that name. Available: [list]."* Return to Step 3b.7.
3. Run §0.x validity check. If fails: *"Profile found but malformed (missing §[X]). Pick another or repair with /voice-profile-build."* Return to Step 3b.7.

### Step 3b.9: Lock in the picked profile

Once a valid slug is picked:
1. Set `active_profile_slug` = picked slug (already regex-validated).
2. Set `active_mode` = `"ghost"` (derived: slug ≠ default constant).
3. Set `active_profile_name` = §0.1 > Name from the loaded profile.
4. Update `last_mode_used` cache via the Cache Write Protocol (Step 3a).
5. Proceed to welcome screen.

---

## Step 4: `switch mode` command discipline

### Trigger phrases (exact match at message start ONLY)

The trigger is the user's message starting with EXACTLY one of these phrases (case-insensitive, leading whitespace tolerated):
- `switch mode`
- `change mode`
- `switch voice`
- `change voice`

### NOT triggered by

- Substring matches mid-message ("I want to switch mode in my life")
- Partial matches ("change something")
- Anywhere except message start
- Inside code fences or quoted content

### Mid-draft confirmation gate

Before resetting state, check if a draft is in flight (defined as: user has answered ≥1 question in any Path A guided interview, OR Path B has accepted a pasted draft, OR Path D has loaded a saved email for editing).

If a draft IS in flight, display:

```
============================================================
  You have work in progress.

  Switching modes will:
    [1] Discard the current draft + start fresh
    [2] Save the draft to current profile's folder + start fresh
    [3] Cancel — stay in current mode
============================================================
```

Use AskUserQuestion with three options.

If `[2] Save and switch`:
1. Save current draft to `~/.claude/projects/[current_active_profile_slug]-emails/draft-[YYYY-MM-DD-HHMM].md`.
2. Confirm save with file path.
3. Drop user back to Step 2 (mode picker).

If `[1] Discard and switch`:
1. Clear any in-context draft state.
2. Drop user back to Step 2.

If `[3] Cancel`:
1. Stay in current path + mode. No state change.

### No draft in flight

If no draft is in flight, skip the confirmation and go straight to Step 2 (mode picker).

---

## Step 5: `status` command

### Trigger phrases (exact match at message start ONLY)

Same discipline as Step 4. Trigger phrases:
- `status`
- `who am I writing as`
- `current voice`
- `which mode`

### Response template

```
============================================================
       Current Session State
============================================================

  Writing as: [active_profile_name] ([you/client])
  Profile path: ~/.claude/references/voice-profiles/[active_profile_slug]/[active_profile_slug]-email.md
  Session started: [session-start timestamp if known]
  Active path: [current path + step if known]
  Sovereignty Meter: [LOW/MID/HIGH if set, else "unset — inferred at draft time"]

  To switch: type "switch mode"
============================================================
```

The `status` command does NOT change state — it re-derives display values from the active profile and re-prints the Mode/Voice header anchor. This re-anchors state per `state-management.md` Rule 4 (compaction recovery).

If `active_profile_slug` is somehow not set (catastrophic state loss), display: *"Active profile state lost. Returning to mode gate."* and run Step 0.
