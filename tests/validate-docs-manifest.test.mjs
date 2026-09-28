import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateDocsManifest } from '../scripts/validate-docs-manifest.mjs';

function rendition(overrides = {}) {
  return {
    source: null,
    status: 'not_translated',
    sourceVersion: null,
    ...overrides,
  };
}

function entry(overrides = {}) {
  return {
    documentId: 'FOUNDATIONAL-INDEX',
    slug: 'foundational',
    contentClass: 'reference',
    canonicalLanguage: 'fa',
    legalStatus: 'under_audit',
    productStatus: null,
    authority: 'EarthCoop documentation editorial team',
    version: '0.1.0',
    reviewedAt: '2026-09-22',
    renditions: {
      fa: rendition({ source: 'fa/foundational/index.mdx', status: 'current', sourceVersion: '0.1.0' }),
      en: rendition(),
      ar: rendition(),
    },
    ...overrides,
  };
}

function manifest(entries = [entry()], overrides = {}) {
  return {
    schemaVersion: 2,
    canonicalDefaultLanguage: 'fa',
    entries,
    ...overrides,
  };
}

async function createSource(root, relativePath) {
  await mkdir(path.dirname(path.join(root, relativePath)), { recursive: true });
  await writeFile(path.join(root, relativePath), '---\ntitle: "سند"\ndescription: "شرح"\n---\n');
}

test('validates a complete multilingual manifest against files in the repository', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  await createSource(root, 'fa/foundational/index.mdx');
  const result = await validateDocsManifest(root, manifest());
  assert.deepEqual(result.errors, []);
});

test('accepts registered non-effective Markdown as a reviewable legal source', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  await createSource(root, 'published/foundational/EX-1.1.fa.md');
  const result = await validateDocsManifest(root, manifest([entry({
    documentId: 'EX',
    slug: 'foundational/ex',
    contentClass: 'foundational_document',
    legalStatus: 'registered_not_effective',
    authority: 'EarthCoop founder',
    version: '1.1',
    reviewedAt: '2026-09-24',
    renditions: {
      fa: rendition({ source: 'published/foundational/EX-1.1.fa.md', status: 'current', sourceVersion: '1.1' }),
      en: rendition(),
      ar: rendition(),
    },
  })]));
  assert.deepEqual(result.errors, []);
});

test('rejects duplicate document IDs, duplicate slugs, invalid legal statuses, and missing rendition files', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  const result = await validateDocsManifest(root, manifest([
    entry(),
    entry({
      documentId: 'FOUNDATIONAL-INDEX',
      slug: 'foundational',
      legalStatus: 'final',
      renditions: {
        fa: rendition({ source: 'missing.mdx', status: 'current', sourceVersion: '0.1.0' }),
        en: rendition(),
        ar: rendition(),
      },
    }),
  ]));
  const errors = result.errors.join('\n');
  assert.match(errors, /duplicate documentId/i);
  assert.match(errors, /duplicate slug/i);
  assert.match(errors, /legalStatus/i);
  assert.match(errors, /does not exist/i);
});

test('rejects missing or unsupported canonical language', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  const missing = entry();
  delete missing.canonicalLanguage;
  const missingResult = await validateDocsManifest(root, manifest([missing]));
  assert.match(missingResult.errors.join('\n'), /canonicalLanguage/i);

  const invalidResult = await validateDocsManifest(root, manifest([entry({ canonicalLanguage: 'de' })]));
  assert.match(invalidResult.errors.join('\n'), /canonicalLanguage/i);
});

test('checks every non-null rendition source and rejects repository escape paths', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  await createSource(root, 'fa/foundational/index.mdx');
  const result = await validateDocsManifest(root, manifest([entry({
    renditions: {
      fa: rendition({ source: 'fa/foundational/index.mdx', status: 'current', sourceVersion: '0.1.0' }),
      en: rendition({ source: '../outside.mdx', status: 'needs_review', sourceVersion: '0.1.0' }),
      ar: rendition(),
    },
  })]));
  assert.match(result.errors.join('\n'), /safe relative path/i);
});

test('enforces not_translated null source and translated non-null source/version pairs', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  await createSource(root, 'fa/foundational/index.mdx');
  const result = await validateDocsManifest(root, manifest([entry({
    renditions: {
      fa: rendition({ source: 'fa/foundational/index.mdx', status: 'current', sourceVersion: '0.1.0' }),
      en: rendition({ source: null, status: 'current', sourceVersion: null }),
      ar: rendition({ source: 'ar/foundational/index.mdx', status: 'not_translated', sourceVersion: '0.1.0' }),
    },
  })]));
  const errors = result.errors.join('\n');
  assert.match(errors, /en.*current.*source/i);
  assert.match(errors, /ar.*not_translated.*null/i);
});

test('accepts only available, in_development, planned, or null product status', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  await createSource(root, 'fa/foundational/index.mdx');

  for (const productStatus of [null, 'available', 'in_development', 'planned']) {
    const result = await validateDocsManifest(root, manifest([entry({ productStatus })]));
    assert.deepEqual(result.errors, [], `expected ${productStatus} to be accepted`);
  }

  const invalid = await validateDocsManifest(root, manifest([entry({ productStatus: 'done' })]));
  assert.match(invalid.errors.join('\n'), /productStatus/i);
});

test('rejects duplicate stable provision IDs inside one document', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  await createSource(root, 'fa/foundational/index.mdx');
  const result = await validateDocsManifest(root, manifest([entry({
    provisions: [
      { id: 'FC-1', anchor: 'article-1' },
      { id: 'FC-1', anchor: 'article-2' },
    ],
  })]));
  assert.match(result.errors.join('\n'), /duplicate provision id/i);
});

test('rejects legacy schemaVersion 1 manifest shape', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  const result = await validateDocsManifest(root, {
    schemaVersion: 1,
    sourceLanguage: 'fa',
    entries: [{
      id: 'foundational-index-fa',
      source: 'fa/foundational/index.mdx',
      slug: 'foundational',
      language: 'fa',
      contentClass: 'reference',
      status: 'under_audit',
      authority: 'EarthCoop documentation editorial team',
      version: '0.1.0',
      reviewedAt: '2026-09-22',
    }],
  });
  assert.match(result.errors.join('\n'), /schemaVersion must be 2/i);
});
