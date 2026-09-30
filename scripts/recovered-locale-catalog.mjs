import { classifyRepositoryLocalePath } from './docs-center-locale-policy.mjs';

const USABLE = new Set(['current', 'needs_review', 'outdated']);
const DIRECTIONS = Object.freeze({ fa: 'rtl', en: 'ltr', ar: 'rtl' });
const ORDER = ['fa', 'en', 'ar'];

function genuineLocale(locale, rendition) {
  if (!rendition?.source || !USABLE.has(rendition.status)) return false;
  if (locale === 'fa') return true;
  return classifyRepositoryLocalePath(rendition.source).translationLanguage === locale;
}

export function buildRecoveredLocaleCatalog(catalog) {
  const byDocument = {};
  const global = new Set();
  for (const item of [...(catalog.documents ?? []), ...(catalog.references ?? [])]) {
    const available = [];
    const unavailable = [];
    for (const locale of ORDER) {
      const rendition = item.renditions?.[locale];
      if (genuineLocale(locale, rendition)) {
        available.push({ locale, direction: DIRECTIONS[locale], status: rendition.status });
        global.add(locale);
      } else {
        unavailable.push(locale);
      }
    }
    byDocument[item.documentId] = { available, unavailable };
  }
  return {
    globalLocales: ORDER.filter((locale) => global.has(locale)),
    byDocument,
  };
}
