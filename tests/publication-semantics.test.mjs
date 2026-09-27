import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildCurrentFoundational } from '../scripts/build-current-foundational.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('registered package headers never describe CH or CO as legally current merely because they are unchanged', async () => {
  const packages = await buildCurrentFoundational(root);
  for (const id of ['CH', 'CO']) {
    const item = packages.find((candidate) => candidate.id === id);
    assert.match(item.markdown, /ثبت‌شده[^\n]*غیرنافذ/);
    assert.doesNotMatch(item.markdown, /\*\*وضعیت:\*\*\s*جاری/);
  }
});

test('public foundational index explains that its table is the public baseline, not the latest registered package', async () => {
  const index = await readFile(path.join(root, 'fa/foundational/index.mdx'), 'utf8');
  assert.match(index, /خط مبنای عمومی/);
  assert.match(index, /بسته[^\n]*ثبت‌شده[^\n]*غیرنافذ/);
  assert.match(index, /REGISTRY_MODEL\.md/);
});

test('changelog records the supported-locale workaround instead of claiming docs.json uses fa', async () => {
  const changelog = await readFile(path.join(root, 'CHANGELOG.md'), 'utf8');
  assert.match(changelog, /supported `ar` locale/i);
  assert.doesNotMatch(changelog, /از `ar` به `fa` اصلاح شد/);
});
