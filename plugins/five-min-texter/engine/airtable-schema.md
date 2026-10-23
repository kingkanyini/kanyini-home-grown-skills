# Airtable Schema — the matching database

> **Core principle (Cole Medin / NSA):** the phone is a **lookup key, never a content-unlock key.**
> Only an **exact E.164 match** (via the shared normalizer) feeds context into a reply. No fuzzy
> matching — shared phones, recycled numbers, and enumeration fishing are real threats.

## Base: `Front Desk`

### Table 1 — `Inquiries`  (filled by Leg 1)
| Field | Type | Notes |
|-------|------|-------|
| `inquiry_id` | Autonumber / formula | primary key |
| `phone_e164` | Single line text | **E.164, from the shared normalizer.** The match key. Indexed. |
| `first_name` | Single line text | from the SP notification structured field, if present |
| `category` | Single select | inquiry type (set in Round 6); NOT free inquiry text |
| `created_at` | Created time | |
| `source` | Single select | `simplepractice` / `manual` |
| `status` | Single select | `new` / `acked` / `awaiting-approval` / `replied` / `booked` / `stop` / `crisis` — `awaiting-approval` is set by the SLA flag node when the owner hasn't approved within 15 min |
| `tier` | Formula | `exact` if `phone_e164` populated & valid, else `none` |

> **Deliberately ABSENT:** the raw inquiry message body. We store category + name + phone, never the
> free-text of what they disclosed (mindful handling + 30-day TTL). Leg 1 writes structured fields only.

### Table 2 — `Messages`  (lightweight thread state, TTL-pruned)
| Field | Type | Notes |
|-------|------|-------|
| `message_sid` | Single line text | **Twilio MessageSid — idempotency key (dedupe).** Unique. |
| `phone_e164` | Single line text | links to Inquiries by exact match |
| `direction` | Single select | `inbound` / `outbound` |
| `sent_at` | Date | |
| `ack_sent` | Checkbox | supports 1 auto-ack / number / 24h (enforcement deferred, defer (h)) |
| `daily_count` | Rollup/formula | supports per-number + global daily caps (enforcement deferred, defer (h)) |

> **No message content column.** State only. Crisis threads carry `status=crisis` and are excluded
> from **name/context matching** — the Match Search formula filters `status != "crisis"`, so no
> `first_name` is ever disclosed from a crisis thread. (A later inbound from that number still gets
> the standard auto-ack + a the owner-approved draft, on the generic path.)

## Matching logic (Leg 2)
1. Normalize inbound `From` → `phone_e164` (shared fn). If `null` → proceeds as `tier=none` (generic
   reply path; the search runs against the literal string "null" and returns zero hits — one wasted
   API call, correct result; v1.1 short-circuit, defer (n)).
2. Look up `Inquiries` where `phone_e164` = inbound (EXACT), excluding `status = "crisis"` records.
3. Exactly one match → `tier=exact`, pass `first_name` into the typed context object (the context
   carries only `tone_band` / `faq` / `match_tier` / `first_name` — `category` stays in Airtable and
   never enters the writer's context).
   Zero or >1 → `tier=none` (no name, generic reply). Never merge multiple matches.

## Disclosure-Tier Ladder (NSA)
| Tier | Bot may say | Bot may NEVER say |
|------|-------------|-------------------|
| `exact` | "Hi {first_name}, thanks for reaching back out" | anything about *what* they previously said |
| `none` | generic warm greeting, no name | — |

## Formula-injection guard (NSA — `filterByFormula`)
When querying Airtable by phone, the lookup value is the **normalized E.164 string only** (`+1` + 10
digits — already stripped to digits by the normalizer, so it cannot contain Airtable formula syntax).
- Build the filter from the **normalized** value, never the raw `From`.
- Defensive: reject any lookup value not matching `^\+1\d{10}$` before it reaches `filterByFormula`.
