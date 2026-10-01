# برنامه تلفیق نسخه‌های پیشنهادی اسناد بنیادین EarthCoop

**تاریخ:** 2026-10-01  
**وضعیت:** برنامه اجرایی کاری — غیرتقنینی  
**هدف:** تولید متن‌های کامل تلفیقی و Concordance بدون ثبت، نفاذ یا تغییر public baseline

> این برنامه فقط شیوه ساخت و راستی‌آزمایی متن‌های پیشنهادی را تعیین می‌کند. اجرای آن به‌خودی‌خود هیچ نسخه‌ای را ثبت یا لازم‌الاجرا نمی‌کند.

---

## ۱. اصول کنترل تلفیق

۱. فایل مبنا و تاریخ حقوقی آن حذف یا بازنویسی نمی‌شود.

۲. اصلاحیه فقط مواد صریحاً اصلاح‌شده را جایگزین می‌کند و مواد جدید فقط با شناسه پایدار بعدی و بدون reuse شناسه تاریخی افزوده می‌شوند.

۳. متن تلفیقی باید provenance ماده‌به‌ماده داشته باشد تا برای هر ماده روشن باشد از base یا amendment آمده است.

۴. تلفیق صرفاً بازنمایی کامل نسخه پیشنهادی است؛ source history همچنان base + amendment باقی می‌ماند.

۵. هر متن تلفیقی باید وضعیت `پیش‌نویس تلفیقی — ثبت‌نشده — غیرنافذ` یا معادل صریح داشته باشد تا با نسخه ثبت‌شده اشتباه نشود.

۶. `document-registry.json`، `docs-manifest.json`، release snapshotها و public baseline تا تصمیم رسمی جداگانه تغییر نمی‌کنند.

۷. Release snapshot ثبت‌شده تاریخی immutable است و برای تولید draft جدید overwrite نمی‌شود.

---

## ۲. زنجیره‌های تلفیق

| سند | زنجیره پیشنهادی تلفیق | خروجی هدف |
| --- | --- | --- |
| FC | FC 1.1 + amendment 1.2 | FC 1.2 full draft |
| CH | CH 1.0 + amendment 1.1 | CH 1.1 full draft |
| CO | CO 1.0 + amendment 1.1 | CO 1.1 full draft |
| EX | EX 1.1 full + amendment 1.2 | EX 1.2 full draft؛ شامل EX-085 |
| ECON | ECON 0.2 full + amendment 0.3 | ECON 0.3 full draft |
| DG | DG 0.2 + amendment 0.3 | DG 0.3 full draft |
| JUD | JUD 0.2 + amendment 0.3 | JUD 0.3 full draft |
| LOC | LOC 0.2 + amendment 0.3 | LOC 0.3 full draft |
| ETH | ETH 0.2 + amendment 0.3 | ETH 0.3 full draft |
| STD | STD 0.1 source → amendment 0.2 → amendment 0.3 | STD 0.3 full draft |
| ECON-REF-01 | REF 0.1 + amendment 0.2 | REF 0.2 full draft |

### قاعده ویژه STD

STD 0.1 در `sources/foundational/STD-0.1/` به‌عنوان base-source provenance نگهداری می‌شود و نباید برای همسان‌سازی ظاهری ویرایش شود. ابتدا متن مبنای 0.1 به ترتیب قراردادی source chunks بازسازی می‌شود، سپس اصلاحیه ثبت‌شده 0.2 و بعد اصلاحیه پیشنهادی 0.3 روی آن اعمال می‌شوند. خروجی باید منبع هر ماده را میان 0.1، 0.2 و 0.3 حفظ کند.

---

## ۳. قرارداد ابزار تلفیق

ابزار `scripts/consolidate-amendment.mjs` باید این قواعد را enforce کند:

- شناسه‌های base یکتا و ترتیبی باشند؛
- amendment بتواند ماده موجود را جایگزین کند؛
- ماده تازه فقط در انتهای شناسه‌های موجود و به‌صورت contiguous افزوده شود؛
- پرش شناسه، reuse یا insertion تاریخی رد شود؛
- heading level سند حفظ شود؛
- ماده تازه پیش از حکم پایانی/Change Log/footer درج شود؛
- provenance برای تمام مواد نهایی تولید شود؛
- hash متن نهایی هر ماده ثبت شود؛
- افزودن ماده تازه source آن را amendment نسخه هدف ثبت کند.

این قرارداد پیش از استفاده برای EX-085 باید با RED → GREEN واقعی آزموده شود.

---

## ۴. محل خروجی draftهای تلفیقی

برای جلوگیری از اختلاط با نسخه ثبت‌شده یا release snapshot، خروجی‌های این مرحله نباید در مسیر release تاریخی نوشته شوند.

مسیر کاری پیشنهادی:

`working/foundational/consolidated/`

و برای provenance:

`working/foundational/provenance/`

این مسیر تا زمان تصمیم درباره ثبت صرفاً working artifact است. پس از تصویب رسمی، artifact ثبت‌شده می‌تواند طبق `REGISTRY_MODEL.md` به ساختار release/registry مربوط منتقل شود.

---

## ۵. Concordance مورد نیاز

برای هر سند یک Concordance حداقل باید شامل موارد زیر باشد:

| فیلد | شرح |
| --- | --- |
| Article ID | شناسه پایدار ماده |
| Base Source | نسخه‌ای که متن مبنا از آن آمده |
| Amendment Source | نسخه اصلاح‌کننده، در صورت وجود |
| Change Type | unchanged / replaced / added |
| Target Version | نسخه پیشنهادی تلفیقی |
| Final SHA-256 | هش متن ماده در خروجی تلفیقی |
| Cross-document impact | اسناد هم‌رتبه/تابع نیازمند review |

Concordance ابزار ردیابی است و خود حکم حقوقی تازه ایجاد نمی‌کند.

---

## ۶. ترتیب اجرای امن

### مرحله E1 — قرارداد ابزار

- تست RED برای افزودن ماده پایدار بعدی؛
- پیاده‌سازی حداقلی؛
- حفظ رفتار تاریخی EX 1.0 → 1.1؛
- Full repository validation.

### مرحله E2 — build plan و fixtureهای واقعی

- تعریف زنجیره ورودی هر سند؛
- تعیین دقیق source معتبر برای هر base/amendment؛
- عدم حدس در فایل‌های ناقص؛
- تست fail-fast برای source گمشده یا نسخه ناسازگار.

### مرحله E3 — تولید working consolidated drafts

- ساخت متن کامل؛
- ساخت provenance؛
- بررسی تعداد و یکتایی شناسه‌ها؛
- بررسی footer/version/status؛
- عدم تغییر registry/manifest.

### مرحله E4 — Concordance و cross-document review

- تولید جدول تغییر مواد؛
- بررسی duplicate authority؛
- بررسی پارامترهای تکراری؛
- بررسی references به نسخه‌های قدیمی؛
- بررسی تغییرات نیازمند migration یا Policy update.

### مرحله E5 — checkpoint حقوقی

پس از سبز بودن همه validationها، یک بسته بازبینی به بنیان‌گذار ارائه می‌شود. فقط پس از تصمیم صریح جداگانه می‌توان درباره ثبت، نفاذ، public-current، registry، manifest و merge نهایی تصمیم گرفت.

---

## ۷. معیار پایان Package E

Package E زمانی آماده بسته‌شدن است که:

- ابزار تلفیق تست‌شده از append امن ماده تازه پشتیبانی کند؛
- همه زنجیره‌های source به‌طور صریح تعیین شده باشند؛
- برای هر سند هدف متن کامل working draft و provenance ساخته شود؛
- Concordance قابل ممیزی موجود باشد؛
- cross-document architecture review بدون blocker باز باشد؛
- CI کامل مخزن سبز باشد؛
- هیچ registry/manifest/release snapshot/public baseline تغییر نکرده باشد.
