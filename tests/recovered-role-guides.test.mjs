import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

const expectedSlugs = [
  'new-member',
  'active-member',
  'manager',
  'inspector',
  'project-proposer',
  'researcher-legal',
  'developer',
  'translator-editor',
];

test('creates one dedicated, user-facing guide for every role card', async () => {
  let module;
  try {
    module = await import('../scripts/patch-recovered-role-guides.mjs');
  } catch {
    module = null;
  }
  assert.ok(module, 'dedicated role-guide patch module must exist');
  assert.deepEqual(module.ROLE_GUIDES.map((guide) => guide.slug), expectedSlugs);

  const outDir = await mkdtemp(path.join(os.tmpdir(), 'earthcoop-role-guides-'));
  await mkdir(path.join(outDir, 'roles'), { recursive: true });
  await writeFile(path.join(outDir, 'app.js'), `
function rolesPage(){const roles=[['◌','عضو تازه‌وارد','شناخت ایده، عضویت، مکان، گروه‌ها و نخستین مشارکت','start'],['◎','عضو فعال','گفت‌وگو، نظرسنجی، انتخابات، پروژه‌ها و امتیاز مشارکت','groups'],['✓','مدیر گروه','مسئولیت اجرایی، پاسخ‌گویی، تصمیم‌ها و محدودیت‌های مسئولیت','elections'],['◇','بازرس','نظارت، گزارش، شفافیت و تفکیک مسئولیت از مدیریت','elections'],['¤','پیشنهاددهنده پروژه','فرایند پیشنهاد، ارزیابی، بیمه و تأمین مالی پروژه','status'],['▤','پژوهشگر یا حقوق‌دان','سلسله‌مراتب، نسخه‌ها، وضعیت اعتبار و پیشنهاد اصلاح','documents'],['⌘','توسعه‌دهنده','معماری، API، قرارداد داده و وضعیت قابلیت‌ها','status'],['◈','مترجم و ویراستار','زبان مبنا، اصطلاحات پایدار و هم‌ارزی نسخه‌ها','glossary']];return \`<div class="role-grid">\${roles.map(r=>\`<a href="#/\${r[3]}">\${r[1]}</a>\`).join('')}</div>\`}
const routes={roles:{title:'راهنما براساس نقش',render:rolesPage}};
`);
  await writeFile(path.join(outDir, 'roles/index.html'), `<!doctype html><html><head><title>راهنما براساس نقش</title></head><body><main id="app"><div class="page"><h1>راهنما براساس نقش</h1></div></main></body></html>`);

  await module.applyRecoveredRoleGuides({ outDir });

  const app = await readFile(path.join(outDir, 'app.js'), 'utf8');
  for (const slug of expectedSlugs) {
    assert.match(app, new RegExp(`roles/${slug}`));
    const html = await readFile(path.join(outDir, 'roles', slug, 'index.html'), 'utf8');
    assert.match(html, /data-role-guide=/);
    assert.match(html, /بازگشت به راهنما براساس نقش/);
    assert.doesNotMatch(html, /قبلاً|در روند توسعه قبلی/);
  }

  const parent = await readFile(path.join(outDir, 'roles/index.html'), 'utf8');
  for (const slug of expectedSlugs) assert.match(parent, new RegExp(`/roles/${slug}/`));
});

test('role guides route users to evidence-appropriate next steps', async () => {
  const { ROLE_GUIDES } = await import('../scripts/patch-recovered-role-guides.mjs');
  const bySlug = Object.fromEntries(ROLE_GUIDES.map((guide) => [guide.slug, guide]));

  assert.match(bySlug['new-member'].html, /از اینجا شروع کنید/);
  assert.match(bySlug['active-member'].html, /گروه‌های EarthCoop/);
  assert.match(bySlug.manager.html, /انتخابات پیوسته/);
  assert.match(bySlug.inspector.html, /نظارت/);
  assert.match(bySlug['project-proposer'].html, /پیشنهاد پروژه/);
  assert.match(bySlug['project-proposer'].html, /حمایت.*تأیید|تأیید.*حمایت/);
  assert.match(bySlug['researcher-legal'].html, /اسناد بنیادین/);
  assert.match(bySlug.developer.html, /API.*پایدار|پایدار.*API/);
  assert.match(bySlug['translator-editor'].html, /فرهنگ اصطلاحات/);
});
