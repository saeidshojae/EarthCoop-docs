import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRecoveredLocaleCatalog } from '../scripts/recovered-locale-catalog.mjs';

function item(renditions) {
  return { documentId: 'FC', renditions };
}

test('current Persian with untranslated alternatives exposes only fa and RTL', () => {
  const result = buildRecoveredLocaleCatalog({
    documents: [item({
      fa: { source: 'published/foundational/FC.fa.md', status: 'current' },
      en: { source: null, status: 'not_translated' },
      ar: { source: null, status: 'not_translated' },
    })], references: [],
  });
  assert.deepEqual(result.globalLocales, ['fa']);
  assert.deepEqual(result.byDocument.FC.available, [{ locale: 'fa', direction: 'rtl', status: 'current' }]);
  assert.deepEqual(result.byDocument.FC.unavailable.sort(), ['ar', 'en']);
});

test('usable explicitly registered English rendition adds en with LTR', () => {
  const result = buildRecoveredLocaleCatalog({
    documents: [item({
      fa: { source: 'published/foundational/FC.fa.md', status: 'current' },
      en: { source: 'en/foundational/fc.mdx', status: 'current' },
      ar: { source: null, status: 'not_translated' },
    })], references: [],
  });
  assert.deepEqual(result.globalLocales, ['fa', 'en']);
  assert.deepEqual(result.byDocument.FC.available[1], { locale: 'en', direction: 'ltr', status: 'current' });
});

test('legacy Mintlify ar Persian mirror never creates an Arabic locale even when malformed metadata marks it current', () => {
  const result = buildRecoveredLocaleCatalog({
    documents: [item({
      fa: { source: 'published/foundational/FC.fa.md', status: 'current' },
      ar: { source: 'ar/foundational/fc.mdx', status: 'current' },
    })], references: [],
  });
  assert.deepEqual(result.globalLocales, ['fa']);
  assert.deepEqual(result.byDocument.FC.available.map((entry) => entry.locale), ['fa']);
  assert.ok(result.byDocument.FC.unavailable.includes('ar'));
});
