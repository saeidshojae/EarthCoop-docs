import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseRoot = path.join(root, 'releases/foundational/2026-09-20');

test('registered release records the founder decision without marking documents effective', async () => {
  const registry = JSON.parse(await readFile(path.join(releaseRoot, 'document-registry.registered.json'), 'utf8'));
  assert.equal(registry.status, 'registered-not-effective');
  assert.equal(registry.statusAuthority, 'EarthCoop founder');
  assert.equal(registry.registeredAt, '2026-09-24');
  assert.equal(registry.documents.length, 10);

  for (const document of registry.documents) {
    if (['CH', 'CO'].includes(document.id)) assert.equal(document.status, 'current-unchanged');
    else assert.equal(document.status, 'registered-not-effective');
    assert.notEqual(document.status, 'effective');
  }

  await access(path.join(releaseRoot, registry.statusDecision));
  const ex = registry.documents.find((document) => document.id === 'EX');
  await Promise.all([
    access(path.join(releaseRoot, ex.consolidatedText)),
    access(path.join(releaseRoot, ex.provenance)),
  ]);
});
