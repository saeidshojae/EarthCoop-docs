import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = path.join(root, 'sources/foundational/STD-0.1');
const expectedFiles = [
  '01-intro-through-identifiers.fa.md',
  '02-identity-through-bahar.fa.md',
  '03-projects-through-security.fa.md',
  '04-ai-through-conformance.fa.md',
  '05-complaints-through-final.fa.md',
];

test('imported STD 0.1 source preserves five ordered parts and 78 stable article IDs', async () => {
  const files = (await readdir(sourceDirectory)).filter((name) => name.endsWith('.fa.md')).sort();
  assert.deepEqual(files, expectedFiles);
  const bodies = await Promise.all(files.map((file) => readFile(path.join(sourceDirectory, file), 'utf8')));
  const joined = bodies.join('\n');
  const ids = [...joined.matchAll(/^### ماده (STD-\d{3})/gm)].map((match) => match[1]);
  assert.equal(ids.length, 78);
  assert.equal(new Set(ids).size, 78);
  assert.equal(ids[0], 'STD-001');
  assert.equal(ids.at(-1), 'STD-078');
  ids.forEach((id, index) => assert.equal(id, `STD-${String(index + 1).padStart(3, '0')}`));
  assert.match(joined, /پایان استانداردهای فنی EarthCoop — نسخه ۰\.۱/);
});
