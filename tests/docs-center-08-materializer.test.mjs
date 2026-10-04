import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { promisify } from 'node:util';

import {
  materializeRecoveredDocsCenter,
  RECOVERED_08_ARCHIVE_MIRROR_URL,
  RECOVERED_08_ARCHIVE_URL,
  RECOVERED_08_DEPLOYED_ARCHIVE_NAME,
} from '../scripts/materialize-docs-center-08.mjs';

const execFileAsync = promisify(execFile);

async function fixtureArchive() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-kc08-materializer-'));
  const source = path.join(root, 'source');
  await mkdir(source);
  await writeFile(path.join(source, 'index.html'), 'legacy-ui');
  await writeFile(path.join(source, 'app.js'), 'legacy-app');
  await writeFile(path.join(source, 'styles.css'), 'legacy-css');
  const archive = path.join(root, 'source.tar.gz');
  await execFileAsync('tar', ['-czf', archive, '-C', source, '.']);
  const bytes = await readFile(archive);
  return {
    archive,
    bytes,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    root,
  };
}

test('materializes a hash-pinned recovered Docs Center archive and preserves the verified archive for future recovery', async () => {
  const fixture = await fixtureArchive();
  const outDir = path.join(fixture.root, 'out');
  await materializeRecoveredDocsCenter({
    archiveSource: fixture.archive,
    outDir,
    expectedSha256: fixture.sha256,
    verifyFiles: false,
  });
  assert.equal(await readFile(path.join(outDir, 'index.html'), 'utf8'), 'legacy-ui');
  const preserved = await readFile(path.join(outDir, RECOVERED_08_DEPLOYED_ARCHIVE_NAME));
  assert.equal(createHash('sha256').update(preserved).digest('hex'), fixture.sha256);
});

test('falls back to the production mirror when the preview recovery archive transport is unavailable', async () => {
  const fixture = await fixtureArchive();
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url === RECOVERED_08_ARCHIVE_URL) throw new Error('preview transport unavailable');
    assert.equal(url, RECOVERED_08_ARCHIVE_MIRROR_URL);
    return {
      ok: true,
      status: 200,
      async arrayBuffer() {
        return Uint8Array.from(fixture.bytes).buffer;
      },
    };
  };

  const outDir = path.join(fixture.root, 'mirror-out');
  await materializeRecoveredDocsCenter({
    archiveSource: RECOVERED_08_ARCHIVE_URL,
    outDir,
    expectedSha256: fixture.sha256,
    verifyFiles: false,
    fetchImpl,
  });

  assert.deepEqual(calls, [RECOVERED_08_ARCHIVE_URL, RECOVERED_08_ARCHIVE_MIRROR_URL]);
  assert.equal(await readFile(path.join(outDir, 'index.html'), 'utf8'), 'legacy-ui');
});

test('rejects a recovered archive when its SHA differs', async () => {
  const fixture = await fixtureArchive();
  await assert.rejects(materializeRecoveredDocsCenter({
    archiveSource: fixture.archive,
    outDir: path.join(fixture.root, 'bad'),
    expectedSha256: '0'.repeat(64),
    verifyFiles: false,
  }), /SHA mismatch/);
});
