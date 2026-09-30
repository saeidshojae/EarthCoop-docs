import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildDocsCenter } from '../scripts/build-docs-center.mjs';
import { validateDocsCenter } from '../scripts/validate-docs-center.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-validate-'));
  await mkdir(path.join(root, 'published/foundational'), { recursive: true });
  await mkdir(path.join(root, 'site/assets'), { recursive: true });
  await writeFile(path.join(root, 'site/index.html'), '<!doctype html><script type="module" src="./app.js"></script>');
  await writeFile(path.join(root, 'site/app.js'), 'export const ok = true;');
  await writeFile(path.join(root, 'site/search.js'), 'export const searchDocuments=()=>[];');
  await writeFile(path.join(root, 'site/styles.css'), ':root{}');
  await writeFile(path.join(root, 'site/assets/earthcoop-mark.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  await writeFile(path.join(root, 'published/foundational/fc.md'), '# سند مادر\n\n## عدالت\n\nمتن عدالت و زمین');
  await writeFile(path.join(root, 'document-registry.json'), JSON.stringify({
    schemaVersion: 2, sourceLanguage: 'fa', supportedLanguages: ['fa', 'en', 'ar'],
    documents: [{ id: 'FC', slug: 'fc', fa: { version: '1.0', status: 'final' }, en: { version: '1.0', status: 'not-started' }, ar: { version: '1.0', status: 'not-started' } }],
  }));
  await writeFile(path.join(root, 'docs-manifest.json'), JSON.stringify({
    schemaVersion: 2, canonicalDefaultLanguage: 'fa', entries: [{
      documentId: 'FC', canonicalLanguage: 'fa', legalStatus: 'registered_not_effective', version: '1.1',
      renditions: {
        fa: { source: 'published/foundational/fc.md', status: 'current', sourceVersion: '1.1' },
        en: { source: null, status: 'not_translated', sourceVersion: null },
        ar: { source: null, status: 'not_translated', sourceVersion: null },
      },
    }],
  }));
  const outDir = path.join(root, 'dist');
  const sourceSha = 'b'.repeat(40);
  await buildDocsCenter({ rootDir: root, outDir, sourceSha, builtAt: '2026-09-29T00:00:00.000Z' });
  return { outDir, sourceSha };
}

async function mutateJson(file, mutate) {
  const value = JSON.parse(await readFile(file, 'utf8'));
  mutate(value);
  await writeFile(file, JSON.stringify(value));
}

test('accepts a complete static build and deep hash-route boot contract', async () => {
  const { outDir, sourceSha } = await fixture();
  const report = await validateDocsCenter(outDir, { expectedSourceSha: sourceSha });
  assert.equal(report.valid, true);
  assert.equal(report.sourceSha, sourceSha);
});

test('rejects missing index.html', async () => {
  const { outDir, sourceSha } = await fixture();
  await rm(path.join(outDir, 'index.html'));
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /index\.html/i);
});

test('rejects deployment source SHA mismatch', async () => {
  const { outDir } = await fixture();
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: 'c'.repeat(40) }), /source sha/i);
});

test('rejects locales other than exactly fa/en/ar', async () => {
  const { outDir, sourceSha } = await fixture();
  await mutateJson(path.join(outDir, 'content-index.json'), (value) => { value.locales = ['fa', 'en']; });
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /locales/i);
});

test('rejects unsafe generated source payload', async () => {
  const { outDir, sourceSha } = await fixture();
  await mutateJson(path.join(outDir, 'content-index.json'), (value) => { value.documents[0].renditions.fa.text += '<script>x()</script>'; });
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /unsafe/i);
});

test('rejects missing full-text search body', async () => {
  const { outDir, sourceSha } = await fixture();
  await mutateJson(path.join(outDir, 'search-index.json'), (value) => { value[0].body = ''; });
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /search body/i);
});

test('rejects manifest references to nonexistent files', async () => {
  const { outDir, sourceSha } = await fixture();
  await mutateJson(path.join(outDir, 'deployment-manifest.json'), (value) => { value.hashes['missing.txt'] = '0'.repeat(64); });
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /missing\.txt/i);
});

test('rejects non-hash document routes', async () => {
  const { outDir, sourceSha } = await fixture();
  await mutateJson(path.join(outDir, 'content-index.json'), (value) => { value.documents[0].route = '/documents/FC'; });
  await assert.rejects(validateDocsCenter(outDir, { expectedSourceSha: sourceSha }), /hash route/i);
});
