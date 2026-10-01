function stripFrontmatter(text) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n');
  if (lines[0]?.trim() !== '---') return lines.join('\n');
  const end = lines.findIndex((line, index) => index > 0 && line.trim() === '---');
  return end > 0 ? lines.slice(end + 1).join('\n') : lines.join('\n');
}

function cleanInline(value) {
  return String(value ?? '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .trim();
}

function headingLevel(line) {
  const match = /^(#{1,6})\s+/.exec(line);
  return match ? match[1].length : null;
}

function normalizeRegisteredPreamble(preamble, version) {
  const input = String(preamble ?? '');
  const governedVersion = String(version ?? '').trim();
  if (!governedVersion) return input;
  const identityVersion = /(شناسه سند:\s*[^\n]+\n(?:\s*\n)?نسخه:\s*)[^\n]+/;
  if (!identityVersion.test(input)) return input;
  return input.replace(identityVersion, `$1${governedVersion}`);
}

export function parseFoundationalMarkdown(source, { documentId }) {
  if (!documentId) throw new TypeError('documentId is required');
  const normalized = stripFrontmatter(source);
  const lines = normalized.split('\n');
  const titleLine = lines.find((line) => /^#\s+/.test(line));
  if (!titleLine) throw new Error(`${documentId} source is missing H1 title`);
  const title = cleanInline(titleLine.replace(/^#\s+/, ''));

  const articlePattern = /^(#{2,6})\s+ماده\s+([A-Z]+-\d+)\s+—\s+(.+?)\s*$/;
  const articles = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = articlePattern.exec(lines[index]);
    if (!match) continue;
    articles.push({
      index,
      level: match[1].length,
      id: match[2],
      title: cleanInline(match[3]),
    });
  }
  if (!articles.length) throw new Error(`${documentId} source has no article headings`);

  const firstArticle = articles[0].index;
  const h1Index = lines.indexOf(titleLine);
  const preamble = lines.slice(h1Index + 1, firstArticle)
    .map((line) => cleanInline(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const provisions = articles.map((article, position) => {
    if (!article.id.startsWith(`${documentId}-`)) {
      throw new Error(`Article ${article.id} does not belong to ${documentId}`);
    }

    let end = lines.length;
    for (let index = article.index + 1; index < lines.length; index += 1) {
      const level = headingLevel(lines[index]);
      if (level !== null && level <= article.level) {
        end = index;
        break;
      }
    }

    const body = lines.slice(article.index + 1, end)
      .join('\n')
      .trim()
      .replace(/\n{3,}/g, '\n\n');

    return {
      id: article.id,
      stableSlug: article.id.toLowerCase(),
      kind: 'article',
      title: `ماده ${article.id} — ${article.title}`,
      body,
      order: position + 1,
      children: [],
    };
  });

  return { title, preamble, provisions };
}

export function toLegacyDocumentPackage(parsed, metadata) {
  const slug = String(metadata.slug ?? '').split('/').at(-1) || metadata.documentId.toLowerCase();
  return {
    id: `doc-${slug}-${String(metadata.version).replaceAll('.', '-')}`,
    slug,
    code: metadata.documentId,
    title: parsed.title,
    summary: `متن کامل نسخه ${metadata.version} ${parsed.title}`,
    preamble: normalizeRegisteredPreamble(parsed.preamble, metadata.version),
    canonicalLanguage: metadata.canonicalLanguage,
    status: metadata.legalStatus,
    source: metadata.source,
    authority: metadata.authority,
    reviewedAt: metadata.reviewedAt,
    currentVersion: {
      version: metadata.version,
      publishedAt: metadata.reviewedAt,
      sourcePath: metadata.source,
    },
    provisions: parsed.provisions,
  };
}
