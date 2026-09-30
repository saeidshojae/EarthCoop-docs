import assert from 'node:assert/strict';
import test from 'node:test';

import { validateRecoveredUatContract } from '../scripts/recovered-uat-policy.mjs';

const valid = {
  manifest: { displayLocales:['fa'], previewIndexing:'disabled' },
  localeCatalog: { globalLocales:['fa'] },
  searchRows: [{ documentId:'ECON-REF-01', body:'اقتصاد و حق', route:'#/documents/econ-ref-01-fa-0-1?anchor=section-1' }],
  seoRoutes: [{ documentId:'ECON-REF-01', canonical:'https://docs-preview.earthcoop.ir/documents/econ-ref-01-fa-0-1/', indexable:false }],
  robotsTxt: 'User-agent: *\nDisallow: /\n',
  runtimeFiles: new Set([
    '404/index.html',
    'documents/fc/index.html',
    'documents/econ-ref-01-fa-0-1/index.html',
    'src/ui/mobile-navigation.js',
    'src/ui/document-reader-controls.js',
    'src/ui/search-dialog.js',
    'src/pages/document-reader.js',
  ]),
};

test('accepts the full recovered preview UAT contract', () => {
  assert.equal(validateRecoveredUatContract(valid), true);
});

test('fails closed when reference discovery, preview noindex, mobile/reader controls or locale truth regress', () => {
  for (const mutate of [
    (x) => { x.searchRows = []; },
    (x) => { x.seoRoutes = []; },
    (x) => { x.robotsTxt = 'User-agent: *\nAllow: /\n'; },
    (x) => { x.localeCatalog.globalLocales = ['fa','ar']; },
    (x) => { x.runtimeFiles.delete('src/ui/mobile-navigation.js'); },
    (x) => { x.runtimeFiles.delete('src/ui/document-reader-controls.js'); },
    (x) => { x.runtimeFiles.delete('404/index.html'); },
    (x) => { x.runtimeFiles.delete('documents/econ-ref-01-fa-0-1/index.html'); },
  ]) {
    const input = structuredClone(valid);
    input.runtimeFiles = new Set(valid.runtimeFiles);
    mutate(input);
    assert.throws(() => validateRecoveredUatContract(input));
  }
});
