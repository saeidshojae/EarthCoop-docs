import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { patchRecoveredBilingualLanguageHtml } from '../scripts/render-recovered-static-documents.mjs';

const expectedPaths = [
  'account-setup.mdx',
  'account/notifications.mdx',
  'account/profile.mdx',
  'account/support-tickets.mdx',
  'api/authentication.mdx',
  'api/geographic.mdx',
  'api/najm-hoda.mdx',
  'api/notifications.mdx',
  'api/overview.mdx',
  'api/tickets.mdx',
  'governance/location-and-governance.mdx',
  'governance/translation-policy.mdx',
  'groups/chat-and-messaging.mdx',
  'groups/creating-a-group.mdx',
  'groups/joining-a-group.mdx',
  'groups/overview.mdx',
  'groups/polls-and-elections.mdx',
  'index.mdx',
  'introduction.mdx',
  'najm-bahar/membership-fees.mdx',
  'najm-bahar/overview.mdx',
  'najm-bahar/sub-accounts.mdx',
  'najm-bahar/transfers.mdx',
  'najm-hoda/chatting-with-najm-hoda.mdx',
  'najm-hoda/knowledge-base.mdx',
  'najm-hoda/overview.mdx',
  'projects/investing.mdx',
  'projects/overview.mdx',
  'projects/submitting-a-project.mdx',
  'projects/tracking-status.mdx',
  'quickstart.mdx',
];

async function loadModule() {
  try {
    return await import('../scripts/recovered-english-product-guides.mjs');
  } catch {
    return null;
  }
}

test('publishes exactly the freshly audited 31 English product-guide sources', async () => {
  const module = await loadModule();
  assert.ok(module, 'English product-guide runtime adapter must exist');
  assert.deepEqual(module.ENGLISH_PRODUCT_GUIDE_PATHS, expectedPaths);
  assert.equal(new Set(module.ENGLISH_PRODUCT_GUIDE_PATHS).size, 31);
  assert.equal(module.ENGLISH_GUIDE_AUDIT.applicationBaseline, 'f88c28a518749fb81133c3affa5e5fbf353f844a');
  assert.equal(module.ENGLISH_GUIDE_AUDIT.foundationalEnglishAvailable, false);
  assert.equal(module.ENGLISH_GUIDE_AUDIT.arabicAvailable, false);
});

test('maps audited source paths into an explicit /en/ namespace without reclassifying generic root content', async () => {
  const module = await import('../scripts/recovered-english-product-guides.mjs');
  assert.equal(module.englishGuideRouteForSource('index.mdx'), 'en');
  assert.equal(module.englishGuideRouteForSource('account/profile.mdx'), 'en/account/profile');
  assert.equal(module.englishGuideStaticPathForSource('api/overview.mdx'), '/en/api/overview/');
  assert.equal(module.isAuditedEnglishGuideSource('api/overview.mdx'), true);
  assert.equal(module.isAuditedEnglishGuideSource('README.md'), false);
  assert.equal(module.isAuditedEnglishGuideSource('fa/introduction.mdx'), false);
});

test('rewrites only links to the audited English product-guide set into /en/ routes', async () => {
  const module = await import('../scripts/recovered-english-product-guides.mjs');
  const input = '[Profile](/account/profile) [API](/api/overview) [Legal](/documents/fc) [External](https://earthcoop.ir)';
  const output = module.rewriteEnglishGuideLinks(input);
  assert.match(output, /\]\(\/en\/account\/profile\/\)/);
  assert.match(output, /\]\(\/en\/api\/overview\/\)/);
  assert.match(output, /\]\(\/documents\/fc\)/);
  assert.match(output, /https:\/\/earthcoop\.ir/);
});

test('builds LTR English guide pages, full-text search records, working fa/en switcher and Preview-safe routes', async () => {
  const module = await import('../scripts/recovered-english-product-guides.mjs');
  const rootDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-en-guides-source-'));
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-en-guides-runtime-'));

  await mkdir(path.join(rootDir, 'account'), { recursive: true });
  await writeFile(path.join(rootDir, 'index.mdx'), `---\ntitle: "English Guides"\ndescription: "Reviewed product guidance"\n---\n# English Guides\n\n[Profile](/account/profile)\n`);
  await writeFile(path.join(rootDir, 'account/profile.mdx'), `---\ntitle: "Profile"\ndescription: "Current profile guide"\n---\n# Profile\n\nCurrent profile body.\n`);

  await mkdir(path.join(outDir, 'guides/start'), { recursive: true });
  const language = `<details class="language-switcher"><summary><span class="language-current">فا</span></summary><div class="language-menu"><span class="language-option is-active" lang="fa" dir="rtl" aria-current="true"><span>فارسی</span><small>فعال</small></span><span class="language-option is-unavailable" lang="en" dir="ltr" aria-disabled="true"><bdi dir="ltr">English</bdi><small lang="fa" dir="rtl">ترجمه موجود نیست</small></span><span class="language-option is-unavailable" lang="ar" dir="rtl" aria-disabled="true"><bdi dir="rtl">العربية</bdi><small lang="fa" dir="rtl">ترجمه موجود نیست</small></span></div></details>`;
  const recoveredTemplate = patchRecoveredBilingualLanguageHtml(`<!doctype html><html lang="fa" dir="rtl"><head><title>FA</title><link rel="canonical" href="https://docs-preview.earthcoop.ir/guides/start/"></head><body>${language}<main id="app"><div class="page"><h1>FA</h1></div></main></body></html>`);
  await writeFile(path.join(outDir, 'guides/start/index.html'), recoveredTemplate);
  await writeFile(path.join(outDir, 'app.js'), 'const pages={start:{title:"شروع"}}; function render(){return pages;}');

  const result = await module.applyRecoveredEnglishProductGuides({
    rootDir,
    outDir,
    sourcePaths: ['index.mdx', 'account/profile.mdx'],
    canonicalOrigin: 'https://docs-preview.earthcoop.ir',
  });

  assert.equal(result.guides.length, 2);
  assert.equal(result.searchRecords.length, 2);
  assert.deepEqual(result.displayLocales, ['fa', 'en']);
  assert.equal(result.foundationalLocales.includes('en'), false);
  assert.equal(result.displayLocales.includes('ar'), false);

  const indexHtml = await readFile(path.join(outDir, 'en/index.html'), 'utf8');
  const profileHtml = await readFile(path.join(outDir, 'en/account/profile/index.html'), 'utf8');
  const persianHtml = await readFile(path.join(outDir, 'guides/start/index.html'), 'utf8');
  const app = await readFile(path.join(outDir, 'app.js'), 'utf8');

  assert.match(indexHtml, /<html[^>]+lang="en"[^>]+dir="ltr"/);
  assert.match(indexHtml, /https:\/\/docs-preview\.earthcoop\.ir\/en\//);
  assert.match(indexHtml, /href="\/en\/account\/profile\/"/);
  assert.match(profileHtml, /data-content-class="guide"/);
  assert.match(profileHtml, /data-locale="en"/);
  assert.match(app, /#\/en\//);
  assert.match(persianHtml, /<a class="language-option"[^>]+href="\/en\/"[^>]*>[\s\S]*English/);
  assert.doesNotMatch(persianHtml, /English[\s\S]{0,120}ترجمه موجود نیست/);
  assert.match(indexHtml, /id="ec-bilingual-language-switcher"/);
  assert.match(indexHtml, /document\.documentElement\.lang==='en'/);
  assert.match(indexHtml, /current\.textContent='EN'/);
  assert.match(indexHtml, /aria-current="true"/);
  assert.match(indexHtml, /href="\/" lang="fa"/);
  assert.match(indexHtml, /العربية[\s\S]{0,120}ترجمه موجود نیست/);

  for (const record of result.searchRecords) {
    assert.equal(record.locale, 'en');
    assert.equal(record.contentClass, 'product_guide');
    assert.ok(record.body.length > 0, 'English search record must include full-text body');
    assert.match(record.route, /^\/en(?:\/|$)/);
    assert.match(record.inventoryId, /^guide\./);
  }
});
