import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRecoveredSearchIndex } from '../scripts/build-recovered-search-index.mjs';

const packages = [
  { code:'FC', slug:'fc', contentClass:'foundational_document', canonicalLanguage:'fa', status:'registered_not_effective', title:'سند مادر', currentVersion:{version:'1.1'}, provisions:[{stableSlug:'fc-001',title:'اصل',body:'حق انتفاع برابر از زمین',children:[]}] },
  { code:'ECON-REF-01', slug:'econ-ref-01-fa-0-1', contentClass:'reference', canonicalLanguage:'fa', status:'official_draft', title:'سند مرجع اقتصاد', currentVersion:{version:'0.1'}, provisions:[{stableSlug:'section-2',title:'بخش دوم',body:'مقدمه مدل',children:[{stableSlug:'section-2-4',title:'تمایزهای بنیادین',body:'حق با پول و دارایی یکی نیست',children:[]}]}] },
];

test('indexes body text, stable anchors and recovered-router routes for foundational and nested reference content', () => {
  const rows = buildRecoveredSearchIndex(packages, { allowedLocales:['fa'] });
  const ref = rows.find((row) => row.documentId === 'ECON-REF-01' && row.anchor === 'section-2-4');
  assert.ok(ref);
  assert.match(ref.body, /حق با پول/);
  assert.equal(ref.route, '#/documents/econ-ref-01-fa-0-1/provisions/section-2-4');
  assert.equal(ref.contentClass, 'reference');
  assert.equal(ref.status, 'official_draft');
  assert.equal(ref.version, '0.1');
  assert.equal(rows.filter((row) => row.body.includes('حق با پول')).length, 1);
});

test('locale filtering excludes ineligible renditions and corpus order is deterministic', () => {
  const rows = buildRecoveredSearchIndex(packages, { allowedLocales:['en'] });
  assert.deepEqual(rows, []);
  const faRows = buildRecoveredSearchIndex(packages, { allowedLocales:['fa'] });
  assert.deepEqual(faRows.map((r) => r.documentId), ['ECON-REF-01','ECON-REF-01','FC']);
});
