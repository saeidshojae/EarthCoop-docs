import assert from 'node:assert/strict';
import test from 'node:test';
import { parseFoundationalMarkdown, toLegacyDocumentPackage } from '../scripts/legacy-docs-center-adapter.mjs';

const source = `---
title: "سند مادر EarthCoop"
description: "متن کامل"
---

# سند مادر EarthCoop

**شناسه سند:** FC

**نسخه:** 1.1

**وضعیت:** ثبت‌شده — غیرنافذ

---

## قانون قوانین
**عنوان رسمی:** سند مادر EarthCoop  
**زبان مبنا:** فارسی

## دیباچه

متن دیباچه.

---

## بخش نخست

### ماده FC-001 — ماهیت سند مادر

۱. متن ماده اول.

۲. بند دوم.

### ماده FC-002 — هدف اصلی

متن ماده دوم.
`;

test('parses official Markdown into stable flat provisions without inventing section provisions', () => {
  const parsed = parseFoundationalMarkdown(source, { documentId: 'FC' });
  assert.equal(parsed.title, 'سند مادر EarthCoop');
  assert.match(parsed.preamble, /شناسه سند:\s*FC/);
  assert.match(parsed.preamble, /دیباچه/);
  assert.deepEqual(parsed.provisions.map((item) => [item.id, item.stableSlug, item.title]), [
    ['FC-001', 'fc-001', 'ماده FC-001 — ماهیت سند مادر'],
    ['FC-002', 'fc-002', 'ماده FC-002 — هدف اصلی'],
  ]);
  assert.match(parsed.provisions[0].body, /بند دوم/);
  assert.equal(parsed.provisions[0].children.length, 0);
});

test('rejects article ids that do not belong to the manifest document', () => {
  const malformed = source.replace('ماده FC-002', 'ماده CH-002');
  assert.throws(() => parseFoundationalMarkdown(malformed, { documentId: 'FC' }), /CH-002.*FC/);
});

test('adapts manifest metadata to the 0.8 document package shape without changing legal status', () => {
  const parsed = parseFoundationalMarkdown(source, { documentId: 'FC' });
  const result = toLegacyDocumentPackage(parsed, {
    documentId: 'FC',
    slug: 'foundational/fc',
    canonicalLanguage: 'fa',
    legalStatus: 'registered_not_effective',
    authority: 'EarthCoop founder',
    version: '1.1',
    reviewedAt: '2026-09-24',
    source: 'published/foundational/FC-1.1.fa.md',
  });
  assert.equal(result.slug, 'fc');
  assert.equal(result.code, 'FC');
  assert.equal(result.status, 'registered_not_effective');
  assert.equal(result.currentVersion.version, '1.1');
  assert.equal(result.currentVersion.sourcePath, 'published/foundational/FC-1.1.fa.md');
  assert.equal(result.canonicalLanguage, 'fa');
  assert.equal(result.provisions.length, 2);
});
