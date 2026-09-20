# اصلاحیه استانداردهای فنی EarthCoop
## STD 0.2 — همگام‌سازی با ECON 0.2 و EX 1.1

**شناسه:** STD  
**نسخه جدید:** ۰.۲  
**نسخه مبنا:** STD 0.1  
**وضعیت:** Registration Candidate  
**زبان مبنا:** فارسی

مواد اصلاح‌نشده STD 0.1 به قوت خود باقی‌اند.

## روابط اسنادی
FC 1.1 — CH 1.0 — CO 1.0 — EX 1.1 — ECON 0.2 — DG 0.2 — JUD 0.2 — LOC 0.2 — ETH 0.2

## STD-004 — نسبت استاندارد فنی با قانون

۱. استاندارد فنی تابع قانون معتبر است.  
۲. در تعارض، قانون حاکم است.  
۳. هیچ STD، Implementation، Migration، API، Job، Feature Flag، Configuration، Admin Panel یا کد نمی‌تواند بدون مبنای قانونی پول خلق کند، مسیر Activation بسازد، اعتبار اولیه را تغییر دهد، مالیات وضع کند، مالکیت را تغییر دهد یا تعهد اقتصادی جدید ایجاد کند.  
۴. استاندارد اثرگذار بر حقوق اقتصادی باید Legal Basis خود را ثبت کند.  
۵. Technical Capability ≠ Legal Authorization.

## STD-005 — قالب رسمی استاندارد

برای استانداردهای مرتبط باید Legal Parameter Class، Policy Version، Money Supply Effect، Asset/Liability Effect، Idempotency، Concurrency و Migration/Rollback Plan نیز مشخص شوند.

## STD-027 / EC-4001 — استاندارد حساب نجم‌بهار

هر عضو اقتصادی معتبر حساب اصلی یکتا دارد. Money Ledger، Asset Ledger و Liability Ledger باید از نظر معنایی تفکیک شوند. UI می‌تواند تجمیع نمایشی داشته باشد اما ماهیت حسابداری نباید ادغام شود. وضعیت‌های Available Dim، Committed Dim، Available Active، Reserved Active، Committed Active، Escrow Active، Asset Holdings، Receivables و Liabilities باید قابل نمایش باشند. Balance از Ledger بازسازی می‌شود و تغییر مستقیم Balance ممنوع است.

## STD-028 / EC-4002 — Dim Bahar

Dim پول خلق‌شده ولی فعال‌نشده است و در Total Created Supply محاسبه می‌شود. انتقال آزاد، فروش، هدیه، خرید، پرداخت بدهی خصوصی، سرمایه‌گذاری خصوصی یا وثیقه‌گذاری مستقیم آن ممنوع است. Committed Dim همچنان Dim است. Available Dim → Committed Dim Activation نیست.

## STD-029 / EC-4003 — Active Bahar

Active Bahar پول قابل گردش است. Transfer باید حداقل Event ID، Amount، Unit، Source، Destination، Timestamp، Actor، Legal/Contractual Basis، Status، Reference و در صورت لزوم Policy Version داشته باشد. بازگشت Active به Dim فقط در اصلاح فنی معتبر با Reversal ممکن است.

## STD-030 / EC-4004 — اعتبار اولیه اقتصادی انسان

۱۰٬۰۰۰ Bahar مقدار قانونی جاری و Fundamental Legal Parameter است. کل مبلغ در Creation اولیه Dim است. Admin Panel نباید کنترل ویرایش عادی داشته باشد. Configuration باید Legal Source Version، Effective Date و Legal Reference را نگهداری کند. تغییر فقط پس از ECON لازم‌الاجرا مجاز است.

## STD-031 / EC-4005 — حق عضویت

Membership Fee Policy Parameter است. مقدار پایه جاری ۱۲ Bahar است. پرداخت از Dim باید Activation + Transfer باشد. الگوی جاری ۶/۳/۳ میان عملیات و حقوق، بیمه مرکزی و Retirement Fund است و نسبت‌ها versioned و audit-able هستند.

## STD-032 / EC-4006 — Activation

Route allowlist فقط شامل MEMBERSHIP_FEE، PARTICIPATION_POINT، PUBLIC_PROJECT و EQUAL_GENERAL_ACTIVATION است. OTHER/ADMIN/MANUAL یا مسیر آزاد ممنوع است. هر Activation باید Event ID، Member ID، Amount، Route، Source Dim Position، Legal Basis، Policy Version، Reference، Timestamp، Actor، Idempotency Key و Status داشته باشد. Amount <= Remaining Eligible Dim. Atomicity، Idempotency و Concurrency Control الزامی‌اند.

## STD-033 / EC-4007 — صندوق‌ها و خزانه

هر Fund باید Fund ID، Type، Mission، Legal Basis، Allowed Sources/Uses، Operating Balance، Required Reserve، Reallocatable Surplus، Managers، Auditors، Status، Ledger و Policy Version داشته باشد. صندوق‌ها می‌توانند عملیات و حقوق، بیمه مرکزی، Retirement، Idle Tax، محلی، پروژه و سرمایه‌گذاری باشند. Positive Balance ≠ Reallocatable Surplus. کسری صندوق مجوز Creation نیست.

## STD-034 / EC-4008 — Cancellation و Retirement

Cancellation فقط بر Dim فعال‌نشده است. Retirement فقط با خروج واقعی Active از عرضه اجراشده محسوب می‌شود. انتقال به صندوق Retirement هنوز Burn نیست. پایان عضویت باید Remaining Dim، Activated Initial Portion، Cancellation Amount، Retirement Obligation، Executed Retirement و Pending Retirement Obligation را محاسبه کند. Coin Tracing ممنوع است و مصادره خودکار دارایی شخص/وارثان مجاز نیست.

## STD-035 / EC-5001 — Project Proposal و Official Project Dossier

سامانه باید پیشنهاد اولیه ساده را از پرونده رسمی پروژه جدا کند. پیشنهاد اولیه می‌تواند فقط عنوان، مسئله، پیشنهاد، قلمرو و توضیح اولیه داشته باشد و بودجه/بیمه/ریسک/زمان‌بندی تفصیلی برای ثبت اولیه اجباری نیست. پس از عبور از نصاب بررسی، Official Project Dossier با Scope، Budget، Funding Model، Risks، Assessments، Environmental Impact، Timeline، Execution Conditions و Audit Path تکمیل می‌شود.

## STD-036 / EC-5002 — Project Funding

Project Funding Commitment Ledger از Active Project Fund جداست. Liability Snapshot باید Decision ID، Project ID، Eligible Member Rule، Total Required Amount، Per-member Rule، Decision Version و Effective Date را ثبت کند. Commitment Ledger می‌تواند Required/Committed/Paid-Activated/Waived/Adjusted/Disputed داشته باشد. Committed Dim در Active Project Fund Balance محاسبه نمی‌شود. چرخه: Valid Approval → Liability Snapshot → Commitment → Committed Dim → Activation → Transfer → Active Project Fund.

## STD-037 / EC-5003 — بازارها

Marketplace، Investment Market و Secondary Asset Market باید تفکیک شوند. Marketplace عادی Dim را مستقیم خرج نمی‌کند. Asset Trade باید Money Transfer + Asset Transfer را ثبت کند. پذیرش در بازار تضمین ارزش یا نقدشوندگی نیست. Wash Trading و Market Manipulation باید قابل کشف باشند.

## STD-038 / EC-5004 — Entityها

Entity باید ID، Type، Members/Owners، Governance، Accounts، Assets، Liabilities، Managers، Authorizations، Legal Status و Audit Trail داشته باشد. Internal Entity، External Legal Person و Regulated Activity Authorization متمایزند. Membership Right تعاونی از Capital Right جداست.

## STD-044 / EC-7001 — API

API مالی نوشتنی باید Authentication، Authorization، Idempotency، Rate Limit، Validation، Audit Logging و Legal Basis Check داشته باشد. Endpoint عمومی تغییر مستقیم Balance ممنوع است. API Event قانونی ایجاد می‌کند، نه Balance overwrite.

## Event Envelope

Event اقتصادی باید Event UUID، Event Type، Aggregate/Account ID، Actor، Subject، Amount/Asset Quantity، Currency/Asset Type، Legal Basis، Policy Version، Reference ID، Idempotency Key، Occurred At، Recorded At، Status، Correlation ID و Causation ID داشته باشد.

Money Event Typeهای اصلی: CREATION، ACTIVATION، TRANSFER، COMMITMENT، TAXATION، CANCELLATION، RETIREMENT.

## STD-051 / EC-8004 — Ledger

Money Ledger، Asset Ledger و Liability Ledger معنای مستقل دارند. عملیات می‌تواند به‌صورت اتمیک در چند Ledger اثر بگذارد. Asset Valuation نباید Money Balance افزایش دهد؛ Debt Entry نباید Active Bahar ایجاد کند. Ledger append-oriented است و Correction/Reversal جای حذف تاریخچه را می‌گیرد.

Net Created Supply = Gross Creation - Valid Cancellation - Executed Retirement  
Net Created Supply = Total Dim + Total Active

## Atomicity

عملیات مرکب مالی باید همه یا هیچ باشد. شکست میانی باید Rollback یا Compensating Transaction معتبر داشته باشد.

## Idempotency

عملیات Retry-able باید Idempotency Key داشته باشد و retry یک درخواست نباید Activation/Transfer/Tax/Burn/Asset Issuance دوباره ایجاد کند.

## Concurrency

کنترل هم‌زمانی باید Double Spend، Over-Activation، Double Commitment، Double Asset Transfer و Double Retirement را در لایه Transaction/Database/Ledger مهار کند.

## Reconciliation

نجم‌بهار باید Gross Creation، Remaining Dim، Committed Dim، Total Active، Funds، Cancellation، Executed Retirement، Pending Retirement Obligations، Asset Holdings و Liabilities را دوره‌ای تطبیق دهد. اختلاف باید Severity، Expected/Actual، Root Cause Status و Resolution Status داشته باشد.

## Safe Halt

اگر صحت Ledger قابل اثبات نیست، Scope حساس باید قابل توقف امن باشد. خروج از Safe Halt نیازمند Root Cause، Reconciliation، تأیید مجاز و Audit Record است.

## Fundamental Legal Parameter Protection

پارامترهای initial_human_economic_credit، creation_source_rule، contractual_value_measure و activation_route_set یا معادل آنها باید LAW_LOCKED باشند؛ در Admin قابل ویرایش عادی نیستند، API تغییر مستقیم ندارند و Migration آنها نیازمند Legal Version Reference است.

## VPU

VPU باید Issuance ID، Issuer ID، Underlying Asset، Project Valuation، Value Participation Pool، Total/Issued/Retained Units، Rights Definition، Dilution Rules، Material Events، Holder، Transfer History و Settlement Events داشته باشد. VPU فقط Asset است و صدور آن Money Creation Event نیست.

## Retirement without Coin Tracing

Retirement Obligation به Membership Origin متصل است، نه Coin Identity. سیستم مقدار Activated Initial Portion را حسابداری می‌کند و به دنبال همان واحدهای تاریخی Bahar نمی‌گردد.

## منع Backdoor مالی

Admin Command، Database Script، Hidden Route، Debug Endpoint، Support Tool یا AI Agent نباید خارج از Event Pipeline موجودی واقعی را تغییر دهد. حتی Super Admin باید Authority + Event + Audit Trail داشته باشد.

## Separation of Duties

Proposal، Approval، Execution، Custody و Audit برای عملیات حساس تا حد امکان تفکیک می‌شوند.

## Service Accounts

هر Service Account باید Owner، Purpose، Allowed Actions، Allowed Accounts/Funds، Credential Rotation، Audit Scope و Review/Expiration Date داشته باشد.

## نجم هدا و عملیات مالی

اقدام مالی نمایندگی‌شده توسط Najm Hoda فقط با اختیار صریح، محدود، قابل لغو و audit-able مجاز است. AI نمی‌تواند Fundamental Parameter را تغییر دهد یا به‌تنهایی Fraud قطعی/مجازات مالی نهایی تعیین کند.

## Test Bahar

Test Bahar و Real Bahar باید Ledger، Environment، Identifier، Database Scope و API Credential قابل تفکیک داشته باشند. Test Bahar با Migration عادی به Real Bahar تبدیل نمی‌شود.

## Migration مالی

Migration مؤثر بر Ledger، Balance، Fund، VPU، Liability یا Fundamental Parameter نیازمند Backup، Dry Run، Pre-migration Reconciliation، Migration Plan، Rollback/Recovery Plan، Post-migration Reconciliation و Audit Report است.

## STD-068 / EC-9304 — آزمون انطباق

حداقل تست‌ها:
- Creation only from valid membership
- No duplicate initial credit
- Activation route allowlist
- No over-activation
- Dim cannot be freely spent
- Commitment not counted as spendable fund balance
- No asset-as-money confusion
- No debt-based money creation
- Retirement without estate confiscation
- Retirement without coin tracing
- Idempotency
- Atomicity
- Concurrency
- Reconciliation
- Safe Halt
- Fundamental Parameter Lock
- No financial backdoor

## STD-076 — استانداردهای تفصیلی ضروری

Event Taxonomy، Ledger Separation، Fundamental Parameter Protection، Project Funding Commitment Ledger، Active Project Fund، Retirement/Cancellation، VPU Asset Registry، Loan/Credit Ledger، Financial Reconciliation، Safe Halt/Recovery، Idempotency/Concurrency، System Accounts/Separation of Duties و Monetary Metrics باید استاندارد تفصیلی داشته باشند.

## STD-077 — ثبت و نسخه‌بندی

هر استاندارد EC وابسته باید legal_basis_document، legal_basis_version و legal_basis_articles داشته باشد.

## STD-078 — اعتبار نسخه ۰.۲

این نسخه، STD همگام‌شده با ECON 0.2 و EX 1.1 است. مواد اصلاح‌نشده STD 0.1 معتبرند. قابلیت‌های Production پول واقعی پیش از اعلام انطباق باید آزمون‌های مقرر را طی کنند.

## Change Log — STD 0.2

- ارتقای ارجاع ECON/EX.
- ۱۰٬۰۰۰ Bahar به Fundamental Legal Parameter تبدیل شد.
- مسیر آزاد Activation حذف و allowlist چهارمسیره تثبیت شد.
- Cancellation/Retirement و Money/Asset/Liability Ledger تفکیک شدند.
- Project Commitment Ledger از Active Project Fund جدا شد.
- VPU Asset Registry افزوده شد.
- Atomicity، Idempotency، Concurrency، Reconciliation و Safe Halt الزامی شدند.
- Backdoor مالی ممنوع شد.
- Migration Safety و Financial Compliance Tests توسعه یافت.
