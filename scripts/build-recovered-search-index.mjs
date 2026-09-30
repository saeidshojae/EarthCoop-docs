function normalizeText(value) {
  return String(value ?? '')
    .replace(/[يى]/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/\u200c/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function flattenProvisions(nodes) {
  return (nodes ?? []).flatMap((node) => [node, ...flattenProvisions(node.children)]);
}

export function buildRecoveredSearchIndex(packages, { allowedLocales = ['fa'] } = {}) {
  const allowed = new Set(allowedLocales);
  const rows = [];
  for (const record of packages ?? []) {
    const locale = record.canonicalLanguage ?? 'fa';
    if (!allowed.has(locale)) continue;
    for (const provision of flattenProvisions(record.provisions)) {
      const body = normalizeText(provision.body);
      const heading = normalizeText(provision.title);
      if (!body && !heading) continue;
      rows.push({
        documentId: record.code,
        contentClass: record.contentClass ?? 'foundational_document',
        locale,
        title: normalizeText(record.title),
        heading,
        anchor: provision.stableSlug,
        body,
        status: record.status,
        version: record.currentVersion?.version ?? null,
        route: `#/documents/${record.slug}?anchor=${provision.stableSlug}`,
      });
    }
  }
  return rows.sort((a, b) =>
    a.documentId.localeCompare(b.documentId, 'en')
    || a.anchor.localeCompare(b.anchor, 'en'));
}

export function serializeRecoveredSearchIndex(rows) {
  return `window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.generatedSearchIndex = Object.freeze(${JSON.stringify(rows, null, 2)});\n`;
}
