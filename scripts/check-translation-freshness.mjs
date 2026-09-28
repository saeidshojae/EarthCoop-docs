import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const languages = ['fa', 'en', 'ar'];

export function checkTranslationFreshness(manifest) {
  const errors = [];

  for (const entry of manifest?.entries ?? []) {
    const canonicalLanguage = entry.canonicalLanguage;
    const canonical = entry.renditions?.[canonicalLanguage];

    if (canonical?.status === 'current' && canonical.sourceVersion !== entry.version) {
      errors.push(`${entry.documentId}.${canonicalLanguage} current sourceVersion ${canonical.sourceVersion} does not match canonical version ${entry.version}.`);
    }

    for (const language of languages) {
      if (language === canonicalLanguage) continue;
      const rendition = entry.renditions?.[language];
      if (rendition?.status === 'current' && rendition.sourceVersion !== entry.version) {
        errors.push(`${entry.documentId}.${language} current sourceVersion ${rendition.sourceVersion} does not match canonical version ${entry.version}.`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

async function main() {
  const repositoryPath = path.resolve(process.argv[2] ?? '.');
  const manifest = JSON.parse(await readFile(path.join(repositoryPath, 'docs-manifest.json'), 'utf8'));
  const result = checkTranslationFreshness(manifest);
  if (!result.valid) throw new Error(result.errors.join('\n'));
  process.stdout.write(`Translation freshness is valid for ${manifest.entries.length} document(s).\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
