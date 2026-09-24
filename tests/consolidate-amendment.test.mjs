import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  consolidateAmendment,
  parseArticles,
} from '../scripts/consolidate-amendment.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const base = `# سند پایه

**نسخه:** ۱.۰
**وضعیت:** نسخه پایه

## دیباچه

متن دیباچه.

### ماده EX-001 — یک

متن قدیم یک.

### ماده EX-002 — دو

متن ثابت دو.

### ماده EX-003 — سه

متن قدیم سه.
`;

const amendment = `# اصلاحیه

## نسبت با قانون اقتصاد

این نسبت باید در متن کامل حفظ شود.

## ماده EX-001 — یک جدید

متن جدید یک.

## ماده EX-003 — سه جدید

متن جدید سه.

## Change Log — EX 1.1

- اصلاح مواد یک و سه.
`;

test('parses unique article IDs and rejects duplicate provisions', () => {
  assert.deepEqual(parseArticles(base).map((article) => article.id), ['EX-001', 'EX-002', 'EX-003']);

  assert.throws(
    () => parseArticles(`${base}\n### ماده EX-002 — تکراری\n\nمتن.`),
    /duplicate article EX-002/i,
  );
});

test('stops an article at the next peer section heading', () => {
  const parsed = parseArticles(`${base}\n## Change Log — EX 1.1\n\n- بیرون از ماده.`);
  assert.doesNotMatch(parsed.at(-1).text, /Change Log|بیرون از ماده/);
});

test('replaces amended articles and preserves unchanged articles verbatim', () => {
  const result = consolidateAmendment({
    base,
    amendment,
    documentId: 'EX',
    baseVersion: '1.0',
    targetVersion: '1.1',
    status: 'ثبت‌شده — غیرنافذ',
    authority: 'بنیان‌گذار EarthCoop',
    decisionDate: '2026-09-24',
  });

  assert.match(result.document, /متن جدید یک/);
  assert.doesNotMatch(result.document, /متن قدیم یک/);
  assert.match(result.document, /### ماده EX-002 — دو\n\nمتن ثابت دو/);
  assert.match(result.document, /این نسبت باید در متن کامل حفظ شود/);
  assert.match(result.document, /Change Log — EX 1\.1/);
  assert.equal(result.document.match(/Change Log — EX 1\.1/g)?.length, 1);
  assert.match(result.document, /\*\*نسخه:\*\* ۱\.۱/);
  assert.match(result.document, /\*\*وضعیت:\*\* ثبت‌شده — غیرنافذ/);
  assert.doesNotMatch(result.document, /پایان اساسنامه اجرایی EarthCoop — نسخه ۱\.۰/);
  assert.equal(result.provenance.find((item) => item.id === 'EX-002').source, 'EX 1.0');
  assert.equal(result.provenance.find((item) => item.id === 'EX-003').source, 'EX 1.1 amendment');
});

test('rejects missing, non-sequential, foreign, and newly introduced article IDs', () => {
  assert.throws(
    () => consolidateAmendment({
      base: base.replace(/### ماده EX-002[\s\S]*?(?=### ماده EX-003)/, ''),
      amendment,
      documentId: 'EX',
      baseVersion: '1.0',
      targetVersion: '1.1',
      status: 'ثبت‌شده — غیرنافذ',
      authority: 'بنیان‌گذار EarthCoop',
      decisionDate: '2026-09-24',
    }),
    /sequential/i,
  );

  assert.throws(
    () => consolidateAmendment({
      base,
      amendment: `${amendment}\n## ماده EX-004 — افزوده\n\nمتن.`,
      documentId: 'EX',
      baseVersion: '1.0',
      targetVersion: '1.1',
      status: 'ثبت‌شده — غیرنافذ',
      authority: 'بنیان‌گذار EarthCoop',
      decisionDate: '2026-09-24',
    }),
    /not present in base/i,
  );

  assert.throws(() => parseArticles('## ماده ECON-001 — بیگانه\n\nمتن.', 'EX'), /foreign article/i);
});

test('records one provenance row for every article with source hashes', () => {
  const result = consolidateAmendment({
    base,
    amendment,
    documentId: 'EX',
    baseVersion: '1.0',
    targetVersion: '1.1',
    status: 'ثبت‌شده — غیرنافذ',
    authority: 'بنیان‌گذار EarthCoop',
    decisionDate: '2026-09-24',
  });

  assert.equal(result.provenance.length, 3);
  assert.ok(result.provenance.every((item) => /^[a-f0-9]{64}$/.test(item.sha256)));
});

test('consolidates the repository EX sources into exactly 84 traceable articles', async () => {
  const [repositoryBase, repositoryAmendment] = await Promise.all([
    readFile(path.join(repositoryRoot, 'sources/foundational/EX-1.0.fa.md'), 'utf8'),
    readFile(path.join(repositoryRoot, 'releases/foundational/2026-09-20/EX-1.1.fa.md'), 'utf8'),
  ]);
  const result = consolidateAmendment({
    base: repositoryBase,
    amendment: repositoryAmendment,
    documentId: 'EX',
    baseVersion: '1.0',
    targetVersion: '1.1',
    status: 'ثبت‌شده — غیرنافذ',
    authority: 'بنیان‌گذار EarthCoop',
    decisionDate: '2026-09-24',
  });

  assert.equal(parseArticles(repositoryBase, 'EX').length, 84);
  assert.equal(parseArticles(repositoryAmendment, 'EX').length, 31);
  assert.equal(parseArticles(result.document, 'EX').length, 84);
  assert.equal(result.provenance.length, 84);
  assert.equal(result.provenance.filter((item) => item.source === 'EX 1.1 amendment').length, 31);
  assert.match(result.document, /پایان اساسنامه اجرایی EarthCoop — نسخه ۱\.۱/);
  assert.doesNotMatch(result.document, /پایان اساسنامه اجرایی EarthCoop — نسخه ۱\.۰/);
});
