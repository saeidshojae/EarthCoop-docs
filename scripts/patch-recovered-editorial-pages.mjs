const AUDIT_MARKER = 'recovered-reference-pages-audited-2026-10-02';

export function patchRecoveredEditorialPagesSource(source) {
  const input = String(source ?? '');
  if (!input.includes('window.EC_CONTENT.pageRecords = Object.freeze([')) {
    throw new Error('Recovered editorial page-record patch point is missing');
  }
  if (input.includes(AUDIT_MARKER)) return input;
  return `${input.trimEnd()}\n\n// ${AUDIT_MARKER}\nconst auditedReferencePageMetadata = Object.freeze({\n  glossary: Object.freeze({ status:'unofficial_explanation', version:'1.0.0', reviewedAt:'2026-10-02', source:'فرهنگ اصطلاحات canonical، اسناد رسمی و راهنماهای ممیزی‌شده', authority:'تحریریه مرکز دانش بر پایه منابع رسمی' }),\n  map: Object.freeze({ status:'unofficial_explanation', version:'1.0.0', reviewedAt:'2026-10-02', source:'معماری جاری زیست‌بوم و راهنماهای ممیزی‌شده', authority:'تحریریه مرکز دانش بر پایه ممیزی محصول و اسناد رسمی' }),\n  status: Object.freeze({ status:'unofficial_explanation', version:'1.0.0', reviewedAt:'2026-10-02', source:'ممیزی مخزن EarthCoop در main', authority:'ممیزی مخزن و تحریریه مرکز دانش' }),\n});\nwindow.EC_CONTENT.pageRecords = Object.freeze(window.EC_CONTENT.pageRecords.map((record) =>\n  auditedReferencePageMetadata[record.route] ? { ...record, ...auditedReferencePageMetadata[record.route] } : record\n));\n`;
}
