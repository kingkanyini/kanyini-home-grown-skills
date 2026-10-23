# Setup Walkthrough — Job B (best-practice, hand-held)

One numbered step at a time. **Confirm-before-advance.** Plain language for a non-technical user.
**Verify-live discipline:** A2P fees and console flows change — always have the owner confirm current
numbers/screens in the live console, never trust a number printed here.

> **Ownership split (locked):** **you drive** the technical wiring on build day (n8n-MCP import +
> validation, A2P submission, first live test). **the owner's solo bar** = pasting credentials into the
> n8n UI + performing pause/resume unassisted (Step 9). The skill is the interview + the leave-behind
> for re-runs. **Each step below is labeled 👤 (who drives) so the owner always knows whether a wall of
> technical detail is his job or just his to watch.**
>
> **What "chat" means (read once):** "Never paste secrets in chat" = never paste into **this Claude
> conversation**. The n8n credential fields, Telegram, and the Twilio/Airtable/Anthropic consoles are
> NOT "chat" — those are the **safe homes** where secrets belong. Secrets go in those, never here.

---

## Step 1 — n8n Cloud account
- Go to **n8n.cloud** → start a trial → create a workspace. Framing: *"This is your engine. You own
  it — not a rented seat in someone else's tool."*
- Plan note: the Starter tier (~$24–30/mo, confirm live) is enough for v1. It needs to support the
  **Wait** node (for Telegram approval) and **active workflows** — verify on the pricing page.
- Capture nothing secret here; just confirm the workspace exists.

## Step 2 — Twilio account + phone number
- Create a Twilio account (twilio.com). Turn on **2FA**.
- Buy **one local 10DLC number** (SMS-capable) in his area code. (Toll-free is a different A2P path —
  stick to local 10DLC for v1.)
- Where the keys live: **Account SID** + **Auth Token** on the Console dashboard. Do NOT copy them into
  chat — they go straight into n8n's credential vault in Step 4. The Auth Token also becomes the n8n
  **env var `TWILIO_AUTH_TOKEN`** (used by the signature-validation node).
- Capture `twilio_from` = the purchased number in E.164 (e.g. `+1509…`).

## Step 3 — A2P 10DLC registration  ⚠️ LONG POLE — submit FIRST, build in parallel
> 👤 **you drive this step live on the call.** the owner's only job: have your **legal name,
> business/mailing address, and a mobile that can receive a text** ready (from Round 1), and watch over
> his shoulder so you've seen it once. This is telecom compliance paperwork — it is not yours to learn solo.

- **Brand registration** — fork from Intake Round 1:
  - **Standard (has EIN):** enter legal name, EIN, address. Higher throughput, smoother vetting.
  - **Sole-Proprietor (no EIN):** the OTP-verified path — enter legal name + the mobile from Round 1,
    complete the OTP. Lower limits, fine for a solo practice.
- **Campaign registration:** use case = **customer care / conversational**. Mismatched samples are the
  #1 sole-prop rejection — so paste the **exact strings the engine sends** (don't compose new ones).
  The wizard surfaces these from the owner's Round 5 approval — paste verbatim:
  - **Sample 1 (auto-ack):** the approved `AUTO_ACK_COPY` with `{{PRACTICE_NAME}}`/`{{OWNER_FIRST}}` filled.
  - **Sample 2 (a reply):** a representative spine-wrapped reply (greeting + a line + booking link + sign-off).
  - **Opt-in description:** "Contacts text the practice's published number to inquire; they consent to a reply."
  - **Opt-out:** "Reply STOP to opt out." **Opt-in/HELP/STOP language must appear in the samples.**
- **Link the number** to the Messaging Service tied to the campaign.
- **Fees (CONFIRM LIVE in-console — do not trust these):** brand ~$4 one-time, campaign vetting ~$15
  one-time, ~$1.50–$10/mo + per-message carrier fees.
- **Timeline:** brand minutes–hours; campaign **hours to several business days** (sole-prop can bounce).
  **This is why we submit on build-day morning** and let it bake while we wire everything else.

## Step 4 — Credentials into n8n
> 👤 **Shared: the owner pastes the credentials (his keys, his hands); you sets the env var + builds
> the Airtable base.** the owner's part is simple copy-paste into n8n fields. The database setup is you's.

- **the owner:** in n8n, **Credentials → New** for **Twilio** (Account SID + Auth Token) and **Anthropic**
  (API key from console.anthropic.com). Type them straight into the n8n fields — **never into this Claude
  conversation** (that's the only "chat" the no-secrets rule means; the n8n field is the safe home).
- **you:** add the n8n **env var** `TWILIO_AUTH_TOKEN` (the *same* Auth Token, a second time —
  on purpose). Why twice: the **credential** lets n8n *talk to* Twilio; the **env var** lets the
  security node *confirm a message really came from Twilio* (signature check reads `$env.TWILIO_AUTH_TOKEN`).
  It's not a mistake — two jobs, two homes. (n8n: **Settings → Variables → New**, name it exactly `TWILIO_AUTH_TOKEN`.)
- **you:** create the **Airtable** credential (PAT) + the base `Front Desk` with the two tables from
  `engine/airtable-schema.md` (`Inquiries`, `Messages`). **Set `Messages.message_sid` to reject duplicates**
  so the system never texts someone twice by accident. *(Build-day note: Airtable has no native unique
  constraint — the real protection is the engine's write-the-id-before-sending guard; the field is a
  backstop. Prove it in the Step 8.2 duplicate-replay test, and confirm a collision exits quietly.)*
  Capture `airtable_base` = the base id (`app…`).
- 2FA on every account.

## Step 5 — Telegram approval channel (hard dependency on the owner)
> 👤 **the owner can do this one** — it's the most human of the technical steps (a phone app + a chat bot).
- Install **Telegram** on the owner's phone. In Telegram, message **@BotFather** → `/newbot` → name it
  ("Riley Front Desk") → BotFather replies with a **bot token**. **That token is a secret — copy it
  straight into the n8n Telegram credential field, never into this Claude conversation.**
- Get the owner's **chat id** (preferred method, no third-party bot): in n8n add a **Telegram Trigger**,
  hit **Listen**, send your bot any message → the trigger shows your chat id → capture
  `owner_telegram_chat_id`. (Fallback: message @get_id_bot — but make sure you message *your* bot, not BotFather.)
- **What if Telegram is down/unopened?** The draft waits at the Wait node; the prospect already got the
  instant auto-ack, so the 5-min promise is partially kept. At 15 min the workflow itself flags the
  inquiry `awaiting-approval` in Airtable, then sends **one** Telegram re-ping carrying the draft (that
  second wait is indefinite — a reply to the most-recent/live draft sends; still blank simply holds.
  Note: once the first ping times out the re-ping is the live one — replying to the dead first ping
  does nothing, which is why the owner's runbook just says "reply to the most recent draft"). One re-ping
  by design — a nudge, not a nag loop. Tell yourself: keep Telegram notifications ON.

## Step 6 — Import the engine + Error workflow
> 👤 **you drive the import + mapping.** the owner watches and confirms his values look right. The
> only thing the owner needs on hand: nothing new — his answers are already captured.
- **Import the Error Handler FIRST:** `engine/error-workflow.n8n.json`. Copy its workflow id →
  set `error_workflow_id` in config. (Launch gate (k): the main workflow's `errorWorkflow` must point
  at a REAL id, never the `{{ERROR_WORKFLOW_ID}}` placeholder, or failures go silent.)
- **Import the main workflow:** `engine/workflow.n8n.json`. The public webhook URL n8n assigns →
  capture `webhook_public_url`, and set it as Twilio's inbound-SMS webhook + as the engine's
  `{{WEBHOOK_PUBLIC_URL}}` (the signature node rebuilds the canonical string from this exact URL).
- **Fill ALL double-brace placeholders in `workflow.n8n.json` (config wizard output) BEFORE import** —
  including `FAQ_TEXT` in the Inject FAQ node and the two LLM system prompts' name/practice/voice
  tokens (pre-injected by `build-nodes.js`, filled like any other token). After import, patch the
  `WEBHOOK_PUBLIC_URL` value inside the signature Code node with the URL n8n actually assigned, then
  re-run n8n-MCP `validate_workflow` on the DEPLOYED copy — expect **0 errors** (the fill-marker error
  class only exists pre-fill).
- Run `node engine/lib/config-check.js --filled` → must print **OK**. This proves every placeholder
  has a value before any node fires. (No orphan placeholders, no empty fields.)

## Step 7 — Build-assist via n8n-MCP (you's machine)
> 👤 **you drive this entirely.** Pure wiring — the owner has nothing to do here.
- With `n8n-mcp` connected, validate the deployed workflow against
  the owner's LIVE n8n version (launch gate (j)): reconcile node typeVersions — especially
  `lmChatAnthropic` (model `claude-sonnet-4-6` needs ≥1.4) and `chainLlm` 1.9. If his instance is
  older, downgrade the nodes + re-pin the model, and record the delta. Re-run `validate_workflow`
  against the imported graph (Fidelity Principle — validate the deployed copy, not the template).
- Wire the resourceMapper column mappings on the Airtable nodes against the live base schema. **By
  name, do not skip:** `LEG2 · Flag awaiting-approval (Airtable)` must map `status=awaiting-approval`
  matched on `phone_e164` — the re-ping Telegram message *tells the owner* the inquiry is flagged, so an
  unmapped column here makes that message lie (Jono C4).

## Step 8 — The test ladder (shadow mode)
> 👤 **you runs the tests; the owner sends the test texts from his phone and confirms what he sees.**
Run in order; do not advance on a failure:
1. **Recon test** — a real SimplePractice inquiry → does the notification carry the phone? (Confirms the
   Branch A/B parse, defer-list (a).)
2. **Duplicate-replay** — re-POST the same inbound (same MessageSid) → exactly ONE send (idempotency).
3. **Forced parse-failure** — malformed inbound → Branch B (the owner alert only, no bad send).
4. **Signature test** — a forged `x-twilio-signature` POST → rejected (proves HMAC, not header presence).
5. **Crisis-trigger drill** — text an explicit crisis phrase → interceptor fires the 988 copy, AI exits
   that crisis conversation (no path back to the reply brain in that execution), urgent alert hits
   the owner, `status=crisis` written. Then text the SAME number again: expect the standard auto-ack + a
   draft held for the owner's approval — **deliberate** (a person recovering who wants to book is not
   frozen out; every reply still passes through the owner's hands), and confirm the draft carries NO
   first name (crisis threads are excluded from name/context matching). **The most important test —
   run it twice.**
6. **Telegram approval round-trip** — a normal inquiry → draft lands in Telegram → the owner edits →
   approved text sends to the prospect.
7. **Real-prompt check** — open the deployed Reply Brain node and verify its system message ends with
   the owner's voice block (proves the real prompt shipped, not a stub).
8. **SLA timeout drill** — send a normal inquiry, then IGNORE the Telegram draft for 15+ minutes:
   confirm `status=awaiting-approval` lands on the inquiry in Airtable, the re-ping arrives carrying
   the draft, and a reply on the re-ping sends to the prospect. This is the ONE contract a JSON file
   can't prove — the `limitWaitTime` timeout-resume on Telegram sendAndWait — and its failure mode is
   the phantom SLA resurrected silently (Greg C4). The wall doc stays true only if this drill passes.

## Step 9 — Go live (draft-and-approve) + Kill-switch rehearsal (HANDOFF GATE)
> 👤 **the owner's step — the handoff gate.** He does the kill-switch rehearsal solo; you double-check.
- Activate the workflow in **draft-and-approve** mode (v1 = the owner approves every outbound). Auto-send
  per category is a v2 graduation that re-opens the disclosure gate — not now.
- **Launch gates, both green before go-live:** (1) Error Handler imported + its id wired +
  errorTrigger proven to fire; (2) **A2P campaign APPROVED** (verified in-console) — Twilio silently
  filters un-approved 10DLC traffic, which would kill the 5-min promise.
- **Kill-switch rehearsal — the owner does it solo, unassisted:** deactivate the n8n workflow toggle, and
  know the Twilio pause + the runbook's practice-pause. **Do not declare the handoff done until he
  pauses and resumes the system himself.**
