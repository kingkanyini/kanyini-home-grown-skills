const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { renderIndex, indexHash, isStale, parseStandardFile, loadStandards } = require('../gen-standards-index.js');

const standards = [
  { id: 'animation', axis: 'animation', applies_to: ['all'], confidence: 'high', machineChecks: ['min-easings', 'seek-safety'], summary: 'the easing law' },
  { id: 'entrance', axis: 'entrance', applies_to: ['card', 'hero'], confidence: 'high', machineChecks: ['entrance-valid'], summary: 'POP vs SMOOTH' },
];

test('renders a generated-digest banner + one line per standard with machine checks', () => {
  const md = renderIndex(standards);
  assert.match(md, /GENERATED/);
  assert.match(md, /\[\[animation\]\]/);
  assert.match(md, /the easing law/);
  assert.match(md, /min-easings, seek-safety/); // machine checks surfaced
});

test('hash is stable for same content, changes when content changes', () => {
  const h1 = indexHash(standards);
  assert.strictEqual(h1, indexHash(standards.slice()));
  const h3 = indexHash([...standards, { id: 'x', axis: 'x', applies_to: [], confidence: 'low', machineChecks: [], summary: 's' }]);
  assert.notStrictEqual(h1, h3);
});

test('applies_to / machineChecks order does not change the hash', () => {
  const a = [{ id: 's', axis: 's', applies_to: ['a', 'b'], confidence: 'high', machineChecks: ['y', 'z'], summary: 'x' }];
  const b = [{ id: 's', axis: 's', applies_to: ['b', 'a'], confidence: 'high', machineChecks: ['z', 'y'], summary: 'x' }];
  assert.strictEqual(indexHash(a), indexHash(b));
});

test('a summary rewrite is detected as stale', () => {
  const md = renderIndex(standards);
  assert.strictEqual(isStale(md, standards), false);
  const edited = standards.map(s => s.id === 'animation' ? { ...s, summary: 'REWRITTEN' } : s);
  assert.strictEqual(isStale(md, edited), true);
});

test('a malformed hash comment is treated as stale (fail-safe)', () => {
  assert.strictEqual(isStale('<!-- index-hash: deadbeef -->', standards), true);
  assert.strictEqual(isStale('no hash here', standards), true);
});

test('parseStandardFile extracts frontmatter + H1 subtitle + machine checks', () => {
  const text = [
    '---', 'id: color', 'axis: color', 'applies_to: [card, hero]',
    'checks:',
    '  - { id: palette-member, rule: "x", machine: true }',
    '  - { id: two-tone, rule: "y", machine: false }',
    'confidence: high', '---', '',
    '# Color Standard — the allowed palette', 'body text',
  ].join('\n');
  const s = parseStandardFile(text);
  assert.strictEqual(s.id, 'color');
  assert.strictEqual(s.axis, 'color');
  assert.deepStrictEqual(s.applies_to, ['card', 'hero']);
  assert.deepStrictEqual(s.machineChecks, ['palette-member']); // only machine:true
  assert.strictEqual(s.summary, 'the allowed palette');
  assert.strictEqual(s.confidence, 'high');
});

test('loadStandards reads the live standards dir and skips _index.md', () => {
  const dir = path.join(__dirname, '..', '..', 'standards');
  const loaded = loadStandards(dir);
  const ids = loaded.map(s => s.id).sort();
  assert.deepStrictEqual(ids, ['animation', 'color', 'entrance', 'layout', 'timing', 'writing']);
  const anim = loaded.find(s => s.id === 'animation');
  assert.ok(anim.machineChecks.includes('min-easings'));
  assert.ok(anim.machineChecks.includes('seek-safety-runtime'));
});
