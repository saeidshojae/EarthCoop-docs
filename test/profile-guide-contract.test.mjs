import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const content = await readFile(path.join(root, 'account/profile.mdx'), 'utf8');

test('profile guide uses primary residence and topology-aware governance language', () => {
  assert.match(content, /primary residence/i);
  assert.match(content, /governance area|governance/i);
  assert.match(content, /topology/i);
});

test('profile guide separates official residence membership from optional micro-location community membership', () => {
  assert.match(content, /Street|Alley|Complex|Building/i);
  assert.match(content, /optional/i);
  assert.match(content, /community/i);
});

test('profile guide does not promise destructive vote clearing or manual rejoin semantics', () => {
  assert.doesNotMatch(content, /All previous votes.*cleared automatically/is);
  assert.doesNotMatch(content, /Rejoin those groups manually/i);
});

test('profile guide explains pending location proposals without blocking the member flow', () => {
  assert.match(content, /pending|proposed/i);
  assert.match(content, /support/i);
});
