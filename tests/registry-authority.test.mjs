import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repositoryRoot, relativePath), 'utf8'));
}

test('declares distinct authority roles for public baseline, knowledge ingestion, and registered releases', async () => {
  const registry = await readJson('document-registry.json');
  const manifest = await readJson('docs-manifest.json');

  assert.equal(registry.registryRole, 'public_baseline_and_translation_status');
  assert.equal(registry.statusSemantics, 'editorial_maturity_not_legal_effect');
  assert.equal(manifest.registryRole, 'knowledge_center_ingestion');
  assert.equal(manifest.statusSemantics, 'publication_candidate_status_not_legal_effect');
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.canonicalDefaultLanguage, 'fa');
  assert.equal(
    registry.latestRegisteredRelease,
    'releases/foundational/2026-10-01/document-registry.registered.json',
  );
});

test('root registry schema reference resolves inside the repository', async () => {
  const registry = await readJson('document-registry.json');
  const schemaPath = registry.$schema.replace(/^\.\//, '');
  await access(path.join(repositoryRoot, schemaPath));
});

test('knowledge manifest registered versions are traceable to the latest registered release', async () => {
  const registry = await readJson('document-registry.json');
  const manifest = await readJson('docs-manifest.json');
  const release = await readJson(registry.latestRegisteredRelease);
  const releaseById = new Map(release.documents.map((item) => [item.id, item]));

  for (const entry of manifest.entries.filter((item) => item.contentClass === 'foundational_document')) {
    const registered = releaseById.get(entry.documentId);
    assert.ok(registered, `missing ${entry.documentId} from registered release`);
    assert.equal(entry.version, registered.currentVersion, `${entry.documentId} version drift`);
    assert.equal(entry.canonicalLanguage, 'fa', `${entry.documentId} canonical language drift`);
    assert.equal(entry.renditions.fa.status, 'current', `${entry.documentId} Persian rendition must be current`);
    assert.equal(entry.renditions.fa.sourceVersion, entry.version, `${entry.documentId} Persian source version drift`);
    assert.ok(
      ['registered-not-effective', 'current-unchanged', 'effective'].includes(registered.status),
      `${entry.documentId} has unexpected registered-release status ${registered.status}`,
    );
    if (release.status === 'effective') {
      assert.equal(registered.status, 'effective', `${entry.documentId} must be effective in an effective release`);
      assert.equal(entry.legalStatus, 'effective', `${entry.documentId} manifest must reflect explicit legal effect`);
    }
  }
});

test('documents the registry model for human reviewers', async () => {
  const model = await readFile(path.join(repositoryRoot, 'REGISTRY_MODEL.md'), 'utf8');
  assert.match(model, /public baseline/i);
  assert.match(model, /registered release/i);
  assert.match(model, /does not make.*effective/is);
  assert.match(model, /فقط status و تصمیم رسمی مربوط به نفاذ\/ثبت را ملاک قرار دهید/);
});
