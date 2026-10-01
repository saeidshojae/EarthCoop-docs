import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildRecoveredContentCatalog } from '../scripts/build-recovered-content-catalog.mjs';

test('foundational document cards place executive bylaws before the constitution', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-card-order-'));
  const ids = ['FC', 'CH', 'CO', 'EX'];
  const entries = ids.map((documentId) => ({
    documentId,
    slug: `foundational/${documentId.toLowerCase()}`,
    contentClass: 'foundational_document',
    canonicalLanguage: 'fa',
    legalStatus: 'effective',
    authority: 'founder',
    version: '1.0',
    reviewedAt: '2026-10-01',
    renditions: {
      fa: { source: `published/foundational/${documentId}-1.0.fa.md`, status: 'current', sourceVersion: '1.0' },
      en: { source: null, status: 'not_translated', sourceVersion: null },
      ar: { source: null, status: 'not_translated', sourceVersion: null },
    },
  }));
  await writeFile(path.join(root, 'docs-manifest.json'), JSON.stringify({ schemaVersion: 2, entries }));
  const currentFoundationalPackages = ids.map((id) => ({
    id,
    version: '1.0',
    markdown: `# ${id}\n\n**شناسه سند:** ${id}\n\n### ماده ${id}-001 — اصل\nمتن`,
  }));

  const catalog = await buildRecoveredContentCatalog(root, { currentFoundationalPackages });
  assert.deepEqual(catalog.documents.map((item) => item.documentId), ['FC', 'CH', 'EX', 'CO']);
});
