// gen-standards-map.js — GENERATES standards.map.json from moves-library frontmatter (L0-1).
// The map keys are real move_type FAMILIES (card, hero, quote, headline, chart, pip, skin, ...),
// harvested from every active move's `move_type:` frontmatter, so the key-space can never drift
// from the library. The axis VALUES come from AXIS_POLICY below (the L0-owned decision of which
// standards govern each family). A move_type with no policy entry is a HARD generation error —
// forcing an explicit axis decision for any new family instead of silently under-checking it.
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_MOVES_DIR = path.join(__dirname, '..', 'moves-library');
const DEFAULT_MAP_PATH = path.join(__dirname, '..', 'standards', 'standards.map.json');

const FULL = ['animation', 'color', 'entrance', 'timing', 'writing', 'layout'];

// move_type family -> governing standard axes. Full visual card/hero families + the new
// card-system families + draw-board get the full six; the rest are scoped per L0-1.
const AXIS_POLICY = {
  // legacy + new visual card families (full six)
  card: FULL, hero: FULL, image: FULL, split: FULL, stack: FULL,
  riser: FULL, 'lower-third': FULL, pill: FULL,
  'draw-board': FULL, headline: FULL, chart: FULL, pipeline: FULL,
  callout: FULL, lane: FULL, grid: FULL, timeline: FULL,
  // scoped families
  quote: ['animation', 'color', 'entrance', 'timing', 'writing'], // frame-centered, no layout shift
  spotlight: ['animation', 'color', 'timing', 'layout'],           // held illumination, no discrete entrance
  'caption-track': ['animation', 'timing', 'writing'],             // persistent baseline track
  accent: ['animation', 'timing'],                                 // seasoning; minimal copy/color
  pip: ['animation', 'entrance', 'timing', 'layout'],              // footage reframe, no copy/color of its own
  skin: ['color', 'writing'],                                      // shared look tokens (art-direction)
};

const DEFAULTS = ['animation', 'timing', 'writing'];

// Read `move_type:` from a move .md frontmatter block. CRLF-tolerant (legacy files are CRLF,
// newer ones LF). Returns null if absent.
function moveTypeOf(text) {
  const norm = String(text).replace(/\r\n/g, '\n');
  const fm = norm.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(/^move_type:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

// Distinct, sorted active move_types found in the library.
function loadMoveTypes(movesDir) {
  const types = new Set();
  for (const f of fs.readdirSync(movesDir)) {
    if (!f.endsWith('.md') || f === '_index.md') continue;
    const mt = moveTypeOf(fs.readFileSync(path.join(movesDir, f), 'utf8'));
    if (mt) types.add(mt);
  }
  return [...types].sort();
}

// Build the map object from move_types; throws (fail-loud) on any un-policied family.
function buildMap(moveTypes) {
  const unpolicied = moveTypes.filter(t => !AXIS_POLICY[t]);
  if (unpolicied.length) {
    throw new Error(`gen-standards-map: no AXIS_POLICY for move_type(s): ${unpolicied.join(', ')} — decide their governing axes before regenerating the map`);
  }
  const by_move_type = {};
  for (const t of moveTypes) by_move_type[t] = AXIS_POLICY[t].slice();
  return { version: 1, defaults: DEFAULTS.slice(), by_move_type };
}

// Deterministic serialization: sorted move_type keys, 2-space indent, trailing newline.
function serialize(map) {
  const ordered = { version: map.version, defaults: map.defaults, by_move_type: {} };
  for (const k of Object.keys(map.by_move_type).sort()) ordered.by_move_type[k] = map.by_move_type[k];
  return JSON.stringify(ordered, null, 2) + '\n';
}

function generate(movesDir = DEFAULT_MOVES_DIR) {
  return buildMap(loadMoveTypes(movesDir));
}

module.exports = { AXIS_POLICY, DEFAULTS, FULL, moveTypeOf, loadMoveTypes, buildMap, serialize, generate };

// CLI: node gen-standards-map.js [movesDir] [--write [mapPath]] [--check [mapPath]]
if (require.main === module) {
  const args = process.argv.slice(2);
  const positional = args.filter(a => !a.startsWith('--'));
  const movesDir = positional[0] || DEFAULT_MOVES_DIR;
  const flagVal = (name, dflt) => {
    const i = args.indexOf(name);
    if (i < 0) return null;
    const nxt = args[i + 1];
    return (nxt && !nxt.startsWith('--')) ? nxt : dflt;
  };
  let out;
  try {
    out = serialize(generate(movesDir));
  } catch (err) {
    process.stderr.write(`${err.message}\n`);
    process.exit(2);
  }
  if (args.includes('--check')) {
    const mapPath = flagVal('--check', DEFAULT_MAP_PATH);
    const current = fs.existsSync(mapPath) ? fs.readFileSync(mapPath, 'utf8') : '';
    if (current !== out) {
      process.stderr.write(`standards.map.json is STALE vs moves-library frontmatter — run gen-standards-map.js --write\n`);
      process.exit(1);
    }
    process.stdout.write('standards.map.json is up to date\n');
    process.exit(0);
  }
  if (args.includes('--write')) {
    const mapPath = flagVal('--write', DEFAULT_MAP_PATH);
    fs.writeFileSync(mapPath, out);
    process.stderr.write(`wrote ${mapPath}\n`);
    process.exit(0);
  }
  process.stdout.write(out);
}
