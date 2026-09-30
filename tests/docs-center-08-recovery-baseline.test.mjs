import assert from 'node:assert/strict';
import test from 'node:test';

import {
  RECOVERED_08_ARCHIVE_SHA256,
  RECOVERED_08_FILE_HASHES,
} from '../scripts/materialize-docs-center-08.mjs';

const expectedFiles = {
  'index.html': 'db2afdbe08b013f10fd3c643d430d0ef4cb9eb3442ca5f266cf71083045422a5',
  'app.js': 'e961f95541d99ca940c19b860f315eba366e50e4c9dcb9f7302cfc04b156713e',
  'styles.css': '4c3f3c63cab170fe6f91baa5b04cff53db87bf5bbfd4e6c4adb1f4c5f66c4e80',
};

test('recovered 0.8 archive identity is immutable', () => {
  assert.equal(
    RECOVERED_08_ARCHIVE_SHA256,
    'e1c5938f381db7b7f0efeef527dd828c96e13adc9de5a913de624796c6ae0704',
  );
  assert.deepEqual(RECOVERED_08_FILE_HASHES, expectedFiles);
});
