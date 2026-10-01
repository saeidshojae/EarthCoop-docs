import test from 'node:test';
import assert from 'node:assert/strict';
import { consolidateAmendment, parseArticles } from '../scripts/consolidate-amendment.mjs';

const base = `# نمونه\n\n**نسخه:** ۱.۰\n\n**وضعیت:** پیش‌نویس\n\n## ماده EX-001 — یک\n\nمتن یک.\n\n## ماده EX-002 — دو\n\nمتن دو.\n\n**پایان اساسنامه اجرایی EarthCoop — نسخه ۱.۰**\n`;

const amendment = `# اصلاحیه\n\n## ماده EX-002 — دو اصلاح‌شده\n\nمتن دو جدید.\n\n## ماده EX-003 — سه جدید\n\nمتن سه.\n`;

test('consolidation replaces existing articles and appends the next stable article id', () => {
  const result = consolidateAmendment({
    base,
    amendment,
    documentId: 'EX',
    baseVersion: '1.0',
    targetVersion: '1.1',
    status: 'پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ',
    authority: 'مرجع آزمون',
    decisionDate: '2026-10-01',
  });

  assert.match(result.document, /ماده EX-002 — دو اصلاح‌شده/);
  assert.doesNotMatch(result.document, /متن دو\.\n/);
  assert.match(result.document, /ماده EX-003 — سه جدید/);
  assert.deepEqual(result.provenance.map((entry) => entry.id), ['EX-001', 'EX-002', 'EX-003']);
  assert.equal(result.provenance.at(-1).source, 'EX 1.1 amendment');
});

test('consolidation rejects a non-sequential newly introduced article id', () => {
  const invalid = `## ماده EX-004 — پرش شناسه\n\nمتن.`;
  assert.throws(() => consolidateAmendment({
    base,
    amendment: invalid,
    documentId: 'EX',
    baseVersion: '1.0',
    targetVersion: '1.1',
    status: 'پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ',
    authority: 'مرجع آزمون',
    decisionDate: '2026-10-01',
  }), /next stable article|sequential|EX-003/i);
});

test('parser recognizes registered STD alias headings and consolidation canonicalizes them', () => {
  const stdBase = `# استاندارد\n\n**نسخه:** ۰.۱\n\n**وضعیت:** پیش‌نویس\n\n## ماده STD-001 — یک\n\nمتن یک.\n\n## ماده STD-002 — دو\n\nمتن دو.\n`;
  const stdAmendment = `## STD-002 / EC-1002 — دو اصلاح‌شده\n\nمتن جدید.\n`;

  assert.deepEqual(parseArticles(stdAmendment, 'STD').map((article) => article.id), ['STD-002']);

  const result = consolidateAmendment({
    base: stdBase,
    amendment: stdAmendment,
    documentId: 'STD',
    baseVersion: '0.1',
    targetVersion: '0.2',
    status: 'پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ',
    authority: 'مرجع آزمون',
    decisionDate: '2026-10-01',
  });

  assert.match(result.document, /## ماده STD-002 \/ EC-1002 — دو اصلاح‌شده/);
  assert.deepEqual(parseArticles(result.document, 'STD').map((article) => article.id), ['STD-001', 'STD-002']);
});
