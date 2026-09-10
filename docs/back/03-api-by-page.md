# عقد API لكل صفحة

## قاعدة عامة

كل قائمة تستعمل `GET` مع `cursor,limit,search,sort,direction,status` ومرشحات المجال. كل صفحة تفاصيل تستعمل `GET /resource/:id` يعيد الـview model كاملاً، لا طلباً لكل بطاقة. كل تعديل `PATCH` يرسل `If-Match`/`version` لمنع الكتابة فوق تعديل موظف آخر.

| مسار الواجهة | القراءة | الإجراء/الكتابة | بيانات الصفحة المطلوبة |
|---|---|---|---|
| `/login` | — | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | session, user, permissions |
| `/dashboard` | `GET /dashboard?asOfDate&reminderDays` | `PUT /collection-settings` | KPIs، متأخر/قريب، follow-ups |
| `/owners` | `GET /owners` | `POST /owners` | owner list + property/arrears counts |
| `/owners/new`, `/owners/:id/edit` | `GET /owners/:id` عند التعديل | `POST/PATCH /owners`, `/owners/:id/bank-accounts` | بيانات الهوية والتواصل والحسابات |
| `/owners/:id` | `GET /owners/:id/portfolio` | روابط موارد فقط | عقارات، مستأجرون، عقود، تسويات، أرصدة |
| `/properties` | `GET /properties?ownerId` | `POST /properties` | owner + counts |
| `/properties/new`, `/properties/:id/edit` | `GET /owners`; `GET /properties/:id` | `POST/PATCH /properties` | عنوان، صك، موقع، حالة إدارة |
| `/properties/:id` | `GET /properties/:id/portfolio` | — | spaces, leases, receivables, expenses, maintenance |
| `/units` | `GET /property-spaces?type=unit` | `POST /properties/:id/spaces` | وحدة/دور مع حالة وتأجير |
| `/units/new`, `/units/:id/edit` | `GET /properties`; `GET /property-spaces/:id` | `POST/PATCH /property-spaces/:id` | propertyId, type, floor, meters, rent |
| `/tenants` | `GET /tenants` | `POST /tenants` | tenant list + balance |
| `/tenants/new`, `/tenants/:id/edit` | `GET /tenants/:id` | `POST/PATCH /tenants` | هوية واتصال وطوارئ |
| `/tenants/:id` | `GET /tenants/:id/statement` | — | عقود، استحقاقات، دفعات، رصيد |
| `/management-contracts` | `GET /management-contracts` | `POST /management-contracts` | owner, duration, fee, status |
| `/management-contracts/new`, `/management-contracts/:id/edit` | owners/properties/spaces + contract | `POST/PATCH /management-contracts` payload ذري للنطاق والخدمات والاستثناءات | fee method/rates/threshold/terms |
| `/management-contracts/:id` | `GET /management-contracts/:id` | `POST /:id/activate`, `renew`, `terminate` | scope + fee policies + approvals |
| `/leases` | `GET /leases?tenantId&propertyId&status` | `POST /leases` | tenant/property/space/status/value |
| `/leases/new`, `/leases/:id/edit` | tenants/properties/spaces + lease | `POST/PATCH /leases`; `POST /leases/:id/preview-installments`; `activate` | `spaces[]`, installment schedule, deposit |
| `/leases/:id` | `GET /leases/:id` | terminate/renew | installments, receivables, payments |
| `/receivables` | `GET /receivables?asOfDate&status&propertyId` | `POST /receivables/:id/demand-letter/draft` | tenant/property/space/lease, due status, balance |
| `/payments` | `GET /payments?status&method&from&to` | `POST /payments/:id/reverse` | allocations, bank match state |
| `/payments/new` | `GET /receivables?open=true` | `POST /payments` | allocation picker؛ validates total client-side then server-side |
| `/bank-reconciliation` | `GET /bank-transactions?status`; `GET /payments?unmatched=true` | `POST /bank-imports`; `POST /bank-matches`; `DELETE /bank-matches/:id` when permitted | bank movement, remaining matchable amount |
| `/expenses` | `GET /expenses?propertyId&approvalStatus` | `POST /expenses` | invoice, vendor, owner-chargeable, approval |
| `/expenses/new`, `/expenses/:id/edit` | properties/spaces/vendors + expense | `POST/PATCH /expenses`; `submit-approval` | net/vat/gross and attachment IDs |
| `/maintenance` | `GET /maintenance-requests` | `POST /maintenance-requests` | property/space/cost/approval |
| `/maintenance/new`, `/maintenance/:id` | properties/spaces + request | create, approval, assign vendor, complete | attachments and approval history |
| `/owner-settlements` | `GET /owner-settlements` | — | owner, period, status, remaining balance |
| `/owner-settlements/new` | `POST /owner-settlements/preview` | `POST /owner-settlements`, `POST /:id/confirm` | eligible payments/expenses, fee snapshot |
| `/owner-settlements/:id` | `GET /owner-settlements/:id` | void if permitted | itemized payment/expense/transfer lines |
| `/owner-settlements/:id/transfers/new` | `GET /owner-settlements/:id` + bank accounts | `POST /owner-settlements/:id/transfers` | remaining balance, selected owner account, proof |
| `/documents` | `GET /document-templates`; `GET /generated-documents` | templates CRUD, generate, send | template version, variables, audit status |
| `/reminders` | `GET /reminders`; `GET /collection-follow-ups` | `POST/PATCH /reminders`; follow-up schedule/send/cancel | recipients, schedule, outcome |
| `/notifications` | `GET /notifications` | `POST /notifications/:id/read`, `/read-all` | unread count and deep link |
| `/settings` | `GET /settings` | `PUT /settings`, RBAC endpoints | company, collection, document, users/roles |
| `/reports` و`/reports/*` | `GET /reports/:key` | `POST /reports/:key/export` | filters mandatory by report (ownerId/tenantId/propertyId/date range) |
| `/reports/management-portfolio` | `GET /reports/management-portfolio` | `POST /reports/management-portfolio/export` | company summary + page per owner |

## إجراءات حساسة

- `POST /payments`: `{ tenantId, receiptDate, paymentMethod, amount, allocations:[{receivableId,amount}], transactionReference?, attachmentIds? }`.
- `POST /owner-settlements/preview`: `{ ownerId, propertyIds?, from, to, paymentIds, expenseIds, feeRuleOverride? }`; لا يحفظ.
- `POST /owner-settlements`: نفس payload + `Idempotency-Key`; يعود `409` عند استعمال بند سبق تأكيده.
- `POST /bank-matches`: `{ bankTransactionId, paymentId?|ownerTransferId?, amount }`; مجموع المطابقات يتحقق داخل معاملة.
- `POST /receivables/:id/demand-letter/draft`: `{ templateKey, locale, renderedBody? }`؛ يرجع follow-up وgenerated-document.
