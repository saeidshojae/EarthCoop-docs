export function buildRecoveredEditorialTruth(inventory = { pages: [] }) {
  const paths = (inventory.pages ?? []).map((page) => page.path).sort((a, b) => a.localeCompare(b, 'en'));
  const auditedReference = (source) => ({
    status: 'audited_current',
    revision: '2026-10-02-reference-audit-v1',
    source,
  });
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
    statusPage: auditedReference('EarthCoop main f88c28a + current tests and official-v1 boundaries'),
    mapPage: auditedReference('audited Persian guides + current ecosystem architecture'),
    glossaryPage: auditedReference('canonical terminology + official-v1 + audited Persian guides'),
    arabic: {
      status: 'unavailable',
      legacyMintlifyArIsArabic: false,
    },
  };
}
