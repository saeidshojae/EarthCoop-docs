import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { buildLegacyFoundationalPackages, serializeLegacyFoundationalPackages } from './generate-legacy-docs-center-data.mjs';
import { materializeRecoveredDocsCenter } from './materialize-docs-center-08.mjs';

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

export async function buildRecoveredDocsCenter({
  rootDir,
  outDir,
  sourceSha,
  builtAt,
  runtimeArchiveSource,
  runtimeArchiveSha256,
  verifyRecoveredFiles = true,
}) {
  if (!rootDir || !outDir) throw new TypeError('rootDir and outDir are required');
  if (!/^[0-9a-f]{40}$/i.test(sourceSha ?? '')) throw new Error('sourceSha must be a full 40-character commit SHA');
  if (!builtAt || Number.isNaN(Date.parse(builtAt))) throw new Error('builtAt must be an ISO timestamp');

  const recovered = await materializeRecoveredDocsCenter({
    archiveSource: runtimeArchiveSource,
    outDir,
    expectedSha256: runtimeArchiveSha256,
    verifyFiles: verifyRecoveredFiles,
  });

  const packages = await buildLegacyFoundationalPackages(rootDir);
  const generatedPath = path.join(outDir, 'src/content/document-packages/foundational.generated.fa.js');
  await mkdir(path.dirname(generatedPath), { recursive: true });
  await writeFile(generatedPath, serializeLegacyFoundationalPackages(packages));

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
    fileCount: inventory.length + 1,
    hashes,
  };
  await writeFile(path.join(outDir, 'deployment-manifest.json'), `${JSON.stringify(deploymentManifest, null, 2)}\n`);

  return {
    ...deploymentManifest,
    documentCount: packages.length,
  };
}
