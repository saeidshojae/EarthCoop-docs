import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { reviewFoundationalReleaseCandidate } from '../scripts/review-foundational-release-candidate.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const expectedVersions = {
  FC: '1.2',
  CH: '1.1',
  CO: '1.1',
  EX: '1.2',
  ECON: '0.3',
  DG: '0.3',
  JUD: '0.3',
  LOC: '0.3',
  ETH: '0.3',
  STD: '0.3',
  'ECON-REF-01': '0.2',
};

test('final release-candidate review covers the entire proposed legal package without registering it', async () => {
  const review = await reviewFoundationalReleaseCandidate(repositoryRoot);

  assert.equal(review.schemaVersion, 1);
  assert.equal(review.status, 'pre_registration_review');
  assert.equal(review.requiresExplicitFounderDecision, true);
  assert.deepEqual(
    Object.fromEntries(review.documents.map(({ id, version }) => [id, version])),
    expectedVersions,
  );
  assert.equal(review.documents.length, 11);
  assert.ok(review.documents.every((item) => item.registered === false && item.effective === false));
  assert.equal(review.blockers.length, 0);
});

test('review preserves stable EX history and checks authority boundaries', async () => {
  const review = await reviewFoundationalReleaseCandidate(repositoryRoot);
  const ex = review.documents.find((item) => item.id === 'EX');

  assert.equal(ex.articleCount, 85);
  assert.equal(ex.lastProvisionId, 'EX-085');
  assert.equal(review.invariants.singleSourceOfLegalTruth, true);
  assert.equal(review.invariants.peerTopicalLaws, true);
  assert.equal(review.invariants.nonAuthoritativeEthicsAndReference, true);
  assert.equal(review.invariants.executionCannotCreateLaw, true);
});

test('registration proposal is a plan only and identifies authority-state files that must not change during review', async () => {
  const review = await reviewFoundationalReleaseCandidate(repositoryRoot);

  assert.deepEqual(review.unchangedAuthorityFiles, [
    'document-registry.json',
    'docs-manifest.json',
  ]);
  assert.equal(review.registrationProposal.applyNow, false);
  assert.equal(review.registrationProposal.requiresExplicitFounderDecision, true);
  assert.ok(review.registrationProposal.steps.some((step) => step.includes('registered release')));
  assert.ok(review.registrationProposal.steps.some((step) => step.includes('public baseline')));
});
