import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { auditRecoveredReaderCapabilities } from './audit-recovered-reader-capabilities.mjs';
import {
  RECOVERED_08_ARCHIVE_SHA256,
  RECOVERED_08_DEPLOYED_ARCHIVE_NAME,
} from './materialize-docs-center-08.mjs';
import { validateRecoveredUatContract } from './recovered-uat-policy.mjs';

const EXPECTED_BASELINE = 'earthcoop-knowledge-center-0.8.0';
const EXPECTED_ORIGIN = 'https://docs-preview.earthcoop.ir';
const FOUNDATIONAL_PACKAGE_FILE = 'src/content/document-packages/foundational.generated.fa.js';
const REQUIRED_FILES = [
  '.htaccess',
  'index.html',
  'app.js',
  'styles.css',
  'site-config.js',
  'recovered-locales.json',
  'recovered-search-index.json',
  'recovered-seo-routes.json',
  'recovered-editorial-truth.json',
  'robots.txt',
  'sitemap.xml',
  FOUNDATIONAL_PACKAGE_FILE,
  RECOVERED_08_DEPLOYED_ARCHIVE_NAME,
];
const EXPECTED_GUIDE_POLICY = Object.freeze({
  fa: 'audited_current_2026-10-02_official-v1_and_repository_evidence',
  en: 'audited_current_2026-10-02_product_guides_runtime_mapped',
  ar: 'unavailable_legacy_rtl_alias_is_not_arabic',
});
const EXPECTED_DISPLAY_LOCALES = Object.freeze(['fa', 'en']);
const EXPECTED_DOCUMENT_LOCALES = Object.freeze(['fa']);
const EXPECTED_GUIDE_LOCALES = Object.freeze(['en']);
const EXPECTED_ENGLISH_GUIDE_COUNT = 31;
const EXPECTED_ENGLISH_AUDIT_BASELINE = 'f88c28a518749fb81133c3affa5e5fbf353f844a';
const EXPECTED_FOUNDATIONAL_SLUGS = Object.freeze(['fc', 'ch', 'co', 'econ', 'dg', 'jud', 'loc', 'ex', 'eth', 'std']);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function assertRegularFile(outDir, relative) {
  const absolute = path.join(outDir, relative);
  let info;
  try {
    info = await stat(absolute);
  } catch {
    throw new Error(`Required recovered build file is missing: ${relative}`);
  }
  if (!info.isFile()) throw new Error(`Required recovered build path is not a file: ${relative}`);
  return absolute;
}

function assertGuidePolicy(actual) {
  for (const [locale, expected] of Object.entries(EXPECTED_GUIDE_POLICY)) {
    if (actual?.[locale] !== expected) throw new Error(`Guide content policy mismatch for ${locale}`);
  }
}

function assertPreviewHtaccess(content) {
  if (content.includes('https://docs.earthcoop.ir')) throw new Error('Recovered htaccess contains a production redirect');
  if (!content.includes(EXPECTED_ORIGIN)) throw new Error('Recovered htaccess preview origin mismatch');
  if (!content.includes('docs-preview\\.earthcoop\\.ir')) throw new Error('Recovered htaccess preview host rule is missing');
  if (!content.includes('RewriteCond %{HTTPS} !=on')) throw new Error('Recovered htaccess HTTPS canonicalization is missing');
  if (!content.includes('ErrorDocument 404 /404/index.html')) throw new Error('Recovered htaccess 404 contract is missing');
  if (!content.includes('Header always set X-Robots-Tag "noindex, nofollow"')) throw new Error('Recovered htaccess preview noindex header is missing');
  if (/X-Robots-Tag\s+"noindex, nofollow"\s+env=/.test(content)) throw new Error('Recovered htaccess preview noindex header must be unconditional');
}

function assertPublicSurfaceContract({ persianHome, englishHome, documentsLanding }) {
  if (!/<a class="language-option"[^>]+href="\/en\/"[^>]*>[\s\S]*?English/.test(persianHome)) {
    throw new Error('Recovered Persian UI does not expose a clickable English guide locale');
  }
  if (/English[\s\S]{0,120}ترجمه موجود نیست/.test(persianHome)) {
    throw new Error('Recovered Persian UI still labels English guides unavailable');
  }
  if (!/<html[^>]+lang="en"[^>]+dir="ltr"/i.test(englishHome)) {
    throw new Error('Recovered English guide root is not marked English LTR');
  }
  if (!englishHome.includes('id="ec-bilingual-language-switcher"') || !englishHome.includes("document.documentElement.lang==='en'")) {
    throw new Error('Recovered English guide root is missing active-locale switcher behavior');
  }
  if (!englishHome.includes('العربية') || !/العربية[\s\S]{0,120}ترجمه موجود نیست/.test(englishHome)) {
    throw new Error('Recovered language UI must keep unavailable Arabic explicit');
  }

  if (documentsLanding.includes('/documents/publication-policy/') || documentsLanding.includes('سیاست انتشار مرکز دانش')) {
    throw new Error('Recovered documents landing exposes publication policy as a foundational/reference document card');
  }
  if (documentsLanding.includes('ثبت‌شده؛ هنوز نافذ نیست')) {
    throw new Error('Recovered documents landing contains stale pre-official-v1 legal status copy');
  }
  for (const slug of EXPECTED_FOUNDATIONAL_SLUGS) {
    if (!documentsLanding.includes(`href="/documents/${slug}/"`)) {
      throw new Error(`Recovered documents landing is missing foundational document: ${slug}`);
    }
  }
  if (!documentsLanding.includes('href="/documents/econ-ref-01/"') || !documentsLanding.includes('ECON-REF-01')) {
    throw new Error('Recovered documents landing is missing ECON-REF-01');
  }
  if (!documentsLanding.includes('اسناد مرجع')) throw new Error('Recovered documents landing is missing its reference-document section');
  const cardCount = (documentsLanding.match(/class="doc-card"/g) ?? []).length;
  if (cardCount !== 11) throw new Error(`Recovered documents landing must expose exactly 10 foundational + 1 reference card; found ${cardCount}`);
}

function parseExpectedFoundationalVersions(source) {
  const startMarker = 'window.EC_CONTENT.foundationalDocumentPackages = Object.freeze(';
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error('Recovered foundational package version authority is missing');
  const jsonStart = start + startMarker.length;
  const end = source.indexOf(');', jsonStart);
  if (end < 0) throw new Error('Recovered foundational package version authority is malformed');

  let packages;
  try {
    packages = JSON.parse(source.slice(jsonStart, end));
  } catch {
    throw new Error('Recovered foundational package version authority is not valid JSON');
  }
  if (!Array.isArray(packages) || packages.length === 0) throw new Error('Recovered foundational package set is empty');

  const versions = {};
  for (const record of packages) {
    const id = String(record?.code ?? '').trim().toUpperCase();
    const version = String(record?.currentVersion?.version ?? '').trim();
    if (!id || !version) throw new Error('Recovered foundational package is missing code/current version');
    if (Object.hasOwn(versions, id)) throw new Error(`Duplicate recovered foundational package: ${id}`);
    versions[id] = version;
  }
  return versions;
}

export async function validateRecoveredDocsCenter({
  outDir,
  expectedSourceSha,
  expectedRuntimeArchiveSha = RECOVERED_08_ARCHIVE_SHA256,
} = {}) {
  if (!outDir) throw new TypeError('outDir is required');
  const manifestPath = await assertRegularFile(outDir, 'deployment-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  if (manifest.schemaVersion !== 2) throw new Error('Recovered deployment manifest schemaVersion must be 2');
  if (manifest.repository !== 'saeidshojae/EarthCoop-docs') throw new Error('Recovered deployment manifest repository mismatch');
  if (!/^[0-9a-f]{40}$/i.test(manifest.sourceSha ?? '')) throw new Error('Recovered deployment manifest source SHA is invalid');
  if (expectedSourceSha && manifest.sourceSha !== expectedSourceSha) throw new Error(`Recovered deployment source SHA mismatch: ${manifest.sourceSha}`);
  if (manifest.runtimeBaseline !== EXPECTED_BASELINE) throw new Error(`Recovered runtime baseline mismatch: ${manifest.runtimeBaseline}`);
  if (manifest.runtimeArchiveSha256 !== expectedRuntimeArchiveSha) throw new Error(`Recovered runtime archive SHA mismatch: ${manifest.runtimeArchiveSha256}`);
  if (manifest.canonicalLanguage !== 'fa') throw new Error('Recovered canonical language must be fa');
  if (JSON.stringify(manifest.displayLocales) !== JSON.stringify(EXPECTED_DISPLAY_LOCALES)) throw new Error('Recovered display locales must be exactly [fa,en]');
  if (JSON.stringify(manifest.documentLocales) !== JSON.stringify(EXPECTED_DOCUMENT_LOCALES)) throw new Error('Recovered document locales must be exactly [fa]');
  if (JSON.stringify(manifest.guideLocales) !== JSON.stringify(EXPECTED_GUIDE_LOCALES)) throw new Error('Recovered guide locales must be exactly [en]');
  if (manifest.englishGuideCount !== EXPECTED_ENGLISH_GUIDE_COUNT) throw new Error(`Recovered English guide count mismatch: ${manifest.englishGuideCount}`);
  if (manifest.englishGuideAuditBaseline !== EXPECTED_ENGLISH_AUDIT_BASELINE) throw new Error('Recovered English guide audit baseline mismatch');
  assertGuidePolicy(manifest.guideContentPolicy);
  if (manifest.canonicalOrigin !== EXPECTED_ORIGIN) throw new Error(`Recovered preview origin mismatch: ${manifest.canonicalOrigin}`);
  if (manifest.previewIndexing !== 'disabled') throw new Error('Recovered preview indexing must be disabled');
  if (manifest.editorialTruthArtifact !== 'recovered-editorial-truth.json') throw new Error('Recovered editorial truth artifact declaration is invalid');
  if (!manifest.hashes || typeof manifest.hashes !== 'object' || Array.isArray(manifest.hashes)) throw new Error('Recovered deployment manifest hashes are missing');

  for (const required of REQUIRED_FILES) {
    if (!Object.hasOwn(manifest.hashes, required)) {
      if (required === RECOVERED_08_DEPLOYED_ARCHIVE_NAME) throw new Error('Recovered recovery archive is not declared in hashes');
      throw new Error(`Required recovered build file is not declared in hashes: ${required}`);
    }
  }

  const declaredFiles = Object.keys(manifest.hashes).sort((a, b) => a.localeCompare(b, 'en'));
  if (manifest.fileCount !== declaredFiles.length + 1) throw new Error(`Recovered deployment fileCount mismatch: ${manifest.fileCount}`);

  for (const relative of declaredFiles) {
    if (path.isAbsolute(relative) || relative.split('/').includes('..')) throw new Error(`Unsafe recovered manifest path: ${relative}`);
    const absolute = await assertRegularFile(outDir, relative);
    const actual = sha256(await readFile(absolute));
    if (actual !== manifest.hashes[relative]) throw new Error(`Recovered build hash mismatch for ${relative}`);
  }

  const archiveActual = sha256(await readFile(path.join(outDir, RECOVERED_08_DEPLOYED_ARCHIVE_NAME)));
  if (archiveActual !== expectedRuntimeArchiveSha) throw new Error(`Recovered recovery archive hash mismatch: ${archiveActual}`);

  const config = await readFile(path.join(outDir, 'site-config.js'), 'utf8');
  if (!config.includes('deploymentTarget: "self-hosted"')) throw new Error('Recovered site config is not self-hosted');
  if (!config.includes(EXPECTED_ORIGIN)) throw new Error('Recovered site config preview origin mismatch');

  const htaccess = await readFile(path.join(outDir, '.htaccess'), 'utf8');
  assertPreviewHtaccess(htaccess);

  const localeCatalog = JSON.parse(await readFile(path.join(outDir, 'recovered-locales.json'), 'utf8'));
  const searchRows = JSON.parse(await readFile(path.join(outDir, 'recovered-search-index.json'), 'utf8'));
  const seoRoutes = JSON.parse(await readFile(path.join(outDir, 'recovered-seo-routes.json'), 'utf8'));
  const editorialTruth = JSON.parse(await readFile(path.join(outDir, manifest.editorialTruthArtifact), 'utf8'));
  const robotsTxt = await readFile(path.join(outDir, 'robots.txt'), 'utf8');
  const sitemapXml = await readFile(path.join(outDir, 'sitemap.xml'), 'utf8');
  validateRecoveredUatContract({
    manifest,
    localeCatalog,
    searchRows,
    seoRoutes,
    editorialTruth,
    robotsTxt,
    sitemapXml,
    runtimeFiles: new Set(declaredFiles),
  });

  const persianHome = await readFile(path.join(outDir, 'index.html'), 'utf8');
  const englishHome = await readFile(await assertRegularFile(outDir, 'en/index.html'), 'utf8');
  const documentsLanding = await readFile(await assertRegularFile(outDir, 'documents/index.html'), 'utf8');
  assertPublicSurfaceContract({ persianHome, englishHome, documentsLanding });

  const foundationalSource = await readFile(path.join(outDir, FOUNDATIONAL_PACKAGE_FILE), 'utf8');
  const expectedDocumentVersions = parseExpectedFoundationalVersions(foundationalSource);
  const readerAudit = await auditRecoveredReaderCapabilities({ outDir, expectedDocumentVersions });
  if (readerAudit.issues.length) {
    throw new Error(`Recovered reader capability validation failed: ${readerAudit.issues.join(' | ')}`);
  }

  return { valid: true, sourceSha: manifest.sourceSha, runtimeBaseline: manifest.runtimeBaseline, fileCount: manifest.fileCount };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out') args.outDir = argv[++index];
    else if (argv[index] === '--source-sha') args.expectedSourceSha = argv[++index];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(args.outDir ?? 'dist');
  const expectedSourceSha = args.expectedSourceSha ?? process.env.GITHUB_SHA;
  const result = await validateRecoveredDocsCenter({ outDir, expectedSourceSha });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
