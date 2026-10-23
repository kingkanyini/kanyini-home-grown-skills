# Mode Gate — Self vs Client

## When this module loads

`commands/soulcial-media-engine.md` reads this module at session start, BEFORE any phase
work begins. Mode gate runs once per session (unless `switch mode` is invoked mid-session).

It sets three session-scoped values that every later module reads from:

| Variable | Values |
|---|---|
| `active_mode` | `"self"` or `"client"` |
| `active_brand_slug` | kebab-case brand identifier (e.g., `my-podcast`, `acme-studio`, `jane-doe`) |
| `active_voice_path` | absolute path to the active voice profile `.md` |

Voice resolution for both branches is canonical in `references/social-spine/voice.md`
(resolved against this skill's own folder). This module applies that file's chains; it
does not define its own.

---

## Section 1: State Contract

### Single source of truth

`active_mode` + `active_brand_slug` are the session's canonical state. All downstream modules
derive their behavior from these two values. `active_voice_path` is a convenience pointer;
it is always derived from the other two.

### State-anchor reprint rule

Every major skill response (phase openings, counsel round outputs, deliverable previews,
status responses) MUST begin with this anchor, reprinted verbatim — exact punctuation,
exact middle dots (·), exact spacing:

```
[Soulcial · Mode: {mode} · Brand: {brand} · Phase: {phase}]
```

Replace `{mode}` with the literal `active_mode` value (`self` or `client`), `{brand}` with
the `active_brand_slug`, and `{phase}` with the current phase name or `boot` during startup.

**Why this exists:** Claude's context may be compressed mid-session. This anchor is the
compaction-recovery signal. Any module can re-read the last printed anchor to reconstruct
state without re-running the mode gate.

### Compaction recovery protocol

If a later module cannot locate `active_mode` in conversation context, it MUST:
1. Search conversation history for the most recently printed `[Soulcial · Mode: …]` anchor.
2. Parse `active_mode`, `active_brand_slug`, and `active_phase` from that anchor.
3. Restore the `active_voice_path` from the recovered `active_brand_slug` (SOCIAL channel — resolution per `references/social-spine/voice.md`):
   - If `active_mode` = `self` → the voice.md self chain: first that exists of `{you}-social.md` → `{you}-voice.md` → `{you}-email.md` (all under `~/.claude/references/voice-profiles/{you}/`); if none, the session voice-basics working note from Step 2a.1.
   - If `active_mode` = `client` → first that exists: `{active_brand_slug}-social.md` → `{active_brand_slug}-email.md` → `{active_brand_slug}-voice.md`; if none, the session `client_voice_basics` working note from Step 2b.3.
4. Re-anchor by reprinting the recovered `[Soulcial · Mode: …]` anchor before continuing.
5. If no anchor found anywhere in context → re-run mode gate from Step 1.

---

## Step 1: Mode Picker

Present the RPG mission briefing below as message text, then call AskUserQuestion.

---

**MISSION BRIEFING — THE CONTENT REALM**

> You are about to enter the Soulcial Media Engine.
> Before the strategy council assembles, the Engine needs to know:
> *Whose world are we building?*
>
> Choose your archetype to begin the session.

---

Use AskUserQuestion with two options:

- **Self Mode — My brands** — Build for one of your own brands. Your voice, your mission.
- **Client Mode — A client's brand** — Build for a client. Their voice, their world.
  A data boundary sentinel drops on the first save.

**On Self selection → Step 2a.**
**On Client selection → Step 2b.**

---

## Step 2a: Self Branch

### Step 2a.1: Set voice path (resolved)

```
active_mode       = "self"
active_voice_path = first that exists, per references/social-spine/voice.md (self chain):
                    ~/.claude/references/voice-profiles/{you}/{you}-social.md
                    ~/.claude/references/voice-profiles/{you}/{you}-voice.md
                    ~/.claude/references/voice-profiles/{you}/{you}-email.md
```

> **Voice channel note:** this is a SOCIAL engine — it prefers the SOCIAL voice profile
> (`{you}-social.md`) over the email one. If only an email profile exists, use it, but treat
> email-only rules (e.g. a hard em-dash ban) as non-binding for social. `{you}` is the
> folder name you chose when you built your own profile.

**If no profile exists:** capture 3 voice basics inline, one AskUserQuestion round each
(free text via "Other"): how you talk, words you'd never use, one sample post you love.
Store them in conversation context as a session working note, set
`active_voice_path` = `(self voice basics — no file)`, and recommend running
`/voice-profile-build` before shipping deliverables.

### Step 2a.2: Brand sub-pick

Present the RPG flavor below, then call AskUserQuestion.

---

> Which realm are we building in today?
> Each brand has its own energy — pick the one that matches your current mission.

---

Scan `~/.claude/projects/` for existing brand folders named `*-social-engine/` or
`*-posts/`. Strip the suffix to get each brand's slug (`acme-studio-social-engine/` →
`acme-studio`); a brand that has both folders appears once.

**If brand folders exist:** use AskUserQuestion with up to three found brands (most
recently modified first) plus **New brand**:

- **{Brand display name}** — Existing brand folder found. *(sets `active_brand_slug` =
  that folder's slug)*
- **New brand** — A brand with no folder yet. The "Other" escape hatch captures the brand
  name as free text; it also covers any found brand not listed above. Slugify on input
  (lowercase, hyphens). *(sets `active_brand_slug` = slugified input)*

**If no brand folders exist:** ask for the brand name (free text via "Other"). Slugify on
input (lowercase, hyphens) → `active_brand_slug`.

### Step 2a.3: Confirm and anchor

After brand selection, set state and print the boot anchor:

```
[Soulcial · Mode: self · Brand: {active_brand_slug} · Phase: boot]
```

Confirm with one line: *"Self mode locked. Writing in your voice for [Brand display name]. Let's build."*

Proceed to the welcome screen.

---

## Step 2b: Client Branch

### Step 2b.1: Capture client name

Present RPG flavor below, then call AskUserQuestion.

---

> NPC Encountered: New Client
> The content council needs a name to build their dossier.
> What do we call this client?

---

Use AskUserQuestion with one option (free-text via "Other"):

- **Enter client name** — First name, full name, or brand name. Use whatever they go by.

Slugify the entered name: lowercase, spaces → hyphens, strip special characters.
Set `active_brand_slug` = slugified name. Set `active_mode` = `"client"`.

### Step 2b.2: Check for existing voice profile

Check whether a client voice profile exists, per the client chain in `references/social-spine/voice.md`, preferring the SOCIAL channel: `{active_brand_slug}-social.md`, else `{active_brand_slug}-email.md`, else `{active_brand_slug}-voice.md` (all under `~/.claude/references/voice-profiles/{active_brand_slug}/`).

**If the file exists:**

> Voice profile found for [client name]. Loading their voice DNA.

Set `active_voice_path` = the resolved profile from above (prefer `-social.md`; if only an email profile exists, use it but treat email-only rules like the hard em-dash ban as non-binding for social).
Skip to Step 2b.4.

**If the file does NOT exist:**

> No voice profile found for [client name]. Let's capture the basics — we'll build a fuller
> profile in Phase 1 of the strategy session.

Use AskUserQuestion with two options:

- **Quick capture now (recommended)** — Collect 3 voice basics inline: tone (e.g., warm + professional),
  core audience, one phrase they'd never say. Store as working context for the session.
  Full profile build deferred to Phase 1 or `/voice-profile-build`. *(proceed to Step 2b.3)*
- **Skip voice capture — use defaults** — Content will be generated with generic brand voice.
  Recommend running `/voice-profile-build` before Phase 5 deliverables. *(skip to Step 2b.4)*

### Step 2b.3: Quick voice capture (if selected)

Call AskUserQuestion three times in sequence. Each round uses RPG framing:

**Round 1 — Tone Stat:**
> What is [client name]'s content tone? Pick the closest match or type your own.

Options: Warm + empowering | Bold + edgy | Professional + calm | Playful + light

**Round 2 — Audience Stat:**
> Who is their primary audience in one sentence?

Free text via "Other".

**Round 3 — Never-Say Word:**
> One phrase or word this brand would NEVER use?

Free text via "Other".

Store these three values in conversation context as `client_voice_basics`. They inform Phase 1
intake; they do NOT replace a full voice profile.

Set `active_voice_path` = `(client_voice_basics — no file)`.

### Step 2b.4: Flag the data boundary sentinel

**IMPORTANT — do NOT drop the sentinel here.** Mode gate only flags the intent.
The actual `.client-data-boundary` sentinel file drops at the first Phase 0 write
(the first time any module saves client work product to disk).

Print this notice inline (not as an error — as a transparency statement):

> Client data boundary active. The first time content is saved to disk, a `.client-data-boundary`
> sentinel drops in the save folder. This marks all content in that folder as client-PII:
> no auto-vault-promotion, no cross-skill ingestion without your explicit consent.

### Step 2b.5: Confirm and anchor

Print the boot anchor:

```
[Soulcial · Mode: client · Brand: {active_brand_slug} · Phase: boot]
```

Confirm with one line: *"Client mode locked. Building for [client display name]. Content boundary is active."*

Proceed to the welcome screen.

---

## Step 3: Mid-Session Commands

### `switch mode` command

**Trigger phrases** (exact match at message start only — case-insensitive, leading whitespace tolerated):

- `switch mode`
- `change mode`
- `switch brand`
- `change brand`

**NOT triggered by** substring matches mid-message or inside code fences.

**Mid-phase confirmation gate:**

Before resetting state, check if phase work is in progress (defined as: any phase Step > 0
has been entered, or a deliverable draft exists in context).

If work IS in progress, use AskUserQuestion with three options:

- **Discard and switch** — Clear in-context draft state. Return to Step 1 (mode picker).
- **Save draft context + switch** — Note current phase progress in context summary. Return
  to Step 1. (Full file save happens in the deliverables module, not here.)
- **Cancel — stay in current mode** — No state change. Reprint current anchor and continue.

If no work is in progress: skip confirmation, return directly to Step 1.

---

### `status` command

**Trigger phrases** (exact match at message start only):

- `status`
- `who are we building for`
- `current mode`
- `which brand`

**Response template:**

```
============================================================
       Soulcial Media Engine — Session State
============================================================

  [Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: {current_phase}]

  Mode:         {active_mode} (self / client)
  Brand:        {active_brand_slug}
  Voice path:   {active_voice_path}
  Current phase: {current_phase}

  To switch: type "switch mode"
============================================================
```

The `status` command does NOT change state. It re-derives display values from live context
and reprints the state anchor — this re-anchors compaction recovery per the State Contract
(Section 1).

If `active_mode` is somehow not set (catastrophic state loss), display:
*"Session state lost. Returning to mode gate."* and re-run Step 1.
