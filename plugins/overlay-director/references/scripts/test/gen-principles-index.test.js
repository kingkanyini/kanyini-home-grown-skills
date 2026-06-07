const { test } = require('node:test');
const assert = require('node:assert');
const { renderIndex, indexHash, isStale } = require('../gen-principles-index.js');

const notes = [
  { slug: 'overlay-densify-keyframes-before-render', title: 'Densify keyframes before render', summary: 'Sparse keyframes cause stalls.', affects: ['render.keyframes'] },
  { slug: 'overlay-bake-position-via-left-top-not-translate', title: 'Bake position via left/top', summary: 'GSAP wipes translate.', affects: ['placement.bake'] },
];

test('renders a generated-digest banner + one line per note', () => {
  const md = renderIndex(notes);
  assert.match(md, /GENERATED/);
  assert.match(md, /overlay-densify-keyframes-before-render/);
  assert.match(md, /GSAP wipes translate/);
  assert.match(md, /placement\.bake/); // affects axis surfaced
});

test('hash is stable for same content, changes when content changes', () => {
  const h1 = indexHash(notes);
  const h2 = indexHash(notes.slice());
  assert.strictEqual(h1, h2);
  const h3 = indexHash([...notes, { slug: 'x', title: 'X', summary: 'y', affects: [] }]);
  assert.notStrictEqual(h1, h3);
});

test('isStale true when embedded hash differs from recomputed', () => {
  const md = renderIndex(notes);
  assert.strictEqual(isStale(md, notes), false);
  assert.strictEqual(isStale(md, [...notes, { slug: 'z', title: 'Z', summary: 'q', affects: [] }]), true);
});

test('affects order does not change the hash (no false staleness)', () => {
  const a = [{ slug: 's', title: 'T', summary: 'x', affects: ['a', 'b'] }];
  const b = [{ slug: 's', title: 'T', summary: 'x', affects: ['b', 'a'] }];
  assert.strictEqual(indexHash(a), indexHash(b));
});

test('a note BODY rewrite (summary unchanged) is detected as stale', () => {
  const withBody = [{ slug: 's', title: 'T', summary: 'same', affects: [], body: 'original guidance' }];
  const md = renderIndex(withBody);
  assert.strictEqual(isStale(md, withBody), false);
  const edited = [{ slug: 's', title: 'T', summary: 'same', affects: [], body: 'REWRITTEN guidance' }];
  assert.strictEqual(isStale(md, edited), true);
});

test('a malformed/truncated hash comment is treated as stale (fail-safe)', () => {
  assert.strictEqual(isStale('<!-- index-hash: deadbeef -->', notes), true); // too short
  assert.strictEqual(isStale('no hash here', notes), true);
});
