import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { patchEnglishRouterIsolation } from './recovered-language-navigation.mjs';

export const ENGLISH_PRODUCT_GUIDE_PATHS = Object.freeze([
  'account-setup.mdx',
  'account/notifications.mdx',
  'account/profile.mdx',
  'account/support-tickets.mdx',
  'api/authentication.mdx',
  'api/geographic.mdx',
  'api/najm-hoda.mdx',
  'api/notifications.mdx',
  'api/overview.mdx',
  'api/tickets.mdx',
  'governance/location-and-governance.mdx',
  'governance/translation-policy.mdx',
  'groups/chat-and-messaging.mdx',
  'groups/creating-a-group.mdx',
  'groups/joining-a-group.mdx',
  'groups/overview.mdx',
  'groups/polls-and-elections.mdx',
  'index.mdx',
  'introduction.mdx',
  'najm-bahar/membership-fees.mdx',
  'najm-bahar/overview.mdx',
  'najm-bahar/sub-accounts.mdx',
  'najm-bahar/transfers.mdx',
  'najm-hoda/chatting-with-najm-hoda.mdx',
  'najm-hoda/knowledge-base.mdx',
  'najm-hoda/overview.mdx',
  'projects/investing.mdx',
  'projects/overview.mdx',
  'projects/submitting-a-project.mdx',
  'projects/tracking-status.mdx',
  'quickstart.mdx',
]);

export const ENGLISH_GUIDE_AUDIT = Object.freeze({
  auditDate: '2026-10-02',
  docsBaseline: 'f54119e4d362dd93c1cfee1c242bf87fa7a2e59f',
  applicationBaseline: 'f88c28a518749fb81133c3affa5e5fbf353f844a',
  foundationalEnglishAvailable: false,
  arabicAvailable: false,
});

const AUDITED = new Set(ENGLISH_PRODUCT_GUIDE_PATHS);

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function stripMdxExtension(sourcePath) {
  return String(sourcePath).replace(/\.mdx$/i, '');
}

export function isAuditedEnglishGuideSource(sourcePath) {
  return AUDITED.has(String(sourcePath).replaceAll('\\', '/'));
}

export function englishGuideRouteForSource(sourcePath) {
  const normalized = String(sourcePath).replaceAll('\\', '/');
  if (!isAuditedEnglishGuideSource(normalized) && !normalized.endsWith('.mdx')) {
    throw new Error(`English guide source must be an MDX path: ${normalized}`);
  }
  const withoutExtension = stripMdxExtension(normalized);
  return withoutExtension === 'index' ? 'en' : `en/${withoutExtension}`;
}

export function englishGuideStaticPathForSource(sourcePath) {
  return `/${englishGuideRouteForSource(sourcePath)}/`;
}

function sourceForGuideHref(href) {
  if (!href?.startsWith('/') || href.startsWith('//')) return null;
  const clean = href.split(/[?#]/, 1)[0].replace(/^\/+|\/+$/g, '');
  if (!clean || clean.startsWith('en/')) return null;
  const candidate = clean === '' ? 'index.mdx' : `${clean}.mdx`;
  return AUDITED.has(candidate) ? candidate : null;
}

export function rewriteEnglishGuideLinks(markdown) {
  return String(markdown ?? '').replace(/\]\((\/[^)\s]+)\)/g, (whole, href) => {
    const source = sourceForGuideHref(href);
    if (!source) return whole;
    return `](${englishGuideStaticPathForSource(source)})`;
  });
}

function parseFrontmatter(source) {
  const text = String(source ?? '').replace(/^\uFEFF/, '');
  const match = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!match) return { metadata: {}, body: text };
  const metadata = {};
  for (const line of match[1].split(/\r?\n/)) {
    const pair = line.match(/^([A-Za-z][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!pair) continue;
    metadata[pair[1]] = pair[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return { metadata, body: text.slice(match[0].length) };
}

function inlineMarkdown(text) {
  let value = escapeHtml(text);
  value = value.replace(/`([^`]+)`/g, '<code>$1</code>');
  value = value.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  value = value.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return value;
}

function mdxComponentsToMarkdown(body) {
  return String(body ?? '')
    .replace(/<Steps>/g, '\n<div class="en-guide-steps">\n')
    .replace(/<\/Steps>/g, '\n</div>\n')
    .replace(/<Step\s+title="([^"]+)"\s*>/g, '\n<section class="en-guide-step">\n## $1\n')
    .replace(/<\/Step>/g, '\n</section>\n')
    .replace(/<(Note|Info|Warning)>/g, (_m, kind) => `\n<div class="en-guide-callout en-guide-callout-${kind.toLowerCase()}">\n`)
    .replace(/<\/(Note|Info|Warning)>/g, '\n</div>\n')
    .replace(/<CardGroup[^>]*>/g, '\n<div class="en-guide-card-grid">\n')
    .replace(/<\/CardGroup>/g, '\n</div>\n')
    .replace(/<Card\s+title="([^"]+)"(?:\s+icon="[^"]*")?\s+href="([^"]+)"\s*>/g, '\n<div class="en-guide-card">\n### [$1]($2)\n')
    .replace(/<Card\s+title="([^"]+)"\s+href="([^"]+)"(?:\s+icon="[^"]*")?\s*>/g, '\n<div class="en-guide-card">\n### [$1]($2)\n')
    .replace(/<\/Card>/g, '\n</div>\n');
}

export function renderEnglishGuideMdx(source) {
  const { metadata, body } = parseFrontmatter(source);
  const rewritten = rewriteEnglishGuideLinks(mdxComponentsToMarkdown(body));
  const lines = rewritten.split(/\r?\n/);
  const html = [];
  let listType = null;
  let code = false;
  let codeLines = [];

  const closeList = () => {
    if (!listType) return;
    html.push(`</${listType}>`);
    listType = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (/^```/.test(line.trim())) {
      closeList();
      if (!code) {
        code = true;
        codeLines = [];
      } else {
        html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        code = false;
      }
      continue;
    }
    if (code) {
      codeLines.push(rawLine);
      continue;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      closeList();
      continue;
    }
    if (/^<\/?(?:div|section)/.test(trimmed)) {
      closeList();
      html.push(trimmed);
      continue;
    }
    const heading = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }
    const unordered = trimmed.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      if (listType !== 'ul') {
        closeList();
        listType = 'ul';
        html.push('<ul>');
      }
      html.push(`<li>${inlineMarkdown(unordered[1])}</li>`);
      continue;
    }
    const ordered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      if (listType !== 'ol') {
        closeList();
        listType = 'ol';
        html.push('<ol>');
      }
      html.push(`<li>${inlineMarkdown(ordered[1])}</li>`);
      continue;
    }
    closeList();
    html.push(`<p>${inlineMarkdown(trimmed)}</p>`);
  }
  closeList();
  if (code) html.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
  return { metadata, bodyHtml: html.join('\n') };
}

function replaceHtmlLanguage(html) {
  let output = String(html);
  output = output.replace(/<html([^>]*)\blang="[^"]*"([^>]*)>/i, '<html$1lang="en"$2>');
  if (!/<html[^>]*\blang=/i.test(output)) output = output.replace(/<html([^>]*)>/i, '<html$1 lang="en">');
  output = output.replace(/<html([^>]*)\bdir="[^"]*"([^>]*)>/i, '<html$1dir="ltr"$2>');
  if (!/<html[^>]*\bdir=/i.test(output)) output = output.replace(/<html([^>]*)>/i, '<html$1 dir="ltr">');
  return output;
}

function replaceHead(html, { title, description, canonical }) {
  let output = String(html);
  if (/<title>[\s\S]*?<\/title>/i.test(output)) output = output.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
  else output = output.replace(/<\/head>/i, `<title>${escapeHtml(title)}</title>\n</head>`);
  output = output.replace(/<link\s+rel="canonical"[^>]*>/i, `<link rel="canonical" href="${escapeHtml(canonical)}">`);
  if (!/<link\s+rel="canonical"/i.test(output)) output = output.replace(/<\/head>/i, `<link rel="canonical" href="${escapeHtml(canonical)}">\n</head>`);
  output = output.replace(/<meta\s+name="description"[^>]*>/i, `<meta name="description" content="${escapeHtml(description)}">`);
  if (!/<meta\s+name="description"/i.test(output)) output = output.replace(/<\/head>/i, `<meta name="description" content="${escapeHtml(description)}">\n</head>`);
  const style = '<style id="english-product-guide-style">.en-product-guide{direction:ltr;text-align:left;max-width:860px;margin-inline:auto}.en-product-guide h1,.en-product-guide h2,.en-product-guide h3{text-align:left}.en-guide-callout,.en-guide-card{border:1px solid var(--border,#d9dde3);border-radius:12px;padding:1rem;margin:1rem 0}.en-guide-card-grid{display:grid;gap:1rem}.en-guide-steps{counter-reset:step}</style>';
  if (!output.includes('english-product-guide-style')) output = output.replace(/<\/head>/i, `${style}\n</head>`);
  return output;
}

function replaceMain(html, guide) {
  const article = `<main id="app" tabindex="-1"><div class="page"><article class="en-product-guide" data-content-class="guide" data-locale="en" data-source-path="${escapeHtml(guide.sourcePath)}"><p><a href="/en/">English Product Guides</a></p><h1>${escapeHtml(guide.title)}</h1>${guide.bodyHtml}</article></div></main>`;
  const replaced = String(html).replace(/<main id="app"[\s\S]*?<\/main>/i, article);
  if (replaced === html) throw new Error('Recovered English guide template main contract changed');
  return replaced;
}

function patchEnglishHashRedirect(appSource) {
  const source = String(appSource ?? '');
  if (source.includes('EC_ENGLISH_GUIDE_HASH_REDIRECT')) return source;
  return `${source}\n;/* EC_ENGLISH_GUIDE_HASH_REDIRECT */\n(function(){\n  function redirectEnglishGuideHash(){\n    const hash=String(window.location.hash||'');\n    if(hash==='#/en'||hash==='#/en/') { window.location.replace('/en/'); return; }\n    if(!hash.startsWith('#/en/')) return;\n    const route=hash.slice(2).replace(/^\\/+|\\/+$/g,'');\n    if(route.startsWith('en/')) window.location.replace('/'+route+'/');\n  }\n  if(typeof window!=='undefined'){ window.addEventListener('hashchange',redirectEnglishGuideHash); redirectEnglishGuideHash(); }\n})();\n`;
}

export async function loadAuditedEnglishProductGuides({ rootDir, sourcePaths = ENGLISH_PRODUCT_GUIDE_PATHS }) {
  const guides = [];
  for (const sourcePath of sourcePaths) {
    if (!isAuditedEnglishGuideSource(sourcePath)) throw new Error(`Unaudited English guide source: ${sourcePath}`);
    const source = await readFile(path.join(rootDir, sourcePath), 'utf8');
    const rendered = renderEnglishGuideMdx(source);
    guides.push({
      sourcePath,
      route: englishGuideRouteForSource(sourcePath),
      staticPath: englishGuideStaticPathForSource(sourcePath),
      title: rendered.metadata.title || rendered.metadata.sidebarTitle || sourcePath,
      description: rendered.metadata.description || 'Reviewed EarthCoop English product guide.',
      bodyHtml: rendered.bodyHtml,
      locale: 'en',
      contentClass: 'guide',
    });
  }
  return guides;
}

export async function applyRecoveredEnglishProductGuides({
  rootDir,
  outDir,
  sourcePaths = ENGLISH_PRODUCT_GUIDE_PATHS,
  canonicalOrigin = 'https://docs-preview.earthcoop.ir',
}) {
  if (!rootDir || !outDir) throw new TypeError('rootDir and outDir are required');
  const origin = new URL(canonicalOrigin).origin;
  const guides = await loadAuditedEnglishProductGuides({ rootDir, sourcePaths });
  const templatePath = path.join(outDir, 'guides/start/index.html');
  const template = await readFile(templatePath, 'utf8');

  for (const guide of guides) {
    let html = replaceHtmlLanguage(template);
    html = replaceHead(html, {
      title: `${guide.title} — EarthCoop`,
      description: guide.description,
      canonical: `${origin}${guide.staticPath}`,
    });
    html = replaceMain(html, guide);
    const destination = path.join(outDir, guide.route, 'index.html');
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, html);
  }

  const appPath = path.join(outDir, 'app.js');
  await writeFile(appPath, patchEnglishHashRedirect(patchEnglishRouterIsolation(await readFile(appPath, 'utf8'))));

  const searchRecords = guides.map((guide) => ({
    id: `guide:${guide.sourcePath}`,
    documentId: null,
    inventoryId: `guide.${stripMdxExtension(guide.sourcePath).replaceAll('/', '.')}`,
    contentClass: 'product_guide',
    locale: 'en',
    title: guide.title,
    heading: guide.title,
    anchor: null,
    body: guide.bodyHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    status: 'audited_current',
    version: null,
    route: guide.staticPath,
  }));

  const seoRoutes = guides.map((guide) => ({
    route: guide.route,
    staticPath: guide.staticPath,
    locale: 'en',
    indexable: false,
    contentClass: 'guide',
  }));

  return {
    guides,
    searchRecords,
    seoRoutes,
    displayLocales: ['fa', 'en'],
    foundationalLocales: ['fa'],
    audit: ENGLISH_GUIDE_AUDIT,
  };
}
