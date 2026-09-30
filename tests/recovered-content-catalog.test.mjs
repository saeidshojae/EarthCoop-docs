import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { buildRecoveredContentCatalog } from '../scripts/build-recovered-content-catalog.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-recovered-catalog-'));
  await mkdir(path.join(root, 'references/economy'), { recursive: true });
  await writeFile(path.join(root, 'references/economy/ECON-REF-01-0.1.fa.md'), `---\ntitle: "سند مرجع اقتصاد"\n---\n\n# ECON-REF-01 — سند مرجع اقتصاد\n\nمتن مرجع.`);
  await writeFile(path.join(root, 'docs-manifest.json'), JSON.stringify({
    schemaVersion: 2,
    entries: [
      {
        documentId: 'FC', slug: 'foundational/fc', contentClass: 'foundational_document', canonicalLanguage: 'fa',
        legalStatus: 'registered_not_effective', authority: 'founder', version: '1.1', reviewedAt: '2026-09-24',
        renditions: {
          fa: { source: 'published/foundational/FC-1.1.fa.md', status: 'current', sourceVersion: '1.1' },
          en: { source: null, status: 'not_translated', sourceVersion: null },
          ar: { source: null, status: 'not_translated', sourceVersion: null },
        },
      },
      {
        documentId: 'ECON-REF-01', slug: 'reference/economy/econ-ref-01', contentClass: 'reference', canonicalLanguage: 'fa',
        legalStatus: 'official_draft', authority: 'founder', version: '0.1', reviewedAt: '2026-09-28',
        renditions: {
          fa: { source: 'references/economy/ECON-REF-01-0.1.fa.md', status: 'current', sourceVersion: '0.1' },
          en: { source: null, status: 'not_translated', sourceVersion: null },
          ar: { source: null, status: 'not_translated', sourceVersion: null },
        },
      },
      {
        documentId: 'FOUNDATIONAL-INDEX', slug: 'foundational', contentClass: 'reference', canonicalLanguage: 'fa',
        legalStatus: 'under_audit', authority: 'editorial', version: '0.1.0', reviewedAt: '2026-09-24',
        renditions: { fa: { source: 'fa/foundational/index.mdx', status: 'current', sourceVersion: '0.1.0' } },
      },
    ],
  }));

  const currentFoundationalPackages = [{
    id: 'FC', version: '1.1', markdown: '# سند مادر\n\n**شناسه سند:** FC\n\n### ماده FC-001 — اصل\nبدن',
  }];
  return { root, currentFoundationalPackages };
}

test('catalog includes governed foundational documents and ECON-REF-01 without promoting arbitrary references', async () => {
  const { root, currentFoundationalPackages } = await fixture();
  const catalog = await buildRecoveredContentCatalog(root, { currentFoundationalPackages });

  assert.deepEqual(catalog.documents.map((item) => item.documentId), ['FC']);
  assert.deepEqual(catalog.references.map((item) => item.documentId), ['ECON-REF-01']);
  assert.equal(catalog.references[0].routeId, 'econ-ref-01-fa-0-1');
  assert.equal(catalog.references[0].contentClass, 'reference');
  assert.equal(catalog.references[0].legalStatus, 'official_draft');
  assert.equal(catalog.references[0].canonicalLanguage, 'fa');
  assert.equal(catalog.references[0].renditions.fa.status, 'current');
  assert.doesNotMatch(JSON.stringify(catalog), /FOUNDATIONAL-INDEX/);
});

test('catalog preserves governed metadata instead of synthesizing legal state', async () => {
  const { root, currentFoundationalPackages } = await fixture();
  const catalog = await buildRecoveredContentCatalog(root, { currentFoundationalPackages });
  const reference = catalog.references[0];

  assert.equal(reference.version, '0.1');
  assert.equal(reference.authority, 'founder');
  assert.equal(reference.reviewedAt, '2026-09-28');
  assert.equal(reference.source, 'references/economy/ECON-REF-01-0.1.fa.md');
  assert.match(reference.markdown, /متن مرجع/);
});
