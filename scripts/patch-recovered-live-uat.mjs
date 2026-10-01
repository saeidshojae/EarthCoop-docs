import { patchRecoveredDocumentReaderControlsSource } from './patch-recovered-ui-polish.mjs';

const DOCUMENTS_START = 'function documentsPage(){';
const DOCUMENTS_END = 'function statusPage(){';

export function patchRecoveredDocumentsPageSource(source) {
  const output = String(source);
  const start = output.indexOf(DOCUMENTS_START);
  const end = output.indexOf(DOCUMENTS_END, start + DOCUMENTS_START.length);
  if (start < 0 || end < 0) throw new Error('Recovered documents page patch point changed');

  const replacement = `function documentsPage(){
 const docs=window.EC_CONTENT.documents;
 const foundational=docs.filter((d)=>d.collection === 'foundational');
 const references=docs.filter((d)=>d.collection === 'reference');
 const card=(d)=>{const status=window.EC_CONTENT.statusDetails[d.status];const inner=\`<div class="doc-id">\${d.code}</div><div><h3>\${d.title}</h3><p>\${d.summary}</p><div class="doc-meta"><span class="badge \${status.badgeClass}">\${status.label}</span><span class="badge review">فارسی</span></div>\${d.availability==='available'?'<span class="document-availability available">مطالعه سند ←</span>':'<span class="document-availability">متن کامل هنوز منتشر نشده</span>'}</div>\`;return d.availability==='available'?\`<a class="doc-card" data-document-status="\${d.filterGroup}" href="\${d.destination}">\${inner}</a>\`:\`<article class="doc-card unavailable" data-document-status="\${d.filterGroup}" aria-disabled="true">\${inner}</article>\`};
 const referenceCard=(d)=>{const status=window.EC_CONTENT.statusDetails[d.status];const inner=\`<div class="doc-id">\${d.code}</div><div><h3>\${d.title}</h3><p>\${d.summary}</p><div class="doc-meta"><span class="badge \${status.badgeClass}">\${status.label}</span><span class="badge review">فارسی</span></div><span class="document-availability available">مطالعه سند ←</span></div>\`;return \`<a class="doc-card" href="\${d.destination}">\${inner}</a>\`};
 return \`<div class="breadcrumbs"><a href="#/home">خانه</a><i></i><span>مراجع</span></div><header class="article-head"><span class="eyebrow">مجموعه حقوقی نسخه‌پذیر</span><h1>اسناد بنیادین</h1><p>ده سند بنیادین نسل رسمی ۱.۰ با چیدمان مبتنی بر معماری حقوقی ممیزی‌شده نمایش داده می‌شوند؛ قوانین موضوعی هم‌رتبه‌اند و ETH سند اخلاقی فرابخشی است، بنابراین چیدمان کارت‌ها به‌تنهایی رتبه حقوقی مستقل ایجاد نمی‌کند. وضعیت هر کارت از همان دادهٔ حاکم بر خوانشگر سند گرفته می‌شود.</p></header><div class="filters" aria-label="فیلتر اسناد بنیادین"><button class="filter active" data-document-filter="all" aria-pressed="true">همه اسناد</button><button class="filter" data-document-filter="effective" aria-pressed="false">نافذ</button></div><p class="filter-count" id="documentCount" aria-live="polite">\${foundational.length} سند نمایش داده می‌شود</p><div class="docs-grid">\${foundational.map(card).join('')}</div>\${references.length?\`<div class="section-title"><div><span class="eyebrow">مجموعه مرجع</span><h2>اسناد مرجع</h2></div></div><p>اسناد مرجع برای توضیح، تبیین و معماری سامانه منتشر می‌شوند و صرف حضور در این مجموعه به معنای اثر حقوقی مستقل نیست.</p><div class="docs-grid">\${references.map(referenceCard).join('')}</div>\`:''}<div class="callout info"><div><strong>قاعده انتشار</strong><p>حضور سند در مرکز دانش به‌تنهایی به معنای نفاذ نیست؛ وضعیت درج‌شده در بالای همان سند و دادهٔ ثبت رسمی ملاک است.</p></div></div>\`
}
`;
  return `${output.slice(0, start)}${replacement}${output.slice(end)}`;
}

export function patchRecoveredTocFinalLayoutSource(source) {
  let output = String(source);
  if (!output.includes('function syncDocumentTocViewport()')) {
    output = patchRecoveredDocumentReaderControlsSource(output);
  }
  const resizeNeedle = "  window.addEventListener('resize', syncDocumentTocViewport, { passive: true });";
  if (!output.includes(resizeNeedle)) throw new Error('Recovered document TOC resize synchronization point changed');
  if (!output.includes("window.addEventListener('load', syncDocumentTocViewport")) {
    output = output.replace(resizeNeedle, `${resizeNeedle}\n  window.addEventListener('load', syncDocumentTocViewport, { once: true });\n  document.fonts?.ready?.then?.(syncDocumentTocViewport);`);
  }
  return output;
}
