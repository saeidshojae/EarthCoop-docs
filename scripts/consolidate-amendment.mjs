import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const articleHeading = /^(#{2,6})\s+ماده\s+([A-Z]+-\d{3})\s+—[^\n]*$/gm;

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function persianVersion(value) {
  return String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

export function parseArticles(markdown, expectedDocumentId) {
  const matches = [...markdown.matchAll(articleHeading)];
  const articles = [];
  const seen = new Set();

  for (const [index, match] of matches.entries()) {
    const id = match[2];
    const documentId = id.split('-')[0];
    if (expectedDocumentId && documentId !== expectedDocumentId) {
      throw new Error(`Foreign article ${id}; expected ${expectedDocumentId}.`);
    }
    if (seen.has(id)) throw new Error(`Duplicate article ${id}.`);
    seen.add(id);
    const start = match.index;
    const nextArticleStart = matches[index + 1]?.index ?? markdown.length;
    const boundaryPattern = new RegExp(`^#{1,${match[1].length}}\\s+`, 'gm');
    boundaryPattern.lastIndex = match.index + match[0].length;
    const nextBoundary = boundaryPattern.exec(markdown);
    const end = Math.min(nextArticleStart, nextBoundary?.index ?? markdown.length);
    articles.push({
      id,
      level: match[1].length,
      start,
      end,
      text: markdown.slice(start, end).trimEnd(),
    });
  }

  return articles;
}

function assertSequential(articles, documentId) {
  for (const [index, article] of articles.entries()) {
    const expected = `${documentId}-${String(index + 1).padStart(3, '0')}`;
    if (article.id !== expected) {
      throw new Error(`Base article IDs must be sequential; expected ${expected}, found ${article.id}.`);
    }
  }
}

function normalizeHeadingLevel(text, level) {
  return text.replace(/^#{2,6}(?=\s+ماده\s+)/, '#'.repeat(level));
}

function replaceMetadata(document, { targetVersion, status, authority, decisionDate }) {
  const versionPattern = /^\*\*نسخه:\*\*[^\n]*$/m;
  const statusPattern = /^\*\*وضعیت:\*\*[^\n]*$/m;
  if (!versionPattern.test(document)) throw new Error('Base document has no version metadata.');
  if (!statusPattern.test(document)) throw new Error('Base document has no status metadata.');

  const authorityLines = [
    `**مرجع ثبت:** ${authority}`,
    '',
    `**تاریخ ثبت:** ${decisionDate}`,
    '',
    '**اثر حقوقی:** این نسخه ثبت شده است، اما هنوز لازم‌الاجرا نیست.',
  ].join('\n');

  return document
    .replace(versionPattern, `**نسخه:** ${persianVersion(targetVersion)}`)
    .replace(statusPattern, `**وضعیت:** ${status}\n\n${authorityLines}`)
    .replace(
      /\*\*پایان اساسنامه اجرایی EarthCoop — نسخه [۰-۹.]+\*\*/,
      `**پایان اساسنامه اجرایی EarthCoop — نسخه ${persianVersion(targetVersion)}**`,
    );
}

function amendmentContext(amendment, articles) {
  if (articles.length === 0) return { relation: '', changeLog: '' };
  const beforeArticles = amendment.slice(0, articles[0].start);
  const relationStart = beforeArticles.search(/^##\s+نسبت با[^\n]*$/m);
  const relation = relationStart >= 0 ? beforeArticles.slice(relationStart).trim() : '';
  const afterArticles = amendment.slice(articles.at(-1).end).trim();
  const changeLogStart = afterArticles.search(/^##\s+Change Log[^\n]*$/m);
  const changeLog = changeLogStart >= 0 ? afterArticles.slice(changeLogStart).trim() : '';
  return { relation, changeLog };
}

export function consolidateAmendment({
  base,
  amendment,
  documentId,
  baseVersion,
  targetVersion,
  status,
  authority,
  decisionDate,
}) {
  const baseArticles = parseArticles(base, documentId);
  const amendmentArticles = parseArticles(amendment, documentId);
  if (baseArticles.length === 0) throw new Error('Base document contains no articles.');
  if (amendmentArticles.length === 0) throw new Error('Amendment contains no articles.');
  assertSequential(baseArticles, documentId);

  const baseById = new Map(baseArticles.map((article) => [article.id, article]));
  const amendmentById = new Map(amendmentArticles.map((article) => [article.id, article]));
  for (const article of amendmentArticles) {
    if (!baseById.has(article.id)) {
      throw new Error(`Amended article ${article.id} is not present in base ${documentId} ${baseVersion}.`);
    }
  }

  let document = base;
  for (const article of [...baseArticles].reverse()) {
    const replacement = amendmentById.get(article.id);
    if (!replacement) continue;
    const text = `${normalizeHeadingLevel(replacement.text, article.level)}\n\n`;
    document = `${document.slice(0, article.start)}${text}${document.slice(article.end)}`;
  }

  document = replaceMetadata(document, { targetVersion, status, authority, decisionDate });
  const context = amendmentContext(amendment, amendmentArticles);
  if (context.relation) {
    const insertionPoint = document.search(/^#\s+بخش\s+/m);
    const at = insertionPoint >= 0 ? insertionPoint : parseArticles(document, documentId)[0].start;
    document = `${document.slice(0, at).trimEnd()}\n\n${context.relation}\n\n${document.slice(at).trimStart()}`;
  }
  if (context.changeLog) document = `${document.trimEnd()}\n\n---\n\n${context.changeLog}\n`;
  else document = `${document.trimEnd()}\n`;

  const finalById = new Map(parseArticles(document, documentId).map((article) => [article.id, article]));
  const provenance = baseArticles.map((article) => {
    const amended = amendmentById.has(article.id);
    const finalArticle = finalById.get(article.id);
    return {
      id: article.id,
      source: amended ? `${documentId} ${targetVersion} amendment` : `${documentId} ${baseVersion}`,
      sha256: sha256(finalArticle.text),
    };
  });

  return { document, provenance };
}

async function main() {
  const [basePath, amendmentPath, outputPath, provenancePath] = process.argv.slice(2);
  if (!basePath || !amendmentPath || !outputPath || !provenancePath) {
    throw new Error('Usage: node scripts/consolidate-amendment.mjs BASE AMENDMENT OUTPUT PROVENANCE');
  }
  const [base, amendment] = await Promise.all([
    readFile(basePath, 'utf8'),
    readFile(amendmentPath, 'utf8'),
  ]);
  const result = consolidateAmendment({
    base,
    amendment,
    documentId: 'EX',
    baseVersion: '1.0',
    targetVersion: '1.1',
    status: 'ثبت‌شده — غیرنافذ',
    authority: 'بنیان‌گذار EarthCoop',
    decisionDate: '2026-09-24',
  });
  await Promise.all([
    mkdir(path.dirname(outputPath), { recursive: true }),
    mkdir(path.dirname(provenancePath), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(outputPath, result.document),
    writeFile(provenancePath, `${JSON.stringify({
      schemaVersion: 1,
      documentId: 'EX',
      version: '1.1',
      status: 'registered_not_effective',
      authority: 'EarthCoop founder',
      decisionDate: '2026-09-24',
      base: basePath,
      amendment: amendmentPath,
      provisions: result.provenance,
    }, null, 2)}\n`),
  ]);
  process.stdout.write(`Consolidated ${result.provenance.length} articles into ${outputPath}.\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
