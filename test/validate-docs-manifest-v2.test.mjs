import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateDocsManifest } from '../scripts/validate-docs-manifest.mjs';

async function source(root, relativePath) {
  await mkdir(path.dirname(path.join(root, relativePath)), { recursive: true });
  await writeFile(path.join(root, relativePath), '# source\n');
}

function manifest(renditions) {
  return {
    schemaVersion: 2,
    canonicalDefaultLanguage: 'fa',
    entries: [{
      documentId: 'ECON',
      slug: 'foundational/econ',
      contentClass: 'foundational_document',
      canonicalLanguage: 'fa',
      legalStatus: 'registered_not_effective',
      productStatus: null,
      authority: 'EarthCoop founder',
      version: '0.2',
      reviewedAt: '2026-09-24',
      renditions,
    }],
  };
}

const missing = () => ({ source: null, status: 'not_translated', sourceVersion: null });

test('rejects a canonical rendition that is not current', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'manifest-v2-'));
  await source(root, 'fa/econ.md');
  const result = await validateDocsManifest(root, manifest({
    fa: { source: 'fa/econ.md', status: 'needs_review', sourceVersion: '0.2' },
    en: missing(),
    ar: missing(),
  }));
  assert.match(result.errors.join('\n'), /canonical.*fa.*must be current/i);
});

test('rejects a current derived translation whose sourceVersion differs from the document version', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'manifest-v2-'));
  await source(root, 'fa/econ.md');
  await source(root, 'en/econ.md');
  const result = await validateDocsManifest(root, manifest({
    fa: { source: 'fa/econ.md', status: 'current', sourceVersion: '0.2' },
    en: { source: 'en/econ.md', status: 'current', sourceVersion: '0.1' },
    ar: missing(),
  }));
  assert.match(result.errors.join('\n'), /en.*current.*sourceVersion.*0\.2/i);
});
