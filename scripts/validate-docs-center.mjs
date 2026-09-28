import { createHash } from 'node:crypto';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUIRED_LOCALES = ['fa', 'en', 'ar'];

async function readJson(filePath, label) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`${label} is missing or invalid JSON: ${error.message}`);
  }
}

async function listFiles(dir, prefix = '') {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await listFiles(absolute, relative));
    else if (entry.isFile()) out.push(relative);
  }
  return out.sort();
}

function sameLocales(value) {
  return Array.isArray(value) && JSON.stringify(value) === JSON.stringify(REQUIRED_LOCALES);
}

function assertSafeText(value, context) {
  const text = String(value ?? '');
  if (/<script\b/i.test(text) || /\son[a-z]+\s*=/i.test(text) || /javascript\s*:/i.test(text)) {
    throw new Error(`Unsafe source payload found in ${context}`);
  }
}

async function sha256(filePath) {
  return createHash('sha256').update(await readFile(filePath)).digest('hex');
}

export async function validateDocsCenter(outDir, { expectedSourceSha } = {}) {
  const indexPath = path.join(outDir, 'index.html');
  try {
    await access(indexPath);
  } catch {
    throw new Error('index.html is missing from the Docs Center artifact');
  }
  const indexHtml = await readFile(indexPath, 'utf8');
  if (!/type=["']module["'][^>]+src=["']\.\/app\.js["']/i.test(indexHtml)) {
    throw new Error('index.html does not boot the static app.js module');
  }

  const content = await readJson(path.join(outDir, 'content-index.json'), 'content-index.json');
  const search = await readJson(path.join(outDir, 'search-index.json'), 'search-index.json');
  const manifest = await readJson(path.join(outDir, 'deployment-manifest.json'), 'deployment-manifest.json');

  if (!sameLocales(content.locales) || !sameLocales(manifest.locales)) {
    throw new Error('Docs Center locales must be exactly fa,en,ar');
  }
  if (expectedSourceSha && manifest.sourceSha !== expectedSourceSha) {
    throw new Error(`Deployment source SHA mismatch: expected ${expectedSourceSha}, got ${manifest.sourceSha}`);
  }
  if (!/^[0-9a-f]{40}$/i.test(manifest.sourceSha ?? '')) {
    throw new Error('Deployment source SHA must be a full commit SHA');
  }

  if (!Array.isArray(content.documents)) throw new Error('content-index documents must be an array');
  const knownRoutes = new Set();
  for (const document of content.documents) {
    const expectedRoute = `/#/documents/${encodeURIComponent(document.id)}`;
    if (document.route !== expectedRoute) {
      throw new Error(`Document ${document.id} has a broken hash route`);
    }
    knownRoutes.add(document.route);
    for (const locale of REQUIRED_LOCALES) {
      const rendition = document.renditions?.[locale];
      if (!rendition) throw new Error(`Document ${document.id} is missing ${locale} rendition metadata`);
      if (rendition.available) {
        if (!rendition.source || !rendition.download?.source || !rendition.download?.filename) {
          throw new Error(`Document ${document.id}/${locale} is missing downloadable rendition metadata`);
        }
        assertSafeText(rendition.text, `${document.id}/${locale}`);
      }
    }
  }

  if (!Array.isArray(search)) throw new Error('search-index must be an array');
  for (const record of search) {
    if (!REQUIRED_LOCALES.includes(record.locale)) throw new Error(`Search record has unsupported locale ${record.locale}`);
    if (!knownRoutes.has(record.route)) throw new Error(`Search record ${record.id}/${record.locale} has an unknown route`);
    if (typeof record.body !== 'string' || record.body.trim() === '') {
      throw new Error(`Search body is missing for ${record.id}/${record.locale}`);
    }
    assertSafeText(record.body, `search ${record.id}/${record.locale}`);
  }

  const inventory = await listFiles(outDir);
  if (manifest.fileCount !== inventory.length) {
    throw new Error(`Deployment file count mismatch: expected ${manifest.fileCount}, found ${inventory.length}`);
  }
  const expectedHashedFiles = inventory.filter((file) => file !== 'deployment-manifest.json');
  for (const file of expectedHashedFiles) {
    if (!manifest.hashes?.[file]) throw new Error(`Deployment manifest is missing hash for ${file}`);
  }
  for (const [file, expectedHash] of Object.entries(manifest.hashes ?? {})) {
    const absolute = path.join(outDir, file);
    try {
      await access(absolute);
    } catch {
      throw new Error(`Deployment manifest references missing file ${file}`);
    }
    const actualHash = await sha256(absolute);
    if (actualHash !== expectedHash) throw new Error(`Hash mismatch for ${file}`);
  }

  return {
    valid: true,
    sourceSha: manifest.sourceSha,
    fileCount: inventory.length,
    documentCount: content.documents.length,
    searchRecordCount: search.length,
  };
}

async function main() {
  const outArgIndex = process.argv.indexOf('--out');
  const outDir = path.resolve(outArgIndex >= 0 ? process.argv[outArgIndex + 1] : 'dist');
  const expectedSourceSha = process.env.GITHUB_SHA || undefined;
  const report = await validateDocsCenter(outDir, { expectedSourceSha });
  process.stdout.write(`${JSON.stringify(report)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
