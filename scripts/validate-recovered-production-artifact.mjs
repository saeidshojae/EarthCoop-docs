import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { auditRecoveredReaderCapabilities } from './audit-recovered-reader-capabilities.mjs';
import {
  RECOVERED_08_ARCHIVE_SHA256,
  RECOVERED_08_DEPLOYED_ARCHIVE_NAME,
} from './materialize-docs-center-08.mjs';

const EXPECTED_ORIGIN = 'https://docs.earthcoop.ir';
const PREVIEW_ORIGIN = 'https://docs-preview.earthcoop.ir';
const EXPECTED_BASELINE = 'earthcoop-knowledge-center-0.8.0';
const FOUNDATIONAL_PACKAGE_FILE = 'src/content/document-packages/foundational.generated.fa.js';
const EXPECTED_GUIDE_POLICY = Object.freeze({
  fa: 'audited_current_2026-10-02_official-v1_and_repository_evidence',
  en: 'audited_current_2026-10-02_product_guides_runtime_mapped',
  ar: 'unavailable_legacy_rtl_alias_is_not_arabic',
});
const REQUIRED_FILES = Object.freeze([
  '.htaccess',
  'index.html',
  'app.js',
  'styles.css',
  'site-config.js',
  'en/index.html',
  'documents/index.html',
  'recovered-locales.json',
  'recovered-search-index.json',
  'recovered-seo-routes.json',
  'recovered-editorial-truth.json',
  'robots.txt',
  'sitemap.xml',
  'src/ui/search-dialog.js',
  'src/ui/theme.js',
  FOUNDATIONAL_PACKAGE_FILE,
  RECOVERED_08_DEPLOYED_ARCHIVE_NAME,
]);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function assertRegularFile(outDir, relative) {
  const absolute = path.join(outDir, relative);
  let info;
  try {
    info = await stat(absolute);
  } catch {
    throw new Error(`Required recovered production file is missing: ${relative}`);
  }
  if (!info.isFile()) throw new Error(`Required recovered production path is not a file: ${relative}`);
  return absolute;
}

function exactArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label} mismatch`);
}

function assertGuidePolicy(actual) {
  for (const [locale, expected] of Object.entries(EXPECTED_GUIDE_POLICY)) {
    if (actual?.[locale] !== expected) throw new Error(`Guide content policy mismatch for ${locale}`);
  }
}

function assertNoPreview(value, label) {
  if (String(value ?? '').includes(PREVIEW_ORIGIN) || String(value ?? '').includes('docs-preview.earthcoop.ir')) {
    throw new Error(`${label} contains Preview origin leakage`);
  }
}

function metaContent(html, attribute, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return html.match(new RegExp(`<meta\\s+${attribute}="${escaped}"\\s+content="([^"]*)"`, 'i'))?.[1] ?? null;
}

function decodeHtml(value) {
  return String(value ?? '')
    .replaceAll('&quot;', '"')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&amp;', '&');
}

function assertHtmlSeoIdentity(relative, html) {
  const noindex = /meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
  const allowedNoindex = relative === '404/index.html' || relative.startsWith('en/');
  if (allowedNoindex && !noindex) throw new Error(`Recovered production ${relative} must be noindex`);
  if (!allowedNoindex && noindex) throw new Error(`Recovered production ${relative} must remain indexable`);

  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] ?? null;
  if (canonical && !canonical.startsWith(EXPECTED_ORIGIN)) throw new Error(`Recovered production ${relative} canonical origin mismatch`);
  if (!canonical) return;

  const ogUrl = metaContent(html, 'property', 'og:url');
  if (ogUrl !== canonical) throw new Error(`Recovered production ${relative} OpenGraph URL does not match canonical`);

  const lang = html.match(/<html[^>]*\blang="([^"]+)"/i)?.[1]?.toLowerCase() ?? 'fa';
  const expectedLocale = lang.startsWith('en') ? 'en_US' : 'fa_IR';
  if (metaContent(html, 'property', 'og:locale') !== expectedLocale) {
    throw new Error(`Recovered production ${relative} OpenGraph locale mismatch`);
  }

  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '');
  if (title) {
    if (decodeHtml(metaContent(html, 'property', 'og:title')) !== title) throw new Error(`Recovered production ${relative} OpenGraph title mismatch`);
    if (decodeHtml(metaContent(html, 'name', 'twitter:title')) !== title) throw new Error(`Recovered production ${relative} Twitter title mismatch`);
  }

  const description = decodeHtml(metaContent(html, 'name', 'description'));
  if (description) {
    if (decodeHtml(metaContent(html, 'property', 'og:description')) !== description) throw new Error(`Recovered production ${relative} OpenGraph description mismatch`);
    if (decodeHtml(metaContent(html, 'name', 'twitter:description')) !== description) throw new Error(`Recovered production ${relative} Twitter description mismatch`);
  }
}

function sitemapLocations(sitemapXml) {
  return [...String(sitemapXml).matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]).sort();
}

function assertSitemapMatchesIndexableRoutes(sitemapXml, seoRoutes) {
  const actual = sitemapLocations(sitemapXml);
  const expected = (seoRoutes ?? [])
    .filter((route) => route.indexable === true)
    .map((route) => route.canonical)
    .sort();
  exactArray(actual, expected, 'Recovered production sitemap/indexable route set');
  if (actual.some((url) => url.includes('/en/'))) throw new Error('Recovered production sitemap must not include non-indexable English guides');
}

export function assertRecoveredProductionPolicy({
  manifest,
  htaccess,
  siteConfig,
  robotsTxt,
  sitemapXml,
  htmlSamples = [],
}) {
  if (manifest?.deploymentTarget !== 'production') throw new Error('Recovered artifact must declare production target');
  if (manifest?.indexing !== 'enabled') throw new Error('Recovered production indexing must be enabled');
  if (manifest?.canonicalOrigin !== EXPECTED_ORIGIN) throw new Error('Recovered production canonical origin mismatch');
  if (Object.hasOwn(manifest ?? {}, 'previewIndexing')) throw new Error('Recovered production manifest must not carry preview indexing state');

  assertNoPreview(htaccess, 'Recovered production htaccess');
  assertNoPreview(siteConfig, 'Recovered production site config');
  assertNoPreview(robotsTxt, 'Recovered production robots');
  assertNoPreview(sitemapXml, 'Recovered production sitemap');
  for (const sample of htmlSamples) assertNoPreview(sample.html, `Recovered production HTML ${sample.relative}`);

  if (!String(htaccess).includes(EXPECTED_ORIGIN)) throw new Error('Recovered production htaccess origin mismatch');
  if (/X-Robots-Tag\s+"?noindex/i.test(String(htaccess))) throw new Error('Recovered production htaccess must not emit global noindex');
  if (!String(siteConfig).includes(EXPECTED_ORIGIN)) throw new Error('Recovered production site config origin mismatch');
  if (/^\s*Disallow:\s*\/\s*$/mi.test(String(robotsTxt))) throw new Error('Recovered production robots must not disallow the entire site');
  if (!String(robotsTxt).includes(`Sitemap: ${EXPECTED_ORIGIN}/sitemap.xml`)) throw new Error('Recovered production robots sitemap origin mismatch');
  if (!String(sitemapXml).includes(EXPECTED_ORIGIN)) throw new Error('Recovered production sitemap is missing Production origin');
  for (const sample of htmlSamples) assertHtmlSeoIdentity(sample.relative, sample.html);
}

function parseExpectedFoundationalVersions(source) {
  const marker = 'window.EC_CONTENT.foundationalDocumentPackages = Object.freeze(';
  const start = source.indexOf(marker);
  if (start < 0) throw new Error('Recovered production foundational package authority is missing');
  const jsonStart = start + marker.length;
  const end = source.indexOf(');', jsonStart);
  if (end < 0) throw new Error('Recovered production foundational package authority is malformed');
  let packages;
  try {
    packages = JSON.parse(source.slice(jsonStart, end));
  } catch {
    throw new Error('Recovered production foundational package authority is invalid JSON');
  }
  const versions = {};
  for (const record of packages ?? []) {
    const code = String(record?.code ?? '').trim().toUpperCase();
    const version = String(record?.currentVersion?.version ?? '').trim();
    if (!code || !version) throw new Error('Recovered production foundational package misses code/version');
    versions[code] = version;
  }
  if (!Object.keys(versions).length) throw new Error('Recovered production foundational package set is empty');
  return versions;
}

function assertPublicRuntime({ persianHome, englishHome, documentsLanding, appSource, searchSource, themeSource }) {
  if (!/<a class="language-option"[^>]+href="\/en\/"[^>]*>[\s\S]*?English/.test(persianHome)) {
    throw new Error('Recovered production Persian UI is missing English locale navigation');
  }
  if (!/<html[^>]+lang="en"[^>]+dir="ltr"/i.test(englishHome)) throw new Error('Recovered production English root is not English LTR');
  if (!documentsLanding.includes('href="/documents/econ-ref-01/"')) throw new Error('Recovered production documents landing is missing stable ECON-REF-01 route');
  const cardCount = (documentsLanding.match(/class="doc-card"/g) ?? []).length;
  if (cardCount !== 11) throw new Error(`Recovered production documents landing must contain 11 governed document cards; found ${cardCount}`);
  if (!/search/i.test(searchSource) || !/addEventListener/.test(searchSource)) throw new Error('Recovered production Search runtime module is incomplete');
  if (!/theme/i.test(themeSource) || !/addEventListener/.test(themeSource)) throw new Error('Recovered production Theme runtime module is incomplete');
  if (!appSource.includes('const ROLE_GUIDES_REVISION = "2026-10-02-role-guides-v1";')) {
    throw new Error('Recovered production runtime is missing role-guide revision declaration');
  }
}

export async function validateRecoveredProductionArtifact({
  outDir,
  expectedSourceSha,
  expectedRuntimeArchiveSha = RECOVERED_08_ARCHIVE_SHA256,
} = {}) {
  if (!outDir) throw new TypeError('outDir is required');
  const manifestPath = await assertRegularFile(outDir, 'deployment-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  if (manifest.schemaVersion !== 2) throw new Error('Recovered production manifest schemaVersion must be 2');
  if (manifest.repository !== 'saeidshojae/EarthCoop-docs') throw new Error('Recovered production manifest repository mismatch');
  if (!/^[0-9a-f]{40}$/i.test(manifest.sourceSha ?? '')) throw new Error('Recovered production source SHA is invalid');
  if (expectedSourceSha && manifest.sourceSha !== expectedSourceSha) throw new Error('Recovered production source SHA mismatch');
  if (manifest.runtimeBaseline !== EXPECTED_BASELINE) throw new Error('Recovered production runtime baseline mismatch');
  if (manifest.runtimeArchiveSha256 !== expectedRuntimeArchiveSha) throw new Error('Recovered production runtime archive SHA mismatch');
  if (manifest.canonicalLanguage !== 'fa') throw new Error('Recovered production canonical language must be fa');
  exactArray(manifest.displayLocales, ['fa', 'en'], 'Recovered production display locales');
  exactArray(manifest.documentLocales, ['fa'], 'Recovered production document locales');
  exactArray(manifest.guideLocales, ['en'], 'Recovered production guide locales');
  if (manifest.englishGuideCount !== 31) throw new Error('Recovered production English guide count mismatch');
  if (manifest.englishGuideAuditBaseline !== 'f88c28a518749fb81133c3affa5e5fbf353f844a') throw new Error('Recovered production English guide audit baseline mismatch');
  assertGuidePolicy(manifest.guideContentPolicy);
  if (manifest.editorialTruthArtifact !== 'recovered-editorial-truth.json') throw new Error('Recovered production editorial truth declaration mismatch');
  if (!manifest.hashes || typeof manifest.hashes !== 'object' || Array.isArray(manifest.hashes)) throw new Error('Recovered production manifest hashes are missing');

  for (const required of REQUIRED_FILES) {
    if (!Object.hasOwn(manifest.hashes, required)) throw new Error(`Required recovered production file is not declared in hashes: ${required}`);
  }
  const declaredFiles = Object.keys(manifest.hashes).sort((a, b) => a.localeCompare(b, 'en'));
  if (manifest.fileCount !== declaredFiles.length + 1) throw new Error('Recovered production manifest fileCount mismatch');
  for (const relative of declaredFiles) {
    if (path.isAbsolute(relative) || relative.split('/').includes('..')) throw new Error(`Unsafe recovered production manifest path: ${relative}`);
    const absolute = await assertRegularFile(outDir, relative);
    const actual = sha256(await readFile(absolute));
    if (actual !== manifest.hashes[relative]) throw new Error(`Recovered production hash mismatch for ${relative}`);
  }

  const archiveHash = sha256(await readFile(path.join(outDir, RECOVERED_08_DEPLOYED_ARCHIVE_NAME)));
  if (archiveHash !== expectedRuntimeArchiveSha) throw new Error('Recovered production recovery archive hash mismatch');

  const [htaccess, siteConfig, robotsTxt, sitemapXml, persianHome, englishHome, documentsLanding, appSource, searchSource, themeSource] = await Promise.all([
    readFile(path.join(outDir, '.htaccess'), 'utf8'),
    readFile(path.join(outDir, 'site-config.js'), 'utf8'),
    readFile(path.join(outDir, 'robots.txt'), 'utf8'),
    readFile(path.join(outDir, 'sitemap.xml'), 'utf8'),
    readFile(path.join(outDir, 'index.html'), 'utf8'),
    readFile(path.join(outDir, 'en/index.html'), 'utf8'),
    readFile(path.join(outDir, 'documents/index.html'), 'utf8'),
    readFile(path.join(outDir, 'app.js'), 'utf8'),
    readFile(path.join(outDir, 'src/ui/search-dialog.js'), 'utf8'),
    readFile(path.join(outDir, 'src/ui/theme.js'), 'utf8'),
  ]);
  const htmlSamples = [];
  for (const relative of declaredFiles.filter((file) => file.endsWith('.html'))) {
    htmlSamples.push({ relative, html: await readFile(path.join(outDir, relative), 'utf8') });
  }
  assertRecoveredProductionPolicy({ manifest, htaccess, siteConfig, robotsTxt, sitemapXml, htmlSamples });
  assertPublicRuntime({ persianHome, englishHome, documentsLanding, appSource, searchSource, themeSource });

  const locales = JSON.parse(await readFile(path.join(outDir, 'recovered-locales.json'), 'utf8'));
  exactArray(locales.globalLocales, ['fa', 'en'], 'Recovered production locale catalog');
  const searchRows = JSON.parse(await readFile(path.join(outDir, 'recovered-search-index.json'), 'utf8'));
  if (searchRows.length !== manifest.searchRecordCount) throw new Error('Recovered production search record count mismatch');
  if (searchRows.some((row) => !String(row.body ?? '').trim() && !String(row.heading ?? '').trim())) {
    throw new Error('Recovered production search index contains an empty searchable record');
  }
  const seoRoutes = JSON.parse(await readFile(path.join(outDir, 'recovered-seo-routes.json'), 'utf8'));
  if (seoRoutes.length !== manifest.seoRouteCount) throw new Error('Recovered production SEO route count mismatch');
  assertNoPreview(JSON.stringify(seoRoutes), 'Recovered production SEO routes');
  assertSitemapMatchesIndexableRoutes(sitemapXml, seoRoutes);

  const foundationalSource = await readFile(path.join(outDir, FOUNDATIONAL_PACKAGE_FILE), 'utf8');
  const expectedDocumentVersions = parseExpectedFoundationalVersions(foundationalSource);
  const readerAudit = await auditRecoveredReaderCapabilities({ outDir, expectedDocumentVersions });
  if (readerAudit.issues.length) throw new Error(`Recovered production reader capability validation failed: ${readerAudit.issues.join(' | ')}`);

  return {
    valid: true,
    deploymentTarget: manifest.deploymentTarget,
    sourceSha: manifest.sourceSha,
    canonicalOrigin: manifest.canonicalOrigin,
    fileCount: manifest.fileCount,
  };
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
  const result = await validateRecoveredProductionArtifact({
    outDir: path.resolve(args.outDir ?? 'dist-production'),
    expectedSourceSha: args.expectedSourceSha ?? process.env.GITHUB_SHA,
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
