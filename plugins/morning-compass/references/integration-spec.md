# Morning Compass — Integration Spec

Engineering reference for the 7 integrations the skill consumes. Use this when:
- Wiring a new coach's stack to the skill (<your-name>'s account, then Adeyemi's, then any future client)
- Porting to MS AI's routine builder (map MS AI's variable names to the canonical names below)
- Diagnosing why a section returned "data unavailable"

---

## Per-Integration Fetch Specifications

What the orchestrator needs to fetch from each integration. **MS AI uses tool-call architecture (not template variables)** — the agent calls Composio tools (or built-in `cf2_*` for ClickFunnels) live at runtime per the plain-English directives in the skill prompt. The schema below documents the data shape each fetch should return so the orchestrator can compute deltas, render the scorecard, and feed the counsel.

In Claude Code, the orchestrator uses available local MCPs (Google Calendar, ClickFunnels, yt-dlp for YT) and falls back to manual paste for the rest.

### Google Calendar

| Variable | Type | Source field | Notes |
|----------|------|--------------|-------|
| `today_events[]` | array | `events.list` for today, primary calendar | Each event: `{summary, start, end, duration_minutes}` |
| `tomorrow_first_event` | object | `events.list` for tomorrow, first chronologically | `{summary, start_time}` |
| `today_total_meeting_minutes` | int | sum of `today_events[].duration_minutes` where `event_type == "meeting"` | Used for calendar-load check |

**Manual fallback prompt:** *"Today's calendar — paste a 1-line summary (e.g., '9am app call, 11am content shoot, 2pm team standup, 4pm clear')"*

### Stripe

| Variable | Type | Source field | Notes |
|----------|------|--------------|-------|
| `revenue_7d` | float | sum of `charges.list` succeeded in last 7 days, in coach's currency | Net of refunds |
| `revenue_prior_7d` | float | same, prior 7 days | For delta calc |
| `open_invoices` | float | sum of `invoices.list` status `open` | For cash flag |

**Manual fallback prompt:** *"Stripe — last 7d revenue, prior 7d revenue, open invoices total. Just 3 numbers."*

### Calendly

| Variable | Type | Source field | Notes |
|----------|------|--------------|-------|
| `calls_booked_7d` | int | `scheduled_events.list` count for last 7 days | All event types |
| `calls_booked_prior_7d` | int | same, prior 7 days | For delta |
| `pending_no_shows` | int | `scheduled_events` where status = no-show in last 7d | Conversion-friction signal |

**Manual fallback prompt:** *"Calendly — calls booked last 7d, prior 7d, no-shows. 3 numbers."*

### ClickFunnels

| Variable | Type | Source field | Notes |
|----------|------|--------------|-------|
| `optins_7d` | int | sum of opt-ins across all funnels last 7d | Top-of-funnel signal |
| `optins_prior_7d` | int | same, prior 7d | |
| `applications_7d` | int | application form submissions last 7d | Mid-funnel commercial gate |
| `applications_prior_7d` | int | same, prior 7d | |
| `top_page_conversion_delta` | float | % change in top-converting page's conversion rate vs prior 7d | Page-level optimization signal |

**Manual fallback prompt:** *"ClickFunnels — opt-ins last 7d + prior, applications last 7d + prior. 4 numbers."*

### Basecamp

| Variable | Type | Source field | Notes |
|----------|------|--------------|-------|
| `todays_flagged_todos[]` | array | todos due today across all projects | Each: `{title, project, assigned_to, tags[], notes}` |
| `active_rocks[]` | array | top 3 active "rock" projects (90-day priorities), each with `start_date` | If projects aren't tagged "rock," fall back to top 3 most-active projects. `start_date` enables cycle phase computation (Sanchez) — see Cycle Phase section below. |
| `unread_messages_to_coach[]` | array | mentions + direct messages addressed to coach in last 24h | Each: `{from, project, snippet, link}` |

**Manual fallback prompt:** *"Basecamp — list today's must-dos (3-7 items), your top 3 90-day rocks, anyone tagged you in the last 24h."*

### Instagram (Meta Graph API)

| Variable | Type | Source field | Notes |
|----------|------|--------------|-------|
| `posts_7d` | int | `media.list` count last 7d | Posts + reels combined |
| `engagement_rate_7d` | float | (sum likes + comments + saves) / followers, averaged across posts last 7d | |
| `engagement_rate_prior_7d` | float | same, prior 7d | For delta |
| `top_post` | object | post with highest engagement last 7d | `{permalink, caption_first_line, likes, comments, reach}` |
| `comments_needing_reply[]` | array | top 5 comments by readiness signal across last 7d posts | Each: `{handle, post_permalink, comment_text, posted_at}` |
| `follower_delta` | int | `account_insights` follower change last 7d | |

**Readiness signal scoring** (for `comments_needing_reply` ranking):
- +3: Comment includes a question mark
- +3: Comment from a verified or high-follower account (>10k)
- +2: Comment includes program/offer name (e.g., "Reborn", "Otherside")
- +2: Comment from existing customer/alum (cross-reference CF customer list if available)
- +1: Comment length > 30 characters (signals investment)
- -3: Comment is generic praise ("great post", "love this")
- -5: Comment appears spammy / promotional / off-topic

Top 5 by score, descending.

**Manual fallback prompt:** *"IG — last 7d posts count, engagement % vs prior week (rough), top post URL, top 5 comments worth replying to."*

### YouTube (Data API v3)

| Variable | Type | Source field | Notes |
|----------|------|--------------|-------|
| `videos_7d` | int | `search.list` count by channel, last 7d | Long-form + shorts |
| `views_7d` | int | sum of view counts on videos published last 7d, accumulated | |
| `views_prior_7d` | int | same, prior 7d | For delta |
| `top_video` | object | video with highest views or engagement last 7d | `{video_id, title, views, like_count, comment_count}` |
| `comments_needing_reply[]` | array | top 5 comments by readiness signal | Same scoring as IG above |
| `subscriber_delta` | int | `channels.list` subscriber count change last 7d | |

**Manual fallback prompt:** *"YT — last 7d videos count, views vs prior week, top video URL, top 5 comments worth replying to."*

### Voice Profile

| Variable | Type | Source | Notes |
|----------|------|--------|-------|
| `voice_profile` | markdown text | `~/.claude/references/voice-profiles/{coach-slug}-voice.md` | Loaded by orchestrator at run time. Default: <your-username>'s profile. Override via `--voice` flag. **Cached per session (Hogg) — re-loaded only if file mtime changes.** |

**Manual fallback:** none — if voice profile not available, REPLY TO and CONTENT MOVE sections must mark "voice profile required."

---

## Cycle Phase Computation (Sanchez)

For the dominant rock (the one most aligned with today's equity lever):

1. Pull `start_date` from `basecamp.active_rocks`
2. Compute `weeks_elapsed = (today - start_date) / 7`, rounded up
3. Compute `total_weeks = rock.duration_weeks` (default to 12 if unspecified)
4. Compute `phase`:
   - `early` — week 1-3 (or weeks 1 to 25% of total)
   - `harvest` — week 4-9 (or 26-75% of total)
   - `closing` — week 10-12 (or 76-100% of total)
5. Render: `Cycle phase: week {weeks_elapsed} of {total_weeks} of "{rock_name}" ({phase})`
6. If `start_date` missing or unparseable → omit cycle phase line entirely (do NOT fabricate)

`rock_start_dates_cache` in skill state is refreshed weekly to avoid hammering Basecamp API on every run.

---

## v1 Scope Deferrals

### Token Vault Strategy (CIPHER) — DEFERRED to v2

For v1 (single-tenant, <your-name>'s account → Adeyemi's account separately): tokens are stored in MS AI's native integration vault per coach. Each coach connects their own integrations through MS AI's OAuth flow. No shared token storage across coaches.

For v2 (multi-tenant, hosted skill across many coaches): need a dedicated secrets vault with per-coach access controls + audit logging. Candidates: AWS Secrets Manager, HashiCorp Vault, or MS AI's enterprise tier if they ship one. Document architecture before v2 build.

### Multi-Tenant Architecture (Thattai) — DEFERRED to v2

For v1: each coach runs the skill in their own MS AI workspace. No cross-coach data flow. Voice profiles, integration tokens, skill state — all per-workspace.

For v2: if hosting the skill as a multi-tenant service:
- Voice profiles stored in per-coach namespaces (S3 prefix or DB partition by coach_id)
- Skill state JSON files namespaced (`morning-compass-{coach_id}.json`)
- Feedback log stream per coach
- Integration token vault keyed by coach_id

### External Constraint Detection (Goldratt) — DEFERRED to v1.1

v1: skill detects internal constraints only (pipeline metrics). Coach handles external constraints (market crash, illness, client crisis) manually outside the skill.

v1.1: add a manual override prompt — "anything external in play? (none / yes — describe)." If "yes": skill skips commercial action recommendations and renders restoration / strategic-pause framing.

### Personalized Comment Readiness Classifier (Bengio) — DEFERRED to v1.1

v1 uses heuristic readiness scoring (see IG section). v1.1 trains a small classifier on each coach's actual reply patterns from the feedback log.

---

## Reference Library Architecture (v1.1 backlog)

**Pattern:** MS AI's `read_references` tool lets the orchestrator fetch long-form reference data on-demand instead of stuffing everything into the system prompt. Tight orchestrator (~3K tokens) + on-demand fetches keeps cost low and quality high.

**v1 status:** all knowledge currently lives inline in the system prompt. Works, but doesn't scale.

**v1.1 plan:** extract the inline knowledge into a curated reference library at `reference/library/`. Orchestrator fetches per section, only what's needed.

### The 14 reference files (priority order)

#### Tier A — Per-Section Operational Logic (8 files)

| # | File | Fetched at | Notes |
|---|------|-----------|-------|
| 1 | `constraint-playbooks.md` | CONSTRAINT section (only the active constraint's playbook) | Per-constraint library: applications-down / engagement-down / calls-down / revenue-down / reach-down / content-posts-down. Each = 5-7 ranked moves with ROI + executor + time cost. Battle-tested only — add new moves after they've worked 3x in production. |
| 2 | `comment-readiness-rubric.md` | REPLY TO scoring | The scoring table currently inline — externalize so it can grow with real reply-to-conversion data. |
| 3 | `hook-formula-library.md` | CONTENT MOVE generates angle | Hook STRUCTURES (not voice — voice is platform-layer). 7 formulas: stat-led / steal-the-#1 / step-N / pricetag-anchor / time-cost / plateau-pivot / year-end. With expected engagement benchmarks. |
| 4 | `cta-funnel-map.md` | OUTREACH + REPLY TO drafts | CTA structures mapped to funnel positions: awareness / curiosity / consideration / application / conversion / brotherhood. Cadence rules. |
| 5 | `queen-bee-heuristics.md` | QUEEN BEE inference (when no `queen-bee` tag) | Coach-only signals (intuition, voice notes, embodied transmission) vs delegable (admin, scheduling, drafting). 90-min cap reasoning. |
| 6 | `cycle-phase-rules.md` | EQUITY LEVER computes phase | Sanchez's full logic: standard 12-week math + edge cases (rocks <12 weeks, paused, stretch, multi-rock weeks, missing start_date). |
| 7 | `weekly-pattern-detection.md` | `--weekly` mode | Pattern detection: "constraint repeats 3+ days = systemic," win-clustering, rock-progress flat = blocker. Win auto-detection heuristics. |
| 8 | `null-handling-playbook.md` | Any null data | Per-source fallback behaviors (currently inline in Hard Constraints). Externalized so it grows with edge cases. |

#### Tier B — Per-Integration (3 files)

| # | File | Fetched at | Notes |
|---|------|-----------|-------|
| 9 | `integration-quirks.md` | Any integration delivers data | Stripe refund delays, CF form-ID collisions, Calendly TZ handling, Basecamp tag conventions, Google Cal event-type filtering, IG comment ordering, YT shorts-vs-long distinction. |
| 10 | `integration-field-map.md` | At skill init / setup | Canonical field schema — extracted from this file as standalone reference. |
| 11 | `integration-rate-limits.md` | If any pull throttles | Per-API quotas + retry-backoff rules + off-peak scheduling guidance. |

#### Tier C — Per-Coach Operational Data (3 files per coach)

| # | File | Fetched at | Notes |
|---|------|-----------|-------|
| 12 | `{coach}-offer-specifics.md` | REPLY TO references an offer / EQUITY LEVER on offer-rock | Pricing, application URLs, cohort dates, deliverables, lead-magnet flow. Per coach. Stale data here = misinformed drafts. |
| 13 | `{coach}-scorecard-metrics.md` | SCORECARD computes any metric | What counts in "revenue" / "leads" / "calls" / "applications." Coach-specific because every stack is different. |
| 14 | `{coach}-context.md` | Any section needing brand context | Brand glyphs, hashtag stack, ICA tier definitions, energy load thresholds, current 90-day cycle theme. |

### Per-section fetch trigger map (v1.1 architecture)

| Section | References fetched (only what's needed) |
|---------|------------------------------------------|
| Energy Read | `{coach}-context.md` (energy-load thresholds) |
| Constraint | `constraint-playbooks.md#<active>` + `{coach}-scorecard-metrics.md` |
| Queen Bee | `queen-bee-heuristics.md` (only if no `queen-bee` tag) |
| Scorecard | `{coach}-scorecard-metrics.md` + `integration-quirks.md` |
| People → Outreach | `cta-funnel-map.md` |
| People → Reply To | `comment-readiness-rubric.md` + `cta-funnel-map.md` + `{coach}-offer-specifics.md` |
| Content Move | `hook-formula-library.md` |
| Equity Lever | `cycle-phase-rules.md` + `{coach}-offer-specifics.md` |
| Ignore Today | (none — pure logic) |
| One-Line Compass | (none — pure synthesis) |
| Weekly Mode | `weekly-pattern-detection.md` + daily refs re-fetched for archive |

**Average run:** fetches 3-5 references, skips 9-11. Net savings vs inline: ~30% per-run cost + faster prompt load + per-coach customization without prompt redeploy.

### Net architectural shift

```
v1.0 (today):
├── System prompt (~10K tokens — orchestrator + all knowledge inline)
└── Voice profile loaded once

v1.1 (this backlog):
├── System prompt (~3K tokens — orchestrator + reference fetch directives)
├── reference/library/
│   ├── (8 operational references)
│   ├── (3 integration references)
│   └── coach/{slug}/ (3 coach-specific references per coach)
└── Voice profile fetched as one of the references
```

Same skill behavior, modular knowledge, ~30% cheaper per run, scales cleanly to multiple coaches.

### Build order (when v1.1 work begins)

1. Extract Tier A operational knowledge from current inline spec (8 files)
2. Extract Tier B integration knowledge from this file (3 files)
3. Build first coach's Tier C (Adeyemi or <your-name>) (3 files)
4. Update `commands/morning-compass.md` to use `read_references` directives per section
5. Test in MS AI with new fetch pattern
6. Onboard second coach with Tier C only (proves the multi-coach scaling)

---

## MS AI Tool-Call Pattern (architecture note)

**MS AI does NOT use template variable syntax.** Skills run via prompt injection + tool calls — the agent reads plain-English fetch directives in the skill prompt and calls Composio integrations (or built-in `cf2_*` tools) live at runtime.

**Implication for this skill:**
- No `{integration.variable}` placeholders to map
- The skill prompt describes WHAT to fetch in plain English (see `ms-ai-prompt.md` → "DATA TO FETCH WHEN THIS SKILL RUNS" block)
- The agent figures out which Composio tool to call based on the directive
- Built-in tools (e.g., `cf2_list_contacts`) are referenced by name in the prompt
- Per-integration tool availability is a deployment concern (verify integrations are connected in MS AI before scheduling the routine)

**The fetch specifications above** describe the data shape the orchestrator expects back from each fetch. The agent translates "sum amount of charges where status=succeeded, created in last 7d" into the appropriate Composio Stripe tool call.

**For Claude Code (local) deployment:** the orchestrator uses available local MCPs where they exist (Google Calendar, ClickFunnels, yt-dlp for YouTube) and prompts for manual paste where they don't (Stripe, Calendly, Basecamp, Instagram).

---

## Failure Modes

| Scenario | Behavior |
|----------|----------|
| Integration API returns 4xx/5xx | Mark that source's variables as `null`, brief shows "data unavailable — manual update needed" for affected sections |
| Voice profile file missing | REPLY TO + CONTENT MOVE sections show "voice profile required" instead of fabricated drafts |
| Manual prompt skipped | Energy defaults to last-known value, open loops shows "none provided" |
| All integrations down | Auto-fall to `--manual` mode, prompt for all data as paste-in |

---

## Cost / Rate Limits Notes

- IG and YT APIs both have daily quotas — schedule the run for off-peak (5-7am coach's local time)
- Stripe + Calendly + ClickFunnels + Basecamp APIs have generous limits, no concerns at single-coach scale
- Google Calendar `events.list` is cheap, no concerns
- Voice profile loaded once per session — no API cost
- Counsel review runs in single LLM call (persona mode), not 6 parallel calls — keeps cost at ~1¢/run

Estimated cost per morning run: $0.01–$0.03 depending on context size and provider.
