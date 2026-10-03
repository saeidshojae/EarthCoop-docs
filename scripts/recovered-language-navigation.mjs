// Subject-level counterparts in the audited English product-guide collection.
// Other Persian pages link to the collection explicitly, never to a fake translation.
const GUIDE_PAIRS = {
  '/': '/en/',
  '/guides/start/': '/en/introduction/',
  '/guides/groups/': '/en/groups/overview/',
  '/guides/membership/': '/en/account-setup/',
  '/guides/elections/': '/en/groups/polls-and-elections/',
  '/guides/economy-cycle/': '/en/najm-bahar/overview/',
};

function initializeLanguageNavigation(pairs) {
  const switcher = document.querySelector('.language-switcher');
  const menu = document.querySelector('.language-menu');
  if (!switcher || !menu) return;
  const location = window.location;
  const normalize = (value) => '/' + String(value).split('/').filter(Boolean).join('/') + (value === '/' ? '' : '/');
  const allowedPersianPath = (pathname) => pathname === '/' || /^\/(?:guides|documents|roles)\/[a-z0-9-]+\/$/.test(pathname) || ['/documents/', '/roles/', '/map/', '/status/', '/glossary/'].includes(pathname);
  const safeReturn = (value) => {
    if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
    try {
      const url = new URL(value, location.origin);
      if (url.origin !== location.origin || !allowedPersianPath(url.pathname)) return null;
      return url.pathname + url.search + url.hash;
    } catch { return null; }
  };
  const currentPath = normalize(location.pathname);
  const english = /^\/en(?:\/|$)/.test(currentPath);
  if (english) {
    const counterpart = Object.keys(pairs).find(key => pairs[key] === currentPath) || '/';
    const returnTo = safeReturn(new URLSearchParams(location.search).get('returnTo'));
    const destination = returnTo || counterpart;
    const fa = menu.querySelector('[lang="fa"]');
    if (fa) fa.href = destination;
    if (returnTo) {
      document.querySelectorAll('a[href]').forEach(link => {
        const url = new URL(link.getAttribute('href'), location.origin);
        if (url.origin === location.origin && url.pathname.startsWith('/en/')) {
          url.searchParams.set('returnTo', returnTo);
          link.href = url.pathname + url.search + url.hash;
        }
      });
    }
    const summary = switcher.querySelector('summary');
    summary?.setAttribute?.('aria-label', 'Change language');
  } else {
    const en = menu.querySelector('[lang="en"]');
    const destination = pairs[currentPath] || '/en/';
    const returnTo = safeReturn(currentPath + location.search + location.hash) || '/';
    if (en) {
      en.href = destination + '?returnTo=' + encodeURIComponent(returnTo);
      if (!pairs[currentPath]) en.innerHTML = '<bdi dir="ltr">English</bdi><small lang="fa" dir="rtl">راهنماهای انگلیسی؛ ترجمهٔ این صفحه موجود نیست</small>';
    }
  }
  const dismissOutside = (event) => {
    if (!switcher.contains(event.target)) switcher.open = false;
  };
  document.addEventListener('pointerdown', dismissOutside, true);
  document.addEventListener('click', dismissOutside, true);
  document.addEventListener('focusin', dismissOutside);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && switcher.open) {
      switcher.open = false;
      switcher.querySelector('summary')?.focus();
    }
  });
}

export function languageNavigationScript() {
  return `<script id="ec-language-navigation">(${initializeLanguageNavigation.toString()})(${JSON.stringify(GUIDE_PAIRS)});</script>`;
}

export function patchEnglishRouterIsolation(source) {
  let output = String(source);
  if (output.includes('EC_ENGLISH_STATIC_ROUTE')) return output;
  const render = /function render\(\)\s*\{/;
  if (!render.test(output)) throw new Error('Recovered render initialization contract changed');
  const englishPath = "/^\\/en(?:\\/|$)/.test(window.location.pathname)";
  output = output.replace(render, `$&\n    /* EC_ENGLISH_STATIC_ROUTE: preserve the audited static English article. */\n    if (${englishPath}) return;`);
  output = output.replace('const migrated=preview?null:', `const migrated=preview||${englishPath}?null:`);
  output = output.replace("if(!preview&&location.hash.startsWith('#/'))", `if(!${englishPath}&&!preview&&location.hash.startsWith('#/'))`);
  return output;
}
