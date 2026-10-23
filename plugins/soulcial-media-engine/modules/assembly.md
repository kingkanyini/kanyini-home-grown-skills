# Assembly — Stage 3 (Brand Porting + Deliverables + Handoffs)

## When this module loads

`quality-gate.md` hands off here once the Stage 2 pass-bar reads PASS (zero open
`BLOCKER?: yes`, read-through approved, counsel XP logged). This module is **Stage 3**:
it takes the 7 APPROVED artifacts and turns them into the three branded deliverables
the user or the client actually opens — `MASTER.html`, `30-day-calendar.html`,
`scroll-posts.md` — porting the gold-standard ROLE tokens onto the active brand's colors
along the way ("roles port, hexes don't").

Reprint the state anchor at the top of this module's first response, and again before
each major sub-step (palette resolve, MASTER write, calendar write, posts write,
handoffs):

```
[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 9-assembly]
```

### Inputs consumed

| Variable | Source |
|---|---|
| `01-strategy.md` … `07-monetization.md` | `phases-1-7.md`, post-Stage-2 (read fresh from disk — Fidelity Principle) |
| `templates/gold-standard-sidebar.html`, `templates/calendar-template.html` | this plugin's `templates/` — read directly, never re-typed from memory |
| `references/compliance-detect.md` | claims-safe block source + FAIL-CLOSED rule |
| `references/hook-bank.md` | hook-type menu + format codes for `#posts` adcards |
| `active_mode`, `active_brand_slug` | `mode-gate.md` |
| `regulated_flag` | final value, resolved by `phase-05-counsel-interview.md` / re-confirmed by Stage 2's Security branch |
| `active_platforms`, `architect_posting_capacity`, `soul_intensity` | `00-master-brief.md` Parts A/B |
| `~/.claude/references/brand-registry.json` (optional) | brand color source — self = `brands.{active_brand_slug}` if the file and entry exist with non-null colors, else ask the user once (see Step 1.1); client = client card palette → `brands.{slug}` → ask (see Step 1.2) |
| `~/.claude/references/social-spine/clients/{active_brand_slug}.md` (optional, client mode) | client card palette, loaded per `references/social-spine/client-card.md` (see Step 1.2) |

### Outputs produced

| Output | Path |
|---|---|
| `MASTER.html` | `~/.claude/projects/{active_brand_slug}-social-engine/MASTER.html` |
| `30-day-calendar.html` | `~/.claude/projects/{active_brand_slug}-social-engine/30-day-calendar.html` |
| `scroll-posts.md` | `~/.claude/projects/{active_brand_slug}-social-engine/scroll-posts.md` |
| `.client-data-boundary` | verified present (client mode) — not re-dropped, see Step 5 |
| Export bundle (on request) | via `/quickshare`, scrubbed per Step 7 |

---

## Step 1: Brand Palette Resolve

The two HTML templates ship brand-neutral with a `:root` ROLE token block (`--ink /
--leaf / --leaf-dk / --leaf-deepest / --sand / --gold / --clay / --mist / --line` +
`--sidew`) plus a set of functional state tokens (`--ok/--okbg`, `--mid/--midbg`,
`--warn/--warnbg`, `--bonus/--bonusbg`, `--gap/--gapbg`, `--danger/--dangerbg`). Per
each template's own header comment: **roles port, hexes don't.** This step resolves the
9 identity ROLE tokens onto the active brand. The 6 functional state tokens and
`--sidew` are **never** brand-overridden — they're UI semantics (pass/warn/gap/etc.),
not brand identity; leave them at the donor defaults in both templates.

### 1.1 Self mode → brand registry, else ask once

Self mode reads the brand's saved colors when they exist and asks the user once when
they don't.

1. Resolve `active_brand_slug` from `mode-gate.md`.
2. Look up `brands.{active_brand_slug}` in `~/.claude/references/brand-registry.json`.
3. **If the file exists, the entry exists, and its `colors` object has non-null
   values** → use THOSE colors as the ROLE-token source for Step 1.3. If the entry also
   carries its own `extended_palette`, resolve `--clay` from that per Step 1.3; if it
   doesn't, `--clay` falls back to that same brand's own `accent` value, per Step 1.3's
   fallback rule — never borrow another brand's `extended_palette` for this brand's
   deliverable.
4. **Otherwise ask once** — when any of these hold: the registry file doesn't exist, no
   `brands.{active_brand_slug}` entry exists, or the entry's `colors` are null
   placeholders. Run the palette ask in Step 1.2a.

The registry lookup is mechanical, not a judgment call — when the entry has colors, do
not ask which palette to use. Step 1.3's resolution table and the "roles port, hexes
don't" contract apply identically no matter which source won this step — every ROLE
token, **including `--leaf-deepest`**, is overridden from whichever source was selected
here.

### 1.2 Client mode → client card, then registry, then ask

Resolve the client's colors in this order and stop at the first source that has them:

1. **Client card palette.** Load the card per `references/social-spine/client-card.md`
   (its `SLUG_RE` traversal guard and wrapped parse apply —
   `~/.claude/references/social-spine/clients/{active_brand_slug}.md`). If the card
   loaded and its `palette` map has usable hex values, map its keys onto the registry's
   5-key schema by name (schema-by-discovery — read the shape the card carries). A
   missing, unparseable, or malformed `palette` means this source is skipped, never that
   the build stops.
2. **Brand registry.** Look up `active_brand_slug` (or the client display name) against
   the `brands` map in `~/.claude/references/brand-registry.json`, if that file exists.
3. **Ask.** Neither source has colors → run the palette ask in Step 1.2a.

**If step 1 or 2 found colors:** present the detect-and-confirm mapping (Section 1.3
table, filled with the found hexes) via `AskUserQuestion`:
- **Use this palette (Recommended)** — lock it in, proceed to build.
- **These colors are wrong / outdated** — collect corrected hex codes via "Other" free
  text, then re-run the mapping.

### 1.2a Palette ask (shared by self and client mode)

Ask once per build via `AskUserQuestion`:
- **I have brand hex codes** — free-text capture via "Other": primary, accent,
  background, plus an optional warm contrast tone for `--clay`. If the user already has
  all 5 registry keys (dark_primary, light_primary, highlight, accent, light_secondary),
  take those directly instead.
- **Use neutral gold-standard defaults for now** — skip brand porting this round; ship
  with the donor template's own default greens/golds (already baked into the `:root`
  block) and flag in the deliverable footer that brand colors are pending.

Map the 3 asked colors onto the registry's 5-key schema so Step 1.3's table works
unchanged:

| Asked color | Registry key | Note |
|---|---|---|
| background | `light_primary` | page background |
| primary | `light_secondary` | primary brand color |
| accent | `highlight` | CTA/highlight tone |
| (derived) | `accent` | primary darkened ~20-25% — the darker-tier brand tone |
| (derived) | `dark_primary` | near-black tinted toward primary — body text |
| warm contrast tone (optional) | `extended_palette` warm tone | feeds `--clay`; if skipped, `--clay` falls back to `accent` per Step 1.3 |

If hex codes were collected fresh, offer (don't auto-do) to save them as a new
`brands.{active_brand_slug}` entry in `~/.claude/references/brand-registry.json` (create
the file if it doesn't exist) for reuse on the next build. Write only on the user's
explicit yes — a registry write is the user's decision, never an automatic side effect.

### 1.3 ROLE token resolution table

Maps the registry's 5-key schema (+ optional `extended_palette`) onto the 9 ROLE tokens
both templates share:

| ROLE token | Resolved from | Notes |
|---|---|---|
| `--sand` | `light_primary` | page background |
| `--ink` | `dark_primary` | body text |
| `--leaf` | `light_secondary` | primary brand color — CTA/badges/links/nav-active-border |
| `--leaf-dk` | `accent` | darker-tier brand tone — headers, `h2.sec`, label text |
| `--leaf-deepest` | `dark_primary` (reused) | darkest available brand tone — sidebar gradient terminus. The registry schema has no separate "deepest" field; reusing `dark_primary` keeps the sidebar gradient (`--leaf-dk` → `--leaf-deepest`) reading as a real dark-to-darker ramp instead of inventing an unsourced hex. |
| `--gold` | `highlight` | accent/CTA/highlight — offer bar, compliance border, pill `.n` |
| `--clay` | `extended_palette`'s warm/contrast tone (e.g. a brand's `ember` or `rust`) if present, else `accent` | secondary warm accent — Reel format badge, format-code variant |
| `--mist` | derived: lighten/desaturate `light_primary` ~3-5% toward white | subtle tinted surface — week-head bg, pill hover, sidebar bg tint |
| `--line` | derived: blend `light_primary` ~80% / `dark_primary` ~20% | border/divider |

`--mist` and `--line` have no direct registry field — they're derived because the
donor's role is "a slightly different shade of the page background," not a brand
identity color in its own right. When in doubt, pick a literal hex that visually reads
as "a shade between `--sand` and `--ink`" rather than leaving the formula unresolved.

### 1.4 Worked example — Northwind Studio (fictional brand, registry entry found)

Registry entry `brands.northwind-studio`: `light_primary #F4F1EA`, `dark_primary
#1C2230`, `light_secondary #3E6A8A`, `accent #2B4C66`, `highlight #D4A437`, and an
`extended_palette` warm tone `ember #C8643B`.

```css
:root{
  --ink:#1C2230;--leaf:#3E6A8A;--leaf-dk:#2B4C66;--leaf-deepest:#1C2230;--sand:#F4F1EA;
  --gold:#D4A437;--clay:#C8643B;--mist:#F9F7F2;--line:#C9C8C5;
  /* state tokens + --sidew unchanged from donor default — see header note above */
}
```

When the colors came from a client card or from the Step 1.2a ask instead, run the
identical `:root` override mechanics with those hexes in place of the ones above — the
table and override mechanism don't change, only the source values do.

This is a first-pass mapping per the table above, not a hand-tuned design — the user's
read-through of the rendered HTML (see "Closing this module" below) is the real
aesthetic gate, not any automated score. If a rendered page doesn't read as on-brand,
adjust the hex assignment, don't re-litigate the mapping table.

### 1.5 Apply to both templates

Override the `:root` block in **both** `gold-standard-sidebar.html`'s copy (becomes
`MASTER.html`) and `calendar-template.html`'s copy (becomes `30-day-calendar.html`) with
the same resolved values — the calendar template's own header comment says "keep in
sync," and a brand mismatch between the two deliverables is a visible defect.

---

## Step 2: Populate `MASTER.html`

### 2.1 Create the working copy

Read `templates/gold-standard-sidebar.html` in full, write it to
`~/.claude/projects/{active_brand_slug}-social-engine/MASTER.html`, then apply the
Step 1.5 `:root` override. All further edits below happen on this output file, never on
the template source.

### 2.2 Header + meta fill

| Placeholder | Source |
|---|---|
| `{{BRAND_NAME}}` | brand display name (Phase 0 / mode-gate) |
| `{{BRAND_TAGLINE}}` | `03-positioning.md` Positioning Statement (short form) |
| `{{PRIMARY_CTA_URL}}`, `{{PRIMARY_OFFER}}` | `07-monetization.md` Existing Offer |
| `{{PILLAR_COUNT}}` | count of pillars in `04-pillars.md` |
| `{{FORMAT_COUNT}}` | distinct formats named in `06-posts.md`'s Format Variety Check |
| `{{DAY_COUNT}}` | from `05-calendar.md` Density Note (30 default — see Step 3.7) |
| `{{PLATFORM_LIST}}` | `active_platforms`, joined |

### 2.3 Build `{{SIDEBAR_NAV}}`

Replace the `{{SIDEBAR_NAV}}` placeholder in `<nav class="nav">` with generated links
for all 7 sections, grouped exactly per the template's own commented-out stub (don't
invent a different grouping):

```html
<div class="navgroup">Strategy</div>
<a href="#strategy">Strategy Overview</a>
<a href="#audience">Audience</a>
<a href="#positioning">Positioning</a>
<a href="#pillars">Content Pillars</a>
<div class="navgroup">Execution</div>
<a href="#calendar">Calendar</a>
<a href="#posts">Posts</a>
<a href="#monetization">Monetization</a>
```

The `href` values must match the literal `<section id="…">` anchors in 2.4 exactly —
this is what the existing scroll-spy `<script>` block (unchanged from the donor) uses
to highlight the active link, so a mismatched id silently breaks nav highlighting.

### 2.4 Section anchor population (the 7 `<section id="…">` blocks)

| `<section id>` | Source artifact | What fills it |
|---|---|---|
| `strategy` | `01-strategy.md` | Content Direction → up to 3 `.pill` cards (format/strategic pillars); `.ladder` flow = Monetization Overview sketch + `07-monetization.md` Existing Offer |
| `audience` | `02-audience.md` | Frustrations/Desires/Fears + Daily Content Habits → Primary Audience `.sec-body`; only fill Secondary Audience if a distinct second segment surfaced in Messaging Angles — otherwise replace its stub-note with "Single-audience brand — no distinct secondary segment." |
| `positioning` | `03-positioning.md` | Positioning Statement + What Makes This Defensible → Unique Positioning Statement; 3 Core Beliefs to Shift, drawn from positioning + the laddered wounds in `02-audience.md` |
| `pillars` | `04-pillars.md` | The 5 Pillars → `.pill` cards (adapt grid count to the actual pillar count if not exactly 5); Belief-Architecture Sequencing → `.ladder` flow |
| `calendar` | `05-calendar.md` | One `.sec-body` per weekly arc (name + goal) — narrative summary only; see Step 2.6 for the required Batch Plan summary; full daily grid lives in `30-day-calendar.html`, not here |
| `posts` | `06-posts.md` | 5 hero posts → `.adcard` blocks, see Step 2.5 |
| `monetization` | `07-monetization.md` | Existing Offer / Content Angles / New Offer Ideas → `.tools` grid cards; Golden Rule Gate confirmation folds into the Minimum Viable Week `.note` |

### 2.5 `#posts` section — adcards + the missing CSS

The template's `#posts` section ships an `<!-- ADCARD CSS — supplied by the
assembly/hook-bank step (Task 4b/Task 10) -->` placeholder comment — **this module is
that step.** Insert the following CSS into `MASTER.html`'s existing `<style>` block
(append after the `.tools`/`.tool` rules, before `.note`) — do not open a second
`<style>` tag:

```css
.adcard{background:#fff;border:1px solid var(--line);border-radius:14px;padding:0;margin-bottom:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.04)}
.adcard .ahead{padding:18px 20px;border-bottom:1px solid var(--line);background:var(--mist)}
.adcard .ovl{font-weight:800;font-size:16px;color:var(--ink);margin-bottom:6px}
.adcard .ameta{font-size:11px;letter-spacing:.04em;color:#6b756d;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.adcard .fcode{display:inline-block;font-size:10px;font-weight:800;padding:3px 9px;border-radius:20px;letter-spacing:.04em;text-transform:uppercase}
.fc-contrarian{background:#fbe9e3;color:var(--clay)}
.fc-open-loop{background:#e7eef9;color:#2c5a8a}
.fc-callout{background:#e9f1ea;color:var(--leaf-dk)}
.fc-result{background:var(--okbg);color:var(--ok)}
.fc-confession{background:#efe7f5;color:#6b4a8a}
.adcard .adbody{padding:18px 20px;display:flex;flex-direction:column;gap:10px}
.adcard .beat{font-size:13px;color:#4a564e}
.adcard .blabel{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--gold);margin-bottom:3px}
.adcard .btext{font-size:13.5px;color:var(--ink)}
.adcard .beat.cta{background:var(--mist);border-radius:8px;padding:10px 12px;margin-top:4px}
.adcard .beat.cta .btext{color:var(--leaf-dk);font-weight:700}
```

**Format-code correction:** the template's stub note for this section lists generic
`DR/QO/WI/HW/SS` format codes — that labeling predates this skill's actual hook system
and does not match `references/hook-bank.md`'s real 6-type menu. **Replace that note
entirely** with the actual hook types used to draft `06-posts.md` (Contrarian Take,
Open Loop, Callout, Result-Reveal, Mistake/Confession — First-3-Words is a craft rule
applied inside the other 5, not its own badge per `hook-bank.md`). Map each to an
`.fcode` modifier class above (`fc-contrarian`, `fc-open-loop`, `fc-callout`,
`fc-result`, `fc-confession`).

For each of the 5 hero posts in `06-posts.md`, build one `.adcard`:
- `.ovl` = the hook line.
- `.ameta` = `.fcode` badge (hook type) + `AD {{n}} · {{pillar name}}` + platform (if
  `active_platforms` has more than one entry).
- `.adbody` beats: `06-posts.md`'s structure is hook → body → CTA (simpler than the
  donor's 6-beat `.beat` stub, which belongs to a different framework's proof-block
  shape). Populate only the beats that actually map — one `.beat` for the
  insight/body, one `.beat.cta` for the CTA — and add a `Proof + social` beat only if
  an OO/Prop proof block was fed into that post (per `counsel-mapping.md`'s P6 feed
  note). Do not invent beats the source artifact doesn't carry — Fidelity Principle.

### 2.6 Calendar section's Batch Plan summary (Justin re-gate requirement)

Per the brief's Step 2 re-gate note: the Batch Plan must be visible in the calendar
HTML *and* summarized in `MASTER.html` — not left as internal markdown only. Add one
`.note` block at the end of the `calendar` section's arc summaries:

```html
<div class="note">
  <b>Batch Plan (full detail in 30-day-calendar.html):</b> {{BATCH_SESSION_TITLE}} —
  {{BATCH_FORMAT_FOCUS}}, {{BATCH_ASSET_COUNT}} assets targeted,
  {{BATCH_TALENT_SETUP}}. {{BATCH_COVERS_N_WEEKS}} weeks of active post days covered.
</div>
```

Pull every value from `05-calendar.md`'s `## Batch Plan` section directly — this note
must reflect the same numbers as the full panel in `30-day-calendar.html` (Step 3.8),
never a separately-invented summary.

### 2.7 FAIL-CLOSED compliance block — full 4-step contract

Read `regulated_flag`'s final value from `00-master-brief.md` (Stage 2's Security
branch may have escalated it; it is monotonic — never downgraded back to FALSE by this
module). Apply the rule verbatim from `references/compliance-detect.md`:

> **Include the `.compliance` block when `regulated_flag = TRUE` OR the niche reads as
> ambiguous. Omit ONLY when the flag resolved to an explicit, confident FALSE with no
> borderline signal anywhere in the pipeline.**

When the block is included, this module implements the full 4-step contract from
`references/compliance-detect.md` §4 (Section 4 — "`assembly.md` (block-renderer)") —
not just the append-block step. Appending the static compliance note alone is **not**
sufficient; the cross-check-and-flag pass below is mandatory and runs first.

**Step 1 — Cross-check ALL draft copy against the Never-Say table.** Before finalizing
any deliverable, scan every piece of rendered copy this module ships against
`compliance-detect.md` Section 2's "Never Say" column for the detected category
(Health/Wellness, Finance, Legal, etc.). This is a scan of the actual rendered output,
not just the source artifact, and covers:
- Every post body in `06-posts.md`'s 5 hero posts (plus any expanded posts from Step
  4.3) as it lands in `scroll-posts.md`.
- Every `.adcard` beat text assembled in Step 2.5 — the `.ovl` hook line, the
  insight `.beat`, and the `.beat.cta` CTA text — since this is copy `MASTER.html`
  actually ships, distinct from the source markdown.
- Every hook line pulled from `05-calendar.md`'s Daily Grid into the calendar day
  cards (Step 3.3) and into `MASTER.html`'s `#calendar` arc summaries (Step 2.4).

**Step 2 — Replace matches with `[COMPLIANCE EDIT]`.** Any phrase matching, or closely
paraphrasing, a "Never Say" row from `compliance-detect.md` §2 gets swapped inline for
that row's "Say Instead" alternative, with the edited line tagged with a trailing
`[COMPLIANCE EDIT]` marker so the user can spot every touched line on read-through. Do
not smooth the copy silently — the flag is the audit trail, and it ships in the
working copy (strip it only as part of Step 7's export scrub if a flagged line
survives all the way to an exported deliverable).

**Step 3 — Append the Section 3 compliance block.** Populate `.claims .never` /
`.claims .say` from `compliance-detect.md` Section 2's rows matching the detected
category, fill the `.ctable` with 2-3 phrase-level rows from the same section,
`.hardrules` from a one-line synthesis, and append the literal Section 3 compliance
note (`⚖️ COMPLIANCE NOTE`, reproduced verbatim, with the regulated-flag reason filled
in) immediately after the `.compliance` div, inside `#positioning`.

**Step 4 — Never silently pass a Never-Say phrase.** Step 1's scan and Step 2's edit
are not optional even when Step 3's static block is already present — the block warns
the reader, it does not substitute for actually catching the phrase in the copy. If
Step 1 finds a match that traces back to a source artifact (`06-posts.md` or
`05-calendar.md`) rather than only the rendered deliverable, flag that source line to
the user in one line too, since the next build re-pulls from that same artifact
(Fidelity Principle) and would otherwise reintroduce the same Never-Say phrase.

**When omitted:** do not delete the `#positioning` anchor or leave it empty — replace
the `.compliance` div with a single short line: *"No regulated-claims guardrails
detected for this niche (regulated check: FALSE)."* The section must still render
non-empty content. (Steps 1/2/4's cross-check still doesn't hurt to run lightly even
when omitted, but is not required — the FAIL-CLOSED gate's asymmetry is about the
block's presence, not a mandatory scan on confidently non-regulated content.)

### 2.8 Cleanup pass (working-copy hygiene, separate from Step 7's export scrub)

Before considering `MASTER.html` done, strip every HTML authoring comment the template
ships for the assembler's eyes only — the `TOKEN ROLE MAP` header comment, every
`SECTION:` block comment, every `PILL TEMPLATE` / `ADCARD TEMPLATE` stub-comment, and
every `.stub-note` div whose content starts with "Assembly note:" or "Stub:". These are
scaffolding for *this* module, not content for the person reading the deliverable. This
is independent of Step 7 (which scrubs counsel names/scores/vault paths specifically
for `/quickshare` exports) — this pass runs on the working copy regardless of whether
it's ever exported.

### 2.9 Footer fill

Replace `{{BRAND_NAME}}` in the footer and confirm the generation date.

---

## Step 3: Populate `30-day-calendar.html`

### 3.1 Create the working copy

Read `templates/calendar-template.html` in full, write it to
`~/.claude/projects/{active_brand_slug}-social-engine/30-day-calendar.html`, apply the
same Step 1.5 `:root` override (kept in sync with `MASTER.html`).

### 3.2 Header + meta fill

Same brand vars as `MASTER.html` Step 2.2, plus `{{ARC_COUNT}}`,
`{{ACTIVE_POST_COUNT}}`, `{{OFF_DAY_COUNT}}`, `{{MEDIA_TYPE_COUNT}}` — all read directly
from `05-calendar.md`'s Density Note and Daily Grid.

### 3.3 Clone day cards from the two documented variants

`calendar-template.html` documents exactly two card shapes (search "DAY TEMPLATE" in
the file) — **ACTIVE POST** and **OFF-DAY**. For every day in `05-calendar.md`'s
approved Daily Grid, instantiate the matching variant and fill its placeholders from
that day's recorded fields (pillar, format, hook, angle, asset splice, per-day goal).
Never invent a third shape; never collapse an off-day into a thin active-post card.

### 3.4 Per-day goal chip (H10 — required, never silently omitted)

Every **ACTIVE POST** card's `.daygoal` chip must carry the exact goal value
(`dg-reach` / `dg-trust` / `dg-buy`) recorded for that day in `05-calendar.md`. If a day
in the source artifact is missing a goal value, that is a Stage 1 contract gap — flag it
to the user before assembly continues rather than defaulting silently to `reach`.

### 3.5 Capacity-driven density (H4 — exact match, no padding)

The count of ACTIVE POST vs. OFF-DAY cards in the rendered calendar must match
`05-calendar.md`'s Density Note exactly (`architect_posting_capacity` → N active posts
over the span). Do not pad toward "one post per day" and do not silently drop an
off-day to make the grid look fuller — the off-days are load-bearing capacity, not
filler.

### 3.6 Production gaps aggregation

While cloning day cards, collect every `s-gap` ("No footage") splice instance into the
`.gapbox` at the bottom of the file — list each as `{{GAP_N_TYPE}}` /
`{{GAP_N_DESCRIPTION}}`, sourced from the actual gap notes in `05-calendar.md`, not
placeholder text. `{{GAPS_NET_SUMMARY}}` is a one-line roll-up (how many gaps, rough
production load).

### 3.7 Default span + extend offer

Default span is **30 days** (the 4-week structure the template ships). After the
30-day build is complete, use `AskUserQuestion`:

- **Ship at 30 days (Recommended)** — lock as-is, proceed to Step 3.8.
- **Extend to 60 days** — clone 4 more week blocks at the same capacity ratio derived
  in 3.5 (do not re-ask posting capacity; re-derive density from the same ratio).
- **Extend to 90 days** — clone 8 more week blocks, same ratio.

If extended, re-derive `{{DAY_COUNT}}`, `{{ARC_COUNT}}`, `{{ACTIVE_POST_COUNT}}`,
`{{OFF_DAY_COUNT}}` for both this file and `MASTER.html`'s header meta — both
deliverables must report the same numbers.

### 3.8 Batch Plan panel — full version (`.batchplan`)

Populate every `.bp-item` (Format focus, Assets to capture, Talent/setup, Priority
assets, Product/stills, Reactive lane) directly from `05-calendar.md`'s `## Batch Plan`
section. This is the canonical, detailed version — `MASTER.html`'s Step 2.6 note is a
summary of these same numbers, never a separately-authored one.

### 3.9 Footer fill

Same as `MASTER.html`.

---

## Step 4: Write `scroll-posts.md`

### 4.1 5 hero posts, labeled

Read `06-posts.md`'s 5 approved hero posts. For each, carry forward — verbatim, not
re-derived — its tag block: **hook type** (one of `hook-bank.md`'s 6 named types),
**format** (Reel/carousel/static/story), and **platform** (when `active_platforms` has
more than one entry). This is the Fidelity Principle applied to a markdown deliverable:
the labels were already decided and approved at the P6 checkpoint and re-confirmed by
Stage 2's Brock Johnson review — don't relabel from scratch here.

### 4.2 Copy-paste-ready shape

Each post block is the hook line, body/insight, and CTA — ready to paste straight into
a scheduler or caption field, with the label line directly above it (not interleaved
inside the copy) and a small italicized production-note line below it for the user's own
QA reference (thumb-stop result, soul-lens setting):

```markdown
## Post 1 — {Hook type} · {Format}{ · Platform, if multi-platform} — Pillar: {pillar name}

{hook line}

{body / insight}

{CTA}

*(production note: thumb-stop {PASS}, soul-lens: {soul_intensity})*

---
```

Repeat for all 5. Write the file as:

```markdown
# {Brand display name} — Scroll Posts (5 Hero Posts)

[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 9-assembly]

{5 post blocks per the shape above}

## Want more?
This file ships 5 hero posts — one per content pillar, per the P6 design decision.
Ask to expand to more posts per pillar; new posts are generated under the same
hook-bank (H7) + format-variety + soul-lens (H5) + Humanization Pass rules as the
original 5.
```

### 4.3 Expand offer — actioned, not just printed

After writing the file, use `AskUserQuestion`:

- **Keep 5 hero posts (Recommended)** — done; proceed to Step 5.
- **Expand now** — free-text via "Other" for how many more / which pillars; generate
  the additional posts under the same P6 rules (hook-bank tagging, format-variety
  awareness, soul-lens application, AI-isms ban + Humanization Pass, thumb-stop test —
  a FAIL is still a blocker here, same as P6), append them to **both** `06-posts.md`
  (the source of truth — Fidelity Principle, don't let the two files drift) and
  `scroll-posts.md`.

---

## Step 5: Output folder + sentinel verification

### 5.1 Output folder

`~/.claude/projects/{active_brand_slug}-social-engine/` — already created at Phase 0
Step 6.1. Write all three deliverables here, alongside the existing 7 numbered
artifacts, `00-master-brief.md`, and `counsel-gate-notes.md`.

### 5.2 Client-mode sentinel check (H2 — verify, don't re-drop blindly)

If `active_mode = "client"`: before writing any deliverable, check that
`.client-data-boundary` already exists in the output folder (it should — Phase 0 Step
6.2 drops it before any brief content is written, sentinel-first by construction).

- **Present:** proceed normally.
- **Missing:** treat this as a Phase 0 contract violation, not a thing to silently
  paper over. Stop before writing any deliverable, flag it to the user in one line, then
  drop the sentinel now using the canonical content block from `phase-0-intake.md` Step
  6.2 before retrying. Never let client deliverables land in a folder without the
  boundary marker.

### 5.3 Self mode

No sentinel expected or dropped — self-mode content is the user's own and eligible for
normal handling. The boundary sentinel is for client work only; self mode should not
drop one.

---

## Step 6: Closing handoffs

### 6.1 Relevance gate — suggest only what actually applies

Don't blanket-offer all three downstream skills every time. Check each against this
build's actual content:

| Skill | Fires when |
|---|---|
| `/imaginator` *(optional separate skill, not in this marketplace — offer only if installed, else suggest the user's own image tool)* | `30-day-calendar.html`'s `.gapbox` flags missing visual assets, or `scroll-posts.md` posts are tagged static/carousel and need cover images |
| `/vsl-activator` | `07-monetization.md`'s offer ladder points at a webinar/VSL-style conversion mechanism, or Phase 0's `intake_growth_goal` was "Direct sales" |
| `/belief-shift-e-engine` | An email nurture/conversion layer is implied — `oo_prop_sources` includes a Propaganda Machine belief architecture, or `07-monetization.md` flags a need for offer follow-up beyond the social content itself |

Present only the matched skill(s) via `AskUserQuestion` (plain text if zero match — no
forced choice), each option a 1-2 sentence next step, plus an always-available **"No
handoff needed — I'm done here."**

### 6.2 Exported-build referral note

This closing step runs differently depending on context:

- **Internal use (your own session, not exported):** suggest matched skills plainly.
  No referral line — it's a non-sequitur when you already have the skills installed.
- **Exported build** (this closing happens as part of, or immediately before, a
  `/quickshare` hand-off to someone without your Claude Code setup): append, after
  each suggested downstream skill, the literal line:

  > "Don't have this skill? Ask whoever shared this deliverable with you."

---

## Step 7: (H3) Export scrub — SAFETY

This step runs whenever this build is sent through `/quickshare`. It is fail-closed,
same posture as the compliance gate (Step 2.7) — when in doubt, scrub it.

### 7.1 Ship ONLY these three files

- `MASTER.html`
- `30-day-calendar.html`
- `scroll-posts.md`

**NEVER include in an export bundle:**
- `00-master-brief.md`
- `counsel-gate-notes.md`
- the 7 numbered artifacts (`01-strategy.md` … `07-monetization.md`) — internal drafts,
  superseded by the deliverables
- `.client-data-boundary` — an internal sentinel, meaningless and inappropriate to ship
  to the recipient it's protecting data *from*

### 7.2 Strip from the 3 shipped files before export

- **Counsel real names/slugs** — Justin Welsh, Vex King, Brock Johnson, Jasmine Star,
  Marie Forleo, Marty Cagan, Greg Hogg, Troy Hunt, and any `kebab-slug` form of these.
  Replace with role-only language ("strategy lead," "compliance review") where the line
  must survive; delete the line entirely if it's pure internal-process noise.
- **Internal scores and gate language** — any `Score: N/10`, `BLOCKER?:`, `Thumb-stop
  check:`, `Soul-lens setting applied:` lines. These live in the working copies of
  `06-posts.md` / `scroll-posts.md`'s production-note line (Step 4.2) for the user's own
  QA — drop that entire production-note line in the exported copy of
  `scroll-posts.md`; it adds nothing for an external recipient and leaks internal
  process detail.
- **Vault paths** — any absolute home-folder path (a Windows drive-letter
  Users folder, `/Users/<name>/`, `/home/<name>/`), `vault_ref:`, or `context/` / `gous/` /
  `patterns/` / `principles/` reference.
- **Local config paths** — any `~/.claude/` path, including voice-profile paths
  (`~/.claude/references/voice-profiles/…`).
- **State anchor lines** — any `[Soulcial · Mode:... · Brand:... · Phase:...]` line
  (written into `scroll-posts.md` during build). Internal process label, not meant for
  client eyes — strip the entire line from the exported copy.

### 7.3 Procedure

Before invoking `/quickshare`: re-read all 3 shipped files and self-check against the
banned-string list in 7.2 (real names, `BLOCKER?`, `Score:`, `~/.claude`, `vault_ref`,
voice-profile path, `[Soulcial · Mode:...]` state anchor). Redact or rewrite any hit,
then re-check before handing off to `/quickshare`. Treat any uncertainty the same way
the compliance gate does — over-scrub rather than risk a leak; a removed-but-harmless
line costs nothing, a leaked counsel score or vault path costs trust.

---

## Closing this module

Once all three deliverables are written, the sentinel is verified (client mode), and
handoffs have been offered, print the closing anchor and a one-line confirmation:

```
[Soulcial · Mode: {active_mode} · Brand: {active_brand_slug} · Phase: 9-assembly]
```

> "Stage 3 assembly complete for {brand display name}. `MASTER.html`,
> `30-day-calendar.html` ({N}-day span), and `scroll-posts.md` ({5 or expanded count}
> posts) are live in `~/.claude/projects/{active_brand_slug}-social-engine/`. Brand
> palette: {self → {brand name} registry colors, or self → colors supplied this
> session / client → {brand name} (card, registry, or supplied) / neutral defaults,
> brand colors pending}. {Handoff summary in one line, or "No downstream handoff
> needed."}"

Present the rendered HTML structure (section list + brand palette swatch values) inline
for the user's read-through before calling the build fully done — this visual
confirmation, not the Stage 2 score, is the last word on whether the deliverable
actually looks right.
