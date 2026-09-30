export function patchRecoveredEditorialPagesSource(source) {
  const input = String(source ?? '');
  if (!input.includes('window.EC_CONTENT.pageRecords = Object.freeze([')) {
    throw new Error('Recovered editorial page-record patch point is missing');
  }
  return `${input.trimEnd()}\n\nwindow.EC_CONTENT.pageRecords = Object.freeze(window.EC_CONTENT.pageRecords.map((record) =>\n  ['status','map','glossary'].includes(record.route) ? { ...record, status:'under_audit' } : record\n));\n`;
}
