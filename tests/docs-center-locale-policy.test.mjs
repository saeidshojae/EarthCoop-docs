import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyRepositoryLocalePath, resolveDisplayLocales } from '../scripts/docs-center-locale-policy.mjs';

test('legacy ar/ paths are Persian RTL compatibility content, not Arabic translations', () => {
  assert.deepEqual(classifyRepositoryLocalePath('ar/introduction.mdx'), {
    contentLanguage: 'fa',
    localeRole: 'legacy_mintlify_rtl_alias',
    translationLanguage: null,
  });
});

test('real English source is recognized as English only when explicitly registered', () => {
  assert.deepEqual(classifyRepositoryLocalePath('en/foundational/index.mdx'), {
    contentLanguage: 'en',
    localeRole: 'translation_candidate',
    translationLanguage: 'en',
  });
});

test('display locales never advertise Arabic without a genuine Arabic rendition', () => {
  const locales = resolveDisplayLocales({
    fa: { status: 'current', source: 'published/foundational/FC-1.1.fa.md' },
    en: { status: 'not_translated', source: null },
    ar: { status: 'not_translated', source: null },
  });
  assert.deepEqual(locales, ['fa']);
});

test('legacy Mintlify ar/ content is rejected even if metadata incorrectly marks it current', () => {
  const locales = resolveDisplayLocales({
    fa: { status: 'current', source: 'published/foundational/FC-1.1.fa.md' },
    ar: { status: 'current', source: 'ar/introduction.mdx' },
  });
  assert.deepEqual(locales, ['fa']);
});

test('display locales include English only for a usable registered English rendition', () => {
  const locales = resolveDisplayLocales({
    fa: { status: 'current', source: 'published/foundational/FC-1.1.fa.md' },
    en: { status: 'current', source: 'en/foundational/fc/index.mdx' },
    ar: { status: 'not_translated', source: null },
  });
  assert.deepEqual(locales, ['fa', 'en']);
});
