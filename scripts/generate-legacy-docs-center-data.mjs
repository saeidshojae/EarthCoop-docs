import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  parseFoundationalMarkdown,
  toLegacyDocumentPackage,
} from './legacy-docs-center-adapter.mjs';

const USABLE_RENDITION_STATUSES = new Set(['current', 'needs_review', 'outdated']);

export async function buildLegacyFoundationalPackages(rootDir) {
  const manifest = JSON.parse(await readFile(path.join(rootDir, 'docs-manifest.json'), 'utf8'));
  const packages = [];

  for (const entry of manifest.entries ?? []) {
    if (entry.contentClass !== 'foundational_document') continue;
    if (entry.canonicalLanguage !== 'fa') continue;
    const rendition = entry.renditions?.fa;
    if (!rendition?.source || !USABLE_RENDITION_STATUSES.has(rendition.status)) continue;

    const source = await readFile(path.join(rootDir, rendition.source), 'utf8');
    const parsed = parseFoundationalMarkdown(source, { documentId: entry.documentId });
    packages.push(toLegacyDocumentPackage(parsed, {
      ...entry,
      source: rendition.source,
    }));
  }

  return packages.sort((a, b) => a.code.localeCompare(b.code, 'en'));
}

export function serializeLegacyFoundationalPackages(packages) {
  return `window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.foundationalDocumentPackages = Object.freeze(${JSON.stringify(packages, null, 2)});\n`;
}
