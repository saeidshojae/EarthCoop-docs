# اصلاحیه قانون حکمرانی دیجیتال EarthCoop
## DG 0.2 — همگام‌سازی با ECON 0.2 و STD 0.2

**شناسه:** DG  
**نسخه جدید:** ۰.۲  
**نسخه مبنا:** DG 0.1  
**وضعیت:** Registration Candidate  
**زبان مبنا:** فارسی

مواد اصلاح‌نشده DG 0.1 به قوت خود باقی‌اند.

## روابط اسنادی
EX 1.1 — ECON 0.2 — STD 0.2 — JUD 0.2

## ماده DG-001 — حدود قلمرو اقتصادی

در قلمرو پولی و اقتصادی، DG حکمرانی دیجیتال اجرای ECON را تنظیم می‌کند و نمی‌تواند ماهیت رویداد پولی یا حقوق اقتصادی را تغییر دهد.

## ماده DG-033 — جایگاه نجم‌بهار

۱. نجم‌بهار زیرساخت دیجیتال اجرای ECON است.  
۲. نجم‌بهار قانون‌گذار، مرجع Creation یا مالک دارایی اعضا نیست.  
۳. هر عملیات مالی باید از مبنای قانونی، قراردادی، Policy یا تصمیم معتبر ناشی شود.  
۴. تغییر مستقیم موجودی خارج از Event Pipeline معتبر ممنوع است.

## ماده DG-034 — داده مالی حساس

Asset Holdings، Liabilities، Credit Assessment، VPU Holdings، Project Commitments و Retirement Obligations داده مالی حساس‌اند. دسترسی باید بر Least Privilege استوار باشد.

## ماده DG-035 — معماری دفترهای مالی

نجم‌بهار باید حداقل سه حوزه متمایز داشته باشد: Money Ledger، Asset Ledger و Liability Ledger. نمایش یکپارچه UI نباید موجب ادغام معنایی شود. Asset Value یا Debt Entry نباید Money Balance ایجاد کند.

## ماده DG-036 — کنترل Dim Bahar

۱. سامانه باید مانع خرج، انتقال، فروش، هدیه، وثیقه‌گذاری یا سرمایه‌گذاری مستقیم Dim شود.  
۲. Dim فقط از مسیرهای قانونی Activation فعال می‌شود.  
۳. در پروژه عمومی نیز چرخه صحیح Commitment → Committed Dim → Activation → Transfer است.  
۴. «مصرف هدفمند مستقیم Dim» به‌عنوان قابلیت مستقل مجاز نیست.

## ماده DG-037 — Cancellation و Retirement

۱. Cancellation از Retirement/Burn جداست.  
۲. Cancellation بر Dim فعال‌نشده اعمال می‌شود.  
۳. Retirement فقط وقتی است که Active Bahar واقعاً از عرضه خارج شود.  
۴. انتقال پول به صندوق Retirement به خودی خود Burn نیست.  
۵. Retirement نباید به مصادره پنهان دارایی عضو یا وراث تبدیل شود.

## DG-042 — ممیزی AI مالی

ممیزی باید بررسی کند آیا مدل Creation غیرمجاز می‌دهد، Balance را مستقیم تغییر می‌دهد، تصمیم Credit نامرتبط یا تبعیض‌آمیز می‌گیرد، خارج از اختیار کاربر معامله می‌کند یا Fundamental Parameters را قابل تغییر می‌سازد.

## DG-043 — اعتراض به تصمیم ماشینی

AI نمی‌تواند به‌تنهایی مبنای قطعی مصادره، Burn، بدهکارشناختن شخص، مسدودسازی طولانی دارایی یا محرومیت اقتصادی شدید باشد. اقدام حفاظتی فوری ماشینی باید موقت، مستند و مشمول بازبینی انسانی سریع باشد.

## DG-044 تا DG-047 — قراردادهای هوشمند

Smart Contract منبع اختیار حقوقی نیست؛ ابزار اجرای اختیار معتبر است. نباید Creation جدید، خرج مستقیم Dim، مالیات جدید یا حذف حق اعتراض ایجاد کند. اصلاح مالی باید با Event اصلاحی انجام شود و Ledger تاریخی حفظ شود.

## DG-048 تا DG-050 — APIها

API مالی نوشتنی باید Authentication، Authorization، Legal Basis Check، Idempotency، Audit Trail، Rate Limit و Concurrency Control داشته باشد. API عمومی یا مدیریتی از نوع setBalance/mintMoney/activateAnyAmount/burnAnyAmount یا معادل آنها ممنوع است.

## اصل منع Backdoor

Hidden Route، Debug Endpoint، SQL Tool، Admin Script، AI Agent یا Support Console نباید خارج از قواعد Ledger دارایی یا پول واقعی را تغییر دهد؛ وجود Super Admin این اصل را از بین نمی‌برد.

## DG-068 تا DG-070 — نهاد نگهبان

نظارت باید Fundamental Parameter Protection، Backdoorهای مالی، AI Agency، Ledger Separation، Reconciliation، Idempotency و Safe Halt را نیز پوشش دهد.

## DG-072 — تخلفات بنیادین دیجیتال

تغییر مستقیم Balance خارج از Ledger، ایجاد مسیر مالی بدون مبنای قانونی، تغییر Fundamental Legal Parameter بدون اصلاح قانون، جعل Event، حذف Audit Trail، معامله AI بدون اختیار معتبر و خلط عمدی Asset با Money از تخلفات بنیادین‌اند.

## DG-074 — ضمانت اجرا

Protective Digital Restriction ≠ Final Financial Sanction. محدودیت فوری باید محدود، زمان‌مند، مستند، قابل اعتراض و سریعاً قابل بازبینی باشد.

## DG-077 — آیین‌نامه‌های ضروری

آیین‌نامه Fundamental Parameter Protection، AI Financial Agency، Financial Ledger Integrity و Safe Halt/Recovery باید تدوین شوند.

## Change Log — DG 0.2

- تفکیک Money/Asset/Liability Ledger.
- حفاظت از Dim.
- تفکیک Cancellation/Retirement.
- منع AI-only final financial decision.
- منع API/Backdoor تغییر مستقیم Balance.
- حفاظت Fundamental Parameters.
