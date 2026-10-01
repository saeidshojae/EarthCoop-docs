import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { auditRecoveredReaderCapabilities } from '../scripts/audit-recovered-reader-capabilities.mjs';

async function makeArtifact({ includePdf = true, includeDownload = true } = {}) {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-reader-audit-'));
  await mkdir(path.join(outDir, 'src/ui'), { recursive: true });
  await mkdir(path.join(outDir, 'documents/fc'), { recursive: true });
  await mkdir(path.join(outDir, 'downloads'), { recursive: true });

  const controls = [
    "navigator.clipboard.writeText('x')",
    'window.print()',
    "history.pushState(null, '', '#/documents/fc/provisions/fc-001')",
    "document.querySelectorAll('#documentToc a')",
    includeDownload ? "const downloadLink = '/downloads/FC-fa.pdf';" : '',
  ].join('\n');

  await writeFile(path.join(outDir, 'src/ui/document-reader-controls.js'), controls);
  await writeFile(path.join(outDir, 'documents/fc/index.html'), '<button>کپی</button><button>چاپ سند</button><button>تاریخچه نسخه‌ها</button>');
  if (includePdf) await writeFile(path.join(outDir, 'downloads/FC-fa.pdf'), '%PDF-fixture');
  return outDir;
}

test('inventories PDF files and required reader-control evidence from a final artifact', async () => {
  const outDir = await makeArtifact();
  const result = await auditRecoveredReaderCapabilities({ outDir });

  assert.deepEqual(result.pdfFiles, ['downloads/FC-fa.pdf']);
  assert.equal(result.controlEvidence.copy, true);
  assert.equal(result.controlEvidence.print, true);
  assert.equal(result.controlEvidence.download, true);
  assert.equal(result.controlEvidence.historyOrPermalink, true);
  assert.equal(result.controlEvidence.provisionNavigation, true);
  assert.deepEqual(result.issues, []);
});

test('reports explicit issues when PDF or required reader capabilities disappear', async () => {
  const outDir = await makeArtifact({ includePdf: false, includeDownload: false });
  const result = await auditRecoveredReaderCapabilities({ outDir });

  assert.equal(result.pdfFiles.length, 0);
  assert.ok(result.issues.some((issue) => /PDF/i.test(issue)));
  assert.ok(result.issues.some((issue) => /download/i.test(issue)));
});
