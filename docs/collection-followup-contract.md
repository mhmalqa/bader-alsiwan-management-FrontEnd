# عقد متابعة التحصيل والخطابات

## ما تعرضه لوحة التحكم

- الأقساط المتأخرة: `remainingAmount > 0` و`dueDate < asOfDate`.
- الأقساط القريبة: `remainingAmount > 0` و`dueDate` بين `asOfDate` و`asOfDate + reminderDays`.
- `reminderDays` إعداد واجهة قابل للحفظ لاحقاً على مستوى الشركة أو المستخدم؛ القيمة الافتراضية الحالية 10 أيام.

كل سجل في قائمة المتابعة يجب أن يعيد: الاستحقاق، المستأجر ووسيلة الاتصال، العقد، العقار، الوحدة، تاريخ الاستحقاق، الأيام المتبقية/أيام التأخير، والمبلغ المتبقي.

## واجهات API المطلوبة لاحقاً

| العملية | المسار المقترح | المعايير/المدخلات |
|---|---|---|
| لوحة المتابعة | `GET /collection-follow-ups` | `asOfDate`, `reminderDays`, `propertyId?`, `ownerId?`, `status=overdue|upcoming` |
| إعدادات التنبيه | `GET/PUT /collection-settings` | `reminderDays`, القنوات، قواعد التصعيد |
| مسودة خطاب | `POST /receivables/:id/demand-letter/draft` | القالب، نص محرر اختياري، اللغة |
| تنزيل الخطاب | `GET /collection-follow-ups/:id/document` | `format=docx|pdf` |
| جدولة/إرسال الخطاب | `POST /collection-follow-ups` | `receivableId`, `channel`, `scheduledAt`, `renderedBody` |

## قواعد عمل

1. الخطاب يظل `draft` حتى يضغط الموظف إرسال أو جدولة؛ «توليد خطاب» لا يرسل شيئاً تلقائياً.
2. النص المحرر يحفظ كنسخة (`renderedBody`) مرتبطة بالاستحقاق ولا يغير قالب الشركة الأصلي.
3. لا يجوز إرسال مطالبة لاستحقاق مدفوع أو ملغى؛ يعيد الـ API خطأ تعارض ويحدث القائمة فوراً.
4. كل إرسال ينشئ `CommunicationLog` ويرتبط بـ `CollectionFollowUp` لضمان التتبع والتدقيق.
5. عند وجود أكثر من استحقاق لنفس المستأجر، تكون سياسة التجميع قراراً صريحاً في الـ API (`single_receivable` أو `tenant_statement`) ولا تدمج الواجهة مبالغاً من تلقاء نفسها.
