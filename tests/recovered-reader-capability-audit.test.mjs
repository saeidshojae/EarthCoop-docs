import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { auditRecoveredReaderCapabilities } from '../scripts/audit-recovered-reader-capabilities.mjs';

async function makeArtifact({ includePdf = true, includeDownload = true, pdfVersion = '1.0', directControls = true } = {}) {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-reader-audit-'));
  await mkdir(path.join(outDir, 'src/ui'), { recursive: true });
  await mkdir(path.join(outDir, 'documents/fc'), { recursive: true });
  await mkdir(path.join(outDir, 'downloads/documents'), { recursive: true });

  const controls = [
    'function initializeDocumentReaderControls(){',
    "navigator.clipboard.writeText('x')",
    'window.print()',
    "history.pushState(null, '', '#/documents/fc/provisions/fc-001')",
    "document.querySelectorAll('#documentToc a')",
    includeDownload ? `const downloadLink = '/downloads/documents/EarthCoop-FC-${pdfVersion}-fa.pdf';` : '',
    '}',
  ].join('\n');

  await writeFile(path.join(outDir, 'src/ui/document-reader-controls.js'), controls);
  await writeFile(
    path.join(outDir, 'documents/fc/index.html'),
    directControls
      ? '<button data-document-copy>کپی نشانی سند</button><button data-document-print>چاپ سند</button><a data-document-download href="/downloads/documents/EarthCoop-FC-1.0-fa.pdf">دانلود PDF</a><button data-document-history>تاریخچه نسخه‌ها</button><script>initializeDocumentReaderControls()</script>'
      : '<button>کپی نشانی سند</button><button>چاپ سند</button><button>تاریخچه نسخه‌ها</button>',
  );
  if (includePdf) await writeFile(path.join(outDir, `downloads/documents/EarthCoop-FC-${pdfVersion}-fa.pdf`), '%PDF-fixture');
  return outDir;
}

test('inventories PDF files and required reader-control evidence from a final artifact', async () => {
  const outDir = await makeArtifact();
  const result = await auditRecoveredReaderCapabilities({
    outDir,
    expectedDocumentVersions: { FC: '1.0' },
  });

  assert.deepEqual(result.pdfFiles, ['downloads/documents/EarthCoop-FC-1.0-fa.pdf']);
  assert.equal(result.controlEvidence.copy, true);
  assert.equal(result.controlEvidence.print, true);
  assert.equal(result.controlEvidence.download, true);
  assert.equal(result.controlEvidence.historyOrPermalink, true);
  assert.equal(result.controlEvidence.provisionNavigation, true);
  assert.deepEqual(result.pdfVersionMismatches, []);
  assert.deepEqual(result.directPageIssues, []);
  assert.deepEqual(result.issues, []);
});

test('reports explicit issues when PDF or required reader capabilities disappear', async () => {
  const outDir = await makeArtifact({ includePdf: false, includeDownload: false });
  const result = await auditRecoveredReaderCapabilities({
    outDir,
    expectedDocumentVersions: { FC: '1.0' },
  });

  assert.equal(result.pdfFiles.length, 0);
  assert.ok(result.issues.some((issue) => /PDF/i.test(issue)));
  assert.ok(result.issues.some((issue) => /download/i.test(issue)));
});

test('flags a stale foundational PDF instead of treating any PDF as current', async () => {
  const outDir = await makeArtifact({ pdfVersion: '0.2' });
  const result = await auditRecoveredReaderCapabilities({
    outDir,
    expectedDocumentVersions: { FC: '1.0' },
  });

  assert.deepEqual(result.pdfVersionMismatches, [{ documentId: 'FC', expectedVersion: '1.0', pdfVersion: '0.2', path: 'downloads/documents/EarthCoop-FC-0.2-fa.pdf' }]);
  assert.ok(result.issues.some((issue) => /FC.*1\.0.*0\.2|0\.2.*1\.0.*FC/i.test(issue)));
});

test('flags direct document pages whose visible controls are not wired to reader initialization', async () => {
  const outDir = await makeArtifact({ directControls: false });
  const result = await auditRecoveredReaderCapabilities({
    outDir,
    expectedDocumentVersions: { FC: '1.0' },
  });

  assert.ok(result.directPageIssues.some((issue) => issue.documentId === 'FC' && issue.missing.includes('download')));
  assert.ok(result.directPageIssues.some((issue) => issue.documentId === 'FC' && issue.missing.includes('initialization')));
  assert.ok(result.issues.some((issue) => /direct.*FC|FC.*direct/i.test(issue)));
});
