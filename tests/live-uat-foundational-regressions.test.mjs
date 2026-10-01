import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { buildRecoveredContentCatalog } from '../scripts/build-recovered-content-catalog.mjs';
import * as legacyGenerator from '../scripts/generate-legacy-docs-center-data.mjs';
import {
  patchRecoveredAppSource,
  patchRecoveredDocumentReaderControlsSource,
} from '../scripts/patch-recovered-ui-polish.mjs';

const OFFICIAL_ORDER = ['FC', 'CH', 'CO', 'EX', 'ECON', 'DG', 'JUD', 'LOC', 'ETH', 'STD'];

test('official-v1 recovered catalog keeps the registered foundational volume order and a version-independent reference route', async () => {
  const catalog = await buildRecoveredContentCatalog(process.cwd());

  assert.deepEqual(catalog.documents.map((item) => item.documentId), OFFICIAL_ORDER);
  assert.deepEqual(catalog.documents.map((item) => item.version), OFFICIAL_ORDER.map(() => '1.0'));
  assert.deepEqual(catalog.documents.map((item) => item.legalStatus), OFFICIAL_ORDER.map(() => 'effective'));

  const reference = catalog.references.find((item) => item.documentId === 'ECON-REF-01');
  assert.ok(reference);
  assert.equal(reference.version, '1.0');
  assert.equal(reference.routeId, 'econ-ref-01');
});

test('legacy documents metadata has a governed serializer instead of appending references to stale 0.8 metadata', () => {
  assert.equal(typeof legacyGenerator.serializeRecoveredDocumentsMetadata, 'function');

  const foundational = OFFICIAL_ORDER.map((code) => ({
    code,
    title: code,
    summary: `summary-${code}`,
    status: 'effective',
    source: `source-${code}`,
    authority: 'founder',
    reviewedAt: '2026-10-01',
    slug: code.toLowerCase(),
    currentVersion: { version: '1.0' },
  }));
  const references = [{
    code: 'ECON-REF-01',
    title: 'reference',
    summary: 'reference summary',
    status: 'official_draft',
    source: 'reference-source',
    authority: 'founder',
    reviewedAt: '2026-10-01',
    slug: 'econ-ref-01',
    currentVersion: { version: '1.0' },
  }];

  const serialized = legacyGenerator.serializeRecoveredDocumentsMetadata(foundational, references);
  assert.doesNotMatch(serialized, /doc\.PUB/);
  assert.doesNotMatch(serialized, /registered_not_effective/);
  assert.match(serialized, /collection: 'foundational'/);
  assert.match(serialized, /collection: 'reference'/);
  assert.match(serialized, /filterGroup: 'effective'/);
  assert.match(serialized, /#\/documents\/econ-ref-01/);
});

test('documents page keeps references outside the foundational filter/count collection', () => {
  const source = `render: () => \`
      <section class="hero">
        <div>متن معرفی</div>
        <div class="hero-visual"><div class="orbit">EarthCoop</div></div>
      </section>\`;
function documentsPage(){
 const docs=window.EC_CONTENT.documents;
 const card=(d)=>{const status=window.EC_CONTENT.statusDetails[d.status];return \`<a class="doc-card" data-document-status="\${d.filterGroup}" href="\${d.destination}">\${status.label}</a>\`};
 return \`<h1>اسناد بنیادین</h1><div class="docs-grid">\${docs.map(card).join('')}</div>\`
}
function statusPage(){return ''}`;

  const patched = patchRecoveredAppSource(source);
  assert.match(patched, /collection === 'foundational'/);
  assert.match(patched, /collection === 'reference'/);
  assert.match(patched, /اسناد مرجع/);
  assert.match(patched, /foundational\.map\(card\)/);
  assert.match(patched, /references\.map\(referenceCard\)/);
});

test('desktop TOC resynchronizes after final page and font layout, not only initial render/resize', () => {
  const source = `function initializeDocumentReaderControls(activeProvisionSlug = null) {
  const toc = document.getElementById('documentToc');
  const tocToggle = document.querySelector('[data-document-toc-toggle]');
  const mobile = window.matchMedia('(max-width:1050px)');
  function synchronizeToc() { if (!toc || !tocToggle) return; }
  synchronizeToc();
  mobile.addEventListener?.('change', synchronizeToc);
  const tocLinks = [...document.querySelectorAll('#documentToc a')];
}`;

  const patched = patchRecoveredDocumentReaderControlsSource(source);
  assert.match(patched, /window\.addEventListener\('load', syncDocumentTocViewport/);
  assert.match(patched, /document\.fonts\?\.ready/);
});

test('preview static JavaScript and CSS are revalidated during UAT so a new deployment cannot reuse stale layout code', async () => {
  const buildSource = await readFile(path.join(process.cwd(), 'scripts/build-recovered-docs-center.mjs'), 'utf8');
  assert.match(buildSource, /Cache-Control \"no-cache, max-age=0, must-revalidate\"/);
  assert.doesNotMatch(buildSource, /<FilesMatch \"\\\\\.\(css\|js\)[^\n]*>[\s\S]*max-age=3600/);
});
