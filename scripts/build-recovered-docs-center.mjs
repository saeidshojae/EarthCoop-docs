import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildRecoveredContentCatalog } from './build-recovered-content-catalog.mjs';
import { buildRecoveredEditorialTruth } from './build-recovered-editorial-truth.mjs';
import { buildRecoveredLocaleCatalog } from './recovered-locale-catalog.mjs';
import { buildRecoveredRouteEntries } from './recovered-route-policy.mjs';
import { buildRecoveredSearchIndex } from './build-recovered-search-index.mjs';
import { buildRecoveredSeoAssets } from './build-recovered-seo.mjs';
import {
  applyRecoveredStaticSeoProfile,
  renderRecoveredHostingHtaccess,
} from './recovered-deployment-artifact.mjs';
import { resolveRecoveredDeploymentProfile } from './recovered-deployment-profile.mjs';
import {
  buildLegacyFoundationalPackages,
  buildLegacyReferencePackages,
  serializeLegacyFoundationalPackages,
  serializeRecoveredDocumentsMetadata,
} from './generate-legacy-docs-center-data.mjs';
import {
  buildFoundationalDownloadMap,
  generateRecoveredFoundationalPdfs,
  serializeDocumentDownloadsSource,
} from './recovered-foundational-downloads.mjs';
import {
  materializeRecoveredDocsCenter,
  RECOVERED_08_ARCHIVE_SHA256,
  RECOVERED_08_ARCHIVE_URL,
} from './materialize-docs-center-08.mjs';
import { applyRecoveredEnglishProductGuides } from './recovered-english-product-guides.mjs';
import { patchRecoveredDocumentReaderSource } from './patch-recovered-document-reader.mjs';
import { patchRecoveredEditorialPagesSource } from './patch-recovered-editorial-pages.mjs';
import {
  patchRecoveredDocumentsPageSource,
  patchRecoveredTocFinalLayoutSource,
} from './patch-recovered-live-uat.mjs';
import { renderRecoveredStaticDocuments } from './render-recovered-static-documents.mjs';

const GUIDE_CONTENT_POLICY = Object.freeze({
  fa: 'audited_current_2026-10-02_official-v1_and_repository_evidence',
  en: 'audited_current_2026-10-02_product_guides_runtime_mapped',
  ar: 'unavailable_legacy_rtl_alias_is_not_arabic',
});

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function listFiles(dir, prefix = '') {
  const output = [];
  const entries = await readdir(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await listFiles(absolute, relative));
    else if (entry.isFile()) output.push(relative);
  }
  return output;
}

function recoveredSiteConfig(canonicalOrigin) {
  return `window.EC_SITE_CONFIG = Object.freeze({\n  deploymentTarget: "self-hosted",\n  canonicalOrigin: "${canonicalOrigin}",\n  mainSiteUrl: "https://earthcoop.ir",\n  integrations: Object.freeze({\n    api: Object.freeze({enabled: false, baseUrl: "https://earthcoop.ir/api/docs/v1"}),\n    sso: Object.freeze({enabled: false, startUrl: "https://earthcoop.ir/docs/sso/start"}),\n  }),\n});\n`;
}

function recoveredPackageIndex() {
  return `window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.documentPackages = Object.freeze([\n  window.EC_CONTENT.publicationPolicyFa,\n  ...window.EC_CONTENT.foundationalDocumentPackages,\n  ...window.EC_CONTENT.referenceDocumentPackages,\n]);\n`;
}

export async function buildRecoveredDocsCenter({
  rootDir,
  outDir,
  sourceSha,
  builtAt,
  runtimeArchiveSource = RECOVERED_08_ARCHIVE_URL,
  runtimeArchiveSha256 = RECOVERED_08_ARCHIVE_SHA256,
  verifyRecoveredFiles = true,
  renderStaticDocuments = true,
  deploymentTarget = 'preview',
  canonicalOrigin,
  currentFoundationalPackages,
}) {
  if (!rootDir || !outDir) throw new TypeError('rootDir and outDir are required');
  if (!/^[0-9a-f]{40}$/i.test(sourceSha ?? '')) throw new Error('sourceSha must be a full 40-character commit SHA');
  if (!builtAt || Number.isNaN(Date.parse(builtAt))) throw new Error('builtAt must be an ISO timestamp');
  const deploymentProfile = resolveRecoveredDeploymentProfile({
    target: deploymentTarget,
    canonicalOrigin,
  });
  const resolvedOrigin = deploymentProfile.canonicalOrigin;

  const recovered = await materializeRecoveredDocsCenter({
    archiveSource: runtimeArchiveSource,
    outDir,
    expectedSha256: runtimeArchiveSha256,
    verifyFiles: verifyRecoveredFiles,
  });

  const searchBrandDir = path.join(outDir, 'assets', 'brand');
  await mkdir(searchBrandDir, { recursive: true });
  await copyFile(
    path.join(rootDir, 'images', 'earthcoop-brand-192.png'),
    path.join(searchBrandDir, 'earthcoop-brand-192.png'),
  );

  const readerPath = path.join(outDir, 'src/pages/document-reader.js');
  const readerSource = await readFile(readerPath, 'utf8');
  await writeFile(readerPath, patchRecoveredDocumentReaderSource(readerSource));

  const pagesPath = path.join(outDir, 'src/content/pages.fa.js');
  const pagesSource = await readFile(pagesPath, 'utf8');
  await writeFile(pagesPath, patchRecoveredEditorialPagesSource(pagesSource));

  const productGuideInventory = JSON.parse(await readFile(path.join(rootDir, 'audits/product-guides/2026-09-28-inventory.json'), 'utf8'));
  const englishAudit = JSON.parse(await readFile(path.join(rootDir, 'audits/product-guides/2026-10-02-evidence.json'), 'utf8'));

  const catalog = await buildRecoveredContentCatalog(rootDir, { currentFoundationalPackages });
  const localeCatalog = buildRecoveredLocaleCatalog(catalog);
  const routes = buildRecoveredRouteEntries(catalog);
  const packages = await buildLegacyFoundationalPackages(rootDir, { catalog });
  const referencePackages = await buildLegacyReferencePackages(rootDir, { catalog });
  const allPackages = [...packages, ...referencePackages];
  let searchIndex = buildRecoveredSearchIndex(allPackages, { allowedLocales: localeCatalog.globalLocales });
  const downloadMap = buildFoundationalDownloadMap(packages);
  const generatedPath = path.join(outDir, 'src/content/document-packages/foundational.generated.fa.js');
  await mkdir(path.dirname(generatedPath), { recursive: true });
  await writeFile(generatedPath, serializeLegacyFoundationalPackages(packages, referencePackages));
  await writeFile(path.join(outDir, 'src/content/document-packages/index.fa.js'), recoveredPackageIndex());
  await writeFile(path.join(outDir, 'src/data/document-downloads.js'), serializeDocumentDownloadsSource(downloadMap));
  await writeFile(path.join(outDir, 'downloads/document-downloads.json'), `${JSON.stringify(downloadMap, null, 2)}\n`);
  await writeFile(path.join(outDir, 'src/content/documents.fa.js'), serializeRecoveredDocumentsMetadata(packages, referencePackages));
  await writeFile(path.join(outDir, 'site-config.js'), recoveredSiteConfig(resolvedOrigin));
  await writeFile(path.join(outDir, '.htaccess'), renderRecoveredHostingHtaccess(deploymentProfile));

  if (renderStaticDocuments) {
    // The recovered renderer still performs its legacy Preview-safe final HTML pass.
    // Production therefore renders through that safe baseline and is normalized to
    // the explicit Production profile after all static/English integrations finish.
    const rendererOrigin = deploymentProfile.target === 'production'
      ? 'https://docs-preview.earthcoop.ir'
      : resolvedOrigin;
    await renderRecoveredStaticDocuments({
      runtimeDir: outDir,
      packages: allPackages,
      documentDownloads: downloadMap,
      canonicalOrigin: rendererOrigin,
      indexable: deploymentProfile.indexable,
    });
  }

  // Live-UAT patches run after established UI polish when static rendering is enabled.
  // In non-static test builds the TOC helper can bootstrap the same targeted control patch itself.
  const appPath = path.join(outDir, 'app.js');
  await writeFile(appPath, patchRecoveredDocumentsPageSource(await readFile(appPath, 'utf8')));
  const controlsPath = path.join(outDir, 'src/ui/document-reader-controls.js');
  await writeFile(controlsPath, patchRecoveredTocFinalLayoutSource(await readFile(controlsPath, 'utf8')));

  let englishIntegration = {
    guides: [],
    searchRecords: [],
    seoRoutes: [],
    displayLocales: localeCatalog.globalLocales,
    foundationalLocales: localeCatalog.globalLocales,
  };
  if (renderStaticDocuments) {
    englishIntegration = await applyRecoveredEnglishProductGuides({ rootDir, outDir, canonicalOrigin: resolvedOrigin });
    await applyRecoveredStaticSeoProfile({ outDir, deploymentProfile });
  }

  searchIndex = [...searchIndex, ...englishIntegration.searchRecords];
  const seo = buildRecoveredSeoAssets({
    canonicalOrigin: resolvedOrigin,
    routes: [...routes, ...englishIntegration.seoRoutes],
    preview: deploymentProfile.seoPreview,
  });
  const siteLocaleCatalog = {
    ...localeCatalog,
    documentLocales: localeCatalog.globalLocales,
    guideLocales: englishIntegration.guides.length ? ['en'] : [],
    globalLocales: englishIntegration.displayLocales,
  };
  const editorialTruth = buildRecoveredEditorialTruth(productGuideInventory, {
    englishAudit,
    runtimeMapped: englishIntegration.guides.length === englishAudit.guideCount,
  });

  await writeFile(path.join(outDir, 'recovered-locales.json'), `${JSON.stringify(siteLocaleCatalog, null, 2)}\n`);
  await writeFile(path.join(outDir, 'recovered-search-index.json'), `${JSON.stringify(searchIndex, null, 2)}\n`);
  await writeFile(path.join(outDir, 'recovered-seo-routes.json'), `${JSON.stringify(seo.routes, null, 2)}\n`);
  await writeFile(path.join(outDir, 'recovered-editorial-truth.json'), `${JSON.stringify(editorialTruth, null, 2)}\n`);
  await writeFile(path.join(outDir, 'robots.txt'), seo.robotsTxt);
  await writeFile(path.join(outDir, 'sitemap.xml'), seo.sitemapXml);

  if (renderStaticDocuments) {
    await generateRecoveredFoundationalPdfs({ runtimeDir: outDir, packages });
  }

  const inventory = (await listFiles(outDir)).filter((file) => file !== 'deployment-manifest.json');
  const hashes = {};
  for (const file of inventory) hashes[file] = sha256(await readFile(path.join(outDir, file)));

  const deploymentManifest = {
    schemaVersion: 2,
    repository: 'saeidshojae/EarthCoop-docs',
    sourceSha,
    builtAt,
    runtimeBaseline: 'earthcoop-knowledge-center-0.8.0',
    runtimeArchiveSha256: recovered.archiveSha256,
    deploymentTarget: deploymentProfile.target,
    indexing: deploymentProfile.indexable ? 'enabled' : 'disabled',
    canonicalLanguage: 'fa',
    displayLocales: siteLocaleCatalog.globalLocales,
    documentLocales: siteLocaleCatalog.documentLocales,
    guideLocales: siteLocaleCatalog.guideLocales,
    guideContentPolicy: GUIDE_CONTENT_POLICY,
    editorialTruthArtifact: 'recovered-editorial-truth.json',
    canonicalOrigin: resolvedOrigin,
    previewIndexing: deploymentProfile.target === 'preview' ? 'disabled' : undefined,
    searchRecordCount: searchIndex.length,
    seoRouteCount: seo.routes.length,
    englishGuideCount: englishIntegration.guides.length,
    englishGuideAuditBaseline: englishAudit.applicationBaseline,
    fileCount: inventory.length + 1,
    hashes,
  };
  if (deploymentManifest.previewIndexing === undefined) delete deploymentManifest.previewIndexing;
  await writeFile(path.join(outDir, 'deployment-manifest.json'), `${JSON.stringify(deploymentManifest, null, 2)}\n`);

  return {
    ...deploymentManifest,
    documentCount: packages.length,
    referenceCount: referencePackages.length,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out') args.outDir = argv[++index];
    else if (argv[index] === '--root') args.rootDir = argv[++index];
    else if (argv[index] === '--source-sha') args.sourceSha = argv[++index];
    else if (argv[index] === '--built-at') args.builtAt = argv[++index];
    else if (argv[index] === '--archive') args.runtimeArchiveSource = argv[++index];
    else if (argv[index] === '--target') args.deploymentTarget = argv[++index];
    else if (argv[index] === '--canonical-origin') args.canonicalOrigin = argv[++index];
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
  const deploymentTarget = args.deploymentTarget ?? process.env.DOCS_DEPLOYMENT_TARGET ?? 'preview';
  const report = await buildRecoveredDocsCenter({
    rootDir,
    outDir,
    sourceSha,
    builtAt,
    runtimeArchiveSource: args.runtimeArchiveSource ?? process.env.DOCS_CENTER_08_ARCHIVE ?? RECOVERED_08_ARCHIVE_URL,
    deploymentTarget,
    canonicalOrigin: args.canonicalOrigin ?? process.env.DOCS_CANONICAL_ORIGIN,
  });
  process.stdout.write(`${JSON.stringify(report)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
