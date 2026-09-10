# مخطط الخلفية المقترح — إدارة الأملاك

> حالة الوثيقة: ناتج مراجعة الواجهات في 2026-09-11. ليست موافقة على البدء بالتنفيذ قبل حسم قرارات القسم الأول.

## 1. النتيجة التنفيذية

الواجهة ترسم مسار العمل الصحيح في جوهره:

`مالك ← عقار ← مساحة مؤجرة ← عقد إيجار ← استحقاق ← دفعة ← تسوية مالك ← تحويل للمالك`

وتغطي كذلك المصروفات والصيانة والتذكيرات والتقارير وخطابات المطالبة. لكن لا يجوز تحويلها إلى عقد خلفي كما هي؛ توجد فجوات تمنع سلامة البيانات المالية، وأهمها: نوع المساحة المؤجرة، التسوية البنكية، وحالات بعض النماذج التي لا تحفظ من مسارها المباشر.

## 2. قرارات يجب حسمها قبل بناء قاعدة البيانات

| القرار | سبب الحسم | التوصية |
|---|---|---|
| نطاق عقد الإيجار | الواجهة تسمح بعقار كامل أو دور أو وحدة، بينما النموذج الحالي يطلب `unitId` واحداً. | اعتماد `lease_spaces` لربط العقد بوحدة أو دور أو عقار؛ لا تجعل `unitId` إلزامياً في العقد نفسه. |
| توزيع الدفعة | الواجهة تسجل دفعة لقسط واحد، لكن الحوالة الواحدة قد تسدد عدة أقساط أو جزءاً منها. | `payments` مستقل + `payment_allocations`، مع إبقاء إدخال القسط الواحد كتجربة مستخدم مبسطة. |
| التحصيل البنكي | لا توجد قائمة حسابات الشركة أو كشف بنك أو مطابقة للحوالة الواردة/الصادرة. | إضافة حسابات الشركة وحركات البنك والمطابقات قبل اعتماد المدفوعات البنكية في الإنتاج. |
| رسوم الإدارة | الواجهة تعرض نسبة/ثابت/مزيج/مخصص، بينما البيانات تخزن نسبة فقط. | قواعد رسوم مؤرخة داخل عقد الإدارة: percentage/fixed/hybrid/custom مع طريقة أساس احتساب صريحة. |
| اعتماد المصروف والصيانة | يوجد طلب اعتماد في العرض فقط؛ لا توجد سياسة حدّية مؤرخة أو مسار موافقات كامل. | سياسة موافقة في عقد الإدارة + `approval_requests` وقراراتها. |
| العملة والضريبة | الواجهة تفترض ريالاً سعودياً، وVAT اختياري بلا تعريف للمعاملة الضريبية. | `currency_code CHAR(3)` و`numeric(18,2)`، وحسم هل المبالغ شاملة الضريبة أم لا. |
| الإلغاء والتصحيح | الحذف والعكس والتعديل لا تملك سياسة موحدة. | لا حذف للسجلات المالية؛ قيد عكس/تعديل مصحح مع السبب والمستخدم والوقت. |

## 3. فجوات الواجهة التي يجب إغلاقها

### حرجة قبل الربط

1. صفحة `/leases/new` تعرض جدول أقساط وتفعل زر الحفظ، لكن الزر لا ينفذ حفظاً. نافذة إنشاء العقد السريعة تسلك مساراً مختلفاً؛ يجب توحيدهما على نفس طلب API.
2. صفحة `/maintenance/new` تتحقق من المدخلات فقط ثم تنفذ `handleSubmit(() => undefined)`؛ لا تنشئ طلب صيانة.
3. صفحة `/management-contracts/new` لا يوجد لها submit أو حفظ، ولا تحفظ العقارات/الوحدات والخدمات والاستثناءات التي تعرضها.
4. `/owner-settlements/new` يعني «إنشاء تسوية» عند النقر داخل التطبيق، لكنه يعرض «تحويل ضمن تسوية» إذا فُتح الرابط مباشرة أو أعيد تحميله. هذا تعارض مسار يجب فصله إلى `new` و`[id]/transfers/new`.
5. يمكن تعديل سجلات من صفحات التعديل بتغيير كائن الذاكرة مباشرة بلا حفظ مركزي أو تدقيق أو تحقق كامل. لا تصلح هذه الطريقة كأساس لـ API.

### منطق مالي وتشغيلي

1. عكس الدفعة يعيد حالة الاستحقاق إلى `upcoming` عند انعدام السداد حتى لو كان تاريخها قد مضى؛ يجب أن يحسب الخادم الحالة من `due_date` و`as_of_date`.
2. إنشاء الدفعة السريع يحول كل طريقة غير «تحويل بنكي» إلى نقد؛ لذا تضيع معلومة شيك/بطاقة/أخرى. يجب إرسال قيمة enum حقيقية ومرجع/إثبات عند الحاجة.
3. لا توجد مطابقة بنكية، ولا كشف إيداع أو إثبات إلزامي للحوالة، ولا فصل واضح بين تاريخ الاستلام وتاريخ القيد وتاريخ قيمة البنك.
4. التسوية تحسب من بيانات قابلة للتغير في المتصفح. في الخلفية يجب إنشاء لقطة تسوية ذرية تمنع استخدام الدفعة أو المصروف مرتين، مع قفل/معاملة قاعدة بيانات.
5. العقار والوحدة المختاران في النماذج لا يملكان دائماً قائمة مترابطة؛ يجب ألا يقبل الخادم وحدة لا تنتمي للعقار أو عقداً متداخلاً لنفس المساحة.
6. التذكير وخطاب المطالبة يعملان كمسودة وتنزيل محلي، لا كإشعار مرسل. يلزم سجل إرسال وقالب/نسخة مستند غير قابلة للتبديل لاحقاً.

### جودة وتشغيل

- المصادقة الحالية تجريبية؛ لا جلسة موظف أو صلاحيات مطبقة رغم وجود أنواع Role/Permission.
- البيانات في `localStorage` وMock arrays؛ لا تعدد مستخدمين ولا تنازع ولا استعادة موثوقة.
- التدقيق غير شامل، ويكتب اسم مستخدم ثابتاً.
- القوائم والبحث والترقيم كلها داخل المتصفح؛ يلزم فرز/ترشيح/صفحات خادمية.
- الحوار الموحد يحبس تمرير الصفحة ويعيد التركيز، لكنه لا يطبق حبس Tab كاملاً؛ هذه فجوة وصول يجب علاجها عند تثبيت مكتبة Dialog أو إضافة focus trap.

## 4. نموذج الجداول

كل جدول تشغيلي يتضمن: `id UUID`, `organization_id`, `created_at`, `created_by`, `updated_at`, `updated_by`. المال `numeric(18,2)` لا `float`، والتواريخ التجارية `date`، وأوقات الأحداث `timestamptz`. تستبدل أسماء الجداول/الأعمدة حسب ORM المختار.

### الهوية والنطاق

- `organizations`: اسم الشركة، المنطقة الزمنية (`Asia/Riyadh` أو قرار الشركة)، العملة الافتراضية.
- `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `sessions`.

### المحفظة والعقود

- `owners`: code، الاسم، الهوية، بيانات الاتصال، الحالة.
- `owner_bank_accounts`: owner_id، اسم البنك، IBAN، اسم صاحب الحساب، حالة/افتراضي. لا تخزن IBAN كنص ظاهر في سجل تدقيق.
- `properties`: owner_id، code، الاسم، النوع، حالة الإدارة، صك الملكية، العنوان والإحداثيات.
- `property_spaces`: property_id، code، الاسم، النوع (`unit|floor|whole_property|other`)، parent_space_id اختياري، المساحة، العدادات، الحالة. يمكن أن تمثل الوحدة أو الدور دون جداول متوازية.
- `tenants`: code، الاسم، هوية/إقامة، اتصال، حالة.
- `leases`: tenant_id، رقم داخلي/إيجار، start_date، end_date، status، العملة، القيمة، التأمين، دورية الدفع، الشروط. لا تضع property/unit كحقيقة أصلية مكررة؛ تستنتجها من المساحات.
- `lease_spaces`: lease_id، property_space_id، start_date، end_date. فهرس يمنع تداخل عقدين نشطين للمساحة نفسها في المدة نفسها.
- `lease_installments`: lease_id، sequence، due_date، original_amount، notes. يستبدل مصفوفة installments المضمنة.

### دفتر التحصيل والبنك

- `receivables`: lease_installment_id (أو سبب يدوي موثق)، tenant_id، due_date، original_amount، cancelled_at/reason. الرصيد والحالة يحسبان من التوزيعات أو يحفظان كـ projection محدث داخل معاملة.
- `payments`: payment_number، tenant_id، receipt_date، posting_date، method، gross_amount، currency، transaction_reference، status (`draft|confirmed|reversed`)، source (`manual|bank_import`).
- `payment_allocations`: payment_id، receivable_id، amount. فهرس فريد/قيود تمنع توزيعاً أعلى من الدفعة أو أعلى من المتبقي.
- `payment_reversals`: payment_id، reason، reversed_at/by، corrective_payment_id اختياري. لا تعدل الدفعة الأصلية صامتاً.
- `company_bank_accounts`: حساب الشركة المستلم/المرسل.
- `bank_transactions`: account_id، booked_date، value_date، amount، direction، external_reference، raw_import_id، status.
- `bank_matches`: bank_transaction_id، payment_id أو owner_transfer_id، matched_amount، method، matched_by/at.

### المصروفات والصيانة

- `vendors`: الاسم، هوية/ضريبة، اتصال وحساب بنكي اختياري.
- `expenses`: property_id، space_id اختياري، owner_id، vendor_id، date، category، net/vat/gross، invoice_number، chargeable_to_owner، status، approval_state.
- `maintenance_requests`: property_id، space_id، owner_id، العنوان، الوصف، الأولوية، estimated/actual_cost، status، requested/completed timestamps.
- `approval_requests`, `approval_decisions`: target_type/id، rule snapshot، approver، state، comment، decided_at.

### عقد الإدارة وتسوية المالك

- `management_contracts`: owner_id، number، start/end، status، terms، fee_method، percent_rate، fixed_amount، currency، approval_threshold.
- `management_contract_scopes`: contract_id، property_id أو property_space_id.
- `management_contract_services`, `management_contract_exclusions`: contract_id، code/label (أو FK لكاتالوغ اختياري).
- `owner_settlements`: number، owner_id، period_start/end، status (`draft|confirmed|voided`)، currency، snapshot totals، confirmed_at/by.
- `settlement_payment_items`: settlement_id، payment_id، included_amount، fee_amount. يمنع إعادة استخدام ذات الجزء في تسوية مؤكدة.
- `settlement_expense_items`: settlement_id، expense_id، included_amount.
- `settlement_adjustments`: settlement_id، amount، reason، type.
- `owner_transfers`: settlement_id، bank_account_id، transfer_date، amount، transaction_reference، status، proof attachment.

### المستندات والمتابعة والتدقيق

- `attachments`: storage_key، filename، mime_type، bytes، checksum، entity_type/id، uploaded_by. التخزين نفسه Object Storage وليس قاعدة البيانات.
- `document_templates`, `document_template_versions`: النوع واللغة وHTML/blocks وإصدار منشور.
- `generated_documents`: template_version_id، entity_type/id، rendered snapshot، storage_key، checksum، generated_by/at، status.
- `collection_settings`: organization_id، reminder_days، channels، escalation policy.
- `collection_follow_ups`: receivable_id، template_version_id، channel، scheduled_at، state، rendered_body، generated_document_id.
- `communication_logs`: follow_up_id، provider، recipient، state، provider_message_id، sent_at، failure reason.
- `notifications`: user_id، type، payload، read_at.
- `audit_logs`: actor_id، action، entity_type/id، before/after JSONB (مع إخفاء الحقول الحساسة)، request_id، timestamp.

## 5. العلاقات والقيود الجوهرية

```text
Owner ─< Property ─< PropertySpace >─ LeaseSpace ─> Lease ─< LeaseInstallment ─< Receivable
Tenant ────────────────────────────────────────────────────────────────┘
Payment ─< PaymentAllocation >─ Receivable
ManagementContract ─< Scope/Service/Exclusion
OwnerSettlement ─< SettlementPaymentItem >─ Payment
OwnerSettlement ─< SettlementExpenseItem >─ Expense
OwnerSettlement ─< OwnerTransfer ─> CompanyBankAccount
BankTransaction ─< BankMatch >─ Payment | OwnerTransfer
Receivable ─< CollectionFollowUp ─< CommunicationLog
```

قيود لا تتنازل عنها الخلفية:

1. كل معرف خارجي يخص نفس `organization_id`.
2. لا تعاقد متداخل على المساحة المؤجرة، إلا إذا كانت حالة العقد لا تحجزها.
3. مجموع `payment_allocations` المؤكدة لا يتجاوز مبلغ الدفعة؛ ومجموع التوزيعات على الاستحقاق لا يتجاوز رصيده.
4. لا تسوية مؤكدة تحتوي دفعة معكوسة أو جزء دفعة مستخدماً في تسوية مؤكدة أخرى.
5. لا تحويل مالك أكبر من الرصيد المتبقي للتسوية، ويجري الفحص والتحديث في معاملة واحدة.
6. لا مطالبة أو إرسال إلى استحقاق ملغى أو مسدد بالكامل.
7. تعتمد صلاحية كل عملية على دور الموظف في الخادم، لا على إخفاء زر في الواجهة.

## 6. عقد API المقترح

الاستجابة الموحدة: `{ data, meta?, errors? }`. القوائم تدعم `cursor`, `limit`, `search`, `sort`, `status`, `propertyId`, `ownerId`, `from`, `to`, وتعيد ملخصاً يكفي الجدول من دون N+1 calls.

### موارد أساسية

- `GET/POST/PATCH /owners`, و`/owners/:id/bank-accounts`
- `GET/POST/PATCH /properties`, و`/properties/:id/spaces`
- `GET/POST/PATCH /tenants`
- `GET/POST/PATCH /leases`; `POST /leases/:id/activate`, `terminate`, `renew`; يعيد الأقساط المتولدة للمراجعة قبل الاعتماد.
- `GET /receivables` مع `asOfDate`; `POST /receivables/:id/demand-letter/draft`.
- `POST /payments` مع `allocations[]`; `POST /payments/:id/confirm`; `POST /payments/:id/reverse`.
- `GET/POST/PATCH /expenses`; `POST /expenses/:id/submit-approval`.
- `GET/POST/PATCH /maintenance-requests`; `POST /:id/approval-requests` و`complete`.
- `GET/POST/PATCH /management-contracts`; موارد scopes/services/exclusions أو payload ذري لها.
- `POST /owner-settlements/preview`; `POST /owner-settlements`; `POST /owner-settlements/:id/confirm`; `POST /owner-settlements/:id/transfers`.
- `POST /bank-imports`; `GET /bank-transactions`; `POST /bank-matches`.
- `POST /attachments/presign` ثم `POST /attachments/complete`.
- `GET/PUT /collection-settings`; `GET/POST /collection-follow-ups`; `POST /:id/send`; `GET /:id/document?format=pdf|docx`.
- `GET /reports/{owner-statement|tenant-statement|overdue|upcoming|collections|expenses|occupancy|management-portfolio}` مع معاملات التقرير الصريحة؛ التصدير وظيفة خادم قابلة لإعادة الطلب.

## 7. ترتيب التنفيذ

1. **تثبيت عقد الواجهة:** حسم قرارات القسم 2، وإصلاح صفحات الحفظ الحرجة أو توجيهها صراحة إلى النوافذ الموحدة.
2. **الهوية والبيانات المرجعية:** organization/users/RBAC، ملاك وعقارات ومساحات ومستأجرون ومرفقات.
3. **الإيجار والتحصيل:** العقود والأقساط والاستحقاقات والدفعات والتوزيع والعكس؛ اختبارات معاملات مالية إلزامية.
4. **المصروفات والتسويات والبنك:** اعتماد المصروفات، إنشاء التسوية كـ preview ثم confirm، التحويل والمطابقة البنكية.
5. **الصيانة والتنبيهات والمستندات:** سير الاعتماد، قوالب بإصدارات، خطابات محفوظة وسجل الإرسال.
6. **التقارير والتصدير:** views/read models مفهرسة، PDF/XLSX/DOCX من الخادم، فلاتر مطابقة للواجهة.
7. **الترحيل والتشغيل:** استبدال Mock repositories تدريجياً، seed مستقل، logs/monitoring/backups، واختبارات E2E للمسارات التالية.

## 8. اختبارات قبول قبل الإنتاج

1. عقد مساحة/دور/عقار كامل لا يسمح بتداخل نشط غير مقصود.
2. دفعة جزئية وكاملة ومتعددة التوزيع، ثم عكسها؛ تتغير الأرصدة وحالة التأخير بشكل صحيح بحسب `asOfDate`.
3. استيراد حوالة بنكية ومطابقتها، مع منع مطابقة مبلغ فوق الحركة البنكية.
4. إنشاء تسوية من نفس الدفعات في طلبين متزامنين؛ طلب واحد فقط ينجح.
5. تحويل جزئي للمالك ثم تحميل إثبات ثم مطابقة حركة البنك الصادرة.
6. مصروف يحتاج موافقة ثم يُرفض/يعتمد؛ لا يدخل التسوية قبل الاعتماد وفق السياسة.
7. مطالبة متأخرة تُحرر وتُحفظ وتُرسل؛ يصبح سجل الاتصال والمستند قابلين للتدقيق، ويمنع الإرسال بعد السداد.
8. كشف حساب المالك/المستأجر وتقرير المتأخرين يعطيان الأرقام نفسها لليوم والفلاتر نفسيهما.

