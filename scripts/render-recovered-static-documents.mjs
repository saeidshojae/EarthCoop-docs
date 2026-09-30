import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

import { applyRecoveredUiPolish } from './patch-recovered-ui-polish.mjs';

async function loadRecoveredRenderers(runtimeDir) {
  const window = { EC_CONTENT: { documentDownloads: {} }, EC_PAGES: {}, EC_RENDER: {} };
  const context = vm.createContext({ window, URL, console });
  for (const relative of [
    'src/content/statuses.js',
    'src/pages/document-reader.js',
    'src/render/seo-head.js',
    'src/render/structured-data.js',
    'src/render/static-page.js',
  ]) {
    vm.runInContext(await readFile(path.join(runtimeDir, relative), 'utf8'), context, { filename: relative });
  }
  return window;
}

function replaceDocumentHead(html, seoHead, structuredData) {
  const replaced = html.replace(
    /<title>[\s\S]*?<\/script>\s*<\/head>/,
    `${seoHead}\n${structuredData}\n</head>`,
  );
  if (replaced === html) throw new Error('Recovered document template head contract changed');
  return replaced;
}

function replaceDocumentMain(html, body) {
  const replaced = html.replace(
    /<main id="app"[\s\S]*?<\/main>/,
    `<main id="app" tabindex="-1" aria-live="polite" aria-atomic="true"><div class="page">${body}</div></main>`,
  );
  if (replaced === html) throw new Error('Recovered document template main contract changed');
  return replaced;
}

export async function renderRecoveredStaticDocuments({
  runtimeDir,
  packages,
  canonicalOrigin = 'https://docs.earthcoop.ir',
  indexable = true,
}) {
  const recovered = await loadRecoveredRenderers(runtimeDir);
  const template = await readFile(path.join(runtimeDir, 'documents/fc/index.html'), 'utf8');

  for (const documentPackage of packages) {
    const route = {
      title: documentPackage.title,
      description: documentPackage.summary,
      path: `/documents/${documentPackage.slug}/`,
      documentSlug: documentPackage.slug,
      indexable,
      modifiedAt: documentPackage.reviewedAt,
    };
    const reader = recovered.EC_PAGES.renderDocumentReader(documentPackage);
    const body = recovered.EC_RENDER.renderRouteBody(route, { bodyHtml: reader });
    const seoHead = recovered.EC_RENDER.renderSeoHead(route, canonicalOrigin);
    const structuredData = recovered.EC_RENDER.renderStructuredData(route, canonicalOrigin, { document: documentPackage });
    let html = replaceDocumentHead(template, seoHead, structuredData);
    html = replaceDocumentMain(html, body);

    const documentDir = path.join(runtimeDir, 'documents', documentPackage.slug);
    await mkdir(documentDir, { recursive: true });
    await writeFile(path.join(documentDir, 'index.html'), html);
  }

  await applyRecoveredUiPolish({ outDir: runtimeDir, availableLocales: ['fa'] });
}
