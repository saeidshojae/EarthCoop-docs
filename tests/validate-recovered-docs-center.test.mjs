import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateRecoveredDocsCenter } from '../scripts/validate-recovered-docs-center.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const englishRuntimeFiles = [
  'en/index.html',
  ...Array.from({ length: 30 }, (_, index) => `en/guide-${String(index + 1).padStart(2, '0')}/index.html`),
];

async function fixture() {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-validate-recovered-'));
  await mkdir(path.join(outDir, 'src/content/document-packages'), { recursive: true });
  const localeCatalog = {
    globalLocales: ['fa','en'],
    documentLocales: ['fa'],
    guideLocales: ['en'],
    byDocument: { 'ECON-REF-01': { available: [{ locale: 'fa', direction: 'rtl', status: 'current' }], unavailable: ['en', 'ar'] } },
  };
  const searchRows = [
    { documentId: 'ECON-REF-01', contentClass: 'reference', locale: 'fa', title: 'سند مرجع اقتصاد', heading: 'بخش', anchor: 'section-1', body: 'اقتصاد و حق', status: 'official_draft', version: '1.0', route: '#/documents/econ-ref-01/provisions/section-1' },
    { inventoryId: 'guide.introduction', contentClass: 'product_guide', locale: 'en', title: 'Introduction', heading: 'Introduction', anchor: null, body: 'EarthCoop guide', status: 'audited_current', version: '1.0', route: '/en/introduction/' },
  ];
  const seoRoutes = [
    { documentId: 'ECON-REF-01', routeId: 'econ-ref-01', staticPath: '/documents/econ-ref-01/', locale: 'fa', legalStatus: 'official_draft', contentClass: 'reference', canonical: 'https://docs-preview.earthcoop.ir/documents/econ-ref-01/', indexable: false, hreflang: [{ locale: 'fa', href: 'https://docs-preview.earthcoop.ir/documents/econ-ref-01/' }] },
    { inventoryId: 'guide.introduction', staticPath: '/en/introduction/', locale: 'en', contentClass: 'product_guide', canonical: 'https://docs-preview.earthcoop.ir/en/introduction/', indexable: false, hreflang: [{ locale: 'en', href: 'https://docs-preview.earthcoop.ir/en/introduction/' }] },
  ];
  const editorialTruth = {
    recoveredPersianGuides: {
      status: 'audited_current',
      revision: '2026-10-02-audited-v1',
      source: 'recovered-0.8-shell-with-audited-persian-guide-replacement',
      productTruth: 'audited_against_current_repository_and_official_v1',
      publicationClaim: 'current_user_guide_with_explicit_vision_vs_implementation_boundaries',
    },
    reviewedEnglishGuides: {
      status: 'audited_current', runtimeMapped: true,
      evidence: 'audits/product-guides/2026-10-02-evidence.json',
      applicationBaseline: 'f88c28a518749fb81133c3affa5e5fbf353f844a',
      guideCount: 31, foundationalEnglishAvailable: false, paths: [],
    },
    statusPage: { status: 'audited_current', revision: '2026-10-02-reference-audit-v1', source: 'EarthCoop main f88c28a + current tests and official-v1 boundaries' },
    mapPage: { status: 'audited_current', revision: '2026-10-02-reference-audit-v1', source: 'audited Persian guides + current ecosystem architecture' },
    glossaryPage: { status: 'audited_current', revision: '2026-10-02-reference-audit-v1', source: 'canonical terminology + official-v1 + audited Persian guides' },
    arabic: { status: 'unavailable', legacyMintlifyArIsArabic: false },
  };
  const foundationalPackages = [{
    id: 'fc', slug: 'fc', code: 'FC', title: 'سند مادر EarthCoop', status: 'effective',
    currentVersion: { version: '1.0', publishedAt: '2026-10-01', sourcePath: 'releases/foundational/2026-10-01/consolidated/FC-1.0.full.fa.md' },
    provisions: [], contentClass: 'foundational_document',
  }];
  const foundationalSource = `window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.foundationalDocumentPackages = Object.freeze(${JSON.stringify(foundationalPackages, null, 2)});\nwindow.EC_CONTENT.referenceDocumentPackages = Object.freeze([]);\n`;
  const directFc = '<html><button data-document-copy>کپی نشانی سند</button><button data-document-print>چاپ سند</button><a data-document-download href="/downloads/documents/EarthCoop-FC-1.0-fa.pdf">دانلود PDF</a><button data-document-history>تاریخچه نسخه‌ها</button><script>initializeDocumentReaderControls()</script></html>';
  const readerControls = "function initializeDocumentReaderControls(){navigator.clipboard.writeText('x');window.print();history.pushState(null,'','#provision-fc-001');document.querySelectorAll('#documentToc a');const pdf='/downloads/documents/EarthCoop-FC-1.0-fa.pdf';}";
  const files = {
    'index.html': '<html><script src="site-config.js"></script></html>',
    'app.js': 'runtime',
    'styles.css': 'styles',
    '.htaccess': `Options -Indexes\nDirectoryIndex index.html\n\n<IfModule mod_rewrite.c>\n  RewriteEngine On\n  RewriteCond %{HTTPS} !=on\n  RewriteRule ^ https://docs-preview.earthcoop.ir%{REQUEST_URI} [R=301,L]\n\n  RewriteCond %{HTTP_HOST} !^docs-preview\\.earthcoop\\.ir$ [NC]\n  RewriteRule ^ https://docs-preview.earthcoop.ir%{REQUEST_URI} [R=301,L]\n</IfModule>\n\nErrorDocument 404 /404/index.html\n\n<IfModule mod_headers.c>\n  Header always set X-Robots-Tag "noindex, nofollow"\n</IfModule>\n`,
    'site-config.js': 'window.EC_SITE_CONFIG = Object.freeze({\n  deploymentTarget: "self-hosted",\n  canonicalOrigin: "https://docs-preview.earthcoop.ir",\n});\n',
    'recovered-locales.json': `${JSON.stringify(localeCatalog, null, 2)}\n`,
    'recovered-search-index.json': `${JSON.stringify(searchRows, null, 2)}\n`,
    'recovered-seo-routes.json': `${JSON.stringify(seoRoutes, null, 2)}\n`,
    'recovered-editorial-truth.json': `${JSON.stringify(editorialTruth, null, 2)}\n`,
    'robots.txt': 'User-agent: *\nDisallow: /\n',
    'sitemap.xml': '<?xml version="1.0"?><urlset><url><loc>https://docs-preview.earthcoop.ir/documents/econ-ref-01/</loc></url><url><loc>https://docs-preview.earthcoop.ir/en/introduction/</loc></url></urlset>\n',
    '404/index.html': '<html>404</html>',
    'documents/fc/index.html': directFc,
    'documents/econ-ref-01/index.html': '<html>ECON-REF-01</html>',
    'downloads/documents/EarthCoop-FC-1.0-fa.pdf': '%PDF-current',
    'src/ui/mobile-navigation.js': 'mobile navigation',
    'src/ui/document-reader-controls.js': readerControls,
    'src/ui/search-dialog.js': 'search dialog',
    'src/pages/document-reader.js': 'reader',
    'src/content/document-packages/foundational.generated.fa.js': foundationalSource,
    'earthcoop-knowledge-center-0.8.0-cpanel.tar.gz': 'archive-bytes',
  };
  for (const relative of englishRuntimeFiles) files[relative] = `<html lang="en"><main>${relative}</main></html>`;

  const hashes = {};
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(outDir, relative);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, content);
    hashes[relative] = sha256(Buffer.from(content));
  }
  const sourceSha = '1'.repeat(40);
  const archiveSha = hashes['earthcoop-knowledge-center-0.8.0-cpanel.tar.gz'];
  const manifest = {
    schemaVersion: 2,
    repository: 'saeidshojae/EarthCoop-docs',
    sourceSha,
    builtAt: '2026-09-30T00:00:00Z',
    runtimeBaseline: 'earthcoop-knowledge-center-0.8.0',
    runtimeArchiveSha256: archiveSha,
    canonicalLanguage: 'fa',
    displayLocales: ['fa','en'],
    documentLocales: ['fa'],
    guideLocales: ['en'],
    englishGuideCount: 31,
    englishGuideAuditBaseline: 'f88c28a518749fb81133c3affa5e5fbf353f844a',
    guideContentPolicy: {
      fa: 'audited_current_2026-10-02_official-v1_and_repository_evidence',
      en: 'audited_current_2026-10-02_product_guides_runtime_mapped',
      ar: 'unavailable_legacy_rtl_alias_is_not_arabic',
    },
    editorialTruthArtifact: 'recovered-editorial-truth.json',
    canonicalOrigin: 'https://docs-preview.earthcoop.ir',
    previewIndexing: 'disabled',
    searchRecordCount: searchRows.length,
    seoRouteCount: seoRoutes.length,
    fileCount: Object.keys(hashes).length + 1,
    hashes,
  };
  await writeFile(path.join(outDir, 'deployment-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { outDir, sourceSha, archiveSha };
}

function validateArgs(input, expectedSourceSha = input.sourceSha) {
  return { outDir: input.outDir, expectedSourceSha, expectedRuntimeArchiveSha: input.archiveSha };
}

async function rewriteDeclaredFile(input, relative, content) {
  const absolute = path.join(input.outDir, relative);
  await writeFile(absolute, content);
  const manifestPath = path.join(input.outDir, 'deployment-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.hashes[relative] = sha256(Buffer.from(content));
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

test('accepts a complete recovered 0.8 fa/en preview build and verifies every declared file hash', async () => {
  const input = await fixture();
  const result = await validateRecoveredDocsCenter(validateArgs(input));
  assert.equal(result.valid, true);
  assert.equal(result.runtimeBaseline, 'earthcoop-knowledge-center-0.8.0');
});

test('rejects a tampered file after manifest creation', async () => {
  const input = await fixture();
  await writeFile(path.join(input.outDir, 'app.js'), 'tampered');
  await assert.rejects(validateRecoveredDocsCenter(validateArgs(input)), /hash mismatch.*app\.js/i);
});

test('rejects a production redirect in recovered htaccess even when its hash is valid', async () => {
  const input = await fixture();
  const htaccessPath = path.join(input.outDir, '.htaccess');
  const bad = `Options -Indexes\nRewriteRule ^ https://docs.earthcoop.ir%{REQUEST_URI} [R=301,L]\n`;
  await writeFile(htaccessPath, bad);
  const manifestPath = path.join(input.outDir, 'deployment-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  manifest.hashes['.htaccess'] = sha256(Buffer.from(bad));
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  await assert.rejects(validateRecoveredDocsCenter(validateArgs(input)), /htaccess.*preview|production redirect/i);
});

test('rejects wrong source SHA, runtime baseline, preview origin, locale mapping, guide policy, English audit metadata, or editorial declaration', async () => {
  const input = await fixture();
  const manifestPath = path.join(input.outDir, 'deployment-manifest.json');
  const original = JSON.parse(await readFile(manifestPath, 'utf8'));

  await assert.rejects(validateRecoveredDocsCenter(validateArgs(input, '2'.repeat(40))), /source SHA/i);

  for (const mutate of [
    (m) => { m.runtimeBaseline = 'other'; },
    (m) => { m.canonicalOrigin = 'https://docs.earthcoop.ir'; },
    (m) => { m.displayLocales = ['fa']; },
    (m) => { m.documentLocales = ['fa','en']; },
    (m) => { m.guideLocales = []; },
    (m) => { m.englishGuideCount = 30; },
    (m) => { m.englishGuideAuditBaseline = 'older'; },
    (m) => { m.guideContentPolicy.en = 'reviewed_repository_guides_not_yet_mapped_to_recovered_runtime'; },
    (m) => { m.previewIndexing = 'enabled'; },
    (m) => { m.editorialTruthArtifact = 'other.json'; },
  ]) {
    const changed = structuredClone(original);
    mutate(changed);
    await writeFile(manifestPath, JSON.stringify(changed));
    await assert.rejects(validateRecoveredDocsCenter(validateArgs(input)), /baseline|preview origin|display locales|document locales|guide locales|English guide|guide content policy|preview indexing|editorial truth/i);
  }
});

test('rejects a missing recovery archive declaration', async () => {
  const input = await fixture();
  const manifestPath = path.join(input.outDir, 'deployment-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  delete manifest.hashes['earthcoop-knowledge-center-0.8.0-cpanel.tar.gz'];
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(validateRecoveredDocsCenter(validateArgs(input)), /recovery archive/i);
});

test('rejects production SEO leakage or false editorial truth even when hashes are internally consistent', async () => {
  for (const scenario of ['seo', 'editorial']) {
    const input = await fixture();
    const manifestPath = path.join(input.outDir, 'deployment-manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    const relative = scenario === 'seo' ? 'recovered-seo-routes.json' : 'recovered-editorial-truth.json';
    const absolute = path.join(input.outDir, relative);
    const data = JSON.parse(await readFile(absolute, 'utf8'));
    if (scenario === 'seo') data[0].canonical = 'https://docs.earthcoop.ir/documents/econ-ref-01/';
    else data.reviewedEnglishGuides.runtimeMapped = false;
    const serialized = `${JSON.stringify(data, null, 2)}\n`;
    await writeFile(absolute, serialized);
    manifest.hashes[relative] = sha256(Buffer.from(serialized));
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    await assert.rejects(validateRecoveredDocsCenter(validateArgs(input)), /SEO|production|editorial|audited_current|guide|English/i);
  }
});

test('rejects a stale foundational PDF even when every declared hash is internally consistent', async () => {
  const input = await fixture();
  const current = 'downloads/documents/EarthCoop-FC-1.0-fa.pdf';
  const stale = 'downloads/documents/EarthCoop-FC-0.2-fa.pdf';
  await rename(path.join(input.outDir, current), path.join(input.outDir, stale));
  const manifestPath = path.join(input.outDir, 'deployment-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const hash = manifest.hashes[current];
  delete manifest.hashes[current];
  manifest.hashes[stale] = hash;
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  await assert.rejects(validateRecoveredDocsCenter(validateArgs(input)), /PDF.*FC.*1\.0.*0\.2|FC.*PDF.*0\.2.*1\.0/i);
});

test('rejects a direct document page whose reader controls render but are not wired', async () => {
  const input = await fixture();
  const broken = '<html><button>کپی نشانی سند</button><button>چاپ سند</button><button>تاریخچه نسخه‌ها</button></html>';
  await rewriteDeclaredFile(input, 'documents/fc/index.html', broken);

  await assert.rejects(validateRecoveredDocsCenter(validateArgs(input)), /Direct document page FC.*download|Direct document page FC.*initialization/i);
});
