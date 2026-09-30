import assert from 'node:assert/strict';
import test from 'node:test';

import { patchRecoveredDocumentReaderSource } from '../scripts/patch-recovered-document-reader.mjs';

const source = `function renderDocumentReader(documentRecord) {
  return \`<div class="breadcrumbs"><a href="/">خانه</a><i></i><a href="/documents/">اسناد بنیادین</a><i></i><span>\${escapeDocumentHtml(documentRecord.title)}</span></div>\`;
}`;

test('reference documents receive an explicit reference breadcrumb without changing foundational wording', () => {
  const patched = patchRecoveredDocumentReaderSource(source);
  assert.match(patched, /documentRecord\.contentClass === 'reference'/);
  assert.match(patched, /اسناد مرجع/);
  assert.match(patched, /اسناد بنیادین/);
});

test('fails closed if the recovered 0.8 reader source no longer matches the audited patch point', () => {
  assert.throws(() => patchRecoveredDocumentReaderSource('function changed() {}'), /patch point/i);
});
