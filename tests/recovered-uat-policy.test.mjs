import assert from 'node:assert/strict';
import test from 'node:test';

import { validateRecoveredUatContract } from '../scripts/recovered-uat-policy.mjs';

const englishRuntimeFiles = [
  'en/index.html',
  ...Array.from({ length: 30 }, (_, index) => `en/guide-${String(index + 1).padStart(2, '0')}/index.html`),
];

const valid = {
  manifest: {
    displayLocales:['fa','en'], documentLocales:['fa'], guideLocales:['en'],
    englishGuideCount:31, englishGuideAuditBaseline:'f88c28a518749fb81133c3affa5e5fbf353f844a',
    previewIndexing:'disabled', searchRecordCount:2, seoRouteCount:2,
    editorialTruthArtifact:'recovered-editorial-truth.json',
  },
  localeCatalog: { globalLocales:['fa','en'], documentLocales:['fa'], guideLocales:['en'] },
  searchRows: [
    { documentId:'ECON-REF-01', locale:'fa', body:'اقتصاد و حق', route:'#/documents/econ-ref-01/provisions/section-1' },
    { inventoryId:'guide.introduction', locale:'en', body:'EarthCoop guide', route:'/en/introduction/' },
  ],
  seoRoutes: [
    {
      documentId:'ECON-REF-01', canonical:'https://docs-preview.earthcoop.ir/documents/econ-ref-01/', indexable:false,
      hreflang:[{locale:'fa',href:'https://docs-preview.earthcoop.ir/documents/econ-ref-01/'}],
    },
    {
      inventoryId:'guide.introduction', locale:'en', canonical:'https://docs-preview.earthcoop.ir/en/introduction/', indexable:false,
      hreflang:[{locale:'en',href:'https://docs-preview.earthcoop.ir/en/introduction/'}],
    },
  ],
  editorialTruth: {
    recoveredPersianGuides:{
      status:'audited_current',
      revision:'2026-10-02-audited-v1',
      productTruth:'audited_against_current_repository_and_official_v1',
    },
    reviewedEnglishGuides:{
      status:'audited_current', runtimeMapped:true, guideCount:31,
      evidence:'audits/product-guides/2026-10-02-evidence.json',
      applicationBaseline:'f88c28a518749fb81133c3affa5e5fbf353f844a',
      foundationalEnglishAvailable:false,
    },
    statusPage:{status:'audited_current',revision:'2026-10-02-reference-audit-v1'},
    mapPage:{status:'audited_current',revision:'2026-10-02-reference-audit-v1'},
    glossaryPage:{status:'audited_current',revision:'2026-10-02-reference-audit-v1'},
    arabic:{status:'unavailable',legacyMintlifyArIsArabic:false},
  },
  robotsTxt: 'User-agent: *\nDisallow: /\n',
  sitemapXml: '<?xml version="1.0"?><urlset><url><loc>https://docs-preview.earthcoop.ir/documents/econ-ref-01/</loc></url><url><loc>https://docs-preview.earthcoop.ir/en/introduction/</loc></url></urlset>',
  runtimeFiles: new Set([
    '404/index.html',
    'documents/fc/index.html',
    'documents/econ-ref-01/index.html',
    'src/ui/mobile-navigation.js',
    'src/ui/document-reader-controls.js',
    'src/ui/search-dialog.js',
    'src/pages/document-reader.js',
    'recovered-editorial-truth.json',
    ...englishRuntimeFiles,
  ]),
};

function cloneValid() {
  const input = structuredClone(valid);
  input.runtimeFiles = new Set(valid.runtimeFiles);
  return input;
}

test('accepts the full recovered preview UAT contract with 31 audited English product guides', () => {
  assert.equal(validateRecoveredUatContract(cloneValid()), true);
});

test('fails closed when reference discovery, preview noindex, reader controls or locale/runtime mapping truth regress', () => {
  for (const mutate of [
    (x) => { x.searchRows = x.searchRows.filter((row) => row.documentId !== 'ECON-REF-01'); x.manifest.searchRecordCount = x.searchRows.length; },
    (x) => { x.searchRows = x.searchRows.filter((row) => row.locale !== 'en'); x.manifest.searchRecordCount = x.searchRows.length; },
    (x) => { x.seoRoutes = x.seoRoutes.filter((route) => route.documentId !== 'ECON-REF-01'); x.manifest.seoRouteCount = x.seoRoutes.length; },
    (x) => { x.robotsTxt = 'User-agent: *\nAllow: /\n'; },
    (x) => { x.localeCatalog.globalLocales = ['fa','en','ar']; },
    (x) => { x.localeCatalog.guideLocales = []; },
    (x) => { x.manifest.englishGuideCount = 30; },
    (x) => { x.runtimeFiles.delete('en/guide-30/index.html'); },
    (x) => { x.runtimeFiles.delete('src/ui/mobile-navigation.js'); },
    (x) => { x.runtimeFiles.delete('src/ui/document-reader-controls.js'); },
    (x) => { x.runtimeFiles.delete('404/index.html'); },
    (x) => { x.runtimeFiles.delete('documents/econ-ref-01/index.html'); },
    (x) => { x.runtimeFiles.delete('recovered-editorial-truth.json'); },
  ]) {
    const input = cloneValid();
    mutate(input);
    assert.throws(() => validateRecoveredUatContract(input));
  }
});

test('rejects any production canonical, sitemap or false Arabic alternate on preview', () => {
  for (const mutate of [
    (x) => { x.seoRoutes[0].canonical = 'https://docs.earthcoop.ir/documents/econ-ref-01/'; },
    (x) => { x.seoRoutes[0].hreflang.push({locale:'ar',href:'https://docs-preview.earthcoop.ir/ar/econ-ref-01/'}); },
    (x) => { x.sitemapXml = x.sitemapXml.replace('docs-preview.earthcoop.ir','docs.earthcoop.ir'); },
    (x) => { x.seoRoutes[0].indexable = true; },
  ]) {
    const input = cloneValid();
    mutate(input);
    assert.throws(() => validateRecoveredUatContract(input), /SEO|Arabic|sitemap|index/i);
  }
});

test('rejects editorial truth regressions for mapped English guides, audited reference pages or unavailable Arabic', () => {
  for (const mutate of [
    (x) => { x.editorialTruth.recoveredPersianGuides.status = 'historical_snapshot'; },
    (x) => { x.editorialTruth.recoveredPersianGuides.revision = 'older'; },
    (x) => { x.editorialTruth.recoveredPersianGuides.productTruth = 'unreviewed'; },
    (x) => { x.editorialTruth.reviewedEnglishGuides.runtimeMapped = false; },
    (x) => { x.editorialTruth.reviewedEnglishGuides.status = 'verified_current'; },
    (x) => { x.editorialTruth.reviewedEnglishGuides.guideCount = 30; },
    (x) => { x.editorialTruth.reviewedEnglishGuides.applicationBaseline = 'older'; },
    (x) => { x.editorialTruth.statusPage.status = 'needs_review'; },
    (x) => { x.editorialTruth.mapPage.revision = 'older'; },
    (x) => { x.editorialTruth.glossaryPage.status = 'needs_review'; },
    (x) => { x.editorialTruth.arabic.status = 'verified_current'; },
  ]) {
    const input = cloneValid();
    mutate(input);
    assert.throws(() => validateRecoveredUatContract(input), /editorial|Arabic|guide|revision|product-truth|audit|English|baseline/i);
  }
});
