# بوابات الإنهاء وربط الواجهة

## القاعدة الملزمة

لا ننتقل إلى مورد/واجهة لاحقة حتى يحقق المورد الحالي جميع البنود: migration، validation، authorization، API، ربط UI بلا Mock، audit، اختبارات وحدة/تكامل، واختبار E2E. لا تعتبر صفحة «منتهية» لأن تصميمها ظاهر أو لأن endpoint يعيد 200 فقط.

## ترتيب التنفيذ الإلزامي

| البوابة | النطاق | لا تُغلق قبل |
|---|---|---|
| G0 | أساس النظام | organizations, users, roles, permissions, sessions، error contract، audit middleware، migration runner |
| G1 | الملاك | owner + bank accounts + CRUD + owner portfolio؛ تحقق IBAN وصلاحيات العرض/التعديل |
| G2 | العقارات والمساحات | property + property_spaces؛ لا تُقبل مساحة لمؤسسة/عقار مختلف |
| G3 | المستأجرون وعقود الإدارة | tenant + management contract + scopes/services/exclusions + approval threshold |
| G4 | الإيجارات والاستحقاقات | lease spaces، منع التداخل، preview installments، activate يولد receivables داخل معاملة |
| G5 | الدفعات والبنك | allocations، reverse، imports، matches، idempotency، أقفال/transactions |
| G6 | المصروفات والصيانة | vendors، attachments، approval workflow، completion، eligibility للتسوية |
| G7 | تسويات وتحويلات الملاك | preview/confirm، item snapshots، partial transfers، bank match، منع الازدواج |
| G8 | الخطابات والإشعارات | templates/versioning، generated docs، follow-ups، provider log، queue/retry |
| G9 | التقارير والتصدير | read models، فلاتر مؤلفة، PDF/XLSX/DOCX، أرقام متطابقة مع ledger |

## قائمة إغلاق لكل واجهة

انسخ القائمة لكل صفحة في PR أو Issue:

- [ ] endpoint والـrequest/response موثقان في `03-api-by-page.md`، وربط كل زر ومودال وحالاته موثق في `07-ui-api-binding.md`.
- [ ] migration وforeign keys وunique/check constraints موجودة.
- [ ] تحقق الخادم يغطي جميع الحقول المطلوبة وقواعد المجال.
- [ ] RBAC مطبق في endpoint وواجهة الزر تعرض حالة عدم السماح بوضوح.
- [ ] العملية الحساسة transactional وتدعم `Idempotency-Key` إن كانت مالية.
- [ ] كل خطأ معروف له حالة HTTP ورسالة عربية قابلة للعرض.
- [ ] الواجهة تستخدم API client فقط؛ لا import من `mocks/*` أو `localStorage` لهذا المورد.
- [ ] loading/empty/error/retry/success states موجودة.
- [ ] attachment يبدأ presign ثم complete ويرتبط بسجل محفوظ.
- [ ] audit log يثبت المستخدم والفرق والسبب عند العكس/الإلغاء.
- [ ] unit + integration + E2E للمسار السعيد والتعارض المتوقع.
- [ ] مراجعة أرقام التقرير/التفاصيل مع نفس `asOfDate` والفلاتر.

## ربط البيانات الفعلية بالواجهة

1. أنشئ `features/<domain>/api.ts` بأنواع request/response من العقد.
2. اجعل الصفحة تستدعي hook واحداً للقراءة وmutation واحداً لكل إجراء؛ لا تحسب الرصيد محلياً بعد save.
3. بعد mutation، أعِد جلب query keys المتأثرة: مثال دفعة ⇒ payments, receivables, dashboard, owner statement, settlement preview.
4. لا تعرض Toast نجاحاً قبل استجابة الخادم؛ اعرض رقم العملية/المرجع العائد.
5. عند `409` اعرض البيانات الجديدة وزر «تحديث»؛ لا تعيد الإرسال تلقائياً.

## سيناريوهات قبول مالية إجبارية

1. دفعة موزعة 45,000 على استحقاقين، ثم عكسها؛ يعاد الرصيد والحالة لكل استحقاق.
2. محاولتا تسوية لنفس الدفعة في وقت واحد؛ واحدة فقط تتأكد.
3. مطابقة جزئية لحركة بنك ثم مطابقة ثانية؛ لا تتجاوز قيمة الحركة.
4. مصروف pending لا يدخل التسوية؛ بعد approval يدخل وفق الفترة والنطاق.
5. خطاب مطالبة يصبح غير قابل للإرسال مباشرة بعد سداد الاستحقاق.
6. تقرير المالك وتقرير المحصلات يعطيان نفس ledger total عند الفلاتر نفسها.
