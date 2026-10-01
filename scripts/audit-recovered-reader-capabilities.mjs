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

async function inspectDirectPages(outDir, files, expectedDocumentVersions) {
  const issues = [];
  for (const documentId of Object.keys(expectedDocumentVersions ?? {})) {
    const relative = `documents/${documentId.toLowerCase()}/index.html`;
    if (!files.includes(relative)) {
      issues.push({ documentId, missing: ['page'] });
      continue;
    }
    const html = await readFile(path.join(outDir, relative), 'utf8');
    const missing = [];
    if (!/(?:data-document-copy|کپی\s+نشانی)/i.test(html)) missing.push('copy');
    if (!/(?:data-document-print|چاپ\s+سند)/i.test(html)) missing.push('print');
    if (!/(?:data-document-download|دانلود\s+(?:PDF|پی\s*دی\s*اف)|href=["'][^"']+\.pdf)/i.test(html)) missing.push('download');
    if (!/(?:data-document-history|تاریخچه\s+نسخه)/i.test(html)) missing.push('history');
    if (!/(?:initializeDocumentReaderControls\s*\(|document-reader-controls\.js)/i.test(html)) missing.push('initialization');
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

  const directPageIssues = await inspectDirectPages(outDir, files, expectedDocumentVersions);
  const issues = [];
  if (pdfFiles.length === 0) issues.push('No PDF download files found in the final recovered artifact.');
  for (const [capability, present] of Object.entries(controlEvidence)) {
    if (!present) issues.push(`Missing recovered reader capability evidence: ${capability}.`);
  }
  for (const mismatch of pdfVersionMismatches) {
    issues.push(`Foundational PDF version mismatch for ${mismatch.documentId}: expected ${mismatch.expectedVersion}, found ${mismatch.pdfVersion}.`);
  }
  for (const issue of directPageIssues) {
    issues.push(`Direct document page ${issue.documentId} is missing reader wiring: ${issue.missing.join(', ')}.`);
  }

  return {
    pdfFiles,
    controlEvidence,
    downloadEvidence: controlEvidence.download,
    pdfVersionMismatches,
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
