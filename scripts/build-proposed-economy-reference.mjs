import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

const digits = new Map([
  ['۰', '0'], ['۱', '1'], ['۲', '2'], ['۳', '3'], ['۴', '4'],
  ['۵', '5'], ['۶', '6'], ['۷', '7'], ['۸', '8'], ['۹', '9'],
]);

function asciiNumber(value) {
  return [...value].map((char) => digits.get(char) ?? char).join('');
}

function persianNumber(value) {
  return String(value).replace(/[0-9]/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

function parseLevelTwoSections(markdown) {
  const pattern = /^##\s+([^\n]+)$/gm;
  const matches = [...markdown.matchAll(pattern)];
  return matches.map((match, index) => {
    const start = match.index;
    const end = matches[index + 1]?.index ?? markdown.length;
    return { heading: match[1].trim(), start, end, text: markdown.slice(start, end).trimEnd() };
  });
}

function parseBaseReferenceSections(markdown) {
  const result = new Map();
  for (const section of parseLevelTwoSections(markdown)) {
    const match = section.heading.match(/^([۰-۹0-9]+\.[۰-۹0-9]+)\s+—\s+(.+)$/);
    if (!match) continue;
    result.set(asciiNumber(match[1]), { ...section, number: asciiNumber(match[1]), title: match[2] });
  }
  return result;
}

function parseAmendmentSections(markdown) {
  const result = [];
  for (const section of parseLevelTwoSections(markdown)) {
    const match = section.heading.match(/^(جایگزین بند|بند جدید)\s+([۰-۹0-9]+\.[۰-۹0-9]+)\s+—\s+(.+)$/);
    if (!match) continue;
    const number = asciiNumber(match[2]);
    const body = section.text.replace(/^##[^\n]*\n?/, '').trim();
    result.push({
      kind: match[1] === 'جایگزین بند' ? 'replace' : 'add',
      number,
      title: match[3],
      body,
    });
  }
  return result;
}

function canonicalSection(section) {
  return `## ${persianNumber(section.number)} — ${section.title}\n\n${section.body}`.trimEnd();
}

function updateMetadata(document) {
  let result = document
    .replace(/^version:\s*"0\.1"$/m, 'version: "0.2"')
    .replace(/^status:\s*"[^"]*"$/m, 'status: "پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ"')
    .replace(/^##\s+پیش‌نویس رسمی نسخه ۰٫۱$/m, '## پیش‌نویس تلفیقی نسخه ۰٫۲')
    .replace(/^\*\*نسخه:\*\*\s*۰٫۱\s*$/m, '**نسخه:** ۰٫۲  ')
    .replace(/^\*\*وضعیت:\*\*[^\n]*$/m, '**وضعیت:** پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ  ')
    .replace(/^\*\*ماهیت:\*\*[^\n]*$/m, '**ماهیت:** توضیحی، مرجع، معماری و راهنمای اجرا  \n**اثر حقوقی مستقل:** ندارد  ')
    .replace(/^\*\*تاریخ تدوین و بازبینی این نسخه:\*\*[^\n]*$/m, '**تاریخ تدوین و بازبینی این نسخه:** ۱ اکتبر ۲۰۲۶  ');

  if (!result.includes('**اثر حقوقی مستقل:** ندارد')) {
    throw new Error('Failed to mark ECON-REF-01 as non-authoritative.');
  }
  return result;
}

export async function buildProposedEconomyReference(repositoryRoot) {
  const basePath = path.join(repositoryRoot, 'references/economy/ECON-REF-01-0.1.fa.md');
  const amendmentPath = path.join(repositoryRoot, 'references/economy/ECON-REF-01-0.2.fa.md');
  const [base, amendment] = await Promise.all([readFile(basePath, 'utf8'), readFile(amendmentPath, 'utf8')]);

  const baseSections = parseBaseReferenceSections(base);
  const changes = parseAmendmentSections(amendment);
  const expected = ['1.1', '1.2', '1.5', '1.7', '1.8', '1.9', '1.10'];
  if (changes.map((item) => item.number).join(',') !== expected.join(',')) {
    throw new Error(`Unexpected ECON-REF-01 amendment section set: ${changes.map((item) => item.number).join(',')}`);
  }

  for (const change of changes.filter((item) => item.kind === 'replace')) {
    if (!baseSections.has(change.number)) throw new Error(`Missing base section ${change.number}.`);
  }
  for (const change of changes.filter((item) => item.kind === 'add')) {
    if (baseSections.has(change.number)) throw new Error(`New section ${change.number} already exists in base.`);
  }

  let document = base;
  for (const change of [...changes].filter((item) => item.kind === 'replace').reverse()) {
    const target = baseSections.get(change.number);
    document = `${document.slice(0, target.start)}${canonicalSection(change)}\n\n${document.slice(target.end)}`;
  }

  const reparsed = parseBaseReferenceSections(document);
  const anchor = reparsed.get('1.7');
  if (!anchor) throw new Error('Cannot locate section 1.7 insertion anchor.');
  const additions = changes.filter((item) => item.kind === 'add').map(canonicalSection).join('\n\n---\n\n');
  document = `${document.slice(0, anchor.end).trimEnd()}\n\n---\n\n${additions}\n\n---\n\n${document.slice(anchor.end).replace(/^\s*---\s*/m, '').trimStart()}`;
  document = updateMetadata(document);

  const finalSections = parseBaseReferenceSections(document);
  for (const number of expected) {
    if (!finalSections.has(number)) throw new Error(`Consolidated ECON-REF-01 is missing section ${number}.`);
  }

  const provenance = changes.map((change) => ({
    section: change.number,
    changeType: change.kind === 'add' ? 'added' : 'replaced',
    source: 'ECON-REF-01 0.2 amendment',
    sha256: sha256(finalSections.get(change.number).text),
  }));

  return {
    id: 'ECON-REF-01',
    baseVersion: '0.1',
    version: '0.2',
    markdown: `${document.trimEnd()}\n`,
    provenance,
  };
}

async function main() {
  const repositoryRoot = path.resolve(process.argv[2] ?? '.');
  const destinationRoot = path.join(repositoryRoot, 'working/foundational');
  const result = await buildProposedEconomyReference(repositoryRoot);
  await Promise.all([
    mkdir(path.join(destinationRoot, 'consolidated'), { recursive: true }),
    mkdir(path.join(destinationRoot, 'provenance'), { recursive: true }),
  ]);
  await Promise.all([
    writeFile(path.join(destinationRoot, 'consolidated/ECON-REF-01-0.2.full.fa.md'), result.markdown),
    writeFile(path.join(destinationRoot, 'provenance/ECON-REF-01-0.2.provenance.json'), `${JSON.stringify({
      schemaVersion: 1,
      status: 'working_draft_unregistered_ineffective',
      documentId: result.id,
      baseVersion: result.baseVersion,
      version: result.version,
      provisions: result.provenance,
    }, null, 2)}\n`),
  ]);
  process.stdout.write('Built ECON-REF-01 0.2 proposed full reference draft.\n');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
