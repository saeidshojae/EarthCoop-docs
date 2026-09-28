import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function validateTerminology(glossary) {
  const errors = [];
  if (glossary?.schemaVersion !== 1) errors.push('schemaVersion must be 1.');
  if (!Array.isArray(glossary?.terms) || glossary.terms.length === 0) {
    errors.push('terms must be a non-empty array.');
    return { valid: errors.length === 0, errors };
  }

  const keys = new Set();
  for (const [index, term] of glossary.terms.entries()) {
    const at = `terms[${index}]`;
    if (typeof term?.key !== 'string' || term.key.trim() === '') {
      errors.push(`${at}.key is required.`);
      continue;
    }
    if (keys.has(term.key)) errors.push(`${at} has duplicate key ${term.key}.`);
    else keys.add(term.key);

    for (const language of ['fa', 'en', 'ar']) {
      if (typeof term?.[language] !== 'string' || term[language].trim() === '') {
        errors.push(`${term.key}.${language} must not be blank.`);
      }
    }

    if (term.key === 'earthcoop' && typeof term.en === 'string' && /newearthcoop/i.test(term.en)) {
      errors.push('NewEarthCoop is not allowed as the English product name; use EarthCoop.');
    }
  }

  return { valid: errors.length === 0, errors };
}

async function main() {
  const repositoryPath = path.resolve(process.argv[2] ?? '.');
  const glossary = JSON.parse(await readFile(path.join(repositoryPath, 'glossary/terms.json'), 'utf8'));
  const result = validateTerminology(glossary);
  if (!result.valid) throw new Error(result.errors.join('\n'));
  process.stdout.write(`Validated ${glossary.terms.length} canonical terminology record(s).\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
