import assert from 'node:assert/strict';
import test from 'node:test';

import { validateRecoveredUatContract } from '../scripts/recovered-uat-policy.mjs';

const valid = {
  manifest: {
    displayLocales:['fa'], previewIndexing:'disabled', searchRecordCount:1, seoRouteCount:1,
    editorialTruthArtifact:'recovered-editorial-truth.json',
  },
  localeCatalog: { globalLocales:['fa'] },
  searchRows: [{ documentId:'ECON-REF-01', body:'اقتصاد و حق', route:'#/documents/econ-ref-01/provisions/section-1' }],
  seoRoutes: [{
    documentId:'ECON-REF-01', canonical:'https://docs-preview.earthcoop.ir/documents/econ-ref-01/', indexable:false,
    hreflang:[{locale:'fa',href:'https://docs-preview.earthcoop.ir/documents/econ-ref-01/'}],
  }],
  editorialTruth: {
    recoveredPersianGuides:{
      status:'audited_current',
      revision:'2026-10-02-audited-v1',
      productTruth:'audited_against_current_repository_and_official_v1',
    },
    reviewedEnglishGuides:{status:'verified_current',runtimeMapped:false},
    statusPage:{status:'audited_current',revision:'2026-10-02-reference-audit-v1'},
    mapPage:{status:'audited_current',revision:'2026-10-02-reference-audit-v1'},
    glossaryPage:{status:'audited_current',revision:'2026-10-02-reference-audit-v1'},
    arabic:{status:'unavailable',legacyMintlifyArIsArabic:false},
  },
  robotsTxt: 'User-agent: *\nDisallow: /\n',
  sitemapXml: '<?xml version="1.0"?><urlset><url><loc>https://docs-preview.earthcoop.ir/documents/econ-ref-01/</loc></url></urlset>',
  runtimeFiles: new Set([
    '404/index.html',
    'documents/fc/index.html',
    'documents/econ-ref-01/index.html',
    'src/ui/mobile-navigation.js',
    'src/ui/document-reader-controls.js',
    'src/ui/search-dialog.js',
    'src/pages/document-reader.js',
    'recovered-editorial-truth.json',
  ]),
};

function cloneValid() {
  const input = structuredClone(valid);
  input.runtimeFiles = new Set(valid.runtimeFiles);
  return input;
}

test('accepts the full recovered preview UAT contract', () => {
  assert.equal(validateRecoveredUatContract(cloneValid()), true);
});

test('fails closed when reference discovery, preview noindex, mobile/reader controls or locale truth regress', () => {
  for (const mutate of [
    (x) => { x.searchRows = []; x.manifest.searchRecordCount = 0; },
    (x) => { x.seoRoutes = []; x.manifest.seoRouteCount = 0; },
    (x) => { x.robotsTxt = 'User-agent: *\nAllow: /\n'; },
    (x) => { x.localeCatalog.globalLocales = ['fa','ar']; },
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

test('rejects editorial truth regressions for guides, audited reference pages or unavailable Arabic', () => {
  for (const mutate of [
    (x) => { x.editorialTruth.recoveredPersianGuides.status = 'historical_snapshot'; },
    (x) => { x.editorialTruth.recoveredPersianGuides.revision = 'older'; },
    (x) => { x.editorialTruth.recoveredPersianGuides.productTruth = 'unreviewed'; },
    (x) => { x.editorialTruth.reviewedEnglishGuides.runtimeMapped = true; },
    (x) => { x.editorialTruth.statusPage.status = 'needs_review'; },
    (x) => { x.editorialTruth.mapPage.revision = 'older'; },
    (x) => { x.editorialTruth.glossaryPage.status = 'needs_review'; },
    (x) => { x.editorialTruth.arabic.status = 'verified_current'; },
  ]) {
    const input = cloneValid();
    mutate(input);
    assert.throws(() => validateRecoveredUatContract(input), /editorial|Arabic|guide|revision|product-truth|audit/i);
  }
});
