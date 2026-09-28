import { createHash } from 'node:crypto';
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { DOCS_CENTER_LOCALES, loadDocsCenterModel } from './docs-center-lib.mjs';

const REPOSITORY = 'saeidshojae/EarthCoop-docs';
const BUILD_SCHEMA_VERSION = 1;
const LOCALES = Object.keys(DOCS_CENTER_LOCALES);

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function listFiles(dir, prefix = '') {
  const result = [];
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await listFiles(absolute, relative));
    else if (entry.isFile()) result.push(relative);
  }
  return result;
}

async function sha256(filePath) {
  const bytes = await readFile(filePath);
  return createHash('sha256').update(bytes).digest('hex');
}

function renditionForBuild(document, locale) {
  const metadata = document.renditions[locale];
  const normalized = metadata.normalized;
  const available = Boolean(metadata.source) && metadata.status !== 'not_translated' && Boolean(normalized);
  const title = available ? (normalized.headings[0]?.text ?? document.id) : document.id;
  return {
    locale,
    available,
    status: metadata.status,
    sourceVersion: metadata.sourceVersion ?? null,
    source: available ? metadata.source : null,
    title,
    text: available ? normalized.text : null,
    headings: available ? normalized.headings : [],
    download: available ? {
      source: metadata.source,
      filename: `${document.id}-${locale}.md`,
    } : null,
  };
}

function contentDocument(document) {
  const renditions = {};
  for (const locale of LOCALES) renditions[locale] = renditionForBuild(document, locale);
  const canonical = renditions[document.canonicalLanguage];
  return {
    id: document.id,
    slug: document.slug,
    contentClass: document.contentClass,
    canonicalLanguage: document.canonicalLanguage,
    title: canonical?.title ?? document.id,
    version: document.version,
    legalStatus: document.legalStatus,
    productStatus: document.productStatus,
    authority: document.authority,
    reviewedAt: document.reviewedAt,
    publicBaseline: document.publicBaseline,
    route: document.route,
    renditions,
  };
}

function makeSearchIndex(documents) {
  const records = [];
  for (const document of documents) {
    for (const locale of LOCALES) {
      const rendition = document.renditions[locale];
      if (!rendition.available) continue;
      records.push({
        id: document.id,
        locale,
        title: rendition.title,
        headings: rendition.headings,
        body: rendition.text,
        legalStatus: document.legalStatus,
        version: document.version,
        route: document.route,
      });
    }
  }
  return records.sort((a, b) => `${a.id}\u0000${a.locale}`.localeCompare(`${b.id}\u0000${b.locale}`, 'en'));
}

export async function buildDocsCenter({ rootDir, outDir, sourceSha, builtAt }) {
  if (!rootDir || !outDir) throw new TypeError('rootDir and outDir are required');
  if (!/^[0-9a-f]{40}$/i.test(sourceSha ?? '')) throw new Error('sourceSha must be a full 40-character commit SHA');
  if (!builtAt || Number.isNaN(Date.parse(builtAt))) throw new Error('builtAt must be an ISO timestamp');

  await rm(outDir, { recursive: true, force: true });
  const model = await loadDocsCenterModel(rootDir);
  const documents = model.documents.map(contentDocument).sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const contentIndex = {
    schemaVersion: 1,
    defaultLocale: 'fa',
    locales: LOCALES,
    registry: model.registry,
    manifest: model.manifest,
    documents,
  };
  const searchIndex = makeSearchIndex(documents);

  await mkdir(outDir, { recursive: true });
  await cp(path.join(rootDir, 'site'), outDir, { recursive: true });
  await writeFile(path.join(outDir, 'content-index.json'), stableJson(contentIndex));
  await writeFile(path.join(outDir, 'search-index.json'), stableJson(searchIndex));

  const filesBeforeManifest = await listFiles(outDir);
  const hashes = {};
  for (const relative of filesBeforeManifest) hashes[relative] = await sha256(path.join(outDir, relative));

  const deploymentManifest = {
    schemaVersion: BUILD_SCHEMA_VERSION,
    repository: REPOSITORY,
    sourceSha,
    builtAt,
    locales: LOCALES,
    fileCount: filesBeforeManifest.length + 1,
    hashes,
  };
  await writeFile(path.join(outDir, 'deployment-manifest.json'), stableJson(deploymentManifest));

  return {
    outDir,
    sourceSha,
    builtAt,
    fileCount: deploymentManifest.fileCount,
    documentCount: documents.length,
    searchRecordCount: searchIndex.length,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out') args.outDir = argv[++index];
    else if (argv[index] === '--root') args.rootDir = argv[++index];
    else if (argv[index] === '--source-sha') args.sourceSha = argv[++index];
    else if (argv[index] === '--built-at') args.builtAt = argv[++index];
  }
  return args;
}

function gitHead(rootDir) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: rootDir, encoding: 'utf8' }).trim();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rootDir = path.resolve(args.rootDir ?? process.cwd());
  const outDir = path.resolve(args.outDir ?? path.join(rootDir, 'dist'));
  const sourceSha = args.sourceSha ?? process.env.GITHUB_SHA ?? gitHead(rootDir);
  const builtAt = args.builtAt ?? process.env.DOCS_BUILD_TIMESTAMP ?? new Date().toISOString();
  const summary = await buildDocsCenter({ rootDir, outDir, sourceSha, builtAt });
  process.stdout.write(`${JSON.stringify(summary)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
