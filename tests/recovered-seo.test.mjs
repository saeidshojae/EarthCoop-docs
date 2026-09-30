import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRecoveredSeoAssets } from '../scripts/build-recovered-seo.mjs';

const routes = [
  { documentId:'FC', routeId:'fc', staticPath:'/documents/fc/', locale:'fa', legalStatus:'registered_not_effective', contentClass:'foundational_document' },
  { documentId:'ECON-REF-01', routeId:'econ-ref-01-fa-0-1', staticPath:'/documents/econ-ref-01-fa-0-1/', locale:'fa', legalStatus:'official_draft', contentClass:'reference' },
];

test('preview SEO uses preview origin, blocks indexing and includes reference route without production canonical leakage', () => {
  const seo = buildRecoveredSeoAssets({ canonicalOrigin:'https://docs-preview.earthcoop.ir', routes, preview:true });
  assert.match(seo.robotsTxt, /User-agent: \*/);
  assert.match(seo.robotsTxt, /Disallow: \//);
  assert.doesNotMatch(seo.robotsTxt, /docs\.earthcoop\.ir/);
  assert.match(seo.sitemapXml, /docs-preview\.earthcoop\.ir\/documents\/econ-ref-01-fa-0-1\//);
  assert.doesNotMatch(seo.sitemapXml, /https:\/\/docs\.earthcoop\.ir/);
  assert.ok(seo.routes.every((route) => route.indexable === false));
});

test('SEO language alternates never emit Arabic without a genuine Arabic rendition', () => {
  const seo = buildRecoveredSeoAssets({ canonicalOrigin:'https://docs-preview.earthcoop.ir', routes, preview:true });
  const ref = seo.routes.find((route) => route.documentId === 'ECON-REF-01');
  assert.deepEqual(ref.hreflang, [{ locale:'fa', href:'https://docs-preview.earthcoop.ir/documents/econ-ref-01-fa-0-1/' }]);
  assert.equal(ref.canonical, 'https://docs-preview.earthcoop.ir/documents/econ-ref-01-fa-0-1/');
});
