import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve('.');
const read = (file) => readFile(path.join(root, file), 'utf8');

const economyPages = [
  'projects/overview.mdx',
  'projects/submitting-a-project.mdx',
  'projects/investing.mdx',
  'najm-bahar/overview.mdx',
  'najm-bahar/membership-fees.mdx',
  'najm-bahar/sub-accounts.mdx',
  'najm-bahar/transfers.mdx'
];

test('economy guides use Bahar as the monetary unit and Gol only as its subunit', async () => {
  const content = (await Promise.all(economyPages.map(read))).join('\n');
  assert.doesNotMatch(content, /GOL unit,? the currency|amounts?.*use the GOL unit|investment amount.*\(in GOL\)/i);
  assert.match(content, /Bahar/i);
  assert.match(content, /Gol.*subunit|subunit.*Gol/is);
});

test('Najm Bahar guide separates Creation, Activation, Transfer and retirement terminology', async () => {
  const content = await read('najm-bahar/overview.mdx');
  assert.match(content, /Creation/i);
  assert.match(content, /Activation/i);
  assert.match(content, /Transfer/i);
  assert.match(content, /retirement/i);
  assert.doesNotMatch(content, /burn pool/i);
  assert.doesNotMatch(content, /faded funds/i);
  assert.match(content, /Dim/i);
});

test('project guide does not equate support or approval with an automatic direct owner transfer', async () => {
  const content = (await read('projects/overview.mdx')) + '\n' + (await read('projects/submitting-a-project.mdx'));
  assert.match(content, /support.*not.*approval|support.*does not.*approve/is);
  assert.match(content, /approval.*not.*transfer|approval.*does not.*transfer/is);
  assert.doesNotMatch(content, /funds transfer directly to the project owner/i);
  assert.doesNotMatch(content, /receive invested capital.*project owner/i);
});

test('public-project flow distinguishes commitment, activation and transfer', async () => {
  const content = await read('projects/overview.mdx');
  assert.match(content, /Commitment/i);
  assert.match(content, /Activation/i);
  assert.match(content, /Transfer/i);
  assert.match(content, /Active Project Fund/i);
});

test('advanced economic architecture is not presented as current solely because ECON defines it', async () => {
  const content = (await read('projects/overview.mdx')) + '\n' + (await read('najm-bahar/overview.mdx'));
  assert.match(content, /Current product/i);
  assert.match(content, /Normative|reference architecture/i);
  assert.match(content, /In development|Planned/i);
});

test('unverified scheduled transfers are not advertised as current', async () => {
  const content = (await read('najm-bahar/overview.mdx')) + '\n' + (await read('najm-bahar/transfers.mdx')) + '\n' + (await read('najm-bahar/sub-accounts.mdx'));
  assert.doesNotMatch(content, /scheduled transfers?|schedule(?:d)? for a future date|Send, Schedule,/i);
});
