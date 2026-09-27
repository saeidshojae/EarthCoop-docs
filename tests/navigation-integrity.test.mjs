import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collectPages(value, pages = []) {
  if (Array.isArray(value)) {
    for (const item of value) collectPages(item, pages);
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === 'pages' && Array.isArray(item)) {
        for (const page of item) if (typeof page === 'string') pages.push(page);
      } else collectPages(item, pages);
    }
  }
  return pages;
}

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

test('every local docs.json navigation page resolves to a Markdown source', async () => {
  const config = JSON.parse(await readFile(path.join(root, 'docs.json'), 'utf8'));
  const pages = [...new Set(collectPages(config.navigation))];
  const missing = [];
  for (const page of pages) {
    if (/^https?:\/\//.test(page)) continue;
    if (await exists(`${page}.mdx`) || await exists(`${page}.md`)) continue;
    missing.push(page);
  }
  assert.deepEqual(missing, []);
});
