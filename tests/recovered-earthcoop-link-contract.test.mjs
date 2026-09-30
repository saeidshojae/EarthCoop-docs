import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRecoveredRouteEntries } from '../scripts/recovered-route-policy.mjs';

const foundationalIds = ['FC','CH','CO','EX','ECON','DG','JUD','LOC','ETH','STD'];
const catalog = {
  documents: foundationalIds.map((documentId) => ({
    documentId,
    contentClass:'foundational_document',
    canonicalLanguage:'fa',
    legalStatus:'registered_not_effective',
  })),
  references:[{
    documentId:'ECON-REF-01',
    contentClass:'reference',
    canonicalLanguage:'fa',
    legalStatus:'official_draft',
    routeId:'econ-ref-01-fa-0-1',
  }],
};

test('matches the EarthCoop application deep-link contract for all ten foundational documents', () => {
  const routes = buildRecoveredRouteEntries(catalog);
  for (const id of foundationalIds) {
    const route = routes.find((item) => item.documentId === id);
    assert.ok(route, `missing ${id}`);
    assert.equal(route.hashRoute, `#/documents/${id.toLowerCase()}`);
    assert.equal(route.staticPath, `/documents/${id.toLowerCase()}/`);
  }
});

test('matches the EarthCoop application ECON-REF-01 deep-link contract exactly', () => {
  const routes = buildRecoveredRouteEntries(catalog);
  const route = routes.find((item) => item.documentId === 'ECON-REF-01');
  assert.ok(route);
  assert.equal(route.hashRoute, '#/documents/econ-ref-01-fa-0-1');
  assert.equal(route.staticPath, '/documents/econ-ref-01-fa-0-1/');
});

test('does not expose legacy Mintlify content paths as canonical application routes', () => {
  const serialized = JSON.stringify(buildRecoveredRouteEntries(catalog));
  for (const forbidden of ['/fa/introduction','/fa/foundational','/00-overview','/fa/api/overview','/governance/translation-policy']) {
    assert.doesNotMatch(serialized, new RegExp(forbidden.replaceAll('/', '\\/')));
  }
});
