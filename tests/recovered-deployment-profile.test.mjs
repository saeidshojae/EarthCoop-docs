import assert from 'node:assert/strict';
import test from 'node:test';

import * as profileModule from '../scripts/recovered-deployment-profile.mjs';

test('preview profile is bound to Preview origin and globally non-indexable', () => {
  const profile = profileModule.resolveRecoveredDeploymentProfile({
    target: 'preview',
    canonicalOrigin: 'https://docs-preview.earthcoop.ir',
  });
  assert.deepEqual(profile, {
    target: 'preview',
    canonicalOrigin: 'https://docs-preview.earthcoop.ir',
    indexable: false,
    seoPreview: true,
    globalNoindex: true,
  });
});

test('production profile is bound to Production origin and indexable', () => {
  const profile = profileModule.resolveRecoveredDeploymentProfile({
    target: 'production',
    canonicalOrigin: 'https://docs.earthcoop.ir',
  });
  assert.deepEqual(profile, {
    target: 'production',
    canonicalOrigin: 'https://docs.earthcoop.ir',
    indexable: true,
    seoPreview: false,
    globalNoindex: false,
  });
});

test('deployment profile fails closed for crossed or unknown target/origin pairs', () => {
  assert.throws(() => profileModule.resolveRecoveredDeploymentProfile({ target: 'preview', canonicalOrigin: 'https://docs.earthcoop.ir' }), /deployment target.*origin|origin.*deployment target/i);
  assert.throws(() => profileModule.resolveRecoveredDeploymentProfile({ target: 'production', canonicalOrigin: 'https://docs-preview.earthcoop.ir' }), /deployment target.*origin|origin.*deployment target/i);
  assert.throws(() => profileModule.resolveRecoveredDeploymentProfile({ target: 'staging', canonicalOrigin: 'https://docs-preview.earthcoop.ir' }), /deployment target/i);
});
