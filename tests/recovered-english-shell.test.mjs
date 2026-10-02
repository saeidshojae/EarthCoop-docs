import assert from 'node:assert/strict';
import test from 'node:test';

import { patchRecoveredBilingualLanguageHtml } from '../scripts/render-recovered-static-documents.mjs';

test('English locale patch localizes the surrounding guide shell instead of leaving Persian navigation', () => {
  const source = '<!doctype html><html lang="en" dir="ltr"><body><div class="top-notice"><span class="top-notice-text">مرکز اسناد در حال تکمیل است</span><a class="top-notice-link">مشاهده اسناد</a></div><a class="brand"><img><strong>مرکز دانش ارث‌کوپ</strong><small>شناخت · راهنما</small></a><button id="searchTrigger"><span>جست‌وجو در مرکز دانش</span></button><details class="language-switcher"><summary><span class="language-current">فا</span></summary><div class="language-menu"><span class="language-option is-active" lang="fa"><span>فارسی</span></span><span class="language-option is-unavailable" lang="en" dir="ltr" aria-disabled="true"><bdi dir="ltr">English</bdi><small>ترجمه موجود نیست</small></span><span class="language-option is-unavailable" lang="ar"><bdi>العربية</bdi><small>ترجمه موجود نیست</small></span></div></details><nav id="mainNav">فارسی</nav><details class="sidebar-card">فارسی</details><div class="sidebar-meta"><span>نسخه مرکز دانش</span></div><div id="searchModal"><div role="dialog"><input id="searchInput"><button id="searchClose">بستن <kbd>ESC</kbd></button></div></div><button id="menuButton"></button><button id="themeToggle"></button></body></html>';
  const output = patchRecoveredBilingualLanguageHtml(source);
  assert.match(output, /EarthCoop Knowledge Center/);
  assert.match(output, /English product-guide navigation/);
  assert.match(output, /Getting started/);
  assert.match(output, /Najm Bahar/);
  assert.match(output, /API overview/);
  assert.match(output, /Search documentation/);
  assert.match(output, /31 reviewed product and API guides/);
  assert.match(output, /href=\"\/en\/\"/);
  assert.match(output, /href=\"\/\" lang=\"fa\"/);
  assert.match(output, /العربية/);
});
