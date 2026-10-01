import { mkdir, readFile, readdir, rm } from 'node:fs/promises';
import path from 'node:path';

function assertPackage(record) {
  const slug = String(record?.slug ?? '').trim();
  const code = String(record?.code ?? '').trim().toUpperCase();
  const version = String(record?.currentVersion?.version ?? '').trim();
  if (!slug || !code || !version) throw new Error('Foundational download package requires slug, code and currentVersion.version');
  return { slug, code, version };
}

export function buildFoundationalDownloadMap(packages) {
  if (!Array.isArray(packages)) throw new TypeError('packages must be an array');
  const map = {};
  for (const record of packages) {
    const { slug, code, version } = assertPackage(record);
    const filename = `EarthCoop-${code}-${version}-fa.pdf`;
    map[`${slug}@${version}`] = {
      href: `/downloads/documents/${filename}`,
      filename,
    };
  }
  return map;
}

export function serializeDocumentDownloadsSource(map) {
  if (!map || typeof map !== 'object' || Array.isArray(map)) throw new TypeError('download map must be an object');
  return `window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.documentDownloads = Object.freeze(${JSON.stringify(map, null, 2)});\n`;
}

export function ensureStaticReaderInitialization(html) {
  const source = String(html);
  if (/window\.EC_UI\.initializeDocumentReaderControls\s*\(\)/.test(source)) return source;
  const marker = '<script src="/src/ui/document-reader-controls.js"></script>';
  if (!source.includes(marker)) throw new Error('Recovered static reader control script marker changed');
  const initialization = `<script>if(window.EC_UI&&typeof window.EC_UI.initializeDocumentReaderControls==='function'){window.EC_UI.initializeDocumentReaderControls();}</script>`;
  return source.replace(marker, `${marker}${initialization}`);
}

async function removeLegacyFoundationalPdfs(downloadDir) {
  let entries = [];
  try {
    entries = await readdir(downloadDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!/^EarthCoop-[A-Z]+-.+-fa\.pdf$/i.test(entry.name)) continue;
    await rm(path.join(downloadDir, entry.name), { force: true });
  }
}

export async function generateRecoveredFoundationalPdfs({ runtimeDir, packages, runBrowser }) {
  if (!runtimeDir) throw new TypeError('runtimeDir is required');
  if (!Array.isArray(packages)) throw new TypeError('packages must be an array');
  if (typeof runBrowser !== 'function') throw new TypeError('runBrowser must be a function');

  const map = buildFoundationalDownloadMap(packages);
  const downloadDir = path.join(runtimeDir, 'downloads', 'documents');
  await mkdir(downloadDir, { recursive: true });
  await removeLegacyFoundationalPdfs(downloadDir);

  for (const record of packages) {
    const { slug, code, version } = assertPackage(record);
    const filename = `EarthCoop-${code}-${version}-fa.pdf`;
    const inputHtml = path.join(runtimeDir, 'documents', slug, 'index.html');
    const outputPdf = path.join(downloadDir, filename);
    await runBrowser({ inputHtml, outputPdf });
    const bytes = await readFile(outputPdf);
    if (bytes.length < 5 || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
      throw new Error(`Generated foundational PDF is invalid: ${filename}`);
    }
  }

  return { map };
}
