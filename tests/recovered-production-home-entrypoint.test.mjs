import assert from 'node:assert/strict';
import test from 'node:test';

import {
  patchRecoveredStaticSeoHtml,
  renderRecoveredHostingHtaccess,
} from '../scripts/recovered-deployment-artifact.mjs';

const production = {
  target: 'production',
  canonicalOrigin: 'https://docs.earthcoop.ir',
};

test('production rewrites clickable root-home links to the cache-safe /home/ entrypoint', () => {
  const html = [
    '<html><head><meta name="robots" content="index,follow"></head><body>',
    '<a class="brand" href="/">Brand</a>',
    '<a href="/" data-route="home">Home</a>',
    '<a class="language-option" href="/" lang="fa">فارسی</a>',
    '<link rel="canonical" href="https://docs.earthcoop.ir/">',
    '</body></html>',
  ].join('');

  const output = patchRecoveredStaticSeoHtml(html, production);

  assert.equal((output.match(/href="\/home\/"/g) ?? []).length, 3);
  assert.match(output, /rel="canonical" href="https:\/\/docs\.earthcoop\.ir\/"/);
  assert.doesNotMatch(output, /<a[^>]+href="\/"/);
});

test('production hosting serves /home/ internally from index.html without a redirect', () => {
  const htaccess = renderRecoveredHostingHtaccess(production);
  const rule = 'RewriteRule ^home/?$ index.html [L]';

  assert.ok(htaccess.includes(rule));
  assert.ok(!htaccess.includes('RewriteRule ^home/?$ index.html [R='));
});
