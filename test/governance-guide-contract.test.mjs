import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const read = (file) => readFile(path.join(root, file), 'utf8');

test('group overview centers automatic system-group families instead of public/private visibility taxonomy', async () => {
  const content = await read('groups/overview.mdx');
  assert.match(content, /system groups/i);
  assert.match(content, /public assembl/i);
  assert.match(content, /professional/i);
  assert.match(content, /special(?:ty|ized)/i);
  assert.match(content, /age\/gender/i);
  assert.match(content, /user-created groups/i);
  assert.doesNotMatch(content, /Visibility\s*\|\s*\*\*Public\*\*/i);
  assert.doesNotMatch(content, /Visibility\s*\|\s*\*\*Private\*\*/i);
});

test('group overview explains local active participation and higher-level observer representation', async () => {
  const content = await read('groups/overview.mdx');
  assert.match(content, /base governance/i);
  assert.match(content, /Active/i);
  assert.match(content, /Observer/i);
  assert.match(content, /Temporary Active/i);
  assert.match(content, /does not.*vot|no.*vot/is);
  assert.doesNotMatch(content, /gain active rights as the community grows and elections take place/i);
});

test('location and governance guide documents topology-aware base areas and pending proposal support semantics', async () => {
  const content = await read('governance/location-and-governance.mdx');
  assert.match(content, /Primary Residence/i);
  assert.match(content, /city without an urban region/i);
  assert.match(content, /urban region without a neighborhood/i);
  assert.match(content, /village without a neighborhood/i);
  assert.match(content, /Street.*optional|optional.*Street/is);
  assert.match(content, /support.*not.*approval|support.*does not.*approve/is);
  assert.match(content, /ready for review/i);
});

test('elections guide describes systemic candidate-free lifecycle and keeps poll domain separate', async () => {
  const content = await read('groups/polls-and-elections.mdx');
  assert.match(content, /System Election/i);
  assert.match(content, /Poll/i);
  assert.match(content, /no formal candidate|without formal candidates/i);
  assert.match(content, /manager/i);
  assert.match(content, /inspector/i);
  assert.match(content, /accept|decline/i);
  assert.match(content, /next.*rank|rank.*next/is);
  assert.match(content, /policy/i);
  assert.doesNotMatch(content, /Members Nominate Themselves as Candidates/i);
  assert.doesNotMatch(content, /A current manager opens a new election/i);
  assert.doesNotMatch(content, /Finish Election/i);
});
