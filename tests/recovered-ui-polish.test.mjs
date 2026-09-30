import assert from 'node:assert/strict';
import test from 'node:test';

import {
  patchRecoveredAppSource,
  patchRecoveredDocumentReaderControlsSource,
  patchRecoveredHtml,
  patchRecoveredMobileNavigationSource,
  patchRecoveredStyles,
} from '../scripts/patch-recovered-ui-polish.mjs';

const html = `<!doctype html>
<html lang="en" dir="rtl">
<body>
  <div class="top-notice"><span class="notice-dot"></span>مرکز اسناد در حال تکمیل است — وضعیت حقوقی هر سند را پیش از استناد بررسی کنید</div>
  <header class="topbar">
    <a class="brand" href="/">مرکز دانش ارث‌کوپ</a>
    <div class="top-actions">
      <button class="search-trigger" id="searchTrigger">جست‌وجو</button>
      <button class="icon-button" id="themeToggle">پوسته</button>
      <button class="menu-button" id="menuButton">منو</button>
    </div>
  </header>
  <section class="hero">
    <div>متن معرفی</div>
    <div class="hero-visual"><div class="orbit">EarthCoop</div></div>
      </section>
</body></html>`;

const appSource = `render: () => \`
      <section class="hero">
        <div>متن معرفی</div>
        <div class="hero-visual"><div class="orbit">EarthCoop</div></div>
      </section>\``;

const mobileSource = `function setMobileNavigation(open) {
  const sidebar = document.getElementById('sidebar');
  document.body.classList.toggle('navigation-open', Boolean(open));
  return Boolean(open);
}`;

const documentReaderControlsSource = `function initializeDocumentReaderControls(activeProvisionSlug = null) {
  const toc = document.getElementById('documentToc');
  const tocToggle = document.querySelector('[data-document-toc-toggle]');
  const mobile = window.matchMedia('(max-width:1050px)');

  function synchronizeToc() {
    if (!toc || !tocToggle) return;
    toc.hidden = mobile.matches;
    tocToggle.setAttribute('aria-expanded', String(!toc.hidden));
  }

  synchronizeToc();
  mobile.addEventListener?.('change', synchronizeToc);
  const tocLinks = [...document.querySelectorAll('#documentToc a')];
}`;

test('always exposes language control while keeping unavailable translations explicit', () => {
  const result = patchRecoveredHtml(html, { home: true, availableLocales: ['fa'] });
  assert.match(result, /class="language-switcher"/);
  assert.match(result, /فارسی/);
  assert.match(result, /English/);
  assert.match(result, /العربية/);
  assert.match(result, /aria-current="true"/);
  assert.match(result, /ترجمه موجود نیست/);
  assert.doesNotMatch(result, /href="[^\"]*"[^>]*>English/);
});

test('normalizes Persian page semantics and improves the home-page informational affordances', () => {
  const result = patchRecoveredHtml(html, { home: true, availableLocales: ['fa'] });
  assert.match(result, /<html lang="fa" dir="rtl">/);
  assert.match(result, /class="top-notice-link"/);
  assert.match(result, /ساختار مشارکت از کوچه تا سیاره/);
});

test('keeps client-rendered home polish aligned with the initial static home', () => {
  const result = patchRecoveredAppSource(appSource);
  assert.match(result, /orbit-caption/);
  assert.match(result, /ساختار مشارکت از کوچه تا سیاره/);
});

test('mobile navigation synchronizes its top edge to the sticky header and preserves background scroll lock', () => {
  const result = patchRecoveredMobileNavigationSource(mobileSource);
  assert.match(result, /syncMobileNavigationViewport/);
  assert.match(result, /getBoundingClientRect\(\)\.bottom/);
  assert.match(result, /--ec-mobile-nav-top/);
  assert.match(result, /navigation-open/);
});

test('desktop polish and independently scrollable mobile drawer are encoded as additive CSS overrides', () => {
  const result = patchRecoveredStyles('.sidebar{overflow-y:visible}.hero{padding:28px 0 42px}');
  assert.match(result, /Docs Center UAT polish/);
  assert.match(result, /\.language-switcher/);
  assert.match(result, /\.orbit-caption/);
  assert.match(result, /\.hero-actions \.secondary-btn/);
  assert.match(result, /overflow-y:auto!important/);
  assert.match(result, /overscroll-behavior:contain/);
  assert.match(result, /100dvh/);
  assert.match(result, /body\.navigation-open\{overflow:hidden/);
});

test('lead-box headings keep strong contrast on the dark green background', () => {
  const result = patchRecoveredStyles('.article-body strong{color:var(--ink)}.lead-box{background:var(--forest);color:white}');
  assert.match(result, /\.lead-box strong\{color:#dfbd68/);
});

test('desktop document TOC stays sticky while scrolling independently inside the viewport', () => {
  const result = patchRecoveredStyles('.document-toc{position:sticky;top:135px;align-self:start}');
  assert.match(result, /@media\(min-width:1051px\)\{\.document-toc\{/);
  assert.match(result, /max-height:calc\(100dvh - 155px\)/);
  assert.match(result, /overflow-y:auto/);
  assert.match(result, /overscroll-behavior:contain/);
  assert.match(result, /scrollbar-gutter:stable/);
});

test('desktop document TOC is lifted to the document head from its lower natural grid position', () => {
  const result = patchRecoveredDocumentReaderControlsSource(documentReaderControlsSource);
  assert.match(result, /function syncDocumentTocViewport\(\)/);
  assert.match(result, /document\.querySelector\('\.document-head'\)/);
  assert.match(result, /document\.querySelector\('\.document-reader-layout'\)/);
  assert.match(result, /getBoundingClientRect\(\)\.top/);
  assert.match(result, /toc\.style\.marginTop/);
  assert.match(result, /mobile\.matches/);
  assert.match(result, /window\.addEventListener\('resize', syncDocumentTocViewport/);
  assert.match(result, /mobile\.addEventListener\?\.\('change', syncDocumentTocViewport\)/);
});

test('same-document provision links update history and scroll without triggering a full hash rerender', () => {
  const result = patchRecoveredDocumentReaderControlsSource(documentReaderControlsSource);
  assert.match(result, /function navigateToProvision\(link, event\)/);
  assert.match(result, /event\.preventDefault\(\)/);
  assert.match(result, /history\.pushState\(null, '', targetHash\)/);
  assert.match(result, /target\.focus\(\{ preventScroll: true \}\)/);
  assert.match(result, /target\.scrollIntoView\(\{ behavior: 'smooth', block: 'start' \}\)/);
  assert.match(result, /tocLinks\.forEach\(\(link\) => link\.addEventListener\('click'/);
});
