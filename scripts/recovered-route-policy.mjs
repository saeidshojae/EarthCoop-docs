const NON_EFFECTIVE = new Set([
  'registered_not_effective',
  'approved_not_effective',
  'official_draft',
  'under_audit',
  'unofficial_explanation',
  'public_consultation',
  'concept',
]);

function routeFor(item) {
  const routeId = item.routeId ?? item.documentId.toLowerCase();
  const collection = item.contentClass === 'reference' ? 'references' : 'foundational';
  return {
    documentId: item.documentId,
    contentClass: item.contentClass,
    collection,
    routeId,
    hashRoute: `#/documents/${routeId}`,
    staticPath: `/documents/${routeId}/`,
    locale: item.canonicalLanguage,
    legalStatus: item.legalStatus,
    legalEffect: item.legalStatus === 'effective' && !NON_EFFECTIVE.has(item.legalStatus),
  };
}

export function buildRecoveredRouteEntries(catalog) {
  return [...(catalog.documents ?? []), ...(catalog.references ?? [])]
    .map(routeFor)
    .sort((a, b) => a.routeId.localeCompare(b.routeId, 'en'));
}
