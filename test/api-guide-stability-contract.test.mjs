import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const read = (file) => readFile(path.join(root, file), 'utf8');

for (const file of ['api/najm-hoda.mdx', 'api/geographic.mdx', 'api/notifications.mdx', 'api/tickets.mdx']) {
  test(`${file} identifies the current API as evolving rather than a stable external contract`, async () => {
    const content = await read(file);
    assert.match(content, /In development|evolving/i);
    assert.match(content, /not.*stable.*public|not.*stable.*external|not.*final.*client/is);
  });
}

test('Najm Hoda API guide preserves server-side authority boundary', async () => {
  const content = await read('api/najm-hoda.mdx');
  assert.match(content, /server.*authoriz|authoriz.*server/is);
  assert.doesNotMatch(content, /public.*escalate endpoint.*intended/is);
});

test('geographic API guide does not present legacy hierarchy helpers as the canonical final location contract', async () => {
  const content = await read('api/geographic.mdx');
  assert.match(content, /legacy/i);
  assert.match(content, /canonical.*location|location.*canonical/is);
  assert.doesNotMatch(content, /recommended endpoint for building cascading location selectors/i);
});

test('notifications API guide uses Bahar terminology and avoids claiming a fixed final public payload contract', async () => {
  const content = await read('api/notifications.mdx');
  assert.doesNotMatch(content, /platform's currency unit \(گل\)/i);
  assert.match(content, /Bahar/i);
  assert.match(content, /payload|contract/i);
});

test('tickets API guide avoids unsupported guarantees about automatic behavior', async () => {
  const content = await read('api/tickets.mdx');
  assert.doesNotMatch(content, /automatic priority assignment/i);
  assert.doesNotMatch(content, /confirmation email is sent/i);
  assert.match(content, /current implementation|current route|current controller/i);
});
