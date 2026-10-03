import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRecoveredDeploymentProfile } from '../scripts/recovered-deployment-profile.mjs';
import * as staticDocuments from '../scripts/render-recovered-static-documents.mjs';

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
  assert.equal(typeof staticDocuments.patchRecoveredStaticSeoHtml, 'function');
  const output = staticDocuments.patchRecoveredStaticSeoHtml(source, production);
  assert.doesNotMatch(output, /docs-preview\.earthcoop\.ir/);
  assert.match(output, /https:\/\/docs\.earthcoop\.ir\/documents\/fc\//);
  assert.doesNotMatch(output, /content="noindex,nofollow"/);
  assert.match(output, /meta name="robots" content="index,follow"/);
});

test('preview static HTML remains Preview-only and globally noindex', () => {
  assert.equal(typeof staticDocuments.patchRecoveredStaticSeoHtml, 'function');
  const productionSource = source.replaceAll('https://docs-preview.earthcoop.ir', 'https://docs.earthcoop.ir').replace('content="noindex,nofollow"', 'content="index,follow"');
  const output = staticDocuments.patchRecoveredStaticSeoHtml(productionSource, preview);
  assert.doesNotMatch(output, /https:\/\/docs\.earthcoop\.ir/);
  assert.match(output, /https:\/\/docs-preview\.earthcoop\.ir\/documents\/fc\//);
  assert.match(output, /meta name="robots" content="noindex,nofollow"/);
});
