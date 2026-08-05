// Pinned heuristic constants for overlay-director. Single source of truth.
// Documented in references/density-modes.md and workflow.md; scripts import from here.
module.exports = {
  // Phase 0.5 preflight
  SCRATCH_SIZE_FACTOR: 1.3,          // densified scratch ~= source bytes * this
  TRANSCRIPT_WPS_MIN: 1.0,           // words/sec sanity floor (flag below)
  TRANSCRIPT_WPS_MAX: 4.5,           // words/sec sanity ceiling (flag above)
  TRANSCRIPT_SILENT_GAP_S: 25,       // flag silent gaps longer than this

  // Variety Engine (Phase 3)
  RUN_WINDOW: 3,                     // no same move_type within this many consecutive cards (unless hero)
  WINDOW_S: 90,                      // diversity window size in seconds
  CALCIFICATION_FLAG: 0.60,          // flag if top-3 move_type share exceeds this
  CALCIFICATION_MIN_N: 8,            // don't evaluate calcification below this card count (short plans false-positive)
  MAX_CONCURRENT_CARDS: 2,           // legibility: flag when more than this many cards are live at once

  // variety_score weights (pinned so two implementers get the same number)
  W_DIVERSITY: 0.4,                  // D weight
  W_RUN: 0.3,                        // R weight
  W_WINDOW: 0.3,                     // W weight

  // Timing discipline (Phase 3) — recalibrated for glanceable mobile overlay legibility
  // (Visual Visionary #26, Milestone-1 craft review): 3.0 wps (180 wpm) is too fast for
  // overlay copy competing with a talking head; 2.5 wps (~150 wpm) + a hold ceiling.
  LEAD_IN_S: 0.4,                    // card enters this long before its anchor
  WORDS_PER_SECOND_READ: 2.5,        // hold = clamp(words/this, MIN_HOLD_S, MAX_HOLD_S)
  MIN_HOLD_S: 2.5,                   // floor (short labels still need a glance budget on mobile)
  MAX_HOLD_S: 4.5,                   // ceiling — longer copy must split into sequential cards, not dwell

  // Render fidelity (Phase 8)
  FREEZE_TOLERANCE: 0.0,             // rendered frozen% must be <= source frozen% + this
  FREEZE_DETECT_NOISE: '-60dB',      // ffmpeg freezedetect noise floor (pinned so frozen% is reproducible)
  FREEZE_DETECT_DURATION_S: 2,       // ffmpeg freezedetect min freeze duration

  // Knowledge index (Phase 0.5)
  INDEX_HASH_LEN: 16,                // staleness-hash truncation length (collision surface — keep visible)

  // Scratch lifecycle (Phase 9 / cleanup)
  SCRATCH_RETENTION_DAYS: 7,         // orphaned scratch older than this flagged on next run

  // Scratch purge (clean-scratch.js) — "heavy files only" sweep. These are large, fully
  // regenerable build artifacts. Everything NOT matched here is kept (deny-list, not allow-list),
  // so the final render, generated art, plans, transcripts, and .git always survive.
  PURGE_HEAVY_DIRS: ['frames', 'fullqc'],            // frame dumps + QC frame grabs
  PURGE_CACHE_DIRS: ['.thumbnails', '.waveform-cache'], // studio/editor caches
  PURGE_FILE_PATTERNS: [             // top-level files matched case-insensitively (RegExp source strings)
    'densified.*\\.mp4$',            // densified working copy of the source (the big one)
    '\\.log$',                       // densify/render/preview logs
    '^contact-sheet.*\\.png$',       // QC contact sheet
    '^audio16k.*\\.mp3$',            // intermediate 16k transcription audio
  ],
  PURGE_PROTECT: ['renders', 'assets', '.git'], // never deleted, even if a future pattern matches

  // Learning loop (Phase 9)
  SYSTEMATIC_DELTA_CARDS: 3,         // same transform on >= this many cards => systematic
  GLOBAL_PROMOTION_VIDEOS: 3,        // principle validates across >= this many videos => propose global

  // ── MOTION UPGRADE (Layers 0–3) ─────────────────────────────────────────────
  // Standards backbone (Layer 0)
  MIN_DISTINCT_EASINGS: 3,           // a build using fewer distinct GSAP eases reads monotone -> flag
  STANDARDS_INDEX_HASH_LEN: 16,      // STANDARDS-INDEX staleness hash (mirror of INDEX_HASH_LEN)

  // Entrance archetypes (the "feel") — POP = "MTV pop", SMOOTH = premium settle
  ENTRANCE_POP_EASE: 'back.out(1.4)',   // slight overshoot; keep <= back.out(1.7)
  ENTRANCE_POP_DUR: [0.35, 0.5],        // [min, max] seconds
  ENTRANCE_SMOOTH_EASE: 'power3.out',   // long-tail settle, NO overshoot (house default)
  ENTRANCE_SMOOTH_DUR: [0.4, 0.7],
  SCALE_POP_FROM_SMOOTH: 0.9,           // inner scale start for SMOOTH scale-pop
  SCALE_POP_FROM_POP: 0.8,              // inner scale start for POP scale-pop (bigger travel)

  // Between-card handoff (Layer 1) — kill the "jump cut with a dip"
  TRANSITION_OVERLAP_S: 0.15,           // outgoing card and incoming card share this much time

  // Seek-safe velocity-blur (Layer 1) — ghost-echo recipe (NEVER a filter tween)
  BLUR_GHOST_COUNT: 3,                  // opacity-decaying transform echoes
  BLUR_GHOST_STEP_PX: 14,               // per-echo offset along motion axis

  // Draw-board (Layer 2)
  DRAW_SECONDARY_LAG_S: 0.22,           // 2nd (thin) stroke pass starts this long after the 1st
  DRAW_SECONDARY_DUR_FACTOR: 0.8,       // 2nd pass draws at this fraction of the 1st pass duration
  DRAWBOARD_WRITE_ON_WPS: 2.2,          // handwritten text reveals ~1 word / 0.45s (speech-synced)
  DRAWBOARD_INK: '#3B9BE8',             // primary sky-blue marker (Ali reference, pixel-verified)
  DRAWBOARD_HL_YELLOW: '#F2D021',       // fat translucent highlighter / lasso
  DRAWBOARD_GREEN: '#3FBF52',           // positive: boxes, underlines, checks
  DRAWBOARD_RED: '#E24B3A',             // negative: hatching / strike

  // Broadcast card system (Layer 3)
  CARD_LIME: '#C6F94E',                 // two-tone accent (operational/active)
  CARD_TEAL: '#4FD6C8',                 // callout secondary
  CARD_AMBER: '#F5A623',                // warning

  // Pre-audited motion literals (v2 hardening, CONDUIT#4 — promote hardcoded impl values here)
  // Motion-Craft counsel v1.1 (Rauno hardening — overlapping action + dissolve depth)
  ENTRANCE_STAGGER_S: 0.1,              // SMOOTH entrances: scale-settle starts this long after fade (breaks the synchronized single-window -> overlapping action)
  TRANSITION_OVERLAP_BLUR_S: 0.3,       // blur-crossfade co-visibility (longer dissolve for the premium default); zoom-through keeps the tighter TRANSITION_OVERLAP_S

  GLOW_BLOOM_PEAK: 0.45,                // ambient glow-bloom max opacity behind hero cards
  KINETIC_SLIDE_FROM_PX: 80,            // per-word kinetic typography: initial slide offset
  KINETIC_SLIDE_TO_PX: 12,             // ...decays to this near settle (camera-settling feel)
  KENBURNS_AMP: 0.03,                   // sine Ken-Burns idle scale amplitude on held images
  CLIP_REVEAL_DUR: 1.0,                 // clip-path iris/inset reveal duration
};
