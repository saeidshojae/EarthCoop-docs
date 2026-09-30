const USABLE = new Set(['current', 'needs_review', 'outdated']);

export function classifyRepositoryLocalePath(sourcePath) {
  const value = String(sourcePath ?? '').replaceAll('\\', '/');
  if (value.startsWith('ar/')) {
    return {
      contentLanguage: 'fa',
      localeRole: 'legacy_mintlify_rtl_alias',
      translationLanguage: null,
    };
  }
  if (value.startsWith('en/')) {
    return {
      contentLanguage: 'en',
      localeRole: 'translation_candidate',
      translationLanguage: 'en',
    };
  }
  return {
    contentLanguage: 'fa',
    localeRole: 'canonical_or_unscoped',
    translationLanguage: null,
  };
}

export function resolveDisplayLocales(renditions = {}) {
  const locales = [];
  if (renditions.fa?.source && USABLE.has(renditions.fa?.status)) locales.push('fa');
  if (renditions.en?.source && USABLE.has(renditions.en?.status)) locales.push('en');
  if (renditions.ar?.source && USABLE.has(renditions.ar?.status)) locales.push('ar');
  return locales;
}
