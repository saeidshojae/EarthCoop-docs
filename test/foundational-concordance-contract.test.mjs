import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildFoundationalConcordance } from '../scripts/build-foundational-concordance.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('builds deterministic concordance for ten foundational proposals plus ECON-REF-01', async () => {
  const result = await buildFoundationalConcordance(repositoryRoot);

  assert.deepEqual(result.documents.map((item) => item.id), [
    'FC', 'CH', 'CO', 'EX', 'ECON', 'DG', 'JUD', 'LOC', 'ETH', 'STD', 'ECON-REF-01',
  ]);
  assert.ok(result.rows.length > 100);
  assert.ok(result.rows.every((row) => ['unchanged', 'replaced', 'added'].includes(row.changeType)));
  assert.ok(result.rows.every((row) => /^[a-f0-9]{64}$/.test(row.finalSha256)));

  const ex085 = result.rows.find((row) => row.documentId === 'EX' && row.provisionId === 'EX-085');
  assert.equal(ex085.changeType, 'added');
  assert.equal(ex085.targetVersion, '1.2');

  const ref18 = result.rows.find((row) => row.documentId === 'ECON-REF-01' && row.provisionId === '1.8');
  assert.equal(ref18.changeType, 'added');
  assert.equal(ref18.targetVersion, '0.2');
});
