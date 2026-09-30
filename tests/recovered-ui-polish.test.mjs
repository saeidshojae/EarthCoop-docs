import assert from 'node:assert/strict';
import test from 'node:test';

import {
  patchRecoveredAppSource,
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
  <div class="hero-visual"><div class="orbit">EarthCoop</div></div>
</body></html>`;

const appSource = `render: () => \`<div class="hero-visual"><div class="orbit">EarthCoop</div></div>\``;

const mobileSource = `function setMobileNavigation(open) {
  const sidebar = document.getElementById('sidebar');
  document.body.classList.toggle('navigation-open', Boolean(open));
  return Boolean(open);
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
