import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import { validateTerminology } from '../scripts/validate-terminology.mjs';

const requiredKeys = [
  'earthcoop', 'bahar', 'gol', 'dim_bahar', 'activation', 'public_assembly',
  'manager', 'inspector', 'value_participation_unit', 'najm_bahar', 'najm_hoda',
];

test('canonical glossary contains the required EarthCoop terminology in fa/en/ar', async () => {
  const glossary = JSON.parse(await readFile(new URL('../glossary/terms.json', import.meta.url), 'utf8'));
  const result = validateTerminology(glossary);
  assert.deepEqual(result.errors, []);

  const byKey = new Map(glossary.terms.map((term) => [term.key, term]));
  for (const key of requiredKeys) {
    assert.ok(byKey.has(key), `missing required terminology key ${key}`);
    for (const language of ['fa', 'en', 'ar']) {
      assert.ok(byKey.get(key)[language].trim().length > 0, `${key}.${language} must not be blank`);
    }
  }
});

test('rejects duplicate terminology keys', () => {
  const result = validateTerminology({
    schemaVersion: 1,
    terms: [
      { key: 'bahar', fa: 'بهار', en: 'Bahar', ar: 'بهار' },
      { key: 'bahar', fa: 'بهار', en: 'Bahar', ar: 'بهار' },
    ],
  });
  assert.match(result.errors.join('\n'), /duplicate.*bahar/i);
});

test('rejects blank translations', () => {
  const result = validateTerminology({
    schemaVersion: 1,
    terms: [{ key: 'gol', fa: 'گل', en: '', ar: 'گل' }],
  });
  assert.match(result.errors.join('\n'), /gol\.en.*blank/i);
});

test('rejects NewEarthCoop as the English product name', () => {
  const result = validateTerminology({
    schemaVersion: 1,
    terms: [{ key: 'earthcoop', fa: 'ارث‌کوپ', en: 'NewEarthCoop', ar: 'إرث‌كوب' }],
  });
  assert.match(result.errors.join('\n'), /NewEarthCoop.*not allowed/i);
});
