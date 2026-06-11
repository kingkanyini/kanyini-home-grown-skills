# Crisis Interceptor — deterministic, PRE-LLM (the hardest gate)

> This runs **before any LLM touches the message** and before the auto-ack. On a match it sends the
> canned copy, fires an urgent alert to the owner (bypassing quiet hours), and exits the AI from that
> crisis **conversation** — within that execution there is no path back to the reply brain. The
> practice-wide pause is the owner's move via the urgent alert + the runbook's kill-switch. the owner is a
> wellness practitioner, not a clinician — the bot's only job in a crisis is to **hand off to real
> help fast and get out of the way.**

## Layered detection (defense in depth)
1. **Deterministic keyword/phrase screen (HARD GATE, pre-LLM).** Fast, auditable, no model in the
   loop. Catches explicit language. This is the gate that legally/ethically matters.
2. **LLM secondary flag (soft, advisory) — the TONE CLASSIFIER, not the writer.** The tone classifier
   (`engine/tone-classifier.md`) emits a `crisis_flag` for oblique distress the keyword screen missed.
   If it flags → route to the SAME canned-copy + alert + pause + exit sink. **The reply brain
   (`bot-brain.CLAUDE.md`) is NOT the crisis detector** — it never sees the raw inquiry text, so it
   cannot screen for distress (Phase C0). Oblique-crisis detection lives ONLY in the classifier's
   `crisis_flag`. Never let any LLM "handle" a crisis itself.

> ⚠️ Keyword screening is imperfect (the adversarial gauntlet includes *oblique* crisis on purpose).
> That's why detection is layered and the launch posture is draft-and-approve — the owner's eyes are the
> backstop in v1.

## Deterministic screen (n8n Code node, JavaScript)

```javascript
// crisisScreen — returns true if inbound text matches explicit crisis indicators.
// CANONICAL SOURCE: engine/lib/crisis.js (tested + drift-guarded into the workflow). This snippet is
// illustrative and MUST be kept reconciled with crisis.js — do not let it drift to a looser pattern.
function crisisScreen(text) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  const patterns = [
    /\bkill(ing)? (myself|my self)\b/,
    /\bsuicid/,
    /\bend (my life|it all)\b/,
    /\bwan(t to|na) die\b/,
    /\bdon'?t want to (live|be here|exist)\b/,
    /\b(harm|hurt(ing)?) (myself|my self)\b/,
    /\bself[-\s]?harm/, /\bcut(ting)? myself\b/,
    /\boverdos/, /\btake all (my|the) pills\b/,
    /\bno reason to live\b/, /\bbetter off dead\b/, /\bnot worth living\b/,
  ];
  return patterns.some((re) => re.test(t));
}

const text = $json.body ?? $json.Body ?? '';
return [{ json: { ...$json, crisis: crisisScreen(text) } }];
```

> Maintainability: keep the pattern list in ONE place. Add to it as real cases surface; never
> remove a pattern without the owner's sign-off. This list is a starting set, not exhaustive.

## Canned message (DRAFT — the owner must approve VERBATIM in Intake Round 4)

> **Canonical source:** `engine/lib/copy.js` → `CRISIS_COPY`. The workflow's message field is INJECTED
> from there by `build-nodes.js` and byte-diffed by `drift.test.js`. Edit the copy in ONE place
> (`copy.js`); this doc must quote it verbatim. (This is the file the "dropped Lifeline clarifier"
> drift defect taught us to single-source.)

> **"I'm really glad you reached out. I'm not able to help over text in a moment like this, and I
> want you to get real support right now. Please call or text 988 (the Suicide & Crisis Lifeline),
> or text HOME to 741741. If you're in immediate danger, call 911. — {{PRACTICE_NAME}}"**

- Sent once. The AI then **exits that crisis conversation** — within that execution, no path back to
  the reply brain. A **later** text from that number gets the standard auto-ack and a draft held for
  the owner's approval — **by design** (honest-rewrite): a person recovering who wants to book is not
  frozen out, and every reply still passes through the owner's hands. Crisis threads stay excluded from
  name/context matching, so no first name is ever disclosed from a crisis record.
- the owner gets an **urgent alert** (bypasses quiet hours) so a human can follow up.
- **Practice-wide pause** is enacted by the owner via the urgent alert + the runbook's kill-switch
  (runbook procedure; automated global pause is a v2 defer, (g)).

## Optional local resources
[the owner may add a local/regional crisis line or warm-line in Round 4.]

## After-action (memory hygiene)
- Thread marked `status=crisis`. **No message content stored** beyond the event flag + timestamp.
- Purged on the 30-day TTL like all threads; crisis threads are excluded from name/context matching
  (the Match Search formula filters `status != "crisis"` — no `first_name` ever flows from one).
