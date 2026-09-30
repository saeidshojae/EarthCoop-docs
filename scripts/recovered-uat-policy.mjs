const REQUIRED_RUNTIME_FILES = [
  '404/index.html',
  'documents/fc/index.html',
  'documents/econ-ref-01-fa-0-1/index.html',
  'src/ui/mobile-navigation.js',
  'src/ui/document-reader-controls.js',
  'src/ui/search-dialog.js',
  'src/pages/document-reader.js',
];

export function validateRecoveredUatContract({
  manifest,
  localeCatalog,
  searchRows,
  seoRoutes,
  robotsTxt,
  runtimeFiles,
}) {
  if (manifest?.previewIndexing !== 'disabled') throw new Error('Preview indexing must be disabled');
  if (JSON.stringify(manifest?.displayLocales) !== JSON.stringify(localeCatalog?.globalLocales)) {
    throw new Error('Manifest/display locale catalog mismatch');
  }
  if ((localeCatalog?.globalLocales ?? []).includes('ar')) throw new Error('Arabic is unavailable and must not be advertised');
  if (!(searchRows ?? []).some((row) => row.documentId === 'ECON-REF-01' && row.body && row.route.includes('econ-ref-01-fa-0-1'))) {
    throw new Error('ECON-REF-01 is missing from full-text search');
  }
  if (!(seoRoutes ?? []).some((route) => route.documentId === 'ECON-REF-01' && route.indexable === false && route.canonical.includes('docs-preview.earthcoop.ir'))) {
    throw new Error('ECON-REF-01 preview SEO route is missing or indexable');
  }
  if (!/Disallow:\s*\//.test(robotsTxt ?? '')) throw new Error('Preview robots policy must disallow indexing');
  for (const relative of REQUIRED_RUNTIME_FILES) {
    if (!runtimeFiles?.has(relative)) throw new Error(`Recovered UAT runtime file is missing: ${relative}`);
  }
  return true;
}

export { REQUIRED_RUNTIME_FILES };
