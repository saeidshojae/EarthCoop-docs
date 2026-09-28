import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const excludedTopLevel = new Set([
  '.github', 'ar', 'audits', 'docs', 'fa', 'glossary', 'node_modules',
  'published', 'references', 'releases', 'schemas', 'scripts', 'test', 'tests'
]);

const legacyPatterns = [
  { id: 'legacy_product_name', regex: /\bNewEarthCoop\b/gi },
  { id: 'gol_unit', regex: /\bGOL\s+unit\b/gi }
];

const sensitivePatterns = [
  { id: 'fully_available', regex: /\bfully\s+available\b/gi },
  { id: 'scheduled_transfers', regex: /\bscheduled\s+transfers?\b/gi },
  { id: 'create_group', regex: /\bcreate\s+a\s+group\b/gi }
];

function normalizeRelative(value) {
  return value.split(path.sep).join('/');
}

function extractTitle(content, relativePath) {
  const frontmatter = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatter) {
    const title = frontmatter[1].match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1]?.trim();
    if (title) return title;
  }
  const heading = content.match(/^#\s+(.+?)\s*$/m)?.[1]?.trim();
  return heading || path.basename(relativePath, path.extname(relativePath));
}

function extractLinks(content) {
  const links = new Set();
  for (const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) links.add(match[1].trim());
  for (const match of content.matchAll(/(?:href|to)=["']([^"']+)["']/g)) links.add(match[1].trim());
  return [...links].sort((a, b) => a.localeCompare(b));
}

function findMatches(content, patterns) {
  const result = [];
  for (const { id, regex } of patterns) {
    regex.lastIndex = 0;
    for (const match of content.matchAll(regex)) {
      const before = content.slice(0, match.index);
      result.push({
        id,
        match: match[0],
        line: before.split('\n').length
      });
    }
  }
  return result.sort((a, b) => a.line - b.line || a.id.localeCompare(b.id));
}

async function collectMdx(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    const relative = normalizeRelative(path.relative(root, absolute));
    const topLevel = relative.split('/')[0];
    if (excludedTopLevel.has(topLevel)) continue;
    if (entry.isDirectory()) files.push(...await collectMdx(root, absolute));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.mdx')) files.push(relative);
  }
  return files;
}

export async function inventoryProductGuides(repositoryPath) {
  const root = path.resolve(repositoryPath);
  const files = (await collectMdx(root)).sort((a, b) => a.localeCompare(b));
  const items = [];
  for (const relative of files) {
    const content = await readFile(path.join(root, relative), 'utf8');
    items.push({
      path: relative,
      title: extractTitle(content, relative),
      links: extractLinks(content),
      legacyTerms: findMatches(content, legacyPatterns),
      sensitiveClaims: findMatches(content, sensitivePatterns)
    });
  }
  return items;
}

async function main() {
  const repositoryPath = path.resolve(process.argv[2] ?? '.');
  const outIndex = process.argv.indexOf('--out');
  if (outIndex === -1 || !process.argv[outIndex + 1]) {
    throw new Error('Usage: node scripts/inventory-product-guides.mjs <repo> --out <path>');
  }
  const outputPath = path.resolve(repositoryPath, process.argv[outIndex + 1]);
  const inventory = await inventoryProductGuides(repositoryPath);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ generatedAt: '2026-09-28', pages: inventory }, null, 2)}\n`, 'utf8');
  process.stdout.write(`Inventoried ${inventory.length} English product guide(s).\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
