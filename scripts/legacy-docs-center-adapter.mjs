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

export function parseFoundationalMarkdown(source, { documentId }) {
  if (!documentId) throw new TypeError('documentId is required');
  const normalized = stripFrontmatter(source);
  const lines = normalized.split('\n');
  const titleLine = lines.find((line) => /^#\s+/.test(line));
  if (!titleLine) throw new Error(`${documentId} source is missing H1 title`);
  const title = cleanInline(titleLine.replace(/^#\s+/, ''));

  const articlePattern = /^###\s+ماده\s+([A-Z]+-\d+)\s+—\s+(.+?)\s*$/;
  const articleIndexes = [];
  for (let index = 0; index < lines.length; index += 1) {
    const match = articlePattern.exec(lines[index]);
    if (match) articleIndexes.push({ index, match });
  }
  if (!articleIndexes.length) throw new Error(`${documentId} source has no article headings`);

  const firstArticle = articleIndexes[0].index;
  const h1Index = lines.indexOf(titleLine);
  const preamble = lines.slice(h1Index + 1, firstArticle)
    .map((line) => cleanInline(line))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const provisions = articleIndexes.map(({ index, match }, position) => {
    const id = match[1];
    if (!id.startsWith(`${documentId}-`)) {
      throw new Error(`Article ${id} does not belong to ${documentId}`);
    }
    const next = articleIndexes[position + 1]?.index ?? lines.length;
    const body = lines.slice(index + 1, next)
      .join('\n')
      .trim()
      .replace(/\n{3,}/g, '\n\n');
    return {
      id,
      stableSlug: id.toLowerCase(),
      kind: 'article',
      title: `ماده ${id} — ${cleanInline(match[2])}`,
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
    preamble: parsed.preamble,
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
