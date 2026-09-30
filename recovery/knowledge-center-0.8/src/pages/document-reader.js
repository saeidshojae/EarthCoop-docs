window.EC_PAGES = window.EC_PAGES || {};

function escapeDocumentHtml(value = '') {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function flattenProvisions(nodes) {
  return nodes.flatMap((node) => [node, ...flattenProvisions(node.children || [])]);
}

function formatDocumentBody(value = '') {
  const identifiers = ['registered_not_effective','approved_not_effective','unofficial_explanation','public_consultation','official_draft','under_audit','superseded','withdrawn','effective','concept'];
  const pattern = new RegExp(`\\b(${identifiers.join('|')})\\b`, 'g');
  return escapeDocumentHtml(value).replace(pattern, '<bdi dir="ltr" class="status-token">$1</bdi>');
}

function renderPreambleValue(label, value) {
  const escaped = escapeDocumentHtml(value.trim());
  return /^(شناسه(?: سند)?|نسخه(?: جدید| مبنا)?|تاریخ(?: ثبت| تدوین)?)$/.test(label.trim())
    ? `<bdi dir="ltr">${escaped}</bdi>`
    : escaped;
}

function isPreambleMetadataLabel(value = '') {
  return /^(شناسه(?: سند)?|نسخه(?: جدید| مبنا)?|وضعیت|مرجع ثبت|تاریخ ثبت|کامل‌بودن متن|عنوان رسمی|عنوان کوتاه|جایگاه|تاریخ تدوین|زبان مبنا|نسبت با .+|دامنه اعتبار)$/.test(value.trim());
}

function parseMetadataLines(value = '') {
  const entries = [];
  let current = null;
  for (const rawLine of value.split('\n')) {
    const line = rawLine.trim().replace(/^•\s*/, '');
    if (!line) continue;
    const match = line.match(/^([^:：]{2,60})[:：]\s*(.*)$/);
    if (match && isPreambleMetadataLabel(match[1])) {
      current = { label: match[1].trim(), value: match[2].trim() };
      entries.push(current);
    } else if (current) {
      current.value = `${current.value} ${line}`.trim();
    }
  }
  return entries;
}

function renderMetadataList(entries, className = 'document-metadata-grid') {
  if (!entries.length) return '';
  return `<dl class="${className}">${entries.map(({ label, value }) => `<div><dt>${escapeDocumentHtml(label)}</dt><dd>${renderPreambleValue(label, value)}</dd></div>`).join('')}</dl>`;
}

function renderPreambleNarrative(value = '') {
  const headingPattern = /^(دیباچه|دامنه اعتبار|ساختار سند|روابط اسنادی|نسبت با .+|ماهیت(?:،| و|$).*)$/;
  return value.split(/\n\s*\n/).map((rawBlock) => rawBlock.trim()).filter((block) => block && block !== '---').map((block) => {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    const firstMetadata = lines.findIndex((line) => {
      const match = line.replace(/^•\s*/, '').match(/^([^:：]{2,60})[:：]/);
      return Boolean(match && isPreambleMetadataLabel(match[1]));
    });
    if (firstMetadata >= 0) {
      const heading = firstMetadata > 0 ? `<h2 class="document-preamble-subtitle">${escapeDocumentHtml(lines.slice(0, firstMetadata).join(' — '))}</h2>` : '';
      return `${heading}${renderMetadataList(parseMetadataLines(lines.slice(firstMetadata).join('\n')), 'document-metadata-grid document-metadata-grid-secondary')}`;
    }
    if (lines.length === 1 && headingPattern.test(lines[0])) return `<h2>${escapeDocumentHtml(lines[0])}</h2>`;
    return `<p>${escapeDocumentHtml(lines.join('\n'))}</p>`;
  }).join('');
}

function renderDocumentPreamble(value = '') {
  const normalized = String(value).replace(/\r\n?/g, '\n').trim();
  if (!normalized) return '';
  const [identitySource, ...narrativeParts] = normalized.split(/\n\s*---\s*\n/);
  if (!narrativeParts.length) return `<section class="document-preamble" aria-label="معرفی سند"><div class="lead-box document-identity"><p>${escapeDocumentHtml(normalized)}</p></div></section>`;
  const identityBlocks = identitySource.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  const title = identityBlocks.shift() || '';
  const identityEntries = [{ label: 'عنوان سند', value: title }, ...parseMetadataLines(identityBlocks.join('\n'))];
  const narrative = narrativeParts.join('\n\n').trim();
  return `<section class="document-preamble" aria-label="معرفی و شناسنامه سند"><div class="lead-box document-identity"><h2 class="document-identity-title">شناسنامه سند</h2>${renderMetadataList(identityEntries)}</div>${narrative ? `<div class="document-preamble-body">${renderPreambleNarrative(narrative)}</div>` : ''}</section>`;
}

function renderProvision(node, documentSlug, activeSlug, depth = 0) {
  const active = node.stableSlug === activeSlug;
  const headingLevel = Math.min(2 + depth, 6);
  const body = node.body ? `<p>${formatDocumentBody(node.body)}</p>` : '';
  const children = (node.children || []).sort((a,b) => a.order - b.order).map((child) => renderProvision(child, documentSlug, activeSlug, depth + 1)).join('');
  return `<section class="document-provision provision-depth-${depth}" id="provision-${escapeDocumentHtml(node.stableSlug)}" data-provision-slug="${escapeDocumentHtml(node.stableSlug)}"${active?' data-active-provision="true"':''}>
    <div class="provision-heading-row"><h${headingLevel}>${escapeDocumentHtml(node.title)} <a class="provision-permalink" href="/documents/${escapeDocumentHtml(documentSlug)}/#provision-${escapeDocumentHtml(node.stableSlug)}" aria-label="پیوند پایدار ${escapeDocumentHtml(node.title)}"><span aria-hidden="true">↗</span></a></h${headingLevel}><button type="button" class="copy-provision-link" aria-label="کپی پیوند ${escapeDocumentHtml(node.title)}" title="کپی پیوند" data-copy-provision-link data-document-slug="${escapeDocumentHtml(documentSlug)}" data-provision-slug="${escapeDocumentHtml(node.stableSlug)}"><span aria-hidden="true">⧉</span><span class="sr-only">کپی پیوند</span></button></div>
    ${body}${children}
  </section>`;
}

function renderDocumentToc(documentRecord, activeSlug) {
  return flattenProvisions(documentRecord.provisions).map((node) => `<a href="/documents/${escapeDocumentHtml(documentRecord.slug)}/#provision-${escapeDocumentHtml(node.stableSlug)}"${node.stableSlug===activeSlug?' aria-current="location"':''}>${escapeDocumentHtml(node.title)}</a>`).join('');
}

function renderDocumentReader(documentRecord, activeProvisionSlug = null) {
  const status = window.EC_CONTENT.statusDetails[documentRecord.status];
  const provisions = [...documentRecord.provisions].sort((a,b) => a.order - b.order).map((node) => renderProvision(node, documentRecord.slug, activeProvisionSlug)).join('');
  const download = window.EC_CONTENT.documentDownloads?.[`${documentRecord.slug}@${documentRecord.currentVersion.version}`];
  const downloadAction = download
    ? `<a data-download-document download="${escapeDocumentHtml(download.filename)}" href="/downloads/documents/${escapeDocumentHtml(download.filename)}">دانلود PDF</a>`
    : '';
  return `<div class="breadcrumbs"><a href="/">خانه</a><i></i><a href="/documents/">اسناد بنیادین</a><i></i><span>${escapeDocumentHtml(documentRecord.title)}</span></div>
    <header class="document-head"><span class="eyebrow">${escapeDocumentHtml(documentRecord.code)}</span><h1>${escapeDocumentHtml(documentRecord.title)}</h1><p>${escapeDocumentHtml(documentRecord.summary)}</p><span class="badge ${status.badgeClass}">${status.label}</span></header>
    <div class="document-reader-actions"><button type="button" data-document-toc-toggle data-document-toc-collapse aria-expanded="false" aria-controls="documentToc">فهرست سند</button><button type="button" data-copy-document-link>کپی نشانی سند</button><button type="button" data-print-document>چاپ سند</button>${downloadAction}<details class="document-version-history"><summary>تاریخچه نسخه‌ها</summary><span><bdi dir="ltr">${escapeDocumentHtml(documentRecord.currentVersion.version)}</bdi> — ${escapeDocumentHtml(documentRecord.reviewedAt)}</span></details><span class="copy-status" data-copy-status aria-live="polite"></span></div>
    <div class="manual-copy" data-manual-copy hidden><label for="manualDocumentLink">کپی دستی پیوند</label><input id="manualDocumentLink" data-manual-copy-input type="text" readonly><button type="button" data-close-manual-copy>بستن</button></div>
    <div class="document-reader-layout"><article class="document-reader">${renderDocumentPreamble(documentRecord.preamble || '')}<div class="document-provenance"><span>منبع: ${escapeDocumentHtml(documentRecord.source)}</span><span>مرجع: ${escapeDocumentHtml(documentRecord.authority)}</span><span>نسخه: <bdi dir="ltr">${escapeDocumentHtml(documentRecord.currentVersion.version)}</bdi></span><span>بازبینی: <bdi dir="ltr">${escapeDocumentHtml(documentRecord.reviewedAt)}</bdi></span></div>${provisions}</article><aside class="document-toc" id="documentToc"><strong>فهرست سند</strong>${renderDocumentToc(documentRecord, activeProvisionSlug)}</aside></div>`;
}

window.EC_PAGES.escapeDocumentHtml = escapeDocumentHtml;
window.EC_PAGES.flattenProvisions = flattenProvisions;
window.EC_PAGES.formatDocumentBody = formatDocumentBody;
window.EC_PAGES.renderDocumentPreamble = renderDocumentPreamble;
window.EC_PAGES.renderDocumentReader = renderDocumentReader;
