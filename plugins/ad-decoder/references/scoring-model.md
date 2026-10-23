# Scout Scoring Model — the IP (Ad Avengers-hardened, 8.7 → 9.0 closes)

> Canonical "winner" (Ad Avengers): *an ad surviving past the 60-day cull,
> pointing to a real offer, with a watchable hook, that fits this client's
> archetype.*

**Reality:** the public Meta Ad Library exposes **no spend / impressions / CTR**
for commercial ads. We score only on visible signals. All weights live in
`config.yaml → scoring.weights` (tunable). Composite ∈ [0, 1].

## The four signals

### 1. Longevity — dominant (~0.50)
`days_active = today − ad_delivery_start` for currently-active ads. The one
signal the library gives straight, and the strongest proxy: advertisers kill
losers fast (≈90% of ads die in 60 days).

Thresholds are **real numbers per brand-preset** (`config.yaml →
brand_presets.<preset>.longevity`), NOT calendar-fixed:
- `high-ticket-coaching`: strong=45, unicorn=90
- `low-ticket-dtc` (example): strong=21, unicorn=45

Sub-score curve: `0` at 0 days → `0.6` at `strong` → `1.0` at `unicorn`,
clamped at 1.0 beyond. A 60-day flash-sale ad and a 60-day evergreen coaching
ad are scored against **their own** preset.

### 2. Same-concept variant count — capped (~0.20)
**Cluster first, then count within a concept cluster, capped.** Raw variant
count is post-Andromeda-inverted (a pile of variants is as likely panic-thrash
as scaling) — so we only reward variants of *one proven concept*.

`variant_subscore = min(variant_count_in_cluster, variant_cap) / variant_cap`
(`variant_cap` default 5). A big-budget spammer with 30 unrelated ads can't
out-rank a quiet long-running winner.

Clustering rule (implemented in `cluster_concepts.py`):
- **Primary key = normalized destination URL** — strip scheme, `www.`, query
  string (UTM etc.), fragment, trailing slash. Two ads to `site.com/offer?utm=a`
  and `site.com/offer?utm=b` are the **same** concept.
- Ads sharing **no** URL merge only if their **normalized offer string**
  (headline+primary-text, lowercased, stop-stripped) matches. (Embedding cosine
  deferred to v1.1.)
- **Conflict precedence:** same URL + different hook = **same** cluster (variant
  scaling). Different URL + same hook = **separate** unless offer string matches.
- **Search-mode awareness:** in `keyword` (concept-hunt) mode the cluster key
  operates **cross-advertiser** (one concept spans advertisers); in `advertiser`
  mode it is within-advertiser.

### 3. Scroll-stop / first-frame pass — (~0.20) with a soft-floor veto
Cheap creative check in the scan-all tier on the first frame + first 3s, scored
against a **fixed rubric** (determinism — two runs score the same):

| Component | Points | What earns them |
|---|---|---|
| motion | 0-3 | static=0 · subtle=1 · active=2 · fast-cut/dynamic=3 |
| face | 0-2 | none=0 · present=1 · close-up-eye-contact=2 |
| text_hook | 0-3 | none=0 · small caption=1 · bold overlay=2 · full-screen hook line=3 |
| pattern_interrupt | 0-2 | none=0 · mild=1 · strong (unexpected open)=2 |

`scroll_stop_subscore = total / 10`.

**Soft-floor veto:** if an ad's scroll-stop is in the **bottom quartile**
(`scroll_stop_floor_pct`, default 25) of the batch, its **composite is capped**
at `scroll_stop_floor_cap` (default **0.45 — deliberately below longevity's 0.5
ceiling**, so no run-time can lift a dead-frame ad above a watchable peer).
Kills "90-day dead-frame out-ranks a 35-day killer hook".

### 4. Region breadth — (~0.10), advertiser-size-normalized
Running across multiple country libraries costs real money → spend-confidence
proxy. `region_subscore = min(region_count, region_cap) / region_cap`, capped so
a global mega-brand running in 40 countries by default doesn't re-become a
"big budget" proxy. **Placement breadth is dropped** as a core signal (it's
mostly an Advantage+ default artifact).

## Composite + fit gate

```
composite = Σ (weightᵢ × subscoreᵢ)
if scroll_stop in bottom quartile: composite = min(composite, floor_cap)
```

**Client-fit gate (Kusmich) — applied before ranking, flag-not-rank:** each ad
is normalized against the active brand-preset (offer_type, price_band,
platforms). A mismatched-archetype outlier is **flagged** (`fit_ok=false` +
`fit_note`) and sorted below fit ads — never silently dropped, never ranked as
a transferable winner. Output = "winners that transfer to THIS client."
