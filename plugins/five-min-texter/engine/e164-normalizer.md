# E.164 Phone Normalizer — THE shared function

> Greg Hogg flagged this as the **#1 silent failure** — "a retrieval failure wearing an
> everything's-green dashboard." Leg 1 (inquiry parse) and Leg 2 (inbound match) MUST normalize
> phones through the **same code path**, or the join silently misses and the bot looks healthy
> while matching nothing.

## Contract
- **Input:** any raw US phone string (from a SimplePractice notification field, or Twilio `From`).
- **Output:** strict E.164 `+1XXXXXXXXXX` **or** `null`.
- **Fail-closed:** `null` → NO match attempted, route to the owner-alert. Never guess, never partial-match.
- **Single source:** this exact function is pasted into **one** n8n Code node and called by both legs.
  Do not re-implement inline anywhere.

## Reference implementation (n8n Code node, JavaScript)

```javascript
// e164Normalize — shared by Leg 1 (upsert key) and Leg 2 (lookup key).
// US (+1) only. Returns '+1XXXXXXXXXX' or null. Fail-closed.
function e164Normalize(raw) {
  if (raw == null) return null;
  // Keep digits only; drop spaces, dashes, parens, dots, leading '+'.
  const digits = String(raw).replace(/\D/g, '');
  // 10 digits = bare US number → prepend country code.
  if (digits.length === 10) return '+1' + digits;
  // 11 digits starting with 1 = US with country code.
  if (digits.length === 11 && digits.startsWith('1')) return '+' + digits;
  // Anything else (too short, too long, intl, garbage) → fail closed.
  return null;
}

// n8n usage: normalize and pass through; tag unmatched for the alert leg.
const raw = $json.phone_raw ?? $json.From ?? null;   // Leg-1 field OR Twilio From
const e164 = e164Normalize(raw);
return [{ json: { ...$json, phone_e164: e164, phone_parse_ok: e164 !== null } }];
```

## Test fixture (must pass BEFORE launch — Greg's gate)

| Input | Expected output |
|-------|-----------------|
| `(509) 555-0142` | `+15095550142` |
| `509-555-0142` | `+15095550142` |
| `509.555.0142` | `+15095550142` |
| `5095550142` | `+15095550142` |
| `+1 509 555 0142` | `+15095550142` |
| `1-509-555-0142` | `+15095550142` |
| `15095550142` | `+15095550142` |
| `555-0142` (7-digit) | `null` (fail-closed) |
| `+44 20 7946 0958` (intl) | `null` (fail-closed) |
| `` / `null` / `call me` | `null` (fail-closed) |

> **Why US-only fail-closed:** the owner's practice is US-based (988/911 jurisdiction). A non-US or
> malformed number should never silently coerce into a wrong match — it goes to the owner's eyes.
> If international clients ever matter, that's a deliberate v2 change with new test fixtures, not
> a quiet loosening of this function.
