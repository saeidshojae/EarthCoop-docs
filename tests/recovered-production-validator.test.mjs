import assert from 'node:assert/strict';
import test from 'node:test';

import * as productionValidator from '../scripts/validate-recovered-production-artifact.mjs';

const productionPage = {
  relative: 'documents/fc/index.html',
  html: '<html lang="fa"><head><title>FC — EarthCoop</title><meta name="description" content="Foundational document"><meta name="robots" content="index,follow"><link rel="canonical" href="https://docs.earthcoop.ir/documents/fc/"><meta property="og:title" content="FC — EarthCoop"><meta property="og:description" content="Foundational document"><meta property="og:url" content="https://docs.earthcoop.ir/documents/fc/"><meta property="og:locale" content="fa_IR"><meta name="twitter:title" content="FC — EarthCoop"><meta name="twitter:description" content="Foundational document"></head></html>',
};

const good = {
  manifest: {
    schemaVersion: 2,
    repository: 'saeidshojae/EarthCoop-docs',
    sourceSha: 'a'.repeat(40),
    runtimeBaseline: 'earthcoop-knowledge-center-0.8.0',
    deploymentTarget: 'production',
    indexing: 'enabled',
    canonicalOrigin: 'https://docs.earthcoop.ir',
    displayLocales: ['fa', 'en'],
    documentLocales: ['fa'],
    guideLocales: ['en'],
    englishGuideCount: 31,
  },
  htaccess: 'RewriteRule ^ https://docs.earthcoop.ir%{REQUEST_URI} [R=301,L]\nHeader always set X-Content-Type-Options "nosniff"',
  siteConfig: 'deploymentTarget: "self-hosted"\ncanonicalOrigin: "https://docs.earthcoop.ir"',
  robotsTxt: 'User-agent: *\nAllow: /\nSitemap: https://docs.earthcoop.ir/sitemap.xml\n',
  sitemapXml: '<urlset><url><loc>https://docs.earthcoop.ir/documents/fc/</loc></url></urlset>',
  htmlSamples: [productionPage],
};

test('accepts a production policy surface with exact origin and indexing state', () => {
  assert.equal(typeof productionValidator.assertRecoveredProductionPolicy, 'function');
  assert.doesNotThrow(() => productionValidator.assertRecoveredProductionPolicy(good));
});

test('rejects Preview leakage, global noindex, wrong manifest target, or wrong canonical origin', () => {
  const validate = productionValidator.assertRecoveredProductionPolicy;
  assert.throws(() => validate({ ...good, siteConfig: `${good.siteConfig}\nhttps://docs-preview.earthcoop.ir` }), /preview/i);
  assert.throws(() => validate({ ...good, htaccess: `${good.htaccess}\nX-Robots-Tag "noindex, nofollow"` }), /noindex/i);
  assert.throws(() => validate({
    ...good,
    htmlSamples: [{
      ...productionPage,
      html: productionPage.html.replace('index,follow', 'noindex,nofollow'),
    }],
  }), /indexable|noindex/i);
  assert.throws(() => validate({ ...good, manifest: { ...good.manifest, deploymentTarget: 'preview' } }), /production target/i);
  assert.throws(() => validate({ ...good, manifest: { ...good.manifest, canonicalOrigin: 'https://docs-preview.earthcoop.ir' } }), /origin/i);
});

test('rejects robots or sitemap that disagree with production origin/indexability', () => {
  const validate = productionValidator.assertRecoveredProductionPolicy;
  assert.throws(() => validate({ ...good, robotsTxt: 'User-agent: *\nDisallow: /\n' }), /robots/i);
  assert.throws(() => validate({ ...good, sitemapXml: '<urlset><url><loc>https://docs-preview.earthcoop.ir/</loc></url></urlset>' }), /preview|sitemap/i);
});
