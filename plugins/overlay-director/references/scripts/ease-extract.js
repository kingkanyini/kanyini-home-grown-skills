// Shared easing extractor — single source of truth for "how many distinct easings".
// Imported by BOTH standards-check.js (min-easings) and variety-score.js (motion variety),
// so the two can never drift (CONDUIT#3 / CIPHER#8 hardening). Pure, no deps.
//
// Counts easing FAMILIES, not raw strings: back.out(1.2)/back.out(1.4)/back.out(1.6) are
// three strings but ONE monotone bounce family — counting strings would pass the exact
// monotony min-easings exists to catch (PHANTOM#3). Reads eases from impl HTML literals
// (impls can't require() constants, so eases are literal strings there).

const EASE_LITERAL = /ease\s*:\s*['"]([^'"]+)['"]/g;

// All GSAP ease literals in a chunk of impl HTML/JS, in order.
function extractEases(html) {
  const out = [];
  if (!html) return out;
  const re = new RegExp(EASE_LITERAL.source, 'g');
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

// Normalize an ease string to its family: 'back.out(1.4)' -> 'back', 'power3.out' -> 'power3',
// 'none' -> 'none', 'steps(3)' -> 'steps'. Case-insensitive.
function easeFamily(ease) {
  if (!ease) return null;
  const base = String(ease).trim().replace(/\(.*\)\s*$/, ''); // drop (params)
  const fam = base.split('.')[0];                              // drop .out/.inOut
  return fam ? fam.toLowerCase() : null;
}

// Families present (array in, or HTML in), with nulls dropped.
function easeFamilies(htmlOrArray) {
  const eases = Array.isArray(htmlOrArray) ? htmlOrArray : extractEases(htmlOrArray);
  return eases.map(easeFamily).filter(Boolean);
}

// Distinct families (the number min-easings gates on).
function distinctEaseFamilies(htmlOrArray) {
  return [...new Set(easeFamilies(htmlOrArray))];
}

// Fraction of eases in a bounce-y family (back/bounce/elastic) — feeds the "too much bounce"
// advisory. POP-archetype moves are exempted by the caller, not here.
function bounceShare(htmlOrArray) {
  const fams = easeFamilies(htmlOrArray);
  if (!fams.length) return 0;
  const bouncy = fams.filter((f) => f === 'back' || f === 'bounce' || f === 'elastic').length;
  return bouncy / fams.length;
}

module.exports = { extractEases, easeFamily, easeFamilies, distinctEaseFamilies, bounceShare };
