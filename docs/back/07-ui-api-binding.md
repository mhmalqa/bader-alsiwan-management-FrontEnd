# عقد ربط الـ API بالواجهات والمودالات والإجراءات

هذا الملف هو التعليمات التنفيذية لربط الواجهة الحالية بباك-إند فعلي. لا يكفي أن يكون الـ endpoint موجوداً: لا يعتبر المسار منجزاً حتى يعمل زرّه، موداله، حالات التحميل والخطأ، وتحديث البيانات بعد النجاح وفق هذا العقد.

## 1. قاعدة التنفيذ في الواجهة

### طبقة واحدة للاتصال

ينشأ عميل HTTP مركزي (`lib/api/http.ts`) وعميل مجال لكل ميزة (`features/<domain>/api.ts`). يمنع أي مكوّن شاشة من الاستيراد من `mocks/data` أو `services/quick-create` أو تعديل كائنات الذاكرة مباشرة.

- يرسل العميل `Authorization`، و`X-Request-Id`، و`Idempotency-Key` لكل إنشاء أو تأكيد مالي.
- يفسر envelope الموحد `{ data, meta }`، ويحّول أخطاء الحقول `422` إلى حقول النموذج نفسها.
- يستعمل React Query أو SWR: query للقراءة وmutation للكتابة. لا تُحدَّث الأرصدة أو حالات الاستحقاق محلياً بتخمين؛ تعاد قراءة نتيجة الخادم أو تدمج استجابته.
- تعديلات الموارد تستخدم `version` أو `If-Match` المعاد من `GET`؛ يعرض `409` رسالة تعارض مع خيار إعادة التحميل، لا يحفظ فوق تعديل موظف آخر.
- لا تستعمل الصفحة قيمة افتراضية وهمية عند فشل القراءة. تعرض حالة تحميل، حالة فارغة مفهومة، أو خطأ قابل لإعادة المحاولة.

### دورة حياة كل مودال

`AppDialog` هو الحاوية الوحيدة للمودالات. تتبع كل عملية الحالات التالية:

`open → loading prerequisites → ready → submitting → success | field-error | conflict | request-error`

- عند الفتح: يجلب المودال فقط قوائم الاختيار اللازمة له، ويضع focus داخل المودال ويقفل تمرير الصفحة الخلفية.
- زر الإلغاء و`X` وEscape وbackdrop يغلقون المودال فقط عندما لا تكون mutation قيد التنفيذ. أثناء الحفظ تكون أزرار الإغلاق والحفظ معطلة.
- عند `422`: يبقى المودال مفتوحاً، تظهر رسالة بجانب الحقل ورسالة عامة في رأس النموذج.
- عند `409`: يبقى مفتوحاً، تظهر رسالة السبب ويفرض إعادة جلب بيانات الاختيار/التفاصيل قبل الإرسال مجدداً.
- عند النجاح: يحدّث cache المحدد في هذا الملف، يعرض toast نجاح باسم العملية، ثم يغلق المودال بعد تأكيد الاستجابة (أو ينتقل إلى صفحة التفاصيل إذا كان ذلك مطلوباً). لا يغلق عند الضغط قبل وصول الرد.
- عند `401/403/404/5xx`: لا يغلق. `401` يعيد تسجيل الدخول، `403` يوضح عدم الصلاحية، `404` يزيل المورد المتقادم من القائمة ويطلب إعادة التحميل، و`5xx` يسمح بالمحاولة مجدداً بنفس مفتاح idempotency.

### المرفقات

قبل حفظ المورد: `POST /attachments/presign` ثم الرفع المباشر، ثم `POST /attachments/complete`. تحفظ الواجهة `attachmentIds` الناتجة فقط. إن فشل الحفظ النهائي لا تنسب الواجهة ملفاً لمورد غير موجود؛ يستخدم الخادم جلسة رفع مؤقتة أو `draftToken` ويربطها ذرّياً عند الإنشاء.

## 2. مداخل التطبيق والنماذج السريعة

| نقطة الواجهة | القراءة عند الفتح | الإجراء | نتيجة النجاح المطلوبة |
|---|---|---|---|
| زر «إضافة جديد» في `AppShell` | لا شيء حتى اختيار نوع السجل | لا يستدعي API؛ يفتح النوع الصحيح | لا يغيّر بيانات الصفحة |
| مالك جديد `CreateRecordModal` | — | `POST /owners` | toast، إغلاق، invalidate: `owners`, `dashboard`, قوائم اختيار المالك |
| عقار جديد | `GET /owners?status=active` | `POST /properties` | invalidate: `properties`, `owners/:id/portfolio`, `dashboard` |
| وحدة/دور جديد | `GET /properties?status=active` | `POST /properties/:propertyId/spaces` | invalidate: `property-spaces`, `properties/:id/portfolio`, `properties` |
| مستأجر جديد | — | `POST /tenants` | invalidate: `tenants` وقوائم المستأجرين |
| مصروف سريع | properties, spaces, vendors | `POST /expenses` | invalidate: `expenses`, `dashboard`, تقارير المالك/العقار؛ لا يدرج في تسوية مؤكدة تلقائياً |
| طلب صيانة سريع | properties, spaces | `POST /maintenance-requests` | invalidate: `maintenance-requests`, `properties/:id/portfolio`, `dashboard` |

النماذج السريعة لا تحتوي حقلاً مخفياً يختار المالك أو المستأجر. كل علاقة مطلوبة تعرض باسمها وسياقها، ويمنع الإرسال إلى أن تعود القوائم وتُختار قيمة صالحة.

## 3. الإيجارات والاستحقاقات والتحصيل

### إنشاء/تعديل عقد الإيجار

المكوّن: `LeaseCreateModal` وصفحات `/leases/new` و`/leases/:id/edit`.

1. عند الفتح يجلب `GET /tenants?status=active` و`GET /properties?status=active`. بعد اختيار العقار يجلب `GET /properties/:id/spaces?availableForLease=true`.
2. نوع النطاق `unit | floor | whole_property` يحدد `spaces[]`: وحدة واحدة/كل وحدات الدور/العقار ذاته. يتحقق الخادم من عدم وجود عقد نشط متداخل زمنياً على أي مساحة.
3. زر معاينة الأقساط يستدعي `POST /leases/preview-installments`، ولا ينشئ أي سجل. يعرض النتائج ويطلب إقرار المستخدم إن عدّلها.
4. الحفظ: `POST /leases` أو `PATCH /leases/:id` بالـpayload في `06-api-payload-contracts.md`. لا يسمح للخادم بتوليد أقساط أو استحقاقات مكررة عند إعادة الإرسال.
5. إن كان التنشيط منفصلاً: `POST /leases/:id/activate`. بعدها فقط تنشأ الاستحقاقات.
6. النجاح: ينتقل إلى `/leases/:id` أو يغلق المودال، ويحدّث `leases`, `receivables`, `tenants/:id/statement`, `properties/:id/portfolio`, `dashboard`, والتقارير.

### الاستحقاقات اليدوية

المكوّن: المودال في `features/receivables/pages.tsx`.

- التحميل: `GET /leases?status=active`؛ بعد اختيار العقد يعرض المستأجر والعقار والمساحة كحقول قراءة فقط.
- الحفظ: `POST /receivables/manual` مع `{ leaseId, dueDate, amount, installmentNumber? }` و`Idempotency-Key`.
- يتحقق الخادم من نطاق العقد، تسلسل القسط وعدم تكرار الاستحقاق. لا يقبل `tenantId` أو `propertyId` مرسلاً من العميل كحقيقة مستقلة.
- النجاح: invalidate: `receivables`, `leases/:id`, `tenants/:id/statement`, `dashboard`, وكل تقرير مرتبط.

### تسجيل دفعة مستأجر

المكوّنات: `QuickPaymentForm` و`/payments/new`.

| مرحلة واجهة الدفعة | API والسلوك الملزم |
|---|---|
| البحث باسم المستأجر/العقار/الوحدة/رقم القسط | `GET /receivables?open=true&search=...`؛ كل نتيجة تعرض: المستأجر، الهاتف، العقار، الوحدة/الدور، العقد، رقم القسط وتاريخه، المتبقي. |
| اختيار الاستحقاق أو عدة استحقاقات | يحتفظ العميل بـ`receivableId` و`remainingAmount` من الاستجابة فقط؛ لا يعرض رقماً مجهول السياق. |
| إدخال طريقة ومرجع الدفع | يلزم `transactionReference` للتحويل البنكي والشيك، وحقول الشيك عند اختياره. يرفع إيصال البنك كمرفق عند وجوده. |
| حفظ وتوثيق | `POST /payments` مع `allocations[]` و`Idempotency-Key`. الخادم يطابق مجموع التوزيعات مع المبلغ ويقفل الاستحقاقات داخل transaction. |
| نجاح | يعرض «تم تسجيل الدفعة بنجاح»، يغلق المودال، invalidate: `payments`, `receivables`, `bank-transactions`, `dashboard`, كشف المستأجر، كشف المالك، التقارير والتسويات غير المؤكدة. |
| عكس دفعة | تأكيد منفصل يطلب السبب ثم `POST /payments/:id/reverse`. لا يوجد DELETE. يعيد الخادم حساب الحالة وفق تاريخ الاستحقاق: `overdue` إن كان التاريخ مضى، لا `upcoming` تلقائياً. |

لا يفترض نموذج الدفعة السريع أن الدفعة تخص استحقاقاً واحداً؛ إن أبقت الواجهة اختياراً واحداً في الإصدار الأول، يرسل مصفوفة فيها عنصر واحد ويظل الـendpoint نفسه داعماً للتوزيع المتعدد.

## 4. المصروفات والصيانة وعقد الإدارة

| الواجهة | التحميل | الكتابة | قواعد ما بعد النجاح |
|---|---|---|---|
| `/expenses/new` وedit | properties, spaces, vendors، والتفاصيل عند edit | `POST /expenses` أو `PATCH /expenses/:id` | الخادم يحسب net/vat/gross ويثبت `ownerChargeable` وapproval status. invalidate: expenses، portfolio، dashboard، reports. |
| تفاصيل المصروف | `GET /expenses/:id` | `POST /expenses/:id/submit-approval`, `/approve`, `/reject` بحسب الدور | لا تعديل لقيمة مصروف مؤكد؛ التصحيح بمستند تعديل/عكس. |
| `/maintenance/new` وform | properties ثم spaces للعقار | `POST /maintenance-requests` ثم ربط attachment IDs | تتبع حالة `open/assigned/in_progress/completed/cancelled`، وموافقة المالك مطلوبة فقط عندما يفرضها العقد/السقف. |
| تفاصيل الصيانة | `GET /maintenance-requests/:id` | `POST /:id/assign-vendor`, `/request-owner-approval`, `/approve`, `/complete` | كل انتقال حالة يسجل audit ويحدّث قائمة الصيانة وportfolio. |
| `/management-contracts/new` وedit | owners, properties, spaces | `POST/PATCH /management-contracts` ذرياً مع scope/services/exclusions/fee rules/attachments | لا تحفظ الواجهة خدمات أو استثناءات كاستدعاءات منفصلة يمكن أن تترك عقداً ناقصاً. |
| تفاصيل عقد الإدارة | `GET /management-contracts/:id` | `POST /:id/activate`, `/renew`, `/terminate` | التفعيل فقط بعد صلاحية النطاق والتواريخ؛ invalidate: contracts، owners، properties، settlement preview. |

## 5. التسويات وتحويلات المالك والمطابقة البنكية

### مودال إنشاء التسوية

المكوّن: `CreateSettlementModal` في `/owner-settlements/new`.

1. يحمل `GET /owners?status=active` ثم عقارات ذلك المالك وحساباته البنكية. لا يسمح باختيار مصروف/دفعة قبل تحديد المالك والفترة.
2. عند تغير المالك/العقارات/الفترة/البنود، يستدعي بتأخير قصير `POST /owner-settlements/preview`. استجابة preview هي المصدر الوحيد للإجمالي المحصل والرسوم والصافي والبنود المؤهلة والتحذيرات.
3. «حفظ مسودة»: `POST /owner-settlements`؛ لا يقفل البنود ولا يغير أرصدة المالك.
4. «تأكيد»: `POST /owner-settlements/:id/confirm` بعد modal تأكيد. يقفل الخادم البنود الذرّية؛ `409` يبقي المودال مفتوحاً ويعرض البنود التي لم تعد مؤهلة.
5. النجاح: ينتقل إلى `/owner-settlements/:id` ويحدّث `owner-settlements`, `owners/:id/portfolio`, `dashboard`, التقارير، وقائمة الدفعات/المصروفات القابلة للتسوية.

### تحويل المالك

المكوّن: `SettlementTransferModal` و`/owner-settlements/:id/transfers/new`.

- قبل العرض: `GET /owner-settlements/:id`، `GET /owners/:ownerId/bank-accounts?active=true` و`GET /company-bank-accounts?active=true`.
- لا يكتب المستخدم الصافي يدوياً؛ يعرض `remainingTransferable` المعاد من الخادم. يختار حساب المستفيد وحساب الشركة وتاريخ التحويل والمرجع وإثبات التحويل.
- الحفظ: `POST /owner-settlements/:id/transfers`. الخادم يمنع تجاوز المتبقي أو التحويل من تسوية غير مؤكدة.
- النجاح: toast ثم إغلاق/عودة للتفاصيل، invalidate: settlement detail/list، owner portfolio، bank transactions، reports.

### المطابقة البنكية

المكوّن: `/bank-reconciliation`.

- القراءة: `GET /bank-transactions?status=unmatched|partial` و`GET /payments?unmatched=true` و`GET /owner-transfers?unmatched=true`.
- كل صف يعرض نوع الحركة واتجاهها والحساب والمرجع والطرف والمبلغ والمتبقي؛ لا يعرض دفعات مجهولة السبب.
- الحفظ: `POST /bank-matches` بسجل واحد من `paymentId` أو `ownerTransferId` فقط. يتعامل الخادم مع المطابقات الجزئية ويمنع تجاوز الحركة أو السند.
- فك المطابقة: `DELETE /bank-matches/:id` (صلاحية منفصلة + سبب + audit). النجاح يعيد جلب حركات البنك والدفعات والتحويلات.

## 6. الخطابات والمستندات والتنبيهات

### خطاب مطالبة متأخرة

المكوّن الموحد: `DemandLetterDialog`. يجب أن يستخدمه dashboard وتقارير المتأخرات معاً، ولا تبنى نسخة مودال ثانية داخل dashboard.

1. الفتح من صف استحقاق يرسل فقط `receivableId`؛ يقرأ `GET /receivables/:id/demand-letter-context` للحصول على المستأجر والعقار والوحدة والعقد وتاريخ/رصيد الاستحقاق والعناوين المسموحة.
2. «توليد مسودة»: `POST /receivables/:id/demand-letter/draft` مع template/locale والنص المعدل عند وجوده. يعيد `generatedDocument`, `collectionFollowUp`, ومحتوى/رابط معاينة.
3. «تنزيل» يطلب `POST /generated-documents/:id/export` أو يستخدم رابط تنزيل موقع من الاستجابة؛ «طباعة» يفتح PDF الناتج، لا `window.print` لنص غير محفوظ.
4. «إرسال»: `POST /collection-follow-ups/:id/send` مع channel/recipient بعد تأكيد. يعرض حالة sent/failed والسبب، ولا يسجل نجاحاً قبل مزود الإرسال أو مهمة queued موثقة.
5. بعد النجاح: invalidate `receivables`, `collection-follow-ups`, `generated-documents`, `communication-logs`, `dashboard`, report overdue. الاستحقاق المدفوع أو الملغى يرد `409` ويمنع الإرسال.

### صفحة المستندات والتنبيهات والإعدادات

| الواجهة | API | سلوك الواجهة |
|---|---|---|
| `/documents` | `GET /document-templates`, `GET /generated-documents`; CRUD للقوالب والإصدارات؛ generate/export/send | المعاينة والـWord والطباعة والإرسال تستعمل `generatedDocumentId` محفوظاً، وتعرض النسخة والقالب وحالة الإرسال. |
| `/reminders` | `GET /reminders`, `GET /collection-follow-ups`; `POST/PATCH /reminders`, schedule/cancel/send follow-up | لا يؤثر تعديل reminder على سجل إرسال سابق؛ تعرض الوجهة والتوقيت والنتيجة. |
| `/notifications` | `GET /notifications`, `POST /notifications/:id/read`, `POST /notifications/read-all` | deep link من notification يفتح المورد الحقيقي ثم يعلّم الإشعار مقروءاً بعد نجاح التنقل. |
| `/settings` | `GET /settings`; `PUT /settings`; `GET/POST/PATCH /roles`, `/users` | يحفظ كل تبويب صراحة، ويظهر منع الحفظ عند نقص الصلاحية؛ لا يوجد زر حفظ شكلي. |

## 7. الصفحات والقوائم والتقارير

### نموذج القراءة الموحد

كل صفحة قائمة ترسل `cursor`, `limit`, `search`, `sort`, `direction` ومرشحاتها. يعيد الخادم `{ items, nextCursor, totals?, facets? }`. فتح صف ينقل المعرف إلى صفحة تفاصيله؛ لا يعتمد على كائن القائمة القديم للتعديل.

| الصفحة | query لازم للقراءة | الإجراء من الصف | التحديث بعد النجاح |
|---|---|---|---|
| dashboard | `GET /dashboard?asOfDate&reminderDays` | فتح المتأخر/القريب، توليد خطاب | refetch dashboard + receivables/follow-ups بعد أي عملية مالية |
| owner/tenant/property portfolios | `GET /owners/:id/portfolio`, `/tenants/:id/statement`, `/properties/:id/portfolio` | روابط التفاصيل فقط | يعاد جلب portfolio بعد lease/payment/expense/settlement/maintenance ذو صلة |
| lists للمالكين/العقارات/الوحدات/المستأجرين/العقود | endpoint المورد مع المرشحات | create/edit/deep-link | invalidate مورد القائمة والتفاصيل المتأثرة فقط |
| `/reports` | `GET /reports/:key` بعد تحقق مرشحات التقرير | `POST /reports/:key/export` | لا يظهر كشف مالك بلا `ownerId` ولا كشف مستأجر بلا `tenantId` ولا تقرير عقار بلا `propertyId` حيث يكون مطلوباً |
| `/reports/management-portfolio` | `GET /reports/management-portfolio` | `POST /reports/management-portfolio/export` | مهمة export مع polling `GET /exports/:jobId` حتى رابط تنزيل مؤقت |

مرشح أيام التذكير في dashboard والتقارير يمرر صراحة (`reminderDays=10` مثلاً). البطاقة تعرض العدد، ومجموعة الضغط تعرض أسماء المستأجرين، العقار/الوحدة، القسط، تاريخ الاستحقاق، المبلغ المتبقي والإجراء المناسب (خطاب/تسجيل دفعة)؛ لا تعرض عدداً بلا قابلية تفسير.

## 8. مصفوفة إعادة الجلب (Invalidation)

| mutation ناجحة | مفاتيح queries التي تعاد قراءتها |
|---|---|
| owner/property/space/tenant | المورد وقوائم الاختيار التابعة وportfolio المتأثر وdashboard عند تغير العدادات |
| lease create/edit/activate/terminate | leases، receivables، property portfolio، tenant statement، owner portfolio، dashboard، reports |
| manual receivable | receivables، lease detail، tenant statement، dashboard، reports |
| payment/reversal | payments، receivables، bank transactions، tenant statement، owner/property portfolios، dashboard، reports، settlement preview |
| expense/approval | expenses، property/owner portfolio، dashboard، reports، settlement preview |
| settlement create/confirm/void/transfer | settlement list/detail، owner portfolio، bank transactions، dashboard، reports، eligible settlement lines |
| bank match/unmatch | bank transactions، payments، owner transfers، settlement detail، dashboard |
| maintenance/approval/complete | maintenance list/detail، property portfolio، owner portfolio، dashboard |
| document/follow-up/send | generated documents، follow-ups، communication logs، receivables، dashboard، overdue report |

## 9. قائمة التسليم لكل واجهة

لا تنتقل الواجهة إلى «منجزة» قبل تحقق جميع العناصر:

- [ ] endpoint القراءة يعرض بيانات حقيقية بكل أسماء العلاقات اللازمة، مع loading/empty/error.
- [ ] جميع الحقول المرئية موجودة في request أو محسوبة في الخادم ومفسرة في response.
- [ ] كل زر CRUD/تأكيد/إلغاء/تصدير/إرسال مربوط، وليس toast أو route شكلياً.
- [ ] المودال يغلق بـX والإلغاء وفق دورة الحياة أعلاه، ويقفل صفحة الخلفية ولا يملك scroll مزدوجاً.
- [ ] أخطاء `422`, `403`, `404`, `409`, `5xx` مختبرة ومفهومة للمستخدم.
- [ ] مرفقات، idempotency، audit، والتحقق من صلاحية المؤسسة مفعلّة حيث تنطبق.
- [ ] mutation تحدّث كل queries في مصفوفة إعادة الجلب، ثم يعاد اختبار الصفحة بعد refresh كامل.

## 10. استبدالات واجهة إلزامية قبل الربط النهائي

1. تستبدل كل استدعاءات `createQuickRecord` و`recordPayment` و`recordAllocatedPayment` و`reversePayment` و`recordOwnerTransfer` و`matchBankTransaction` بــ mutations المجال المقابلة؛ تبقى هذه الخدمات محاكاة فقط إلى أن تزال.
2. تستبدل تعديلات `Object.assign` في صفحات السجلات بـ`PATCH` وإعادة جلب المورد.
3. يدمج مودال خطاب dashboard داخل `DemandLetterDialog` بدلاً من منطق مكرر.
4. تستبدل إجراءات Documents preview/send/Word/print الوهمية بالمستند المحفوظ وexport job الحقيقي.
5. لا يسمح لمسار `/owner-settlements/new` أن يمثل التحويل؛ التحويل محصور في `/owner-settlements/:id/transfers/new`.

باتباع هذا العقد يستطيع فريق الباك بناء endpoint ثم ربطه وإنهاء واجهته كاملة قبل الانتقال للواجهة التالية، كما يطلب `04-delivery-gates.md`.
