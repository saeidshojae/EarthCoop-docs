import { buildRecoveredContentCatalog } from './build-recovered-content-catalog.mjs';
import {
  parseFoundationalMarkdown,
  toLegacyDocumentPackage,
} from './legacy-docs-center-adapter.mjs';

function stripFrontmatter(markdown) {
  return String(markdown ?? '').replace(/^---\n[\s\S]*?\n---\s*/m, '').trim();
}

function referenceTitle(markdown, fallback) {
  const body = stripFrontmatter(markdown);
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!heading) return fallback;
  return heading.replace(/^[A-Z0-9-]+\s+—\s+/, '').trim();
}

function normalizeDigits(value) {
  const digits = '۰۱۲۳۴۵۶۷۸۹';
  return String(value).replace(/[۰-۹]/g, (digit) => String(digits.indexOf(digit)));
}

function sectionSlug(title, index) {
  const numbered = normalizeDigits(title).match(/^(\d+(?:\.\d+)*)\s*(?:—|-)/)?.[1];
  return numbered ? `section-${numbered.replaceAll('.', '-')}` : `section-${String(index + 1).padStart(3, '0')}`;
}

export function parseRecoveredReferenceStructure(markdown) {
  const lines = stripFrontmatter(markdown).split(/\r?\n/);
  const firstH1 = lines.findIndex((line) => /^#\s+/.test(line));
  const headings = [];
  for (let index = Math.max(firstH1 + 1, 0); index < lines.length; index += 1) {
    const match = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[index]);
    if (!match) continue;
    headings.push({ index, level: match[1].length, title: match[2].trim() });
  }

  const roots = [];
  const stack = [];
  headings.forEach((heading, position) => {
    const nextHeadingIndex = headings[position + 1]?.index ?? lines.length;
    const body = lines.slice(heading.index + 1, nextHeadingIndex).join('\n').trim();
    const node = {
      id: `reference-section-${position + 1}`,
      stableSlug: sectionSlug(heading.title, position),
      kind: 'section',
      title: heading.title,
      body,
      order: 0,
      children: [],
      _level: heading.level,
    };

    while (stack.length && stack.at(-1)._level >= heading.level) stack.pop();
    const siblings = stack.length ? stack.at(-1).children : roots;
    node.order = siblings.length + 1;
    siblings.push(node);
    stack.push(node);
  });

  const removeInternal = (nodes) => nodes.map(({ _level, children, ...node }) => ({
    ...node,
    children: removeInternal(children),
  }));

  return { provisions: removeInternal(roots) };
}

function referencePreamble(markdown) {
  const body = stripFrontmatter(markdown);
  const lines = body.split(/\r?\n/);
  const firstH1 = lines.findIndex((line) => /^#\s+/.test(line));
  const nextHeading = lines.findIndex((line, index) => index > firstH1 && /^#{1,6}\s+/.test(line));
  const end = nextHeading === -1 ? lines.length : nextHeading;
  return lines.slice(firstH1 + 1, end).join('\n').trim();
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
    preamble: referencePreamble(entry.markdown),
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
    provisions: parseRecoveredReferenceStructure(entry.markdown).provisions,
    contentClass: 'reference',
  })).sort((a, b) => a.code.localeCompare(b.code, 'en'));
}

export function serializeLegacyFoundationalPackages(packages, referencePackages = []) {
  return `window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.foundationalDocumentPackages = Object.freeze(${JSON.stringify(packages, null, 2)});\nwindow.EC_CONTENT.referenceDocumentPackages = Object.freeze(${JSON.stringify(referencePackages, null, 2)});\n`;
}
