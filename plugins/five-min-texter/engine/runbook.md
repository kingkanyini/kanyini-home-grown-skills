# Runbook — the owner's 1-page operations guide

Plain language. Keep this where you can find it. The system drafts; **you approve every send** (v1).

## Your daily loop
1. A new person texts your number → they get an **instant acknowledgment** automatically (you do nothing).
2. Within a few seconds, a **draft reply in your voice** lands in **Telegram**.
3. You **approve, edit, or ignore**:
   - **Approve as-is, or type your edited version** → reply in Telegram and it sends to the prospect.
   - **Ignore** → nothing goes out (the person still got the instant acknowledgment).
4. That's it. Expect a handful a day at most — this is never-miss-a-lead, not a firehose.

**Your one job that matters: approve fast.** Target **within 15 minutes**. The instant acknowledgment
buys you that window — but the warm reply only feels "5-minute fast" if you approve quickly. If you
don't reply within 15 min, the system flags the inquiry `awaiting-approval` in your Airtable view,
then **re-pings you ONCE** in Telegram with the draft (that second ping waits as long as it takes).
Just reply to the **most recent** draft the bot sent you and it goes out; stay silent and the draft simply holds — one nudge, not a nag loop.

**Away mode (asleep / in session / on vacation):** the instant acknowledgment still fires on its own,
and the draft waits in Telegram for you. Nobody gets ghosted; the real reply just waits for your thumb.

## When something looks wrong
| You notice… | Check this | Likely fix |
|---|---|---|
| Replies stopped going out | n8n: is the workflow **Active**? Twilio balance? n8n execution log | Re-activate workflow / top up Twilio |
| "I never got the draft" | Telegram notifications ON? Bot not muted? | Re-open Telegram; n8n "Executions" shows if it ran |
| A reply looked off | It was a draft **you** approved — edit before approving next time | — |
| Carrier/"undelivered" errors | A2P campaign still **approved**? Twilio Messaging logs | Confirm A2P status in Twilio console |
| A "⚠️ 5-Min Texter ERROR… Check n8n." text | That lead's automation **died mid-flight** — open n8n **Executions** to see where it stopped | Reply to that lead **manually**; a Twilio retry will NOT resurrect the dead run (the duplicate guard correctly blocks it) |

> Error alerts are **dual-channel**: Telegram first, then the text to your cell — so even a
> Twilio-side outage can't silence the alarm.

> **Don't re-save or re-activate the workflow while a draft is sitting in Telegram waiting for you.**
> A pending approval can get orphaned by a re-publish — finish or ignore the draft first.

## The kill switch (rehearse this — you should be able to do it in 10 seconds)
- **Fastest:** in n8n, toggle the workflow **Inactive**. Everything stops. Toggle **Active** to resume.
- Backup: pause the number in the Twilio console.
- **A crisis already handles itself:** if someone sends crisis language, the system instantly sends the
  988 / Crisis Text Line message, **alerts you** (Telegram first, then your cell — two channels), marks
  the thread `crisis`, and **the AI exits that conversation** — there is no path back to the auto-reply
  brain within that exchange. If that person texts again later (say, recovering and ready to book), they
  get the standard acknowledgment and a draft held for **your** approval — deliberate, so nobody is
  frozen out, and every reply still passes through your hands. Crisis threads are excluded from
  name/context matching, so the system never greets them by name from that record. Your job then is
  human: follow up personally. (You can also flip the kill switch if you want everything paused while
  you handle it.)

## What it will NEVER do (so you can trust it)
- Never give medical or clinical advice, never "diagnose," "treat," or "heal" anyone.
- Never repeat back or guess what someone told you (it doesn't even see the message text by the time it
  writes the reply).
- Never text someone first — it only ever replies.
- Never send pricing/hours/details that aren't in the FAQ you approved.
- Never send without you (v1 is approve-every-send).

## Who to call
- **you** — build owner + first escalation.
- n8n support (in-app) · Twilio support (console) · Airtable (support.airtable.com).

---
## Build-day carry-forwards (for you — not the owner-facing)
- **Airtable `message_sid` dedupe is best-effort** (Airtable has no native unique constraint). The real
  protection is the engine's write-id-before-send. Prove the duplicate-replay test, and confirm a
  write-collision **exits quietly** (treated as duplicate) rather than firing a scary error alert.
- **typeVersion / model reconciliation** against the owner's live n8n before import (launch gate j).
- **Swap `{{ERROR_WORKFLOW_ID}}`** for the real imported id + prove the errorTrigger fires (launch gate k).
- **At first live Twilio POST**, log the actual `$json` shape before trusting `.body` (the sig node
  fails loud if the shape is wrong — confirm the mapping).
- **v1.1 backlog (deferred, eyes-open):** per-number + global daily auto-ack caps; quiet-hours queue on
  the approved reply (the approved reply currently sends immediately even at 3am — auto-ack is instant
  by design, crisis always bypasses).
