# Intake Question Bank — Job A (form & fit)

Each round is delivered RPG-style with the counsel as NPCs (`counsel.md`), **one AskUserQuestion call
per round** (2–4 options each; "Other" is auto-added for free text). RPG narrative goes in the message
text ABOVE the AskUserQuestion call — never inside an option. This file holds the *questions + options*;
the skill command file holds the *flow*. Every captured value lands in `config.json`
(validated 1:1 by `engine/lib/config-check.js`).

> Pacing: confirm each round's capture back in one line before advancing. Keep options ≤25 words.

---

## Round 0 — Where You Are → Where You're Going  (NPC: whole counsel, strategic opener)
**Intent:** set the north star before capturing details — read how manual the owner's inquiry-handling is **today**, where you want it to **land**, and what would earn more automation. We stand up the simplest thing that works *now* (v1 = draft-and-approve, already built) and hand you a staged plan for automating as it proves out through testing. Writes the **non-placeholder** `automation{}` block (`current_state`, `target_state`, `graduation_gate`) to `config.json` — informational, NOT an engine placeholder, so `config-check` is unaffected. **This round leads on purpose** (framing); it writes no engine slot, so nothing renders empty if it's strategic-only.

**Q1 — current state:** "How do you handle a new inquiry today?"
- **Check email/SP when I can, reply by hand** — no system, best-effort
- **Reply fast, but it eats my day** — responsive but it's a tax on focus
- **Things slip** — I miss some, or I'm late enough that the lead cools
- **(Other)** — I have help (VA/assistant), or describe it

**Q2 — target ceiling:** "Where do you ultimately want this to land?"
- **Approve every reply, forever** — I want to stay in the loop on each one
- **Auto-send the easy stuff, approve the sensitive** — split by inquiry type
- **Mostly hands-off once I trust it** — I check in, it mostly runs
- **(Other)** — not sure yet, let's see how it feels

**Q3 — graduation trigger:** "What would make you comfortable letting it send on its own?"
- **A clean track record** — N approved drafts in a row with no edits
- **Time live** — a couple of weeks running clean
- **Specific categories only** — e.g. logistics/rescheduling; never a first emotional contact
- **(Other)** — stay approve-only, full stop

> Counsel framing (narrative): "Today we ship the version that takes the work off your plate *safely* — you approve every reply. Then we write down exactly what has to go right before we let any of it run on its own. You graduate it; it never graduates itself." The answers become `automation-roadmap.md` at the end of the intake.

---

## Round 1 — Identity & Alert Channel  (NPC: Nate Herk, warm-up)
**Intent:** capture the four core identity values the engine references everywhere. **These are load-bearing — every one is a live engine placeholder, so this round is not optional.** Writes `practice_name` (→ `{{PRACTICE_NAME}}`), `owner_first` (→ `{{OWNER_FIRST}}`), `booking_link` (→ `{{BOOKING_LINK}}`), `owner_cell_e164` (→ `{{OWNER_CELL_E164}}`, where every alert goes).

All free-text (no multiple-choice — these are facts only the owner has):
- **Practice name** — exactly as you want it to appear in texts (e.g. "Riverstone Wellness")
- **Your first name** — how you sign off (e.g. "Riley")
- **Booking link** — your SimplePractice shareable booking URL
- **Your cell, in full** — the number that should receive every alert (new-inquiry pings, crisis alerts, guard blocks). E.164, e.g. `+15095550142`. *(Often the same number you'll use for the A2P OTP in Round 2 — confirm.)*

> Why first: these four thread through the auto-ack, the reply spine, the crisis alert, and the bot's voice. Capturing them up front means nothing renders with an empty `{{PLACEHOLDER}}` later.

---

## Round 2 — Business Identity / A2P Fork  (NPC: Greg Hogg)
**Intent:** decide Standard (EIN) vs Sole-Proprietor (no-EIN) Twilio 10DLC path — it forks the whole setup. Writes `a2p.entity_type`.

**Q1.** "Do you have an EIN or a registered business entity?"
- **Yes — I have an EIN** → Standard Brand (higher throughput, smoother vetting)
- **No — it's just me, no EIN** → Sole-Proprietor Brand (OTP-verified, lower limits, fine for v1)
- **Not sure / need to check** → park as Sole-Prop, revisit before submitting

**Follow-ups (free-text, captured after the fork):** legal name (`a2p.legal_name`), business/mailing address (`a2p.business_address`), a mobile number that can receive an OTP (`a2p.mobile_for_otp`), and EIN if Standard (`a2p.ein`).

> Greg's note (surface in narrative): "A2P vetting is the long pole — days, not minutes. We file this on build-day morning so it's baking while we build."

---

## Round 3 — Voice DNA  (NPC: Cole Medin)
**Intent:** capture how you actually text so replies sound like you. Writes `voice_dna{}` (→ `{{VOICE_DNA_BLOCK}}`).

**Q0 — reuse gate (ask FIRST):** "Do you already have a voice profile / Voice DNA written up?"
- **Yes — I'll paste it** → ingest the pasted text, map it into `voice_dna{}` (cadence/warmth, sample phrasings, sign-off, avoid-list). Skip to the "sounds like me" gate.
- **Yes — find it for me** → best-effort: if a local `voice-profiles/` folder or a `/voice-dna-blueprint-builder` output exists, parse it down to the SMS-relevant fields and confirm each; then the "sounds like me" gate. **If no local profile is found (the common case on a fresh install), say so plainly and fall to "build it fresh" — never hard-fail and never require a vault.**
- **No / build it fresh** → if you want a proper pass, hand off to `/voice-dna-blueprint-builder`; otherwise run Q1/Q2 + the elicit step below.

> Cole's note (narrative): "If you've already bottled your voice somewhere, we don't redo it — we find it, trim it to what an SMS needs, and you confirm. Either way you sign off on a real sample before it's locked."

**Q1 — warmth/cadence (fresh path):** "When you text a new person who reached out, how do you usually sound?"
- **Warm & brief** — friendly, a few sentences, gets to the point
- **Warm & chatty** — more personal, a little longer, emoji-friendly
- **Calm & grounded** — gentle, unhurried, soft language
- **(Other)** — paste a real text you've sent

**Q2 — sign-off:** "How do you sign off a text?"
- **First name only** ("— Riley")
- **First name + practice** ("— Riley, Riverstone Wellness")
- **No sign-off** — just the message
- **(Other)** — type your exact sign-off

**Elicit (free-text, fresh path):** ask for **2–3 real texts** you've actually sent a prospect → store as `voice_dna.sample_phrasings`. Ask for 3 tone words (`voice_dna.tone_words`) and anything you'd never say (`voice_dna.avoid`).
**"Sounds like me" gate (ALL paths — paste, found, or fresh):** generate ONE sample draft from the captured/reused voice and ask you to approve/tune before locking. A reused profile is never trusted blind — it still earns one confirmation draft.

---

## Round 4 — FAQ Capture (the scope fence)  (NPC: Cole Medin)
**Intent:** closed-book FAQ — the ONLY facts the bot may state (billboard rule). Writes `faq{}` (→ `{{FAQ_TEXT}}`).

**Q1 — services (multiselect):** "What can the bot mention you offer?"
- 1:1 wellness coaching · Breathwork sessions · Group programs · Workshops/retreats · **(Other)**

**Q2 — rate visibility:** "Should the bot state pricing?"
- **Yes — a simple band** ("Sessions start at $X") → capture `faq.rate_band`
- **No — defer all pricing to me** → `rate_band` stays empty, bot routes pricing to the owner
- **(Other)**

**Free-text captures:** `faq.hours`, `faq.location`, `faq.insurance_stance` (e.g. "I don't bill insurance; superbill on request"). `faq.will_not_discuss` is pre-seeded with the hard fence — confirm + let you add.

> Cole's rule (narrative): "Same idea as the engine — make the unsafe data unreachable. Billboard test: if you wouldn't put it on a public billboard, it doesn't go in the FAQ. Everything sensitive routes to you, personally."

---

## Round 5 — Crisis Copy Approval  (NPC: Greg Hogg)  ⚠️ verbatim sign-off
**Intent:** read `engine/crisis-canned-copy.md` CRISIS_COPY **verbatim** and get explicit approval. Writes `crisis.approved` + optional `crisis.local_line`. **This is a HARD, un-skippable gate** — the wizard cannot advance to Setup without an explicit acknowledgment of the crisis copy; there is no default, no auto-approve, no skip. (Pairs with the not-a-crisis-service disclaimer surfaced in the greeting.)

Show the exact 988 / Crisis Text Line (741741) / 911 copy. Then:
**Q1.** "This is the message anyone in crisis gets, instantly, before anything else. Approve it?"
- **Approve as-is** → `crisis.approved = true`
- **Approve + add a local/regional crisis line** → also capture `crisis.local_line`
- **I want to change the wording** → flag for careful review (this copy is safety-critical; changes get a second look, and it stays EXEMPT from any "humanization")

> Hard rule (narrative, do not soften): crisis copy is never reworded for "voice." It exists to hand off to real help fast.

---

## Round 6 — Reply Spine + Auto-Ack  (NPC: Jono Catliff)
**Intent:** approve the fixed, content-free auto-ack (Decision #2) + the reply spine. These are read verbatim from `engine/message-spine.md` / `copy.js`.

**Q1 — auto-ack:** show `AUTO_ACK_COPY` filled with his practice name. "This goes out within seconds of any inbound (after the crisis screen). Approve?"
- **Approve as-is** · **Tweak the greeting** (capture edit) · **(Other)**

**Q2 — spine:** show the greeting/booking/sign-off/STOP spine. "Every drafted reply gets wrapped in this. Look right?"
- **Approve** · **Adjust booking line / sign-off** · **(Other)**

> Jono's gut-check (narrative): "The auto-ack buys you the goodwill while you get to the real reply. Honest value here is never-miss-a-lead, not hours saved."

---

## Round 7 — Categories + Quiet Hours  (NPC: Nate Herk)
**Intent:** inquiry categories + prospect-leg quiet window. Writes `categories[]`, `quiet_hours` (→ `{{QUIET_HOURS}}`), `_timezone`.

**Q1 — categories (multiselect):** "What kinds of inquiries come in?"
- New-client interest · Rescheduling/existing · Pricing/logistics · General questions · **(Other)**

**Q2 — quiet hours:** "When should the prospect-leg replies be allowed to send?" (crisis always bypasses)
- **8:00am–8:30pm (default)** · **9:00am–9:00pm** · **24/7 (no quiet window)** · **(Other)**

**Free-text:** timezone (`_timezone`, e.g. "America/Los_Angeles").

---

## Round 8 — Tone Band  (NPC: Cole Medin)
**Intent:** default tone band for the enum classifier (the writer never sees raw text). Writes `tone_band_default`.

**Q1.** "When in doubt, should replies lean gentle or upbeat?"
- **Gentle (recommended)** — soft, tender, for vulnerable first contacts (safest default)
- **Warm-light** — brighter, upbeat, for neutral/curious inquiries
- **(Other)**

> Cole's note (narrative): "The classifier picks per-message; this is just the fallback when it's unsure. Gentle fails safe."

---

**On completion:** write `config.json` (including the Round 0 `automation{}` block), assemble `faq{}`→`{{FAQ_TEXT}}` and `voice_dna{}`→`{{VOICE_DNA_BLOCK}}`, then run **`node engine/lib/config-check.js --content`** → must print **OK**. This is the real Phase-1 completeness gate: it asserts every interview-captured **placeholder** field is non-empty (incl. Round 1's identity values) while allowing the 5 live-only fields (twilio_from, airtable_base, webhook_public_url, telegram chat id, error_workflow_id) to fill later in Setup. *(The `automation{}` fields are non-placeholder and not checked here — the round's capture is confirmed by the skill flow, not config-check.)* If `--content` flags an empty field, a round was skipped — go back and capture it. **Then generate `automation-roadmap.md`** (kit root, a per-client OUTPUT) from the Round 0 answers + the Round 7 categories: Stage 1 = Launch (draft-and-approve, with his current-state baseline as the success yardstick), Stage 2 = Earned (his graduation gate, tied to the Step-8 test ladder + live shadow period), Stage 3 = his target ceiling — each transition with an explicit gate (if his ceiling is "approve-only forever," say so and collapse Stage 2/3). Finally show a clean one-screen summary of every captured value and get **explicit approval before Phase 2.**
