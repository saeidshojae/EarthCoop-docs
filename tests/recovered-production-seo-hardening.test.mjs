import assert from 'node:assert/strict';
import test from 'node:test';

import { buildRecoveredSeoAssets } from '../scripts/build-recovered-seo.mjs';
import { patchRecoveredStaticSeoHtml } from '../scripts/recovered-deployment-artifact.mjs';

const production = {
  target: 'production',
  canonicalOrigin: 'https://docs.earthcoop.ir',
};

test('production sitemap contains the public Persian shell and excludes explicitly non-indexable routes', () => {
  const seo = buildRecoveredSeoAssets({
    canonicalOrigin: production.canonicalOrigin,
    preview: false,
    routes: [
      { staticPath: '/documents/fc/', locale: 'fa', indexable: true, contentClass: 'foundational_document' },
      { staticPath: '/en/introduction/', locale: 'en', indexable: false, contentClass: 'guide' },
    ],
  });

  assert.match(seo.sitemapXml, /https:\/\/docs\.earthcoop\.ir\/<\/loc>/);
  assert.match(seo.sitemapXml, /https:\/\/docs\.earthcoop\.ir\/guides\/start\/<\/loc>/);
  assert.match(seo.sitemapXml, /https:\/\/docs\.earthcoop\.ir\/roles\/active-member\/<\/loc>/);
  assert.match(seo.sitemapXml, /https:\/\/docs\.earthcoop\.ir\/documents\/fc\/<\/loc>/);
  assert.doesNotMatch(seo.sitemapXml, /\/en\/introduction\//);
});

test('production English guide SEO stays intentionally non-indexable and uses its own canonical OpenGraph identity', () => {
  const html = '<html lang="en"><head><link rel="canonical" href="https://docs.earthcoop.ir/en/introduction/"><meta name="robots" content="index,follow"><meta property="og:url" content="https://docs.earthcoop.ir/guides/start/"><meta property="og:locale" content="fa_IR"></head><body></body></html>';
  const output = patchRecoveredStaticSeoHtml(html, production);

  assert.match(output, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(output, /<meta property="og:url" content="https:\/\/docs\.earthcoop\.ir\/en\/introduction\/">/);
  assert.match(output, /<meta property="og:locale" content="en_US">/);
});

test('production OpenGraph URL follows each page canonical instead of its template parent', () => {
  const html = '<html lang="fa"><head><link rel="canonical" href="https://docs.earthcoop.ir/roles/manager/"><meta name="robots" content="index,follow"><meta property="og:url" content="https://docs.earthcoop.ir/roles/"><meta property="og:locale" content="fa_IR"></head><body></body></html>';
  const output = patchRecoveredStaticSeoHtml(html, production);

  assert.match(output, /<meta property="og:url" content="https:\/\/docs\.earthcoop\.ir\/roles\/manager\/">/);
  assert.match(output, /<meta property="og:locale" content="fa_IR">/);
});

test('production 404 is noindex even though normal Production pages are indexable', () => {
  const html = '<html lang="fa"><head><meta name="robots" content="index,follow"></head><body></body></html>';
  const output = patchRecoveredStaticSeoHtml(html, production, { forceNoindex: true });

  assert.match(output, /<meta name="robots" content="noindex,nofollow">/);
});
