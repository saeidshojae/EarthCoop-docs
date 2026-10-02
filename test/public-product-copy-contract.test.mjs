import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const read = (file) => readFile(path.join(root, file), 'utf8');

const publicPages = [
  'index.mdx',
  'introduction.mdx',
  'quickstart.mdx',
  'account-setup.mdx'
];

test('public top-level product copy uses EarthCoop, not the legacy NewEarthCoop name', async () => {
  for (const file of publicPages) {
    const content = await read(file);
    assert.doesNotMatch(content, /\bNewEarthCoop\b/i, `${file} still uses the legacy product name`);
  }
});

test('introduction does not flatten current and future capabilities into fully available claims', async () => {
  const content = await read('introduction.mdx');
  assert.doesNotMatch(content, /fully\s+available/i);
  assert.match(content, /Current product/i);
  assert.match(content, /In development/i);
  assert.match(content, /Planned/i);
  assert.match(content, /Persian/i);
});

test('quickstart reflects multi-step registration and automatic system-group membership', async () => {
  const content = await read('quickstart.mdx');
  assert.match(content, /multi-step.*registration/i);
  assert.match(content, /automatically/i);
  assert.match(content, /public assembl/i);
  assert.match(content, /professional/i);
  assert.match(content, /age\/gender/i);
  assert.doesNotMatch(content, /fully\s+available/i);
  assert.doesNotMatch(content, /Join or create a group/i);
});

test('account setup reflects current Google authentication while preserving canonical residence requirements', async () => {
  const content = await read('account-setup.mdx');
  assert.match(content, /Google OAuth|Google authentication/i);
  assert.match(content, /does not remove|not a shortcut|does not.*bypass/is);
  assert.match(content, /Primary Residence/i);
  assert.match(content, /base governance/i);
  assert.match(content, /Street.*optional|optional.*Street/is);
});
