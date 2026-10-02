import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  AUDITED_REFERENCE_REVISION,
  renderAuditedGlossaryPage,
  renderAuditedMapPage,
  renderAuditedStatusPage,
  applyRecoveredReferencePagesAudit,
} from '../scripts/patch-recovered-reference-pages.mjs';

const SHELL = (route) => `<!doctype html><html lang="fa" dir="rtl"><body><main id="app" tabindex="-1"><div class="page"><p>legacy-${route}</p></div></main></body></html>`;
const APP = `function statusPage(){return \`legacy-status\`}\nfunction glossaryPage(){return \`legacy-glossary\`}\nfunction mapPage(){return \`legacy-map\`}\nfunction rolesPage(){return \`roles\`}`;
const PAGES = `window.EC_CONTENT = window.EC_CONTENT || {};\nwindow.EC_CONTENT.pageRecords = Object.freeze([\n  { inventoryId:'page.map', route:'map', title:'نقشه کامل ارث‌کوپ', status:'under_audit', version:'0.3.0', reviewedAt:'2026-09-19' },\n  { inventoryId:'page.status', route:'status', title:'وضعیت قابلیت‌ها', status:'under_audit', version:'0.3.0', reviewedAt:'2026-09-19' },\n  { inventoryId:'page.glossary', route:'glossary', title:'فرهنگ اصطلاحات', status:'under_audit', version:'0.3.0', reviewedAt:'2026-09-19' },\n]);`;

test('audited glossary exposes the current user-facing vocabulary and Bahar value language', () => {
  const html = renderAuditedGlossaryPage();
  for (const phrase of ['حکمرانی شراکتی','کشور دیجیتال','شهروندی دیجیتال','گروه عمومی','گروه تخصصی','گروه اختصاصی','نجم‌هدا','نجم‌بهار','بهار','گل','بهار کمرنگ','بهار فعال','امتیاز مشارکت','سهم ارزش']) {
    assert.match(html, new RegExp(phrase));
  }
  assert.match(html, /۰٫۱ گرم طلای خالص/);
  assert.match(html, /۱۰۰ گل/);
  assert.match(html, /یک میلی‌گرم طلای خالص/);
  assert.match(html, /نرم‌افزار جامع مدیریت هوشمند دنیای ارث‌کوپ/);
  assert.match(html, /نرم‌افزار جامع مدیریت بانکی هوشمند ارث‌کوپ/);
  assert.doesNotMatch(html, /جمهوری تعاونی/);
});

test('audited map uses the approved three group families and includes the economic life cycle', () => {
  const html = renderAuditedMapPage();
  assert.match(html, /حکمرانی شراکتی/);
  assert.match(html, /عمومی/);
  assert.match(html, /تخصصی.*علمی و صنفی/s);
  assert.match(html, /اختصاصی.*سنی و جنسیتی/s);
  assert.match(html, /بهار و گل/);
  assert.match(html, /#\/economy-cycle/);
  assert.doesNotMatch(html, /حکمرانی تعاونی/);
  assert.doesNotMatch(html, /حرفه‌ای و جمعیت‌شناختی/);
});

test('audited status is anchored to current EarthCoop main and only states user-relevant confidence boundaries', () => {
  const html = renderAuditedStatusPage();
  assert.match(html, /f88c28a/);
  assert.match(html, /۲۰۲۶-۱۰-۰۲/);
  assert.match(html, /ورود با گوگل/);
  assert.match(html, /۱۰٬۰۰۰ بهار/);
  assert.match(html, /امتیاز مشارکت/);
  assert.match(html, /تأیید عملیاتی/);
  assert.doesNotMatch(html, /پاداش.*۱۰ بهار/s);
  assert.doesNotMatch(html, /a5db748/);
});

test('integration replaces all three direct pages, SPA renderers and under-audit page metadata', async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-reference-audit-'));
  for (const route of ['glossary','map','status']) {
    await mkdir(path.join(outDir, route), { recursive: true });
    await writeFile(path.join(outDir, route, 'index.html'), SHELL(route));
  }
  await mkdir(path.join(outDir, 'src', 'content'), { recursive: true });
  await writeFile(path.join(outDir, 'app.js'), APP);
  await writeFile(path.join(outDir, 'src', 'content', 'pages.fa.js'), PAGES);

  await applyRecoveredReferencePagesAudit({ outDir });

  const glossary = await readFile(path.join(outDir, 'glossary', 'index.html'), 'utf8');
  const map = await readFile(path.join(outDir, 'map', 'index.html'), 'utf8');
  const status = await readFile(path.join(outDir, 'status', 'index.html'), 'utf8');
  const app = await readFile(path.join(outDir, 'app.js'), 'utf8');
  const pages = await readFile(path.join(outDir, 'src', 'content', 'pages.fa.js'), 'utf8');

  assert.match(glossary, new RegExp(AUDITED_REFERENCE_REVISION));
  assert.match(map, /#\/economy-cycle/);
  assert.match(status, /f88c28a/);
  assert.match(app, /نرم‌افزار جامع مدیریت هوشمند دنیای ارث‌کوپ/);
  assert.match(app, /function mapPage\(\)/);
  assert.match(app, /function statusPage\(\)/);
  assert.match(pages, /route:'glossary'[\s\S]*status:'unofficial_explanation'[\s\S]*version:'1\.0\.0'[\s\S]*reviewedAt:'2026-10-02'/);
  assert.match(pages, /route:'map'[\s\S]*status:'unofficial_explanation'/);
  assert.match(pages, /route:'status'[\s\S]*status:'unofficial_explanation'/);
  assert.doesNotMatch(pages, /\['status','map','glossary'\][\s\S]*under_audit/);
});
