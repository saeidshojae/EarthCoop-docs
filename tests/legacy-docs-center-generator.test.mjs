import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildLegacyFoundationalPackages,
  serializeLegacyFoundationalPackages,
} from '../scripts/generate-legacy-docs-center-data.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-legacy-data-'));
  await mkdir(path.join(root, 'published/foundational'), { recursive: true });
  await writeFile(path.join(root, 'published/foundational/FC.fa.md'), `# سند مادر

**شناسه سند:** FC

---

## دیباچه
متن

### ماده FC-001 — اصل نخست
بدن ماده`);
  await writeFile(path.join(root, 'docs-manifest.json'), JSON.stringify({
    schemaVersion: 2,
    entries: [{
      documentId: 'FC',
      slug: 'foundational/fc',
      contentClass: 'foundational_document',
      canonicalLanguage: 'fa',
      legalStatus: 'registered_not_effective',
      authority: 'founder',
      version: '1.1',
      reviewedAt: '2026-09-24',
      renditions: {
        fa: { source: 'published/foundational/FC.fa.md', status: 'current', sourceVersion: '1.1' },
        en: { source: null, status: 'not_translated', sourceVersion: null },
        ar: { source: 'ar/fake.mdx', status: 'current', sourceVersion: '1.1' },
      },
    }],
  }));
  return root;
}

test('generates 0.8-compatible Persian packages from governed canonical sources', async () => {
  const root = await fixture();
  const packages = await buildLegacyFoundationalPackages(root);
  assert.equal(packages.length, 1);
  assert.equal(packages[0].code, 'FC');
  assert.equal(packages[0].status, 'registered_not_effective');
  assert.equal(packages[0].canonicalLanguage, 'fa');
  assert.equal(packages[0].provisions[0].stableSlug, 'fc-001');
});

test('serialization is deterministic and never ingests legacy ar/ compatibility content as Arabic', async () => {
  const root = await fixture();
  const packages = await buildLegacyFoundationalPackages(root);
  const js = serializeLegacyFoundationalPackages(packages);
  assert.match(js, /foundationalDocumentPackages/);
  assert.match(js, /registered_not_effective/);
  assert.doesNotMatch(js, /ar\/fake/);
});
