import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRecoveredEditorialTruth } from '../scripts/build-recovered-editorial-truth.mjs';

const inventory = { pages: [
  {path:'introduction.mdx', title:'Introduction'},
  {path:'groups/overview.mdx', title:'Groups'},
]};

test('classifies recovered Persian editorial pages as historical snapshots, not current product truth', () => {
  const truth = buildRecoveredEditorialTruth(inventory);
  assert.equal(truth.recoveredPersianGuides.status, 'historical_snapshot');
  assert.equal(truth.statusPage.status, 'needs_review');
  assert.equal(truth.mapPage.status, 'needs_review');
  assert.equal(truth.glossaryPage.status, 'needs_review');
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
