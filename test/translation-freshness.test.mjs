import assert from 'node:assert/strict';
import test from 'node:test';

import { checkTranslationFreshness } from '../scripts/check-translation-freshness.mjs';

function rendition(sourceVersion, status, source = 'doc.md') {
  return { source, status, sourceVersion };
}

function entry(overrides = {}) {
  return {
    documentId: 'ECON',
    version: '0.2',
    canonicalLanguage: 'fa',
    renditions: {
      fa: rendition('0.2', 'current', 'fa/econ.md'),
      en: { source: null, status: 'not_translated', sourceVersion: null },
      ar: { source: null, status: 'not_translated', sourceVersion: null },
    },
    ...overrides,
  };
}

function manifest(entries) {
  return { schemaVersion: 2, canonicalDefaultLanguage: 'fa', entries };
}

test('fails when a current English translation targets an older canonical version', () => {
  const result = checkTranslationFreshness(manifest([entry({
    renditions: {
      fa: rendition('0.2', 'current', 'fa/econ.md'),
      en: rendition('0.1', 'current', 'en/econ.md'),
      ar: { source: null, status: 'not_translated', sourceVersion: null },
    },
  })]));
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /ECON.*en.*0\.1.*0\.2/i);
});

test('allows an outdated English translation to remain explicitly stale', () => {
  const result = checkTranslationFreshness(manifest([entry({
    renditions: {
      fa: rendition('0.2', 'current', 'fa/econ.md'),
      en: rendition('0.1', 'outdated', 'en/econ.md'),
      ar: { source: null, status: 'not_translated', sourceVersion: null },
    },
  })]));
  assert.deepEqual(result.errors, []);
});

test('allows a missing translation marked not_translated', () => {
  const result = checkTranslationFreshness(manifest([entry()]));
  assert.deepEqual(result.errors, []);
});

test('allows Arabic needs_review after the canonical document changes', () => {
  const result = checkTranslationFreshness(manifest([entry({
    renditions: {
      fa: rendition('0.2', 'current', 'fa/econ.md'),
      en: { source: null, status: 'not_translated', sourceVersion: null },
      ar: rendition('0.1', 'needs_review', 'ar/econ.md'),
    },
  })]));
  assert.deepEqual(result.errors, []);
});
