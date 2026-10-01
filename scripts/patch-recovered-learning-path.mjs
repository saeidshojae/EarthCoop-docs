import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const LEARNING_PATH = Object.freeze([
  Object.freeze({ route: 'start', title: 'از اینجا شروع کنید' }),
  Object.freeze({ route: 'justice', title: 'عدالت و حق زمین' }),
  Object.freeze({ route: 'property', title: 'مالکیت خصوصی' }),
  Object.freeze({ route: 'digital-country', title: 'کشور دیجیتال' }),
  Object.freeze({ route: 'structure', title: 'از کوچه تا سیاره' }),
  Object.freeze({ route: 'groups', title: 'گروه‌های ارث‌کوپ' }),
  Object.freeze({ route: 'membership', title: 'عضویت و شهروندی' }),
  Object.freeze({ route: 'elections', title: 'انتخابات پیوسته' }),
]);

const RELATED_HEADING = '<div class="section-title"><div><span class="eyebrow">ادامه مسیر</span><h2>مطالب مرتبط</h2></div></div>';
const STYLE_MARKER = '/* Recovered learning path navigation */';

export function learningPathNeighbors(route) {
  const index = LEARNING_PATH.findIndex((item) => item.route === route);
  if (index < 0) return { previous: null, current: null, next: null };
  return {
    previous: index > 0 ? LEARNING_PATH[index - 1] : null,
    current: LEARNING_PATH[index],
    next: index < LEARNING_PATH.length - 1 ? LEARNING_PATH[index + 1] : null,
  };
}

function hrefFor(route, mode) {
  return mode === 'spa' ? `#/${route}` : `/guides/${route}/`;
}

export function renderLearningPathNavigation(route, { mode = 'static' } = {}) {
  const { previous, current, next } = learningPathNeighbors(route);
  if (!current) return '';

  const primary = next
    ? `<a class="learning-path-next" href="${hrefFor(next.route, mode)}"><span>ادامه مسیر</span><strong>${next.title} ←</strong></a>`
    : '<div class="learning-path-complete"><span>پایان مسیر</span><strong>این مسیر یادگیری را کامل کردید.</strong></div>';

  const arrows = previous
    ? `<nav class="learning-path-arrows" aria-label="حرکت در مسیر یادگیری"><a class="learning-path-previous" href="${hrefFor(previous.route, mode)}">→ قبلی<span>${previous.title}</span></a>${next ? `<a class="learning-path-forward" href="${hrefFor(next.route, mode)}">بعدی ←<span>${next.title}</span></a>` : ''}</nav>`
    : '';

  return `<section class="learning-path-navigation" data-learning-path-route="${route}" aria-label="مسیر یادگیری">${primary}${arrows}</section>`;
}

export function patchRecoveredLearningPathHtml(source, route) {
  const input = String(source);
  if (!LEARNING_PATH.some((item) => item.route === route)) return input;
  if (input.includes(`data-learning-path-route="${route}"`)) return input;
  if (!input.includes(RELATED_HEADING)) throw new Error(`Recovered guide related-content marker changed for ${route}`);
  return input.replace(RELATED_HEADING, `${renderLearningPathNavigation(route, { mode: 'static' })}${RELATED_HEADING}`);
}

function browserLearningPathSource() {
  return `const LEARNING_PATH = Object.freeze(${JSON.stringify(LEARNING_PATH)});\nfunction learningPathNeighbors(route) {\n  const index = LEARNING_PATH.findIndex((item) => item.route === route);\n  if (index < 0) return { previous:null, current:null, next:null };\n  return { previous:index > 0 ? LEARNING_PATH[index - 1] : null, current:LEARNING_PATH[index], next:index < LEARNING_PATH.length - 1 ? LEARNING_PATH[index + 1] : null };\n}\nfunction resolveLearningPathRoute() {\n  const hashRoute = (location.hash.match(/^#\\/([^/?#]+)/)?.[1] || '').trim();\n  if (hashRoute) return hashRoute;\n  return (location.pathname.match(/\\/guides\\/([^\\/?#]+)\\/?$/)?.[1] || '').trim();\n}\nfunction learningPathNavigation() {\n  const route = resolveLearningPathRoute();\n  const { previous, current, next } = learningPathNeighbors(route);\n  if (!current) return '';\n  const primary = next ? \`<a class="learning-path-next" href="#/\${next.route}"><span>ادامه مسیر</span><strong>\${next.title} ←</strong></a>\` : '<div class="learning-path-complete"><span>پایان مسیر</span><strong>این مسیر یادگیری را کامل کردید.</strong></div>';\n  const arrows = previous ? \`<nav class="learning-path-arrows" aria-label="حرکت در مسیر یادگیری"><a class="learning-path-previous" href="#/\${previous.route}">→ قبلی<span>\${previous.title}</span></a>\${next ? \`<a class="learning-path-forward" href="#/\${next.route}">بعدی ←<span>\${next.title}</span></a>\` : ''}</nav>\` : '';\n  return \`<section class="learning-path-navigation" data-learning-path-route="\${route}" aria-label="مسیر یادگیری">\${primary}\${arrows}</section>\`;\n}\n`;
}

export function patchRecoveredLearningPathAppSource(source) {
  let output = String(source);
  if (!output.includes('function learningPathNavigation()')) {
    const articleNeedle = 'function article(title, category, desc, state, body, related=[]) {';
    if (!output.includes(articleNeedle)) throw new Error('Recovered article renderer patch point changed');
    output = output.replace(articleNeedle, `${browserLearningPathSource()}\n${articleNeedle}`);
  }

  if (!output.includes('${body}${learningPathNavigation()}<div class="section-title">')) {
    const bodyNeedle = '${body}<div class="section-title"><div><span class="eyebrow">ادامه مسیر</span><h2>مطالب مرتبط</h2></div></div>';
    if (!output.includes(bodyNeedle)) throw new Error('Recovered article learning-path insertion point changed');
    output = output.replace(bodyNeedle, '${body}${learningPathNavigation()}<div class="section-title"><div><span class="eyebrow">ادامه مسیر</span><h2>مطالب مرتبط</h2></div></div>');
  }
  return output;
}

export function patchRecoveredLearningPathStyles(source) {
  const input = String(source);
  if (input.includes(STYLE_MARKER)) return input;
  return `${input.trimEnd()}\n\n${STYLE_MARKER}\n.learning-path-navigation{margin:34px 0 28px;padding:18px;border:1px solid var(--line);border-radius:16px;background:color-mix(in srgb,var(--mint) 54%,var(--card));display:grid;gap:12px}\n.learning-path-next{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:16px 18px;border-radius:13px;background:var(--forest-2);color:#fff;text-decoration:none;box-shadow:0 8px 22px rgba(15,61,47,.12)}\n.learning-path-next span{font-size:11px;font-weight:800;color:#f1d788}.learning-path-next strong{font-size:15px}\n.learning-path-complete{display:grid;gap:5px;padding:14px 16px;border-radius:13px;background:var(--card);border:1px solid var(--line)}.learning-path-complete span{font-size:11px;font-weight:800;color:var(--forest-3)}\n.learning-path-arrows{display:grid;grid-template-columns:1fr 1fr;gap:10px}.learning-path-arrows a{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 12px;border:1px solid var(--line);border-radius:11px;background:var(--card);text-decoration:none;font-size:12px;font-weight:800;color:var(--forest-2)}.learning-path-arrows a span{color:var(--muted);font-size:10px;font-weight:600}\n@media(max-width:640px){.learning-path-navigation{padding:13px}.learning-path-next{align-items:flex-start;flex-direction:column;gap:4px}.learning-path-arrows{grid-template-columns:1fr}.learning-path-arrows a{align-items:flex-start;flex-direction:column}}\n`;
}

export async function applyRecoveredLearningPath({ outDir }) {
  for (const item of LEARNING_PATH) {
    const guidePath = path.join(outDir, 'guides', item.route, 'index.html');
    const source = await readFile(guidePath, 'utf8');
    await writeFile(guidePath, patchRecoveredLearningPathHtml(source, item.route));
  }

  const appPath = path.join(outDir, 'app.js');
  await writeFile(appPath, patchRecoveredLearningPathAppSource(await readFile(appPath, 'utf8')));

  const stylesPath = path.join(outDir, 'styles.css');
  await writeFile(stylesPath, patchRecoveredLearningPathStyles(await readFile(stylesPath, 'utf8')));
}
