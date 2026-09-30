window.EC_UI = window.EC_UI || {};

function publicationMetadata(record) {
  if (!record) return '';
  const status = window.EC_CONTENT.statusDetails[record.status];
  return `<details class="publication-metadata" aria-label="فراداده انتشار"><summary>مشخصات انتشار <span class="badge ${status.badgeClass}">${status.label}</span></summary>
    <dl><div><dt>منبع</dt><dd>${record.source}</dd></div><div><dt>مرجع مسئول</dt><dd>${record.authority || 'تعیین نشده'}</dd></div><div><dt>نسخه محتوای صفحه</dt><dd><bdi dir="ltr">${record.version}</bdi></dd></div><div><dt>آخرین بازبینی انسانی</dt><dd><bdi dir="ltr">${record.reviewedAt}</bdi></dd></div></dl>
  </details>`;
}

function renderNotFound(title) {
  return `<div class="not-found"><span class="eyebrow">خطای ۴۰۴</span><h1>${title}</h1><p>نشانی واردشده در مرکز دانش وجود ندارد یا جابه‌جا شده است.</p><a class="primary-btn" href="#/documents">بازگشت به کتابخانه اسناد</a></div>`;
}

function renderRoute(route, pages) {
  const documentRoute = window.EC_UI.resolveDocumentRoute(route);
  let selectedRoute = pages[route] ? route : 'not-found';
  let title = pages[route]?.title || 'صفحه پیدا نشد';
  let content = pages[route]?.render() || renderNotFound('صفحه پیدا نشد');
  let record = window.EC_CONTENT.pageRecords.find((item) => item.route === selectedRoute);
  if (documentRoute) {
    const documentResult = window.EC_DATA.documentRepository.getDocumentBySlug(documentRoute.documentSlug);
    selectedRoute = 'documents';
    record = null;
    if (!documentResult.ok) {
      title = 'سند پیدا نشد';
      content = renderNotFound('سند پیدا نشد');
    } else if (documentRoute.provisionSlug && !window.EC_DATA.documentRepository.getProvision(documentRoute.documentSlug, documentRoute.provisionSlug).ok) {
      title = 'بند پیدا نشد';
      content = renderNotFound('بند پیدا نشد');
    } else {
      title = documentResult.value.title;
      content = window.EC_PAGES.renderDocumentReader(documentResult.value, documentRoute.provisionSlug);
    }
  }
  document.querySelectorAll('[data-route]').forEach((link) => link.classList.toggle('active', link.dataset.route === selectedRoute));
  document.title = `${title} — مرکز دانش ارث‌کوپ`;
  const app = document.getElementById('app');
  const seoRoute = window.EC_SEO?.getRouteByLegacy(documentRoute ? `documents/${documentRoute.documentSlug}` : selectedRoute);
  const renderedContent = seoRoute ? window.EC_RENDER.renderRouteBody(seoRoute, { bodyHtml:content }) : content;
  app.innerHTML = `<div class="page">${renderedContent}${publicationMetadata(record)}</div>`;
  const heading = app.querySelector('h1');
  heading?.setAttribute('tabindex', '-1');
  heading?.classList.add('route-focus-target');
  heading?.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'instant' });
  window.EC_UI.setMobileNavigation?.(false);
  window.EC_UI.initializeDocumentFilters?.();
  window.EC_UI.initializeDocumentReaderControls?.(documentRoute?.provisionSlug || null);
  document.querySelectorAll('[data-anchor]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      document.getElementById(link.getAttribute('href').slice(1))?.scrollIntoView({ behavior: 'smooth' });
    });
  });
  return selectedRoute;
}

window.EC_UI.renderRoute = renderRoute;
