export const RECOVERED_BRAND_LOGO = '/assets/brand/earthcoop-logo.png';

function displayHost(mainSiteUrl) {
  const url = new URL(mainSiteUrl);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('mainSiteUrl must be a trusted HTTPS URL');
  }
  return url.hostname.replace(/^www\./i, '');
}

export function renderRecoveredPrintBrand({ mainSiteUrl }) {
  const host = displayHost(mainSiteUrl);
  return `<section class="print-document-brand" aria-label="EarthCoop"><img src="${RECOVERED_BRAND_LOGO}" alt="لوگوی رسمی EarthCoop"><div><strong>EarthCoop</strong><span><bdi dir="ltr">${host}</bdi></span></div></section>`;
}

export function patchRecoveredDocumentPrintHtml(source, { mainSiteUrl }) {
  const input = String(source ?? '');
  if (input.includes('class="print-document-brand"')) return input;
  const marker = '<div class="page">';
  if (!input.includes(marker)) throw new Error('Recovered document print-brand HTML patch point changed');
  return input.replace(marker, `${marker}${renderRecoveredPrintBrand({ mainSiteUrl })}`);
}

export function patchRecoveredDocumentPrintStyles(source) {
  const input = String(source ?? '');
  const marker = '/* Recovered official document print branding */';
  if (input.includes(marker)) return input;
  return `${input.trimEnd()}\n\n${marker}\n.print-document-brand{display:none}\n@media print{.print-document-brand{display:flex;direction:ltr;align-items:center;gap:10px;margin:0 0 20px;padding:0 0 12px;border-bottom:1px solid #d7dfdb;color:#111}.print-document-brand img{width:44px;height:44px;object-fit:contain}.print-document-brand div{display:grid;gap:2px;text-align:left}.print-document-brand strong{font-size:16px;line-height:1.2;color:#111}.print-document-brand span{font-size:11px;line-height:1.2;color:#444}}\n`;
}
