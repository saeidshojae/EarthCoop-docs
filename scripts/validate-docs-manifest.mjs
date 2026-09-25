import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const allowedClasses = new Set(['guide', 'foundational_document', 'policy', 'reference']);
const allowedStatuses = new Set([
  'concept', 'unofficial_explanation', 'under_audit', 'official_draft',
  'public_consultation', 'registered_not_effective', 'approved_not_effective', 'effective',
  'superseded', 'withdrawn',
]);

function safeRelativePath(value) {
  return typeof value === 'string'
    && value.length > 0
    && !path.isAbsolute(value)
    && !value.split(/[\\/]/).includes('..');
}

export async function validateDocsManifest(repositoryPath, manifest) {
  const errors = [];
  if (manifest?.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (manifest?.sourceLanguage !== 'fa') errors.push('sourceLanguage must be fa.');
  if (!Array.isArray(manifest?.entries) || manifest.entries.length === 0) errors.push('entries must be a non-empty array.');
  const ids = new Set();
  const slugs = new Set();

  for (const [index, item] of (manifest?.entries ?? []).entries()) {
    const at = `entries[${index}]`;
    if (!item?.id) errors.push(`${at}.id is required.`);
    else if (ids.has(item.id)) errors.push(`${at} has duplicate id ${item.id}.`);
    else ids.add(item.id);
    if (!item?.slug) errors.push(`${at}.slug is required.`);
    else if (slugs.has(item.slug)) errors.push(`${at} has duplicate slug ${item.slug}.`);
    else slugs.add(item.slug);
    if (!safeRelativePath(item?.source)) {
      errors.push(`${at}.source must be a safe relative path.`);
    } else {
      try {
        await access(path.join(repositoryPath, item.source));
      } catch {
        errors.push(`${at}.source does not exist: ${item.source}.`);
      }
    }
    if (!allowedClasses.has(item?.contentClass)) errors.push(`${at}.contentClass is not allowed.`);
    if (!allowedStatuses.has(item?.status)) errors.push(`${at}.status is not allowed.`);
    for (const key of ['language', 'authority', 'version', 'reviewedAt']) {
      if (typeof item?.[key] !== 'string' || item[key].trim() === '') errors.push(`${at}.${key} is required.`);
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
  process.stdout.write(`Validated ${manifest.entries.length} knowledge-center candidate(s).\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
