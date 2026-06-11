# Message Spine — fixed, content-free elements

> Everything here is **fixed copy that echoes ZERO inquiry content** (mindful handling). Approved by
> the owner in Intake Round 5. The reply brain wraps its drafted middle in this spine.

## 1. Instant auto-ack  (Decision #2 — crisis-gated, fires autonomously)
Fires **only after** the crisis screen clears. Content-free, identical for everyone, no model needed.

> **Canonical source:** `engine/lib/copy.js` → `AUTO_ACK_COPY` (injected into the workflow + byte-diffed by
> `drift.test.js`). The spine fragments below live in `copy.js` too (`BOOKING_LINE`/`SIGNOFF`/`COMPLIANCE`).

> **"Hi, thanks so much for reaching out to {{PRACTICE_NAME}} 🙏 I got your message and {{OWNER_FIRST}}
> will personally get back to you shortly. If this is an emergency, call or text 988. Reply STOP to opt out."**

- Sub-second response → wins the speed race, sets expectations, never over-promises.
- Sent once per inbound number per 24h (dedupe cap applies).

## 2. Reply spine  (wraps every the owner-approved drafted reply)
```
[Greeting]  → "Hi[ {first_name if EXACT phone match}]," — no name if no exact match
[Body]      → the brain's drafted reply (FAQ-fenced, no clinical language, no echo)
[Booking]   → "Whenever you're ready, you can grab a time here: {{BOOKING_LINK}}"
[Sign-off]  → "— {{OWNER_FIRST}}, {{PRACTICE_NAME}}"
[Compliance]→ "Reply STOP to opt out."   (always present; case-insensitive handling)
```

## 3. Sender identity (TCPA)
Every first message in a thread identifies the sender: `{{PRACTICE_NAME}}`. Bot is **reply-only** —
it never initiates an outbound thread.

## 4. STOP / opt-out
- `STOP` (case-insensitive, any casing/whitespace) → immediate opt-out, confirmation, no further messages.
- Honored at the carrier level via Twilio AND tracked in our state (belt + suspenders).

## 5. Quiet hours
- **Prospect leg:** {{QUIET_HOURS}} — default **8:00am–8:30pm** local. Outside the window, the reply
  is queued (or held for the owner), not sent.
- **Crisis interceptor BYPASSES quiet hours** — safety always sends.

## Placeholders filled at intake
`{{PRACTICE_NAME}}` · `{{OWNER_FIRST}}` · `{{BOOKING_LINK}}` · `{{QUIET_HOURS}}`
