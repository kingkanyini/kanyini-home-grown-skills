# NSA Non-Negotiables — each labeled by enforcement layer

These are HARD RULES. The intake interview fills blanks; it must NEVER remove one of these.
Sourced from the project's locked NSA review (vault `five-min-texter-5min-texter.md`).

**Enforcement labels (honest, no overselling):**
- **ENGINE** — the workflow graph / lib code enforces it deterministically.
- **BUILD-DAY** — configured/proven during the setup walkthrough.
- **RUNBOOK** — a human procedure the owner executes.
- **DEFERRED(letter)** — consciously deferred; letter = the workflow `_meta` frozen defer list.

<!-- SCAFFOLD: full list copied from project notes; phrasing pass = [FILL]. -->

1. **Deterministic crisis interceptor PRE-LLM** — 988 + Crisis Text Line (741741) canned copy, bypasses quiet hours, urgent alert to the owner, AI exits that crisis conversation (terminal within the execution — no path back to the reply brain). A LATER text from a crisis-flagged number gets the standard auto-ack + a draft held for the owner's approval — deliberate, so a person recovering who wants to book is not frozen out; every reply still passes through the owner's hands. Crisis threads are excluded from name/context matching (no first_name ever disclosed from a crisis thread). **[ENGINE — screen, alert, exit, match exclusion]** Practice-wide pause = urgent alert + kill switch. **[RUNBOOK + DEFERRED(g)]**
2. **Closed-book FAQ scope fence** — bot only states what's in the approved FAQ (billboard rule). **[ENGINE — prompt-level (lib-canonical, drift-tested) + draft-and-approve backstop]**
3. **Clinical-language guard** — deny-list: treat / cure / heal / diagnose / therapy / etc. **[ENGINE — guards.js deny-list node]**
4. **Numeric guard** — every $ / % must exact-match the FAQ or the draft is blocked **[ENGINE — guards.js]**. Dates are held to the same rule at **prompt level only** (no deterministic date guard; the owner's approval is the backstop).
5. **Reply-only architecture (TCPA)** — bot never initiates; no follow-up leg in v1. **[ENGINE — the graph has no outbound-initiate path]**
6. **Mindful handling** — auto-messages NEVER echo the inquiry's specific content (treat it as private, even though the owner isn't a clinician). **[ENGINE — the writer receives only the typed context (tone_band / faq / match_tier / first_name); raw text never reaches it]**
7. **Phone parse: structured-field-only, E.164, fail-closed** — one shared normalizer (`engine/e164-normalizer.md`); the phone is a *lookup key*, never a content-unlock key. **[ENGINE — phone.js]**
8. **Dedupe + caps** — idempotency on Twilio MessageSid **[ENGINE]**; no auto-retry **[ENGINE]**; 1 msg / number / 24h + daily global cap **[DEFERRED(h) — schema supports the fields, no node enforces them yet]**.
9. **Fixed spine** — sender ID + STOP language in every message (`engine/message-spine.md`). **[ENGINE — spine appended deterministically]**
10. **Memory hygiene** — no inquiry content in logs or DB **[ENGINE — no content columns]**; crisis threads excluded from name/context matching **[ENGINE]**; 30-day TTL purge **[BUILD-DAY — an Airtable automation; ⚠️ not yet scripted in the setup walkthrough — treat as a build-day carry-forward]**.
11. **Secrets** — credential vault only, revocable keys, 2FA. Never in chat or git. **[BUILD-DAY + RUNBOOK]**
12. **Rehearsed kill switch** — n8n toggle / Twilio pause / Gmail filter; the owner can do it unassisted. **[RUNBOOK — rehearsed at Setup Step 9]**
13. **Shadow mode before go-live** — 10 real inquiries or 14 days + 12-script adversarial gauntlet, 12/12 clean ×2. **[BUILD-DAY — go-live gate procedure]**
