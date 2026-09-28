import { searchDocuments } from './search.js';

const LOCALES = Object.freeze({
  fa: { dir: 'rtl', label: 'فارسی' },
  en: { dir: 'ltr', label: 'English' },
  ar: { dir: 'rtl', label: 'العربية' },
});

export function parseRoute(hash) {
  const value = String(hash || '#/');
  if (value === '#' || value === '#/' || value === '') return { name: 'home' };
  const match = /^#\/documents\/([^/?#]+)$/.exec(value);
  if (match) return { name: 'document', id: decodeURIComponent(match[1]) };
  return { name: 'not-found' };
}

export function applyLocale(rootElement, locale) {
  const config = LOCALES[locale];
  if (!config) throw new RangeError(`Unsupported locale: ${locale}`);
  rootElement.setAttribute('lang', locale);
  rootElement.setAttribute('dir', config.dir);
}

export function renditionMessage(resolution) {
  if (resolution?.available) return '';
  const label = LOCALES[resolution?.locale]?.label ?? resolution?.locale ?? '';
  return `ترجمه ${label} برای این سند هنوز در دسترس نیست.`;
}

export function makeDownloadPayload(documentRecord, locale, rendition) {
  if (!documentRecord?.id || !rendition?.source) {
    throw new Error('A displayed rendition is required for download');
  }
  return {
    filename: `${documentRecord.id}-${locale}.md`,
    text: String(rendition.text ?? ''),
    source: rendition.source,
  };
}

function clearElement(element) {
  while (element.firstChild) element.removeChild(element.firstChild);
}

function appendTextBlock(parent, text) {
  const pre = document.createElement('pre');
  pre.className = 'source-text';
  pre.textContent = text;
  parent.appendChild(pre);
}

function makeToc(headings, onNavigate) {
  const fragment = document.createDocumentFragment();
  for (const heading of headings ?? []) {
    const link = document.createElement('a');
    link.href = `#heading-${encodeURIComponent(heading.anchor)}`;
    link.textContent = heading.text;
    link.className = `toc-depth-${heading.depth}`;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      onNavigate(heading.anchor);
    });
    fragment.appendChild(link);
  }
  return fragment;
}

function downloadText(payload) {
  const blob = new Blob([payload.text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = payload.filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function bootstrap() {
  const [contentResponse, searchResponse] = await Promise.all([
    fetch('./content-index.json', { cache: 'no-cache' }),
    fetch('./search-index.json', { cache: 'no-cache' }),
  ]);
  if (!contentResponse.ok || !searchResponse.ok) {
    throw new Error('Docs Center indexes are unavailable');
  }
  const content = await contentResponse.json();
  const searchIndex = await searchResponse.json();
  const documents = content.documents ?? [];
  const state = {
    locale: content.defaultLocale ?? 'fa',
    currentDocument: null,
    currentRendition: null,
  };

  const html = document.documentElement;
  const localeSwitcher = document.querySelector('#locale-switcher');
  const homeView = document.querySelector('#home-view');
  const documentView = document.querySelector('#document-view');
  const notFoundView = document.querySelector('#not-found-view');
  const navigation = document.querySelector('#document-navigation');
  const body = document.querySelector('#document-body');
  const toc = document.querySelector('#table-of-contents');
  const notice = document.querySelector('#rendition-notice');
  const searchInput = document.querySelector('#search-input');
  const searchResults = document.querySelector('#search-results');

  function setLocale(locale) {
    if (!LOCALES[locale]) return;
    state.locale = locale;
    localeSwitcher.value = locale;
    applyLocale(html, locale);
    renderNavigation();
    renderRoute();
  }

  function hideViews() {
    homeView.hidden = true;
    documentView.hidden = true;
    notFoundView.hidden = true;
  }

  function renderNavigation() {
    clearElement(navigation);
    for (const item of documents) {
      const link = document.createElement('a');
      link.href = item.route;
      const rendition = item.renditions?.[state.locale];
      const title = rendition?.title || item.title || item.id;
      link.textContent = rendition?.available === false
        ? `${title} — ${renditionMessage({ available: false, locale: state.locale })}`
        : title;
      navigation.appendChild(link);
    }
  }

  function resolveDisplayedRendition(item) {
    const requested = item.renditions?.[state.locale];
    if (requested?.available) return { rendition: requested, notice: '' };
    const canonical = item.renditions?.[item.canonicalLanguage];
    return {
      rendition: canonical ?? null,
      notice: renditionMessage({ available: false, locale: state.locale }),
    };
  }

  function renderDocument(item) {
    const resolved = resolveDisplayedRendition(item);
    state.currentDocument = item;
    state.currentRendition = resolved.rendition;
    document.querySelector('#document-id').textContent = item.id;
    document.querySelector('#document-title').textContent = resolved.rendition?.title || item.title || item.id;
    document.querySelector('#document-meta').textContent = `نسخه ${item.version} · ${item.legalStatus}`;
    notice.hidden = !resolved.notice;
    notice.textContent = resolved.notice;
    clearElement(body);
    clearElement(toc);
    if (resolved.rendition) {
      appendTextBlock(body, resolved.rendition.text ?? '');
      toc.appendChild(makeToc(resolved.rendition.headings, (anchor) => {
        const target = document.querySelector(`[data-anchor="${CSS.escape(anchor)}"]`);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }));
    }
  }

  function renderRoute() {
    hideViews();
    const route = parseRoute(location.hash);
    if (route.name === 'home') {
      homeView.hidden = false;
      state.currentDocument = null;
      state.currentRendition = null;
      return;
    }
    if (route.name === 'document') {
      const item = documents.find((candidate) => candidate.id === route.id);
      if (item) {
        documentView.hidden = false;
        renderDocument(item);
        return;
      }
    }
    notFoundView.hidden = false;
  }

  function renderSearch() {
    const results = searchDocuments(searchIndex, searchInput.value, state.locale);
    clearElement(searchResults);
    searchResults.hidden = !searchInput.value.trim();
    navigation.hidden = !searchResults.hidden;
    for (const result of results) {
      const link = document.createElement('a');
      link.href = result.route;
      link.textContent = `${result.title} — ${result.id}`;
      searchResults.appendChild(link);
    }
  }

  localeSwitcher.addEventListener('change', () => setLocale(localeSwitcher.value));
  searchInput.addEventListener('input', renderSearch);
  window.addEventListener('hashchange', renderRoute);
  document.querySelector('#print-document').addEventListener('click', () => window.print());
  document.querySelector('#copy-document').addEventListener('click', async () => {
    if (state.currentRendition) {
      await navigator.clipboard.writeText(state.currentRendition.text ?? '');
    }
  });
  document.querySelector('#download-document').addEventListener('click', () => {
    if (state.currentDocument && state.currentRendition) {
      downloadText(makeDownloadPayload(
        state.currentDocument,
        state.currentRendition.locale ?? state.locale,
        state.currentRendition,
      ));
    }
  });

  setLocale(state.locale);
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  bootstrap().catch((error) => {
    console.error('Docs Center failed to start', error);
    const main = document.querySelector('#main-content');
    if (main) {
      clearElement(main);
      const message = document.createElement('p');
      message.textContent = 'مرکز اسناد در حال حاضر قابل بارگذاری نیست.';
      main.appendChild(message);
    }
  });
}
