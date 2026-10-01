import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildFoundationalDownloadMap,
  ensureStaticReaderInitialization,
  generateRecoveredFoundationalPdfs,
  serializeDocumentDownloadsSource,
} from '../scripts/recovered-foundational-downloads.mjs';

const packages = [
  { slug: 'fc', code: 'FC', title: 'سند مادر EarthCoop', currentVersion: { version: '1.0' } },
  { slug: 'ch', code: 'CH', title: 'منشور EarthCoop', currentVersion: { version: '1.0' } },
];

test('builds download metadata only from each current governed package version', () => {
  const map = buildFoundationalDownloadMap(packages);
  assert.deepEqual(Object.keys(map), ['fc@1.0', 'ch@1.0']);
  assert.deepEqual(map['fc@1.0'], {
    href: '/downloads/documents/EarthCoop-FC-1.0-fa.pdf',
    filename: 'EarthCoop-FC-1.0-fa.pdf',
  });
  assert.equal(map['fc@1.1'], undefined);
  assert.equal(map['ch@0.2'], undefined);
});

test('serializes the same current-version map for the recovered SPA reader', () => {
  const source = serializeDocumentDownloadsSource(buildFoundationalDownloadMap(packages));
  assert.match(source, /window\.EC_CONTENT\.documentDownloads/);
  assert.match(source, /"fc@1\.0"/);
  assert.match(source, /EarthCoop-FC-1\.0-fa\.pdf/);
  assert.doesNotMatch(source, /FC-1\.1|CH-0\.2/);
});

test('direct static document pages explicitly initialize reader controls after loading the control script', () => {
  const input = '<script src="/src/ui/document-reader-controls.js"></script></body>';
  const output = ensureStaticReaderInitialization(input);
  assert.match(output, /document-reader-controls\.js/);
  assert.match(output, /window\.EC_UI\.initializeDocumentReaderControls\(\)/);
  assert.ok(output.indexOf('document-reader-controls.js') < output.indexOf('window.EC_UI.initializeDocumentReaderControls()'));
});

test('generates a real current-version PDF path per foundational package through the injected browser runner', async () => {
  const runtimeDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-pdf-generation-'));
  const calls = [];
  const runBrowser = async ({ inputHtml, outputPdf }) => {
    calls.push({ inputHtml, outputPdf });
    await writeFile(outputPdf, '%PDF-1.4\nfixture current document\n');
  };

  const result = await generateRecoveredFoundationalPdfs({ runtimeDir, packages, runBrowser });

  assert.equal(calls.length, 2);
  assert.match(calls[0].inputHtml, /documents\/fc\/index\.html$/);
  assert.match(calls[0].outputPdf, /downloads\/documents\/EarthCoop-FC-1\.0-fa\.pdf$/);
  assert.match(await readFile(calls[0].outputPdf, 'utf8'), /^%PDF-/);
  assert.deepEqual(result.map, buildFoundationalDownloadMap(packages));
});

test('removes stale PDFs only for governed foundational packages before generating current versions', async () => {
  const runtimeDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-pdf-stale-'));
  const downloadDir = path.join(runtimeDir, 'downloads', 'documents');
  await mkdir(downloadDir, { recursive: true });
  await writeFile(path.join(downloadDir, 'EarthCoop-FC-1.1-fa.pdf'), '%PDF-stale');
  await writeFile(path.join(downloadDir, 'EarthCoop-CH-0.2-fa.pdf'), '%PDF-stale');
  await writeFile(path.join(downloadDir, 'EarthCoop-DG-0.2-fa.pdf'), '%PDF-other-foundational-not-in-package-set');
  await writeFile(path.join(downloadDir, 'EarthCoop-ECON-REF-01-1.0-fa.pdf'), '%PDF-reference');
  await writeFile(path.join(downloadDir, 'unrelated.pdf'), '%PDF-unrelated');

  const runBrowser = async ({ outputPdf }) => {
    await writeFile(outputPdf, '%PDF-1.4\ncurrent\n');
  };
  await generateRecoveredFoundationalPdfs({ runtimeDir, packages, runBrowser });

  const files = (await readdir(downloadDir)).sort();
  assert.deepEqual(files, [
    'EarthCoop-CH-1.0-fa.pdf',
    'EarthCoop-DG-0.2-fa.pdf',
    'EarthCoop-ECON-REF-01-1.0-fa.pdf',
    'EarthCoop-FC-1.0-fa.pdf',
    'unrelated.pdf',
  ]);
});
