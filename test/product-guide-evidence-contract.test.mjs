import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const inventoryPath = path.join(root, 'audits/product-guides/2026-09-28-inventory.json');
const evidencePath = path.join(root, 'audits/product-guides/2026-09-28-evidence.json');

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

test('every inventoried product guide has an evidence-backed classification', async () => {
  const inventory = await readJson(inventoryPath);
  const evidence = await readJson(evidencePath);
  const recordsByPage = new Map(evidence.records.map((record) => [record.page, record]));

  assert.equal(recordsByPage.size, evidence.records.length, 'evidence pages must be unique');
  for (const item of inventory.pages) {
    assert.ok(recordsByPage.has(item.path), `missing evidence classification for ${item.path}`);
  }

  const allowedClassifications = new Set(['keep_correct', 'rewrite', 'remove_archive']);
  const allowedProductStatuses = new Set(['available', 'in_development', 'planned', 'not_applicable']);
  for (const record of evidence.records) {
    assert.ok(allowedClassifications.has(record.classification), `invalid classification for ${record.page}`);
    assert.ok(allowedProductStatuses.has(record.productStatus), `invalid productStatus for ${record.page}`);
    assert.ok(typeof record.claimId === 'string' && record.claimId.length > 0, `claimId required for ${record.page}`);
    assert.ok(Array.isArray(record.evidence), `evidence array required for ${record.page}`);

    if (record.productStatus === 'available') {
      assert.ok(record.evidence.some((item) => item.repo === 'saeidshojae/EarthCoop'), `available ${record.page} needs EarthCoop code/test evidence`);
    }
    for (const item of record.evidence) {
      assert.notEqual(item.path, record.page, `${record.page} cannot self-prove its product claim`);
      assert.ok(item.repo && item.path && item.ref && item.note, `incomplete evidence item for ${record.page}`);
    }
  }
});

test('six known suspect guides are explicitly classified for rewrite or removal', async () => {
  const evidence = await readJson(evidencePath);
  const recordsByPage = new Map(evidence.records.map((record) => [record.page, record]));
  for (const page of [
    'introduction.mdx',
    'quickstart.mdx',
    'groups/overview.mdx',
    'projects/overview.mdx',
    'najm-bahar/overview.mdx',
    'najm-hoda/overview.mdx'
  ]) {
    const record = recordsByPage.get(page);
    assert.ok(record, `missing suspect-page classification for ${page}`);
    assert.ok(['rewrite', 'remove_archive'].includes(record.classification), `${page} must not be kept without correction`);
  }
});
