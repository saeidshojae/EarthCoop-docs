import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  DOCS_CENTER_LOCALES,
  loadDocsCenterModel,
  makeDocumentRoute,
  normalizeSourceText,
  resolveRendition,
  sanitizeSourceMarkup,
} from '../scripts/docs-center-lib.mjs';

test('defines exactly fa/en/ar with correct direction metadata', () => {
  assert.deepEqual(Object.keys(DOCS_CENTER_LOCALES), ['fa', 'en', 'ar']);
  assert.deepEqual(DOCS_CENTER_LOCALES, {
    fa: { dir: 'rtl' },
    en: { dir: 'ltr' },
    ar: { dir: 'rtl' },
  });
});

test('untranslated locale is explicit and never masquerades as Persian', () => {
  const document = {
    id: 'FC',
    canonicalLanguage: 'fa',
    renditions: {
      fa: { source: 'fa/fc.md', status: 'current', sourceVersion: '1.0' },
      en: { source: null, status: 'not_translated', sourceVersion: null },
      ar: { source: null, status: 'not_translated', sourceVersion: null },
    },
  };

  assert.deepEqual(resolveRendition(document, 'en'), {
    locale: 'en',
    available: false,
    source: null,
    status: 'not_translated',
    sourceVersion: null,
    fallbackLocale: 'fa',
  });
});

test('document route preserves the hash deep-link contract', () => {
  assert.equal(
    makeDocumentRoute('econ-ref-01-fa-0-1'),
    '/#/documents/econ-ref-01-fa-0-1',
  );
});

test('source normalization rejects active script vectors', () => {
  assert.equal(sanitizeSourceMarkup('<script>alert(1)</script>سلام'), 'سلام');
  assert.equal(sanitizeSourceMarkup('<img src=x onerror="alert(1)">متن'), '<img src=x>متن');
  assert.equal(sanitizeSourceMarkup('[x](javascript:alert(1))'), '[x](#)');

  const normalized = normalizeSourceText('# عنوان\n\nمتن <script>x()</script>', 'fa/test.md');
  assert.equal(normalized.path, 'fa/test.md');
  assert.equal(normalized.text.includes('<script>'), false);
  assert.deepEqual(normalized.headings, [{ depth: 1, text: 'عنوان', anchor: 'عنوان' }]);
});

test('loader rejects malformed required manifest fields', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-docs-center-'));
  await mkdir(path.join(root, 'fa'), { recursive: true });
  await writeFile(path.join(root, 'document-registry.json'), JSON.stringify({
    schemaVersion: 2,
    sourceLanguage: 'fa',
    supportedLanguages: ['fa', 'en', 'ar'],
    documents: [{ id: 'FC', slug: 'foundational-covenant', fa: { version: '1.0', status: 'final' } }],
  }));
  await writeFile(path.join(root, 'docs-manifest.json'), JSON.stringify({
    schemaVersion: 2,
    entries: [{
      documentId: 'FC',
      canonicalLanguage: 'fa',
      legalStatus: 'registered_not_effective',
      version: '1.0',
      // renditions intentionally missing
    }],
  }));

  await assert.rejects(loadDocsCenterModel(root), /renditions/i);
});

test('loader preserves governed status values verbatim', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-docs-center-'));
  await mkdir(path.join(root, 'fa'), { recursive: true });
  await writeFile(path.join(root, 'fa/fc.md'), '# سند مادر\n\nمتن');
  await writeFile(path.join(root, 'document-registry.json'), JSON.stringify({
    schemaVersion: 2,
    registryRole: 'public_baseline_and_translation_status',
    statusSemantics: 'editorial_maturity_not_legal_effect',
    sourceLanguage: 'fa',
    supportedLanguages: ['fa', 'en', 'ar'],
    documents: [{
      id: 'FC', slug: 'foundational-covenant',
      fa: { version: '1.0', status: 'final' },
      en: { version: '1.0', status: 'not-started' },
      ar: { version: '1.0', status: 'not-started' },
    }],
  }));
  await writeFile(path.join(root, 'docs-manifest.json'), JSON.stringify({
    schemaVersion: 2,
    registryRole: 'knowledge_center_ingestion',
    statusSemantics: 'publication_candidate_status_not_legal_effect',
    canonicalDefaultLanguage: 'fa',
    entries: [{
      documentId: 'FC', slug: 'foundational/fc', contentClass: 'foundational_document',
      canonicalLanguage: 'fa', legalStatus: 'registered_not_effective', productStatus: null,
      authority: 'EarthCoop founder', version: '1.0', reviewedAt: '2026-09-24',
      renditions: {
        fa: { source: 'fa/fc.md', status: 'current', sourceVersion: '1.0' },
        en: { source: null, status: 'not_translated', sourceVersion: null },
        ar: { source: null, status: 'not_translated', sourceVersion: null },
      }, provisions: [],
    }],
  }));

  const model = await loadDocsCenterModel(root);
  assert.equal(model.locales.fa.dir, 'rtl');
  assert.equal(model.documents[0].legalStatus, 'registered_not_effective');
  assert.equal(model.documents[0].publicBaseline.fa.status, 'final');
  assert.equal(model.documents[0].renditions.fa.status, 'current');
});
