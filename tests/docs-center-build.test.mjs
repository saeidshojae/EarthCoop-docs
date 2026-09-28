import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildDocsCenter } from '../scripts/build-docs-center.mjs';

async function files(dir, prefix = '') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const rel = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) out.push(...await files(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out.sort();
}

async function makeFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-build-'));
  await mkdir(path.join(root, 'published/foundational'), { recursive: true });
  await mkdir(path.join(root, 'site/assets'), { recursive: true });
  await writeFile(path.join(root, 'site/index.html'), '<!doctype html><script type="module" src="./app.js"></script>');
  await writeFile(path.join(root, 'site/app.js'), 'export const ok = true;');
  await writeFile(path.join(root, 'site/styles.css'), ':root{}');
  await writeFile(path.join(root, 'site/search.js'), 'export const searchDocuments=()=>[];');
  await writeFile(path.join(root, 'site/assets/earthcoop-mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  await writeFile(path.join(root, 'published/foundational/fc-1.1-fa.md'), '# سند مادر\n\n## عدالت\n\nمتن درباره عدالت و زمین');
  await writeFile(path.join(root, 'document-registry.json'), JSON.stringify({
    schemaVersion: 2,
    registryRole: 'public_baseline_and_translation_status',
    statusSemantics: 'editorial_maturity_not_legal_effect',
    sourceLanguage: 'fa',
    supportedLanguages: ['fa', 'en', 'ar'],
    documents: [{
      id: 'FC', slug: 'foundational-covenant',
      fa: { version: '1.0', status: 'final' },
      en: { version: '1.0', status: 'not-started' },
      ar: { version: '1.0', status: 'not-started' },
    }],
  }));
  await writeFile(path.join(root, 'docs-manifest.json'), JSON.stringify({
    schemaVersion: 2,
    registryRole: 'knowledge_center_ingestion',
    statusSemantics: 'publication_candidate_status_not_legal_effect',
    canonicalDefaultLanguage: 'fa',
    entries: [{
      documentId: 'FC', slug: 'foundational/fc', contentClass: 'foundational_document',
      canonicalLanguage: 'fa', legalStatus: 'registered_not_effective', productStatus: null,
      authority: 'EarthCoop founder', version: '1.1', reviewedAt: '2026-09-24',
      renditions: {
        fa: { source: 'published/foundational/fc-1.1-fa.md', status: 'current', sourceVersion: '1.1' },
        en: { source: null, status: 'not_translated', sourceVersion: null },
        ar: { source: null, status: 'not_translated', sourceVersion: null },
      }, provisions: [],
    }],
  }));
  return root;
}

test('build is deterministic and emits governed indexes plus deployment metadata', async () => {
  const root = await makeFixture();
  const outA = path.join(root, 'dist-a');
  const outB = path.join(root, 'dist-b');
  const args = { rootDir: root, sourceSha: '1234567890abcdef1234567890abcdef12345678', builtAt: '2026-09-29T00:00:00.000Z' };
  await buildDocsCenter({ ...args, outDir: outA });
  await buildDocsCenter({ ...args, outDir: outB });

  const inventoryA = await files(outA);
  const inventoryB = await files(outB);
  assert.deepEqual(inventoryA, inventoryB);
  for (const file of inventoryA) {
    assert.deepEqual(await readFile(path.join(outA, file)), await readFile(path.join(outB, file)), file);
  }

  const content = JSON.parse(await readFile(path.join(outA, 'content-index.json'), 'utf8'));
  const search = JSON.parse(await readFile(path.join(outA, 'search-index.json'), 'utf8'));
  const manifest = JSON.parse(await readFile(path.join(outA, 'deployment-manifest.json'), 'utf8'));

  assert.equal(content.defaultLocale, 'fa');
  assert.deepEqual(content.locales, ['fa', 'en', 'ar']);
  assert.equal(content.documents[0].route, '/#/documents/FC');
  assert.equal(content.documents[0].legalStatus, 'registered_not_effective');
  assert.equal(content.documents[0].renditions.fa.download.source, 'published/foundational/fc-1.1-fa.md');
  assert.equal(content.documents[0].renditions.fa.download.filename, 'FC-fa.md');
  assert.equal(content.documents[0].renditions.en.available, false);

  const faSearch = search.find((item) => item.id === 'FC' && item.locale === 'fa' && item.anchor === 'عدالت');
  assert.ok(faSearch, 'section-level search record for عدالت should exist');
  assert.match(faSearch.body, /متن درباره عدالت و زمین/);
  assert.equal(faSearch.heading, 'عدالت');
  assert.equal(faSearch.route, '/#/documents/FC?anchor=%D8%B9%D8%AF%D8%A7%D9%84%D8%AA');

  assert.equal(manifest.repository, 'saeidshojae/EarthCoop-docs');
  assert.equal(manifest.sourceSha, args.sourceSha);
  assert.equal(manifest.builtAt, args.builtAt);
  assert.equal(manifest.schemaVersion, 1);
  assert.deepEqual(manifest.locales, ['fa', 'en', 'ar']);
  assert.equal(manifest.fileCount, inventoryA.length);
  assert.ok(manifest.hashes['content-index.json']);
  assert.ok(manifest.hashes['search-index.json']);
});

test('malformed governed source fails closed without a valid build', async () => {
  const root = await makeFixture();
  const manifestPath = path.join(root, 'docs-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  delete manifest.entries[0].renditions;
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(
    buildDocsCenter({ rootDir: root, outDir: path.join(root, 'dist'), sourceSha: 'a'.repeat(40), builtAt: '2026-09-29T00:00:00.000Z' }),
    /renditions/i,
  );
});

import { validateDocsCenter } from '../scripts/validate-docs-center.mjs';

async function validBuiltFixture() {
  const root = await makeFixture();
  const outDir = path.join(root, 'dist');
  const sourceSha = 'b'.repeat(40);
  await buildDocsCenter({ rootDir: root, outDir, sourceSha, builtAt: '2026-09-29T00:00:00.000Z' });
  return { root, outDir, sourceSha };
}

test('validator accepts a complete static build and deep hash-route boot contract', async () => {
  const { outDir, sourceSha } = await validBuiltFixture();
  const report = await validateDocsCenter(outDir, { expectedSourceSha: sourceSha });
  assert.equal(report.valid, true);
  assert.equal(report.sourceSha, sourceSha);
});

test('validator rejects missing index.html', async () => {
  const { outDir, sourceSha } = await validBuiltFixture();
  await import('node:fs/promises').then(({ rm }) => rm(path.join(outDir, 'index.html')));
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /index\.html/i);
});

test('validator rejects deployment manifest SHA mismatch', async () => {
  const { outDir } = await validBuiltFixture();
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: 'c'.repeat(40) }), /source sha/i);
});

test('validator rejects locale set other than exactly fa/en/ar', async () => {
  const { outDir, sourceSha } = await validBuiltFixture();
  const contentPath = path.join(outDir, 'content-index.json');
  const content = JSON.parse(await readFile(contentPath, 'utf8'));
  content.locales = ['fa', 'en'];
  await writeFile(contentPath, JSON.stringify(content));
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /locales/i);
});

test('validator rejects unsafe source payloads in generated content', async () => {
  const { outDir, sourceSha } = await validBuiltFixture();
  const contentPath = path.join(outDir, 'content-index.json');
  const content = JSON.parse(await readFile(contentPath, 'utf8'));
  content.documents[0].renditions.fa.text += '<script>alert(1)</script>';
  await writeFile(contentPath, JSON.stringify(content));
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /unsafe/i);
});

test('validator rejects search records without body text', async () => {
  const { outDir, sourceSha } = await validBuiltFixture();
  const searchPath = path.join(outDir, 'search-index.json');
  const search = JSON.parse(await readFile(searchPath, 'utf8'));
  search[0].body = '';
  await writeFile(searchPath, JSON.stringify(search));
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /search body/i);
});

test('validator rejects deployment manifests that reference missing files', async () => {
  const { outDir, sourceSha } = await validBuiltFixture();
  const manifestPath = path.join(outDir, 'deployment-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.hashes['missing.txt'] = '0'.repeat(64);
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /missing\.txt/i);
});

test('validator rejects broken canonical document routes', async () => {
  const { outDir, sourceSha } = await validBuiltFixture();
  const contentPath = path.join(outDir, 'content-index.json');
  const content = JSON.parse(await readFile(contentPath, 'utf8'));
  content.documents[0].route = '/documents/FC';
  await writeFile(contentPath, JSON.stringify(content));
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /hash route/i);
});
