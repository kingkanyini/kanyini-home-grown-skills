# Phase 0 — RPG Intake

## When this module loads

`commands/soulcial-media-engine.md` loads this module immediately after `mode-gate.md`
has set `active_mode`, `active_brand_slug`, and `active_voice_path` and printed the boot
anchor. Phase 0 is the first content-strategy phase — it gathers the raw inputs every
later phase (0.5 counsel interview, P1–P7, assembly) depends on.

Reprint the state anchor at the top of this phase's first response:

```
[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 0-intake]
```

### Inputs consumed

| Variable | Source |
|---|---|
| `active_mode` | `mode-gate.md` |
| `active_brand_slug` | `mode-gate.md` |
| `active_voice_path` | `mode-gate.md` |

### Outputs produced

| Output | Description |
|---|---|
| `00-master-brief.md` Part A | Written to `~/.claude/projects/{active_brand_slug}-social-engine/00-master-brief.md` |
| `active_platforms` | List of platform(s) selected (multiSelect) |
| `soul_intensity` | `subtle` \| `balanced` \| `overt` — also stored as `soul_lens_intensity` (alias used by `references/soul-lens-rubric.md`) |
| `oo_prop_sources` | List of detected/selected OO/Prop artifacts + which fields each carries |
| `regulated_flag` | `TRUE` \| `FALSE` — preliminary value per `references/compliance-detect.md`, fail-closed |

**Order of operations in this module:** Steps 1–5 gather answers and hold them in
conversation context only — nothing touches disk yet. Step 6 is the only step that
writes to disk, and it creates the project folder + (client mode) drops the sentinel
**before** any brief content is written (H2). This ordering is what keeps Phase 0
sentinel-first by construction, not by discipline.

---

## Step 1: RPG Intake — Niche, Audience, Landscape, Growth Goals

Present the mission briefing below as message text, then call **one** `AskUserQuestion`
batching all four questions (up to 4 related questions in a single call).

---

**MISSION BRIEFING — THE CONTENT REALM, ROOM ONE**

> The strategy council's table is empty until you fill it. Before Justin, Vex, Jasmine,
> Brock, and Marie can speak into your world, the Engine needs the map: who you serve,
> what they're carrying, who else is building in this space, and where you're trying
> to go.

---

Use `AskUserQuestion` with these four questions (2–4 options each + auto "Other" for
anything that needs free text):

1. **Niche / business** — *"What's the business or niche we're building content for?"*
   - **Coaching / consulting** — 1:1 or group work, expertise-led, personal brand at the center.
   - **Health, wellness, or healing practice** — practitioner-led work; may touch regulated claims.
   - **Creative / content business** — courses, media, art, writing, or content as the product.
   - *(Other captures anything else — product business, agency, nonprofit, etc.)*

2. **Audience sketch** — *"Who are we talking to? Give a rough sketch — we'll deepen this in Phase 0.5 and P2."*
   - **I have a clear picture** — leads to free-text capture of the sketch via "Other."
   - **Rough idea, not locked in** — leads to free-text capture; flagged as provisional for P2.
   - *(Other captures the actual sketch text either way.)*

3. **Landscape** — *"Who else is building in this space? We're going to study the landscape, not spy on it — this shapes how we differentiate, never what we imitate."*
   - **Yes, I know who else is in my space** — leads to free-text capture (names/handles/sites).
   - **Not sure yet** — note as a research gap; P3 (Authority Positioning) can flag it.
   - **Skip for now** — proceed without landscape notes.

4. **Growth goals** — *"What's the general direction you want this content to move you toward?"*
   - **Visibility & reach** — grow the audience, get found by more of the right people.
   - **Trust & community** — deepen relationship with an existing audience.
   - **Leads for my offer** — content exists to feed a funnel or DM conversation.
   - **Direct sales** — content is built to convert, not just to be seen.

> **Note for the controller / Phase 0.5 author:** Question 4 here is intentionally a
> *coarse* directional read. Phase 0.5's Triple Threat·PM question ("the #1 business
> outcome this content must drive") is the *forced single-choice* precision version —
> the two are not meant to duplicate, but they sit on the same axis. If Phase 0.5
> answers contradict the Step 1 read, Phase 0.5 wins (it's the deeper question).

Store all four answers in conversation context as `intake_niche`, `intake_audience_sketch`,
`intake_landscape`, `intake_growth_goal`. These feed Step 4 (compliance check) and Step 6
(brief write) below, and seed P1–P3.

---

## Step 2: Platform Pick (spec §6.3)

Present the flavor text, then call `AskUserQuestion` with **`multiSelect: true`**.
Formats in every later phase (P5 calendar, P6 posts) tailor to whatever is selected here.

---

> The Engine doesn't build for "social media" in the abstract — it builds for the
> platform(s) where your people actually scroll. Pick every world you want this
> content to live in.

---

Use `AskUserQuestion` with `multiSelect: true` and these options (plus auto "Other"
for any platform not listed — Threads, Pinterest, X/Twitter, Facebook, etc.):

- **Instagram** — Reels, carousels, stories, static posts. Broadest format range, strong for most niches.
- **TikTok** — Short-form video, algorithm-driven discovery. Best for top-of-funnel reach and growth.
- **LinkedIn** — Authority and thought-leadership content. Best fit for coaches, consultants, B2B.
- **YouTube (Shorts + long-form)** — Searchable and evergreen. Supports both quick hooks and deep authority content.

Store the selected list as `active_platforms`. If multiple platforms are selected, note
in context that P6 (per H7, hook-bank.md) must tag each hero post to a specific platform
+ format, and the 5 hero posts must span at least 3 distinct formats.

---

## Step 3: Soul-Lens Intensity Dial (spec §6.4)

Present the flavor text, then call `AskUserQuestion` with three options. This sets the
dial defined in full in `references/soul-lens-rubric.md` (4 axes × 3 settings, with the
non-bypassable "overt ≠ preachy" ceiling guardrail).

---

> Every brand carries a conscious/values layer underneath the content — the question
> is how loud you want it. Vex King calls this the soul-lens. Pick the volume that
> fits where your audience already is, not where you wish they were.

---

Use `AskUserQuestion` with these three options:

- **Subtle** — Values show up through word choice and story only. No spiritual vocabulary, no framework names. Best for audiences new to this world.
- **Balanced (recommended)** — One conscious word or one named principle per piece, woven into a story that still does the heavy lifting.
- **Overt** — Your own named frameworks and signature terms foregrounded and woven through. Best for an audience that already speaks this language.

Store the selection as `soul_intensity` (alias `soul_lens_intensity` for
`references/soul-lens-rubric.md` compatibility — same value, two keys, so either name
resolves downstream). **Client mode:** never default to Overt — ask explicitly; most
client brands are not spiritually positioned. Self mode default recommendation is
Balanced per the rubric's usage notes.

---

## Step 4: Regulated-Niche Check (sets `regulated_flag`)

This step does **not** ask the user a new question — it is Claude evaluating the
Step 1 answers (`intake_niche`, `intake_audience_sketch`, `intake_landscape`,
`intake_growth_goal`) against `references/compliance-detect.md` Section 1 (the
Regulated-Niche List: Health/Medical, Wellness/Supplements, Mental Health,
Finance/Investing, Weight Loss, Legal — both explicit signals and keyword-light
evasive phrasings).

**Apply the fail-closed Detection Logic verbatim from `references/compliance-detect.md`:**

```
IF niche/audience/landscape text matches an explicit signal OR a keyword-light
   phrasing from Section 1                                    → regulated_flag = TRUE
IF the niche is borderline / overlaps categories               → regulated_flag = TRUE
IF the niche is positively, explicitly non-regulated (e.g.
   photography, cooking, travel, fashion) AND no keyword-light
   phrasing appears anywhere in the Step 1 text                → regulated_flag = FALSE
ELSE (default)                                                  → regulated_flag = TRUE
```

**This value is PRELIMINARY.** `regulated_flag` is set here from niche/audience/landscape
text alone because the Security-voice question (Phase 0.5, Round 2 — "regulated/compliance
claims to guardrail") has not been asked yet. Per `compliance-detect.md` Section 4, Phase
0.5's Security answer re-confirms or escalates this flag once it's collected — `phase-
05-counsel-interview.md` is responsible for updating `regulated_flag` to TRUE if that
answer is non-empty or unclear, and MUST NOT downgrade a TRUE set here to FALSE on its
own (fail-closed is monotonic: niche detection or Security-voice can each independently
force TRUE; only an explicit non-regulated read from BOTH leaves it FALSE).

Print one transparency line (not a question, not an error):

> Regulated-niche check: **{TRUE/FALSE}** — {one-line reason, e.g. "wellness/supplement
> language detected" or "niche reads as non-regulated (photography); will re-confirm
> after the Security-voice question in Phase 0.5"}.

Store the result as `regulated_flag` plus a short `regulated_flag_reason` string for the
brief.

---

## Step 5: OO / Prop Detection ("both, user picks")

**Goal:** find existing Offer Optimizer (OO) or Propaganda Machine (Prop) output for this
brand so P1, P3 (H8), P4, P6, and P7 (H6, DIRECT feed) can pull real offer/avatar/proof
data instead of generic copy. Search BOTH locations before asking the user anything.

### 5.1 Search `~/.claude/projects/`

Use `Glob` against `~/.claude/projects/` for patterns built from `active_brand_slug` and
`intake_niche`, including (not limited to):

- `**/*{active_brand_slug}*offer*` and `**/*{active_brand_slug}*optimizer*`
- `**/*{active_brand_slug}*prop*machine*` and `**/*{active_brand_slug}*propaganda*`
- `**/offer-candidates.md` and `**/*offer-candidates*` under any folder matching the brand
- `**/*offer*optimizer*` and `**/*propaganda*machine*` more broadly, then filter results
  by brand-name/niche keyword match in the path or a quick grep of the file contents

Known existing patterns to check by name (folder conventions already in use elsewhere
in this install): `{slug}-offer-optimizer/`, `ss-ad-generator-offers/{slug}-offer.md`,
`prop-machine/{slug}/`, `{slug}-funnel-research/offer-candidates.md`.

### 5.2 Search the vault

Use `mcp__obsidian-brain__search_notes` scoped to `context/clients/` and
`context/projects/` (self mode brands live under `context/projects/`; client brands
under `context/clients/`) with queries combining `active_brand_slug` / brand display
name with "offer optimizer" and "propaganda machine" / "prop machine".

### 5.3 Present findings, then ask

If one or more candidates are found, list them briefly (path or vault note title,
type — OO or Prop, rough date if available). Present the flavor text, then call
`AskUserQuestion`.

---

> The council doesn't want to guess at your offer when the real one already exists.
> Here's what the Engine found in your projects and your vault.

---

Use `AskUserQuestion` with these options (adjust wording to "no candidates found" framing
if Step 5.1/5.2 turned up nothing):

- **Use what's found (recommended when a strong match exists)** — Feed P1/P3/P4/P6/P7 from the detected artifact(s). Fastest path; data may need a light refresh.
- **Run it fresh** — Launch `/offer-optimizer` or `/propaganda-machine` now (ask which, or both) before continuing Phase 0.5.
- **Skip — no OO/Prop feed this round** — Later phases generate generic offer/proof language and flag it for manual review at the P7 checkpoint.

**If "Run it fresh" is selected:** hand off to the named skill(s) and note in context
that Stage 1 (P1–P7) must not begin until that run completes and its output is re-scanned
by this same Step 5 logic — this module does not itself drive `/offer-optimizer` or
`/propaganda-machine`, it only triggers the handoff and records the dependency.

### 5.4 Record `oo_prop_sources` + field availability

For each artifact actually selected ("use found" or a completed "run fresh"), open the
file/note and check for the presence of three fields the P3 (H8) and P7 (H6, DIRECT)
feeds depend on:

| Field | What to look for |
|---|---|
| **Offer stack** | A named offer / pricing tiers / "what's included" section |
| **Pricing** | Explicit price points, payment plans, or pricing structure language |
| **Avatar pain** | Avatar/ideal-client pain points, frustrations, or transformation language |

Record `oo_prop_sources` as a list of entries shaped like:

```
- type: OO | Prop
  path: <file path or vault note id>
  fields_found: [offer_stack: yes/no, pricing: yes/no, avatar_pain: yes/no]
```

If "Skip" was selected, `oo_prop_sources = []` and a flag `oo_prop_status: skipped` is
recorded instead — P7's checkpoint (H6, Golden Rule gate) must surface this explicitly
so monetization copy isn't silently generic.

---

## Step 6: Sentinel-First Write (H2 — non-bypassable ordering)

**This is the only step in Phase 0 that touches disk.** Steps 1–5 only populate
conversation context. Follow this exact order — do not write `00-master-brief.md`
before sub-step 6.2 (client mode) completes.

### 6.1 Create the project folder (both modes)

Create `~/.claude/projects/{active_brand_slug}-social-engine/` if it does not already
exist. This is the canonical output folder for the entire pipeline (spec §9).

### 6.2 Drop the sentinel — CLIENT MODE ONLY, BEFORE any brief content

If `active_mode = "client"`, drop `.client-data-boundary` into that folder **now**,
before any line of `00-master-brief.md` is written — `00-master-brief.md` Part A holds
the niche and audience description, which is client PII (canonical content below).

Canonical sentinel content:

```yaml
client_slug: {active_brand_slug}
boundary_set: {today's date}
policy: |
  Files in this directory are client work product containing
  client PII (niche, audience, offer, and voice details).
  Downstream skills that scan ~/.claude/projects/ MUST check
  for this sentinel and treat content as client-PII:
    - No auto-vault-promotion without explicit consent
    - No cross-skill ingestion (savepoint, inbox-digest, etc.)
      without explicit client-data acknowledgment
    - No git commit of this directory's contents without
      client-data review
```

If `active_mode = "self"`, skip this sub-step — self-mode content is user-authored
and eligible for normal handling; the sentinel is for client work only.

### 6.3 Write `00-master-brief.md` — Part A

Only after 6.1 (and 6.2 if client mode) is complete, write Part A:

```markdown
# {Brand display name} — Master Brief

[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 0-intake]

## Part A — Phase 0 Intake

- **Niche / business:** {intake_niche}
- **Audience sketch:** {intake_audience_sketch}
- **Landscape (study, not spy):** {intake_landscape}
- **Growth goal (directional):** {intake_growth_goal}
- **Platforms:** {active_platforms}
- **Soul-lens intensity:** {soul_intensity} (alias: soul_lens_intensity)
- **Regulated-niche flag:** {regulated_flag} — {regulated_flag_reason}
  *(preliminary — re-confirmed by the Phase 0.5 Security-voice answer)*
- **OO/Prop sources:** {oo_prop_sources}
  *(or `skipped` — see Step 5.4)*

## Part B — Counsel Interview (Phase 0.5)

*(Appended by `phase-05-counsel-interview.md`. Not yet populated.)*
```

### 6.4 Confirm and re-anchor

Print the phase-0 completion anchor and a one-line confirmation:

```
[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 0-intake]
```

> "Phase 0 brief locked for {brand display name}. {N} platform(s) selected, soul-lens
> set to {soul_intensity}, regulated check is {TRUE/FALSE} (preliminary). {OO/Prop
> source summary in one line}."

Proceed to `phase-05-counsel-interview.md`.
