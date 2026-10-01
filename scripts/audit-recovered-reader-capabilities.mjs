import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

async function listFiles(dir, prefix = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = path.posix.join(prefix, entry.name);
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(absolute, relative));
    else if (entry.isFile()) files.push(relative);
  }
  return files.sort((a, b) => a.localeCompare(b, 'en'));
}

async function readTextFiles(outDir, files) {
  const text = [];
  for (const relative of files) {
    if (!/\.(?:html?|js|mjs|css|json|md|txt)$/i.test(relative)) continue;
    try {
      text.push({ relative, content: await readFile(path.join(outDir, relative), 'utf8') });
    } catch {
      // Binary/undecodable files are intentionally ignored by this read-only evidence scan.
    }
  }
  return text;
}

function hasEvidence(textFiles, patterns) {
  return textFiles.some(({ content }) => patterns.some((pattern) => pattern.test(content)));
}

function parseFoundationalPdf(relative) {
  const name = path.posix.basename(relative);
  const match = /^EarthCoop-([A-Z]+)-(.+)-fa\.pdf$/i.exec(name);
  if (!match) return null;
  return { documentId: match[1].toUpperCase(), pdfVersion: match[2], path: relative };
}

function expectedPdfPath(documentId, version) {
  return `downloads/documents/EarthCoop-${documentId}-${version}-fa.pdf`;
}

async function inspectDirectPages(outDir, files, expectedDocumentVersions) {
  const issues = [];
  for (const [documentId, version] of Object.entries(expectedDocumentVersions ?? {})) {
    const relative = `documents/${documentId.toLowerCase()}/index.html`;
    if (!files.includes(relative)) {
      issues.push({ documentId, missing: ['page'] });
      continue;
    }
    const html = await readFile(path.join(outDir, relative), 'utf8');
    const missing = [];
    const expectedHref = `/${expectedPdfPath(documentId, version)}`;
    if (!/(?:data-document-copy|کپی\s+نشانی)/i.test(html)) missing.push('copy');
    if (!/(?:data-document-print|چاپ\s+سند)/i.test(html)) missing.push('print');
    const hasDownload = /(?:data-document-download|data-download-document|دانلود\s+(?:PDF|پی\s*دی\s*اف)|href=["'][^"']+\.pdf)/i.test(html);
    if (!hasDownload) missing.push('download');
    else if (!html.includes(expectedHref)) missing.push('current-download-link');
    if (!/(?:data-document-history|تاریخچه\s+نسخه)/i.test(html)) missing.push('history');
    if (!/(?:window\.EC_UI\.)?initializeDocumentReaderControls\s*\(/i.test(html)) missing.push('initialization');
    if (missing.length) issues.push({ documentId, missing });
  }
  return issues;
}

export async function auditRecoveredReaderCapabilities({ outDir, expectedDocumentVersions = {} }) {
  if (!outDir) throw new TypeError('outDir is required');
  const files = await listFiles(outDir);
  const pdfFiles = files.filter((relative) => /\.pdf$/i.test(relative));
  const textFiles = await readTextFiles(outDir, files);

  const controlEvidence = {
    copy: hasEvidence(textFiles, [
      /navigator\.clipboard\.writeText/,
      /data-document-copy/,
      /copy-document/,
      /کپی\s+(?:نشانی|پیوند|سند)/,
    ]),
    print: hasEvidence(textFiles, [
      /window\.print\s*\(/,
      /data-document-print/,
      /print-document/,
      /چاپ\s+سند/,
    ]),
    download: hasEvidence(textFiles, [
      /documentDownloads/,
      /data-document-download/,
      /data-download-document/,
      /download-document/,
      /\.pdf(?:['"`?#]|$)/i,
      /دانلود\s+(?:PDF|پی\s*دی\s*اف|سند)/i,
    ]),
    historyOrPermalink: hasEvidence(textFiles, [
      /history\.pushState\s*\(/,
      /data-document-history/,
      /data-document-copy-link/,
      /تاریخچه\s+نسخه/,
      /کپی\s+نشانی/,
    ]),
    provisionNavigation: hasEvidence(textFiles, [
      /#documentToc\s+a/,
      /data-provision-(?:link|copy)/,
      /\/provisions\//,
      /navigateToProvision\s*\(/,
    ]),
  };

  const parsedPdfs = pdfFiles.map(parseFoundationalPdf).filter(Boolean);
  const pdfVersionMismatches = [];
  for (const pdf of parsedPdfs) {
    const expectedVersion = expectedDocumentVersions[pdf.documentId];
    if (expectedVersion && pdf.pdfVersion !== expectedVersion) {
      pdfVersionMismatches.push({ ...pdf, expectedVersion });
    }
  }
  pdfVersionMismatches.sort((a, b) => a.documentId.localeCompare(b.documentId, 'en'));

  const pdfInventoryIssues = [];
  for (const [documentId, version] of Object.entries(expectedDocumentVersions ?? {})) {
    const expected = expectedPdfPath(documentId, version);
    if (!pdfFiles.includes(expected)) {
      pdfInventoryIssues.push({ documentId, expectedVersion: version, type: 'missing', path: expected });
    }
  }
  for (const pdf of parsedPdfs) {
    if (!Object.hasOwn(expectedDocumentVersions, pdf.documentId)) {
      pdfInventoryIssues.push({ documentId: pdf.documentId, pdfVersion: pdf.pdfVersion, type: 'unexpected', path: pdf.path });
    }
  }
  pdfInventoryIssues.sort((a, b) => `${a.documentId}:${a.type}`.localeCompare(`${b.documentId}:${b.type}`, 'en'));

  const directPageIssues = await inspectDirectPages(outDir, files, expectedDocumentVersions);
  const issues = [];
  if (pdfFiles.length === 0) issues.push('No PDF download files found in the final recovered artifact.');
  for (const [capability, present] of Object.entries(controlEvidence)) {
    if (!present) issues.push(`Missing recovered reader capability evidence: ${capability}.`);
  }
  for (const mismatch of pdfVersionMismatches) {
    issues.push(`Foundational PDF version mismatch for ${mismatch.documentId}: expected ${mismatch.expectedVersion}, found ${mismatch.pdfVersion}.`);
  }
  for (const inventoryIssue of pdfInventoryIssues) {
    if (inventoryIssue.type === 'missing') {
      issues.push(`Missing foundational PDF for ${inventoryIssue.documentId} version ${inventoryIssue.expectedVersion}.`);
    } else {
      issues.push(`Unexpected foundational PDF for ${inventoryIssue.documentId} version ${inventoryIssue.pdfVersion}.`);
    }
  }
  for (const issue of directPageIssues) {
    issues.push(`Direct document page ${issue.documentId} is missing reader wiring: ${issue.missing.join(', ')}.`);
  }

  return {
    pdfFiles,
    controlEvidence,
    downloadEvidence: controlEvidence.download,
    pdfVersionMismatches,
    pdfInventoryIssues,
    directPageIssues,
    issues,
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--out') args.outDir = argv[++index];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = path.resolve(args.outDir ?? 'dist-recovered');
  const result = await auditRecoveredReaderCapabilities({ outDir });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.issues.length) process.exitCode = 1;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath && invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
