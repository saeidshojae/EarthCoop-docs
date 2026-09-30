const AUDITED_CRUMB = '<a href="/documents/">اسناد بنیادین</a>';
const PATCHED_CRUMB = '<a href="/documents/">${documentRecord.contentClass === \'reference\' ? \'اسناد مرجع\' : \'اسناد بنیادین\'}</a>';

export function patchRecoveredDocumentReaderSource(source) {
  const input = String(source ?? '');
  if (!input.includes(AUDITED_CRUMB)) {
    throw new Error('Recovered document reader patch point is missing');
  }
  return input.replace(AUDITED_CRUMB, PATCHED_CRUMB);
}
