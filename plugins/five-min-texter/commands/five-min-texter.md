---
description: Stand up your SimplePractice → 5-minute SMS responder. Interviews you for exact form/fit (voice, FAQ, crisis copy, hours), then walks you through n8n Cloud + Twilio + A2P setup using the pre-built engine.
---

# 📲 The 5-Minute Texter — Setup Wizard

You run this once. It does two jobs, in order:

- **Job A — The Intake** (form & fit): a guided interview, with the build counsel in the room, that
  captures *your* voice, FAQs, crisis copy, and hours — and writes them into the engine's placeholders.
- **Job B — The Setup**: a hand-held, best-practice walkthrough to stand up n8n Cloud + Twilio + A2P
  10DLC, import the pre-built workflow, test it, and go live in draft-and-approve mode.

> 🛡️ **Non-negotiables are locked.** The crisis interceptor, no-echo mindful handling, FAQ scope
> fence, TCPA reply-only rule, HMAC signature check, and kill switch passed a council review — each
> labeled by enforcement layer (engine, build-day, runbook, or deferred) in
> `references/nsa-non-negotiables.md`. The interview fills blanks; it never removes a guardrail.

> ⚠️ **READ THIS FIRST — surface it verbatim in the greeting and require acknowledgment before Phase 1.**
> This tool is **not a crisis service and not a clinical instrument.** It screens inbound texts for crisis
> language with a best-effort keyword + LLM filter and hands anyone in distress the 988 / 741741 / 911
> copy — but it is **not a substitute for emergency services or professional care**, it can miss signals,
> and you (the practitioner) are responsible for your deployment. The crisis screen is the deterministic
> default in the shipped workflow and this wizard **never offers to remove it.** Provided **as-is**; by
> continuing you accept responsibility for how you run it. Do not proceed until the operator acknowledges this.

**Global rules for this skill:** every interview round uses **AskUserQuestion** (2–4 options; RPG
narrative ABOVE the call, never inside an option). Confirm-before-advance on every Setup step. Update
`.texter-progress.json` after each phase. Verify-live discipline on all A2P fees/flows.

> **Paths (run from the SKILL ROOT):** this skill is run with the plugin folder as the working directory.
> All paths are skill-root-relative: `engine/…` = the engine folder (a sibling of `commands/` inside the
> plugin); `references/…` = the reference folder; `config.template.json` = at the skill root. The engine
> ships bundled inside the plugin, so `engine/…` resolves the same whether installed or run in place.

---

## PHASE 0 — Dashboard & Resume

Read `.texter-progress.json` (create it if absent). Render an ASCII status box:

```
┌─ 5-MINUTE TEXTER ─────────────┐
│ Intake   [done|in-progress|░] │
│ Setup    [done|in-progress|░] │
│ Live     [yes|░]              │
└───────────────────────────────┘
```

If a prior run exists → offer **Resume** vs **Start over** (AskUserQuestion). First run → greet the owner,
give the 60-second "here's what we're about to do," confirm he has ~45 min and his phone handy, then
enter Phase 1. Seat the counsel (`reference/counsel.md`).

**State the honest promise + its one failure mode + the timeline, out loud, in the greeting:**
- **The promise:** "When someone new texts you, they get a warm reply in your voice — target under 5
  minutes (the instant auto-ack is immediate; the real reply waits on your approval)."
- **The one failure mode:** "The 5-minute promise depends on **you** approving the draft quickly. If
  you're slow to approve, the prospect still got the instant acknowledgment — but the real reply is
  late. (The workflow itself re-pings you once at 15 minutes and flags the inquiry `awaiting-approval`
  in Airtable.)"
- **Time-to-live (set this expectation NOW so it isn't a letdown later):** "Today is ~45 minutes of
  setup with me. Going **live** depends on carrier approval (A2P 10DLC) — usually **a few days to a
  week**, out of our hands. We file it first thing so it's baking while we work."

**`.texter-progress.json` schema** (create on first run, update after each phase/step):
```json
{ "intake": "not-started|in-progress|done", "intake_last_round": 0,
  "setup": "not-started|in-progress|done", "setup_last_step": 0, "live": false }
```
On **Resume**: re-read `config.json` to skip already-captured rounds, and use `setup_last_step`
to land the owner back on the right Setup step (not a blind "Setup in-progress").

---

## PHASE 1 — Job A: The Intake Interview (form & fit)

RPG framing: the counsel is at the table; each round is an NPC briefing (persona mode, `reference/counsel.md`).
Run the **9 rounds (0–8)** from `reference/intake-questions.md`, **one AskUserQuestion per round** (Round 1
is free-text), in order:

0. **Where you are → where you're going** (whole counsel) → `automation{}` (current_state, target_state, graduation_gate) — strategic opener; sets the north star. Non-placeholder; feeds `automation-roadmap.md`
1. **Identity & alert channel** (Riley) → `practice_name`, `owner_first`, `booking_link`, `owner_cell_e164` — the load-bearing identity values; capture FIRST so nothing renders empty
2. **Business identity / A2P fork** (Greg) → `a2p.*`
3. **Voice DNA** (Cole) → `voice_dna{}`; **ask the reuse gate FIRST** (paste / find-it-for-me via a local voice profile if present / build fresh → `/voice-dna-blueprint-builder` then inline fallback); run the "sounds like me" sample-draft gate on every path
4. **FAQ capture** (Cole) → `faq{}`; enforce the billboard rule
5. **Crisis copy approval** (Greg) → read CRISIS_COPY verbatim, get explicit sign-off → `crisis.approved`. **HARD GATE — un-skippable:** the wizard cannot advance to Phase 2 without an explicit acknowledgment of the crisis copy; there is no default, no auto-approve, no skip.
6. **Reply spine + auto-ack** (Jono) → approve verbatim spine/ack
7. **Categories + quiet hours** (Riley) → `categories[]`, `quiet_hours`, `_timezone`
8. **Tone band** (Cole) → `tone_band_default`

**Output of Phase 1:**
- Write `config.json` from the captured values (copy `config.template.json`, fill it) — including the Round 0 `automation{}` block.
- Assemble `faq{}` → `{{FAQ_TEXT}}` and `voice_dna{}` → `{{VOICE_DNA_BLOCK}}`; fill the engine placeholder
  files (`faq-template.md`, `message-spine.md`, `crisis-canned-copy.md`, `bot-brain.CLAUDE.md`).
- Run **`node engine/lib/config-check.js --content`** → must print **OK**. This asserts every
  interview-captured **placeholder** field is non-empty (a skipped round fails here, before Setup). The 5 live-only
  fields fill during Setup and are correctly allowed empty at this gate. *(The `automation{}` fields are
  non-placeholder and intentionally not checked — confirmed by the round flow, not config-check.)*
- **Generate `automation-roadmap.md`** (skill root, a per-practitioner OUTPUT — not a committed template) from the
  Round 0 answers + Round 7 categories: **Stage 1 — Launch** (draft-and-approve every reply; write his
  current-state baseline in as the success yardstick), **Stage 2 — Earned** (his graduation gate, made
  concrete and tied to the Step-8 test ladder + the live shadow period), **Stage 3 — Target** (his stated
  ceiling). Each transition gets an explicit gate; if his ceiling is "approve-only forever," say so and
  collapse Stages 2–3 to "stay at Stage 1 by choice." The engine does NOT change — this is the *plan* for
  graduating, never rungs built now.
- Show a clean one-screen summary of every captured value (+ the 3-stage roadmap). **Approval gate — do not
  start Phase 2 until the owner says go.**

---

## PHASE 2 — Job B: The Setup Walkthrough

Hand-held, one numbered step at a time, confirm-before-advance. Source = `reference/setup-walkthrough.md`.
**you drive the technical wiring; the owner pastes credentials + does the kill-switch.**

1. **n8n Cloud account** — "own your engine" framing
2. **Twilio account + number** — local 10DLC; 2FA; capture `twilio_from`
3. **A2P 10DLC registration** — Brand (EIN vs Sole-Prop per Round 2) → Campaign → link number. **Submit
   day-one — long pole.** Confirm live fees in-console.
4. **Credentials into n8n** — Twilio + Anthropic + Airtable into the vault (never in chat); `TWILIO_AUTH_TOKEN`
   env var; create the base + set `Messages.message_sid` UNIQUE; capture `airtable_base`
5. **Telegram approval channel** — BotFather bot + chat id (`owner_telegram_chat_id`); notifications ON
6. **Import Error Handler FIRST** (→ `error_workflow_id`), then the main workflow (→ `webhook_public_url`);
   run `node engine/lib/config-check.js --filled` → **OK** before anything fires
7. **Build-assist via n8n-MCP** (you) — reconcile typeVersions to his live n8n (launch gate j);
   re-validate the deployed graph; wire Airtable resourceMappers
8. **Test ladder** — recon · duplicate-replay · forced parse-fail · signature forgery · **crisis drill ×2** · Telegram round-trip
9. **Go live (draft-and-approve) + kill-switch rehearsal** — both launch gates green (Error Handler wired
   & firing; A2P APPROVED in-console). **the owner pauses/resumes solo — the handoff gate.**

**Approval gates in bold. Update `.texter-progress.json` after each step.**

---

## PHASE 3 — Handoff & Runbook

- Confirm/generate the 1-page `engine/runbook.md` (daily loop, 15-min approval SLA, away-mode, kill-switch,
  the build-day carry-forwards from the workflow `_meta`).
- Confirm `engine/architecture-diagram.html` matches the DEPLOYED workflow (Fidelity Principle — re-derive
  from the deployed JSON, never retrofit).
- Close with a real test inquiry buzzing the owner's phone. Final registry write: **Live ✅**.

---

## Guardrails this skill must honor (hard rules — never relax)

Pull the full list from `reference/nsa-non-negotiables.md` and treat as non-negotiable:
- **No auto-send in v1** — draft-and-approve only. Auto-send graduates per category later, reopening the disclosure gate — and that graduation is **planned, not hidden**: it's co-designed with the owner in Round 0 and written into `automation-roadmap.md` with explicit gates. v1 ships at Stage 1 (approve every reply) no matter what the roadmap targets.
- **Mindful handling** — auto-messages NEVER echo inquiry content.
- **Crisis copy is EXEMPT from any voice/humanization edit** — reword only via a Greg + Cole agent-mode review.
- **Verify-live** — A2P fees/flows change; always confirm in-console.
- **Secrets** — credential vault only, never in chat or this folder.
- **AskUserQuestion at every fork**; RPG narrative above the call, not inside it.
- **Config 1:1** — `config-check.js --content` must pass before the Phase-1→2 handoff (every interview
  field non-empty), and `config-check.js --filled` must pass before go-live (live-only fields filled too).
