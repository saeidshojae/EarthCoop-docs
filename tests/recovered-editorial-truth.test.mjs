import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRecoveredEditorialTruth } from '../scripts/build-recovered-editorial-truth.mjs';

const inventory = { pages: [
  {path:'introduction.mdx', title:'Introduction'},
  {path:'groups/overview.mdx', title:'Groups'},
]};

test('classifies the Persian learning-path guides and audited public reference pages as current editorial content', () => {
  const truth = buildRecoveredEditorialTruth(inventory);
  assert.equal(truth.recoveredPersianGuides.status, 'audited_current');
  assert.equal(truth.recoveredPersianGuides.revision, '2026-10-02-audited-v1');
  assert.equal(truth.recoveredPersianGuides.productTruth, 'audited_against_current_repository_and_official_v1');
  for (const page of [truth.statusPage, truth.mapPage, truth.glossaryPage]) {
    assert.equal(page.status, 'audited_current');
    assert.equal(page.revision, '2026-10-02-reference-audit-v1');
  }
});

test('preserves reviewed English inventory as verified source evidence without claiming runtime mapping', () => {
  const truth = buildRecoveredEditorialTruth(inventory);
  assert.equal(truth.reviewedEnglishGuides.status, 'verified_current');
  assert.equal(truth.reviewedEnglishGuides.runtimeMapped, false);
  assert.deepEqual(truth.reviewedEnglishGuides.paths, ['groups/overview.mdx','introduction.mdx']);
});

test('genuine Arabic remains unavailable and legacy ar mirrors are explicitly excluded', () => {
  const truth = buildRecoveredEditorialTruth(inventory);
  assert.equal(truth.arabic.status, 'unavailable');
  assert.equal(truth.arabic.legacyMintlifyArIsArabic, false);
});
