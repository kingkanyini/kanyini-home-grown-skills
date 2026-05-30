# Morning Compass — Schema Changelog

Tracks `schema_version` bumps across the state JSON + 4 JSONL files at `~/.claude/state/morning-compass-*`. Readers MUST handle missing/older versions gracefully (assume `schema_version=0` for any pre-v1 line).

## Field Ownership Contract

To prevent concurrent-write conflicts between the runner (skill-owned writes) and the bot (handler-owned writes), each field is owned by exactly one writer. Readers may read any field; only owners write.

| Field | Owner | Concurrency note |
|---|---|---|
| `energy_history` | bot | Appended on energy tap-back |
| `skip_days_consecutive` | skill | Reset on each successful run |
| `last_feedback_rating` | bot | Set on feedback button tap |
| `rock_start_dates_cache` | skill | Refreshed weekly via Basecamp pull |
| `last_brief_timestamp` | skill | Set after each brief publish |
| `last_brief_content` | skill | Set after each brief publish |
| `paused_until` | bot | Set on `/pause` command |

---

## v1 (2026-05-06) — Initial

### State JSON (`morning-compass-{coach}.json`)

```json
{
  "schema_version": 1,
  "energy_history": [],
  "skip_days_consecutive": 0,
  "last_feedback_rating": null,
  "rock_start_dates_cache": {
    "_refreshed_at": null
  },
  "last_brief_timestamp": null,
  "last_brief_content": null,
  "paused_until": null
}
```

Field types:
- `schema_version` — int, mandatory
- `energy_history` — array of `{date: ISO8601, bucket: "low"|"med"|"high", raw_value: int 1-10}`
- `skip_days_consecutive` — int (≥0)
- `last_feedback_rating` — string or null (`"thumbs_down" | "meh" | "thumbs_up"`)
- `rock_start_dates_cache` — object: `{_refreshed_at: ISO8601|null, [rock_name]: ISO8601}`
- `last_brief_timestamp` — ISO8601 or null
- `last_brief_content` — string or null
- `paused_until` — ISO8601 or null

### Feedback JSONL (`morning-compass-feedback.jsonl`)

One JSON per line:
```json
{"schema_version": 1, "date": "2026-05-06", "rating": "thumbs_up", "reason": "constraint nailed it"}
```

### Actions JSONL (`morning-compass-actions.jsonl`)

One JSON per line. `type` is one of: `brief_generated | energy_tapped | qbr_done | reply_to_sent | reply_to_skipped | refresh_invoked | run_invoked | paused | skipped`.

```json
{"schema_version": 1, "ts": "2026-05-06T11:00:00Z", "type": "brief_generated", "constraint": "applications_down", "qbr": "voice notes to top 5"}
```

### Actions Rollup JSON (`morning-compass-actions-rollup.json`)

Aggregated counts rebuilt nightly from `actions.jsonl`:

```json
{
  "schema_version": 1,
  "counts_30d": {"brief_generated": 22, "qbr_done": 18, "reply_to_sent": 35},
  "counts_90d": {"brief_generated": 64, "qbr_done": 52, "reply_to_sent": 110},
  "last_rebuilt": "2026-05-06T03:00:00Z"
}
```

### Conversation JSONL (`morning-compass-conversation.jsonl`)

One JSON per line. Stores DM exchanges between coach and bot for context recall:

```json
{"schema_version": 1, "ts": "2026-05-06T11:30:00Z", "direction": "in", "text": "what was yesterday's queen bee?"}
```

---

## Migration Policy

When bumping `schema_version`:

1. **Document the change here BEFORE shipping the bump** — including the old shape, new shape, and migration logic.
2. **Bot + Skill + Runner readers handle BOTH old and new versions** for one full release cycle (≥14 days in production).
3. **After 30 days**, may drop old-version handling. Bump version of all affected readers in the same commit.
4. **Never silently transform old records** — log the migration so we can audit later.

---

## Future Backlog (v2+)

- `voice_profile_version` field on state JSON — track which voice profile snapshot generated the brief, for retro-analysis when voice DNA evolves
- `tenant_id` on all records — required if multi-tenant hosting kicks in (Thattai's note in r2 spec)
- `brief_score` field on actions records — feedback-loop training signal for the readiness scorer (Bengio's v1.1 work)
