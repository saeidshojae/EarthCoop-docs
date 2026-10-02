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

test('API overview documents the current v1 native contract without claiming a complete public developer API', async () => {
  const content = await read('api/overview.mdx');
  assert.match(content, /versioned `?\/api\/v1`?|\/api\/v1/i);
  assert.match(content, /first-party|native-client|native client/i);
  assert.match(content, /not.*public|not.*third-party|does not.*public/is);
  assert.doesNotMatch(content, /A complete guide to the EarthCoop REST API/i);
});

test('authentication guide documents the verified v1 bearer flow without inventing a general third-party token platform', async () => {
  const content = await read('api/authentication.mdx');
  assert.match(content, /POST \/api\/v1\/auth\/login/i);
  assert.match(content, /bearer token/i);
  assert.match(content, /Sanctum|authorization/i);
  assert.match(content, /does \*\*not\*\* by itself establish a general developer-platform policy|does not.*general.*developer|not.*third-party/is);
  assert.doesNotMatch(content, /arbitrary personal access tokens.*supported/i);
});
