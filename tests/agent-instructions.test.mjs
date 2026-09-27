import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('AGENTS describes EarthCoop repository governance instead of starter-kit setup', async () => {
  const agents = await readFile(path.join(root, 'AGENTS.md'), 'utf8');
  assert.doesNotMatch(agents, /First-time setup/i);
  assert.match(agents, /docs\.earthcoop\.ir/i);
  assert.match(agents, /REGISTRY_MODEL\.md/);
  assert.match(agents, /registered[^\n]*not effective/i);
  assert.match(agents, /do not change foundational article text/i);
});
