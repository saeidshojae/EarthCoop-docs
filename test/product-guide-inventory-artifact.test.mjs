import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { inventoryProductGuides } from '../scripts/inventory-product-guides.mjs';

const root = path.resolve('.');
const artifactPath = path.join(root, 'audits/product-guides/2026-09-28-inventory.json');

test('committed product-guide inventory matches deterministic scanner output', async () => {
  const expected = {
    generatedAt: '2026-09-28',
    pages: await inventoryProductGuides(root)
  };

  let actual;
  try {
    actual = JSON.parse(await readFile(artifactPath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Inventory artifact missing. Generated content follows:\n${JSON.stringify(expected, null, 2)}`);
    }
    throw error;
  }

  assert.deepEqual(actual, expected, 'regenerate product-guide inventory after guide/source changes');
});
