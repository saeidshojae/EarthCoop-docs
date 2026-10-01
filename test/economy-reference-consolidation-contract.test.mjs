import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildProposedEconomyReference } from '../scripts/build-proposed-economy-reference.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('builds ECON-REF-01 0.2 as a full non-authoritative working draft', async () => {
  const result = await buildProposedEconomyReference(repositoryRoot);

  assert.equal(result.id, 'ECON-REF-01');
  assert.equal(result.baseVersion, '0.1');
  assert.equal(result.version, '0.2');
  assert.match(result.markdown, /پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ/);
  assert.match(result.markdown, /اثر حقوقی مستقل:\*\* ندارد/);
  assert.match(result.markdown, /## ۱\.۸ — سازگاری نسخه‌ای/);
  assert.match(result.markdown, /## ۱\.۹ — قواعد مثال و سناریو/);
  assert.match(result.markdown, /## ۱\.۱۰ — رابطه با STD و پیاده‌سازی/);
  assert.doesNotMatch(result.markdown, /ECON → ECON-REF-01 → سیاست‌نامه‌ها/);
  assert.match(result.markdown, /ECON-REF-01 یک پله در سلسله‌مراتب الزام نیست/);
  assert.equal(result.provenance.length, 7);
  assert.deepEqual(result.provenance.map((row) => row.section), ['1.1', '1.2', '1.5', '1.7', '1.8', '1.9', '1.10']);
  assert.ok(result.provenance.every((row) => /^[a-f0-9]{64}$/.test(row.sha256)));
});
