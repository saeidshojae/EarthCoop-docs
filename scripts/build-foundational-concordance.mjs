import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCurrentFoundational } from './build-current-foundational.mjs';
import { buildProposedFoundational } from './build-proposed-foundational.mjs';
import { buildProposedEconomyReference } from './build-proposed-economy-reference.mjs';
import { parseArticles } from './consolidate-amendment.mjs';

export async function buildFoundationalConcordance(repositoryRoot) {
  const [current, proposed, economyReference] = await Promise.all([
    buildCurrentFoundational(repositoryRoot),
    buildProposedFoundational(repositoryRoot),
    buildProposedEconomyReference(repositoryRoot),
  ]);

  const currentById = new Map(current.map((item) => [item.id, item]));
  const rows = [];
  const documents = [];

  for (const item of proposed) {
    const base = currentById.get(item.id);
    if (!base) throw new Error(`Missing current base for concordance document ${item.id}.`);
    const baseIds = new Set(parseArticles(base.markdown, item.id).map((article) => article.id));

    documents.push({ id: item.id, baseVersion: item.baseVersion, version: item.version });
    for (const provision of item.provenance) {
      const fromAmendment = provision.source === `${item.id} ${item.version} amendment`;
      rows.push({
        documentId: item.id,
        provisionId: provision.id,
        baseVersion: item.baseVersion,
        targetVersion: item.version,
        changeType: fromAmendment ? (baseIds.has(provision.id) ? 'replaced' : 'added') : 'unchanged',
        source: provision.source,
        finalSha256: provision.sha256,
      });
    }
  }

  documents.push({
    id: economyReference.id,
    baseVersion: economyReference.baseVersion,
    version: economyReference.version,
  });
  for (const provision of economyReference.provenance) {
    rows.push({
      documentId: economyReference.id,
      provisionId: provision.section,
      baseVersion: economyReference.baseVersion,
      targetVersion: economyReference.version,
      changeType: provision.changeType,
      source: provision.source,
      finalSha256: provision.sha256,
    });
  }

  return { schemaVersion: 1, status: 'working_draft_unregistered_ineffective', documents, rows };
}

function markdownReport(result) {
  const lines = [
    '# Concordance نسخه‌های پیشنهادی اسناد بنیادین EarthCoop',
    '',
    '**وضعیت:** گزارش کاری — ثبت‌نشده — غیرنافذ',
    '',
    '> این جدول فقط ردیابی تغییر متن‌های پیشنهادی را فراهم می‌کند و هیچ اثر حقوقی مستقل ندارد.',
    '',
    '| سند | مبنا | هدف | شناسه | نوع تغییر | منبع | SHA-256 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const row of result.rows) {
    lines.push(`| ${row.documentId} | ${row.baseVersion} | ${row.targetVersion} | ${row.provisionId} | ${row.changeType} | ${row.source} | \`${row.finalSha256}\` |`);
  }
  return `${lines.join('\n')}\n`;
}

async function main() {
  const repositoryRoot = path.resolve(process.argv[2] ?? '.');
  const destination = path.join(repositoryRoot, 'working/foundational/concordance');
  const result = await buildFoundationalConcordance(repositoryRoot);
  await mkdir(destination, { recursive: true });
  await Promise.all([
    writeFile(path.join(destination, 'foundational-proposals.concordance.json'), `${JSON.stringify(result, null, 2)}\n`),
    writeFile(path.join(destination, 'foundational-proposals.concordance.fa.md'), markdownReport(result)),
  ]);
  process.stdout.write(`Built concordance with ${result.rows.length} provision rows.\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
