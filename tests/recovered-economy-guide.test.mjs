import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  ECONOMY_GUIDE,
  applyRecoveredEconomyGuide,
  patchRecoveredEconomySidebar,
  patchRecoveredStartEconomyTeaser,
} from '../scripts/patch-recovered-economy-guide.mjs';

const SHELL = `<!doctype html><html lang="fa" dir="rtl"><head>
<title>عضویت و شهروندی — مرکز دانش ارث‌کوپ</title>
<meta name="description" content="شرایط عضویت، هویت و مسئولیت شهروندی شراکتی در ارث‌کوپ.">
<link rel="canonical" href="https://docs.earthcoop.ir/guides/membership/">
<meta property="og:title" content="عضویت و شهروندی — مرکز دانش ارث‌کوپ">
<meta property="og:description" content="شرایط عضویت، هویت و مسئولیت شهروندی شراکتی در ارث‌کوپ.">
<meta property="og:url" content="https://docs.earthcoop.ir/guides/membership/">
<script type="application/ld+json">{"name":"عضویت و شهروندی","description":"شرایط عضویت، هویت و مسئولیت شهروندی شراکتی در ارث‌کوپ.","url":"https://docs.earthcoop.ir/guides/membership/"}</script>
</head><body><nav id="mainNav"><a href="/guides/membership/" data-route="membership">عضویت و شهروندی</a><a href="/guides/elections/" data-route="elections">انتخابات پیوسته</a></nav><main id="app" tabindex="-1"><div class="page"><div class="article-body"><h2 id="next-step">از کجا ادامه دهیم؟</h2><p>متن</p></div></div></main></body></html>`;

const APP = `const pages={};\nfunction article(title,category,desc,state,body,related=[]){return {title,desc,render:()=>\`<div class="article-body">\${body}<div class="section-title"><div><span class="eyebrow">ادامه مسیر</span><h2>مطالب مرتبط</h2></div></div></div>\`};}\nObject.assign(pages,{\n  "start":article("از اینجا شروع کنید","راهنمای آغاز","desc","verified","<h2 id=\\"next-step\\">از کجا ادامه دهیم؟</h2><p>متن</p>",[]),\n  "membership":article("عضویت و شهروندی","عضویت","desc","verified","<p>عضویت</p>",[]),\n  "elections":article("انتخابات پیوسته","حکمرانی","desc","verified","<p>انتخابات</p>",[])\n});\nconst AUDITED_GUIDE_REVISION="2026-10-02-audited-v1";\nfunction tocFrom(html){return html;}`;

test('economy guide explains Bahar, Gol, contractual total value and Dim without user-irrelevant development history', () => {
  const html = ECONOMY_GUIDE.bodyHtml;
  assert.match(html, /۱۰٬۰۰۰/);
  assert.match(html, /۰٫۱ گرم طلای خالص/);
  assert.match(html, /۱۰۰ گل/);
  assert.match(html, /یک میلی‌گرم/);
  assert.match(html, /یک کیلوگرم طلای خالص/);
  assert.match(html, /بهار کمرنگ/);
  assert.match(html, /بهار فعال/);
  assert.match(html, /تعهد تحویل|بازخرید طلای فیزیکی/);
  assert.doesNotMatch(html, /قبلاً|legacy|در روند توسعه|مهاجرت/);
});

test('economy guide tells Sara story with the current group vocabulary and a truthful public-project flow', () => {
  const html = ECONOMY_GUIDE.bodyHtml;
  assert.match(html, /سارا/);
  assert.match(html, /گروه عمومی/);
  assert.match(html, /گروه تخصصی/);
  assert.match(html, /گروه اختصاصی/);
  assert.match(html, /امتیاز مشارکت/);
  assert.match(html, /پروژه عمومی/);
  assert.match(html, /تعهد/);
  assert.match(html, /فعال/);
  assert.match(html, /صندوق پروژه/);
  assert.match(html, /رضا/);
  assert.match(html, /مهتاب/);
  assert.match(html, /بازار/);
  assert.match(html, /سود.*قرارداد|بازده.*قرارداد/);
  assert.doesNotMatch(html, /گروه تخصصی زنان|۱۰ مدیر/);
});

test('start teaser introduces the economy briefly and links to the dedicated guide', () => {
  const patched = patchRecoveredStartEconomyTeaser(SHELL);
  assert.match(patched, /بهار و گل/);
  assert.match(patched, /۱۰٬۰۰۰ بهار کمرنگ/);
  assert.match(patched, /\/guides\/economy-cycle\//);
  assert.ok(patched.indexOf('بهار و گل') < patched.indexOf('از کجا ادامه دهیم؟'));
});

test('sidebar adds the economy guide between membership and elections exactly once', () => {
  const once = patchRecoveredEconomySidebar(SHELL);
  const twice = patchRecoveredEconomySidebar(once);
  assert.match(once, /membership[\s\S]*economy-cycle[\s\S]*elections/);
  assert.equal((twice.match(/data-route="economy-cycle"/g) ?? []).length, 1);
});

test('integration creates a direct economy guide and adds SPA route plus start teaser', async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-economy-guide-'));
  await mkdir(path.join(outDir, 'guides', 'start'), { recursive: true });
  await mkdir(path.join(outDir, 'guides', 'membership'), { recursive: true });
  await mkdir(path.join(outDir, 'guides', 'elections'), { recursive: true });
  await writeFile(path.join(outDir, 'index.html'), SHELL);
  await writeFile(path.join(outDir, 'guides', 'start', 'index.html'), SHELL);
  await writeFile(path.join(outDir, 'guides', 'membership', 'index.html'), SHELL);
  await writeFile(path.join(outDir, 'guides', 'elections', 'index.html'), SHELL);
  await writeFile(path.join(outDir, 'app.js'), APP);

  await applyRecoveredEconomyGuide({ outDir });

  const direct = await readFile(path.join(outDir, 'guides', 'economy-cycle', 'index.html'), 'utf8');
  const start = await readFile(path.join(outDir, 'guides', 'start', 'index.html'), 'utf8');
  const app = await readFile(path.join(outDir, 'app.js'), 'utf8');
  const root = await readFile(path.join(outDir, 'index.html'), 'utf8');

  assert.match(direct, /data-economy-guide-revision=/);
  assert.match(direct, /اقتصاد EarthCoop و چرخه بهار/);
  assert.match(direct, /یک کیلوگرم طلای خالص/);
  assert.match(direct, /data-route="economy-cycle"/);
  assert.match(start, /\/guides\/economy-cycle\//);
  assert.match(root, /data-route="economy-cycle"/);
  assert.match(app, /"economy-cycle"/);
  assert.match(app, /یک کیلوگرم طلای خالص/);
  assert.match(app, /ECONOMY_GUIDE_REVISION/);
});
