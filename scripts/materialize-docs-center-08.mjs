import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export const RECOVERED_08_DEPLOYED_ARCHIVE_NAME = 'earthcoop-knowledge-center-0.8.0-cpanel.tar.gz';
export const RECOVERED_08_ARCHIVE_SHA256 = 'e1c5938f381db7b7f0efeef527dd828c96e13adc9de5a913de624796c6ae0704';
export const RECOVERED_08_ARCHIVE_URL = `https://docs-preview.earthcoop.ir/${RECOVERED_08_DEPLOYED_ARCHIVE_NAME}`;
export const RECOVERED_08_FILE_HASHES = Object.freeze({
  'index.html': 'db2afdbe08b013f10fd3c643d430d0ef4cb9eb3442ca5f266cf71083045422a5',
  'app.js': 'e961f95541d99ca940c19b860f315eba366e50e4c9dcb9f7302cfc04b156713e',
  'styles.css': '4c3f3c63cab170fe6f91baa5b04cff53db87bf5bbfd4e6c4adb1f4c5f66c4e80',
});

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function sourceBytes(source) {
  if (/^https:\/\//.test(source)) {
    const response = await fetch(source, { redirect: 'follow' });
    if (!response.ok) throw new Error(`Recovery archive download failed: ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  }
  return readFile(source);
}

export async function materializeRecoveredDocsCenter({
  archiveSource = RECOVERED_08_ARCHIVE_URL,
  outDir,
  expectedSha256 = RECOVERED_08_ARCHIVE_SHA256,
  verifyFiles = true,
}) {
  if (!outDir) throw new TypeError('outDir is required');
  const bytes = await sourceBytes(archiveSource);
  const archiveSha256 = sha256(bytes);
  if (archiveSha256 !== expectedSha256) {
    throw new Error(`Recovered 0.8 archive SHA mismatch: ${archiveSha256}`);
  }

  const temporary = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-kc08-'));
  const archive = path.join(temporary, 'source.tar.gz');
  try {
    await writeFile(archive, bytes);
    await rm(outDir, { recursive: true, force: true });
    await mkdir(outDir, { recursive: true });
    await execFileAsync('tar', ['-xzf', archive, '-C', outDir]);

    if (verifyFiles) {
      for (const [file, expected] of Object.entries(RECOVERED_08_FILE_HASHES)) {
        const actual = sha256(await readFile(path.join(outDir, file)));
        if (actual !== expected) throw new Error(`Recovered 0.8 file SHA mismatch: ${file}`);
      }
    }

    const deployedArchivePath = path.join(outDir, RECOVERED_08_DEPLOYED_ARCHIVE_NAME);
    await writeFile(deployedArchivePath, bytes);

    return {
      archiveSha256,
      deployedArchivePath,
      outDir,
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
