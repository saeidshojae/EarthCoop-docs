const PREVIEW_ORIGIN = 'https://docs-preview.earthcoop.ir';
const REFERENCE_ROUTE_ID = 'econ-ref-01';
const REQUIRED_RUNTIME_FILES = [
  '404/index.html',
  'documents/fc/index.html',
  `documents/${REFERENCE_ROUTE_ID}/index.html`,
  'src/ui/mobile-navigation.js',
  'src/ui/document-reader-controls.js',
  'src/ui/search-dialog.js',
  'src/pages/document-reader.js',
  'recovered-editorial-truth.json',
];

function validateEditorialTruth(editorialTruth) {
  if (editorialTruth?.recoveredPersianGuides?.status !== 'audited_current') {
    throw new Error('Recovered Persian guide editorial truth must remain audited_current');
  }
  if (editorialTruth?.recoveredPersianGuides?.revision !== '2026-10-02-audited-v1') {
    throw new Error('Recovered Persian guide editorial revision mismatch');
  }
  if (editorialTruth?.recoveredPersianGuides?.productTruth !== 'audited_against_current_repository_and_official_v1') {
    throw new Error('Recovered Persian guide product-truth declaration mismatch');
  }
  if (editorialTruth?.reviewedEnglishGuides?.status !== 'verified_current' || editorialTruth.reviewedEnglishGuides.runtimeMapped !== false) {
    throw new Error('Reviewed English guide evidence must remain current but runtime-unmapped');
  }
  for (const key of ['statusPage','mapPage','glossaryPage']) {
    if (editorialTruth?.[key]?.status !== 'needs_review') throw new Error(`Recovered editorial ${key} must remain needs_review`);
  }
  if (editorialTruth?.arabic?.status !== 'unavailable' || editorialTruth.arabic.legacyMintlifyArIsArabic !== false) {
    throw new Error('Arabic editorial truth is invalid');
  }
}

function validateSeo(seoRoutes, sitemapXml) {
  if (!(seoRoutes ?? []).length) throw new Error('Recovered preview SEO routes are missing');
  for (const route of seoRoutes) {
    if (route.indexable !== false) throw new Error(`Preview SEO route is indexable: ${route.documentId ?? route.canonical}`);
    if (!String(route.canonical ?? '').startsWith(`${PREVIEW_ORIGIN}/`)) throw new Error('Preview SEO canonical origin mismatch');
    for (const alternate of route.hreflang ?? []) {
      if (alternate.locale === 'ar') throw new Error('Arabic hreflang is unavailable on preview');
      if (!String(alternate.href ?? '').startsWith(`${PREVIEW_ORIGIN}/`)) throw new Error('Preview SEO hreflang origin mismatch');
    }
  }
  const serialized = JSON.stringify(seoRoutes);
  if (serialized.includes('https://docs.earthcoop.ir')) throw new Error('Preview SEO contains a production canonical');
  if (!sitemapXml || sitemapXml.includes('https://docs.earthcoop.ir')) throw new Error('Preview sitemap contains a production origin');
  for (const route of seoRoutes) {
    if (!sitemapXml.includes(route.canonical)) throw new Error(`Preview sitemap is missing SEO route: ${route.canonical}`);
  }
}

export function validateRecoveredUatContract({
  manifest,
  localeCatalog,
  searchRows,
  seoRoutes,
  editorialTruth,
  robotsTxt,
  sitemapXml,
  runtimeFiles,
}) {
  if (manifest?.previewIndexing !== 'disabled') throw new Error('Preview indexing must be disabled');
  if (JSON.stringify(manifest?.displayLocales) !== JSON.stringify(localeCatalog?.globalLocales)) {
    throw new Error('Manifest/display locale catalog mismatch');
  }
  if ((localeCatalog?.globalLocales ?? []).includes('ar')) throw new Error('Arabic is unavailable and must not be advertised');
  if (manifest?.searchRecordCount !== (searchRows ?? []).length) throw new Error('Recovered search record count mismatch');
  if (manifest?.seoRouteCount !== (seoRoutes ?? []).length) throw new Error('Recovered SEO route count mismatch');
  if (manifest?.editorialTruthArtifact !== 'recovered-editorial-truth.json') throw new Error('Recovered editorial truth artifact contract is missing');
  if (!(searchRows ?? []).some((row) => row.documentId === 'ECON-REF-01' && row.body && row.route.includes(`${REFERENCE_ROUTE_ID}/provisions/`))) {
    throw new Error('ECON-REF-01 is missing from full-text search');
  }
  if (!(seoRoutes ?? []).some((route) => route.documentId === 'ECON-REF-01' && route.indexable === false && route.canonical.startsWith(`${PREVIEW_ORIGIN}/`))) {
    throw new Error('ECON-REF-01 preview SEO route is missing or indexable');
  }
  if (!/Disallow:\s*\//.test(robotsTxt ?? '')) throw new Error('Preview robots policy must disallow indexing');
  validateSeo(seoRoutes, sitemapXml);
  validateEditorialTruth(editorialTruth);
  for (const relative of REQUIRED_RUNTIME_FILES) {
    if (!runtimeFiles?.has(relative)) throw new Error(`Recovered UAT runtime file is missing: ${relative}`);
  }
  return true;
}

export { REQUIRED_RUNTIME_FILES };
