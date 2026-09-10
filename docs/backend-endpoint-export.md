# تصدير عقد نقاط النهاية

هذا هو العقد المختصر الذي يسلمه فريق الواجهة إلى فريق الخلفية. جميع المبالغ `decimal(18,2)` وجميع المسارات تتطلب جلسة موظف وصلاحية مناسبة.

## قواعد موحدة

- الاستجابة: `{ "data": ..., "meta": { "requestId": "..." } }`.
- خطأ التحقق: `422` مع `{ "errors": [{ "field": "...", "code": "...", "message": "..." }] }`.
- التعارض المالي: `409`؛ لا تحاول الواجهة إعادة حساب أو تجاوز القرار.
- القوائم: `cursor`, `limit`, `search`, `sort`, `direction`, مع المرشحات المذكورة أدناه.
- طلبات الإنشاء المالية الحساسة ترسل `Idempotency-Key`.

## المسارات

| المجال | المسار | العملية |
|---|---|---|
| الملاك | `GET/POST/PATCH /owners` | إدارة المالك والحالة |
| حساب المالك | `GET/POST/PATCH /owners/:id/bank-accounts` | حسابات IBAN الفعالة |
| العقارات والمساحات | `GET/POST/PATCH /properties`, `GET/POST/PATCH /properties/:id/spaces` | مساحة من نوع `unit`, `floor`, `whole_property` |
| المستأجرون | `GET/POST/PATCH /tenants` | بيانات الطرف المستأجر |
| عقود الإيجار | `GET/POST/PATCH /leases`, `POST /leases/:id/activate` | `spaces[]` و`installments[]` في نفس المعاملة |
| الاستحقاقات | `GET /receivables?asOfDate=` | الحالة محسوبة خادمياً |
| الدفعات | `POST /payments` | `allocations[]` لتوزيع دفعة على عدة استحقاقات |
| عكس الدفعة | `POST /payments/:id/reverse` | `reason` إلزامي؛ يمنع إن دخلت التسوية |
| البنك | `POST /bank-imports`, `GET /bank-transactions`, `POST /bank-matches` | مطابقة وارد/صادر بمبالغ جزئية |
| المصروفات | `GET/POST/PATCH /expenses` | اعتماد ومسؤولية المالك |
| الصيانة | `GET/POST/PATCH /maintenance-requests`, `POST /maintenance-requests/:id/approval-requests` | اعتماد وتوثيق التنفيذ |
| عقود الإدارة | `GET/POST/PATCH /management-contracts` | scope/services/exclusions ورسوم مؤرخة |
| التسويات | `POST /owner-settlements/preview`, `POST /owner-settlements`, `POST /owner-settlements/:id/confirm` | لقطة ذرية لا تكرر دفعة أو مصروفاً |
| تحويل المالك | `POST /owner-settlements/:id/transfers` | مرجع وإثبات ثم مطابقة بنك |
| المرفقات | `POST /attachments/presign`, `POST /attachments/complete` | رفع تخزين كائني بعد إنشاء السجل |
| الخطابات | `POST /receivables/:id/demand-letter/draft`, `POST /collection-follow-ups/:id/send`, `GET /collection-follow-ups/:id/document?format=pdf|docx` | نسخة القالب والنص المحرر محفوظان |
| التقارير | `GET /reports/:reportKey` | مفاتيح: owner-statement, tenant-statement, overdue, upcoming, collections, expenses, occupancy, management-portfolio |

## مثال: إنشاء دفعة موزعة

```json
{
  "tenantId": "...",
  "receiptDate": "2026-09-11",
  "paymentMethod": "bank_transfer",
  "transactionReference": "BANK-123",
  "amount": 45000,
  "allocations": [
    { "receivableId": "REC-101", "amount": 30000 },
    { "receivableId": "REC-102", "amount": 15000 }
  ]
}
```

الخادم يعيد الدفعة وتوزيعاتها وحالة كل استحقاق بعد المعاملة؛ لا تعتمد الواجهة على تحديث محلي متفائل في هذه العملية.
