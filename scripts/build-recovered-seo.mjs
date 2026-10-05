function xml(value) {
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

export const RECOVERED_PRODUCTION_STATIC_SEO_ROUTES = Object.freeze([
  '/',
  '/documents/',
  '/documents/publication-policy/',
  '/guides/start/',
  '/guides/digital-country/',
  '/guides/justice/',
  '/guides/property/',
  '/guides/structure/',
  '/guides/groups/',
  '/guides/membership/',
  '/guides/economy-cycle/',
  '/guides/elections/',
  '/glossary/',
  '/map/',
  '/roles/',
  '/roles/new-member/',
  '/roles/active-member/',
  '/roles/manager/',
  '/roles/inspector/',
  '/roles/project-proposer/',
  '/roles/developer/',
  '/roles/researcher-legal/',
  '/roles/translator-editor/',
  '/status/',
].map((staticPath) => Object.freeze({
  staticPath,
  locale: 'fa',
  indexable: true,
  contentClass: 'public_page',
})));

function uniqueRoutes(routes) {
  const byPath = new Map();
  for (const route of routes) byPath.set(route.staticPath, route);
  return [...byPath.values()];
}

export function buildRecoveredSeoAssets({ canonicalOrigin, routes, preview = false }) {
  const origin = new URL(canonicalOrigin).origin;
  const sourceRoutes = preview
    ? (routes ?? [])
    : uniqueRoutes([...RECOVERED_PRODUCTION_STATIC_SEO_ROUTES, ...(routes ?? [])]);
  const normalizedRoutes = sourceRoutes.map((route) => ({
    ...route,
    canonical: `${origin}${route.staticPath}`,
    indexable: preview ? false : route.indexable !== false,
    hreflang: [{ locale: route.locale ?? 'fa', href: `${origin}${route.staticPath}` }],
  }));
  const sitemapRoutes = preview ? normalizedRoutes : normalizedRoutes.filter((route) => route.indexable);
  const urlRows = sitemapRoutes.map((route) => `  <url><loc>${xml(route.canonical)}</loc></url>`).join('\n');
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlRows}\n</urlset>\n`;
  const robotsTxt = preview
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
  return { routes: normalizedRoutes, sitemapXml, robotsTxt };
}
