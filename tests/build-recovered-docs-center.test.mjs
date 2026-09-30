import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { buildRecoveredDocsCenter } from '../scripts/build-recovered-docs-center.mjs';

const execFileAsync = promisify(execFile);

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-recovered-build-'));
  const runtime = path.join(root, 'runtime');
  await mkdir(path.join(runtime, 'src/content/document-packages'), { recursive: true });
  await mkdir(path.join(runtime, 'src/pages'), { recursive: true });
  await writeFile(path.join(runtime, 'index.html'), '<h1>مرکز دانش ارث‌کوپ</h1>');
  await writeFile(path.join(runtime, 'app.js'), 'legacy-app');
  await writeFile(path.join(runtime, 'styles.css'), 'legacy-css');
  await writeFile(path.join(runtime, '.htaccess'), `Options -Indexes\nDirectoryIndex index.html\n\n<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteCond %{HTTPS} !=on\n  RewriteRule ^ https://docs.earthcoop.ir%{REQUEST_URI} [R=301,L]\n\n  RewriteCond %{HTTP_HOST} !^docs\\.earthcoop\\.ir$ [NC]\n  RewriteRule ^ https://docs.earthcoop.ir%{REQUEST_URI} [R=301,L]\n</IfModule>\n`);
  await writeFile(path.join(runtime, 'src/content/document-packages/foundational.generated.fa.js'), 'OLD');
  await writeFile(path.join(runtime, 'src/content/document-packages/index.fa.js'), 'OLD-INDEX');
  await writeFile(path.join(runtime, 'src/content/documents.fa.js'), 'window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.documents = Object.freeze([]);\n');
  await writeFile(path.join(runtime, 'src/pages/document-reader.js'), `function renderDocumentReader(documentRecord) {\n  return \`<div class="breadcrumbs"><a href="/">خانه</a><i></i><a href="/documents/">اسناد بنیادین</a><i></i><span>\${documentRecord.title}</span></div>\`;\n}\n`);

  const archive = path.join(root, 'runtime.tar.gz');
  await execFileAsync('tar', ['-czf', archive, '-C', runtime, '.']);
  const archiveHash = createHash('sha256').update(await readFile(archive)).digest('hex');

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
        fa: { source: 'published/foundational/FC.fa.md', status: 'current' },
        en: { source: null, status: 'not_translated' },
        ar: { source: 'ar/fake.mdx', status: 'current' },
      },
    }],
  }));

  const currentFoundationalPackages = [{
    id: 'FC',
    version: '1.1',
    markdown: `# سند مادر\n\nشناسه سند: FC\n\n---\n\n## دیباچه\nمتن کامل\n\n### ماده FC-001 — اصل\nبدن`,
  }];
  return { root, archive, archiveHash, currentFoundationalPackages };
}

test('builds recovered 0.8 runtime with governed data, full-text corpus and preview-safe SEO', async () => {
  const input = await fixture();
  const outDir = path.join(input.root, 'dist');
  const report = await buildRecoveredDocsCenter({
    rootDir: input.root,
    outDir,
    sourceSha: '1'.repeat(40),
    builtAt: '2026-09-30T00:00:00Z',
    runtimeArchiveSource: input.archive,
    runtimeArchiveSha256: input.archiveHash,
    verifyRecoveredFiles: false,
    renderStaticDocuments: false,
    canonicalOrigin: 'https://docs-preview.earthcoop.ir',
    currentFoundationalPackages: input.currentFoundationalPackages,
  });

  assert.match(await readFile(path.join(outDir, 'index.html'), 'utf8'), /مرکز دانش/);
  const generated = await readFile(path.join(outDir, 'src/content/document-packages/foundational.generated.fa.js'), 'utf8');
  assert.match(generated, /FC-001/);
  assert.match(generated, /registered_not_effective/);
  assert.doesNotMatch(generated, /ar\/fake/);

  const packageIndex = await readFile(path.join(outDir, 'src/content/document-packages/index.fa.js'), 'utf8');
  assert.match(packageIndex, /referenceDocumentPackages/);

  const reader = await readFile(path.join(outDir, 'src/pages/document-reader.js'), 'utf8');
  assert.match(reader, /documentRecord\.contentClass === 'reference'/);
  assert.match(reader, /اسناد مرجع/);
  assert.match(reader, /اسناد بنیادین/);

  const locales = JSON.parse(await readFile(path.join(outDir, 'recovered-locales.json'), 'utf8'));
  assert.deepEqual(locales.globalLocales, ['fa']);

  const search = JSON.parse(await readFile(path.join(outDir, 'recovered-search-index.json'), 'utf8'));
  assert.equal(search.length, 1);
  assert.match(search[0].body, /بدن/);

  const robots = await readFile(path.join(outDir, 'robots.txt'), 'utf8');
  assert.match(robots, /Disallow: \//);
  assert.doesNotMatch(robots, /docs\.earthcoop\.ir/);
  const sitemap = await readFile(path.join(outDir, 'sitemap.xml'), 'utf8');
  assert.match(sitemap, /docs-preview\.earthcoop\.ir\/documents\/fc\//);
  assert.doesNotMatch(sitemap, /https:\/\/docs\.earthcoop\.ir/);

  const config = await readFile(path.join(outDir, 'site-config.js'), 'utf8');
  assert.match(config, /deploymentTarget: "self-hosted"/);
  assert.match(config, /https:\/\/docs-preview\.earthcoop\.ir/);

  const htaccess = await readFile(path.join(outDir, '.htaccess'), 'utf8');
  assert.match(htaccess, /docs-preview\.earthcoop\.ir/);
  assert.match(htaccess, /Header always set X-Robots-Tag "noindex, nofollow"/);
  assert.doesNotMatch(htaccess, /X-Robots-Tag "noindex, nofollow" env=/);
  assert.doesNotMatch(htaccess, /https:\/\/docs\.earthcoop\.ir/);
  assert.doesNotMatch(htaccess, /!\^docs\\\.earthcoop\\\.ir\$/);

  assert.equal(report.runtimeBaseline, 'earthcoop-knowledge-center-0.8.0');
  assert.deepEqual(report.displayLocales, ['fa']);
  assert.deepEqual(report.guideContentPolicy, {
    fa: 'recovered_0.8_editorial_snapshot_under_audit',
    en: 'reviewed_repository_guides_not_yet_mapped_to_recovered_runtime',
    ar: 'unavailable_legacy_rtl_alias_is_not_arabic',
  });
  assert.equal(report.documentCount, 1);
  assert.equal(report.referenceCount, 0);
  assert.equal(report.searchRecordCount, 1);
});
