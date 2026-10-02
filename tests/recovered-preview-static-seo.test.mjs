import assert from 'node:assert/strict';
import test from 'node:test';

async function loadModule() {
  try {
    return await import('../scripts/render-recovered-static-documents.mjs');
  } catch {
    return null;
  }
}

test('preview static SEO patch removes production docs origin and forces noindex', async () => {
  const module = await loadModule();
  assert.ok(module?.patchRecoveredPreviewStaticSeoHtml, 'preview static SEO patch must exist');
  const source = '<head><meta name="robots" content="index,follow"><link rel="canonical" href="https://docs.earthcoop.ir/guides/start/"><meta property="og:url" content="https://docs.earthcoop.ir/guides/start/"><meta property="og:image" content="https://docs.earthcoop.ir/assets/brand/earthcoop-logo.png"><script type="application/ld+json">{"url":"https://docs.earthcoop.ir/"}</script></head>';
  const output = module.patchRecoveredPreviewStaticSeoHtml(source, 'https://docs-preview.earthcoop.ir');
  assert.match(output, /meta name="robots" content="noindex,nofollow"/);
  assert.doesNotMatch(output, /https:\/\/docs\.earthcoop\.ir/);
  assert.match(output, /https:\/\/docs-preview\.earthcoop\.ir\/guides\/start\//);
  assert.match(output, /https:\/\/docs-preview\.earthcoop\.ir\/assets\/brand\/earthcoop-logo\.png/);
});
