const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const G = require('../gen-standards-map.js');

function tmpMoves(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gen-map-'));
  const dir = path.join(root, 'moves');
  fs.mkdirSync(dir);
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), body);
  return dir;
}

test('moveTypeOf reads move_type, CRLF-tolerant, skips absent', () => {
  assert.strictEqual(G.moveTypeOf('---\nmove_type: card\n---'), 'card');
  assert.strictEqual(G.moveTypeOf('---\r\nmove_type: hero\r\n---'), 'hero');
  assert.strictEqual(G.moveTypeOf('# no frontmatter'), null);
});

test('loadMoveTypes returns distinct sorted types, skips _index.md', () => {
  const dir = tmpMoves({
    'a.md': '---\nmove_type: card\n---', 'b.md': '---\nmove_type: hero\n---',
    'c.md': '---\nmove_type: card\n---', '_index.md': '---\nmove_type: nope\n---',
  });
  assert.deepStrictEqual(G.loadMoveTypes(dir), ['card', 'hero']);
});

test('buildMap assigns policy axes; scoped families differ from full', () => {
  const map = G.buildMap(['card', 'pip', 'skin', 'accent']);
  assert.deepStrictEqual(map.by_move_type.card, G.FULL);
  assert.deepStrictEqual(map.by_move_type.pip, ['animation', 'entrance', 'timing', 'layout']);
  assert.deepStrictEqual(map.by_move_type.skin, ['color', 'writing']);
  assert.deepStrictEqual(map.by_move_type.accent, ['animation', 'timing']);
  assert.deepStrictEqual(map.defaults, ['animation', 'timing', 'writing']);
});

test('buildMap FAILS LOUD on an un-policied move_type (L0-1 anti-drift)', () => {
  assert.throws(() => G.buildMap(['card', 'wormhole']), /no AXIS_POLICY for move_type\(s\): wormhole/);
});

test('serialize is deterministic: sorted keys, trailing newline', () => {
  const a = G.serialize(G.buildMap(['hero', 'card', 'pip']));
  const b = G.serialize(G.buildMap(['pip', 'card', 'hero']));
  assert.strictEqual(a, b);
  assert.ok(a.endsWith('\n'));
  const keys = Object.keys(JSON.parse(a).by_move_type);
  assert.deepStrictEqual(keys, keys.slice().sort());
});

test('generate over a temp library builds a full map', () => {
  const dir = tmpMoves({ 'card.md': '---\nmove_type: card\n---', 'q.md': '---\nmove_type: quote\n---' });
  const map = G.generate(dir);
  assert.ok(map.by_move_type.card && map.by_move_type.quote);
});

test('the LIVE library generates without throwing and covers every active move_type', () => {
  const movesDir = path.join(__dirname, '..', '..', 'moves-library');
  const types = G.loadMoveTypes(movesDir);
  const map = G.generate(movesDir); // throws if any type un-policied
  for (const t of types) assert.ok(map.by_move_type[t], `move_type ${t} missing from generated map`);
  assert.strictEqual(Object.keys(map.by_move_type).length, types.length);
});
