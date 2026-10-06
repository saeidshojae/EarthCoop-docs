import assert from 'node:assert/strict';
import test from 'node:test';

import {
  patchRecoveredStaticSeoHtml,
  renderRecoveredHostingHtaccess,
} from '../scripts/recovered-deployment-artifact.mjs';
import { resolveRecoveredDeploymentProfile } from '../scripts/recovered-deployment-profile.mjs';

const preview = resolveRecoveredDeploymentProfile({
  target: 'preview',
  canonicalOrigin: 'https://docs-preview.earthcoop.ir',
});
const production = resolveRecoveredDeploymentProfile({
  target: 'production',
  canonicalOrigin: 'https://docs.earthcoop.ir',
});

const source = '<html><head><meta name="robots" content="noindex,nofollow"><link rel="canonical" href="https://docs-preview.earthcoop.ir/documents/fc/"><meta property="og:url" content="https://docs-preview.earthcoop.ir/documents/fc/"><meta property="og:image" content="https://docs-preview.earthcoop.ir/assets/brand/earthcoop-logo.png"><script type="application/ld+json">{"url":"https://docs-preview.earthcoop.ir/documents/fc/"}</script></head><body></body></html>';

test('production static HTML uses only Production origin and is not globally noindex', () => {
  const output = patchRecoveredStaticSeoHtml(source, production);
  assert.doesNotMatch(output, /docs-preview\.earthcoop\.ir/);
  assert.match(output, /https:\/\/docs\.earthcoop\.ir\/documents\/fc\//);
  assert.doesNotMatch(output, /content="noindex,nofollow"/);
  assert.match(output, /meta name="robots" content="index,follow"/);
  assert.match(output, /<link rel="icon" type="image\/png" href="\/assets\/brand\/earthcoop-brand-192\.png">/);
});

test('preview static HTML remains Preview-only and globally noindex', () => {
  const productionSource = source.replaceAll('https://docs-preview.earthcoop.ir', 'https://docs.earthcoop.ir').replace('content="noindex,nofollow"', 'content="index,follow"');
  const output = patchRecoveredStaticSeoHtml(productionSource, preview);
  assert.doesNotMatch(output, /https:\/\/docs\.earthcoop\.ir/);
  assert.match(output, /https:\/\/docs-preview\.earthcoop\.ir\/documents\/fc\//);
  assert.match(output, /meta name="robots" content="noindex,nofollow"/);
  assert.match(output, /<link rel="icon" type="image\/png" href="\/assets\/brand\/earthcoop-brand-192\.png">/);
});

test('hosting headers preserve Preview noindex but omit it entirely in Production', () => {
  const previewHtaccess = renderRecoveredHostingHtaccess(preview);
  assert.match(previewHtaccess, /docs-preview\.earthcoop\.ir/);
  assert.match(previewHtaccess, /X-Robots-Tag "noindex, nofollow"/);

  const productionHtaccess = renderRecoveredHostingHtaccess(production);
  assert.match(productionHtaccess, /https:\/\/docs\.earthcoop\.ir/);
  assert.doesNotMatch(productionHtaccess, /docs-preview\.earthcoop\.ir/);
  assert.doesNotMatch(productionHtaccess, /X-Robots-Tag "noindex, nofollow"/);
  assert.match(productionHtaccess, /X-Content-Type-Options "nosniff"/);
  assert.match(productionHtaccess, /Referrer-Policy "strict-origin-when-cross-origin"/);
});
