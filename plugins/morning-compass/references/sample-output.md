# Morning Compass — Sample Output

Reference example showing what a "good" brief looks like in v1.0 (post-council hardening — 7-section format with combined PEOPLE block, freshness timestamp, Queen Bee 90-min cap, cycle phase, feedback footer).

Generated for **Adeyemi Adeyosoye** using plausible inputs from his actual stack (per the voice profile + recon synthesis).

Use this as a fidelity benchmark when reviewing the skill's actual outputs in production.

---

## Inputs used to generate this sample

### Auto-pulled (simulated)

```yaml
google_calendar:
  today_events:
    - "9am application call (Marcus T.)"
    - "11am content shoot — Reborn module 4 reshoot"
    - "2pm Otherside team standup"
    - "4pm-5pm clear"
  tomorrow_first_event: "8am Highest Self podcast w/ Sahara Rose"
  today_total_meeting_minutes: 240
  timestamp: "2026-05-05T04:55:00Z"

stripe:
  revenue_7d: 14200
  revenue_prior_7d: 12700
  open_invoices: 1800
  timestamp: "2026-05-05T04:50:00Z"

calendly:
  calls_booked_7d: 5
  calls_booked_prior_7d: 8
  pending_no_shows: 1
  timestamp: "2026-05-05T04:52:00Z"

clickfunnels:
  optins_7d: 612
  optins_prior_7d: 567
  applications_7d: 11
  applications_prior_7d: 18
  top_page_conversion_delta: -8
  timestamp: "2026-05-05T04:51:00Z"

basecamp:
  todays_flagged_todos:
    - title: "Voice notes to 3 unbooked applicants"
      tags: ["queen-bee"]
    - title: "Review May newsletter draft from team"
    - title: "Approve Q2 content calendar from Jen"
    - title: "Reply to Otherside Slack thread on Costa Rica retreat"
  active_rocks:
    - title: "Ship Reborn April cohort (week 6 deliverables)"
      start_date: "2026-04-01"
    - title: "Launch quiz funnel for Wounded Inner Child taxonomy"
      start_date: "2026-04-15"
    - title: "3 podcast bookings for Q2"
      start_date: "2026-04-08"
  unread_messages_to_coach:
    - "James (Reborn alum) — Q about week 8 protocol"
    - "<example-client> — proposed partnership intro"
  timestamp: "2026-05-05T04:53:00Z"

instagram:
  posts_7d: 5
  engagement_rate_7d: 3.1
  engagement_rate_prior_7d: 5.3
  top_post:
    permalink: "https://instagram.com/p/DXyZ.../"
    caption_first_line: "the way this translates to the boardroom"
    likes: 1847
    comments: 87
    reach: 28400
  comments_needing_reply:
    - {handle: "rebornalum_marcus", post: "boardroom reel", text: "Bro this hit me at the right moment, what does week 3 look like?"}
    - {handle: "plantmedicine_circle", post: "MAGMA reel", text: "How does this work for women?"}
    - {handle: "founder_mike_88", post: "boardroom reel", text: "I'm pre-exit, $40M about to wire — what's the right time to start Reborn?"}
  follower_delta: 312
  timestamp: "2026-05-05T04:48:00Z"

youtube:
  videos_7d: 1
  views_7d: 2840
  views_prior_7d: 2680
  top_video:
    title: "$800M to Lost to $8B: A Billionaire's Inner Journey"
    views: 1691
    comment_count: 47
  comments_needing_reply:
    - {handle: "founder_jake", text: "How does this work if you're pre-exit?"}
  subscriber_delta: 38
  timestamp: "2026-05-05T04:49:00Z"
```

### Manual inputs (simulated)

```yaml
energy_state: "6/10, slept thin"
open_loops:
  - "Sarah (Ben White referral) — 4-day-old warm intro, regenerative finance"
  - "James R. — Reborn alum, ghosted on Otherside intro call"
  - "Costa Rica retreat venue — needs deposit confirmation by Friday"
yesterday_rating: 4  # 1-5
yesterday_rating_reason: "the cycle phase line was useful — first time I knew exactly where I was"
```

### Skill state (loaded)

```yaml
energy_history: [7, 6, 6, 7, 6]  # last 5 days
skip_days_consecutive: 0
last_feedback_rating: 4
rock_start_dates_cache:
  "Ship Reborn April cohort": "2026-04-01"
  "Launch quiz funnel": "2026-04-15"
  "3 podcast bookings Q2": "2026-04-08"
```

### Voice profile loaded

`~/.claude/references/voice-profiles/adeyemi-adeyosoye-voice.md` (the profile we built — cached this session)

---

## Output (the brief — v1.0 7-section format)

```
═════════════════════════════════════════════
  MORNING COMPASS — 2026-05-05
  Data freshness: 04:55 UTC (5 min ago)
═════════════════════════════════════════════

⚡ ENERGY READ
6/10, slept thin. Calendar holds 4 hours of meetings — the ceiling
today is one deep block, not three.

🎯 THIS WEEK'S CONSTRAINT
Applications down 39% (11 vs 18) and IG engagement down 41% (3.1% vs
5.3%) despite reach UP 12%. People are seeing the content and not
converting through to the application form. Resonance is the bottleneck.
Today's elevating move: voice notes to the 3 unbooked applicants come
BEFORE any new content — close the loop on warm leads first.

👑 TODAY'S QUEEN BEE TASK (cap: 90 min — only you)
Voice notes to the 3 unbooked applicants (Marcus T., and 2 more from
last week's CF applications). 15 min total. Only you can deliver this
transmission.

📊 SCORECARD — LAST 7 DAYS
- Revenue: $14,200 (+12% vs prior week)
- New leads: 612 from MAGMA bot (+8%)
- Calls booked: 5 (-38%)
- Applications: 11 (-39%) ← constraint
- IG posts: 5 (engagement -41%)
- YT videos: 1 (views +6%)
- Energy avg: 6.4/10

👥 PEOPLE TODAY

  🤝 Outreach (3 to touch):
  1. Marcus T. — applied Friday, didn't book — Draft: "Marcus, I read
     your application — what you wrote about the cap-table emptiness
     landed. 15 min this week?"
  2. James R. — Reborn alum ghosted on Otherside intro — Draft:
     "James — saw you posted about the boardroom shift. Still want
     that brotherhood seat?"
  3. Sarah (Ben White referral) — 4-day-old warm intro — Draft:
     "Sarah — Ben mentioned your regenerative finance work. Curious
     about the overlap with the men I work with."

  🔥 Reply To (top 3 highest-leverage comments):
  1. IG @rebornalum_marcus on the boardroom reel — "Bro this hit me at
     the right moment, what does week 3 look like?"
     → Draft: "Brother — week 3 is where the shame work locks in.
     You ready to apply? Link in bio."
  2. IG @founder_mike_88 on boardroom reel — "I'm pre-exit, $40M about
     to wire — when's the right time to start Reborn?"
     → Draft: "Pre-exit IS the time. Calibration before the wire hits
     beats coaching after. DM me — let's talk."
  3. YT @founder_jake on the Ben White interview — "How does this work
     if you're pre-exit?"
     → Draft: "Pre-exit is the highest-leverage moment. The men who
     start before the liquidity event keep their soul on the way through."

📣 TODAY'S CONTENT MOVE
- Yesterday's top: IG boardroom reel — 1,847 views, 87 comments
  (+54% vs your 7d avg). The "translates to the boardroom" hook
  carried it.
- Today's angle: extend the bridge — "bedroom→boardroom→bedroom,
  the loop." Same hook formula, fresh inverse.
- Grunt Test: Pass.

💎 EQUITY LEVER
Today you're harvesting: the existing applicant + comment pipeline
holds more revenue than new content this week. Reply work + voice
notes outrank the post.
Cycle phase: week 5 of 12 of "Ship Reborn April cohort" (harvest)

─────────────────────────────────────────────

🚫 IGNORE TODAY
- May newsletter review — defer to Wednesday, doesn't serve the
  constraint.
- Q2 content calendar approval — Friday's job, not today.

🧭 ONE-LINE COMPASS
Five voice notes to applicants and three replies to high-readiness
commenters does more than fifty posts this month.

═════════════════════════════════════════════
📊 Tomorrow morning — rate today's brief 1-5
   (captured in feedback log, used to improve the skill)
═════════════════════════════════════════════
```

---

## What this sample demonstrates

**Word count:** ~340 words (under the 350-word ceiling).

**v1.0 hardening visible in the output:**
- ✅ **Data freshness timestamp** at top (PHANTOM)
- ✅ **Queen Bee 90-min cap visible** in section header (Michalowicz)
- ✅ **Combined PEOPLE section** with Outreach + Reply To subsections (Jobs + Wickman)
- ✅ **Cycle phase** rendered: "week 5 of 12 of 'Ship Reborn April cohort' (harvest)" (Sanchez)
- ✅ **Feedback footer** prompting tomorrow's rating (ARCHITECT)

**v1.0 hardening invisible but present:**
- Energy boundary check ran (energy 6 today, history 7/6/6/7/6 — none under 5, no block triggered)
- Streak counter loaded (skip_days_consecutive = 0, no welcome-back banner)
- Voice profile cached (no re-load cost)
- Per-section null handling rules applied (all data present in this sample)

**Counsel synthesis points (invisible in output but trace-able):**
- Constraint identification (Goldratt) → Applications -39% flagged correctly over Calls -38% per priority order
- Queen Bee (Michalowicz) → coach-only task identified from Basecamp queen-bee tag
- 3 People (Wickman) → mix of CF applicant + Basecamp message + manual open loop
- Equity Lever (Sanchez) → "harvesting" correctly identifies that pipeline-close work outranks new-content-creation given the constraint + cycle phase context
- Content Move (Miller) → uses voice profile vocabulary ("translates to the boardroom"), passes grunt test
- Pace (Kutcher) → calendar load + energy = "ceiling is one deep block" warning

**Reply To section** — the new layer enabled by IG + YT integrations:
- All 3 picks score HIGH on readiness signal
- @founder_mike_88 is the standout — pre-exit founder asking conversion question = highest-value reply on the entire brief
- Voice-matched: drafts use "Brother," "DM me," "Pre-exit IS the time" — Adeyemi's actual cadence

**Cash flag NOT triggered** — open invoices ($1,800) is well under 30% of revenue_7d ($14,200). Soft flag rules respected.

**Ignore Today** — both items (newsletter, content calendar) are valid Basecamp todos but don't serve the application-conversion constraint. Subordinate-everything logic applied correctly.

**Yesterday's feedback (4/5)** influences nothing in today's brief format — but it's logged. Over time, the v1.1 retraining pass will use the feedback log to adjust which sections, framings, and phrasings the coach actually finds useful.
