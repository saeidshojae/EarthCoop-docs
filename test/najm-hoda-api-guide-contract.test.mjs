import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const read = (file) => readFile(path.join(root, file), 'utf8');

test('Najm Hoda overview separates verified current behavior from evolving capabilities', async () => {
  const content = await read('najm-hoda/overview.mdx');
  assert.match(content, /Current product/i);
  assert.match(content, /In development|evolving/i);
  assert.match(content, /authority|authorization/i);
  assert.doesNotMatch(content, /always available/i);
  assert.doesNotMatch(content, /every response automatically searches/i);
});

test('member-facing Najm Hoda guide does not advertise unverified autonomous group creation or a stable external API', async () => {
  const content = await read('najm-hoda/chatting-with-najm-hoda.mdx');
  assert.doesNotMatch(content, /create a cooperative group/i);
  assert.doesNotMatch(content, /building an integration.*REST API/is);
  assert.match(content, /server.*authoriz|authoriz.*server/is);
});

test('knowledge guide avoids fixed article counts and absolute freshness guarantees', async () => {
  const content = await read('najm-hoda/knowledge-base.mdx');
  assert.doesNotMatch(content, /20\\?\+ published articles|18 categories/i);
  assert.doesNotMatch(content, /always current/i);
  assert.match(content, /source|knowledge/i);
});

test('API overview labels current routes as an evolving internal contract, not a complete stable public API', async () => {
  const content = await read('api/overview.mdx');
  assert.match(content, /In development|evolving/i);
  assert.match(content, /not.*stable.*public API|not.*public.*stable API/is);
  assert.doesNotMatch(content, /A complete guide to the EarthCoop REST API/i);
});

test('authentication guide does not invent token issuance through ordinary login', async () => {
  const content = await read('api/authentication.mdx');
  assert.doesNotMatch(content, /When you log in, the platform issues a personal access token/i);
  assert.doesNotMatch(content, /successful response returns your token/i);
  assert.match(content, /auth:sanctum|Sanctum/i);
  assert.match(content, /not.*documented.*public token|no.*verified.*public token/is);
});
