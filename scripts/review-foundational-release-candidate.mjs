import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildProposedFoundational } from './build-proposed-foundational.mjs';
import { buildProposedEconomyReference } from './build-proposed-economy-reference.mjs';
import { buildFoundationalConcordance } from './build-foundational-concordance.mjs';
import { parseArticles } from './consolidate-amendment.mjs';

const expectedVersions = new Map([
  ['FC', '1.2'], ['CH', '1.1'], ['CO', '1.1'], ['EX', '1.2'],
  ['ECON', '0.3'], ['DG', '0.3'], ['JUD', '0.3'], ['LOC', '0.3'],
  ['ETH', '0.3'], ['STD', '0.3'], ['ECON-REF-01', '0.2'],
]);

const draftMarker = 'ثبت‌نشده — غیرنافذ';

function hasAll(text, fragments) {
  return fragments.every((fragment) => text.includes(fragment));
}

function hierarchyFindings(documents) {
  const findings = [];
  const topical = new Set(['ECON', 'DG', 'JUD', 'LOC']);

  for (const item of documents) {
    if (!topical.has(item.id)) continue;

    const checks = [
      {
        code: 'STALE_HIERARCHY_METADATA',
        pattern: /\*\*نسبت با اساسنامه اجرایی:\*\*[^\n]*(?:مکمل|تابع)[^\n]*(?:EX|اساسنامه اجرایی)/,
        message: 'فراداده قدیمی هنوز قانون موضوعی را تابع/مکمل EX معرفی می‌کند',
      },
      {
        code: 'STALE_HIERARCHY_LANGUAGE',
        pattern: new RegExp(`(?:${item.id}|این قانون|قانون [^\\n.]+)[^\\n.]{0,100}(?:تابع|مکمل)[^\\n.]{0,100}(?:EX|اساسنامه اجرایی)`),
        message: 'متن هنجاری هنوز خود قانون موضوعی را تابع/مکمل EX معرفی می‌کند',
      },
      {
        code: 'STALE_HIERARCHY_LANGUAGE',
        pattern: /(?:اصلاح|این قانون|قانون [^\n.]+)[^\n.]{0,140}قوانین موضوعی بالادست/,
        message: 'متن هنجاری هنوز از قوانین موضوعی هم‌رتبه به‌عنوان قوانین بالادست یاد می‌کند',
      },
    ];

    for (const check of checks) {
      const match = item.markdown.match(check.pattern);
      if (!match) continue;
      findings.push({
        severity: 'blocker',
        documentId: item.id,
        code: check.code,
        message: `${check.message}: ${match[0]}`,
      });
    }
  }

  return findings;
}

function versionFindings(documents) {
  const findings = [];
  for (const item of documents) {
    const expected = expectedVersions.get(item.id);
    if (expected !== item.version) {
      findings.push({
        severity: 'blocker', documentId: item.id, code: 'UNEXPECTED_TARGET_VERSION',
        message: `نسخه هدف ${item.version} است؛ انتظار ${expected}.`,
      });
    }
  }
  return findings;
}

function draftStatusFindings(documents) {
  return documents.flatMap((item) => {
    if (item.markdown.includes(draftMarker) || item.id === 'ECON-REF-01') return [];
    return [{
      severity: 'blocker', documentId: item.id, code: 'DRAFT_STATUS_MISSING',
      message: 'متن تلفیقی به‌صراحت ثبت‌نشده و غیرنافذ علامت نخورده است.',
    }];
  });
}

export async function reviewFoundationalReleaseCandidate(repositoryRoot) {
  const [foundational, economyReference, concordance] = await Promise.all([
    buildProposedFoundational(repositoryRoot),
    buildProposedEconomyReference(repositoryRoot),
    buildFoundationalConcordance(repositoryRoot),
  ]);

  const documents = foundational.map((item) => {
    const articles = parseArticles(item.markdown, item.id);
    return {
      id: item.id,
      version: item.version,
      baseVersion: item.baseVersion,
      registered: false,
      effective: false,
      articleCount: articles.length,
      lastProvisionId: articles.at(-1)?.id ?? null,
      markdown: item.markdown,
    };
  });

  documents.push({
    id: economyReference.id,
    version: economyReference.version,
    baseVersion: economyReference.baseVersion,
    registered: false,
    effective: false,
    articleCount: economyReference.provenance.length,
    lastProvisionId: economyReference.provenance.at(-1)?.section ?? null,
    markdown: economyReference.markdown,
  });

  const fc = documents.find((item) => item.id === 'FC')?.markdown ?? '';
  const eth = documents.find((item) => item.id === 'ETH')?.markdown ?? '';
  const std = documents.find((item) => item.id === 'STD')?.markdown ?? '';
  const ref = economyReference.markdown;

  const invariants = {
    singleSourceOfLegalTruth: hasAll(fc, ['منبع اصلی', 'قلمرو تخصصی']),
    peerTopicalLaws: hasAll(fc, ['ECON، DG، JUD و LOC', 'هم‌رتبه']),
    nonAuthoritativeEthicsAndReference:
      hasAll(fc, ['ETH قانون موضوعی نیست', 'REF به‌خودی‌خود'])
      && /به‌تنهایی.*(?:مجازات|سلب حق|محرومیت)/s.test(eth)
      && hasAll(ref, ['یک پله در سلسله‌مراتب الزام نیست', 'اثر حقوقی مستقل']),
    executionCannotCreateLaw:
      hasAll(fc, ['EX در هر قلمرو تابع قانون موضوعی صلاحیت‌دار', 'نمی‌تواند حق، تکلیف یا صلاحیت ماهوی'])
      && hasAll(std, ['به‌خودی‌خود منبع اختیار حقوقی نیست', 'STD نمی‌تواند مستقلاً']),
  };

  const invariantBlockers = Object.entries(invariants)
    .filter(([, ok]) => !ok)
    .map(([name]) => ({
      severity: 'blocker', documentId: 'PACKAGE', code: 'ARCHITECTURE_INVARIANT_MISSING',
      message: `ناوردایی معماری در متن پیشنهادی قابل اثبات نیست: ${name}`,
    }));

  const blockers = [
    ...versionFindings(documents),
    ...draftStatusFindings(documents),
    ...hierarchyFindings(documents),
    ...invariantBlockers,
  ];

  const compactDocuments = documents.map(({ markdown, ...item }) => item);

  return {
    schemaVersion: 1,
    status: 'pre_registration_review',
    readyForRegistration: blockers.length === 0,
    requiresExplicitFounderDecision: true,
    documents: compactDocuments,
    concordanceRows: concordance.rows.length,
    invariants,
    blockers,
    reviewNotes: [
      'این بازبینی وضعیت حقوقی هیچ سندی را تغییر نمی‌دهد.',
      'وجود فایل، Manifest entry یا خروجی build به‌تنهایی ثبت، نفاذ یا public baseline ایجاد نمی‌کند.',
      'عبارت تاریخی یا نفی صریح سلسله‌مراتب قدیمی blocker محسوب نمی‌شود؛ فقط گزاره هنجاری جاری یا فراداده رسمی ناسازگار blocker است.',
    ],
    unchangedAuthorityFiles: ['document-registry.json', 'docs-manifest.json'],
    registrationProposal: {
      applyNow: false,
      requiresExplicitFounderDecision: true,
      steps: [
        'تصمیم صریح بنیان‌گذار درباره ثبت بسته حقوقی و تعیین وضعیت نفاذ هر سند.',
        'ساخت registered release snapshot جدید شامل متن‌های کامل، provenance، concordance و صورت‌ثبت.',
        'ثبت نسخه‌ها و وضعیت‌ها در registry همان registered release و سپس به‌روزرسانی traceability ریشه طبق REGISTRY_MODEL.md.',
        'به‌روزرسانی docs-manifest فقط برای ingestion/renditionهای واقعاً بازبینی‌شده؛ بدون ایجاد اثر حقوقی مستقل.',
        'تصمیم مستقل درباره public baseline؛ ثبت بسته نباید public baseline را خودکار جلو ببرد.',
      ],
    },
  };
}

function markdownReport(review) {
  const lines = [
    '# بازبینی نهایی Release Candidate اسناد بنیادین EarthCoop — Package F',
    '',
    '**وضعیت:** بازبینی پیش از ثبت — بدون اثر حقوقی مستقل',
    '',
    `**آمادگی برای ثبت:** ${review.readyForRegistration ? 'آماده از نظر کنترل‌های این بازبینی' : 'آماده نیست'}`,
    '',
    `**تعداد اسناد بررسی‌شده:** ${review.documents.length}`,
    '',
    `**تعداد ردیف‌های Concordance:** ${review.concordanceRows}`,
    '',
    `**Blocker:** ${review.blockers.length}`,
    '',
    '## نتیجه ناوردایی‌های معماری',
    '',
    ...Object.entries(review.invariants).map(([key, value]) => `- ${key}: ${value ? 'PASS' : 'FAIL'}`),
    '',
    '## اسناد و نسخه‌های هدف',
    '',
    '| سند | مبنا | هدف | مواد/بخش‌ها | آخرین شناسه |',
    '| --- | --- | --- | ---: | --- |',
    ...review.documents.map((item) => `| ${item.id} | ${item.baseVersion} | ${item.version} | ${item.articleCount} | ${item.lastProvisionId ?? '—'} |`),
    '',
    '## Blockerها',
    '',
    ...(review.blockers.length ? review.blockers.map((item) => `- **${item.documentId}/${item.code}:** ${item.message}`) : ['- هیچ blocker خودکارِ معماری/بسته‌بندی یافت نشد.']),
    '',
    '## مرز اختیار',
    '',
    '- این گزارش هیچ سندی را ثبت، نافذ یا public-current نمی‌کند.',
    '- `document-registry.json` و `docs-manifest.json` در Package F نباید تغییر کنند.',
    '- هر مرحله ثبت نیازمند تصمیم صریح بنیان‌گذار است.',
    '',
  ];
  return lines.join('\n');
}

async function main() {
  const repositoryRoot = path.resolve(process.argv[2] ?? '.');
  const destination = path.join(repositoryRoot, 'working/foundational/review');
  const review = await reviewFoundationalReleaseCandidate(repositoryRoot);
  await mkdir(destination, { recursive: true });
  await Promise.all([
    writeFile(path.join(destination, 'release-candidate-review.json'), `${JSON.stringify(review, null, 2)}\n`),
    writeFile(path.join(destination, 'release-candidate-review.fa.md'), `${markdownReport(review)}\n`),
  ]);
  process.stdout.write(`Reviewed ${review.documents.length} documents; blockers=${review.blockers.length}.\n`);
  if (review.blockers.length > 0) process.exitCode = 2;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
