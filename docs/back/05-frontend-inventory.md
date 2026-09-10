# جرد الواجهات والحقول — مصدر بناء الباك

هذا الجرد يعكس ما يجب أن يخدمه الباك، حتى لو كان بعض الحقول حالياً داخل Mock أو نموذج سريع.

## 1. البيانات المرجعية

### المالك

الحقول: `ownerCode, fullName, nationalIdOrIqama, nationality, mobilePrimary, mobileAlternative?, email?, city, district?, address?, status`.

الحساب البنكي: `bankName, accountHolderName, iban, accountNumber?, swiftCode?, bankNotes?`.

الشاشات: قائمة، إضافة، تعديل، ملف مالك. ملف المالك يعرض محفظة العقارات والوحدات، العقود، المستأجرين، المحصلات، المتبقي، التسويات والتحويلات.

### العقار والمساحة

العقار: `propertyCode, propertyName, ownerId, propertyType, city, district, deedNumber?, description?, managementStatus, location{country,city,district,street,buildingNumber,postalCode,additionalAddress,latitude,longitude,mapUrl}`.

المساحة: `unitCode, propertyId, unitNameOrNumber, unitType, floor?, area, expectedAnnualRent, bedrooms?, bathrooms?, electricityMeterNumber?, waterMeterNumber?, notes?, status`.

الواجهة تسميها وحدة/شقة/دور؛ الباك يمثلها دائماً `property_spaces` بالنوع `unit|floor|whole_property`.

### المستأجر

`tenantCode, fullName, nationalIdOrIqama, nationality, mobilePrimary, mobileAlternative?, email?, employer?, occupation?, address?, city?, emergencyContactName?, emergencyContactMobile?, status`.

## 2. العقود والتحصيل

### عقد الإيجار

`internalContractNumber, ejarContractNumber?, tenantId, propertyId, spaces[] {spaceId, type, label}, startDate, endDate, annualRent, totalContractValue, currency, paymentFrequency, securityDeposit?, noticePeriodDays?, renewalTerms?, notes?, status`.

الأقساط: `sequence, dueDate, amount, notes?`. الواجهة تدعم توليداً سنوياً/نصف سنوي/ربع سنوي/شهري/دفعة واحدة أو مخصصاً؛ API preview يعيد الأقساط قبل activate.

### الاستحقاق

العرض الإلزامي في أي قائمة أو اختيار دفع: `id, installmentNumber, dueDate, originalAmount, paidAmount, remainingAmount, computedStatus, tenant{name,mobile}, property{name}, space{name}, lease{number}`.

الحالات المحسوبة: `upcoming, due_soon, due_today, partially_paid, paid, overdue, cancelled`.

### الدفعة

`tenantId, receiptDate, postingDate?, paymentMethod, amount, currency, transactionReference?, chequeNumber?, chequeBank?, chequeDate?, attachmentIds?`.

التوزيعات: `allocations[]: {receivableId, amount}`. لا يعتمد الباك على `receivableId` واحد. تعرض الواجهة سياق المستأجر والعقار والمساحة والعقد لكل استحقاق مختار.

عكس الدفعة: `reason` خمس محارف أو أكثر، ولا يسمح إذا دخلت الدفعة أو جزء منها تسوية مؤكدة.

### المطابقة البنكية

حساب الشركة: `bankName, accountName, iban, status`.

الحركة: `bankAccountId, bookedDate, valueDate?, amount, direction, externalReference, description?, status`.

المطابقة: حركة واحدة ↔ دفعة أو تحويل مالك، بالمبلغ `amount` وقد تكون جزئية. تعرض الصفحة: القيمة الأصلية، المطابق سابقاً، والمتبقي.

## 3. المصروفات والصيانة

### المصروف

`propertyId, spaceId?, ownerId?, vendorId?/vendorName?, description, category, expenseDate, netAmount, vatAmount, grossAmount, invoiceNumber?, invoiceStatus, chargeableToOwner, approvalStatus, attachmentIds[]`.

حالة الاعتماد: `not_required, pending, approved, rejected`. لا تظهر ضمن بنود التسوية إلا حسب السياسة وحالة الاعتماد.

### طلب الصيانة

`propertyId, spaceId, ownerId?, title, description, priority, estimatedCost, actualCost?, vendorId?/vendorName?, requiresOwnerApproval, approvalStatus, status, completionNotes?, attachmentIds[]`.

## 4. عقد الإدارة والتسويات

### عقد الإدارة

`contractNumber, ownerId, startDate, endDate, status, managedPropertyIds[], managedSpaceIds[], managementFeeMethod, managementFeePercentage?, fixedFeeAmount?, paymentTerms?, terminationTerms?, approvalThreshold?, serviceScope[], exclusions[], notes?, attachmentIds[]`.

طرق الرسم: `percentage_of_collections, fixed, hybrid, custom`. لا تفترض الواجهة أن النسبة فقط موجودة.

### التسوية والتحويل

التسوية: `ownerId, fromDate, toDate, propertyIds?, paymentIds[], expenseIds[], managementFeeRule, adjustments[{amount,reason,type}], status`.

عرض preview/confirmed: `grossCollections, managementFees, ownerChargeableExpenses, adjustments, netDueToOwner, transferAmount, remainingBalance, items[]`.

التحويل: `settlementId, ownerBankAccountId, amount, transferDate, transactionReference, attachmentIds[]`. يسمح بالتحويل الجزئي فقط ضمن `remainingBalance`.

## 5. المستندات والمتابعة والتقارير

### المرفقات والمستندات

المرفق: `entityType, entityId, filename, mimeType, bytes, checksum, storageKey`.

القالب: `key, name, category, locale, bodyHtml/blocks, active`؛ لكل تعديل إصدار. المستند المولد يحفظ النص النهائي ونسخة القالب.

### خطابات المطالبة والتذكير

خطاب المطالبة يأخذ الاستحقاق ويعرض: المستأجر، هاتفه، العقار، المساحة، رقم العقد، رقم القسط، تاريخ الاستحقاق، المتبقي، تاريخ الخطاب والنص القابل للتحرير.

Follow-up: `receivableId, templateKey, channel(email|sms|whatsapp|manual), scheduledAt, renderedBody, status, documentId`. الإرسال ينشئ `communication_log` ويحفظ نتيجة المزود.

### التقارير وفلاترها

| التقرير | الفلاتر الإلزامية | الناتج |
|---|---|---|
| كشف حساب مالك | `ownerId`, from/to اختياريان | تحصيلات، رسوم، مصروفات، تحويلات، رصيد |
| كشف حساب مستأجر | `tenantId`, from/to اختياريان | العقود، الأقساط، الدفعات، المتبقي |
| العقار | `propertyId` | إشغال، عقود، تحصيل، مصروف |
| المتأخرون | `asOfDate`, propertyId? | استحقاق + أيام تأخير + بيانات تواصل + زر خطاب |
| الاستحقاقات القادمة | `asOfDate`, reminderDays, propertyId? | من يلزم تذكيره |
| التحصيلات/المصروفات/الإشغال | date range وpropertyId? | مجموعات وقوائم قابلة للتصدير |
| ملف إدارة الأملاك | date range اختياري | ملخص شركة ثم صفحة تفصيل لكل مالك |

## 6. حالات الواجهة الإلزامية لكل مورد

`loading`, `empty`, `error`, `forbidden`, `conflict`, `success`. عند `409` لا تغلق النافذة ولا تعرض نجاحاً؛ تعيد تحميل المورد وتعرض سبب التعارض. عند الحفظ الناجح تعرض الرقم المرجعي الذي يرجعه الخادم، ثم تغلق الحوار فقط إذا قرر المستخدم/سلوك الواجهة ذلك.
