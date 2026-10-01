export function buildRecoveredEditorialTruth(inventory = { pages: [] }) {
  const paths = (inventory.pages ?? []).map((page) => page.path).sort((a, b) => a.localeCompare(b, 'en'));
  return {
    recoveredPersianGuides: {
      status: 'audited_current',
      revision: '2026-10-02-audited-v1',
      source: 'recovered-0.8-shell-with-audited-persian-guide-replacement',
      productTruth: 'audited_against_current_repository_and_official_v1',
      publicationClaim: 'current_user_guide_with_explicit_vision_vs_implementation_boundaries',
      maintenance: 're-audit_changed_product_claims_against_current_repository_and_official_sources',
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
