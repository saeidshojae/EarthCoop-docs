import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

import { ensureStaticReaderInitialization } from './recovered-foundational-downloads.mjs';
import { applyRecoveredGuideContent } from './patch-recovered-guide-content.mjs';
import { applyRecoveredEconomyGuide } from './patch-recovered-economy-guide.mjs';
import { applyRecoveredEconomyRouteRegistration } from './patch-recovered-economy-route.mjs';
import { applyRecoveredLearningPath } from './patch-recovered-learning-path.mjs';
import { applyRecoveredReferencePagesAudit } from './patch-recovered-reference-pages.mjs';
import { applyRecoveredRoleGuides, ROLE_GUIDES_REVISION } from './patch-recovered-role-guides.mjs';
import {
  patchRecoveredDocumentPrintHtml,
  patchRecoveredDocumentPrintStyles,
} from './patch-recovered-print-branding.mjs';
import { applyRecoveredUiPolish } from './patch-recovered-ui-polish.mjs';
import { languageNavigationScript } from './recovered-language-navigation.mjs';

async function loadRecoveredRenderers(runtimeDir, documentDownloads = {}) {
  const window = { EC_CONTENT: { documentDownloads }, EC_PAGES: {}, EC_RENDER: {} };
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

function governedMainSiteUrl(siteConfigSource) {
  const match = String(siteConfigSource ?? '').match(/mainSiteUrl:\s*"([^"]+)"/);
  if (!match) throw new Error('Recovered site config is missing governed mainSiteUrl');
  const url = new URL(match[1]);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Recovered mainSiteUrl must be trusted HTTPS');
  return url.origin;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function statusPresentation(status) {
  if (status === 'effective') return { label: 'نافذ', className: 'effective' };
  if (status === 'official_draft') return { label: 'سند مرجع رسمی', className: 'review' };
  if (status === 'registered_not_effective') return { label: 'ثبت‌شده؛ غیرنافذ', className: 'draft' };
  return { label: String(status ?? 'وضعیت نامشخص'), className: 'review' };
}

function documentCard(record) {
  const status = statusPresentation(record.status);
  return `<a class="doc-card" href="/documents/${escapeHtml(record.slug)}/"><div class="doc-id">${escapeHtml(record.code)}</div><div><h3>${escapeHtml(record.title)}</h3><p>${escapeHtml(record.summary)}</p><div class="doc-meta"><span class="badge ${status.className}">${status.label}</span><span class="badge review">فارسی</span></div><span class="document-availability available">مطالعه سند ←</span></div></a>`;
}

export function patchRecoveredDocumentsLandingHtml(source, packages) {
  const foundational = (packages ?? []).filter((record) => record.contentClass !== 'reference');
  const references = (packages ?? []).filter((record) => record.contentClass === 'reference');
  const body = `<div class="breadcrumbs"><a href="/">خانه</a><i></i><span>مراجع</span></div><header class="article-head"><span class="eyebrow">مجموعه حقوقی نسخه‌پذیر</span><h1>اسناد بنیادین</h1><p>${foundational.length} سند بنیادین نسل رسمی ۱.۰ از داده‌های ثبت‌شده و جاری مرکز اسناد نمایش داده می‌شوند. وضعیت هر سند از همان منبع حاکم بر خوانشگر آن گرفته می‌شود.</p></header><div class="filters" aria-label="فیلتر اسناد بنیادین"><button class="filter active" data-document-filter="all" aria-pressed="true">همه اسناد</button><button class="filter" data-document-filter="effective" aria-pressed="false">نافذ</button></div><p class="filter-count" id="documentCount" aria-live="polite">${foundational.length} سند بنیادین</p><div class="docs-grid">${foundational.map(documentCard).join('')}</div>${references.length ? `<div class="section-title"><div><span class="eyebrow">مجموعه مرجع</span><h2>اسناد مرجع</h2></div></div><p>اسناد مرجع برای توضیح و معماری سامانه منتشر می‌شوند و به‌خودی‌خود اثر حقوقی مستقل ندارند.</p><div class="docs-grid">${references.map(documentCard).join('')}</div>` : ''}<div class="callout info"><div><strong>قاعده انتشار</strong><p>حضور سند در مرکز اسناد به‌تنهایی به معنای نفاذ نیست؛ وضعیت درج‌شده در همان سند و داده ثبت رسمی ملاک است.</p></div></div>`;
  return replaceDocumentMain(String(source), body);
}

const ENGLISH_NAV_HTML = '<a href="/en/"><span class="nav-icon">⌂</span>English Guides</a><div class="nav-label">Getting started</div><a href="/en/introduction/"><span class="nav-icon">◌</span>Introduction</a><a href="/en/quickstart/"><span class="nav-icon">→</span>Quickstart</a><a href="/en/account-setup/"><span class="nav-icon">♙</span>Account setup</a><div class="nav-label">Membership & groups</div><a href="/en/account/profile/"><span class="nav-icon">□</span>Profile</a><a href="/en/groups/overview/"><span class="nav-icon">◎</span>Groups overview</a><a href="/en/governance/location-and-governance/"><span class="nav-icon">⌘</span>Location & governance</a><a href="/en/groups/polls-and-elections/"><span class="nav-icon">✓</span>Polls & elections</a><div class="nav-label">Economy & intelligence</div><a href="/en/najm-bahar/overview/"><span class="nav-icon">◍</span>Najm Bahar</a><a href="/en/najm-hoda/overview/"><span class="nav-icon">◇</span>Najm Hoda</a><a href="/en/projects/overview/"><span class="nav-icon">⌬</span>Projects</a><div class="nav-label">Developers</div><a href="/en/api/overview/"><span class="nav-icon">{ }</span>API overview</a><a href="/en/governance/translation-policy/"><span class="nav-icon">A</span>Translation policy</a>';

const BILINGUAL_SWITCHER_SCRIPT = `<script id="ec-bilingual-language-switcher">(function(){var menu=document.querySelector('.language-menu');if(!menu)return;var current=document.querySelector('.language-current');var english=/^\\/en(?:\\/|$)/.test(window.location.pathname);if(english){document.documentElement.lang='en';document.documentElement.dir='ltr';if(current)current.textContent='EN';var fa=menu.querySelector('[lang="fa"]');if(fa)fa.outerHTML='<a class="language-option" href="/" lang="fa" dir="rtl"><span>فارسی</span><small>Persian</small></a>';var en=menu.querySelector('[lang="en"]');if(en)en.outerHTML='<span class="language-option is-active" lang="en" dir="ltr" aria-current="true"><span>English</span><small>Active</small></span>';var brand=document.querySelector('.brand');if(brand){brand.href='/en/';brand.setAttribute('aria-label','EarthCoop Knowledge Center');var strong=brand.querySelector('strong');var small=brand.querySelector('small');if(strong)strong.textContent='EarthCoop Knowledge Center';if(small)small.textContent='Product Guides · API · Reference';var img=brand.querySelector('img');if(img)img.alt='EarthCoop official logo';}var notice=document.querySelector('.top-notice-text');if(notice)notice.textContent='EarthCoop documentation is evolving — verify the status of legal documents before citing them.';var noticeLink=document.querySelector('.top-notice-link');if(noticeLink){noticeLink.textContent='View documents';noticeLink.href='/documents/';}var searchTrigger=document.querySelector('#searchTrigger');if(searchTrigger){searchTrigger.setAttribute('aria-label','Search documentation');var label=searchTrigger.querySelector('span');if(label)label.textContent='Search documentation';}var nav=document.querySelector('#mainNav');if(nav){nav.setAttribute('aria-label','English product-guide navigation');nav.innerHTML='${ENGLISH_NAV_HTML}';}var card=document.querySelector('.sidebar-card');if(card)card.outerHTML='<details class="sidebar-card"><summary>English guide collection</summary><strong>31 reviewed product and API guides</strong><p>Browse current member, governance, economy, project and developer guidance.</p><a href="/en/">Browse all guides →</a></details>';var meta=document.querySelector('.sidebar-meta span');if(meta)meta.textContent='Knowledge Center version';var dialog=document.querySelector('#searchModal [role="dialog"]');if(dialog)dialog.setAttribute('aria-label','Search EarthCoop documentation');var input=document.querySelector('#searchInput');if(input)input.placeholder='Search guides, features, API or EarthCoop terms…';var close=document.querySelector('#searchClose');if(close){close.setAttribute('aria-label','Close search');close.childNodes[0].nodeValue='Close ';}var menuButton=document.querySelector('#menuButton');if(menuButton)menuButton.setAttribute('aria-label','Show navigation');var theme=document.querySelector('#themeToggle');if(theme)theme.setAttribute('aria-label','Toggle theme');}else{document.documentElement.lang='fa';document.documentElement.dir='rtl';if(current)current.textContent='FA';}})();</script>`;

export function patchRecoveredBilingualLanguageHtml(source) {
  let output = String(source);
  output = output.replace(
    /<span class="language-option is-unavailable" lang="en" dir="ltr" aria-disabled="true"><bdi dir="ltr">English<\/bdi><small[^>]*>ترجمه موجود نیست<\/small><\/span>/,
    '<a class="language-option" href="/en/" lang="en" dir="ltr"><bdi dir="ltr">English</bdi><small lang="fa" dir="rtl">راهنماهای انگلیسی</small></a>',
  );
  if (/<html[^>]*\btranslate=/i.test(output)) output = output.replace(/<html([^>]*)\btranslate="[^"]*"([^>]*)>/i, '<html$1translate="no"$2>');
  else output = output.replace(/<html([^>]*)>/i, '<html$1 translate="no">');
  if (!/<meta\s+name="google"\s+content="notranslate"/i.test(output)) output = output.replace('</head>', '<meta name="google" content="notranslate">\n</head>');
  if (!output.includes('ec-bilingual-language-switcher')) output = output.replace('</body>', `${BILINGUAL_SWITCHER_SCRIPT}\n</body>`);
  if (!output.includes('ec-language-navigation')) output = output.replace('</body>', `${languageNavigationScript()}\n</body>`);
  return output;
}

export function patchRecoveredPreviewStaticSeoHtml(source, canonicalOrigin = 'https://docs-preview.earthcoop.ir') {
  const origin = new URL(canonicalOrigin).origin;
  if (origin !== 'https://docs-preview.earthcoop.ir') throw new Error('Recovered preview static SEO origin mismatch');
  let output = String(source).replaceAll('https://docs.earthcoop.ir', origin);
  output = output.replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i, '<meta name="robots" content="noindex,nofollow">');
  if (!/<meta\s+name="robots"/i.test(output)) output = output.replace(/<\/head>/i, '<meta name="robots" content="noindex,nofollow">\n</head>');
  return output;
}

export function patchRecoveredRoleGuideRuntimeRevision(source) {
  const input = String(source);
  const declaration = `const ROLE_GUIDES_REVISION = ${JSON.stringify(ROLE_GUIDES_REVISION)};`;
  if (input.includes(declaration)) return input;
  const marker = 'const ROLE_GUIDE_RUNTIME = Object.freeze(';
  if (!input.includes(marker)) throw new Error('Recovered role-guide runtime marker is missing');
  return input.replace(marker, `${declaration}\n${marker}`);
}

async function applyRecoveredBilingualLanguage({ outDir, canonicalOrigin }) {
  const visit = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile() && entry.name.endsWith('.html')) {
        let html = await readFile(absolute, 'utf8');
        html = patchRecoveredBilingualLanguageHtml(html);
        html = patchRecoveredPreviewStaticSeoHtml(html, canonicalOrigin);
        await writeFile(absolute, html);
      }
    }
  };
  await visit(outDir);
}

export async function renderRecoveredStaticDocuments({
  runtimeDir,
  packages,
  documentDownloads = {},
  canonicalOrigin = 'https://docs.earthcoop.ir',
  indexable = true,
}) {
  const recovered = await loadRecoveredRenderers(runtimeDir, documentDownloads);
  const template = await readFile(path.join(runtimeDir, 'documents/fc/index.html'), 'utf8');
  const mainSiteUrl = governedMainSiteUrl(await readFile(path.join(runtimeDir, 'site-config.js'), 'utf8'));

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
    html = patchRecoveredDocumentPrintHtml(html, { mainSiteUrl });
    html = ensureStaticReaderInitialization(html);

    const documentDir = path.join(runtimeDir, 'documents', documentPackage.slug);
    await mkdir(documentDir, { recursive: true });
    await writeFile(path.join(documentDir, 'index.html'), html);
  }

  const stylesPath = path.join(runtimeDir, 'styles.css');
  await writeFile(stylesPath, patchRecoveredDocumentPrintStyles(await readFile(stylesPath, 'utf8')));

  await applyRecoveredGuideContent({ outDir: runtimeDir });
  await applyRecoveredEconomyGuide({ outDir: runtimeDir });
  await applyRecoveredEconomyRouteRegistration({ outDir: runtimeDir });
  await applyRecoveredUiPolish({ outDir: runtimeDir, availableLocales: ['fa'] });
  await applyRecoveredLearningPath({ outDir: runtimeDir });
  await applyRecoveredReferencePagesAudit({ outDir: runtimeDir });
  await applyRecoveredRoleGuides({ outDir: runtimeDir });

  const appPath = path.join(runtimeDir, 'app.js');
  await writeFile(appPath, patchRecoveredRoleGuideRuntimeRevision(await readFile(appPath, 'utf8')));

  const documentsIndex = path.join(runtimeDir, 'documents/index.html');
  await writeFile(documentsIndex, patchRecoveredDocumentsLandingHtml(await readFile(documentsIndex, 'utf8'), packages));
  await applyRecoveredBilingualLanguage({ outDir: runtimeDir, canonicalOrigin });
}
