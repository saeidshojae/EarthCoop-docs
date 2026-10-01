import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { buildCurrentFoundational } from './build-current-foundational.mjs';
import { resolveDisplayLocales } from './docs-center-locale-policy.mjs';

const USABLE = new Set(['current', 'needs_review', 'outdated']);
const FOUNDATIONAL_DISPLAY_ORDER = Object.freeze(['FC', 'CO', 'CH', 'ECON', 'DG', 'JUD', 'LOC', 'EX', 'ETH', 'STD']);
const FOUNDATIONAL_DISPLAY_POSITION = new Map(FOUNDATIONAL_DISPLAY_ORDER.map((id, index) => [id, index]));

function routeIdForReference(entry) {
  return entry.documentId.toLowerCase();
}

function sharedMetadata(entry, source, markdown) {
  return {
    documentId: entry.documentId,
    slug: entry.slug,
    contentClass: entry.contentClass,
    canonicalLanguage: entry.canonicalLanguage,
    legalStatus: entry.legalStatus,
    authority: entry.authority,
    version: entry.version,
    reviewedAt: entry.reviewedAt,
    renditions: entry.renditions,
    source,
    markdown,
  };
}

function isRegisteredReleaseSource(source) {
  return source.startsWith('releases/foundational/');
}

function foundationalOrder(a, b) {
  const aPosition = FOUNDATIONAL_DISPLAY_POSITION.get(a.documentId);
  const bPosition = FOUNDATIONAL_DISPLAY_POSITION.get(b.documentId);
  if (aPosition === undefined || bPosition === undefined) {
    return a.documentId.localeCompare(b.documentId, 'en');
  }
  return aPosition - bPosition;
}

export async function buildRecoveredContentCatalog(rootDir, { currentFoundationalPackages } = {}) {
  const manifest = JSON.parse(await readFile(path.join(rootDir, 'docs-manifest.json'), 'utf8'));
  const needsLegacyFoundational = (manifest.entries ?? []).some((entry) =>
    entry.contentClass === 'foundational_document'
    && entry.canonicalLanguage === 'fa'
    && entry.renditions?.fa?.source
    && !isRegisteredReleaseSource(entry.renditions.fa.source)
  );
  const current = currentFoundationalPackages
    ?? (needsLegacyFoundational ? await buildCurrentFoundational(rootDir) : []);
  const currentById = new Map(current.map((item) => [item.id, item]));
  const documents = [];
  const references = [];

  for (const entry of manifest.entries ?? []) {
    if (entry.canonicalLanguage !== 'fa') continue;
    const rendition = entry.renditions?.fa;
    if (!rendition?.source || !USABLE.has(rendition.status)) continue;

    if (entry.contentClass === 'foundational_document') {
      if (isRegisteredReleaseSource(rendition.source)) {
        const markdown = await readFile(path.join(rootDir, rendition.source), 'utf8');
        documents.push(sharedMetadata(entry, rendition.source, markdown));
        continue;
      }

      const consolidated = currentById.get(entry.documentId);
      if (!consolidated?.markdown) throw new Error(`Missing consolidated source for ${entry.documentId}`);
      if (String(consolidated.version) !== String(entry.version)) {
        throw new Error(`Consolidated version mismatch for ${entry.documentId}: ${consolidated.version} != ${entry.version}`);
      }
      documents.push(sharedMetadata(entry, rendition.source, consolidated.markdown));
      continue;
    }

    if (entry.contentClass === 'reference' && (
      rendition.source.startsWith('references/') || isRegisteredReleaseSource(rendition.source)
    )) {
      const markdown = await readFile(path.join(rootDir, rendition.source), 'utf8');
      references.push({
        ...sharedMetadata(entry, rendition.source, markdown),
        routeId: routeIdForReference(entry),
      });
    }
  }

  documents.sort(foundationalOrder);
  references.sort((a, b) => a.documentId.localeCompare(b.documentId, 'en'));
  const all = [...documents, ...references];
  const locales = [...new Set(all.flatMap((item) => resolveDisplayLocales(item.renditions)))];
  const routeEntries = all.map((item) => ({
    documentId: item.documentId,
    contentClass: item.contentClass,
    routeId: item.routeId ?? item.documentId.toLowerCase(),
    locale: item.canonicalLanguage,
  }));

  return { documents, references, locales, routeEntries };
}
