import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateRecoveredDocsCenter } from '../scripts/validate-recovered-docs-center.mjs';

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

async function fixture() {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-validate-recovered-'));
  await mkdir(path.join(outDir, 'src/content/document-packages'), { recursive: true });
  const files = {
    'index.html': '<html><script src="site-config.js"></script></html>',
    'app.js': 'runtime',
    'styles.css': 'styles',
    'site-config.js': 'window.EC_SITE_CONFIG={canonicalOrigin:"https://docs-preview.earthcoop.ir",deploymentTarget:"self-hosted"};',
    'src/content/document-packages/foundational.generated.fa.js': 'window.EC_CONTENT={foundationalDocumentPackages:[]};',
    'earthcoop-knowledge-center-0.8.0-cpanel.tar.gz': 'archive-bytes',
  };
  const hashes = {};
  for (const [relative, content] of Object.entries(files)) {
    const absolute = path.join(outDir, relative);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, content);
    hashes[relative] = sha256(Buffer.from(content));
  }
  const sourceSha = '1'.repeat(40);
  const archiveSha = hashes['earthcoop-knowledge-center-0.8.0-cpanel.tar.gz'];
  const manifest = {
    schemaVersion: 2,
    repository: 'saeidshojae/EarthCoop-docs',
    sourceSha,
    builtAt: '2026-09-30T00:00:00Z',
    runtimeBaseline: 'earthcoop-knowledge-center-0.8.0',
    runtimeArchiveSha256: archiveSha,
    canonicalLanguage: 'fa',
    displayLocales: ['fa'],
    guideContentPolicy: {
      fa: 'recovered_0.8_editorial_snapshot_under_audit',
      en: 'reviewed_repository_guides_not_yet_mapped_to_recovered_runtime',
      ar: 'unavailable_legacy_rtl_alias_is_not_arabic',
    },
    canonicalOrigin: 'https://docs-preview.earthcoop.ir',
    fileCount: Object.keys(hashes).length + 1,
    hashes,
  };
  await writeFile(path.join(outDir, 'deployment-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  return { outDir, sourceSha, archiveSha };
}

function validateArgs(input, expectedSourceSha = input.sourceSha) {
  return {
    outDir: input.outDir,
    expectedSourceSha,
    expectedRuntimeArchiveSha: input.archiveSha,
  };
}

test('accepts a complete recovered 0.8 preview build and verifies every declared file hash', async () => {
  const input = await fixture();
  const result = await validateRecoveredDocsCenter(validateArgs(input));
  assert.equal(result.valid, true);
  assert.equal(result.runtimeBaseline, 'earthcoop-knowledge-center-0.8.0');
});

test('rejects a tampered file after manifest creation', async () => {
  const input = await fixture();
  await writeFile(path.join(input.outDir, 'app.js'), 'tampered');
  await assert.rejects(
    validateRecoveredDocsCenter(validateArgs(input)),
    /hash mismatch.*app\.js/i,
  );
});

test('rejects wrong source SHA, runtime baseline, preview origin, locale policy, or guide policy', async () => {
  const input = await fixture();
  const manifestPath = path.join(input.outDir, 'deployment-manifest.json');
  const original = JSON.parse(await readFile(manifestPath, 'utf8'));

  await assert.rejects(
    validateRecoveredDocsCenter(validateArgs(input, '2'.repeat(40))),
    /source SHA/i,
  );

  for (const mutate of [
    (m) => { m.runtimeBaseline = 'other'; },
    (m) => { m.canonicalOrigin = 'https://docs.earthcoop.ir'; },
    (m) => { m.displayLocales = ['fa', 'ar']; },
    (m) => { m.guideContentPolicy.fa = 'current'; },
  ]) {
    const changed = structuredClone(original);
    mutate(changed);
    await writeFile(manifestPath, JSON.stringify(changed));
    await assert.rejects(
      validateRecoveredDocsCenter(validateArgs(input)),
      /baseline|preview origin|display locales|guide content policy/i,
    );
  }
});

test('rejects a missing recovery archive declaration', async () => {
  const input = await fixture();
  const manifestPath = path.join(input.outDir, 'deployment-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  delete manifest.hashes['earthcoop-knowledge-center-0.8.0-cpanel.tar.gz'];
  await writeFile(manifestPath, JSON.stringify(manifest));
  await assert.rejects(
    validateRecoveredDocsCenter(validateArgs(input)),
    /recovery archive/i,
  );
});
