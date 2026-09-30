import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildLegacyFoundationalPackages, serializeLegacyFoundationalPackages } from './generate-legacy-docs-center-data.mjs';
import {
  materializeRecoveredDocsCenter,
  RECOVERED_08_ARCHIVE_SHA256,
  RECOVERED_08_ARCHIVE_URL,
} from './materialize-docs-center-08.mjs';
import { renderRecoveredStaticDocuments } from './render-recovered-static-documents.mjs';

const GUIDE_CONTENT_POLICY = Object.freeze({
  fa: 'recovered_0.8_editorial_snapshot_under_audit',
  en: 'reviewed_repository_guides_not_yet_mapped_to_recovered_runtime',
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

function canonicalPreviewUrl(canonicalOrigin) {
  let url;
  try {
    url = new URL(canonicalOrigin);
  } catch {
    throw new Error('canonicalOrigin must be a valid HTTPS URL');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('canonicalOrigin must be a bare HTTPS origin');
  }
  return url;
}

function escapeApacheRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function previewHtaccess(canonicalOrigin) {
  const url = canonicalPreviewUrl(canonicalOrigin);
  const origin = url.origin;
  const hostPattern = escapeApacheRegex(url.host);
  return `Options -Indexes
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ ${origin}%{REQUEST_URI} [R=301,L]

  RewriteCond %{HTTP_HOST} !^${hostPattern}$ [NC]
  RewriteRule ^ ${origin}%{REQUEST_URI} [R=301,L]

  RewriteCond %{REQUEST_FILENAME} -d
  RewriteCond %{REQUEST_URI} !/$
  RewriteRule ^ %{REQUEST_URI}/ [R=301,L]
</IfModule>

ErrorDocument 404 /404/index.html

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
  <FilesMatch "^(site-config\\.js|deployment-manifest\\.json)$">
    Header set Cache-Control "no-store, max-age=0"
  </FilesMatch>
  <FilesMatch "\\.(css|js|svg|woff2)$">
    Header set Cache-Control "public, max-age=3600, must-revalidate"
  </FilesMatch>
</IfModule>

<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType font/woff2 .woff2
</IfModule>
`;
}

function previewSiteConfig(canonicalOrigin) {
  canonicalPreviewUrl(canonicalOrigin);
  return `window.EC_SITE_CONFIG = Object.freeze({\n  deploymentTarget: "self-hosted",\n  canonicalOrigin: "${canonicalOrigin}",\n  mainSiteUrl: "https://earthcoop.ir",\n  integrations: Object.freeze({\n    api: Object.freeze({enabled: false, baseUrl: "https://earthcoop.ir/api/docs/v1"}),\n    sso: Object.freeze({enabled: false, startUrl: "https://earthcoop.ir/docs/sso/start"}),\n  }),\n});\n`;
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
  canonicalOrigin = 'https://docs-preview.earthcoop.ir',
  currentFoundationalPackages,
}) {
  if (!rootDir || !outDir) throw new TypeError('rootDir and outDir are required');
  if (!/^[0-9a-f]{40}$/i.test(sourceSha ?? '')) throw new Error('sourceSha must be a full 40-character commit SHA');
  if (!builtAt || Number.isNaN(Date.parse(builtAt))) throw new Error('builtAt must be an ISO timestamp');
  canonicalPreviewUrl(canonicalOrigin);

  const recovered = await materializeRecoveredDocsCenter({
    archiveSource: runtimeArchiveSource,
    outDir,
    expectedSha256: runtimeArchiveSha256,
    verifyFiles: verifyRecoveredFiles,
  });

  const packages = await buildLegacyFoundationalPackages(rootDir, {
    currentPackages: currentFoundationalPackages,
  });
  const generatedPath = path.join(outDir, 'src/content/document-packages/foundational.generated.fa.js');
  await mkdir(path.dirname(generatedPath), { recursive: true });
  await writeFile(generatedPath, serializeLegacyFoundationalPackages(packages));
  await writeFile(path.join(outDir, 'site-config.js'), previewSiteConfig(canonicalOrigin));
  await writeFile(path.join(outDir, '.htaccess'), previewHtaccess(canonicalOrigin));

  if (renderStaticDocuments) {
    await renderRecoveredStaticDocuments({
      runtimeDir: outDir,
      packages,
      canonicalOrigin,
    });
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
    canonicalLanguage: 'fa',
    displayLocales: ['fa'],
    guideContentPolicy: GUIDE_CONTENT_POLICY,
    canonicalOrigin,
    fileCount: inventory.length + 1,
    hashes,
  };
  await writeFile(path.join(outDir, 'deployment-manifest.json'), `${JSON.stringify(deploymentManifest, null, 2)}\n`);

  return {
    ...deploymentManifest,
    documentCount: packages.length,
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
  const report = await buildRecoveredDocsCenter({
    rootDir,
    outDir,
    sourceSha,
    builtAt,
    runtimeArchiveSource: args.runtimeArchiveSource ?? process.env.DOCS_CENTER_08_ARCHIVE ?? RECOVERED_08_ARCHIVE_URL,
    canonicalOrigin: args.canonicalOrigin ?? process.env.DOCS_CANONICAL_ORIGIN ?? 'https://docs-preview.earthcoop.ir',
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
