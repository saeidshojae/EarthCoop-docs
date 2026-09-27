import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function read(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), 'utf8');
}

test('uses an EarthCoop-specific public documentation license instead of the Mintlify starter license', async () => {
  const license = await read('LICENSE');

  assert.match(license, /EarthCoop Public Documentation License/i);
  assert.match(license, /not an open-source software license/i);
  assert.doesNotMatch(license, /Copyright \(c\) 2026 Mintlify/i);
});

test('preserves the inherited Mintlify MIT notice separately', async () => {
  const notices = await read('THIRD_PARTY_NOTICES.md');

  assert.match(notices, /Mintlify/i);
  assert.match(notices, /MIT License/i);
  assert.match(notices, /Copyright \(c\) 2026 Mintlify/i);
});

test('README distinguishes EarthCoop content rights from third-party components', async () => {
  const readme = await read('README.md');

  assert.match(readme, /EarthCoop Public Documentation License/i);
  assert.match(readme, /THIRD_PARTY_NOTICES\.md/i);
});
