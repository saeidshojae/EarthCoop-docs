import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateDocsManifest } from '../scripts/validate-docs-manifest.mjs';

function entry(overrides = {}) {
  return {
    id: 'foundational-index-fa',
    source: 'fa/foundational/index.mdx',
    slug: 'foundational',
    language: 'fa',
    contentClass: 'reference',
    status: 'under_audit',
    authority: 'EarthCoop documentation editorial team',
    version: '0.1.0',
    reviewedAt: '2026-09-22',
    ...overrides,
  };
}

test('validates a complete manifest against files in the repository', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  await mkdir(path.join(root, 'fa/foundational'), { recursive: true });
  await writeFile(path.join(root, 'fa/foundational/index.mdx'), '---\ntitle: "فهرست"\ndescription: "شرح"\n---\n');
  const result = await validateDocsManifest(root, { schemaVersion: 1, sourceLanguage: 'fa', entries: [entry()] });
  assert.deepEqual(result.errors, []);
});

test('rejects duplicate IDs, invalid statuses, and missing source files', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  const result = await validateDocsManifest(root, {
    schemaVersion: 1,
    sourceLanguage: 'fa',
    entries: [entry(), entry({ source: 'missing.mdx', slug: 'other', status: 'final' })],
  });
  assert.match(result.errors.join('\n'), /duplicate id/i);
  assert.match(result.errors.join('\n'), /status/i);
  assert.match(result.errors.join('\n'), /does not exist/i);
});

test('rejects paths that escape the repository', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  const result = await validateDocsManifest(root, {
    schemaVersion: 1,
    sourceLanguage: 'fa',
    entries: [entry({ source: '../outside.mdx' })],
  });
  assert.match(result.errors.join('\n'), /safe relative path/i);
});

test('rejects duplicate stable provision IDs inside one document', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'docs-manifest-'));
  await mkdir(path.join(root, 'fa/foundational'), { recursive: true });
  await writeFile(path.join(root, 'fa/foundational/index.mdx'), '---\ntitle: "فهرست"\ndescription: "شرح"\n---\n');
  const result = await validateDocsManifest(root, {
    schemaVersion: 1,
    sourceLanguage: 'fa',
    entries: [entry({
      provisions: [
        { id: 'FC-1', anchor: 'article-1' },
        { id: 'FC-1', anchor: 'article-2' },
      ],
    })],
  });
  assert.match(result.errors.join('\n'), /duplicate provision id/i);
});
