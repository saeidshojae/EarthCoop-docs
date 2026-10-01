import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

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

async function removeLegacyFoundationalPdfs(downloadDir, packages) {
  const allowedCodes = new Set(packages.map((record) => assertPackage(record).code));
  let entries = [];
  try {
    entries = await readdir(downloadDir, { withFileTypes: true });
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = /^EarthCoop-([A-Z]+)-.+-fa\.pdf$/i.exec(entry.name);
    if (!match || !allowedCodes.has(match[1].toUpperCase())) continue;
    await rm(path.join(downloadDir, entry.name), { force: true });
  }
}

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ({
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.pdf': 'application/pdf',
  })[ext] ?? 'application/octet-stream';
}

async function resolveRuntimeRequest(runtimeDir, requestPath) {
  const decoded = decodeURIComponent(String(requestPath || '/').split('?')[0]);
  const relative = decoded.replace(/^\/+/, '');
  const normalized = path.normalize(relative || 'index.html');
  if (normalized.startsWith('..') || path.isAbsolute(normalized)) return null;
  let absolute = path.join(runtimeDir, normalized);
  try {
    const info = await stat(absolute);
    if (info.isDirectory()) absolute = path.join(absolute, 'index.html');
  } catch {
    return null;
  }
  const root = path.resolve(runtimeDir) + path.sep;
  const resolved = path.resolve(absolute);
  if (resolved !== path.resolve(runtimeDir) && !resolved.startsWith(root)) return null;
  return resolved;
}

async function startRuntimeServer(runtimeDir) {
  const server = createServer(async (request, response) => {
    try {
      const filePath = await resolveRuntimeRequest(runtimeDir, request.url);
      if (!filePath) {
        response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
      }
      const bytes = await readFile(filePath);
      response.writeHead(200, { 'Content-Type': contentType(filePath), 'Cache-Control': 'no-store' });
      response.end(bytes);
    } catch {
      response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Server error');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  const origin = `http://127.0.0.1:${address.port}`;
  return {
    origin,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

async function resolvePdfBrowserExecutable() {
  const configured = process.env.DOCS_PDF_BROWSER?.trim();
  const candidates = configured
    ? [configured]
    : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];
  for (const executable of candidates) {
    try {
      await execFileAsync(executable, ['--version']);
      return executable;
    } catch {
      // Try the next audited headless-browser candidate.
    }
  }
  throw new Error('No supported Chrome/Chromium executable is available for foundational PDF generation');
}

async function printUrlToPdf({ browserExecutable, inputUrl, outputPdf }) {
  await execFileAsync(browserExecutable, [
    '--headless=new',
    '--no-sandbox',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=2000',
    '--no-pdf-header-footer',
    `--print-to-pdf=${outputPdf}`,
    inputUrl,
  ], { maxBuffer: 4 * 1024 * 1024 });
}

export async function generateRecoveredFoundationalPdfs({ runtimeDir, packages, runBrowser }) {
  if (!runtimeDir) throw new TypeError('runtimeDir is required');
  if (!Array.isArray(packages)) throw new TypeError('packages must be an array');
  if (runBrowser !== undefined && typeof runBrowser !== 'function') throw new TypeError('runBrowser must be a function');

  const map = buildFoundationalDownloadMap(packages);
  const downloadDir = path.join(runtimeDir, 'downloads', 'documents');
  await mkdir(downloadDir, { recursive: true });
  await removeLegacyFoundationalPdfs(downloadDir, packages);

  let server;
  let browserExecutable;
  try {
    if (!runBrowser) {
      server = await startRuntimeServer(runtimeDir);
      browserExecutable = await resolvePdfBrowserExecutable();
    }

    for (const record of packages) {
      const { slug, code, version } = assertPackage(record);
      const filename = `EarthCoop-${code}-${version}-fa.pdf`;
      const inputHtml = path.join(runtimeDir, 'documents', slug, 'index.html');
      const outputPdf = path.join(downloadDir, filename);
      if (runBrowser) {
        await runBrowser({ inputHtml, outputPdf });
      } else {
        const inputUrl = `${server.origin}/documents/${encodeURIComponent(slug)}/`;
        await printUrlToPdf({ browserExecutable, inputUrl, outputPdf });
      }
      const bytes = await readFile(outputPdf);
      if (bytes.length < 5 || bytes.subarray(0, 5).toString('ascii') !== '%PDF-') {
        throw new Error(`Generated foundational PDF is invalid: ${filename}`);
      }
    }
  } finally {
    await server?.close();
  }

  return { map };
}
