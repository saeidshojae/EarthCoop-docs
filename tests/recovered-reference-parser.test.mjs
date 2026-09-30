import assert from 'node:assert/strict';
import test from 'node:test';

import { parseRecoveredReferenceStructure } from '../scripts/generate-legacy-docs-center-data.mjs';

const markdown = `---\ntitle: x\n---\n\n# ECON-REF-01 — سند مرجع\n\n# بخش اول — هویت\n\nمقدمه بخش.\n\n## ۱.۱ — ماهیت سند\n\nمتن یکتای ماهیت.\n\n## ۱.۲ — سلسله‌مراتب\n\nمتن یکتای سلسله.\n\n# بخش دوم — مدل\n\n## ۲.۱ — انسان\n\nمتن یکتای انسان.`;

test('builds a heading tree and keeps child body text out of parent bodies', () => {
  const result = parseRecoveredReferenceStructure(markdown);
  assert.equal(result.provisions.length, 2);
  assert.equal(result.provisions[0].title, 'بخش اول — هویت');
  assert.equal(result.provisions[0].body, 'مقدمه بخش.');
  assert.deepEqual(result.provisions[0].children.map((item) => item.stableSlug), ['section-1-1','section-1-2']);
  assert.equal(result.provisions[0].children[0].body, 'متن یکتای ماهیت.');
  assert.doesNotMatch(result.provisions[0].body, /متن یکتای ماهیت|متن یکتای سلسله/);
  assert.equal(result.provisions[1].children[0].stableSlug, 'section-2-1');
});

test('every reference body fragment appears only once across the tree', () => {
  const result = parseRecoveredReferenceStructure(markdown);
  const flatten = (nodes) => nodes.flatMap((node) => [node, ...flatten(node.children || [])]);
  const bodies = flatten(result.provisions).map((item) => item.body).join('\n');
  assert.equal((bodies.match(/متن یکتای ماهیت/g) || []).length, 1);
  assert.equal((bodies.match(/متن یکتای سلسله/g) || []).length, 1);
  assert.equal((bodies.match(/متن یکتای انسان/g) || []).length, 1);
});
