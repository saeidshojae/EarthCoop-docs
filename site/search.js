function normalize(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .toLocaleLowerCase();
}

export function searchDocuments(index, query, locale) {
  const needle = normalize(query).trim();
  if (!needle) return [];
  return index.filter((item) => {
    if (item.locale !== locale) return false;
    const haystack = normalize([
      item.title,
      item.id,
      item.body,
      ...(item.headings ?? []).map((heading) => heading.text),
    ].join(' '));
    return haystack.includes(needle);
  });
}
