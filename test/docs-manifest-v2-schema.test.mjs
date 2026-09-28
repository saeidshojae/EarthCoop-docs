import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const schema = JSON.parse(await readFile(new URL('../schemas/knowledge-document.schema.json', import.meta.url), 'utf8'));

function entrySchema() {
  return schema.properties.entries.items;
}

function resolveLocalRef(node) {
  if (!node?.$ref) return node;
  assert.ok(node.$ref.startsWith('#/$defs/'));
  const key = node.$ref.replace('#/$defs/', '');
  return schema.$defs[key];
}

test('manifest contract is schemaVersion 2 with canonical default language', () => {
  assert.equal(schema.properties.schemaVersion.const, 2);
  assert.deepEqual(schema.required, ['schemaVersion', 'canonicalDefaultLanguage', 'entries']);
  assert.deepEqual(schema.properties.canonicalDefaultLanguage.enum, ['fa', 'en', 'ar']);
});

test('entry contract requires one document identity and multilingual renditions', () => {
  const entry = entrySchema();
  assert.deepEqual(entry.required, [
    'documentId', 'slug', 'contentClass', 'canonicalLanguage', 'legalStatus',
    'authority', 'version', 'reviewedAt', 'renditions',
  ]);
  assert.deepEqual(entry.properties.canonicalLanguage.enum, ['fa', 'en', 'ar']);
  assert.deepEqual(entry.properties.productStatus.anyOf, [
    { enum: ['available', 'in_development', 'planned'] },
    { type: 'null' },
  ]);
  assert.deepEqual(Object.keys(entry.properties.renditions.properties), ['fa', 'en', 'ar']);
});

test('rendition contract only allows defined translation statuses and nullable untranslated sources', () => {
  const rendition = resolveLocalRef(entrySchema().properties.renditions.properties.fa);
  assert.deepEqual(rendition.required, ['source', 'status', 'sourceVersion']);
  assert.deepEqual(rendition.properties.status.enum, ['current', 'needs_review', 'outdated', 'not_translated']);
  assert.deepEqual(rendition.properties.source.type, ['string', 'null']);
  assert.deepEqual(rendition.properties.sourceVersion.type, ['string', 'null']);
});
