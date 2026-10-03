import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

import { buildRecoveredContentCatalog } from '../scripts/build-recovered-content-catalog.mjs';
import * as legacyGenerator from '../scripts/generate-legacy-docs-center-data.mjs';
import {
  patchRecoveredDocumentsPageSource,
  patchRecoveredTocFinalLayoutSource,
} from '../scripts/patch-recovered-live-uat.mjs';

const DISPLAY_ORDER = ['FC', 'CH', 'CO', 'ECON', 'DG', 'JUD', 'LOC', 'EX', 'ETH', 'STD'];

test('official-v1 recovered catalog keeps the approved presentation order and a version-independent reference route', async () => {
  const catalog = await buildRecoveredContentCatalog(process.cwd());

  assert.deepEqual(catalog.documents.map((item) => item.documentId), DISPLAY_ORDER);
  assert.deepEqual(catalog.documents.map((item) => item.version), DISPLAY_ORDER.map(() => '1.0'));
  assert.deepEqual(catalog.documents.map((item) => item.legalStatus), DISPLAY_ORDER.map(() => 'effective'));

  const reference = catalog.references.find((item) => item.documentId === 'ECON-REF-01');
  assert.ok(reference);
  assert.equal(reference.version, '1.0');
  assert.equal(reference.routeId, 'econ-ref-01');
});

test('legacy documents metadata has a governed serializer instead of appending references to stale 0.8 metadata', () => {
  assert.equal(typeof legacyGenerator.serializeRecoveredDocumentsMetadata, 'function');

  const foundational = DISPLAY_ORDER.map((code) => ({
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
  assert.match(serialized, /destination: '#\/documents\/' \+ record\.slug/);
});

test('documents page keeps references outside the foundational filter/count collection and describes hierarchy without claiming publication order', () => {
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

  const patched = patchRecoveredDocumentsPageSource(source);
  assert.match(patched, /collection === 'foundational'/);
  assert.match(patched, /collection === 'reference'/);
  assert.match(patched, /اسناد مرجع/);
  assert.match(patched, /foundational\.map\(card\)/);
  assert.match(patched, /references\.map\(referenceCard\)/);
  assert.match(patched, /معماری حقوقی ممیزی‌شده/);
  assert.match(patched, /قوانین موضوعی هم‌رتبه‌اند/);
  assert.match(patched, /ETH سند اخلاقی فرابخشی/);
  assert.doesNotMatch(patched, /بر اساس ترتیب ثبت رسمی نمایش داده می‌شوند/);
});

test('desktop TOC resynchronizes after final page and font layout, not only initial render/resize', () => {
  const source = `function syncDocumentTocViewport() {}
function initializeDocumentReaderControls(activeProvisionSlug = null) {
  const toc = document.getElementById('documentToc');
  const tocToggle = document.querySelector('[data-document-toc-toggle]');
  const mobile = window.matchMedia('(max-width:1050px)');
  function synchronizeToc() { if (!toc || !tocToggle) return; }
  synchronizeToc();
  window.addEventListener('resize', syncDocumentTocViewport, { passive: true });
  mobile.addEventListener?.('change', synchronizeToc);
  const tocLinks = [...document.querySelectorAll('#documentToc a')];
}`;

  const patched = patchRecoveredTocFinalLayoutSource(source);
  assert.match(patched, /window\.addEventListener\('load', syncDocumentTocViewport/);
  assert.match(patched, /document\.fonts\?\.ready/);
});

test('preview static JavaScript and CSS are revalidated during UAT so a new deployment cannot reuse stale layout code', async () => {
  const buildSource = await readFile(path.join(process.cwd(), 'scripts/build-recovered-docs-center.mjs'), 'utf8');
  const assetBlock = buildSource.match(/<FilesMatch "\\\\\.\(css\|js\)\$">[\s\S]*?<\/FilesMatch>/)?.[0] ?? '';
  assert.match(assetBlock, /Cache-Control "no-cache, max-age=0, must-revalidate"/);
  assert.doesNotMatch(assetBlock, /max-age=3600/);
});

test('preview HTML is never served from a stale browser cache after a language-shell deployment', async () => {
  const buildSource = await readFile(path.join(process.cwd(), 'scripts/build-recovered-docs-center.mjs'), 'utf8');
  const htmlBlock = buildSource.match(/<FilesMatch [^\n]*html[^\n]*>[\s\S]*?<\/FilesMatch>/)?.[0] ?? '';
  assert.match(htmlBlock, /Cache-Control "no-store, max-age=0, must-revalidate"/);
});
