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
  const fa = renditions.fa;
  if (fa?.source && USABLE.has(fa.status)) locales.push('fa');

  const en = renditions.en;
  if (en?.source && USABLE.has(en.status)
      && classifyRepositoryLocalePath(en.source).translationLanguage === 'en') {
    locales.push('en');
  }

  const ar = renditions.ar;
  if (ar?.source && USABLE.has(ar.status)
      && classifyRepositoryLocalePath(ar.source).translationLanguage === 'ar') {
    locales.push('ar');
  }
  return locales;
}
