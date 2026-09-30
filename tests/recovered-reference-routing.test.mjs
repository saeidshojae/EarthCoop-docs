import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRecoveredRouteEntries } from '../scripts/recovered-route-policy.mjs';

const catalog = {
  documents: [{
    documentId: 'FC', contentClass: 'foundational_document', canonicalLanguage: 'fa', legalStatus: 'registered_not_effective',
    version: '1.1', slug: 'foundational/fc', markdown: '# سند مادر', source: 'published/foundational/FC-1.1.fa.md', renditions: {},
  }],
  references: [{
    documentId: 'ECON-REF-01', contentClass: 'reference', canonicalLanguage: 'fa', legalStatus: 'official_draft',
    version: '0.1', slug: 'reference/economy/econ-ref-01', routeId: 'econ-ref-01-fa-0-1', markdown: '# سند مرجع',
    source: 'references/economy/ECON-REF-01-0.1.fa.md', renditions: {},
  }],
};

test('reference routes are discoverable in a dedicated collection with stable application-compatible deep links', () => {
  const routes = buildRecoveredRouteEntries(catalog);
  const reference = routes.find((item) => item.documentId === 'ECON-REF-01');

  assert.ok(reference);
  assert.equal(reference.collection, 'references');
  assert.equal(reference.hashRoute, '#/documents/econ-ref-01-fa-0-1');
  assert.equal(reference.staticPath, '/documents/econ-ref-01-fa-0-1/');
  assert.equal(reference.legalStatus, 'official_draft');
  assert.equal(reference.legalEffect, false);
});

test('registered-not-effective foundational routes remain distinct from effective status', () => {
  const routes = buildRecoveredRouteEntries(catalog);
  const foundational = routes.find((item) => item.documentId === 'FC');
  assert.equal(foundational.hashRoute, '#/documents/fc');
  assert.equal(foundational.collection, 'foundational');
  assert.equal(foundational.legalEffect, false);
});
