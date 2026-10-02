import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  patchRecoveredDocumentsLandingHtml,
  renderRecoveredStaticDocuments,
} from '../scripts/render-recovered-static-documents.mjs';

const fixtureRuntime = process.env.EARTHCOOP_KC08_FIXTURE;

test('static documents landing is rebuilt from current governed packages and excludes publication-policy snapshot cards', () => {
  const stale = '<html><body><main id="app"><div class="page"><a href="/documents/publication-policy/">سیاست انتشار مرکز دانش</a><p>ثبت‌شده؛ هنوز نافذ نیست</p></div></main></body></html>';
  const foundational = Array.from({ length: 10 }, (_, index) => ({
    code: ['FC','CH','CO','ECON','DG','JUD','LOC','EX','ETH','STD'][index],
    slug: ['fc','ch','co','econ','dg','jud','loc','ex','eth','std'][index],
    title: `سند ${index + 1}`,
    summary: 'خلاصه',
    status: 'effective',
  }));
  const reference = {
    code: 'ECON-REF-01',
    slug: 'econ-ref-01',
    title: 'سند مرجع اقتصاد ارث‌کوپ و معماری نجم بهار',
    summary: 'نسخه مرجع',
    status: 'official_draft',
    contentClass: 'reference',
  };
  const result = patchRecoveredDocumentsLandingHtml(stale, [...foundational, reference]);
  assert.doesNotMatch(result, /publication-policy|سیاست انتشار مرکز دانش/);
  assert.doesNotMatch(result, /ثبت‌شده؛ هنوز نافذ نیست/);
  assert.match(result, /10 سند بنیادین/);
  assert.match(result, /href="\/documents\/econ-ref-01\/"/);
  assert.match(result, /ECON-REF-01/);
  assert.match(result, /اسناد مرجع/);
  assert.equal((result.match(/class="doc-card"/g) || []).length, 11);
});

test('uses recovered 0.8 renderers to regenerate direct document pages from current packages', {
  skip: !fixtureRuntime,
}, async () => {
  const runtimeDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-render-08-'));
  await cp(fixtureRuntime, runtimeDir, { recursive: true });

  const documentPackage = {
    id: 'doc-fc-9-9', slug: 'fc', code: 'FC', title: 'عنوان امروز', summary: 'خلاصه امروز',
    preamble: 'شناسه سند: FC\n\nنسخه: 9.9\n\n---\n\nدیباچه امروز', canonicalLanguage: 'fa',
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
  const styles = await readFile(path.join(runtimeDir, 'styles.css'), 'utf8');
  assert.match(html, /عنوان امروز/);
  assert.match(html, /بدن امروز/);
  assert.match(html, /version":"9\.9/);
  assert.match(html, /https:\/\/docs-preview\.earthcoop\.ir\/documents\/fc\//);
  assert.doesNotMatch(html, /متن کامل نسخه 1\.1/);
  assert.match(html, /class="print-document-brand"/);
  assert.match(html, /src="\/assets\/brand\/earthcoop-logo\.png"/);
  assert.match(html, /<bdi dir="ltr">earthcoop\.ir<\/bdi>/);
  assert.match(styles, /\.print-document-brand\{display:none/);
  assert.match(styles, /@media print[\s\S]*\.print-document-brand\{display:flex/);
});
