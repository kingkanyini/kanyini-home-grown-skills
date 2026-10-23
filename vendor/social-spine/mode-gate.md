# Social Spine — Mode Gate (shared, canonical)

> The SINGLE mode-gate for all social work. Both the `-v2` social suite and `/soulcial-media-engine` carry this file at `references/social-spine/mode-gate.md` (resolved against this plugin's folder, `${CLAUDE_PLUGIN_ROOT}`). One gate = no drift.

Runs once per session (unless `switch mode`). Sets three session-scoped values every downstream module reads:

| Variable | Values |
|---|---|
| `active_mode` | `"self"` or `"client"` |
| `active_brand_slug` | kebab-case brand id (e.g. `my-podcast`, `acme-studio`) |
| `active_voice_path` | path to the active voice profile — resolved by `references/social-spine/voice.md` |

---

## State-anchor contract (shared)

Every major response reprints a state anchor verbatim. The **caller owns the engine prefix**; the FIELDS are shared and fixed:

```
[<Engine> · Mode: {mode} · Brand: {brand} · Step: {step} · Ethics: {pending|cleared} · MCP: {locked|armed}]
```

- `-v2` suite prefix = `Social-v2`. `/soulcial-media-engine` prefix = `Soulcial`.
- `Ethics` and `MCP` are **fail-closed**: default `pending` / `locked`. See `ethics-gate.md` (Ethics) and `post-scheduler-v2` (MCP).
- **Compaction recovery:** parse the last printed anchor for mode/brand/step. **Re-derive `Ethics→pending` and `MCP→locked` regardless of what the recovered anchor said** (a stale `cleared`/`armed` is never trusted after compaction). Re-derive `active_voice_path` via `voice.md`. **If recovered `Mode == client`, reload the card and re-derive `armFloor` from source via `client-card.md` BEFORE Ethics re-derives to pending** (the compliance floor must not ride the frozen anchor; the gate re-assembles `regulated_flag = armFloor || detect(finalCopy)` on the current copy). If no anchor found, re-run Step 1.

---

## Step 1: Mode picker (RPG framing)

Present the briefing as message text, then call `AskUserQuestion`:

> **THE CONTENT REALM** — Before the council assembles: *whose world are we building?*

- **Self Mode — My brands** — Your voice, your mission.
- **Client Mode — A client's brand** — Their voice, their world. A data-boundary sentinel drops on the first save.

Self → Step 2a. Client → Step 2b.

## Step 2a: Self branch
1. `active_mode = "self"`.
2. Brand sub-pick: if brand folders already exist under `~/.claude/projects/` (`*-posts/` or `*-social-engine/`), offer those brands via AskUserQuestion plus **New brand**. Otherwise ask for the brand name. Slugify → `active_brand_slug`.
3. Resolve `active_voice_path` via `voice.md` (self chain).
4. Print boot anchor with `Ethics: pending · MCP: locked`. Confirm: *"Self mode locked. Writing in your voice for [Brand]."* Proceed to the caller's next step.

## Step 2b: Client branch
1. Capture client name → slugify → `active_brand_slug`; `active_mode = "client"`.
   - **Load the card:** resolve `active_client_profile` (object) + derive `armFloor` (the compliance floor) via `client-card.md` (its compliance arm is the SOLE producer of `armFloor`). The final `regulated_flag = armFloor || detect(finalCopy)` is ASSEMBLED at the ethics gate where the final copy exists — ethics-gate consumes `armFloor` and never re-derives it. No card → `armFloor = false` (the gate falls back to `regulated_flag = detect(finalCopy)`).
2. Resolve `active_voice_path` via `voice.md` (client → `{slug}-social.md → {slug}-email.md → {slug}-voice.md`; if none, quick-capture 3 voice basics — how they talk, words they'd never use, one sample post they love — and set a working-context voice note).
3. **Sentinel-first contract (non-negotiable):** flag intent now; the actual `.client-data-boundary` sentinel drops **before the first disk write** in the brand's project folder (`~/.claude/projects/{slug}-social-engine/` or `{slug}-posts/`). All client artifacts (posts, `brand-context.md`, `publish-ledger.jsonl`, `post-ready-to-paste.txt`) live inside that folder: no auto-vault-promotion, no cross-skill ingestion, never `/quickshare`-exported.
4. Print boot anchor. Confirm: *"Client mode locked. Building for [client]. Content boundary active."* **When a card loaded, add a second line:** *"{card.name} loaded: palette · voice · {default_preset} default · assets · compliance(REGULATED). Boundary on."* — the literal token `compliance(REGULATED)` is printed whenever `regulated_flag` is armed and is asserted by the drift guard (`verify-compliance-arm.js`); a non-regulated card prints `compliance(open)` instead.

## Step 3: Mid-session `switch mode` / `status`
- `switch mode` (exact match at message start) → if mid-phase, confirm first ("Switching drops the current draft's state — continue?"), then re-run Step 1.
- `status` → re-derive and reprint the anchor. Never changes state.
