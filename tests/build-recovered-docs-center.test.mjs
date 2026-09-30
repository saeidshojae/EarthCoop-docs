import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import { buildRecoveredDocsCenter } from '../scripts/build-recovered-docs-center.mjs';

const execFileAsync = promisify(execFile);

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-recovered-build-'));
  const runtime = path.join(root, 'runtime');
  await mkdir(path.join(runtime, 'src/content/document-packages'), { recursive: true });
  await writeFile(path.join(runtime, 'index.html'), '<h1>مرکز دانش ارث‌کوپ</h1>');
  await writeFile(path.join(runtime, 'app.js'), 'legacy-app');
  await writeFile(path.join(runtime, 'styles.css'), 'legacy-css');
  await writeFile(path.join(runtime, 'src/content/document-packages/foundational.generated.fa.js'), 'OLD');

  const archive = path.join(root, 'runtime.tar.gz');
  await execFileAsync('tar', ['-czf', archive, '-C', runtime, '.']);
  const archiveHash = createHash('sha256').update(await readFile(archive)).digest('hex');

  await writeFile(path.join(root, 'docs-manifest.json'), JSON.stringify({
    schemaVersion: 2,
    entries: [{
      documentId: 'FC',
      slug: 'foundational/fc',
      contentClass: 'foundational_document',
      canonicalLanguage: 'fa',
      legalStatus: 'registered_not_effective',
      authority: 'founder',
      version: '1.1',
      reviewedAt: '2026-09-24',
      renditions: {
        fa: { source: 'published/foundational/FC.fa.md', status: 'current' },
        en: { source: null, status: 'not_translated' },
        ar: { source: 'ar/fake.mdx', status: 'current' },
      },
    }],
  }));

  const currentFoundationalPackages = [{
    id: 'FC',
    version: '1.1',
    markdown: `# سند مادر

شناسه سند: FC

---

## دیباچه
متن کامل

### ماده FC-001 — اصل
بدن`,
  }];
  return { root, archive, archiveHash, currentFoundationalPackages };
}

test('builds recovered 0.8 runtime with governed data and explicit preview config', async () => {
  const input = await fixture();
  const outDir = path.join(input.root, 'dist');
  const report = await buildRecoveredDocsCenter({
    rootDir: input.root,
    outDir,
    sourceSha: '1'.repeat(40),
    builtAt: '2026-09-30T00:00:00Z',
    runtimeArchiveSource: input.archive,
    runtimeArchiveSha256: input.archiveHash,
    verifyRecoveredFiles: false,
    renderStaticDocuments: false,
    canonicalOrigin: 'https://docs-preview.earthcoop.ir',
    currentFoundationalPackages: input.currentFoundationalPackages,
  });

  assert.match(await readFile(path.join(outDir, 'index.html'), 'utf8'), /مرکز دانش/);
  const generated = await readFile(path.join(outDir, 'src/content/document-packages/foundational.generated.fa.js'), 'utf8');
  assert.match(generated, /FC-001/);
  assert.match(generated, /registered_not_effective/);
  assert.doesNotMatch(generated, /ar\/fake/);

  const config = await readFile(path.join(outDir, 'site-config.js'), 'utf8');
  assert.match(config, /deploymentTarget: "self-hosted"/);
  assert.match(config, /https:\/\/docs-preview\.earthcoop\.ir/);
  assert.equal(report.runtimeBaseline, 'earthcoop-knowledge-center-0.8.0');
  assert.deepEqual(report.displayLocales, ['fa']);
  assert.deepEqual(report.guideContentPolicy, {
    fa: 'recovered_0.8_editorial_snapshot_under_audit',
    en: 'reviewed_repository_guides_not_yet_mapped_to_recovered_runtime',
    ar: 'unavailable_legacy_rtl_alias_is_not_arabic',
  });
  assert.equal(report.documentCount, 1);
});
