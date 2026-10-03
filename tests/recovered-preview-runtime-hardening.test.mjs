import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ROLE_GUIDES_REVISION,
  patchRecoveredRoleGuidesAppSource,
} from '../scripts/patch-recovered-role-guides.mjs';
import * as staticDocuments from '../scripts/render-recovered-static-documents.mjs';

test('role-guide runtime declares its revision before injected renderers use it', () => {
  const source = 'const pages={roles:{render(){return "legacy"}}};\nwindow.EC_PAGES = window.EC_PAGES || {};';
  const output = patchRecoveredRoleGuidesAppSource(source);
  const revisionDeclaration = `const ROLE_GUIDES_REVISION = ${JSON.stringify(ROLE_GUIDES_REVISION)};`;
  assert.match(output, new RegExp(revisionDeclaration.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.ok(output.indexOf(revisionDeclaration) < output.indexOf('function renderRoleGuideRuntime'));
});

test('preview static HTML is noindex and never advertises the production docs origin', () => {
  assert.equal(typeof staticDocuments.patchRecoveredPreviewStaticSeoHtml, 'function');
  const source = '<html><head><meta name="robots" content="index,follow"><link rel="canonical" href="https://docs.earthcoop.ir/guides/start/"><meta property="og:url" content="https://docs.earthcoop.ir/guides/start/"><meta property="og:image" content="https://docs.earthcoop.ir/assets/brand/earthcoop-logo.png"><script type="application/ld+json">{"url":"https://docs.earthcoop.ir/"}</script></head><body></body></html>';
  const output = staticDocuments.patchRecoveredPreviewStaticSeoHtml(source, 'https://docs-preview.earthcoop.ir');
  assert.match(output, /meta name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(output, /https:\/\/docs\.earthcoop\.ir/);
  assert.match(output, /https:\/\/docs-preview\.earthcoop\.ir\/guides\/start\//);
});
