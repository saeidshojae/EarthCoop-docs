import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { inventoryProductGuides } from '../scripts/inventory-product-guides.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-docs-inventory-'));
  const files = {
    'introduction.mdx': '# Intro\nNewEarthCoop is fully available.',
    'quickstart.mdx': '# Quickstart\nYou can create a group.',
    'groups/overview.mdx': '# Groups\nCreate a group.',
    'projects/overview.mdx': '# Projects\nScheduled transfers are available.',
    'najm-bahar/overview.mdx': '# Bahar\nThe GOL unit is used here.',
    'najm-hoda/overview.mdx': '# Hoda\nAssistant guide.',
    'fa/introduction.mdx': '# فارسی\nNewEarthCoop',
    'ar/introduction.mdx': '# العربية\nNewEarthCoop',
    'published/foundational/ECON-0.2.fa.md': '# ECON\nNewEarthCoop',
    'releases/foundational/2026-09-20/ECON-0.1.fa.md': '# release\nNewEarthCoop'
  };

  for (const [relative, content] of Object.entries(files)) {
    const target = path.join(root, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, content, 'utf8');
  }
  return root;
}

test('inventories English product guides and excludes language/legal archives', async () => {
  const root = await fixture();
  const items = await inventoryProductGuides(root);
  const paths = items.map((item) => item.path);

  for (const required of [
    'introduction.mdx',
    'quickstart.mdx',
    'groups/overview.mdx',
    'projects/overview.mdx',
    'najm-bahar/overview.mdx',
    'najm-hoda/overview.mdx'
  ]) assert.ok(paths.includes(required), `missing ${required}`);

  assert.ok(!paths.some((value) => /^(fa|ar|published|releases)\//.test(value)));
});

test('flags known legacy terms and sensitive capability claims case-insensitively', async () => {
  const root = await fixture();
  const items = await inventoryProductGuides(root);
  const allLegacy = items.flatMap((item) => item.legacyTerms);
  const allSensitive = items.flatMap((item) => item.sensitiveClaims);

  assert.ok(allLegacy.some((item) => item.match.toLowerCase() === 'newearthcoop'));
  assert.ok(allLegacy.some((item) => item.match.toLowerCase() === 'gol unit'));
  assert.ok(allSensitive.some((item) => item.match.toLowerCase() === 'fully available'));
  assert.ok(allSensitive.some((item) => item.match.toLowerCase() === 'scheduled transfers'));
  assert.ok(allSensitive.some((item) => item.match.toLowerCase() === 'create a group'));
});

test('returns deterministic path order and extracts a title', async () => {
  const root = await fixture();
  const first = await inventoryProductGuides(root);
  const second = await inventoryProductGuides(root);
  assert.deepEqual(first, second);
  assert.equal(first.find((item) => item.path === 'introduction.mdx').title, 'Intro');
});
