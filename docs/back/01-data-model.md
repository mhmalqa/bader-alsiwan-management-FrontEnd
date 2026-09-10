# نموذج البيانات والعلاقات

## الهوية والنطاق

| جدول | حقول الأعمال الإلزامية | ملاحظات |
|---|---|---|
| organizations | name, timezone, default_currency | الجذر لكل البيانات. |
| users | full_name, email, password_hash, status | موظفو الشركة فقط. |
| roles / permissions / user_roles | name, key | صلاحية الخادم، لا الواجهة. |
| audit_logs | actor_id, action, entity_type, entity_id, before_json, after_json, request_id | يسجل جميع التغييرات الحساسة. |

## المحفظة

| جدول | الحقول | العلاقات والقيود |
|---|---|---|
| owners | code, full_name, national_id_or_iqama, mobile, email, city, status | `code` وID الوطني فريدان ضمن المؤسسة. |
| owner_bank_accounts | owner_id, bank_name, iban, account_holder_name, is_default, status | IBAN فريد، واحد افتراضي لكل مالك. |
| properties | owner_id, code, name, type, deed_number, city, district, address, geo, status | owner موجود ونشط. |
| property_spaces | property_id, parent_space_id, code, name, type, floor, area, meters, status | type: `unit|floor|whole_property`; شجرة مساحة واحدة للعقار. |
| tenants | code, full_name, national_id_or_iqama, mobile, email, employer, status | هوية/كود فريدان ضمن المؤسسة. |

## العقود والتحصيل

| جدول | الحقول | العلاقات والقيود |
|---|---|---|
| leases | internal_number, ejar_number, tenant_id, start_date, end_date, currency, annual_rent, total_value, frequency, status, deposit | `end_date > start_date`، رقم العقد فريد. |
| lease_spaces | lease_id, property_space_id, start_date, end_date | يمنع تداخل عقدين نشطين على المساحة ذاتها في المدة ذاتها. |
| lease_installments | lease_id, sequence, due_date, original_amount, notes | sequence فريد داخل العقد؛ المجموع يساوي قيمة العقد عند الاعتماد. |
| receivables | lease_installment_id, tenant_id, due_date, original_amount, cancelled_at, cancellation_reason | الرصيد والحالة projection خادميان من التوزيعات و`asOfDate`. |
| payments | number, tenant_id, receipt_date, posting_date, method, amount, reference, status, source | method: bank/cash/cheque/card/other؛ لا حذف. |
| payment_allocations | payment_id, receivable_id, amount | مجموعها لا يتجاوز payment.amount أو رصيد الاستحقاق. |
| payment_reversals | payment_id, reason, reversed_at, reversed_by | يمنع العكس إن دخلت الدفعة في تسوية مؤكدة. |

## البنك والتشغيل

| جدول | الحقول | قواعد |
|---|---|---|
| company_bank_accounts | bank_name, account_name, iban, status | حساب الشركة المستلم/المرسل. |
| bank_imports | account_id, filename, hash, imported_by, imported_at | يمنع استيراد الملف نفسه مرتين. |
| bank_transactions | account_id, import_id, booked_date, value_date, amount, direction, external_reference, status | direction inbound/outbound، status unmatched/partial/matched. |
| bank_matches | bank_transaction_id, payment_id?, owner_transfer_id?, amount, matched_by, matched_at | مجموع المطابقات لا يتجاوز مبلغ الحركة. |
| vendors | name, tax_number, mobile, iban | مورد المصروف/الصيانة. |
| expenses | property_id, space_id?, owner_id?, vendor_id?, category, net_amount, vat_amount, gross_amount, expense_date, invoice_number, chargeable_to_owner, approval_status, status | لا يدخل التسوية إلا إذا كان مؤهلاً ومعتمداً. |
| maintenance_requests | property_id, space_id, owner_id, title, description, priority, estimated_cost, actual_cost, approval_status, status | يحفظ أثر قرار المالك. |
| approval_requests / approval_decisions | target_type, target_id, rule_snapshot, status, approver_id, notes | يدعم المصروف والصيانة. |

## الإدارة والتسويات والمستندات

| جدول | الحقول | قواعد |
|---|---|---|
| management_contracts | owner_id, number, start/end, fee_method, percent_rate, fixed_amount, approval_threshold, status | رسوم مؤرخة داخل العقد. |
| management_contract_scopes | contract_id, property_id?, property_space_id? | نطاق العقارات/المساحات. |
| management_contract_services / exclusions | contract_id, code, label | يطابق اختيارات الواجهة. |
| owner_settlements | number, owner_id, period_start/end, status, totals snapshot, confirmed_at/by | preview ثم confirm ذري. |
| settlement_payment_items | settlement_id, payment_id, included_amount, fee_amount | يمنع إعادة استخدام الجزء نفسه. |
| settlement_expense_items / adjustments | settlement_id, expense_id?, amount, reason | لقطة منطقية غير قابلة للتلاعب. |
| owner_transfers | settlement_id, bank_account_id, date, amount, reference, status | لا يتجاوز الرصيد المتبقي. |
| attachments | entity_type, entity_id, storage_key, filename, mime, bytes, checksum | الملف في Object Storage، الوصف في DB. |
| document_templates / versions | key, locale, body, version, published_at | الخطاب يشير إلى نسخة القالب لا إلى القالب المتغير. |
| generated_documents | template_version_id, entity_type/id, rendered_body, storage_key, status | محفوظ للتدقيق والتصدير. |
| collection_settings | reminder_days, channels, escalation_policy | إعداد المؤسسة. |
| collection_follow_ups | receivable_id, document_id, channel, scheduled_at, status, rendered_body | draft/queued/sent/failed/cancelled. |
| communication_logs | follow_up_id, provider, recipient, provider_message_id, status, sent_at, failure_reason | سجل الإرسال الحقيقي. |
| notifications | user_id, type, payload, read_at | إشعار الموظف داخل النظام. |

## العلاقة المالية

`Owner → Property → PropertySpace ← LeaseSpace → Lease → Installment → Receivable ← PaymentAllocation ← Payment`

`Payment + owner-chargeable Expense → OwnerSettlement → OwnerTransfer → BankMatch ← BankTransaction`

لا تحفظ الواجهة الناتج المالي النهائي؛ يعيده الخادم بعد كل عملية.
