import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const inventory = JSON.parse(await readFile('audits/product-guides/2026-09-28-inventory.json', 'utf8'));
const evidence = JSON.parse(await readFile('audits/product-guides/2026-09-28-evidence.json', 'utf8'));

test('final product-guide inventory is 31 reviewed pages with no scanner-known legacy or sensitive claims', () => {
  assert.equal(inventory.pages.length, 31);
  for (const page of inventory.pages) {
    assert.deepEqual(page.legacyTerms, [], `${page.path} still contains a scanner-known legacy term`);
    assert.deepEqual(page.sensitiveClaims, [], `${page.path} still contains a scanner-known sensitive capability claim`);
  }
});

test('every guide originally classified for rewrite remains represented in the final reviewed inventory', () => {
  const finalPaths = new Set(inventory.pages.map((page) => page.path));
  const rewrites = evidence.records.filter((record) => record.classification === 'rewrite');
  assert.ok(rewrites.length > 0, 'expected initial rewrite classifications');
  for (const record of rewrites) {
    assert.ok(finalPaths.has(record.page), `rewritten guide missing from final inventory: ${record.page}`);
  }
});
