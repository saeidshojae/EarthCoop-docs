import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const baseline = path.resolve('recovery/knowledge-center-0.8');
const expected = {
  'index.html': 'db2afdbe08b013f10fd3c643d430d0ef4cb9eb3442ca5f266cf71083045422a5',
  'app.js': 'e961f95541d99ca940c19b860f315eba366e50e4c9dcb9f7302cfc04b156713e',
  'styles.css': '4c3f3c63cab170fe6f91baa5b04cff53db87bf5bbfd4e6c4adb1f4c5f66c4e80',
  'src/ui/router.js': '6ddc66417d9f3f0c4b8f2abb9e26c7519f0c23ff0624956b4c9970c90df47a52',
  'src/ui/search-dialog.js': 'f1c9992e461c5697ccea8259b5a4ade3b6c6ccd1b85eb690fef4eca58b4f4bb5',
  'src/ui/mobile-navigation.js': '280385847907747efaeff54aa8962b1dd46f2206995a92c52d8c94ef95ef5963',
  'src/ui/theme.js': '889e5dc7579f206929cd78e0afe0f674daaee52ae4ec88c8c8a9e7b979ab6e01',
  'src/ui/document-reader-controls.js': 'a6321942c2e657c648a832eb9633ce4b5eaf3d589990ddf55eaa49f2253c46b3',
  'src/pages/document-reader.js': 'bf76b470c200e74793ad1a9d316e9ee29ceb3ff26413caaff458ce9774ebadbd',
};

test('recovered 0.8 UI baseline is preserved byte-for-byte', async () => {
  for (const [relative, hash] of Object.entries(expected)) {
    const bytes = await readFile(path.join(baseline, relative));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), hash, relative);
  }
});
