import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { renderRecoveredStaticDocuments } from '../scripts/render-recovered-static-documents.mjs';

test('uses recovered 0.8 renderers to regenerate direct document pages from current packages', async () => {
  const runtimeDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-render-08-'));
  const fixtureRuntime = process.env.EARTHCOOP_KC08_FIXTURE;
  if (!fixtureRuntime) return test.skip('EARTHCOOP_KC08_FIXTURE is not configured for this local renderer integration test');
  await cp(fixtureRuntime, runtimeDir, { recursive: true });

  const documentPackage = {
    id: 'doc-fc-9-9', slug: 'fc', code: 'FC', title: 'عنوان امروز', summary: 'خلاصه امروز',
    preamble: 'شناسه سند: FC\n\n---\n\nدیباچه امروز', canonicalLanguage: 'fa',
    status: 'registered_not_effective', source: 'current.md', authority: 'founder', reviewedAt: '2026-09-30',
    currentVersion: { version: '9.9', publishedAt: '2026-09-30', sourcePath: 'current.md' },
    provisions: [{ id: 'FC-001', stableSlug: 'fc-001', kind: 'article', title: 'ماده FC-001 — امروز', body: 'بدن امروز', order: 1, children: [] }],
  };

  await renderRecoveredStaticDocuments({
    runtimeDir,
    packages: [documentPackage],
    canonicalOrigin: 'https://docs-preview.earthcoop.ir',
  });
  const html = await readFile(path.join(runtimeDir, 'documents/fc/index.html'), 'utf8');
  assert.match(html, /عنوان امروز/);
  assert.match(html, /بدن امروز/);
  assert.match(html, /version":"9\.9/);
  assert.match(html, /https:\/\/docs-preview\.earthcoop\.ir\/documents\/fc\//);
  assert.doesNotMatch(html, /متن کامل نسخه 1\.1/);
});
