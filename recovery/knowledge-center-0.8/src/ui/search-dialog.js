window.EC_UI = window.EC_UI || {};
let searchElements;
let previousFocus;

function escapeSearchHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function searchExcerpt(value, query, length = 150) {
  const text = window.EC_DATA.normalizeSearchText(value);
  const needle = window.EC_DATA.normalizeSearchText(query);
  const matchAt = text.indexOf(needle);
  const start = Math.max(0, matchAt < 0 ? 0 : matchAt - 55);
  const excerpt = text.slice(start, start + length);
  return `${start > 0 ? '…' : ''}${excerpt}${start + length < text.length ? '…' : ''}`;
}

function filterSearchIndex(searchIndex, query) {
  const normalized = window.EC_DATA.normalizeSearchText(query);
  return searchIndex
    .filter((item) => !normalized || item.searchText.includes(normalized))
    .slice(0, 18)
    .map((item) => ({...item, excerpt:searchExcerpt(item.searchText || item.desc, normalized)}));
}

function searchResultHref(item) {
  if (window.EC_SITE_CONFIG?.deploymentTarget === 'preview') return `#/${item.route}`;
  const provision = String(item.route || '').match(/^documents\/([a-z0-9-]+)\/provisions\/([a-z0-9-]+)$/);
  if (provision) return `/documents/${provision[1]}/#provision-${provision[2]}`;
  return window.EC_SEO?.getRouteByLegacy(item.route)?.path || '/';
}

function showSearchResults(query, searchIndex) {
  const matches = filterSearchIndex(searchIndex, query);
  searchElements.results.innerHTML = matches.length
    ? matches.map((item) => `<a class="search-result" href="${escapeSearchHtml(searchResultHref(item))}"><strong>${escapeSearchHtml(item.title)}</strong><span>${escapeSearchHtml(item.excerpt)}</span></a>`).join('')
    : '<div class="empty-search">نتیجه‌ای پیدا نشد؛ عبارت دیگری را امتحان کنید.</div>';
  searchElements.results.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeSearchDialog));
}

function openSearchDialog() {
  if (!searchElements) return;
  previousFocus = document.activeElement;
  searchElements.modal.classList.add('open');
  searchElements.modal.setAttribute('aria-hidden', 'false');
  searchElements.trigger.setAttribute('aria-expanded', 'true');
  searchElements.input.value = '';
  showSearchResults('', searchElements.searchIndex);
  setTimeout(() => searchElements.input.focus(), 50);
}

function closeSearchDialog() {
  if (!searchElements || searchElements.modal.getAttribute('aria-hidden') === 'true') return;
  searchElements.modal.classList.remove('open');
  searchElements.modal.setAttribute('aria-hidden', 'true');
  searchElements.trigger.setAttribute('aria-expanded', 'false');
  previousFocus?.focus();
}

function keepFocusInsideDialog(event) {
  if (event.key === 'Tab' && searchElements.modal.getAttribute('aria-hidden') === 'true') return;
  if (event.key !== 'Tab') return;
  const focusable = [...searchElements.modal.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function initializeSearchDialog(searchIndex) {
  searchElements = {
    searchIndex,
    modal: document.getElementById('searchModal'),
    trigger: document.getElementById('searchTrigger'),
    close: document.getElementById('searchClose'),
    input: document.getElementById('searchInput'),
    results: document.getElementById('searchResults'),
  };
  searchElements.trigger.addEventListener('click', openSearchDialog);
  searchElements.close.addEventListener('click', closeSearchDialog);
  searchElements.input.addEventListener('input', () => showSearchResults(searchElements.input.value, searchIndex));
  searchElements.modal.addEventListener('click', (event) => { if (event.target === searchElements.modal) closeSearchDialog(); });
  searchElements.modal.addEventListener('keydown', keepFocusInsideDialog);
  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openSearchDialog(); }
    if (event.key === 'Escape') closeSearchDialog();
  });
}

window.EC_UI.openSearchDialog = openSearchDialog;
window.EC_UI.closeSearchDialog = closeSearchDialog;
window.EC_UI.initializeSearchDialog = initializeSearchDialog;
window.EC_UI.filterSearchIndex = filterSearchIndex;
window.EC_UI.searchResultHref = searchResultHref;
