import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  AUDITED_GUIDES_FA,
  GUIDE_AUDIT_REVISION,
  GUIDE_ROUTE_ORDER,
  applyRecoveredGuideContent,
  patchRecoveredGuideAppSource,
} from '../scripts/patch-recovered-guide-content.mjs';

const expectedRoutes = ['start', 'justice', 'property', 'digital-country', 'structure', 'groups', 'membership', 'elections'];

function guide(route) {
  const found = AUDITED_GUIDES_FA.find((item) => item.route === route);
  assert.ok(found, `missing audited guide ${route}`);
  return found;
}

test('audited Persian guide source covers the approved eight-step learning path exactly once', () => {
  assert.deepEqual(GUIDE_ROUTE_ORDER, expectedRoutes);
  assert.deepEqual(AUDITED_GUIDES_FA.map((item) => item.route), expectedRoutes);
  assert.equal(new Set(AUDITED_GUIDES_FA.map((item) => item.route)).size, expectedRoutes.length);
  for (const item of AUDITED_GUIDES_FA) {
    assert.equal(item.revision, GUIDE_AUDIT_REVISION);
    assert.equal(item.reviewedAt, '2026-10-02');
    assert.ok(item.title.length > 0);
    assert.ok(item.description.length > 0);
    assert.ok(item.bodyHtml.includes('<h2'));
  }
});

test('country and citizenship guides use the digital-country metaphor and cooperative governance without claiming current sovereignty', () => {
  const digital = `${guide('digital-country').title}\n${guide('digital-country').bodyHtml}`;
  const membership = `${guide('membership').title}\n${guide('membership').bodyHtml}`;
  assert.match(digital, /حکمرانی شراکتی/);
  assert.doesNotMatch(digital, /جمهوری تعاونی/);
  assert.match(digital, /تمثیل/);
  assert.match(digital, /کشور مستقل|دولت جایگزین/);
  assert.match(digital, /سرزمین واقعی|کشور فیزیکی/);
  assert.match(membership, /شهروندی دیجیتال/);
  assert.match(membership, /تمثیل|درون‌سامانه/);
});

test('guide introduction explains the Najm family and expands Najm Hoda and Najm Bahar exactly as approved', () => {
  const combined = AUDITED_GUIDES_FA.map((item) => item.bodyHtml).join('\n');
  assert.match(combined, /نرم‌افزار جامع مدیریت هوشمند دنیای ارثکوپ/);
  assert.match(combined, /نرم‌افزار جامع مدیریت بانکی هوشمند ارثکوپ/);
  assert.match(combined, /خانواده[^.]{0,120}نجم|نجم‌ها[^.]{0,120}خانواده/);
  assert.match(combined, /به مرور|به‌مرور/);
});

test('group guide uses the approved three user-facing families while preserving the evidence-backed system dimensions', () => {
  const groups = guide('groups').bodyHtml;
  assert.match(groups, /گروه‌های عمومی/);
  assert.match(groups, /گروه‌های تخصصی/);
  assert.match(groups, /علمی/);
  assert.match(groups, /صنفی/);
  assert.match(groups, /گروه‌های اختصاصی/);
  assert.match(groups, /سنی/);
  assert.match(groups, /جنسیتی/);
  assert.match(groups, /public|profession|specialty|age|gender/);
});

test('location and membership copy reflects current base-governance registration and user-facing invitation rules only', () => {
  const start = guide('start').bodyHtml;
  const structure = guide('structure').bodyHtml;
  const membership = guide('membership').bodyHtml;
  assert.match(start, /جامعه پایه حکمرانی|پایه حکمرانی/);
  assert.match(structure, /Location|مکان/);
  assert.match(structure, /Governance|حکمرانی/);
  assert.match(structure, /خیابان|کوچه/);
  assert.match(structure, /اختیاری/);
  assert.match(membership, /امتیاز مشارکت/);
  assert.match(membership, /تنظیمات جاری|قواعد جاری/);
  assert.doesNotMatch(membership, /قبلاً|پاداش نقدی|معماری جدید|میراثی|legacy/i);
});

test('election guide separates official rules from current implementation and keeps vote identity distinct from feedback visibility', () => {
  const elections = guide('elections').bodyHtml;
  assert.match(elections, /۲۰/);
  assert.match(elections, /۷ مدیر/);
  assert.match(elections, /۳ بازرس/);
  assert.match(elections, /یک هفته|۷ روز/);
  assert.match(elections, /شش ماه|۶ ماه/);
  assert.match(elections, /هویت رأی/);
  assert.match(elections, /توضیح|بازخورد/);
  assert.match(elections, /فقط فرد موردنظر/);
  assert.match(elections, /تفویض موضوعی/);
  assert.match(elections, /قاعده رسمی|سند رسمی/);
  assert.match(elections, /پیاده‌سازی|محصول/);
});

test('app patch is fail-closed and injects one audited override before the learning-path runtime', () => {
  const source = `const pages = {};\nconst LEARNING_PATH = Object.freeze([]);\nfunction article() { return {}; }\n`;
  const patched = patchRecoveredGuideAppSource(source);
  assert.match(patched, /Object\.assign\(pages/);
  assert.match(patched, new RegExp(GUIDE_AUDIT_REVISION.replaceAll('.', '\\.')));
  assert.ok(patched.indexOf('Object.assign(pages') < patched.indexOf('const LEARNING_PATH'));
  assert.throws(() => patchRecoveredGuideAppSource('const pages = {};'), /learning-path patch point/i);
});

test('applies the same audited revision to direct static guides, SPA source and page metadata', async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-audited-guides-'));
  await mkdir(path.join(outDir, 'src', 'content'), { recursive: true });
  await writeFile(path.join(outDir, 'app.js'), `const pages = {};\nconst LEARNING_PATH = Object.freeze([]);\nfunction article() { return {}; }\n`);
  const records = expectedRoutes.map((route) => `{ inventoryId:'page.${route}', route:'${route}', title:'OLD', description:'OLD', contentClass:'guide', status:'under_audit', source:'OLD', sourceType:'editorial', authority:'OLD', version:'0.3.0', reviewedAt:'2026-09-19' }`).join(',\n');
  await writeFile(path.join(outDir, 'src', 'content', 'pages.fa.js'), `window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.pageRecords = Object.freeze([\n${records}\n]);\n`);

  for (const route of expectedRoutes) {
    const dir = path.join(outDir, 'guides', route);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'index.html'), `<!doctype html><html><body><main id="app" tabindex="-1" aria-live="polite" aria-atomic="true"><div class="page">OLD-${route}</div></main></body></html>`);
  }

  await applyRecoveredGuideContent({ outDir });

  const app = await readFile(path.join(outDir, 'app.js'), 'utf8');
  const metadata = await readFile(path.join(outDir, 'src', 'content', 'pages.fa.js'), 'utf8');
  assert.match(app, new RegExp(GUIDE_AUDIT_REVISION.replaceAll('.', '\\.')));
  assert.match(metadata, /reviewedAt:'2026-10-02'/);
  assert.doesNotMatch(metadata, /route:'start', title:'OLD'/);

  for (const route of expectedRoutes) {
    const html = await readFile(path.join(outDir, 'guides', route, 'index.html'), 'utf8');
    assert.match(html, new RegExp(`data-guide-revision="${GUIDE_AUDIT_REVISION}"`));
    assert.match(html, new RegExp(guide(route).title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(html, /مطالب مرتبط/);
    assert.doesNotMatch(html, new RegExp(`OLD-${route}`));
  }
});
