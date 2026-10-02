import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = process.cwd();

test('recovered build registers economy-cycle in the canonical runtime route registry before client rerender', async () => {
  const renderSource = await readFile(path.join(root, 'scripts/render-recovered-static-documents.mjs'), 'utf8');
  assert.match(renderSource, /applyRecoveredEconomyRouteRegistration/);
});
