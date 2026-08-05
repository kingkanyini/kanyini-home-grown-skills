const C = require('./constants.js');
const { distinctEaseFamilies } = require('./ease-extract.js'); // shared easing extractor (L0-6 / L1-1) — one source of truth

function round2(x) { return Number(x.toFixed(2)); }

// libraryTypeCount = number of distinct ACTIVE move_types available in the library.
// D is normalized against min(N, libraryTypeCount) so a long, well-varied video that
// cycles the whole library scores high instead of being structurally penalized by raw
// distinct/N (Visual Visionary #26 craft fix). Omit libraryTypeCount -> falls back to N
// (original behavior) so callers without library context still get a sane number.
function varietyScore(moments, durationS, libraryTypeCount) {
  const N = moments.length;
  if (N === 0) return { variety_score: 1, D: 1, R: 1, W: 1 };

  // D — type diversity, normalized against the achievable ceiling
  const distinct = new Set(moments.map(m => m.move_type)).size;
  const ceiling = Math.max(1, Math.min(N, libraryTypeCount || N));
  const D = N <= 1 ? 1 : Math.min(1, distinct / ceiling);

  // R — run discipline (no same move_type within RUN_WINDOW consecutive, unless hero)
  let violations = 0;
  for (let i = 1; i < N; i++) {
    if (moments[i].hero) continue;
    const back = Math.max(0, i - (C.RUN_WINDOW - 1));
    for (let j = back; j < i; j++) {
      if (moments[j].move_type === moments[i].move_type) { violations++; break; }
    }
  }
  const R = N <= 1 ? 1 : 1 - violations / (N - 1);

  // W — window diversity over non-overlapping WINDOW_S buckets by t_start
  const buckets = new Map();
  for (const m of moments) {
    const k = Math.floor((m.t_start || 0) / C.WINDOW_S);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(m);
  }
  let eligible = 0, diverse = 0;
  for (const arr of buckets.values()) {
    if (arr.length >= 2) {
      eligible++;
      if (new Set(arr.map(m => m.move_type)).size >= 2) diverse++;
    }
  }
  const W = eligible === 0 ? 1 : diverse / eligible;

  return {
    variety_score: round2(C.W_DIVERSITY * D + C.W_RUN * R + C.W_WINDOW * W),
    D, R, W,
  };
}

function top3ShareBy(moments, key) {
  const N = moments.length;
  if (N === 0) return 0;
  const counts = {};
  for (const m of moments) counts[m[key]] = (counts[m[key]] || 0) + 1;
  const top3 = Object.values(counts).sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);
  return round2(top3 / N);
}

// move_id share — the specific-move metric stored as plan.top3_move_share.
function top3MoveShare(moments) { return top3ShareBy(moments, 'move_id'); }
// move_type share — the FAMILY-level metric calcification is judged on ("the library is
// getting samey" is a family concern, not a specific-move one — Visual Visionary #26).
function top3TypeShare(moments) { return top3ShareBy(moments, 'move_type'); }

// Single calcification predicate. Gated on N so short plans (where top-3 trivially
// exceeds the threshold) don't false-positive. Judge on the move_type share.
function isCalcified(typeShare, n) {
  return n >= C.CALCIFICATION_MIN_N && typeShare > C.CALCIFICATION_FLAG;
}

// Legibility guard: the most cards live simultaneously (using [t_start, t_end]).
function maxConcurrentCards(moments) {
  const events = [];
  for (const m of moments) {
    if (m.t_start == null || m.t_end == null) continue;
    events.push([m.t_start, 1], [m.t_end, -1]);
  }
  // exits before entrances at the same instant so back-to-back cards aren't counted as overlapping
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let cur = 0, max = 0;
  for (const [, d] of events) { cur += d; if (cur > max) max = cur; }
  return max;
}
// True when more than MAX_CONCURRENT_CARDS overlays are on screen at once (mobile illegibility).
function concurrencyFlag(moments) { return maxConcurrentCards(moments) > C.MAX_CONCURRENT_CARDS; }

// ── MOTION VARIETY (Layer 1) ──────────────────────────────────────────────
// The "generic" diagnosis (motion-grammar-spec Part 1) was: everything on power2.out,
// one entrance flavor. HyperFrames' rule is ">=3 distinct easings/video or it reads
// monotone." These pure helpers let Phase 3 / standards-check count easing + entrance-
// mechanism variety across a plan and flag a monotone build BEFORE build cost.

// Gather the raw ease STRINGS a plan's moments carry. A moment may carry easings explicitly
// (m.easings[] — the builder's set), or per-axis (m.ease / m.entrance_ease / m.exit_ease), or
// only an archetype, from which the house entrance ease is derived (POP vs SMOOTH). This is the
// moment-DOMAIN collector (moments are plan objects, not impl HTML); family NORMALIZATION and
// distinct-counting are delegated to the shared ease-extract util (L1-1 / L0-6) so this module and
// standards-check.js can never drift on "how many distinct easings."
function collectEaseStrings(moments) {
  const out = [];
  for (const m of moments) {
    if (Array.isArray(m.easings)) for (const e of m.easings) { if (e) out.push(e); }
    if (m.ease) out.push(m.ease);
    if (m.entrance_ease) out.push(m.entrance_ease);
    if (m.exit_ease) out.push(m.exit_ease);
    // derive the entrance ease from the archetype only when no explicit entrance ease was given
    if (!m.ease && !m.entrance_ease && m.entrance_archetype) {
      out.push(m.entrance_archetype === 'POP' ? C.ENTRANCE_POP_EASE : C.ENTRANCE_SMOOTH_EASE);
    }
  }
  return out;
}
// Distinct easing FAMILIES across the plan (back.out(1.4) / back.out(2.5) collapse to one 'back'
// family) — families, not raw strings, are what MIN_DISTINCT_EASINGS gates on. Counting strings
// would launder the exact monotony the floor exists to catch (PHANTOM#3). Delegated to ease-extract.
function distinctEasings(moments) { return distinctEaseFamilies(collectEaseStrings(moments)).length; }

// Distinct entrance MECHANISMS (the MOVE, not the feel): FADE|ZOOM-IN|SCALE-POP|RISE|
// SLIDE|DRAW|BLUR-STREAK|CLIP-REVEAL. Half-identical opacity fades read the same even when
// the move_type differs (Part 1), so mechanism diversity is a second, orthogonal lever.
function distinctMechanisms(moments) {
  const set = new Set();
  for (const m of moments) { if (m.entrance_mechanism) set.add(m.entrance_mechanism); }
  return set.size;
}

// The monotone flag: fewer than MIN_DISTINCT_EASINGS distinct eases across the plan.
// Gated on N so a 1-2 card plan (which can't physically carry 3 eases) never false-flags.
function belowMinEasings(moments) {
  return moments.length >= C.MIN_DISTINCT_EASINGS && distinctEasings(moments) < C.MIN_DISTINCT_EASINGS;
}

// One call for Phase 3 / standards-check: the motion-variety facet of a plan.
function motionVariety(moments) {
  return {
    distinct_easings: distinctEasings(moments),
    distinct_mechanisms: distinctMechanisms(moments),
    below_min_easings: belowMinEasings(moments),
    min_distinct_easings: C.MIN_DISTINCT_EASINGS,
  };
}

module.exports = {
  varietyScore, top3MoveShare, top3TypeShare, isCalcified, maxConcurrentCards, concurrencyFlag,
  collectEaseStrings, distinctEasings, distinctMechanisms, belowMinEasings, motionVariety,
};
