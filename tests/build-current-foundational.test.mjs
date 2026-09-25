import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildCurrentFoundational } from '../scripts/build-current-foundational.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('builds the latest registered package for every foundational document', async () => {
  const packages = await buildCurrentFoundational(repositoryRoot);

  assert.deepEqual(packages.map((item) => item.id), [
    'FC', 'CH', 'CO', 'EX', 'ECON', 'DG', 'JUD', 'LOC', 'ETH', 'STD',
  ]);
  assert.deepEqual(
    Object.fromEntries(packages.map((item) => [item.id, item.version])),
    {
      FC: '1.1', CH: '1.0', CO: '1.0', EX: '1.1', ECON: '0.2',
      DG: '0.2', JUD: '0.2', LOC: '0.2', ETH: '0.2', STD: '0.2',
    },
  );
  assert.ok(packages.every((item) => item.status === 'registered_not_effective' || item.status === 'current_unchanged'));
  assert.ok(packages.every((item) => item.markdown.includes(`شناسه سند:** ${item.id}`)));
});

test('consolidates amendments without dropping or inventing base articles', async () => {
  const packages = await buildCurrentFoundational(repositoryRoot);
  const byId = new Map(packages.map((item) => [item.id, item]));

  assert.equal(byId.get('FC').articleCount, 50);
  assert.equal(byId.get('CH').articleCount, 49);
  assert.equal(byId.get('CO').articleCount, 66);
  assert.equal(byId.get('EX').articleCount, 84);
  assert.equal(byId.get('ECON').articleCount, 465);
  assert.equal(byId.get('DG').articleCount, 81);
  assert.equal(byId.get('JUD').articleCount, 79);
  assert.equal(byId.get('LOC').articleCount, 73);
  assert.equal(byId.get('ETH').articleCount, 69);
  assert.equal(byId.get('STD').completeness, 'amendment_only');
  assert.match(byId.get('STD').markdown, /متن اصلاحیه/);
});

