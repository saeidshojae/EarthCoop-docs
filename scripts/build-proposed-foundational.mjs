import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCurrentFoundational } from './build-current-foundational.mjs';
import { consolidateAmendment, parseArticles } from './consolidate-amendment.mjs';

const proposalOrder = ['FC', 'CH', 'CO', 'EX', 'ECON', 'DG', 'JUD', 'LOC', 'ETH', 'STD'];

const proposalMetadata = {
  FC: { baseVersion: '1.1', targetVersion: '1.2' },
  CH: { baseVersion: '1.0', targetVersion: '1.1' },
  CO: { baseVersion: '1.0', targetVersion: '1.1' },
  EX: { baseVersion: '1.1', targetVersion: '1.2' },
  ECON: { baseVersion: '0.2', targetVersion: '0.3' },
  DG: { baseVersion: '0.2', targetVersion: '0.3' },
  JUD: { baseVersion: '0.2', targetVersion: '0.3' },
  LOC: { baseVersion: '0.2', targetVersion: '0.3' },
  ETH: { baseVersion: '0.2', targetVersion: '0.3' },
  STD: { baseVersion: '0.2', targetVersion: '0.3' },
};

const proposedRelationships = {
  FC: 'سند مادر و بالاترین منبع اعتبار اسناد EarthCoop؛ جایگاه سایر اسناد از FC اخذ می‌شود.',
  CH: 'تابع FC و منبع بنیادین ارزشی و تفسیری؛ جایگزین قانون ساختاری یا موضوعی نیست.',
  CO: 'تابع FC و قانون ساختاری الزام‌آور؛ با توجه به CH تفسیر می‌شود.',
  EX: 'تابع FC و CO و، در هر قلمرو تخصصی، تابع قانون موضوعی صلاحیت‌دار؛ منبع اجرای عمومی و workflow است نه قانون‌گذاری ماهوی.',
  ECON: 'تابع FC و CO و با توجه به CH؛ با DG، JUD و LOC هم‌رتبه و مالک قلمرو تخصصی اقتصاد است.',
  DG: 'تابع FC و CO و با توجه به CH؛ با ECON، JUD و LOC هم‌رتبه و مالک قلمرو تخصصی داده، فناوری و حکمرانی دیجیتال است.',
  JUD: 'تابع FC و CO و با توجه به CH؛ با ECON، DG و LOC هم‌رتبه و مالک قلمرو دادرسی، ادله، جبران و اجرای قضایی است.',
  LOC: 'تابع FC و CO و با توجه به CH؛ با ECON، DG و JUD هم‌رتبه و مالک قلمرو حکمرانی و جوامع محلی است.',
  ETH: 'تابع FC و CO و چارچوب اخلاقی میان‌رشته‌ای؛ قانون موضوعی مستقل و منبع خودکار ضمانت اجرای قهری نیست.',
  STD: 'تابع منابع حقوقی و تفویض معتبر مربوط؛ استاندارد فنی به‌خودی‌خود حق، تکلیف ماهوی یا صلاحیت حقوقی ایجاد نمی‌کند.',
};

const draftStatus = 'پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ';
const draftLegalEffect = 'این متن صرفاً پیش‌نویس تلفیقی برای بازبینی است و تا تصمیم رسمی جداگانه ثبت یا لازم‌الاجرا نیست.';

function stripLegacyRelationshipMetadata(markdown) {
  return markdown
    .replace(/^\s*-?\s*\*\*نسبت با [^:]+:\*\*[^\n]*\n?/gm, '')
    .replace(/\n{3,}/g, '\n\n');
}

function normalizeRelationshipMetadata(markdown, documentId) {
  const cleaned = stripLegacyRelationshipMetadata(markdown);
  const articles = parseArticles(cleaned, documentId);
  const firstArticle = articles[0];
  if (!firstArticle) throw new Error(`Cannot normalize relationship metadata for ${documentId} without articles.`);

  let prefix = cleaned.slice(0, firstArticle.start);
  const suffix = cleaned.slice(firstArticle.start);

  prefix = prefix
    .replace(/^## روابط اسنادی\s*\n(?:[^#][\s\S]*?)(?=^#{1,2}\s|$)/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();

  const relation = proposedRelationships[documentId];
  if (!relation) throw new Error(`Missing proposed relationship metadata for ${documentId}.`);

  return `${prefix}\n\n**جایگاه و روابط اسنادی پیشنهادی:** ${relation}\n\n${suffix.trimStart()}`;
}

export async function buildProposedFoundational(repositoryRoot) {
  const currentPackages = await buildCurrentFoundational(repositoryRoot);
  const currentById = new Map(currentPackages.map((item) => [item.id, item]));
  const output = [];

  for (const id of proposalOrder) {
    const metadata = proposalMetadata[id];
    const current = currentById.get(id);
    if (!current) throw new Error(`Missing current foundational base for ${id}.`);
    if (current.version !== metadata.baseVersion) {
      throw new Error(`Unexpected ${id} base version: expected ${metadata.baseVersion}, found ${current.version}.`);
    }

    const amendmentPath = path.join(
      repositoryRoot,
      'published/foundational',
      `${id}-${metadata.targetVersion}.fa.md`,
    );
    const amendment = await readFile(amendmentPath, 'utf8');
    const result = consolidateAmendment({
      base: current.markdown,
      amendment,
      documentId: id,
      baseVersion: metadata.baseVersion,
      targetVersion: metadata.targetVersion,
      status: draftStatus,
      authority: 'بنیان‌گذار EarthCoop — بازبینی کاری',
      decisionDate: '2026-10-01',
      legalEffect: draftLegalEffect,
      authorityLabel: 'مرجع تهیه',
      decisionDateLabel: 'تاریخ تهیه',
    });
    const markdown = normalizeRelationshipMetadata(result.document, id);

    output.push({
      id,
      version: metadata.targetVersion,
      baseVersion: metadata.baseVersion,
      amendmentPath: path.relative(repositoryRoot, amendmentPath).replaceAll('\\', '/'),
      markdown,
      provenance: result.provenance,
    });
  }

  return output;
}

async function main() {
  const repositoryRoot = path.resolve(process.argv[2] ?? '.');
  const destinationRoot = path.join(repositoryRoot, 'working/foundational');
  const consolidatedRoot = path.join(destinationRoot, 'consolidated');
  const provenanceRoot = path.join(destinationRoot, 'provenance');
  const packages = await buildProposedFoundational(repositoryRoot);

  await Promise.all([
    mkdir(consolidatedRoot, { recursive: true }),
    mkdir(provenanceRoot, { recursive: true }),
  ]);

  for (const item of packages) {
    await Promise.all([
      writeFile(
        path.join(consolidatedRoot, `${item.id}-${item.version}.full.fa.md`),
        item.markdown,
      ),
      writeFile(
        path.join(provenanceRoot, `${item.id}-${item.version}.provenance.json`),
        `${JSON.stringify({
          schemaVersion: 1,
          status: 'working_draft_unregistered_ineffective',
          documentId: item.id,
          baseVersion: item.baseVersion,
          version: item.version,
          amendment: item.amendmentPath,
          generatedAt: '2026-10-01',
          provisions: item.provenance,
        }, null, 2)}\n`,
      ),
    ]);
  }

  process.stdout.write(`Built ${packages.length} proposed full foundational drafts in ${destinationRoot}.\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
