function xml(value) {
  return String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}

export function buildRecoveredSeoAssets({ canonicalOrigin, routes, preview = false }) {
  const origin = new URL(canonicalOrigin).origin;
  const normalizedRoutes = (routes ?? []).map((route) => ({
    ...route,
    canonical: `${origin}${route.staticPath}`,
    indexable: preview ? false : route.indexable !== false,
    hreflang: [{ locale: route.locale ?? 'fa', href: `${origin}${route.staticPath}` }],
  }));
  const urlRows = normalizedRoutes.map((route) => `  <url><loc>${xml(route.canonical)}</loc></url>`).join('\n');
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlRows}\n</urlset>\n`;
  const robotsTxt = preview
    ? 'User-agent: *\nDisallow: /\n'
    : `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`;
  return { routes: normalizedRoutes, sitemapXml, robotsTxt };
}
