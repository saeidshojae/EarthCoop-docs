export function buildRecoveredEditorialTruth(
  inventory = { pages: [] },
  { englishAudit = null, runtimeMapped = false } = {},
) {
  const inventoryPaths = (inventory.pages ?? []).map((page) => page.path);
  const auditGuides = englishAudit?.guides ?? [];
  const auditPaths = auditGuides.map((guide) => guide.path);
  const paths = (auditPaths.length ? auditPaths : inventoryPaths).sort((a, b) => a.localeCompare(b, 'en'));
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
    reviewedEnglishGuides: englishAudit ? {
      status: runtimeMapped ? 'audited_current' : 'revalidated_current',
      runtimeMapped,
      evidence: 'audits/product-guides/2026-10-02-evidence.json',
      auditDate: englishAudit.auditDate ?? '2026-10-02',
      applicationBaseline: englishAudit.applicationBaseline ?? null,
      guideCount: englishAudit.guideCount ?? paths.length,
      foundationalEnglishAvailable: englishAudit.foundationalEnglishAvailable === true,
      paths,
    } : {
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
