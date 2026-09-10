# عقود الطلب والاستجابة

## Envelope والأخطاء

```json
{ "data": {}, "meta": { "requestId": "uuid", "version": 1 } }
```

```json
{ "errors": [{ "field": "allocations[1].amount", "code": "exceeds_remaining", "message": "المبلغ أكبر من الرصيد المتبقي." }] }
```

## إنشاء عقد إيجار

`POST /leases`

```json
{
  "internalContractNumber": "L-2026-001",
  "ejarContractNumber": "EJ-2026-8801",
  "tenantId": "uuid",
  "startDate": "2026-01-01",
  "endDate": "2026-12-31",
  "annualRent": 120000,
  "currency": "SAR",
  "paymentFrequency": "quarterly",
  "securityDeposit": 5000,
  "spaces": [{ "spaceId": "uuid", "type": "unit" }],
  "installments": [{ "sequence": 1, "dueDate": "2026-01-01", "amount": 30000 }],
  "attachmentIds": []
}
```

الخادم يتحقق من تداخل المساحات، المالك/المستأجر/المؤسسة، ومجموع الأقساط. مسار `preview-installments` لا يحفظ.

## إنشاء دفعة

`POST /payments` مع Header: `Idempotency-Key`.

```json
{
  "tenantId": "uuid",
  "receiptDate": "2026-09-11",
  "postingDate": "2026-09-11",
  "paymentMethod": "bank_transfer",
  "amount": 45000,
  "currency": "SAR",
  "transactionReference": "BANK-123",
  "allocations": [
    { "receivableId": "uuid-1", "amount": 30000 },
    { "receivableId": "uuid-2", "amount": 15000 }
  ],
  "attachmentIds": []
}
```

الاستجابة تعيد الدفعة والتوزيعات وكل الاستحقاقات المتأثرة بأرصدة وحالات محسوبة.

## Preview ثم تأكيد التسوية

`POST /owner-settlements/preview`

```json
{ "ownerId": "uuid", "fromDate": "2026-01-01", "toDate": "2026-01-31", "propertyIds": ["uuid"], "paymentIds": ["uuid"], "expenseIds": ["uuid"], "adjustments": [{ "amount": -100, "reason": "تصحيح", "type": "manual" }] }
```

`POST /owner-settlements` يعيد التسوية `draft`. ثم `POST /owner-settlements/:id/confirm` داخل transaction مع قفل بنود الدفعات والمصروفات؛ التعارض `409`.

## التحويل والمطابقة

```json
POST /owner-settlements/:id/transfers
{ "ownerBankAccountId": "uuid", "amount": 20000, "transferDate": "2026-01-20", "transactionReference": "TRX-1001", "attachmentIds": ["uuid"] }
```

```json
POST /bank-matches
{ "bankTransactionId": "uuid", "paymentId": "uuid", "amount": 15000 }
```

لا يقبل `bank-matches` كلاً من `paymentId` و`ownerTransferId` معاً. التراجع عن المطابقة يتطلب permission وسجل تدقيق.

## المرفقات

1. `POST /attachments/presign` → `{filename,mimeType,bytes,entityType}`.
2. العميل يرفع مباشرة إلى Object Storage.
3. `POST /attachments/complete` → `{storageKey,checksum,entityType,entityId}`.

لا يقبل `complete` سجلاً غير موجود أو ملفاً يخص مؤسسة أخرى.

## الخطاب والإرسال

```json
POST /receivables/:id/demand-letter/draft
{ "templateKey": "payment_demand", "locale": "ar", "renderedBody": "..." }
```

```json
POST /collection-follow-ups/:id/send
{ "channel": "whatsapp", "recipient": "0500000000" }
```

لا يرسل الخادم إلى استحقاق مدفوع أو ملغى؛ ينشئ document وcommunication log ويحفظ `providerMessageId` أو `failureReason`.

## التقارير والتصدير

`GET /reports/owner-statement?ownerId=:id&from=YYYY-MM-DD&to=YYYY-MM-DD&asOfDate=YYYY-MM-DD`

`POST /reports/management-portfolio/export` body: `{ "format":"xlsx|pdf", "from":"...", "to":"..." }`.

التصدير مهمة خادمية؛ يعيد `jobId` ثم `GET /exports/:jobId` حتى `completed` مع رابط تنزيل مؤقت.
