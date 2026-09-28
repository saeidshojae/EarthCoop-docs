import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const allowedLanguages = new Set(['fa', 'en', 'ar']);
const allowedClasses = new Set(['guide', 'foundational_document', 'policy', 'reference', 'technical']);
const allowedLegalStatuses = new Set([
  'concept', 'unofficial_explanation', 'under_audit', 'official_draft',
  'public_consultation', 'registered_not_effective', 'approved_not_effective', 'effective',
  'superseded', 'withdrawn',
]);
const allowedProductStatuses = new Set(['available', 'in_development', 'planned']);
const allowedTranslationStatuses = new Set(['current', 'needs_review', 'outdated', 'not_translated']);

function safeRelativePath(value) {
  return typeof value === 'string'
    && value.length > 0
    && !path.isAbsolute(value)
    && !value.split(/[\\/]/).includes('..');
}

async function validateRendition(repositoryPath, rendition, language, at, errors) {
  const renditionAt = `${at}.renditions.${language}`;
  if (!rendition || typeof rendition !== 'object') {
    errors.push(`${renditionAt} is required.`);
    return;
  }

  if (!allowedTranslationStatuses.has(rendition.status)) {
    errors.push(`${renditionAt}.status is not allowed.`);
    return;
  }

  if (rendition.status === 'not_translated') {
    if (rendition.source !== null || rendition.sourceVersion !== null) {
      errors.push(`${renditionAt} with not_translated status must use null source and sourceVersion.`);
    }
    return;
  }

  if (!safeRelativePath(rendition.source)) {
    errors.push(`${renditionAt} with ${rendition.status} status must use a safe relative source path.`);
  } else {
    try {
      await access(path.join(repositoryPath, rendition.source));
    } catch {
      errors.push(`${renditionAt}.source does not exist: ${rendition.source}.`);
    }
  }

  if (typeof rendition.sourceVersion !== 'string' || rendition.sourceVersion.trim() === '') {
    errors.push(`${renditionAt} with ${rendition.status} status requires sourceVersion.`);
  }
}

export async function validateDocsManifest(repositoryPath, manifest) {
  const errors = [];
  if (manifest?.schemaVersion !== 2) errors.push('schemaVersion must be 2.');
  if (!allowedLanguages.has(manifest?.canonicalDefaultLanguage)) {
    errors.push('canonicalDefaultLanguage must be one of fa, en, ar.');
  }
  if (!Array.isArray(manifest?.entries) || manifest.entries.length === 0) {
    errors.push('entries must be a non-empty array.');
  }

  const documentIds = new Set();
  const slugs = new Set();

  for (const [index, item] of (manifest?.entries ?? []).entries()) {
    const at = `entries[${index}]`;

    if (!item?.documentId) errors.push(`${at}.documentId is required.`);
    else if (documentIds.has(item.documentId)) errors.push(`${at} has duplicate documentId ${item.documentId}.`);
    else documentIds.add(item.documentId);

    if (!item?.slug) errors.push(`${at}.slug is required.`);
    else if (slugs.has(item.slug)) errors.push(`${at} has duplicate slug ${item.slug}.`);
    else slugs.add(item.slug);

    if (!allowedClasses.has(item?.contentClass)) errors.push(`${at}.contentClass is not allowed.`);
    if (!allowedLanguages.has(item?.canonicalLanguage)) errors.push(`${at}.canonicalLanguage is not allowed.`);
    if (!allowedLegalStatuses.has(item?.legalStatus)) errors.push(`${at}.legalStatus is not allowed.`);
    if (item?.productStatus !== null && item?.productStatus !== undefined && !allowedProductStatuses.has(item.productStatus)) {
      errors.push(`${at}.productStatus is not allowed.`);
    }

    for (const key of ['authority', 'version', 'reviewedAt']) {
      if (typeof item?.[key] !== 'string' || item[key].trim() === '') errors.push(`${at}.${key} is required.`);
    }

    if (!item?.renditions || typeof item.renditions !== 'object') {
      errors.push(`${at}.renditions is required.`);
    } else {
      for (const language of allowedLanguages) {
        await validateRendition(repositoryPath, item.renditions[language], language, at, errors);
      }
    }

    const provisionIds = new Set();
    const provisionAnchors = new Set();
    for (const [provisionIndex, provision] of (item?.provisions ?? []).entries()) {
      const provisionAt = `${at}.provisions[${provisionIndex}]`;
      if (!provision?.id) errors.push(`${provisionAt}.id is required.`);
      else if (provisionIds.has(provision.id)) errors.push(`${provisionAt} has duplicate provision id ${provision.id}.`);
      else provisionIds.add(provision.id);
      if (!provision?.anchor) errors.push(`${provisionAt}.anchor is required.`);
      else if (provisionAnchors.has(provision.anchor)) errors.push(`${provisionAt} has duplicate provision anchor ${provision.anchor}.`);
      else provisionAnchors.add(provision.anchor);
    }
  }

  return { valid: errors.length === 0, errors };
}

async function main() {
  const repositoryPath = path.resolve(process.argv[2] ?? '.');
  const manifest = JSON.parse(await readFile(path.join(repositoryPath, 'docs-manifest.json'), 'utf8'));
  const result = await validateDocsManifest(repositoryPath, manifest);
  if (!result.valid) throw new Error(result.errors.join('\n'));
  process.stdout.write(`Validated ${manifest.entries.length} multilingual knowledge document(s).\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
