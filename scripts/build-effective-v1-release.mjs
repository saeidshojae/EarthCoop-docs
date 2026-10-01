import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildProposedFoundational } from './build-proposed-foundational.mjs';
import { buildProposedEconomyReference } from './build-proposed-economy-reference.mjs';
import { parseArticles } from './consolidate-amendment.mjs';

const releaseDate = '2026-10-01';
const officialVersion = '1.0';
const releaseRelativeRoot = `releases/foundational/${releaseDate}`;
const ids = ['FC', 'CH', 'CO', 'EX', 'ECON', 'DG', 'JUD', 'LOC', 'ETH', 'STD'];
const titles = {
  FC: 'سند مادر EarthCoop', CH: 'منشور EarthCoop', CO: 'قانون اساسی EarthCoop',
  EX: 'اساسنامه اجرایی EarthCoop', ECON: 'قانون اقتصاد EarthCoop',
  DG: 'قانون حکمرانی دیجیتال EarthCoop', JUD: 'قانون قضایی EarthCoop',
  LOC: 'قانون جوامع محلی EarthCoop', ETH: 'منشور اخلاقی EarthCoop', STD: 'استانداردهای فنی EarthCoop',
};

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function replaceSelfVersionLanguage(markdown, id, proposalVersion) {
  const escaped = proposalVersion.replaceAll('.', '\\.');
  let result = markdown
    .replaceAll('پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ', 'ثبت‌شده — نافذ')
    .replaceAll('پیش‌نویس کاری — ثبت‌نشده — غیرنافذ', 'ثبت‌شده — نافذ')
    .replaceAll('بنیان‌گذار EarthCoop — بازبینی کاری', 'بنیان‌گذار EarthCoop — ثبت و نفاذ')
    .replaceAll('این متن صرفاً پیش‌نویس تلفیقی برای بازبینی است و تا تصمیم رسمی جداگانه ثبت یا لازم‌الاجرا نیست.', 'این متن با تصمیم صریح بنیان‌گذار EarthCoop در 2026-10-01 ثبت و از همان تاریخ نافذ است.')
    .replace(new RegExp(`^(\\*\\*نسخه(?: پیشنهادی)?:\\*\\*)\\s*${escaped}\\s*$`, 'gm'), `$1 ${officialVersion}`)
    .replace(new RegExp(`^(version:\\s*["']?)${escaped}(["']?\\s*)$`, 'gm'), `$1${officialVersion}$2`)
    .replace(new RegExp(`${id} ${escaped}`, 'g'), `${id} ${officialVersion}`)
    .replace(new RegExp(`نسخه ${escaped}`, 'g'), `نسخه ${officialVersion}`);

  const articles = parseArticles(result, id);
  for (const article of [...articles].reverse()) {
    if (!/(اعتبار نسخه پیشنهادی|اعتبار نسخه پیش‌نویس|اعتبار نسخه)/.test(article.text)) continue;
    if (!new RegExp(escaped).test(article.text) && !/پیش‌نویس|در صورت ثبت/.test(article.text)) continue;
    const heading = article.text.split('\n', 1)[0];
    const replacement = `${heading}\n\n۱. این متن، نسخه رسمی ${officialVersion} سند ${id} در نسل رسمی نخست اسناد EarthCoop است.\n\n۲. این نسخه با تصمیم صریح بنیان‌گذار EarthCoop در تاریخ ${releaseDate} ثبت شده و از همان تاریخ نافذ است.\n\n۳. شماره‌ها و نسخه‌های پیش از این تصمیم، سابقه توسعه و ممیزی «پیش از نسل رسمی 1» محسوب می‌شوند و در توالی نسخه‌های رسمی جدید، نسخه پیشین این سند به شمار نمی‌آیند؛ سوابق تاریخی حذف یا بازنویسی نمی‌شوند.`;
    result = `${result.slice(0, article.start)}${replacement}\n\n${result.slice(article.end)}`;
  }

  const banner = `> **وضعیت حقوقی این متن:** نسخه رسمی ${officialVersion} — ثبت‌شده و نافذ از ${releaseDate}. شماره‌گذاری رسمی اسناد از این نسخه آغاز می‌شود؛ سوابق پیشین صرفاً سابقه توسعه و ممیزی پیش از نسل رسمی 1 هستند.`;
  const firstArticle = parseArticles(result, id)[0];
  if (!firstArticle) throw new Error(`No articles found in ${id} while promoting v1.`);
  result = `${result.slice(0, firstArticle.start).trimEnd()}\n\n${banner}\n\n${result.slice(firstArticle.start).trimStart()}`;

  if (/ثبت‌نشده|غیرنافذ/.test(result.slice(0, firstArticle.start + banner.length + 500))) {
    throw new Error(`${id} still exposes draft/non-effective status near its official header.`);
  }
  return `${result.trimEnd()}\n`;
}

function promoteReference(markdown) {
  return `${markdown
    .replaceAll('پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ', 'مرجع توضیحی ثبت‌شده — بدون اثر حقوقی مستقل')
    .replace(/^version:\s*"0\.2"$/m, 'version: "1.0"')
    .replace(/^\*\*نسخه:\*\*[^\n]*$/m, '**نسخه:** 1.0  ')
    .replace(/^\*\*وضعیت:\*\*[^\n]*$/m, '**وضعیت:** مرجع توضیحی ثبت‌شده — بدون اثر حقوقی مستقل  ')
    .replace(/نسخه ۰٫۲/g, 'نسخه 1.0')
    .replace(/ECON-REF-01 0\.2/g, 'ECON-REF-01 1.0')
    .trimEnd()}\n`;
}

function releaseDecision() {
  const lines = ids.map((id) => `- \`${id} ${officialVersion}\` — ثبت‌شده و نافذ`).join('\n');
  return `# صورت‌ثبت و نفاذ نسل رسمی نخست اسناد بنیادین EarthCoop\n\n**تاریخ تصمیم:** ${releaseDate}\n\n**مرجع تصمیم:** بنیان‌گذار EarthCoop\n\n**وضعیت بسته:** ثبت‌شده — نافذ\n\n**شناسه ماشینی وضعیت:** \`effective\`\n\n## تصمیم\n\nبا این تصمیم، نسخه‌های بازبینی‌شده اسناد بنیادین EarthCoop به‌عنوان نسل رسمی نخست ثبت و از تاریخ ${releaseDate} نافذ می‌شوند. همه اسناد بنیادین این بسته، بدون توجه به شماره‌های توسعه‌ای و ثبتی پیشین، از **نسخه 1.0** آغاز می‌شوند.\n\n${lines}\n\n## آغاز دوباره شماره‌گذاری رسمی\n\nنسخه‌ها و شماره‌هایی که پیش از این تصمیم در فرایند طراحی، ممیزی، اصلاح، Registration Candidate یا ثبت غیرنافذ استفاده شده‌اند، از این پس «سوابق توسعه و ممیزی پیش از نسل رسمی 1» محسوب می‌شوند و در زنجیره نسخه‌های رسمی جدید predecessor محسوب نمی‌شوند.\n\nاین تصمیم سوابق را حذف نمی‌کند، releaseهای تاریخی را بازنویسی نمی‌کند و شناسه مواد را تغییر نمی‌دهد. سوابق پیشین برای provenance و ممیزی محفوظ می‌مانند؛ اما شماره نسخه رسمی جاری هر یک از ده سند بنیادین در این نقطه **1.0** است.\n\n## نفاذ\n\nده سند بنیادین فوق از همان تاریخ ثبت، نافذ و مرجع جاری حقوقی EarthCoop در قلمرو خود هستند، با رعایت سلسله‌مراتب و قواعد تعارض مقرر در FC و CO.\n\nنفاذ این بسته به‌خودی‌خود به معنی ادعای تکمیل همه قابلیت‌های نرم‌افزاری یا اجرای فوری هر قابلیت فنی برنامه‌ریزی‌شده نیست؛ فاصله اجرای نرم‌افزاری باید شفاف و قابل ممیزی مدیریت شود.\n\n## ECON-REF-01\n\nسند \`ECON-REF-01\` نیز برای هماهنگی شماره‌گذاری در نسخه **1.0** ثبت می‌شود، اما ماهیت آن مرجع توضیحی است و **اثر حقوقی مستقل، صلاحیت تقنینی یا قدرت تغییر ECON ندارد**.\n\n## سابقه و تمامیت\n\nreleaseهای پیشین، اصلاحیه‌ها، provenanceها و گزارش‌های ممیزی حذف نمی‌شوند و به‌عنوان تاریخچه immutable توسعه حفظ می‌شوند. هر ارجاع تاریخی باید بتواند به منبع پیش از نسل رسمی 1 بازگردد.\n`;
}

export async function buildEffectiveV1Release(repositoryRoot) {
  const releaseRoot = path.join(repositoryRoot, releaseRelativeRoot);
  const consolidatedRoot = path.join(releaseRoot, 'consolidated');
  await rm(releaseRoot, { recursive: true, force: true });
  await mkdir(consolidatedRoot, { recursive: true });

  const [proposals, reference] = await Promise.all([
    buildProposedFoundational(repositoryRoot),
    buildProposedEconomyReference(repositoryRoot),
  ]);
  const proposalById = new Map(proposals.map((item) => [item.id, item]));
  const registryDocuments = [];
  const epochMap = [];

  for (const [volume, id] of ids.entries()) {
    const proposal = proposalById.get(id);
    if (!proposal) throw new Error(`Missing reviewed proposal for ${id}.`);
    const markdown = replaceSelfVersionLanguage(proposal.markdown, id, proposal.version);
    const articles = parseArticles(markdown, id);
    const provenance = proposal.provenance.map((row) => ({ ...row, officialVersion, preV1SourceVersion: proposal.version }));
    const textPath = `consolidated/${id}-${officialVersion}.full.fa.md`;
    const provenancePath = `consolidated/${id}-${officialVersion}.provenance.json`;
    await Promise.all([
      writeFile(path.join(releaseRoot, textPath), markdown),
      writeFile(path.join(releaseRoot, provenancePath), `${JSON.stringify({
        schemaVersion: 1,
        status: 'effective',
        versionEpoch: 'official-v1',
        documentId: id,
        version: officialVersion,
        previousVersion: null,
        preV1SourceVersion: proposal.version,
        sourceAmendment: proposal.amendmentPath,
        provisions: provenance,
      }, null, 2)}\n`),
    ]);
    registryDocuments.push({
      volume, id, title: titles[id], currentVersion: officialVersion, previousVersion: null,
      preV1SourceVersion: proposal.version, versionEpoch: 'official-v1', status: 'effective',
      consolidatedText: textPath, provenance: provenancePath, articleCount: articles.length,
      sha256: sha256(markdown),
    });
    epochMap.push({ id, preV1ReviewedVersion: proposal.version, officialVersion, predecessorInOfficialSeries: null });
  }

  const refMarkdown = promoteReference(reference.markdown);
  const refTextPath = `consolidated/ECON-REF-01-${officialVersion}.full.fa.md`;
  const refProvenancePath = `consolidated/ECON-REF-01-${officialVersion}.provenance.json`;
  await Promise.all([
    writeFile(path.join(releaseRoot, refTextPath), refMarkdown),
    writeFile(path.join(releaseRoot, refProvenancePath), `${JSON.stringify({
      schemaVersion: 1, status: 'registered-reference', independentLegalEffect: false,
      versionEpoch: 'official-v1', documentId: 'ECON-REF-01', version: officialVersion,
      preV1SourceVersion: reference.version, provisions: reference.provenance,
    }, null, 2)}\n`),
  ]);

  const registry = {
    schemaVersion: '2.0', sourceLanguage: 'fa', releaseDate, registeredAt: releaseDate,
    effectiveAt: releaseDate, status: 'effective', statusAuthority: 'EarthCoop founder',
    statusDecision: 'REGISTRATION-DECISION.fa.md', versionEpoch: 'official-v1',
    previousRegisteredRelease: '../2026-09-20/document-registry.registered.json',
    articleReferenceFormat: '<DOC>-<VERSION>-<ARTICLE>', documents: registryDocuments,
  };
  const referenceRegistry = {
    schemaVersion: 1, releaseDate, registeredAt: releaseDate, versionEpoch: 'official-v1',
    documents: [{
      id: 'ECON-REF-01', title: 'سند مرجع اقتصاد EarthCoop و معماری نجم بهار',
      currentVersion: officialVersion, previousVersion: null, preV1SourceVersion: reference.version,
      status: 'registered-reference', independentLegalEffect: false,
      consolidatedText: refTextPath, provenance: refProvenancePath, sha256: sha256(refMarkdown),
    }],
  };

  await Promise.all([
    writeFile(path.join(releaseRoot, 'document-registry.registered.json'), `${JSON.stringify(registry, null, 2)}\n`),
    writeFile(path.join(releaseRoot, 'reference-registry.registered.json'), `${JSON.stringify(referenceRegistry, null, 2)}\n`),
    writeFile(path.join(releaseRoot, 'VERSION-EPOCH-MAP.json'), `${JSON.stringify({
      schemaVersion: 1, versionEpoch: 'official-v1', startedAt: releaseDate,
      rule: 'Pre-v1 version numbers remain immutable audit history but are not predecessors in the official-v1 series.',
      documents: [...epochMap, { id: 'ECON-REF-01', preV1ReviewedVersion: reference.version, officialVersion, predecessorInOfficialSeries: null }],
    }, null, 2)}\n`),
    writeFile(path.join(releaseRoot, 'REGISTRATION-DECISION.fa.md'), releaseDecision()),
  ]);

  const rootRegistryPath = path.join(repositoryRoot, 'document-registry.json');
  const rootRegistry = JSON.parse(await readFile(rootRegistryPath, 'utf8'));
  rootRegistry.latestRegisteredRelease = `${releaseRelativeRoot}/document-registry.registered.json`;
  await writeFile(rootRegistryPath, `${JSON.stringify(rootRegistry, null, 2)}\n`);

  const manifestPath = path.join(repositoryRoot, 'docs-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  for (const entry of manifest.entries) {
    if (ids.includes(entry.documentId)) {
      entry.legalStatus = 'effective';
      entry.authority = 'EarthCoop founder';
      entry.version = officialVersion;
      entry.reviewedAt = releaseDate;
      entry.renditions.fa = {
        source: `${releaseRelativeRoot}/consolidated/${entry.documentId}-${officialVersion}.full.fa.md`,
        status: 'current', sourceVersion: officialVersion,
      };
    } else if (entry.documentId === 'ECON-REF-01') {
      entry.legalStatus = 'official_draft';
      entry.version = officialVersion;
      entry.reviewedAt = releaseDate;
      entry.renditions.fa = { source: `${releaseRelativeRoot}/${refTextPath}`, status: 'current', sourceVersion: officialVersion };
    }
  }
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  return { registry, referenceRegistry, releaseRoot };
}

async function main() {
  const repositoryRoot = path.resolve(process.argv[2] ?? '.');
  const result = await buildEffectiveV1Release(repositoryRoot);
  process.stdout.write(`Built effective official-v1 release with ${result.registry.documents.length} foundational documents at ${releaseRelativeRoot}.\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.stack ?? error.message}\n`);
    process.exitCode = 1;
  });
}
