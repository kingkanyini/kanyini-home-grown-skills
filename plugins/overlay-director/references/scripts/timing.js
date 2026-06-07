const C = require('./constants.js');

// Pinned hold-time for a card's copy. clamp(words / WPS, MIN_HOLD, MAX_HOLD).
// Copy whose natural read-time exceeds MAX_HOLD_S should be SPLIT into sequential
// cards rather than left to dwell — see needsSplit().
function holdTime(wordCount) {
  const raw = (wordCount || 0) / C.WORDS_PER_SECOND_READ;
  return Math.min(C.MAX_HOLD_S, Math.max(C.MIN_HOLD_S, Number(raw.toFixed(2))));
}

// True when copy is long enough that a single card would blow past the dwell ceiling.
function needsSplit(wordCount) {
  return (wordCount || 0) / C.WORDS_PER_SECOND_READ > C.MAX_HOLD_S;
}

module.exports = { holdTime, needsSplit };
