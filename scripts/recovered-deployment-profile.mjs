const PROFILES = Object.freeze({
  preview: Object.freeze({
    target: 'preview',
    canonicalOrigin: 'https://docs-preview.earthcoop.ir',
    indexable: false,
    seoPreview: true,
    globalNoindex: true,
  }),
  production: Object.freeze({
    target: 'production',
    canonicalOrigin: 'https://docs.earthcoop.ir',
    indexable: true,
    seoPreview: false,
    globalNoindex: false,
  }),
});

function bareHttpsOrigin(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('canonicalOrigin must be a valid HTTPS URL');
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('canonicalOrigin must be a bare HTTPS origin');
  }
  return url.origin;
}

export function resolveRecoveredDeploymentProfile({ target = 'preview', canonicalOrigin } = {}) {
  const profile = PROFILES[target];
  if (!profile) throw new Error(`Unsupported deployment target: ${String(target)}`);
  const origin = bareHttpsOrigin(canonicalOrigin ?? profile.canonicalOrigin);
  if (origin !== profile.canonicalOrigin) {
    throw new Error(`Deployment target ${target} does not match canonical origin ${origin}`);
  }
  return profile;
}
