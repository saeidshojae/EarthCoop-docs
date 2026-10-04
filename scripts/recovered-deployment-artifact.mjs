import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { resolveRecoveredDeploymentProfile } from './recovered-deployment-profile.mjs';

function validatedProfile(profile) {
  return resolveRecoveredDeploymentProfile({
    target: profile?.target,
    canonicalOrigin: profile?.canonicalOrigin,
  });
}

function escapeApacheRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function patchRecoveredStaticSeoHtml(source, deploymentProfile) {
  const profile = validatedProfile(deploymentProfile);
  let output = String(source)
    .replaceAll('https://docs-preview.earthcoop.ir', profile.canonicalOrigin)
    .replaceAll('https://docs.earthcoop.ir', profile.canonicalOrigin);

  if (profile.target === 'production') {
    output = output.replaceAll('href="/"', 'href="/home/"');
  }

  const robots = profile.globalNoindex ? 'noindex,nofollow' : 'index,follow';
  output = output.replace(
    /<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="robots" content="${robots}">`,
  );
  if (!/<meta\s+name="robots"/i.test(output)) {
    output = output.replace(/<\/head>/i, `<meta name="robots" content="${robots}">\n</head>`);
  }

  const forbiddenOrigin = profile.target === 'production'
    ? 'https://docs-preview.earthcoop.ir'
    : 'https://docs.earthcoop.ir';
  if (output.includes(forbiddenOrigin)) {
    throw new Error(`Recovered ${profile.target} HTML contains forbidden origin ${forbiddenOrigin}`);
  }
  return output;
}

export function patchRecoveredClientHomeAlias(source, deploymentProfile) {
  const profile = validatedProfile(deploymentProfile);
  const input = String(source);
  if (profile.target !== 'production') return input;

  const needle = "  const path = normalizePathname(locationLike.pathname);\n  if (path === '/404/') return null;";
  const replacement = "  const normalizedPath = normalizePathname(locationLike.pathname);\n  const path = normalizedPath === '/home/' ? '/' : normalizedPath;\n  if (path === '/404/') return null;";
  if (!input.includes(needle)) {
    throw new Error('Recovered client router no longer matches the audited production home-alias patch point');
  }
  return input.replace(needle, replacement);
}

export function renderRecoveredHostingHtaccess(deploymentProfile) {
  const profile = validatedProfile(deploymentProfile);
  const url = new URL(profile.canonicalOrigin);
  const hostPattern = escapeApacheRegex(url.host);
  const robotsHeader = profile.globalNoindex
    ? '  Header always set X-Robots-Tag "noindex, nofollow"\n'
    : '';
  const productionHomeAlias = profile.target === 'production'
    ? '  RewriteRule ^home/?$ index.html [L]\n\n'
    : '';

  return `Options -Indexes
DirectoryIndex index.html

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ ${profile.canonicalOrigin}%{REQUEST_URI} [R=301,L]

  RewriteCond %{HTTP_HOST} !^${hostPattern}$ [NC]
  RewriteRule ^ ${profile.canonicalOrigin}%{REQUEST_URI} [R=301,L]

${productionHomeAlias}  RewriteCond %{REQUEST_FILENAME} -d
  RewriteCond %{REQUEST_URI} !/$
  RewriteRule ^ %{REQUEST_URI}/ [R=301,L]
</IfModule>

ErrorDocument 404 /404/index.html

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Permissions-Policy "camera=(), microphone=(), geolocation=()"
${robotsHeader}  <FilesMatch "^(site-config\\.js|deployment-manifest\\.json|recovered-locales\\.json|recovered-search-index\\.json|recovered-seo-routes\\.json|recovered-editorial-truth\\.json)$">
    Header set Cache-Control "no-store, max-age=0"
  </FilesMatch>
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-store, max-age=0, must-revalidate"
  </FilesMatch>
  <FilesMatch "\\.(css|js)$">
    Header set Cache-Control "no-cache, max-age=0, must-revalidate"
  </FilesMatch>
  <FilesMatch "\\.(svg|woff2)$">
    Header set Cache-Control "public, max-age=3600, must-revalidate"
  </FilesMatch>
</IfModule>

<IfModule mod_mime.c>
  AddType application/javascript .js
  AddType font/woff2 .woff2
</IfModule>
`;
}

export async function applyRecoveredStaticSeoProfile({ outDir, deploymentProfile }) {
  const profile = validatedProfile(deploymentProfile);
  const visit = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile() && entry.name.endsWith('.html')) {
        const html = await readFile(absolute, 'utf8');
        await writeFile(absolute, patchRecoveredStaticSeoHtml(html, profile));
      }
    }
  };
  await visit(outDir);

  if (profile.target === 'production') {
    const routerPath = path.join(outDir, 'src', 'ui', 'legacy-route-migration.js');
    const router = await readFile(routerPath, 'utf8');
    await writeFile(routerPath, patchRecoveredClientHomeAlias(router, profile));
  }
}
