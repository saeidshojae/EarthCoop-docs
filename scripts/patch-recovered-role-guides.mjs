import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const ROLE_GUIDES_REVISION = '2026-10-02-role-guides-v1';

function guide(slug, icon, title, summary, html) {
  return Object.freeze({ slug, route:`role-${slug}`, icon, title, summary, html });
}

export const ROLE_GUIDES = Object.freeze([
  guide('new-member','◌','عضو تازه‌وارد','از شناخت EarthCoop تا تکمیل عضویت، گروه‌ها و نخستین مشارکت.',`<h2 id="first">از کجا شروع کنم؟</h2><p>اگر تازه وارد EarthCoop شده‌اید، ابتدا <a href="/guides/start/">از اینجا شروع کنید</a> را بخوانید تا تصویر کلی زیست‌بوم، حکمرانی شراکتی و مسیر ورود را ببینید.</p><h2 id="membership">عضویت را کامل کنید</h2><p>حساب خود را ایجاد کنید، قواعد جاری را بپذیرید و اطلاعات هویتی، صنفی و تخصصی و محل سکونت اصلی را تا جامعه پایه حکمرانی معتبر تکمیل کنید. راهنمای <a href="/guides/membership/">عضویت و شهروندی</a> این مسیر را توضیح می‌دهد.</p><h2 id="groups">گروه‌های شما</h2><p>پس از تکمیل اطلاعات، عضویت‌های مرتبط شما در سه خانواده <strong>عمومی</strong>، <strong>تخصصی</strong> شامل علمی و صنفی، و <strong>اختصاصی</strong> شامل سنی و جنسیتی شکل می‌گیرد. برای فهم نقش هر خانواده، <a href="/guides/groups/">گروه‌های EarthCoop</a> را ببینید.</p><h2 id="economy">زندگی اقتصادی</h2><p>برای شناخت بهار، گل، اعتبار اولیه و پیوند مشارکت با پروژه، کار و بازار، به <a href="/guides/economy-cycle/">اقتصاد EarthCoop و چرخه بهار</a> بروید.</p><h2 id="governance">مشارکت و انتخابات</h2><p>وقتی با گروه‌ها و قواعد پایه آشنا شدید، <a href="/guides/elections/">انتخابات پیوسته</a> را بخوانید تا بدانید مسئولیت‌های مدیریتی و بازرسی چگونه شکل می‌گیرند.</p>`),
  guide('active-member','◎','عضو فعال','راهنمای مشارکت روزمره، پیشنهاد، رأی، پروژه و امتیاز مشارکت.',`<h2 id="where-active">کجا عضو فعال هستم؟</h2><p>در جامعه پایه خود می‌توانید مطابق قواعد همان گروه و قابلیت، مشارکت مستقیم داشته باشید. در سطوح بالاتر ممکن است نقش شما ناظر باشد و دامنه عمل متفاوت شود. مبنای این تفاوت در <a href="/guides/groups/">گروه‌های EarthCoop</a> توضیح داده شده است.</p><h2 id="participation">مشارکت روزمره</h2><p>گفت‌وگو، انتشار محتوا، پیشنهاد، نظرسنجی، پروژه و دیگر ابزارها بسته به نوع گروه و وضعیت همان قابلیت در دسترس‌اند. صفحه <a href="/status/">وضعیت واقعی قابلیت‌ها</a> برای دیدن آمادگی فعلی هر بخش است.</p><h2 id="points">امتیاز مشارکت</h2><p>امتیاز مشارکت خودِ پول نیست. مشارکت معتبر می‌تواند برای شما امتیاز ایجاد کند و این امتیاز طبق قواعد معتبر در فعال‌سازی بخشی از بهار کمرنگ نقش داشته باشد. جزئیات اقتصادی را در <a href="/guides/economy-cycle/">چرخه بهار</a> ببینید.</p><h2 id="vote">رأی و مسئولیت</h2><p>اگر شرایط رأی‌دادن در گروه شما برقرار باشد، می‌توانید در انتخابات مشارکت کنید. انتخاب‌شدن به‌عنوان مدیر یا بازرس، حق شخصی رأی شما را به‌عنوان عضو واجد شرایط از بین نمی‌برد. <a href="/guides/elections/">راهنمای انتخابات پیوسته</a> را ببینید.</p>`),
  guide('manager','✓','مدیر گروه','راهنمای پذیرش مسئولیت، اجرا، پاسخ‌گویی و حدود اختیار مدیر.',`<h2 id="becoming-manager">مسئولیت چگونه آغاز می‌شود؟</h2><p>مدیر از مسیر انتخابات و پیشنهاد مستقیم اعضا برگزیده می‌شود و پس از دریافت پیشنهاد مسئولیت باید آن را در مهلت مقرر بپذیرد. چرخه کامل در <a href="/guides/elections/">انتخابات پیوسته</a> توضیح داده شده است.</p><h2 id="duty">وظیفه اصلی مدیر</h2><p>مدیر مسئول اجرای تصمیم‌های معتبر، هماهنگی امور گروه، پیگیری کارها و ارائه گزارش روشن به اعضاست. مدیریت مجوزی برای تصمیم‌گیری خارج از قواعد، حذف نظارت یا استفاده شخصی از منابع عمومی نیست.</p><h2 id="limits">حدود مسئولیت</h2><p>قاعده یک مسئولیت رسمی فعال، تعارض منافع، حدود اختیار و پاسخ‌گویی باید رعایت شود. پذیرش مسئولیت مدیریتی نیز حق شخصی رأی عضو را از بین نمی‌برد.</p><h2 id="money">منابع و پروژه‌ها</h2><p>سمت مدیریتی به‌تنهایی حق برداشت از صندوق یا جابه‌جایی منابع را ایجاد نمی‌کند. هزینه، قرارداد و پروژه باید مرجع معتبر و مسیر ثبت‌شده خود را داشته باشند.</p><h2 id="sources">اسناد مهم برای مدیر</h2><p>برای مسئولیت‌های اجرایی و محلی، به <a href="/documents/ex/">قانون اجرا</a>، <a href="/documents/loc/">قانون جوامع محلی</a> و <a href="/documents/eth/">منشور اخلاقی</a> مراجعه کنید.</p>`),
  guide('inspector','◇','بازرس','راهنمای نظارت مستقل، گزارش، شفافیت و مرز با مدیریت اجرایی.',`<h2 id="role">بازرس چه نقشی دارد؟</h2><p>بازرس مسئول نظارت و بازرسی است و نقش او از مدیریت اجرایی جداست. هدف، حفظ شفافیت، ثبت تخلف یا انحراف و کمک به پاسخ‌گویی ساختار است؛ نه جایگزین‌شدن با مدیر در اداره روزمره.</p><h2 id="election">انتخاب و پذیرش مسئولیت</h2><p>بازرسان نیز از مسیر انتخابات پیوسته و پیشنهاد مستقیم اعضا انتخاب می‌شوند و پس از برگزیده‌شدن باید مسئولیت را بپذیرند. جزئیات در <a href="/guides/elections/">انتخابات پیوسته</a> آمده است.</p><h2 id="oversight">چه چیزهایی را باید پیگیری کنم؟</h2><p>تصمیم‌ها، گزارش مدیران، پروژه‌ها، صندوق‌ها و منابع عمومی، تعارض منافع و رعایت حقوق اعضا از موضوعات اصلی نظارت‌اند. دسترسی به اطلاعات نیز باید با حریم خصوصی و حدود قانونی سازگار باشد.</p><h2 id="report">گزارش و ارجاع</h2><p>گزارش بازرس باید مستند، روشن و قابل پیگیری باشد. تخلفات مهم یا اختلافاتی که از صلاحیت محلی فراتر می‌روند باید به مرجع صالح ارجاع شوند.</p><h2 id="sources">اسناد مهم برای بازرس</h2><p><a href="/documents/loc/">قانون جوامع محلی</a>، <a href="/documents/jud/">قانون قضایی</a> و <a href="/documents/eth/">منشور اخلاقی</a> مراجع اصلی این نقش‌اند.</p>`),
  guide('project-proposer','¤','پیشنهاددهنده پروژه','از صورت‌بندی نیاز و پیشنهاد تا بررسی، تأمین مالی و پیگیری پروژه.',`<h2 id="idea">از نیاز به پیشنهاد پروژه</h2><p>پیشنهاد خوب از یک نیاز روشن آغاز می‌شود: مسئله چیست، چه کسانی ذی‌نفع‌اند، محدوده پروژه کجاست، چه نتیجه‌ای انتظار می‌رود و اجرای آن چه منابع و زمانی می‌خواهد.</p><h2 id="submit">ثبت و بررسی</h2><p>پروژه می‌تواند ابتدا به‌صورت پیش‌نویس ثبت و سپس برای بررسی ارسال شود. در جریان بررسی ممکن است در انتظار بررسی، در حال بررسی، تأیید، رد یا بایگانی قرار گیرد و سابقه تصمیم‌ها باید قابل پیگیری باشد.</p><h2 id="support">حمایت با تأیید یکی نیست</h2><p>اگر یک پیشنهاد به حمایت اعضا نیاز داشته باشد، رسیدن به حد حمایت فقط آن را به مرحله بعد می‌برد؛ <strong>حمایت به معنی تأیید پروژه نیست</strong>. همچنین تأیید پروژه به‌خودی‌خود به معنی انتقال پول یا شروع هزینه‌کرد نیست.</p><h2 id="finance">تأمین مالی و ریسک</h2><p>پیش از تعهد مالی باید مبلغ، ریسک، حقوق مشارکت‌کننده و قرارداد پروژه روشن باشد. فقط منابع فعال و واقعاً منتقل‌شده به صندوق معتبر پروژه قابل هزینه‌اند. سود، بیمه یا تضمین بازگشت سرمایه تنها وقتی وجود دارد که قرارداد معتبر پروژه صریحاً آن را تعریف کند.</p><h2 id="next">بعد از تأیید</h2><p>اجرای پروژه، پیمان‌سپاری، پرداخت و نظارت باید جدا از تصمیم تأیید و با ثبت روشن انجام شوند. برای فهم پیوند پروژه با بهار، <a href="/guides/economy-cycle/">اقتصاد EarthCoop و چرخه بهار</a> را بخوانید و برای آمادگی فعلی ابزارها <a href="/status/">وضعیت قابلیت‌ها</a> را ببینید.</p>`),
  guide('researcher-legal','▤','پژوهشگر یا حقوق‌دان','راهنمای یافتن متن معتبر، سلسله اسناد، نسخه و مرز میان قانون و راهنما.',`<h2 id="start">از متن معتبر شروع کنید</h2><p>برای پژوهش حقوقی یا استناد، نقطه آغاز <a href="/documents/">کتابخانه اسناد بنیادین</a> است. راهنماهای آموزشی برای فهم بهتر نوشته شده‌اند و جای متن رسمی سند را نمی‌گیرند.</p><h2 id="hierarchy">سلسله اسناد</h2><p>سند مادر بالاترین مرجع درون‌سامانه‌ای است. منشور ارزش‌ها و جهت تفسیری را بیان می‌کند و قانون اساسی ساختار و قواعد الزام‌آور را صورت‌بندی می‌کند. قوانین موضوعی و اسناد اجرایی نیز در حدود صلاحیت خود خوانده می‌شوند.</p><h2 id="version">نسخه و اعتبار</h2><p>پیش از استناد، شناسه سند، نسخه، وضعیت اعتبار و تاریخ آن را بررسی کنید. ترتیب نمایش کارت‌ها به‌تنهایی رتبه حقوقی ایجاد نمی‌کند.</p><h2 id="language">زبان و اصطلاح</h2><p>برای تعریف واژه‌ها از <a href="/glossary/">فرهنگ اصطلاحات</a> استفاده کنید. در اختلاف میان خلاصه آموزشی و متن رسمی، متن ثبت‌شده سند مرجع است.</p><h2 id="publication">انتشار و اصلاح</h2><p>برای قواعد انتشار، نسخه‌بندی و نسبت متن‌های منتشرشده، <a href="/documents/publication-policy/">سیاست انتشار اسناد</a> را ببینید.</p>`),
  guide('developer','⌘','توسعه‌دهنده','راهنمای منبع حقیقت، مرز API فعلی و قواعدی که پیاده‌سازی باید رعایت کند.',`<h2 id="truth">منبع حقیقت پیاده‌سازی</h2><p>برای رفتار فعلی محصول، کد و تست‌های مخزن EarthCoop منبع اصلی شواهد فنی‌اند. راهنماها باید با آن رفتار و با اسناد رسمی سازگار بمانند.</p><h2 id="api">وضعیت API</h2><p>EarthCoop مسیرهای واقعی زیر <bdi dir="ltr">/api</bdi> دارد، اما سطح فعلی API هنوز یک <strong>API عمومی پایدار و تضمین‌شده برای مصرف‌کنندگان بیرونی نیست</strong>. وجود یک route یا controller به‌تنهایی به معنی قرارداد نسخه‌دار و پایدار نیست.</p><h2 id="contracts">قرارداد و مجوز</h2><p>در هر تغییر، علاوه بر احراز هویت باید مجوز دامنه، نقش عضو، مالکیت، توپولوژی حکمرانی و قواعد اقتصادی همان عملیات بررسی شود. قراردادهای مهم را از تست‌ها و اسناد مرتبط نتیجه بگیرید، نه از نام route یا شکل یک پاسخ قدیمی.</p><h2 id="readiness">آمادگی قابلیت‌ها</h2><p><a href="/status/">وضعیت واقعی قابلیت‌ها</a> مرز میان قابلیت پیاده‌سازی‌شده، معماری مصوب و بخش‌های نیازمند تأیید عملیاتی را نشان می‌دهد.</p><h2 id="documents">اسناد فنی و دامنه‌ای</h2><p>برای قواعد سامانه به <a href="/documents/std/">استاندارد فنی</a> و برای محدودیت‌های دامنه به اسناد مرتبط مانند <a href="/documents/dg/">حکمرانی دیجیتال</a>، <a href="/documents/loc/">جوامع محلی</a> و <a href="/documents/econ/">اقتصاد</a> مراجعه کنید.</p>`),
  guide('translator-editor','◈','مترجم و ویراستار','راهنمای زبان مبنا، واژگان پایدار، نسخه‌ها و هم‌ارزی ترجمه‌ها.',`<h2 id="canonical">زبان مبنا را مشخص کنید</h2><p>پیش از ترجمه یا ویرایش، زبان مبنا و نسخه همان سند یا راهنما را بررسی کنید. در مجموعه فعلی اسناد بنیادین، فارسی متن مرجع است مگر آنکه برای یک سند به‌طور رسمی وضعیت دیگری ثبت شده باشد.</p><h2 id="terms">واژگان را یکدست نگه دارید</h2><p>نام‌هایی مانند بهار، گل، نجم‌هدا، نجم‌بهار، حکمرانی شراکتی و سه خانواده گروه باید مطابق <a href="/glossary/">فرهنگ اصطلاحات</a> نوشته شوند و در متن‌های مختلف معنای تازه و ناسازگار پیدا نکنند.</p><h2 id="equivalence">ترجمه به معنی هم‌ارزی حقوقی خودکار نیست</h2><p>یک ترجمه فقط زمانی باید هم‌ارز رسمی معرفی شود که وضعیت انتشار و ثبت آن چنین چیزی را تأیید کند. وجود یک فایل قدیمی یا مسیر زبانی به‌تنهایی دلیل اعتبار ترجمه نیست.</p><h2 id="legacy">محتوای قدیمی را به‌عنوان حقیقت جاری بازنشر نکنید</h2><p>هنگام ویرایش، وضعیت فعلی سند یا محصول را ملاک قرار دهید و توضیح‌های مربوط به تاریخچه توسعه را فقط جایی نگه دارید که برای مخاطب لازم باشد.</p><h2 id="publication">پیش از انتشار</h2><p>شناسه، نسخه، تاریخ، زبان، وضعیت اعتبار و پیوندهای داخلی را کنترل کنید و سپس <a href="/documents/publication-policy/">سیاست انتشار اسناد</a> را به‌عنوان مرجع فرایند انتشار بررسی کنید.</p>`),
]);

function wrapRoleGuide(role) {
  return `<div data-role-guide="${role.slug}" data-role-guide-revision="${ROLE_GUIDES_REVISION}"><div class="breadcrumbs"><a href="/">خانه</a><i></i><a href="/roles/">راهنما براساس نقش</a><i></i><span>${role.title}</span></div><div class="article-layout"><article><header class="article-head"><span class="eyebrow">راهنمای نقش‌محور</span><h1>${role.title}</h1><p>${role.summary}</p></header><div class="article-body">${role.html}<div class="callout info"><div><strong>این راهنما از نقش شما شروع می‌کند</strong><p>اگر برای یک تصمیم حقوقی یا مالی به متن الزام‌آور نیاز دارید، سند رسمی مرتبط را نیز بخوانید.</p></div></div><p><a href="/roles/">← بازگشت به راهنما براساس نقش</a></p></div></article></div></div>`;
}

function roleCardsHtml() {
  return ROLE_GUIDES.map((role)=>`<div class="role-card"><span class="role-icon">${role.icon}</span><h3>${role.title.replace(/^راهنمای /,'')}</h3><p>${role.summary}</p><a href="/roles/${role.slug}/">ورود به مسیر ←</a></div>`).join('');
}

export function patchRecoveredRolesIndexHtml(source) {
  const input = String(source);
  const start = input.indexOf('<div class="role-grid"');
  if (start < 0) throw new Error('Recovered roles grid contract changed');
  const openEnd = input.indexOf('>', start) + 1;
  const close = input.indexOf('</div></div></main>', openEnd);
  if (close < 0) throw new Error('Recovered roles grid closing contract changed');
  return `${input.slice(0, openEnd)}${roleCardsHtml()}${input.slice(close)}`;
}

function runtimePatchSource() {
  const definitions = JSON.stringify(ROLE_GUIDES.map(({slug,route,icon,title,summary,html})=>({slug,route,icon,title,summary,html})));
  return `\nconst ROLE_GUIDE_RUNTIME = Object.freeze(${definitions});\nfunction renderRoleGuideRuntime(role){return ${wrapRoleGuide.toString()}(role)}\nObject.assign(pages,Object.fromEntries(ROLE_GUIDE_RUNTIME.map((role)=>[role.route,{title:role.title,desc:role.summary,render:()=>renderRoleGuideRuntime(role)}])));\npages.roles.render=()=>\`<div class="breadcrumbs"><a href="/">خانه</a><i></i><span>نقشه سامانه</span></div><header class="article-head"><span class="eyebrow">ورودی‌های متفاوت</span><h1>راهنما براساس نقش</h1><p>برای هر نقش یک مسیر اختصاصی ساخته شده تا مستقیم به وظایف، حقوق و منابع مرتبط برسید.</p></header><div class="role-grid" style="margin-top:25px">\${ROLE_GUIDE_RUNTIME.map((role)=>\`<div class="role-card"><span class="role-icon">\${role.icon}</span><h3>\${role.title.replace(/^راهنمای /,'')}</h3><p>\${role.summary}</p><a href="/roles/\${role.slug}/">ورود به مسیر ←</a></div>\`).join('')}</div>\`;\n`;
}

export function patchRecoveredRoleGuidesAppSource(source) {
  const input = String(source);
  if (input.includes('const ROLE_GUIDE_RUNTIME = Object.freeze(')) return input;
  const needle = 'window.EC_PAGES = window.EC_PAGES || {};';
  if (!input.includes(needle)) throw new Error('Recovered role-guide app insertion point changed');
  return input.replace(needle, `${runtimePatchSource()}\n${needle}`);
}

export function patchRecoveredRolePageRecords(source) {
  const input = String(source);
  if (input.includes("inventoryId:'page.role-new-member'")) return input;
  const marker = ']);';
  const index = input.lastIndexOf(marker);
  if (index < 0) throw new Error('Recovered role-guide page record contract changed');
  const records = ROLE_GUIDES.map((role)=>`  { inventoryId:'page.${role.route}', route:'${role.route}', title:${JSON.stringify(role.title)}, description:${JSON.stringify(role.summary)}, contentClass:'guide', status:'unofficial_explanation', source:'راهنمای نقش‌محور ممیزی‌شده', sourceType:'editorial', authority:'تحریریه مرکز دانش بر پایه اسناد رسمی و شواهد محصول', version:'1.0.0', reviewedAt:'2026-10-02' },`).join('\n');
  return `${input.slice(0,index)}${records}\n${input.slice(index)}`;
}

function patchRouteMap(source, label) {
  const input = String(source);
  if (input.includes("'role-new-member':'/roles/new-member/'")) return input;
  const needle = "roles:'/roles/',";
  if (!input.includes(needle)) throw new Error(`Recovered role-guide ${label} insertion point changed`);
  const routes = ROLE_GUIDES.map((role)=>` '${role.route}':'/roles/${role.slug}/',`).join('');
  return input.replace(needle, `${needle}${routes}`);
}

function patchStaticHead(template, role) {
  let html = template.replace(/<title>[\s\S]*?<\/title>/, `<title>${role.title} — مرکز دانش ارث‌کوپ</title>`);
  html = html.replace(/<link rel="canonical" href="[^"]+">/, `<link rel="canonical" href="https://docs.earthcoop.ir/roles/${role.slug}/">`);
  return html;
}

function replaceMain(template, body) {
  const replaced = template.replace(/<main id="app"[\s\S]*?<\/main>/, `<main id="app" tabindex="-1" aria-live="polite" aria-atomic="true"><div class="page">${body}</div></main>`);
  if (replaced === template) throw new Error('Recovered role-guide static main contract changed');
  return replaced;
}

export async function applyRecoveredRoleGuides({ outDir }) {
  const appPath = path.join(outDir,'app.js');
  const rolesPath = path.join(outDir,'roles/index.html');
  const recordsPath = path.join(outDir,'src/content/pages.fa.js');
  const seoPath = path.join(outDir,'src/content/seo-routes.js');
  const staticPath = path.join(outDir,'src/render/static-page.js');

  await writeFile(appPath, patchRecoveredRoleGuidesAppSource(await readFile(appPath,'utf8')));
  const roleTemplate = patchRecoveredRolesIndexHtml(await readFile(rolesPath,'utf8'));
  await writeFile(rolesPath, roleTemplate);
  await writeFile(recordsPath, patchRecoveredRolePageRecords(await readFile(recordsPath,'utf8')));
  await writeFile(seoPath, patchRouteMap(await readFile(seoPath,'utf8'),'SEO route'));
  await writeFile(staticPath, patchRouteMap(await readFile(staticPath,'utf8'),'static-page route'));

  for (const role of ROLE_GUIDES) {
    const dir = path.join(outDir,'roles',role.slug);
    await mkdir(dir,{recursive:true});
    const html = replaceMain(patchStaticHead(roleTemplate,role), wrapRoleGuide(role));
    await writeFile(path.join(dir,'index.html'),html);
  }
}
