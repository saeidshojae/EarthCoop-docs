import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const ECONOMY_GUIDE_REVISION = '2026-10-02-economy-story-v1';

const SOURCE_NOTE = 'قانون اقتصاد EarthCoop و قواعد جاری زیست‌بوم';
const START_TEASER_MARKER = 'data-economy-teaser="true"';
const SIDEBAR_ROUTE = 'data-route="economy-cycle"';

export const ECONOMY_GUIDE = Object.freeze({
  route: 'economy-cycle',
  title: 'اقتصاد EarthCoop و چرخه بهار',
  category: 'اقتصاد',
  description: 'بهار و گل چیستند، اعتبار اولیه چگونه کار می‌کند و یک عضو چگونه از مشارکت اجتماعی به پروژه، کار و بازار می‌رسد.',
  reviewedAt: '2026-10-02',
  sourceNote: SOURCE_NOTE,
  bodyHtml: `<div class="lead-box"><strong>اقتصاد EarthCoop با یک نقطه آغاز برابر برای هر انسان طراحی شده است.</strong><p>هر عضو اقتصادی معتبر با ۱۰٬۰۰۰ بهار کمرنگ آغاز می‌کند؛ ظرفیتی اقتصادی که به‌تدریج و طبق قواعد روشن می‌تواند وارد مشارکت، پروژه، کار و مبادله شود.</p></div>
<h2 id="bahar-gol">بهار و گل چیستند؟</h2>
<p><strong>بهار</strong> واحد اصلی پول EarthCoop است. معیار قراردادی ارزش هر بهار برابر <strong>۰٫۱ گرم طلای خالص</strong> است. هر بهار به <strong>۱۰۰ گل</strong> تقسیم می‌شود و هر گل در همین معیار قراردادی معادل <strong>یک میلی‌گرم طلای خالص</strong> است.</p>
<p>اعتبار اولیه ۱۰٬۰۰۰ بهاری هر عضو، در مجموع معیار قراردادی معادل <strong>یک کیلوگرم طلای خالص</strong> دارد. این معیار برای سنجش ارزش است و به معنی تعهد EarthCoop به تحویل یا بازخرید طلای فیزیکی نیست.</p>
<h2 id="dim-active">بهار کمرنگ و بهار فعال</h2>
<p>همه ۱۰٬۰۰۰ بهار اولیه ابتدا به شکل <strong>بهار کمرنگ</strong> ثبت می‌شوند. بهار کمرنگ هنوز پول آزاد برای خرج‌کردن یا انتقال نیست. وقتی بخشی از آن طبق یکی از مسیرهای مجاز فعال شود، به <strong>بهار فعال</strong> تبدیل می‌شود و می‌تواند در چرخه اقتصادی گردش کند.</p>
<p>فعال‌سازی می‌تواند از مسیرهایی مانند حق عضویت، امتیاز مشارکت، پروژه عمومی و فعال‌سازی عمومی برابر انجام شود. امتیاز مشارکت خودِ پول نیست؛ می‌تواند طبق قواعد معتبر، حق فعال‌سازی بخشی از بهار کمرنگ موجود را ایجاد کند.</p>
<h2 id="sara-story">داستان سارا؛ از عضویت تا زندگی اقتصادی</h2>
<p>سارا ۲۷ ساله است و در یک شهر کوچک زندگی می‌کند. یکی از دوستانش او را به EarthCoop دعوت می‌کند. سارا حسابش را می‌سازد، اطلاعات هویتی، صنفی و تخصصی خود را تکمیل می‌کند و محل زندگی‌اش را تا جامعه پایه حکمرانی معتبر ثبت می‌کند.</p>
<p>پس از تکمیل عضویت، سارا در گروه‌های مرتبط خود قرار می‌گیرد: <strong>گروه عمومی</strong> محل زندگی، <strong>گروه‌های تخصصی</strong> علمی و صنفی مرتبط با دانش و حرفه‌اش، و <strong>گروه‌های اختصاصی</strong> سنی و جنسیتی. او حالا هم یک شبکه اجتماعی دارد و هم مسیرهایی برای مشارکت در مسائل واقعی اطرافش.</p>
<h2 id="sara-account">حساب اقتصادی سارا</h2>
<p>سارا توافق مالی را می‌پذیرد و در نجم بهار برای او یک حساب اقتصادی یکتا شکل می‌گیرد. در این حساب ۱۰٬۰۰۰ بهار کمرنگ ثبت می‌شود. این موجودی یک هدیه نقدی فوری نیست؛ نقطه آغاز برابر اقتصادی او در EarthCoop است.</p>
<p>سارا در گفت‌وگوها و فعالیت‌های معتبر گروه‌هایش مشارکت می‌کند، دوستانش را دعوت می‌کند و امتیاز مشارکت به دست می‌آورد. هر جا قواعد معتبر اجازه دهند، این امتیازها می‌توانند به فعال‌شدن بخشی از بهار کمرنگ او کمک کنند.</p>
<h2 id="public-project">از یک پیشنهاد تا پروژه عمومی</h2>
<p>در یکی از گروه‌های محلی، پیشنهاد ساخت یک مجموعه ورزشی برای بانوان مطرح می‌شود. اعضا از پیشنهاد حمایت می‌کنند. وقتی حمایت به حد لازم می‌رسد، پیشنهاد وارد بررسی رسمی می‌شود؛ نیاز، هزینه، زمان، ریسک و شیوه تأمین مالی آن روشن می‌شود و اعضا پیش از تصمیم نهایی می‌دانند چه تعهدی را می‌پذیرند.</p>
<p>سارا تصمیم می‌گیرد بخشی از ظرفیت اقتصادی خود را برای این پروژه متعهد کند. <strong>تعهد</strong> به‌تنهایی پول خرج‌شدنی نیست. طبق قواعد پروژه، مقدار لازم از بهار کمرنگ متعهدشده فعال و سپس به صندوق فعال پروژه منتقل می‌شود. فقط بهار فعال موجود در صندوق پروژه برای اجرای واقعی هزینه می‌شود.</p>
<h2 id="work-and-income">کار، پیمانکاری و درآمد</h2>
<p>در قرارداد اجرای پروژه، رضا ــ یک عضو باتجربه در ساخت‌وساز ــ به‌عنوان پیمانکار برگزیده می‌شود. او تیمی از نیروهای فنی و کارگران را سازمان می‌دهد و پرداخت‌های پروژه از منابع فعال آن انجام می‌شود. در این نقطه، بهار از یک اعتبار اولیه به مزد، قرارداد و فعالیت اقتصادی واقعی تبدیل شده است.</p>
<p>اگر یک پروژه یا سرمایه‌گذاری برای مشارکت‌کنندگان بازده اقتصادی تعریف کند، حق و بازده هر شخص تابع قرارداد همان پروژه است. حضور یک پروژه در EarthCoop به معنی وعده سود قطعی نیست.</p>
<h2 id="market">بازار و کسب‌وکار</h2>
<p>با گسترش چرخه اقتصادی، مهتاب که در گروه صنفی آشپزهای خانگی فعال است می‌تواند محصولاتش را در بازار عرضه کند و در برابر کالا و خدمت بهار فعال دریافت کند. سارا نیز می‌تواند کسب‌وکار خود را راه بیندازد، از شبکه گروه‌های تخصصی برای پیدا کردن همکار و مشتری استفاده کند و درآمد تازه به دست آورد.</p>
<p>به این ترتیب، پول فقط میان حساب‌ها جابه‌جا نمی‌شود؛ به کار، تولید، خدمت، سرمایه‌گذاری و رفع نیازهای واقعی جامعه متصل می‌شود.</p>
<h2 id="many-levels">از جامعه محلی تا پروژه‌های بزرگ‌تر</h2>
<p>یک عضو می‌تواند با توجه به قواعد هر پروژه، فرصت‌های اقتصادی را در حوزه‌های مختلف ببیند: از یک پروژه محلی تا طرح‌های شهری، ملی یا گسترده‌تر. اصل مهم این است که موضوع، ریسک، تعهد مالی و حقوق مشارکت‌کننده پیش از تصمیم روشن باشد.</p>
<h2 id="governance-economy">اقتصاد و حکمرانی کنار هم</h2>
<p>سارا فقط مصرف‌کننده یا سرمایه‌گذار نیست. او در گروه‌هایش گفت‌وگو می‌کند، پیشنهاد می‌دهد، رأی می‌دهد، عملکرد مسئولان را می‌بیند و می‌تواند در انتخاب مدیران و بازرسان واجد شرایط مشارکت کند. اقتصاد EarthCoop قرار است درون همین شبکه شفاف مشارکت و پاسخ‌گویی عمل کند.</p>
<h2 id="whole-cycle">چرخه در یک نگاه</h2>
<p><strong>عضویت → گروه‌ها → اعتبار اولیه برابر → مشارکت و فعال‌سازی → پروژه و کار → بازار و کسب‌وکار → درآمد و سرمایه‌گذاری → نظارت و تصمیم‌گیری جمعی.</strong></p>
<p>همه بخش‌های این چرخه ممکن است در یک زمان و برای همه اعضا در دسترس نباشند؛ اما این داستان نشان می‌دهد اجزای اقتصادی EarthCoop چگونه قرار است در کنار یکدیگر یک زندگی اجتماعی و اقتصادی پیوسته بسازند.</p>`,
  related: Object.freeze([
    Object.freeze(['عضویت و شهروندی', 'membership']),
    Object.freeze(['انتخابات پیوسته', 'elections']),
  ]),
});

const START_TEASER = `<div class="lead-box" ${START_TEASER_MARKER}><strong>اقتصاد EarthCoop با چه پولی کار می‌کند؟</strong><p>واحد اصلی اقتصاد EarthCoop <strong>بهار</strong> و جزء آن <strong>گل</strong> است. هر عضو اقتصادی معتبر با <strong>۱۰٬۰۰۰ بهار کمرنگ</strong> برابر آغاز می‌کند. در راهنمای <a href="/guides/economy-cycle/">اقتصاد EarthCoop و چرخه بهار</a> می‌بینید این اعتبار چگونه به مشارکت، پروژه، کار و بازار پیوند می‌خورد.</p></div>`;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function renderRelated(related) {
  return related.map(([title, route]) => `<a href="/guides/${route}/"><span>مطالعه بعدی</span><strong>${escapeHtml(title)} ←</strong></a>`).join('');
}

function renderEconomyGuide() {
  const toc = [...ECONOMY_GUIDE.bodyHtml.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)]
    .map((match) => `<a href="#${match[1]}" data-anchor>${match[2]}</a>`)
    .join('');
  return `<div class="page" data-guide-revision="2026-10-02-audited-v1" data-economy-guide-revision="${ECONOMY_GUIDE_REVISION}"><div class="breadcrumbs"><a href="/">خانه</a><i></i><span>${ECONOMY_GUIDE.category}</span></div><div class="article-layout"><article><header class="article-head"><span class="eyebrow">${ECONOMY_GUIDE.category}</span><h1>${ECONOMY_GUIDE.title}</h1><p>${ECONOMY_GUIDE.description}</p><div class="meta-row"><span class="badge concept">ممیزی‌شده</span><span class="badge review">زبان مبنا: فارسی</span></div><div class="content-identity"><div class="identity-item"><span>نوع محتوا</span><strong>${ECONOMY_GUIDE.category}</strong></div><div class="identity-item"><span>نسخه صفحه</span><strong><bdi dir="ltr">${ECONOMY_GUIDE_REVISION}</bdi></strong></div><div class="identity-item"><span>سطح اعتبار</span><strong>راهنمای ممیزی‌شده</strong></div><div class="identity-item"><span>بازبینی</span><strong><bdi dir="ltr">${ECONOMY_GUIDE.reviewedAt}</bdi></strong></div></div><div class="source-note"><strong>مبنای فعلی:</strong> ${ECONOMY_GUIDE.sourceNote}</div></header><div class="article-body">${ECONOMY_GUIDE.bodyHtml}<div class="section-title"><div><span class="eyebrow">ادامه مسیر</span><h2>مطالب مرتبط</h2></div></div><div class="related">${renderRelated(ECONOMY_GUIDE.related)}</div></div></article><aside class="toc"><strong>در این صفحه</strong>${toc}</aside></div></div>`;
}

function patchEconomyHead(source) {
  const input = String(source ?? '');
  const close = input.indexOf('</head>');
  if (close < 0) throw new Error('Recovered guide head marker changed');
  let head = input.slice(0, close);
  const tail = input.slice(close);
  head = head
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${ECONOMY_GUIDE.title} — مرکز دانش ارث‌کوپ</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${ECONOMY_GUIDE.description}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${ECONOMY_GUIDE.title} — مرکز دانش ارث‌کوپ">`)
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${ECONOMY_GUIDE.description}">`)
    .replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${ECONOMY_GUIDE.title} — مرکز دانش ارث‌کوپ">`)
    .replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${ECONOMY_GUIDE.description}">`)
    .replaceAll('/guides/membership/', '/guides/economy-cycle/')
    .replaceAll('عضویت و شهروندی', ECONOMY_GUIDE.title)
    .replaceAll('شرایط عضویت، هویت و مسئولیت شهروندی شراکتی در ارث‌کوپ.', ECONOMY_GUIDE.description);
  return `${head}${tail}`;
}

function patchMain(source, body) {
  const pattern = /<main id="app"[^>]*>[\s\S]*?<\/main>/;
  if (!pattern.test(source)) throw new Error('Recovered guide main marker changed');
  return source.replace(pattern, `<main id="app" tabindex="-1" aria-live="polite" aria-atomic="true">${body}</main>`);
}

export function patchRecoveredStartEconomyTeaser(source) {
  const input = String(source ?? '');
  if (input.includes(START_TEASER_MARKER)) return input;
  const marker = '<h2 id="next-step">از کجا ادامه دهیم؟</h2>';
  if (!input.includes(marker)) throw new Error('Recovered start guide economy teaser marker changed');
  return input.replace(marker, `${START_TEASER}\n${marker}`);
}

export function patchRecoveredEconomySidebar(source) {
  const input = String(source ?? '');
  if (input.includes(SIDEBAR_ROUTE)) return input;
  const membership = /(<a href="\/guides\/membership\/" data-route="membership">[\s\S]*?<\/a>)(\s*)(<a href="\/guides\/elections\/" data-route="elections">)/;
  if (!membership.test(input)) throw new Error('Recovered guide sidebar membership/elections marker changed');
  return input.replace(membership, `$1$2<a href="/guides/economy-cycle/" data-route="economy-cycle"><span class="nav-icon">◍</span>اقتصاد و چرخه بهار</a>$2$3`);
}

export function patchRecoveredEconomyAppSource(source) {
  let output = String(source ?? '');
  if (output.includes('const ECONOMY_GUIDE_REVISION=')) return output;
  const marker = 'const AUDITED_GUIDE_REVISION=';
  if (!output.includes(marker)) throw new Error('Recovered audited guide app marker changed');
  const economyOverride = `pages["economy-cycle"]=article(${JSON.stringify(ECONOMY_GUIDE.title)},${JSON.stringify(ECONOMY_GUIDE.category)},${JSON.stringify(ECONOMY_GUIDE.description)},"verified",${JSON.stringify(ECONOMY_GUIDE.bodyHtml)},${JSON.stringify(ECONOMY_GUIDE.related)});\nconst ECONOMY_GUIDE_REVISION=${JSON.stringify(ECONOMY_GUIDE_REVISION)};\nconst ECONOMY_START_TEASER=${JSON.stringify(START_TEASER)};\nif(pages.start?.render){const originalEconomyStartRender=pages.start.render;pages.start.render=()=>{const html=originalEconomyStartRender();return html.includes(${JSON.stringify(START_TEASER_MARKER)})?html:html.replace('<h2 id="next-step">از کجا ادامه دهیم؟</h2>',ECONOMY_START_TEASER+'<h2 id="next-step">از کجا ادامه دهیم؟</h2>');};}\n`;
  return output.replace(marker, `${economyOverride}${marker}`);
}

async function htmlFiles(dir) {
  const output = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) output.push(...await htmlFiles(absolute));
    else if (entry.isFile() && entry.name.endsWith('.html')) output.push(absolute);
  }
  return output;
}

export async function applyRecoveredEconomyGuide({ outDir }) {
  if (!outDir) throw new TypeError('outDir is required');

  const membershipPath = path.join(outDir, 'guides', 'membership', 'index.html');
  const economyDir = path.join(outDir, 'guides', ECONOMY_GUIDE.route);
  const economyPath = path.join(economyDir, 'index.html');
  const membershipShell = await readFile(membershipPath, 'utf8');
  await mkdir(economyDir, { recursive: true });
  let economyHtml = patchEconomyHead(membershipShell);
  economyHtml = patchMain(economyHtml, renderEconomyGuide());
  await writeFile(economyPath, economyHtml);

  const startPath = path.join(outDir, 'guides', 'start', 'index.html');
  const start = patchRecoveredStartEconomyTeaser(await readFile(startPath, 'utf8'));
  await writeFile(startPath, start);

  let sidebarCount = 0;
  for (const filePath of await htmlFiles(outDir)) {
    const source = await readFile(filePath, 'utf8');
    if (source.includes(SIDEBAR_ROUTE)) continue;
    if (!source.includes('data-route="membership"') || !source.includes('data-route="elections"')) continue;
    await writeFile(filePath, patchRecoveredEconomySidebar(source));
    sidebarCount += 1;
  }
  if (sidebarCount === 0) throw new Error('Recovered economy guide found no static navigation to patch');

  const appPath = path.join(outDir, 'app.js');
  await writeFile(appPath, patchRecoveredEconomyAppSource(await readFile(appPath, 'utf8')));
}
