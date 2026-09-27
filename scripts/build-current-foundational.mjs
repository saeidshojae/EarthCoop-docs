import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const releaseRoot = 'releases/foundational/2026-09-20';
const documentOrder = ['FC', 'CH', 'CO', 'EX', 'ECON', 'DG', 'JUD', 'LOC', 'ETH', 'STD'];
const metadata = {
  FC: { title: 'سند مادر EarthCoop', version: '1.1', base: '1.0' },
  CH: { title: 'منشور EarthCoop', version: '1.0' },
  CO: { title: 'قانون اساسی EarthCoop', version: '1.0' },
  EX: { title: 'اساسنامه اجرایی EarthCoop', version: '1.1', base: '1.0' },
  ECON: { title: 'قانون اقتصاد EarthCoop', version: '0.2' },
  DG: { title: 'قانون حکمرانی دیجیتال EarthCoop', version: '0.2', base: '0.1' },
  JUD: { title: 'قانون قضایی EarthCoop', version: '0.2', base: '0.1' },
  LOC: { title: 'قانون جوامع محلی EarthCoop', version: '0.2', base: '0.1' },
  ETH: { title: 'منشور اخلاقی EarthCoop', version: '0.2', base: '0.1' },
  STD: {
    title: 'استانداردهای فنی EarthCoop',
    version: '0.2',
    base: '0.1',
    baseDirectory: 'sources/foundational/STD-0.1',
  },
};

function stripFrontmatter(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '').trim();
}

function stripMdxShell(markdown) {
  return stripFrontmatter(markdown)
    .replace(/<\/?div[^>]*>/g, '')
    .replace(/<Note>[\s\S]*?<\/Note>/g, '')
    .trim();
}

function parseArticles(markdown, documentId) {
  const pattern = /^(#{2,6})\s+(?:ماده\s+)?([A-Z]+-\d{3})(?:\s*\/[^\n—]+)?\s+—[^\n]*$/gm;
  const matches = [...markdown.matchAll(pattern)];
  return matches.map((match, index) => {
    const next = matches[index + 1]?.index ?? markdown.length;
    const boundary = new RegExp(`^#{1,${match[1].length}}\\s+`, 'gm');
    boundary.lastIndex = match.index + match[0].length;
    const nextBoundary = boundary.exec(markdown);
    const end = Math.min(next, nextBoundary?.index ?? markdown.length);
    if (!match[2].startsWith(`${documentId}-`)) throw new Error(`Foreign article ${match[2]} in ${documentId}.`);
    return { id: match[2], level: match[1].length, start: match.index, end, text: markdown.slice(match.index, end).trimEnd() };
  });
}

function assertSequential(articles, documentId) {
  articles.forEach((article, index) => {
    const expected = `${documentId}-${String(index + 1).padStart(3, '0')}`;
    if (article.id !== expected) throw new Error(`${documentId} expected ${expected}, found ${article.id}.`);
  });
}

function extractSupplementalAmendment(amendment, documentId) {
  const articles = parseArticles(amendment, documentId);
  if (articles.length === 0) return '';
  let remainder = amendment.slice(articles[0].start);
  const relativeArticles = parseArticles(remainder, documentId);
  for (const article of [...relativeArticles].reverse()) {
    remainder = `${remainder.slice(0, article.start)}${remainder.slice(article.end)}`;
  }
  return remainder
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s*---\s*/gm, '')
    .trim();
}

function applyAmendment(base, amendment, documentId) {
  const baseArticles = parseArticles(base, documentId);
  const amendmentArticles = parseArticles(amendment, documentId);
  assertSequential(baseArticles, documentId);
  const baseIds = new Set(baseArticles.map((item) => item.id));
  for (const item of amendmentArticles) {
    if (!baseIds.has(item.id)) throw new Error(`${item.id} is missing from ${documentId} base.`);
  }
  const changes = new Map(amendmentArticles.map((item) => [item.id, item]));
  let result = base;
  for (const article of [...baseArticles].reverse()) {
    const replacement = changes.get(article.id);
    if (!replacement) continue;
    const normalized = replacement.text
      .replace(/^#{2,6}(?=\s+(?:ماده\s+)?[A-Z]+-\d{3})/, '#'.repeat(article.level))
      .replace(new RegExp(`^(#{${article.level}})\\s+(?!ماده\\s+)`), '$1 ماده ');
    result = `${result.slice(0, article.start)}${normalized}\n\n${result.slice(article.end)}`;
  }
  return {
    markdown: result.trim(),
    articleCount: baseArticles.length,
    amendedCount: amendmentArticles.length,
    supplemental: extractSupplementalAmendment(amendment, documentId),
  };
}

async function splitBase(repositoryRoot, documentId, baseDirectory = null) {
  const directory = baseDirectory
    ? path.join(repositoryRoot, baseDirectory)
    : path.join(repositoryRoot, 'fa/foundational', documentId.toLowerCase());
  const files = (await readdir(directory)).filter((name) => /\.(?:md|mdx)$/.test(name)).sort();
  const bodies = await Promise.all(files.map(async (name) => stripMdxShell(await readFile(path.join(directory, name), 'utf8'))));
  return bodies.join('\n\n---\n\n');
}

function canonicalHeader(item, completeness = 'full') {
  const description = completeness === 'full'
    ? `متن کامل نسخه ${item.version} ${item.title}`
    : `متن اصلاحیه نسخه ${item.version} ${item.title}؛ برای خواندن کامل باید همراه نسخه مبنا استفاده شود`;
  const unchanged = item.id === 'CH' || item.id === 'CO'
    ? '\n**نسبت با خط مبنای عمومی:** بدون تغییر\n'
    : '';
  return `---\ntitle: "${item.title}"\ndescription: "${description}"\n---\n\n# ${item.title}\n\n**شناسه سند:** ${item.id}\n\n**نسخه:** ${item.version}\n\n**وضعیت:** ثبت‌شده — غیرنافذ\n${unchanged}\n**مرجع ثبت:** بنیان‌گذار EarthCoop\n\n**تاریخ ثبت:** 2026-09-24\n\n**کامل‌بودن متن:** ${completeness === 'full' ? 'متن کامل' : 'متن اصلاحیه؛ نسخه مبنا نیز لازم است'}\n\n---\n\n`;
}

function removeConflictingMetadata(markdown) {
  return markdown
    .replace(/^\s*-?\s*\*\*(شناسه سند|نسخه|وضعیت|مرجع ثبت|تاریخ ثبت):\*\*[^\n]*\n?/gm, '')
    .trim();
}

async function buildFullPackage(repositoryRoot, id) {
  const item = { id, ...metadata[id] };
  let body;
  let articleCount;
  let amendedCount = 0;
  let supplemental = '';
  if (id === 'EX') {
    body = await readFile(path.join(repositoryRoot, releaseRoot, 'consolidated/EX-1.1.full.fa.md'), 'utf8');
    articleCount = parseArticles(body, id).length;
  } else if (id === 'ECON') {
    const directory = path.join(repositoryRoot, releaseRoot, 'ECON-0.2');
    const files = (await readdir(directory)).filter((name) => name.endsWith('.md')).sort();
    body = (await Promise.all(files.map((name) => readFile(path.join(directory, name), 'utf8')))).join('\n\n---\n\n');
    articleCount = parseArticles(body, id).length;
    assertSequential(parseArticles(body, id), id);
  } else {
    const base = await splitBase(repositoryRoot, id, item.baseDirectory);
    if (item.base) {
      const amendment = await readFile(path.join(repositoryRoot, releaseRoot, `${id}-${item.version}.fa.md`), 'utf8');
      const consolidated = applyAmendment(base, amendment, id);
      body = consolidated.markdown;
      articleCount = consolidated.articleCount;
      amendedCount = consolidated.amendedCount;
      supplemental = consolidated.supplemental;
    } else {
      body = base;
      articleCount = parseArticles(body, id).length;
      assertSequential(parseArticles(body, id), id);
    }
  }
  const supplementalBlock = supplemental
    ? `\n\n---\n\n# پیوست تکمیلی ثبت‌شده نسخه ${item.version}\n\n${supplemental}`
    : '';
  return {
    ...item,
    status: id === 'CH' || id === 'CO' ? 'current_unchanged' : 'registered_not_effective',
    completeness: 'full',
    articleCount,
    amendedCount,
    markdown: `${canonicalHeader(item)}${removeConflictingMetadata(body)}${supplementalBlock}\n`,
  };
}

export async function buildCurrentFoundational(repositoryRoot) {
  const packages = [];
  for (const id of documentOrder) packages.push(await buildFullPackage(repositoryRoot, id));
  return packages;
}

async function main() {
  const repositoryRoot = path.resolve(process.argv[2] ?? '.');
  const destination = path.join(repositoryRoot, 'published/foundational');
  const packages = await buildCurrentFoundational(repositoryRoot);
  await mkdir(destination, { recursive: true });
  await Promise.all(packages.map((item) => writeFile(
    path.join(destination, `${item.id}-${item.version}.fa.md`),
    item.markdown,
  )));
  process.stdout.write(`Built ${packages.length} current foundational packages in ${destination}.\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
