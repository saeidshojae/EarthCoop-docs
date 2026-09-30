window.EC_UI = window.EC_UI || {};

async function copyTextWithFallback(text, options = {}) {
  const clipboard = options.clipboard ?? navigator.clipboard;
  const legacyCopy = options.legacyCopy ?? ((value) => {
    const input = document.createElement('textarea');
    input.value = value;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.append(input);
    input.select();
    const copied = document.execCommand('copy');
    input.remove();
    return copied;
  });
  if (clipboard?.writeText) {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {}
  }
  try {
    return Boolean(legacyCopy(text));
  } catch {
    return false;
  }
}

function requestDocumentPrint(options = {}) {
  const embedded = options.embedded ?? (() => { try { return window.self !== window.top; } catch { return true; } })();
  const href = options.href ?? window.location.href;
  const open = options.open ?? window.open.bind(window);
  const print = options.print ?? window.print.bind(window);
  if (embedded) {
    const [base, hash = ''] = href.split('#');
    const separator = base.includes('?') ? '&' : '?';
    const printUrl = `${base}${separator}print=1${hash ? `#${hash}` : ''}`;
    if (open(printUrl, '_blank', 'noopener')) return 'external';
  }
  print();
  return 'inline';
}

function selectActiveProvision(entries) {
  return entries
    .filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio || Math.abs(a.top) - Math.abs(b.top))[0]?.slug || null;
}

function initializeDocumentReaderControls(activeProvisionSlug = null) {
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
  tocToggle?.addEventListener('click', () => {
    toc.hidden = !toc.hidden;
    tocToggle.setAttribute('aria-expanded', String(!toc.hidden));
  });

  if (activeProvisionSlug) {
    const activeProvision = [...document.querySelectorAll('[data-provision-slug]')]
      .find((item) => item.dataset.provisionSlug === activeProvisionSlug);
    if (activeProvision) {
      activeProvision.setAttribute('tabindex', '-1');
      activeProvision.focus({ preventScroll: true });
      activeProvision.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const provisions = [...document.querySelectorAll('[data-provision-slug]')];
  const tocLinks = [...document.querySelectorAll('#documentToc a')];
  if ('IntersectionObserver' in window && provisions.length && tocLinks.length) {
    const visible = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const slug = entry.target.dataset.provisionSlug;
        if (entry.isIntersecting) visible.set(slug, {
          slug,
          isIntersecting:true,
          intersectionRatio:entry.intersectionRatio,
          top:entry.boundingClientRect.top,
        });
        else visible.delete(slug);
      });
      const current = selectActiveProvision([...visible.values()]);
      if (!current) return;
      tocLinks.forEach((link) => {
        const active = link.getAttribute('href')?.endsWith(`#provision-${current}`);
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }, {rootMargin:'-18% 0px -58% 0px', threshold:[0.15, 0.4, 0.7]});
    provisions.forEach((provision) => observer.observe(provision));
  }

  const status = document.querySelector('[data-copy-status]');
  const manualCopy = document.querySelector('[data-manual-copy]');
  const manualInput = document.querySelector('[data-manual-copy-input]');
  const canonicalLink = () => `${window.location.origin}${window.location.pathname}${window.location.hash}`;
  async function copyAndReport(link) {
    const copied = await copyTextWithFallback(link);
    if (copied) {
      if (status) status.textContent = 'پیوند کپی شد';
      if (manualCopy) manualCopy.hidden = true;
      return;
    }
    if (manualCopy && manualInput) {
      manualCopy.hidden = false;
      manualInput.value = link;
      manualInput.focus();
      manualInput.select();
    }
    if (status) status.textContent = 'کپی خودکار ممکن نشد؛ پیوند را دستی کپی کنید.';
  }
  document.querySelectorAll('[data-copy-provision-link]').forEach((button) => {
    button.addEventListener('click', () => {
      const link = `${window.location.origin}/documents/${button.dataset.documentSlug}/#provision-${button.dataset.provisionSlug}`;
      copyAndReport(link);
    });
  });
  document.querySelector('[data-copy-document-link]')?.addEventListener('click', () => copyAndReport(canonicalLink()));
  document.querySelector('[data-close-manual-copy]')?.addEventListener('click', () => { manualCopy.hidden = true; });
  document.querySelector('[data-print-document]')?.addEventListener('click', () => requestDocumentPrint());
  if (new URLSearchParams(window.location.search).get('print') === '1' && window.self === window.top) {
    setTimeout(() => window.print(), 150);
  }
}

window.EC_UI.initializeDocumentReaderControls = initializeDocumentReaderControls;
window.EC_UI.copyTextWithFallback = copyTextWithFallback;
window.EC_UI.requestDocumentPrint = requestDocumentPrint;
window.EC_UI.selectActiveProvision = selectActiveProvision;
