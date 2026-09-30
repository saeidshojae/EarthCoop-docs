import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const NOTICE_TEXT = 'مرکز اسناد در حال تکمیل است — وضعیت حقوقی هر سند را پیش از استناد بررسی کنید';
const ORBIT_CAPTION = 'ساختار مشارکت از کوچه تا سیاره';

function normalizePersianDocumentRoot(source) {
  return String(source).replace(/<html\b([^>]*)>/i, (full, attrs) => {
    let next = attrs;
    if (/\blang="[^"]*"/i.test(next)) next = next.replace(/\blang="[^"]*"/i, 'lang="fa"');
    else next = ` lang="fa"${next}`;
    if (/\bdir="[^"]*"/i.test(next)) next = next.replace(/\bdir="[^"]*"/i, 'dir="rtl"');
    else next += ' dir="rtl"';
    return `<html${next}>`;
  });
}

function languageSwitcherMarkup(availableLocales = ['fa']) {
  const available = new Set(availableLocales);
  const option = (locale, label) => {
    const isActive = locale === 'fa';
    const isAvailable = available.has(locale) && isActive;
    if (isAvailable) {
      return `<span class="language-option is-active" lang="fa" dir="rtl" aria-current="true"><span>${label}</span><small>فعال</small></span>`;
    }
    return `<span class="language-option is-unavailable" lang="${locale}" dir="${locale === 'en' ? 'ltr' : 'rtl'}" aria-disabled="true"><bdi dir="${locale === 'en' ? 'ltr' : 'rtl'}">${label}</bdi><small lang="fa" dir="rtl">ترجمه موجود نیست</small></span>`;
  };
  return `<details class="language-switcher">
        <summary aria-label="زبان مرکز دانش"><span class="language-current">فا</span><span class="sr-only">تغییر زبان</span></summary>
        <div class="language-menu" role="group" aria-label="زبان‌های مرکز دانش">
          ${option('fa', 'فارسی')}
          ${option('en', 'English')}
          ${option('ar', 'العربية')}
        </div>
      </details>`;
}

export function patchRecoveredHtml(source, { home = false, availableLocales = ['fa'] } = {}) {
  let output = normalizePersianDocumentRoot(source);

  if (!output.includes('class="language-switcher"')) {
    const themeNeedle = '<button class="icon-button" id="themeToggle"';
    if (!output.includes(themeNeedle)) throw new Error('Recovered header language insertion point changed');
    output = output.replace(themeNeedle, `${languageSwitcherMarkup(availableLocales)}\n      ${themeNeedle}`);
  }

  if (output.includes(NOTICE_TEXT) && !output.includes('class="top-notice-link"')) {
    output = output.replace(
      NOTICE_TEXT,
      `<span class="top-notice-text">${NOTICE_TEXT}</span><a class="top-notice-link" href="/documents/">مشاهده اسناد</a>`,
    );
  }

  if (home && output.includes('class="hero-visual"') && !output.includes('class="orbit-caption"')) {
    const needle = '</div></div>\n      </section>';
    if (!output.includes(needle)) throw new Error('Recovered home orbit caption insertion point changed');
    output = output.replace(
      needle,
      `</div><p class="orbit-caption">${ORBIT_CAPTION}</p></div>\n      </section>`,
    );
  }
  return output;
}

export function patchRecoveredAppSource(source) {
  const output = String(source);
  if (output.includes('class="orbit-caption"')) return output;
  const needle = '</div></div>\n      </section>';
  if (!output.includes(needle)) throw new Error('Recovered client home orbit caption insertion point changed');
  return output.replace(
    needle,
    `</div><p class="orbit-caption">${ORBIT_CAPTION}</p></div>\n      </section>`,
  );
}

export function patchRecoveredMobileNavigationSource(source) {
  let output = String(source);
  if (!output.includes('function syncMobileNavigationViewport()')) {
    const needle = 'function setMobileNavigation(open) {';
    if (!output.includes(needle)) throw new Error('Recovered mobile navigation patch point changed');
    output = output.replace(needle, `function syncMobileNavigationViewport() {
  const sidebar = document.getElementById('sidebar');
  const topbar = document.querySelector('.topbar');
  if (!sidebar || !topbar) return 0;
  const top = Math.max(0, Math.ceil(topbar.getBoundingClientRect().bottom));
  document.documentElement.style.setProperty('--ec-mobile-nav-top', \`${'${top}'}px\`);
  return top;
}

${needle}`);
  }

  if (!output.includes('if (isOpen) syncMobileNavigationViewport();') && output.includes('const isOpen = Boolean(open);')) {
    output = output.replace('const isOpen = Boolean(open);', 'const isOpen = Boolean(open);\n  if (isOpen) syncMobileNavigationViewport();');
  } else if (!output.includes('const isOpen = Boolean(open);') && !output.includes('syncMobileNavigationViewport();')) {
    output = output.replace('function setMobileNavigation(open) {', 'function setMobileNavigation(open) {\n  syncMobileNavigationViewport();');
  }

  if (output.includes('function initializeMobileNavigation()') && !output.includes("window.addEventListener('resize', syncOpenDrawerViewport")) {
    const close = "  tablet.addEventListener?.('change', () => setMobileNavigation(false));";
    if (!output.includes(close)) throw new Error('Recovered mobile navigation listener patch point changed');
    output = output.replace(close, `${close}
  const syncOpenDrawerViewport = () => {
    if (sidebar.classList.contains('open')) syncMobileNavigationViewport();
  };
  window.addEventListener('resize', syncOpenDrawerViewport, { passive: true });
  window.addEventListener('scroll', syncOpenDrawerViewport, { passive: true });`);
  }

  if (!output.includes('window.EC_UI.syncMobileNavigationViewport')) {
    output += '\nwindow.EC_UI = window.EC_UI || {};\nwindow.EC_UI.syncMobileNavigationViewport = syncMobileNavigationViewport;\n';
  }
  return output;
}

export function patchRecoveredStyles(source) {
  const output = String(source);
  if (output.includes('/* Docs Center UAT polish */')) return output;
  return `${output.trimEnd()}

/* Docs Center UAT polish */
:root{--topbar:68px;--ec-mobile-nav-top:102px}
.top-notice{min-height:36px;height:auto;padding:5px 16px;flex-wrap:wrap;line-height:1.7}
.top-notice-text{display:inline}.top-notice-link{color:#f1d788;font-weight:800;text-decoration:underline;text-underline-offset:3px;white-space:nowrap}
.topbar{padding-inline:24px}.brand{gap:10px}.brand-mark{width:40px;height:40px;border-radius:12px}.brand-mark img{width:29px;height:29px}
.top-actions{gap:7px}.search-trigger{width:280px;height:38px}.icon-button,.menu-button{width:38px;height:38px}.earth-link{height:38px;padding-inline:14px}
.page{padding:38px 48px 80px}.hero{gap:32px;padding:22px 0 34px}.hero-visual{min-height:320px;grid-template-rows:auto auto;align-content:center;row-gap:12px}.orbit-caption{margin:0;color:var(--muted);font-size:11px;text-align:center}
.hero-actions{margin-top:22px}.hero-actions .secondary-btn{border-color:color-mix(in srgb,var(--forest-3) 38%,var(--line));background:color-mix(in srgb,var(--card) 88%,var(--mint));font-weight:800;box-shadow:0 5px 16px rgba(15,61,47,.07)}.hero-actions .secondary-btn:before{content:'▤';margin-left:7px;color:var(--forest-3)}
.lead-box strong{color:#dfbd68}
.section-title{margin:30px 0 14px}.trust-strip{margin:30px 0 5px}.quick-grid{align-items:stretch}.path-card{display:flex;flex-direction:column;padding:20px}.path-card .arrow{margin-top:auto;padding-top:14px}.topic-card{cursor:default}.topic-card:hover{transform:none;box-shadow:none;border-color:var(--line)}
.language-switcher{position:relative}.language-switcher>summary{width:38px;height:38px;border:1px solid var(--line);border-radius:12px;background:var(--card);display:grid;place-items:center;cursor:pointer;list-style:none;font-size:11px;font-weight:800;color:var(--ink)}.language-switcher>summary::-webkit-details-marker{display:none}.language-switcher[open]>summary{border-color:color-mix(in srgb,var(--forest-3) 45%,var(--line));background:var(--mint-2)}
.language-menu{position:absolute;z-index:80;top:calc(100% + 8px);inset-inline-end:0;width:240px;padding:8px;border:1px solid var(--line);border-radius:14px;background:var(--card);box-shadow:var(--shadow);display:grid;gap:4px}.language-option{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 10px;border-radius:9px;font-size:12px}.language-option small{font-size:9px;color:var(--muted)}.language-option.is-active{background:var(--mint);color:var(--forest-2);font-weight:800}.language-option.is-unavailable{color:var(--muted);background:color-mix(in srgb,var(--paper) 72%,transparent)}
@media(max-width:1050px){
  .sidebar{top:var(--ec-mobile-nav-top)!important;bottom:0!important;height:calc(100dvh - var(--ec-mobile-nav-top))!important;max-height:calc(100dvh - var(--ec-mobile-nav-top))!important;overflow-y:auto!important;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding-bottom:calc(28px + env(safe-area-inset-bottom));contain:layout paint}
  .nav-backdrop{top:var(--ec-mobile-nav-top)!important}body.navigation-open{overflow:hidden}.language-menu{width:220px}
}
@media(max-width:760px){
  :root{--topbar:64px}.topbar{padding-inline:10px}.brand{gap:7px}.brand-mark{width:36px;height:36px;border-radius:11px}.brand-mark img{width:27px;height:27px}.brand strong{font-size:12.5px}.top-actions{gap:5px}.icon-button,.menu-button,.search-trigger,.language-switcher>summary{width:36px;height:36px}.page{padding:24px 16px 62px}.hero{padding-top:8px;padding-bottom:26px}.hero-actions{display:grid;grid-template-columns:1fr;gap:9px}.hero-actions .primary-btn,.hero-actions .secondary-btn{width:100%}.section-title{margin:26px 0 12px}.trust-strip{margin-top:26px}.language-menu{width:min(230px,calc(100vw - 20px));inset-inline-end:-42px}
}
`;
}

export async function applyRecoveredUiPolish({ outDir, availableLocales = ['fa'] }) {
  const htmlPaths = [];
  async function walk(dir, prefix = '') {
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const relative = path.posix.join(prefix, entry.name);
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(absolute, relative);
      else if (entry.isFile() && entry.name.endsWith('.html')) htmlPaths.push(relative);
    }
  }
  await walk(outDir);
  for (const relative of htmlPaths) {
    const absolute = path.join(outDir, relative);
    const source = await readFile(absolute, 'utf8');
    await writeFile(absolute, patchRecoveredHtml(source, { home: relative === 'index.html', availableLocales }));
  }

  const appPath = path.join(outDir, 'app.js');
  await writeFile(appPath, patchRecoveredAppSource(await readFile(appPath, 'utf8')));
  const stylesPath = path.join(outDir, 'styles.css');
  await writeFile(stylesPath, patchRecoveredStyles(await readFile(stylesPath, 'utf8')));
  const mobilePath = path.join(outDir, 'src/ui/mobile-navigation.js');
  await writeFile(mobilePath, patchRecoveredMobileNavigationSource(await readFile(mobilePath, 'utf8')));
}
