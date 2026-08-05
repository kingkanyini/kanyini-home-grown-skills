# State Management — Voice Profile Mode

## When this module loads

`commands/daily-email-digest.md` reads this module at session start, BEFORE the first-run gate runs. Loading order:
1. Read `modules/state-management.md` (this file — locks the persistence contract)
2. Read `modules/mode-gate.md` (loads mode selection logic)
3. Run first-run gate (existing)
4. Run mode gate (Step 2 of mode-gate.md)
5. Display welcome screen

This module is **read once at session start**. It is documentation that Claude follows for the entire session.

---

## The Persistence Contract

In a markdown-driven skill, there is no runtime, no in-memory store, no session object. **State is held by Claude's conversation context.** Context compaction (long sessions, sub-task dispatches) can drop earlier turns, which means earlier mode-gate decisions could be lost.

This module defines the contract for keeping state alive across compaction events.

### Rule 1: Single source of truth

`active_profile_slug` is the URL-safe directory key (e.g., `<your-username>`, `exemplar-two`). Everything else is derived:
- `active_mode` = `"personal"` if slug equals the default constant `<your-username>`, else `"ghost"`
- `active_profile_name` = §0.1 > Name read from the profile file (display only)
- `save_directory` = `~/.claude/projects/[active_profile_slug]-emails/`

When state is unclear, re-read the profile from disk and re-derive — do NOT trust cached display values.

### Rule 2: Mode/Voice header line

At the start of EVERY major skill response (welcome screen, path entry, mid-path major beats, save confirmations, counsel handoffs), the skill prints the Mode/Voice anchor on its own line:

```
[Writing as: Exemplar Two (client) · Path A · Step 2b · Meter: MID]
```

Or for Personal mode:

```
[Writing as: <your-name> (you) · Path B · Step 4 · Meter: HIGH]
```

The anchor lives in active conversation context and survives compaction far better than implicit "session memory."

**`Meter:` field (Sovereignty Meter set-point).** Carries the draft's agreeableness dial — LOW / MID / HIGH — chosen at interview Q1b or inferred from the recipient (peer/partner/negotiation → HIGH, teaching/broadcast → MID, grief/onboarding/Heavy-Ask → LOW). The Voice Foreman reads the meter from this anchor (`voice-foreman.md` Step 1); reprinting it here keeps the set-point stable across compaction. Before a draft's meter is set, omit the field or print `Meter: unset`. Full dial → `<your-username>-voice.md` §5.1.

### Rule 3: Re-anchoring on path entry

At the start of Path A, B, or D, the skill explicitly:
1. Reads the active profile from `[active_profile_slug]/[active_profile_slug]-email.md`
2. Re-derives display values from §0.1
3. Confirms in the assistant message:

> *"Path A start — Writing as Exemplar Two. Profile loaded from `exemplar-two/exemplar-two-email.md`."*

If the profile fails §0.x re-validation at path entry (the file was mutated mid-session), ABORT the path entry, display the validation error, and drop back to the mode gate.

### Rule 4: Compaction recovery

If Claude detects that the active profile is unclear mid-session — for example, after a long sub-task return where context was compacted — it MUST silently run the `status` command (defined in `mode-gate.md` Step 5) and re-print the Mode/Voice header before continuing.

**Detection signal:** If the last 5+ assistant responses do NOT contain a Mode/Voice anchor line, treat state as unclear and auto-re-anchor.

### Rule 5: No mid-session disk cache writes

The `~/.claude/projects/daily-email-digest-voice-mode/.last-mode-cache.json` cache is written ONLY:
- At mode-gate completion (start of session)
- At `switch mode` re-pick (mid-session, only on completion of the new pick)

It is NEVER written mid-path. Two parallel sessions cannot stomp each other because the cache reflects last-completed selection, not active selection.

### Rule 6: Cache as untrusted input

When reading `.last-mode-cache.json`:
1. Try to parse JSON. If parse fails, treat as absent + display UI note: *"Cache invalid, ignored."*
2. If parse succeeds, validate `last_profile_slug` against `^[a-z0-9-]+$` regex.
3. If slug fails regex, treat as absent.
4. If slug passes regex, use it as the highlighted default in the mode picker. **Still ask the user to confirm** — the cache is a default, not a bypass.

---

## Why This Matters

Without this contract, a long Path A guided interview that triggers context compaction can lose the active profile. The skill might drift into <your-name>'s voice when it should be Exemplar Two's, and the Voice Foreman would silently load the wrong Layer 2.

The Mode/Voice header reprints make state reconstruction deterministic. Re-anchoring on path entry makes drift recoverable. Cache-as-untrusted-input prevents a corrupted cache from injecting a bad slug.
