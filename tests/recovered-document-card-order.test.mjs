import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildRecoveredContentCatalog } from '../scripts/build-recovered-content-catalog.mjs';

const FOUNDATIONAL_PRESENTATION_ORDER = ['FC', 'CH', 'CO', 'ECON', 'DG', 'JUD', 'LOC', 'EX', 'ETH', 'STD'];

test('foundational document cards present charter before constitution while keeping thematic laws before executive bylaws', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-card-order-'));
  const entries = FOUNDATIONAL_PRESENTATION_ORDER.map((documentId) => ({
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
  const currentFoundationalPackages = FOUNDATIONAL_PRESENTATION_ORDER.map((id) => ({
    id,
    version: '1.0',
    markdown: `# ${id}\n\n**شناسه سند:** ${id}\n\n### ماده ${id}-001 — اصل\nمتن`,
  }));

  const catalog = await buildRecoveredContentCatalog(root, { currentFoundationalPackages });
  assert.deepEqual(catalog.documents.map((item) => item.documentId), FOUNDATIONAL_PRESENTATION_ORDER);
});
