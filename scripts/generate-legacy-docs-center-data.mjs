import { buildRecoveredContentCatalog } from './build-recovered-content-catalog.mjs';
import {
  parseFoundationalMarkdown,
  toLegacyDocumentPackage,
} from './legacy-docs-center-adapter.mjs';

function referenceTitle(markdown, fallback) {
  const body = String(markdown ?? '').replace(/^---[\s\S]*?---\s*/m, '');
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!heading) return fallback;
  return heading.replace(/^ECON-REF-01\s+—\s+/, '').trim();
}

export async function buildLegacyFoundationalPackages(rootDir, { currentPackages, catalog } = {}) {
  const governed = catalog ?? await buildRecoveredContentCatalog(rootDir, {
    currentFoundationalPackages: currentPackages,
  });

  return governed.documents.map((entry) => {
    const parsed = parseFoundationalMarkdown(entry.markdown, { documentId: entry.documentId });
    return toLegacyDocumentPackage(parsed, entry);
  }).sort((a, b) => a.code.localeCompare(b.code, 'en'));
}

export async function buildLegacyReferencePackages(rootDir, { currentPackages, catalog } = {}) {
  const governed = catalog ?? await buildRecoveredContentCatalog(rootDir, {
    currentFoundationalPackages: currentPackages,
  });
  return governed.references.map((entry) => ({
    id: entry.routeId,
    slug: entry.routeId,
    code: entry.documentId,
    title: referenceTitle(entry.markdown, entry.documentId),
    summary: `نسخه ${entry.version} — ${entry.legalStatus}`,
    canonicalLanguage: entry.canonicalLanguage,
    status: entry.legalStatus,
    source: entry.source,
    authority: entry.authority,
    reviewedAt: entry.reviewedAt,
    currentVersion: {
      version: entry.version,
      publishedAt: entry.reviewedAt,
      sourcePath: entry.source,
    },
    bodyMarkdown: entry.markdown,
    contentClass: 'reference',
  })).sort((a, b) => a.code.localeCompare(b.code, 'en'));
}

export function serializeLegacyFoundationalPackages(packages, referencePackages = []) {
  return `window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.foundationalDocumentPackages = Object.freeze(${JSON.stringify(packages, null, 2)});\nwindow.EC_CONTENT.referenceDocumentPackages = Object.freeze(${JSON.stringify(referencePackages, null, 2)});\n`;
}
