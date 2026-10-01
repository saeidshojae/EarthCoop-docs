import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseRoot = path.join(root, 'releases/foundational/2026-10-01');
const foundationalIds = ['FC', 'CH', 'CO', 'EX', 'ECON', 'DG', 'JUD', 'LOC', 'ETH', 'STD'];

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

test('2026-10-01 release starts the official series at 1.0 and makes all foundational documents effective', async () => {
  const registry = await readJson(path.join(releaseRoot, 'document-registry.registered.json'));
  assert.equal(registry.status, 'effective');
  assert.equal(registry.statusAuthority, 'EarthCoop founder');
  assert.equal(registry.registeredAt, '2026-10-01');
  assert.equal(registry.effectiveAt, '2026-10-01');
  assert.equal(registry.versionEpoch, 'official-v1');
  assert.equal(registry.documents.length, foundationalIds.length);

  assert.deepEqual(registry.documents.map((item) => item.id), foundationalIds);
  for (const document of registry.documents) {
    assert.equal(document.currentVersion, '1.0', `${document.id} must start official numbering at 1.0`);
    assert.equal(document.previousVersion, null, `${document.id} must have no predecessor inside the official-v1 series`);
    assert.equal(document.status, 'effective', `${document.id} must be effective`);
    assert.match(document.consolidatedText, new RegExp(`^consolidated/${document.id}-1\\.0\\.full\\.fa\\.md$`));
    await access(path.join(releaseRoot, document.consolidatedText));
    await access(path.join(releaseRoot, document.provenance));
  }

  const decision = await readFile(path.join(releaseRoot, registry.statusDecision), 'utf8');
  assert.match(decision, /ثبت‌شده — نافذ/);
  assert.match(decision, /نسخه 1\.0/);
  assert.match(decision, /پیش از نسل رسمی 1/);
  assert.match(decision, /سوابق.*حذف.*نمی‌شوند/s);
});

test('version reset does not grant ECON-REF-01 independent legal force', async () => {
  const reference = await readJson(path.join(releaseRoot, 'reference-registry.registered.json'));
  assert.equal(reference.documents.length, 1);
  assert.equal(reference.documents[0].id, 'ECON-REF-01');
  assert.equal(reference.documents[0].currentVersion, '1.0');
  assert.equal(reference.documents[0].status, 'registered-reference');
  assert.equal(reference.documents[0].independentLegalEffect, false);
  await access(path.join(releaseRoot, reference.documents[0].consolidatedText));
});

test('root traceability and knowledge ingestion follow the effective v1 release without redefining public-baseline semantics', async () => {
  const rootRegistry = await readJson(path.join(root, 'document-registry.json'));
  const manifest = await readJson(path.join(root, 'docs-manifest.json'));
  assert.equal(rootRegistry.latestRegisteredRelease, 'releases/foundational/2026-10-01/document-registry.registered.json');

  for (const entry of manifest.entries.filter((item) => item.contentClass === 'foundational_document')) {
    assert.equal(entry.version, '1.0', `${entry.documentId} manifest version`);
    assert.equal(entry.legalStatus, 'effective', `${entry.documentId} manifest legal status`);
    assert.equal(entry.renditions.fa.sourceVersion, '1.0', `${entry.documentId} sourceVersion`);
    assert.equal(entry.renditions.fa.status, 'current');
  }

  const ref = manifest.entries.find((item) => item.documentId === 'ECON-REF-01');
  assert.equal(ref.version, '1.0');
  assert.notEqual(ref.legalStatus, 'effective');
});
