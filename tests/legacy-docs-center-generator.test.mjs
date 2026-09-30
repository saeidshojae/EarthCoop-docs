import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildLegacyFoundationalPackages,
  serializeLegacyFoundationalPackages,
} from '../scripts/generate-legacy-docs-center-data.mjs';

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-legacy-data-'));
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
        fa: { source: 'published/foundational/FC-1.1.fa.md', status: 'current', sourceVersion: '1.1' },
        en: { source: null, status: 'not_translated', sourceVersion: null },
        ar: { source: 'ar/fake.mdx', status: 'current', sourceVersion: '1.1' },
      },
    }],
  }));

  const currentPackages = [{
    id: 'FC',
    version: '1.1',
    markdown: `# سند مادر

**شناسه سند:** FC

---

## دیباچه
متن کامل تلفیقی

### ماده FC-001 — اصل نخست
بدن کامل ماده`,
  }];
  return { root, currentPackages };
}

test('generates 0.8-compatible packages from the official consolidated foundational builder output', async () => {
  const { root, currentPackages } = await fixture();
  const packages = await buildLegacyFoundationalPackages(root, { currentPackages });
  assert.equal(packages.length, 1);
  assert.equal(packages[0].code, 'FC');
  assert.equal(packages[0].status, 'registered_not_effective');
  assert.equal(packages[0].canonicalLanguage, 'fa');
  assert.equal(packages[0].provisions[0].stableSlug, 'fc-001');
  assert.match(packages[0].preamble, /متن کامل تلفیقی/);
  assert.equal(packages[0].currentVersion.sourcePath, 'published/foundational/FC-1.1.fa.md');
});

test('serialization is deterministic and never ingests legacy ar/ compatibility content as Arabic', async () => {
  const { root, currentPackages } = await fixture();
  const packages = await buildLegacyFoundationalPackages(root, { currentPackages });
  const js = serializeLegacyFoundationalPackages(packages);
  assert.match(js, /foundationalDocumentPackages/);
  assert.match(js, /registered_not_effective/);
  assert.doesNotMatch(js, /ar\/fake/);
});

test('fails closed when the consolidated package set is missing a governed foundational document', async () => {
  const { root } = await fixture();
  await assert.rejects(
    buildLegacyFoundationalPackages(root, { currentPackages: [] }),
    /missing consolidated source for FC/i,
  );
});
