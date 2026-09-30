import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  RECOVERED_08_ARCHIVE_SHA256,
  RECOVERED_08_DEPLOYED_ARCHIVE_NAME,
} from './materialize-docs-center-08.mjs';

const EXPECTED_BASELINE = 'earthcoop-knowledge-center-0.8.0';
const EXPECTED_ORIGIN = 'https://docs-preview.earthcoop.ir';
const REQUIRED_FILES = [
  'index.html',
  'app.js',
  'styles.css',
  'site-config.js',
  'src/content/document-packages/foundational.generated.fa.js',
  RECOVERED_08_DEPLOYED_ARCHIVE_NAME,
];
const EXPECTED_GUIDE_POLICY = Object.freeze({
  fa: 'recovered_0.8_editorial_snapshot_under_audit',
  en: 'reviewed_repository_guides_not_yet_mapped_to_recovered_runtime',
  ar: 'unavailable_legacy_rtl_alias_is_not_arabic',
});

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
    if (actual?.[locale] !== expected) {
      throw new Error(`Guide content policy mismatch for ${locale}`);
    }
  }
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
  if (expectedSourceSha && manifest.sourceSha !== expectedSourceSha) {
    throw new Error(`Recovered deployment source SHA mismatch: ${manifest.sourceSha}`);
  }
  if (manifest.runtimeBaseline !== EXPECTED_BASELINE) {
    throw new Error(`Recovered runtime baseline mismatch: ${manifest.runtimeBaseline}`);
  }
  if (manifest.runtimeArchiveSha256 !== expectedRuntimeArchiveSha) {
    throw new Error(`Recovered runtime archive SHA mismatch: ${manifest.runtimeArchiveSha256}`);
  }
  if (manifest.canonicalLanguage !== 'fa') throw new Error('Recovered canonical language must be fa');
  if (JSON.stringify(manifest.displayLocales) !== JSON.stringify(['fa'])) {
    throw new Error('Recovered display locales must be exactly [fa]');
  }
  assertGuidePolicy(manifest.guideContentPolicy);
  if (manifest.canonicalOrigin !== EXPECTED_ORIGIN) {
    throw new Error(`Recovered preview origin mismatch: ${manifest.canonicalOrigin}`);
  }
  if (!manifest.hashes || typeof manifest.hashes !== 'object' || Array.isArray(manifest.hashes)) {
    throw new Error('Recovered deployment manifest hashes are missing');
  }

  for (const required of REQUIRED_FILES) {
    if (!Object.hasOwn(manifest.hashes, required)) {
      if (required === RECOVERED_08_DEPLOYED_ARCHIVE_NAME) throw new Error('Recovered recovery archive is not declared in hashes');
      throw new Error(`Required recovered build file is not declared in hashes: ${required}`);
    }
  }

  const declaredFiles = Object.keys(manifest.hashes).sort((a, b) => a.localeCompare(b, 'en'));
  if (manifest.fileCount !== declaredFiles.length + 1) {
    throw new Error(`Recovered deployment fileCount mismatch: ${manifest.fileCount}`);
  }

  for (const relative of declaredFiles) {
    if (path.isAbsolute(relative) || relative.split('/').includes('..')) {
      throw new Error(`Unsafe recovered manifest path: ${relative}`);
    }
    const absolute = await assertRegularFile(outDir, relative);
    const actual = sha256(await readFile(absolute));
    if (actual !== manifest.hashes[relative]) {
      throw new Error(`Recovered build hash mismatch for ${relative}`);
    }
  }

  const archiveActual = sha256(await readFile(path.join(outDir, RECOVERED_08_DEPLOYED_ARCHIVE_NAME)));
  if (archiveActual !== expectedRuntimeArchiveSha) {
    throw new Error(`Recovered recovery archive hash mismatch: ${archiveActual}`);
  }

  const config = await readFile(path.join(outDir, 'site-config.js'), 'utf8');
  if (!config.includes('deploymentTarget: "self-hosted"')) {
    throw new Error('Recovered site config is not self-hosted');
  }
  if (!config.includes(EXPECTED_ORIGIN)) {
    throw new Error('Recovered site config preview origin mismatch');
  }

  return {
    valid: true,
    sourceSha: manifest.sourceSha,
    runtimeBaseline: manifest.runtimeBaseline,
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
