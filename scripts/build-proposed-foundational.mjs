import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildCurrentFoundational } from './build-current-foundational.mjs';
import { consolidateAmendment } from './consolidate-amendment.mjs';

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

const draftStatus = 'پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ';
const draftLegalEffect = 'این متن صرفاً پیش‌نویس تلفیقی برای بازبینی است و تا تصمیم رسمی جداگانه ثبت یا لازم‌الاجرا نیست.';

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

    output.push({
      id,
      version: metadata.targetVersion,
      baseVersion: metadata.baseVersion,
      amendmentPath: path.relative(repositoryRoot, amendmentPath).replaceAll('\\', '/'),
      markdown: result.document,
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
