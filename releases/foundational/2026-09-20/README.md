# بسته انتشار اسناد بنیادین EarthCoop — 2026-09-20

این پوشه بسته رسمی آماده‌سازی نسخه‌های جدید اسناد بنیادین EarthCoop پیش از ثبت نهایی در شاخه اصلی است.

## وضعیت

- شاخه انتشار: `legal/foundational-2026-09-20-freeze`
- وضعیت بسته: **Freeze / Formal Registration Candidate**
- زبان مبنا: فارسی
- مخزن: `saeidshojae/EarthCoop-docs`
- این بسته عمداً نسخه‌های تاریخی را حذف یا بازنویسی نمی‌کند.

## نسخه‌های هدف

| جلد | شناسه | نسخه جاری هدف | وضعیت |
|---:|:---:|:---:|---|
| ۰ | FC | 1.1 | Freeze Candidate |
| ۱ | CH | 1.0 | بدون تغییر |
| ۲ | CO | 1.0 | بدون تغییر |
| ۳ | EX | 1.1 | Registration Candidate |
| ۴ | ECON | 0.2 | Freeze Candidate |
| ۵ | DG | 0.2 | Registration Candidate |
| ۶ | JUD | 0.2 | Registration Candidate |
| ۷ | LOC | 0.2 | Registration Candidate |
| ۸ | ETH | 0.2 | Registration Candidate |
| ۹ | STD | 0.2 | Registration Candidate |

## اصل نسخه‌بندی

نسخه‌های پیشین با وضعیت Historical / Superseded حفظ می‌شوند. هیچ نسخه قدیمی نباید بی‌ردپا overwrite یا حذف شود.

ارجاع کامل به مواد نسخه‌های جدید باید از قالب زیر پیروی کند:

`<DOC>-<VERSION>-<ARTICLE>`

نمونه: `ECON-0.2-030`

## ترتیب ثبت

1. ثبت متن نسخه‌های جدید و اصلاحیه‌ها در این بسته.
2. ثبت Concordance رسمی.
3. اجرای ممیزی بین‌اسنادی.
4. همگام‌سازی رجیستری جاری.
5. Rebase/merge با آخرین `main` پس از همگام‌شدن تغییرات محلی منتشرنشده مخزن Docs.
6. فقط پس از آن، به‌روزرسانی ناوبری عمومی و انتشار Mintlify.

## نکته مهم درباره Remote

در زمان ایجاد این بسته، Remote GitHub از تغییرات محلی جدیدتر مرکز دانش/Document Reader عقب‌تر بود. به همین علت این بسته روی شاخه مستقل قرار گرفته و نباید پیش از reconciliation با آن تغییرات مستقیماً روی `main` ادغام شود.
