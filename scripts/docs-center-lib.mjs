import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const DOCS_CENTER_LOCALES = Object.freeze({
  fa: Object.freeze({ dir: 'rtl' }),
  en: Object.freeze({ dir: 'ltr' }),
  ar: Object.freeze({ dir: 'rtl' }),
});

const LOCALE_KEYS = Object.keys(DOCS_CENTER_LOCALES);

export function makeDocumentRoute(documentId) {
  if (typeof documentId !== 'string' || documentId.trim() === '') {
    throw new TypeError('documentId must be a non-empty string');
  }
  return `/#/documents/${encodeURIComponent(documentId)}`;
}

export function sanitizeSourceMarkup(source) {
  if (typeof source !== 'string') throw new TypeError('source must be a string');
  return source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\]\(\s*javascript\s*:[^()\r\n]*(?:\([^()\r\n]*\)[^()\r\n]*)*\)/gi, '](#)')
    .replace(/javascript\s*:/gi, '#');
}

function slugifyHeading(text) {
  return text
    .trim()
    .toLowerCase()
    .replace(/[\u200c\u200f]/g, '')
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s+/g, '-');
}

export function normalizeSourceText(source, sourcePath) {
  if (typeof sourcePath !== 'string' || sourcePath.trim() === '') {
    throw new TypeError('path must be a non-empty string');
  }
  const text = sanitizeSourceMarkup(source);
  const headings = [];
  for (const line of text.split(/\r?\n/)) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(line);
    if (!match) continue;
    const headingText = match[2].replace(/[*_`]/g, '').trim();
    headings.push({
      depth: match[1].length,
      text: headingText,
      anchor: slugifyHeading(headingText),
    });
  }
  return { path: sourcePath, text, headings };
}

export function resolveRendition(document, locale) {
  if (!LOCALE_KEYS.includes(locale)) throw new RangeError(`Unsupported locale: ${locale}`);
  const rendition = document?.renditions?.[locale];
  if (!rendition) throw new Error(`Document ${document?.id ?? '<unknown>'} is missing rendition metadata for ${locale}`);
  const available = Boolean(rendition.source) && rendition.status !== 'not_translated';
  return {
    locale,
    available,
    source: available ? rendition.source : null,
    status: rendition.status,
    sourceVersion: rendition.sourceVersion ?? null,
    fallbackLocale: available ? null : document.canonicalLanguage,
  };
}

function assertObject(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function validateRegistry(registry) {
  assertObject(registry, 'document-registry');
  if (registry.schemaVersion !== 2) throw new Error('document-registry schemaVersion must be 2');
  if (registry.sourceLanguage !== 'fa') throw new Error('document-registry sourceLanguage must be fa');
  if (JSON.stringify(registry.supportedLanguages) !== JSON.stringify(LOCALE_KEYS)) {
    throw new Error('document-registry supportedLanguages must be exactly fa,en,ar');
  }
  if (!Array.isArray(registry.documents)) throw new Error('document-registry documents must be an array');
}

function validateManifest(manifest) {
  assertObject(manifest, 'docs-manifest');
  if (manifest.schemaVersion !== 2) throw new Error('docs-manifest schemaVersion must be 2');
  if (!Array.isArray(manifest.entries)) throw new Error('docs-manifest entries must be an array');
  for (const [index, entry] of manifest.entries.entries()) {
    assertObject(entry, `entries[${index}]`);
    for (const key of ['documentId', 'canonicalLanguage', 'legalStatus', 'version', 'renditions']) {
      if (!(key in entry) || entry[key] === null || entry[key] === '') {
        throw new Error(`entries[${index}] missing required field ${key}`);
      }
    }
    assertObject(entry.renditions, `entries[${index}].renditions`);
    for (const locale of LOCALE_KEYS) {
      assertObject(entry.renditions[locale], `entries[${index}].renditions.${locale}`);
      if (typeof entry.renditions[locale].status !== 'string') {
        throw new Error(`entries[${index}].renditions.${locale}.status is required`);
      }
    }
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function loadDocsCenterModel(rootDir) {
  const registry = await readJson(path.join(rootDir, 'document-registry.json'));
  const manifest = await readJson(path.join(rootDir, 'docs-manifest.json'));
  validateRegistry(registry);
  validateManifest(manifest);

  const baselineById = new Map(registry.documents.map((item) => [item.id, item]));
  const documents = [];

  for (const entry of manifest.entries) {
    if (!LOCALE_KEYS.includes(entry.canonicalLanguage)) {
      throw new Error(`Unsupported canonicalLanguage for ${entry.documentId}: ${entry.canonicalLanguage}`);
    }
    const renditions = {};
    for (const locale of LOCALE_KEYS) {
      const metadata = entry.renditions[locale];
      let normalized = null;
      if (metadata.source && metadata.status !== 'not_translated') {
        const source = await readFile(path.join(rootDir, metadata.source), 'utf8');
        normalized = normalizeSourceText(source, metadata.source);
      }
      renditions[locale] = { ...metadata, normalized };
    }

    documents.push({
      id: entry.documentId,
      slug: entry.slug ?? null,
      contentClass: entry.contentClass ?? null,
      canonicalLanguage: entry.canonicalLanguage,
      legalStatus: entry.legalStatus,
      productStatus: entry.productStatus ?? null,
      authority: entry.authority ?? null,
      version: entry.version,
      reviewedAt: entry.reviewedAt ?? null,
      publicBaseline: baselineById.get(entry.documentId) ?? null,
      renditions,
      route: makeDocumentRoute(entry.documentId),
    });
  }

  return {
    locales: DOCS_CENTER_LOCALES,
    documents,
    registry: {
      role: registry.registryRole ?? null,
      statusSemantics: registry.statusSemantics ?? null,
    },
    manifest: {
      role: manifest.registryRole ?? null,
      statusSemantics: manifest.statusSemantics ?? null,
    },
  };
}
