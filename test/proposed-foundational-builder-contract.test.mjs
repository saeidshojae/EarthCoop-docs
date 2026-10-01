import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildProposedFoundational } from '../scripts/build-proposed-foundational.mjs';
import { parseArticles } from '../scripts/consolidate-amendment.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const expectedTargets = new Map([
  ['FC', '1.2'],
  ['CH', '1.1'],
  ['CO', '1.1'],
  ['EX', '1.2'],
  ['ECON', '0.3'],
  ['DG', '0.3'],
  ['JUD', '0.3'],
  ['LOC', '0.3'],
  ['ETH', '0.3'],
  ['STD', '0.3'],
]);

test('builds every proposed foundational target as a non-registered full draft with provenance', async () => {
  const packages = await buildProposedFoundational(repositoryRoot);
  assert.equal(packages.length, expectedTargets.size);

  for (const item of packages) {
    assert.equal(item.version, expectedTargets.get(item.id));
    assert.match(item.markdown, /پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ/);
    assert.doesNotMatch(item.markdown, /این نسخه ثبت شده است/);
    const articles = parseArticles(item.markdown, item.id);
    assert.equal(item.provenance.length, articles.length);
    assert.ok(item.provenance.every((row) => /^[a-f0-9]{64}$/.test(row.sha256)));
  }
});

test('EX 1.2 appends EX-085 without renumbering the historical 84 articles', async () => {
  const packages = await buildProposedFoundational(repositoryRoot);
  const ex = packages.find((item) => item.id === 'EX');
  const ids = parseArticles(ex.markdown, 'EX').map((article) => article.id);
  assert.equal(ids.length, 85);
  assert.equal(ids.at(-1), 'EX-085');
  assert.equal(ex.provenance.find((row) => row.id === 'EX-085').source, 'EX 1.2 amendment');
});
