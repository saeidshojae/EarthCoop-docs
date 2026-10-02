import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  applyRecoveredEconomyRouteRegistration,
  patchRecoveredEconomyPageRecords,
  patchRecoveredEconomySeoRoutesSource,
  patchRecoveredEconomyStaticPageSource,
} from '../scripts/patch-recovered-economy-route.mjs';

const PAGES = `window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.pageRecords = Object.freeze([\n  { inventoryId:'page.membership', route:'membership', title:"عضویت و شهروندی" },\n  { inventoryId:'page.elections', route:'elections', title:"انتخابات پیوسته" },\n]);\n`;
const SEO = `const editorialPaths = Object.freeze({\n    home:'/', membership:'/guides/membership/', elections:'/guides/elections/', map:'/map/',\n  });\n`;
const STATIC_PAGE = `const fallbackPaths = {\n    home:'/', membership:'/guides/membership/', elections:'/guides/elections/', map:'/map/',\n  };\n`;

test('economy route patch registers one page record and canonical path', () => {
  const pages = patchRecoveredEconomyPageRecords(PAGES);
  const seo = patchRecoveredEconomySeoRoutesSource(SEO);
  const staticPage = patchRecoveredEconomyStaticPageSource(STATIC_PAGE);

  assert.equal((pages.match(/inventoryId:'page\.economy-cycle'/g) ?? []).length, 1);
  assert.match(pages, /route:'economy-cycle'/);
  assert.match(seo, /'economy-cycle':'\/guides\/economy-cycle\/'/);
  assert.match(staticPage, /'economy-cycle':'\/guides\/economy-cycle\/'/);
});

test('economy route patch is idempotent', () => {
  const oncePages = patchRecoveredEconomyPageRecords(PAGES);
  const onceSeo = patchRecoveredEconomySeoRoutesSource(SEO);
  const onceStatic = patchRecoveredEconomyStaticPageSource(STATIC_PAGE);
  assert.equal(patchRecoveredEconomyPageRecords(oncePages), oncePages);
  assert.equal(patchRecoveredEconomySeoRoutesSource(onceSeo), onceSeo);
  assert.equal(patchRecoveredEconomyStaticPageSource(onceStatic), onceStatic);
});

test('recovered build registers economy-cycle before client rerender', async () => {
  const root = process.cwd();
  const renderSource = await readFile(path.join(root, 'scripts/render-recovered-static-documents.mjs'), 'utf8');
  assert.match(renderSource, /applyRecoveredEconomyRouteRegistration/);

  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-economy-route-'));
  await mkdir(path.join(outDir, 'src/content'), { recursive: true });
  await mkdir(path.join(outDir, 'src/render'), { recursive: true });
  await writeFile(path.join(outDir, 'src/content/pages.fa.js'), PAGES);
  await writeFile(path.join(outDir, 'src/content/seo-routes.js'), SEO);
  await writeFile(path.join(outDir, 'src/render/static-page.js'), STATIC_PAGE);

  await applyRecoveredEconomyRouteRegistration({ outDir });

  const pages = await readFile(path.join(outDir, 'src/content/pages.fa.js'), 'utf8');
  const seo = await readFile(path.join(outDir, 'src/content/seo-routes.js'), 'utf8');
  const staticPage = await readFile(path.join(outDir, 'src/render/static-page.js'), 'utf8');
  assert.match(pages, /route:'economy-cycle'/);
  assert.match(seo, /'economy-cycle':'\/guides\/economy-cycle\/'/);
  assert.match(staticPage, /'economy-cycle':'\/guides\/economy-cycle\/'/);
});
