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

const charterStyle = `# منشور EarthCoop

**شناسه سند:** CH

## دیباچه
متن دیباچه.

# بخش نخست — ماهیت منشور

## ماده CH-001 — ماهیت منشور
متن ماده اول.

## ماده CH-002 — جایگاه منشور
متن ماده دوم.

# بخش دوم — فلسفه بنیادین

## ماده CH-003 — اصل آغاز از زمین
متن ماده سوم.
`;

test('parses official Markdown into stable flat provisions without inventing section provisions', () => {
  const parsed = parseFoundationalMarkdown(source, { documentId: 'FC' });
  assert.equal(parsed.title, 'سند مادر EarthCoop');
  assert.match(parsed.preamble, /شناسه سند:\s*FC/);
  assert.match(parsed.preamble, /دیباچه/);
  assert.doesNotMatch(parsed.preamble, /^#{1,6}\s+/m);
  assert.deepEqual(parsed.provisions.map((item) => [item.id, item.stableSlug, item.title]), [
    ['FC-001', 'fc-001', 'ماده FC-001 — ماهیت سند مادر'],
    ['FC-002', 'fc-002', 'ماده FC-002 — هدف اصلی'],
  ]);
  assert.match(parsed.provisions[0].body, /بند دوم/);
  assert.equal(parsed.provisions[0].children.length, 0);
});

test('supports CH-style level-2 article headings and stops article bodies at peer or higher headings', () => {
  const parsed = parseFoundationalMarkdown(charterStyle, { documentId: 'CH' });
  assert.deepEqual(parsed.provisions.map((item) => item.id), ['CH-001', 'CH-002', 'CH-003']);
  assert.equal(parsed.provisions[1].body, 'متن ماده دوم.');
  assert.doesNotMatch(parsed.provisions[1].body, /بخش دوم/);
  assert.equal(parsed.provisions[2].stableSlug, 'ch-003');
});

test('rejects article ids that do not belong to the manifest document', () => {
  const malformed = source.replace('ماده FC-002', 'ماده CH-002');
  assert.throws(() => parseFoundationalMarkdown(malformed, { documentId: 'FC' }), /CH-002.*FC/);
});

test('adapts registered metadata to the 0.8 package and normalizes embedded pre-v1 identity to the registered version', () => {
  const parsed = parseFoundationalMarkdown(source, { documentId: 'FC' });
  const result = toLegacyDocumentPackage(parsed, {
    documentId: 'FC',
    slug: 'foundational/fc',
    canonicalLanguage: 'fa',
    legalStatus: 'effective',
    authority: 'EarthCoop founder',
    version: '1.0',
    reviewedAt: '2026-10-01',
    source: 'releases/foundational/2026-10-01/consolidated/FC-1.0.full.fa.md',
  });
  assert.equal(result.slug, 'fc');
  assert.equal(result.code, 'FC');
  assert.equal(result.status, 'effective');
  assert.equal(result.currentVersion.version, '1.0');
  assert.equal(result.currentVersion.sourcePath, 'releases/foundational/2026-10-01/consolidated/FC-1.0.full.fa.md');
  assert.equal(result.canonicalLanguage, 'fa');
  assert.equal(result.provisions.length, 2);
  assert.match(result.preamble, /نسخه:\s*1\.0/);
  assert.doesNotMatch(result.preamble, /نسخه:\s*1\.1/);
  assert.doesNotMatch(result.preamble, /^#{1,6}\s+/m);
});
