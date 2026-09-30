export function buildRecoveredEditorialTruth(inventory = { pages: [] }) {
  const paths = (inventory.pages ?? []).map((page) => page.path).sort((a, b) => a.localeCompare(b, 'en'));
  return {
    recoveredPersianGuides: {
      status: 'historical_snapshot',
      source: 'earthcoop-knowledge-center-0.8.0',
      publicationClaim: 'do_not_present_as_current_product_truth_without_review',
    },
    reviewedEnglishGuides: {
      status: 'verified_current',
      runtimeMapped: false,
      evidence: 'audits/product-guides/2026-09-28-inventory.json',
      paths,
    },
    statusPage: { status: 'needs_review', source: 'earthcoop-knowledge-center-0.8.0' },
    mapPage: { status: 'needs_review', source: 'earthcoop-knowledge-center-0.8.0' },
    glossaryPage: { status: 'needs_review', source: 'earthcoop-knowledge-center-0.8.0' },
    arabic: {
      status: 'unavailable',
      legacyMintlifyArIsArabic: false,
    },
  };
}
