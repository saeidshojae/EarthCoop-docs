import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(root, 'sources/foundational/STD-0.1');
const expectedHashes = {
  '01-intro-through-identifiers.fa.md': '2b423a9f0ba871a880d5384a6b3d6dea128e42fcc1ed66a66383db88931f72e9',
  '02-identity-through-bahar.fa.md': '9caec66c924834f1d0c4bd3faf17dbc39692e18a064e5ac71edca79bd455e035',
  '03-projects-through-security.fa.md': '4268b26d75be1c873b98ca46008b4e608544967f838d3f182afe1e4af9d9cc80',
  '04-ai-through-conformance.fa.md': 'f6acd0ce147d6fc8b1fae7733b8fdbe846e7c9fd79a3317ddf6321fb8176e3ae',
  '05-complaints-through-final.fa.md': 'b9c1a9c120c734af5344ba19f601efd719da4b17dbacc477763911966047a033',
};

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

test('imported STD 0.1 source parts retain their recorded hashes and 78 stable article IDs', async () => {
  const files = (await readdir(sourceDirectory)).filter((name) => name.endsWith('.fa.md')).sort();
  assert.deepEqual(files, Object.keys(expectedHashes));
  const bodies = [];
  for (const file of files) {
    const body = await readFile(path.join(sourceDirectory, file));
    assert.equal(sha256(body), expectedHashes[file], `${file} provenance drift`);
    bodies.push(body.toString('utf8'));
  }
  const ids = [...bodies.join('\n').matchAll(/^### ماده (STD-\d{3})/gm)].map((match) => match[1]);
  assert.equal(ids.length, 78);
  assert.equal(ids[0], 'STD-001');
  assert.equal(ids.at(-1), 'STD-078');
  ids.forEach((id, index) => assert.equal(id, `STD-${String(index + 1).padStart(3, '0')}`));
});
