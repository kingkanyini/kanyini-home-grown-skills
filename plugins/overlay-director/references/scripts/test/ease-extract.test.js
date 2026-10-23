const test = require('node:test');
const assert = require('node:assert');
const { extractEases, easeFamily, easeFamilies, distinctEaseFamilies, bounceShare } = require('../ease-extract.js');

test('extractEases pulls all ease literals in order', () => {
  const html = `tl.to(x,{ease:'power3.out'},0); tl.to(y,{ease:"back.out(1.4)"},1);`;
  assert.deepStrictEqual(extractEases(html), ['power3.out', 'back.out(1.4)']);
});

test('extractEases empty/undefined -> []', () => {
  assert.deepStrictEqual(extractEases(''), []);
  assert.deepStrictEqual(extractEases(undefined), []);
});

test('easeFamily strips params and suffix', () => {
  assert.strictEqual(easeFamily('back.out(1.4)'), 'back');
  assert.strictEqual(easeFamily('power3.out'), 'power3');
  assert.strictEqual(easeFamily('steps(3)'), 'steps');
  assert.strictEqual(easeFamily('none'), 'none');
  assert.strictEqual(easeFamily('Power2.InOut'), 'power2');
});

test('distinct families collapse bounce variants to ONE (the monotony trap)', () => {
  const eases = ['back.out(1.2)', 'back.out(1.4)', 'back.out(1.6)'];
  assert.strictEqual(distinctEaseFamilies(eases).length, 1); // NOT 3
});

test('distinct families counts real variety', () => {
  const eases = ['power3.out', 'back.out(1.4)', 'sine.inOut', 'none'];
  assert.strictEqual(distinctEaseFamilies(eases).length, 4);
});

test('easeFamilies from HTML', () => {
  const html = `{ease:'power3.out'} ... {ease:'sine.inOut'}`;
  assert.deepStrictEqual(easeFamilies(html), ['power3', 'sine']);
});

test('bounceShare', () => {
  assert.strictEqual(bounceShare(['back.out(1.4)', 'power3.out']), 0.5);
  assert.strictEqual(bounceShare(['power3.out', 'sine.inOut']), 0);
  assert.strictEqual(bounceShare([]), 0);
});
