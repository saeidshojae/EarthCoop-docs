# گزارش ممیزی بین‌اسنادی بسته 2026-09-20

## دامنه

- FC 1.1
- CH 1.0
- CO 1.0
- EX 1.1
- ECON 0.2
- DG 0.2
- JUD 0.2
- LOC 0.2
- ETH 0.2
- STD 0.2

## سلسله‌مراتب هدف

1. FC
2. CH
3. CO
4. قوانین موضوعی هم‌رتبه در قلمرو خود: ECON / DG / JUD / LOC
5. EX به عنوان سند اجرایی
6. ETH به عنوان سند مکمل اخلاقی
7. STD به عنوان لایه فنی پیاده‌سازی

شماره جلد با مرتبه حقوقی یکسان نیست.

## وضعیت اسناد

### FC 1.1
- تفکیک ترتیب جلد از مرتبه حقوقی.
- تثبیت برتری قانون موضوعی بر EX در قلمرو تخصصی.
- ایجاد ارجاع نسخه‌دار `<DOC>-<VERSION>-<ARTICLE>`.
- الزام Concordance برای بازشماری.

### CH 1.0
در این ممیزی تعارض ماهوی جدیدی با معماری اقتصادی ۰.۲ شناسایی نشد.

### CO 1.0
قانون اساسی، ECON را مرجع جزئیات مالکیت، خزانه، بودجه، سرمایه‌گذاری، ارز، اعتبار، مالیات، بیمه، وام، ضدفساد و ضدانحصار می‌شناسد و با معماری جدید سازگار است.

### EX 1.1
- 10,000 Bahar دیگر Admin Parameter نیست.
- چهار مسیر Activation رعایت می‌شوند.
- Committed Dim از Active Project Fund جداست.
- معیار قراردادی ارزش جای «پشتوانه» را می‌گیرد.
- Participation Point از Money جداست.

### ECON 0.2
Creation، Activation، Transfer، Commitment، Taxation، Cancellation، Retirement، Project Funding، Loan، Insurance، VPU، Advertising، Investment، Guild Cooperatives، Ledger و Policy Governance را پوشش می‌دهد.

### DG 0.2
Ledger separation، AI human review، Backdoor prohibition، Dim restrictions، API integrity و Fundamental Parameter Protection را با ECON همگام می‌کند.

### JUD 0.2
Protective Measure از Final Sanction جداست؛ Restitution Creation نیست؛ Reversal تاریخچه Ledger را پاک نمی‌کند؛ AI-only final adjudication پذیرفته نیست؛ Retirement از estate confiscation جداست.

### LOC 0.2
Commitment از Fund Balance جداست؛ Dim مستقیم وارد صندوق محلی نمی‌شود؛ بودجه تعهدی از نقد واقعی تفکیک می‌شود.

### ETH 0.2
Backdoor مالی و دستکاری Ledger را صریح منع می‌کند؛ Wealth را از Governance Power جدا می‌کند؛ VPU و ابزارهای جدید را پوشش می‌دهد؛ Ethical Finding را از Legal Conviction جدا می‌کند.

### STD 0.2
Event Taxonomy، Ledger separation، Atomicity، Idempotency، Concurrency، Reconciliation، Safe Halt، Fundamental Parameter Lock، Project Commitment Ledger، VPU Registry، Retirement without Coin Tracing و Migration Safety را فنی می‌کند.

## تعارض تاریخی علامت‌گذاری‌شده

هر عبارت در ECON 0.1 که ECON را تابع EX معرفی می‌کرد با وضعیت **Replaced — Hierarchy Correction** منسوخ است.

## ریسک انتشار

Remote مخزن در زمان این بسته از تغییرات محلی جدیدتر Document Reader / Knowledge Center عقب‌تر بود. بنابراین این شاخه باید پیش از Merge نهایی با آخرین کار محلی Rebase/Reconcile شود. ادغام مستقیم در Remote main پیش از آن می‌تواند کارهای منتشرنشده محلی را دور بزند.

## حکم

این بسته از نظر محتوای اقتصادی/سلسله‌مراتب **Formal Registration Candidate** است، اما Merge نهایی تا reconciliation با کارهای محلی جدیدتر مخزن Docs متوقف می‌ماند.
