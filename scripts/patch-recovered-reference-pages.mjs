import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { patchRecoveredEditorialPagesSource } from './patch-recovered-editorial-pages.mjs';

export const AUDITED_REFERENCE_REVISION = '2026-10-02-reference-audit-v1';

const wrap = (html) => `<div data-reference-audit-revision="${AUDITED_REFERENCE_REVISION}">${html}</div>`;

export function renderAuditedGlossaryPage() {
  const terms = [
    ['ارث‌کوپ','زیست‌بومی اجتماعی، اقتصادی و مشارکتی برای پیوند دادن عضویت، گروه‌ها، حکمرانی شراکتی، اقتصاد، پروژه‌ها و اسناد مشترک از سطح محلی تا جهانی.'],
    ['حق انتفاع برابر','حق بنیادین انسان‌ها برای بهره‌مندی مسئولانه و عادلانه از زمین و منابع بنیادین، در کنار مسئولیت نسبت به طبیعت و نسل‌های آینده.'],
    ['حکمرانی شراکتی','شیوه‌ای از اداره امور که در آن اعضا از راه گفت‌وگو، پیشنهاد، رأی، انتخاب مسئولان و نظارت در تصمیم‌های مشترک مشارکت می‌کنند.'],
    ['کشور دیجیتال','تمثیل آموزشی و چشم‌انداز EarthCoop برای فهم یک زیست‌بوم بدون مرز با زندگی اجتماعی، اقتصادی و حکمرانی شراکتی؛ نه ادعای کشور مستقل یا جایگزین دولت‌ها.'],
    ['شهروندی دیجیتال','تمثیلی برای عضویت و زندگی در زیست‌بوم EarthCoop؛ به معنی تابعیت حقوقی یک کشور مستقل نیست.'],
    ['جامعه پایه حکمرانی','پایین‌ترین حوزه معتبر حکمرانی در محل زندگی یک عضو؛ بسته به ساختار واقعی محل می‌تواند محله، منطقه، روستا، شهر یا سطح معتبر دیگری باشد.'],
    ['گروه عمومی','گروه سیستمی مکانی که اعضای واجد شرایط یک حوزه را به یکدیگر متصل می‌کند.'],
    ['گروه تخصصی','خانواده گروه‌های علمی و صنفی مرتبط با دانش، تخصص یا حرفه اعضا.'],
    ['گروه اختصاصی','خانواده گروه‌های سنی و جنسیتی که برای نیازها و موضوعات اختصاصی اعضا شکل می‌گیرند.'],
    ['عضو فعال','عضوی که در جامعه پایه خود امکان مشارکت مستقیم مطابق قواعد همان گروه و قابلیت را دارد.'],
    ['ناظر','عضوی که در یک سطح یا گروه بالاتر امکان مشاهده و پیگیری دارد، بدون آنکه لزوماً همه حقوق مشارکت مستقیم آن سطح را داشته باشد.'],
    ['نجم','نام خانواده نرم‌افزارهای جامع مدیریتی EarthCoop که هرکدام یک حوزه از زیست‌بوم را پوشش می‌دهند.'],
    ['نجم‌هدا','مخفف «نرم‌افزار جامع مدیریت هوشمند دنیای ارث‌کوپ»؛ دستیار و هماهنگ‌کننده هوشمند زیست‌بوم EarthCoop.'],
    ['نجم‌بهار','مخفف «نرم‌افزار جامع مدیریت بانکی هوشمند ارث‌کوپ»؛ سامانه مالی و اقتصادی EarthCoop.'],
    ['بهار','واحد اصلی پول EarthCoop. معیار قراردادی ارزش هر بهار برابر ۰٫۱ گرم طلای خالص است؛ این معیار به معنی تعهد تحویل طلای فیزیکی نیست.'],
    ['گل','زیرواحد بهار؛ هر ۱ بهار برابر ۱۰۰ گل است و هر گل در معیار قراردادی برابر یک میلی‌گرم طلای خالص است.'],
    ['بهار کمرنگ','بهاری که ایجاد شده اما هنوز فعال نیست و تا زمان فعال‌سازی، پول آزاد برای خرج یا انتقال محسوب نمی‌شود.'],
    ['بهار فعال','بخشی از بهار که طبق قواعد معتبر فعال شده و می‌تواند در چرخه اقتصادی مجاز استفاده شود.'],
    ['فعال‌سازی','تبدیل بخشی از بهار کمرنگ موجود به بهار فعال طبق قواعد معتبر، بدون افزایش خودکار اعتبار اولیه عضو.'],
    ['امتیاز مشارکت','امتیازی غیرپولی برای مشارکت معتبر اعضا که می‌تواند طبق قواعد، در فعال‌سازی بخشی از بهار کمرنگ نقش داشته باشد.'],
    ['پروژه عمومی','پروژه‌ای که از یک نیاز یا پیشنهاد جمعی شکل می‌گیرد و تصمیم، تأمین مالی، اجرا و نظارت آن تابع قواعد شفاف پروژه است.'],
    ['سهم ارزش','واحد مشارکت ارزشی قراردادی برای نمایش بخشی از ارزش یک اثر یا پروژه؛ به‌خودی‌خود مالکیت، حق رأی یا حکمرانی ایجاد نمی‌کند.'],
    ['مدیر','مسئول اجرایی منتخب در ساختار مربوط، با حدود اختیار و پاسخ‌گویی مشخص.'],
    ['بازرس','مسئول منتخب نظارت و بازرسی که نقش او از مدیریت اجرایی جداست.'],
  ];
  return wrap(`<div class="breadcrumbs"><a href="#/home">خانه</a><i></i><span>مراجع</span></div><header class="article-head"><span class="eyebrow">زبان مشترک</span><h1>فرهنگ اصطلاحات</h1><p>تعریف‌های این صفحه برای فهم یکسان راهنماها، اسناد و رابط EarthCoop نوشته شده‌اند.</p></header><div class="glossary-list" style="margin-top:25px">${terms.map(([term,definition])=>`<div class="glossary-item"><h3>${term}</h3><p>${definition}</p></div>`).join('')}</div>`);
}

export function renderAuditedMapPage() {
  return wrap(`<div class="breadcrumbs"><a href="#/home">خانه</a><i></i><span>نقشه سامانه</span></div><header class="article-head"><span class="eyebrow">تصویر کلان</span><h1>نقشه کامل ارث‌کوپ</h1><p>برای فهم EarthCoop می‌توان آن را یک زیست‌بوم پیوسته دید: انسان وارد می‌شود، به جامعه و گروه‌هایش متصل می‌شود، مشارکت می‌کند، وارد چرخه اقتصادی می‌شود و در حکمرانی و پاسخ‌گویی نقش می‌گیرد.</p><div class="callout info"><div><strong>این نقشه برای فهم ارتباط اجزاست</strong><p>برای دیدن اینکه هر قابلیت امروز در چه سطحی از آمادگی قرار دارد، صفحه «وضعیت واقعی قابلیت‌ها» را ببینید.</p></div></div></header><div class="system-map"><div class="map-column"><div class="map-label">ورود و تعلق</div><div class="map-node"><h3>عضویت و هویت</h3><p>پذیرش قواعد، تکمیل اطلاعات لازم و یک حساب برای هر عضو.</p></div><div class="map-node"><h3>محل زندگی و جامعه پایه</h3><p>اتصال عضو به پایین‌ترین حوزه معتبر حکمرانی در ساختار واقعی محل زندگی.</p></div><div class="map-node"><h3>سه خانواده گروه</h3><p><strong>عمومی</strong>، <strong>تخصصی</strong> شامل علمی و صنفی، و <strong>اختصاصی</strong> شامل سنی و جنسیتی.</p></div></div><div class="map-column"><div class="map-label">زندگی شراکتی</div><div class="map-node core"><h3>حکمرانی شراکتی</h3><p>گفت‌وگو، پیشنهاد، رأی، انتخابات، مسئولیت و نظارت در شبکه‌ای از جامعه پایه تا سطوح گسترده‌تر.</p></div><div class="map-node"><h3>اقتصاد؛ بهار و گل</h3><p>اعتبار اولیه، فعال‌سازی، کار، پروژه، سرمایه‌گذاری و مبادله در چارچوب قواعد نجم‌بهار.</p></div><div class="map-node"><h3>پروژه، کار و بازار</h3><p>پیوند دادن نیازهای واقعی با پیشنهاد، تأمین مالی، اجرا، کالا، خدمت و درآمد.</p></div></div><div class="map-column"><div class="map-label">ابزار و مرجع</div><div class="map-node"><h3>نجم‌هدا</h3><p>نرم‌افزار جامع مدیریت هوشمند دنیای ارث‌کوپ؛ دستیار و هماهنگ‌کننده هوشمند زیست‌بوم.</p></div><div class="map-node"><h3>نجم‌بهار</h3><p>نرم‌افزار جامع مدیریت بانکی هوشمند ارث‌کوپ؛ زیرساخت مالی و اقتصادی زیست‌بوم.</p></div><div class="map-node"><h3>اسناد بنیادین و نجم‌های آینده</h3><p>اسناد، قواعد مشترک را تعیین می‌کنند و خانواده نجم‌ها به‌مرور برای حوزه‌های مدیریتی دیگر گسترش می‌یابد.</p></div></div></div><div class="section-title"><div><span class="eyebrow">چرخه یک عضو</span><h2>از شناخت تا اثرگذاری</h2></div></div><div class="journey-bar"><a href="#/start"><strong>۱</strong>شناخت</a><a href="#/membership"><strong>۲</strong>عضویت</a><a href="#/groups"><strong>۳</strong>تعلق</a><a href="#/economy-cycle"><strong>۴</strong>زندگی اقتصادی</a><a href="#/elections"><strong>۵</strong>مشارکت</a><a href="#/documents"><strong>۶</strong>پاسخ‌گویی</a></div>`);
}

export function renderAuditedStatusPage() {
  const rows = [
    ['ثبت‌نام و عضویت','پیاده‌سازی موجود','verified','ثبت‌نام چندمرحله‌ای، پذیرش قواعد و تکمیل پروفایل در مخزن جاری وجود دارد.','registration · profile · membership'],
    ['ورود با گوگل','کد و آزمون موجود؛ عملیات جداگانه','review','جریان Google OAuth و آزمون‌های ثبت‌نام آن در مخزن وجود دارد؛ فعال بودن کلیدها و سرویس بیرونی باید در محیط زنده تأیید شود.','GoogleController · GoogleOAuthRegistrationTest'],
    ['گروه‌ها و گفت‌وگو','پیاده‌سازی گسترده','verified','گفت‌وگو و مشارکت گروهی همراه با کنترل دسترسی و مجموعه آزمون‌های اختصاصی در مخزن دیده می‌شود.','tests/Feature/GroupChat'],
    ['انتخابات پیوسته','هسته پیاده‌سازی شده','verified','چرخه انتخابات، سیاست‌ها، مسئولیت مدیر و بازرس و آزمون‌های مربوط در مخزن جاری وجود دارد؛ رفتار محیط زنده جداگانه UAT می‌شود.','tests/Feature/Elections'],
    ['نجم‌بهار و اعتبار عضویت','قاعده و آزمون موجود','verified','اعتبار آغازین عضو اقتصادی ۱۰٬۰۰۰ بهار است و ابتدا به‌صورت بهار کمرنگ ثبت می‌شود؛ فعال‌سازی تابع قواعد معتبر است.','NajmBaharConstitution · InitialMembershipCreditTest'],
    ['دعوت اعضای جدید','امتیاز مشارکت','verified','دعوت موفق برای دعوت‌کننده امتیاز مشارکت ثبت می‌کند؛ این امتیاز پول مستقیم نیست و استفاده از آن تابع قواعد فعال‌سازی است.','InvitationLifecycleService'],
    ['مکان و حکمرانی','معماری جاری؛ استقرار نیازمند کنترل','review','مدل مکان، جامعه پایه و عضویت‌های وابسته در مخزن وجود دارد؛ صحت داده‌ها و مهاجرت محیط زنده باید در UAT همان محیط تأیید شود.','LocationGovernance · readiness checks'],
    ['اعلان و پشتیبانی','کد موجود؛ کیفیت زنده نیازمند UAT','review','اعلان‌ها و مسیرهای پشتیبانی در محصول وجود دارند؛ تحویل واقعی اعلان و وابستگی‌های بیرونی با مشاهده کد به‌تنهایی اثبات نمی‌شود.','NotificationController · TicketController'],
    ['API عمومی','قرارداد در حال تکامل','review','مسیرهای API وجود دارند، اما مستندات فعلی آن‌ها را یک قرارداد عمومی نهایی و تغییرناپذیر معرفی نمی‌کند.','api/v1 · contract tests'],
  ];
  return wrap(`<div class="breadcrumbs"><a href="#/home">خانه</a><i></i><span>مراجع</span></div><header class="article-head"><span class="eyebrow">اعتماد از راه شفافیت</span><h1>وضعیت واقعی قابلیت‌ها</h1><p>این صفحه آنچه را از مخزن جاری می‌توان با اطمینان گفت از چیزهایی که هنوز به تأیید محیط زنده نیاز دارند جدا می‌کند.</p><div class="content-identity"><div class="identity-item"><span>شاخه مبنا</span><strong><bdi dir="ltr">main</bdi></strong></div><div class="identity-item"><span>نسخه ممیزی‌شده</span><strong><bdi dir="ltr">f88c28a</bdi></strong></div><div class="identity-item"><span>تاریخ ممیزی</span><strong><bdi dir="ltr">۲۰۲۶-۱۰-۰۲</bdi></strong></div><div class="identity-item"><span>روش</span><strong>کد + آزمون + اسناد جاری</strong></div></div></header><div class="callout warn"><div><strong>مرز اطمینان</strong><p>وجود قابلیت در کد به‌تنهایی به معنی فعال بودن همه تنظیمات، سرویس‌های بیرونی یا داده‌های لازم در محیط زنده نیست. هرجا چنین وابستگی‌ای وجود دارد، وضعیت «نیازمند تأیید عملیاتی» درج شده است.</p></div></div><div class="status-legend"><span class="badge verified">شاهد مستقیم در مخزن</span><span class="badge review">نیازمند تأیید عملیاتی</span></div><div class="status-wrap"><table class="status-table status-table--audit"><thead><tr><th>قابلیت</th><th>جمع‌بندی</th><th>آنچه می‌توان گفت</th><th>شاهد</th></tr></thead><tbody>${rows.map(r=>`<tr><td><strong>${r[0]}</strong></td><td><span class="badge ${r[2]}">${r[1]}</span></td><td>${r[3]}</td><td><bdi dir="ltr" class="evidence">${r[4]}</bdi></td></tr>`).join('')}</tbody></table></div><div class="callout info"><div><strong>قاعده این صفحه</strong><p>هر قابلیت تازه تنها زمانی «تأییدشده» معرفی می‌شود که شاهد قابل‌ردگیری داشته باشد. موارد وابسته به استقرار یا سرویس بیرونی تا زمان تأیید عملیاتی با همان برچسب باقی می‌مانند.</p></div></div>`);
}

function patchAppSource(source) {
  const input = String(source);
  if (input.includes(`data-reference-audit-revision=\\"${AUDITED_REFERENCE_REVISION}`) || input.includes(`data-reference-audit-revision="${AUDITED_REFERENCE_REVISION}`)) return input;
  const start = input.indexOf('function statusPage(){');
  const end = input.indexOf('function rolesPage(){');
  if (start < 0 || end < 0 || end <= start) throw new Error('Recovered reference-page SPA patch point changed');
  const functions = `function statusPage(){return \`${renderAuditedStatusPage()}\`}\nfunction glossaryPage(){return \`${renderAuditedGlossaryPage()}\`}\nfunction mapPage(){return \`${renderAuditedMapPage()}\`}\n`;
  return `${input.slice(0, start)}${functions}${input.slice(end)}`;
}

function patchStaticHtml(source, body) {
  const input = String(source);
  if (input.includes(`data-reference-audit-revision="${AUDITED_REFERENCE_REVISION}"`)) return input;
  const replaced = input.replace(/<main id="app"[^>]*>[\s\S]*?<\/main>/, `<main id="app" tabindex="-1" aria-live="polite" aria-atomic="true"><div class="page">${body}</div></main>`);
  if (replaced === input) throw new Error('Recovered reference-page static patch point changed');
  return replaced;
}

export async function applyRecoveredReferencePagesAudit({ outDir }) {
  const appPath = path.join(outDir, 'app.js');
  await writeFile(appPath, patchAppSource(await readFile(appPath, 'utf8')));

  const pagesPath = path.join(outDir, 'src', 'content', 'pages.fa.js');
  await writeFile(pagesPath, patchRecoveredEditorialPagesSource(await readFile(pagesPath, 'utf8')));

  for (const [route, renderer] of [['glossary', renderAuditedGlossaryPage], ['map', renderAuditedMapPage], ['status', renderAuditedStatusPage]]) {
    const pagePath = path.join(outDir, route, 'index.html');
    await writeFile(pagePath, patchStaticHtml(await readFile(pagePath, 'utf8'), renderer()));
  }
}
