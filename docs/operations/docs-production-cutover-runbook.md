# راهنمای عملیاتی انتقال مرکز اسناد EarthCoop به Production

این سند برای انتقال کنترل‌شده مرکز اسناد از Preview به `https://docs.earthcoop.ir` است. **اجرای اولین استقرار Production فقط پس از تأیید صریح مالک پروژه مجاز است.** آماده‌سازی فنی، CI و ساخت artifact به‌تنهایی مجوز انتشار نیست.

## مرز ایمنی

- هیچ workflow این سند DNS را تغییر نمی‌دهد و هیچ تغییر DNS خودکار نیست.
- Preview در `docs-preview.earthcoop.ir` مستقل و `noindex` باقی می‌ماند.
- Production فقط از artifact با `deploymentTarget=production`، `indexing=enabled` و `canonicalOrigin=https://docs.earthcoop.ir` استفاده می‌کند.
- هر انتشار و هر rollback باید با `deployment-manifest.json` و SHA دقیق پس از FTPS تأیید شود.

## گیت Go/No-Go پیش از اولین انتشار

**Go** فقط وقتی مجاز است که همه موارد زیر سبز باشند:

1. PR مرکز اسناد Full Validation سبز داشته باشد و Production candidate بدون upload ساخته و با `validate-recovered-production-artifact.mjs` تأیید شده باشد.
2. Preview روی همان نسل کد سالم باشد: زبان فارسی/انگلیسی، Search، Dark Mode، خوانشگر اسناد، PDF/دانلود و ۳۱ راهنمای انگلیسی.
3. PR مخزن اصلی EarthCoop لینک‌های اسناد را به مسیرهای پایدار بدون hash و `econ-ref-01` منتقل کرده باشد.
4. چهار secret مستقل Production تنظیم شده باشند: `DOCS_PROD_FTP_SERVER`، `DOCS_PROD_FTP_USERNAME`، `DOCS_PROD_FTP_PASSWORD` و `DOCS_PROD_FTP_SERVER_DIR`.
5. artifact بازگشت‌پذیر آخرین نسخه سالم Production یا، برای اولین انتشار، snapshot کامل مقصد قبل از overwrite در دسترس باشد.
6. مالک پروژه عبارت تأیید صریح برای آغاز cutover را اعلام کند.

هر مورد نامشخص = **No-Go**.

## اجرای استقرار

1. workflow دستی `Deploy docs production` را باز کنید.
2. `source_ref` را دقیقاً روی SHA تأییدشده قرار دهید.
3. عبارت `DEPLOY DOCS PRODUCTION` را در `confirmation` وارد کنید.
4. workflow ابتدا تست‌ها، manifest، terminology و translation freshness را اجرا می‌کند.
5. artifact Production با `--target production --canonical-origin https://docs.earthcoop.ir` ساخته و validator مستقل روی آن اجرا می‌شود.
6. همان artifact قبل از FTPS با نام شامل SHA در GitHub Actions ذخیره می‌شود تا برای rollback قابل استفاده باشد.
7. upload با strict FTPS و `dangerous-clean-slate: false` انجام می‌شود.
8. مرحله آخر `https://docs.earthcoop.ir/deployment-manifest.json` را می‌خواند و SHA، baseline، target، indexing و canonical origin را تطبیق می‌دهد.

موفقیت workflow بدون موفقیت مرحله آخر به‌معنای استقرار موفق نیست.

## Smoke test پس از cutover

پس از سبزشدن live-manifest verification این مسیرها و رفتارها بررسی شوند:

- `/` — پوسته فارسی، Search و Dark Mode.
- `/documents/` — ده سند بنیادین و یک سند مرجع.
- `/documents/fc/` و `/documents/econ-ref-01/` — خوانشگر، فهرست، چاپ و PDF.
- `/en/` — پوسته LTR و راهنماهای انگلیسی.
- تغییر FA → EN → FA روی چند مسیر.
- `robots.txt` — Production را به‌طور کلی مسدود نکند و sitemap تولیدی را معرفی کند.
- `sitemap.xml` — فقط `https://docs.earthcoop.ir` را منتشر کند.
- canonical و OG حداقل روی صفحه خانه، یک سند و یک راهنمای انگلیسی فقط به دامنه Production اشاره کنند.

## معیار rollback

Rollback فوری انجام شود اگر هر یک از این موارد رخ دهد: manifest زنده با SHA هدف تطبیق نکند، پوسته/JS اصلی بالا نیاید، اسناد رسمی یا PDFها قابل دسترسی نباشند، canonical به Preview نشت کند، یا Production به‌اشتباه `noindex` سراسری شود.

### روش rollback

1. artifact id نسخه سالم قبلی و `expected_source_sha` آن را از GitHub Actions بردارید.
2. workflow دستی `Rollback docs production` را اجرا کنید.
3. عبارت `ROLLBACK DOCS PRODUCTION` را وارد کنید.
4. workflow artifact ذخیره‌شده را از GitHub Actions دریافت می‌کند، پیش از upload با Production validator و SHA مورد انتظار کنترل می‌کند، سپس با strict FTPS بازمی‌گرداند.
5. مرحله پایانی `deployment-manifest.json` زنده را با SHA نسخه بازگردانده‌شده مقایسه می‌کند.
6. پس از rollback همان Smoke test بالا دوباره اجرا شود.

## DNS

هیچ‌یک از workflowهای deploy یا rollback مجاز به تغییر DNS نیستند. اگر برای اولین cutover تغییر DNS واقعاً لازم باشد، آن اقدام یک checkpoint مستقل و دستی است و فقط پس از تأیید صریح مالک انجام می‌شود.

## پس از پایداری Production

پس از تأیید عملیاتی و پایان دوره مشاهده، `https://docs.earthcoop.ir/sitemap.xml` در Google Search Console ثبت/بازبینی می‌شود و indexing صفحات عمومی کنترل می‌گردد. Preview هرگز برای indexing یا Search Console به‌عنوان منبع اصلی معرفی نمی‌شود.
